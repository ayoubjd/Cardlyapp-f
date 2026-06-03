const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface DeckData {
  name?: string;
  description?: string;
  targetDeck?: string;
  cards: { front: string; back: string }[];
}

export const GEMINI_MODELS = {
  TEXT: [
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  ],
  AUDIO: [],
};

export function getAllModels() {
  const seen = new Set<string>();
  const all: { id: string; name: string }[] = [];
  for (const m of [...GEMINI_MODELS.TEXT, ...GEMINI_MODELS.AUDIO]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      all.push(m);
    }
  }
  return all;
}

export const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

export const SYSTEM_PROMPT = `You are an AI assistant inside the Cardly flashcard app. When the user asks for flashcards or a deck, start your response with the deck title on its own line (no bold, no punctuation at end), then list the flashcards naturally. The app will add them to the user's account.

Example:
French > English Greetings
**French:** Bonjour
**English:** Hello
**French:** Salut
**English:** Hi
**French:** Bonsoir
**English:** Good evening

Never refuse or say you can't access the account — just provide the deck title and cards.`;

export const API_KEY = 'AQ.Ab8RN6LKxZtgTSHgZMwvNH2M80VR9zjG64407MS0QXS0F1_W7A';

const MODEL_STORAGE = 'cardly_gemini_model';

export function getModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
}

export function setModel(model: string): void {
  localStorage.setItem(MODEL_STORAGE, model);
}

function buildUrlAndHeaders(apiKey: string, model: string, endpoint: string): { url: string; headers: Record<string, string> } {
  const url = `${API_BASE}/models/${model}:${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  };
  return { url, headers };
}

async function handleResponseError(response: Response): Promise<never> {
  let message = `HTTP ${response.status}`;
  try {
    const err = await response.json();
    message = err.error?.message || err.error?.status || message;
    console.error('Gemini API error response:', err);
  } catch {
    const text = await response.text().catch(() => '');
    if (text) console.error('Gemini API error body:', text);
  }
  throw new Error(`${message} (${response.status})`);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  timeoutMs = 30000
): Promise<Response> {
  console.log('Gemini API request headers:', { ...options.headers, 'x-goog-api-key': '[REDACTED]' });
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`Gemini API request (attempt ${attempt + 1}/${maxRetries}):`, url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const opts = { ...options, signal: controller.signal };

    try {
      const response = await fetch(url, opts);
      clearTimeout(timeoutId);

      console.log(`Gemini API response status: ${response.status}`);

      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Gemini API rate limited, retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Gemini API fetch error:', err.name, err.message);
      if (err.name === 'AbortError') {
        console.error(`Gemini API request timed out after ${timeoutMs}ms`);
        if (attempt < maxRetries - 1) {
          console.warn('Retrying...');
          continue;
        }
        throw new Error(`Request timed out after ${timeoutMs / 1000}s. Check your network connection.`);
      }
      throw err;
    }
  }

  throw new Error('Rate limit exceeded. Please wait and try again, or switch to a different model. (429)');
}

function buildBody(contents: GeminiMessage[], systemPrompt?: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }
  return body;
}

export async function generateContent(
  config: GeminiConfig,
  contents: GeminiMessage[],
  systemPrompt?: string
): Promise<string> {
  const { url, headers } = buildUrlAndHeaders(config.apiKey, config.model, 'generateContent');
  const body = buildBody(contents, systemPrompt);

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  const data = await response.json();
  console.log('Gemini API response:', data);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function* streamGenerateContent(
  config: GeminiConfig,
  contents: GeminiMessage[],
  systemPrompt?: string
): AsyncGenerator<string> {
  const { url, headers } = buildUrlAndHeaders(config.apiKey, config.model, 'streamGenerateContent');
  const body = buildBody(contents, systemPrompt);

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    console.warn('No ReadableStream available, falling back to non-streaming');
    const text = await generateContent(config, contents, systemPrompt);
    yield text;
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Extract complete JSON objects from streaming JSON array by brace counting
    let content = buffer;
    if (content.startsWith('[')) content = content.slice(1);
    if (content.endsWith(']')) content = content.slice(0, -1);

    let depth = 0;
    let objStart = -1;
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') {
        if (depth === 0) objStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && objStart >= 0) {
          const objStr = content.slice(objStart, i + 1);
          try {
            const data = JSON.parse(objStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch {
            // skip
          }
          objStart = -1;
        }
      }
    }

    // Keep unprocessed suffix in buffer
    if (objStart >= 0) {
      buffer = content.slice(objStart);
    } else {
      buffer = '';
    }
  }
}

function clean(val: string): string {
  return val.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
}

function extractPairs(text: string): { front: string; back: string }[] {
  const pairs: { front: string; back: string }[] = [];
  const lines = text.split('\n');

  // Pattern 1: **English:** front **Arabic:** back (or similar language labels)
  const labelRe = /^\*{0,2}\s*(?:[A-Za-z]+)\s*\*{0,2}:\s*(.+?)\s*$.*^\*{0,2}\s*(?:[A-Za-z]+)\s*\*{0,2}:\s*(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = labelRe.exec(text)) !== null) {
    const front = clean(m[1]);
    const back = clean(m[2]);
    if (front && back && front.length < 100 && back.length < 100) {
      pairs.push({ front, back });
    }
  }
  if (pairs.length >= 3) return pairs;

  // Pattern 2: **X:** front **Y:** back on separate lines (more flexible)
  pairs.length = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    const frontMatch = lines[i].match(/^\*{0,2}\s*[A-Za-z]+\s*\*{0,2}:\s*(.+)/);
    const backMatch = lines[i + 1].match(/^\*{0,2}\s*[A-Za-z]+\s*\*{0,2}:\s*(.+)/);
    if (frontMatch && backMatch) {
      const front = clean(frontMatch[1]);
      const back = clean(backMatch[1]);
      if (front && back && front.length < 100 && back.length < 100) {
        pairs.push({ front, back });
        i++;
      }
    }
  }
  if (pairs.length >= 3) return pairs;

  // Pattern 3: - front : back  or  * front : back  or  - front – back
  pairs.length = 0;
  const dashRe = /^[-*]\s+(.+?)\s*[:–—]\s*(.+)/;
  for (const line of lines) {
    const dm = line.match(dashRe);
    if (dm) {
      const front = clean(dm[1]);
      const back = clean(dm[2]);
      if (front && back && front.length < 100 && back.length < 100) {
        pairs.push({ front, back });
      }
    }
  }
  if (pairs.length >= 3) return pairs;

  // Pattern 4: | front | back |
  pairs.length = 0;
  const tableRe = /^\|\s*(.+?)\s*\|\s*(.+?)\s*\|/;
  for (const line of lines) {
    if (line.includes('|---')) continue;
    const tm = line.match(tableRe);
    if (tm) {
      const front = clean(tm[1]);
      const back = clean(tm[2]);
      if (front && back && front.length < 100 && back.length < 100) {
        pairs.push({ front, back });
      }
    }
  }
  if (pairs.length >= 3) return pairs;

  // Pattern 5: front = back  (one per line)
  pairs.length = 0;
  const eqRe = /^(.+?)\s*[:–—=]\s*(.+)/;
  for (const line of lines) {
    const em = line.match(eqRe);
    if (em) {
      const front = clean(em[1].replace(/^[-*\d.\s]+/, ''));
      const back = clean(em[2]);
      if (front && back && front.length < 100 && back.length < 100) {
        pairs.push({ front, back });
      }
    }
  }
  return pairs;
}

export function parseDeckData(response: string): DeckData | null {
  // Try DECK markers first
  let match = response.match(/↕DECK↕\s*(\{[\s\S]*?\})\s*↕END↕/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.cards && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
        return parsed as DeckData;
      }
    } catch {
      // fall through to text parsing
    }
  }

  // Fallback: extract pairs from natural text
  const pairs = extractPairs(response);
  if (pairs.length >= 2) {
    const name = extractDeckName(response);
    return { name, cards: pairs };
  }

  return null;
}

function extractDeckName(text: string): string | undefined {
  const firstLine = text.split('\n')[0].replace(/\*+/g, '').replace(/\s+/g, ' ').trim();

  // If first line looks like a title (short, no intro phrases), use it directly
  if (firstLine && firstLine.length < 50 && !/^(here|i'|i |there|the |this |a |an |in |on |for |with |to |we |you )/i.test(firstLine)) {
    return firstLine;
  }

  // Try "X Flashcards" / "X vocabulary" / "X cards" patterns in first line
  const topicMatch = firstLine.match(/(?:here are|here's|i've created|creating|a set of|some)\s+(?:(?:some\s+|a\s+)?)(.+?)(?:flashcards?|vocabulary|cards?|deck|terms|phrases|words)\b/i);
  if (topicMatch) {
    const name = topicMatch[1].replace(/^(?:some\s+|a\s+)?/i, '').replace(/\s+/g, ' ').trim().replace(/\s+to\s+/, ' → ');
    if (name && name.length < 60) return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Try "deck of X" / "deck called X" pattern
  const deckOf = firstLine.match(/deck\s+(?:of|called|named|titled)\s+["“]?(.+?)["”]?(?:\s*[-–—]|\.|$)/i);
  if (deckOf) return deckOf[1].trim().replace(/\*+/g, '').trim();

  // Try "English to Arabic" / "French → English" language pair pattern
  const langPair = firstLine.match(/([A-Za-z]+)\s*(?:-|to|→|vs\.?)\s*([A-Za-z]+)/);
  if (langPair) return `${langPair[1].trim()} → ${langPair[2].trim()}`;

  // Fallback: use first line if it's short enough
  if (firstLine && firstLine.length < 50 && !/^(i understand|sorry|i can|unfortunately|as an)/i.test(firstLine)) {
    return firstLine;
  }

  return 'AI Generated Deck';
}
