import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/db";
import { addDeck, addFlashcard } from "@/lib/sync";
import { logOut } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Send,
  Settings,
  Bot,
  User,
  Loader2,
  Plus,
  BookOpen,
  Trash2,
  Sparkles,
  LogOut,
  MessageSquare,
  Library,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  type GeminiMessage,
  type DeckData,
  API_KEY,
  getAllModels,
  getModel,
  setModel,
  streamGenerateContent,
  generateContent,
  parseDeckData,
} from "@/lib/gemini";

interface ChatMessage {
  role: "user" | "model";
  text: string;
  deckData?: DeckData | null;
}

const STORAGE_KEY = 'cardly_ai_chat';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

type Mode = 'create' | 'chat';

const MODE_STORAGE = 'cardly_ai_mode';

function loadMode(): Mode {
  return (localStorage.getItem(MODE_STORAGE) as Mode) || 'create';
}

function saveMode(mode: Mode) {
  localStorage.setItem(MODE_STORAGE, mode);
}

const MODE_PROMPTS: Record<Mode, string> = {
  create: `You are an AI assistant inside the Cardly flashcard app. When the user asks for flashcards or a deck, start your response with the deck title on its own line (no bold, no punctuation at end), then list the flashcards naturally. The app will add them to the user's account.

Example:
French > English Greetings
**French:** Bonjour
**English:** Hello
**French:** Salut
**English:** Hi
**French:** Bonsoir
**English:** Good evening

Never refuse or say you can't access the account — just provide the deck title and cards.`,
  chat: `You are a helpful language tutor inside the Cardly flashcard app. Help the user practice their target language naturally. Correct their mistakes, suggest better phrasing, and keep the conversation flowing. Be encouraging and patient. Do NOT create flashcards unless the user explicitly asks for them.`,
};

const SUGGESTIONS: Record<Mode, string[]> = {
  create: [
    "Create 10 Spanish food vocabulary cards",
    "Make a deck about JavaScript basics",
    "Create cards for French verbs",
  ],
  chat: [
    "Help me practice my French",
    "Correct my Spanish sentences",
    "Quiz me on Japanese words",
  ],
};

interface Props {
  fullScreen?: boolean;
}

export default function AIChat({ fullScreen }: Props = {}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [mode, setMode] = useState<Mode>(loadMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelInput, setModelInput] = useState(getModel());
  const [addToDeckDialog, setAddToDeckDialog] = useState<{
    deckData: DeckData;
    messageIndex: number;
  } | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allDecks = useLiveQuery(() => db.decks.toArray());

  // Persist messages to localStorage
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    const userMessage: ChatMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingText("");

    const model = getModel();
    const systemPrompt = MODE_PROMPTS[mode];
    const geminiMessages: GeminiMessage[] = [
      ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: "user", parts: [{ text }] },
    ];

    let fullResponse = "";

    try {
      const config = { apiKey: API_KEY, model };

      try {
        const stream = streamGenerateContent(config, geminiMessages, systemPrompt);
        for await (const chunk of stream) {
          fullResponse += chunk;
          setStreamingText(fullResponse);
        }
      } catch (streamErr: any) {
        console.warn("Streaming failed, trying non-streaming:", streamErr.message);
        setStreamingText("");
        fullResponse = "";
        const result = await generateContent(config, geminiMessages, systemPrompt);
        fullResponse = result;
        setStreamingText("");
      }

      if (fullResponse) {
        console.log('Full AI response:', fullResponse);
        const deckData = mode === 'create' ? parseDeckData(fullResponse) : null;
        console.log('Parsed deck data:', deckData);
        setMessages((prev) => [
          ...prev,
          { role: "model", text: fullResponse, deckData },
        ]);
        if (deckData) {
          toast({
            title: deckData.name ? "Deck data detected" : "Cards detected",
            description: deckData.cards.length + " cards found — add them using the buttons below.",
          });
        }
      }
    } catch (err: any) {
      console.error("Gemini API error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to get response from Gemini",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  }, [input, isLoading, messages, toast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateDeck = async (deckData: DeckData) => {
    const deckName = deckData.name || 'AI Generated Deck';
    try {
      const deckId = await addDeck({
        name: deckName,
        description: deckData.description || `Created by AI with ${deckData.cards.length} cards`,
        createdAt: new Date(),
        category: "ai-generated",
      });

      for (const card of deckData.cards) {
        await addFlashcard({
          deckId,
          front: card.front,
          back: card.back,
          createdAt: new Date(),
          ease: 2.5,
          interval: 0,
          repetitions: 0,
        });
      }

        toast({
          title: "Deck created",
          description: `"${deckName}" with ${deckData.cards.length} cards added to your collection.`,
        });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create deck",
        variant: "destructive",
      });
    }
  };

  const handleAddToDeck = async () => {
    if (!addToDeckDialog || !selectedDeckId) return;
    const { deckData } = addToDeckDialog;
    const deckId = Number(selectedDeckId);

    try {
      for (const card of deckData.cards) {
        await addFlashcard({
          deckId,
          front: card.front,
          back: card.back,
          createdAt: new Date(),
          ease: 2.5,
          interval: 0,
          repetitions: 0,
        });
      }

      const deckName = allDecks?.find((d) => d.id === deckId)?.name || "deck";
      toast({
        title: "Cards added",
        description: `${deckData.cards.length} cards added to "${deckName}".`,
      });
      setAddToDeckDialog(null);
      setSelectedDeckId("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add cards",
        variant: "destructive",
      });
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setStreamingText("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const renderText = (text: string) => {
    const parts = text.split(/(↕DECK↕[\s\S]*?↕END↕)/);
    return parts.map((part, i) => {
      if (part.startsWith("↕DECK↕")) return null;
      return (
        <p key={i} className="whitespace-pre-wrap break-words">
          {part}
        </p>
      );
    });
  };

  const handleLogout = async () => {
    await logOut();
    navigate("/");
  };

  const currentSuggestions = SUGGESTIONS[mode];
  const modeIcon = mode === 'create' ? Library : MessageSquare;

  return (
    <div className={`flex flex-col ${fullScreen ? 'h-screen' : 'h-full'} bg-gradient-to-b from-background via-background to-muted/30`}>
      {/* Header with glass effect */}
      <div className="relative flex items-center gap-2 px-5 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary/30" />
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground leading-tight">AI Assistant</h2>
          <p className="text-[11px] text-muted-foreground truncate">{getModel()}</p>
        </div>

        {/* Mode toggle pills */}
        <div className="flex bg-muted/80 rounded-lg p-0.5 border border-border/50">
          <button
            onClick={() => { setMode('create'); saveMode('create'); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === 'create'
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Library className="w-3 h-3" />
            <span className="hidden sm:inline">Decks</span>
          </button>
          <button
            onClick={() => { setMode('chat'); saveMode('chat'); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              mode === 'chat'
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">Chat</span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 text-xs gap-1.5 px-2 h-8"
          title="Drop chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setModelInput(getModel());
            setSettingsOpen(true);
          }}
          className="text-muted-foreground hover:text-foreground px-2 h-8"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Button>
        {user && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            <span className="text-[11px] text-muted-foreground hidden md:block max-w-[100px] truncate">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive px-1.5 h-8"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 py-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center ring-1 ring-primary/20 mb-5">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1.5">
              {mode === 'create' ? 'Create Flashcards' : 'Practice Languages'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {mode === 'create'
                ? 'Tell me what you want to learn and I\'ll generate a deck of flashcards for you instantly.'
                : 'Practice your target language with me. I\'ll correct your mistakes and help you improve.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {currentSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="text-xs bg-muted/60 hover:bg-muted text-foreground border border-border/60 hover:border-border px-3 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4 max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 items-end",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "model" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border/60 rounded-bl-sm"
                  )}
                >
                  <div className={msg.role === "user" ? "text-sm" : "text-sm text-foreground"}>
                    {renderText(msg.text)}
                  </div>
                  {msg.role === "model" && msg.deckData && (
                    <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCreateDeck(msg.deckData!)}
                        className="bg-gradient-primary hover:opacity-90 text-primary-foreground text-xs h-7"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create "{msg.deckData.name || 'AI Generated Deck'}"
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddToDeckDialog({ deckData: msg.deckData!, messageIndex: i });
                          setSelectedDeckId("");
                        }}
                        className="border-border text-foreground hover:bg-muted text-xs h-7"
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        Add to deck
                      </Button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && streamingText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-card border border-border/60 px-4 py-3 shadow-sm">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {streamingText}
                  </p>
                  <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse rounded-sm" />
                </div>
              </motion.div>
            )}

            {isLoading && !streamingText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-card border border-border/60 px-4 py-3 shadow-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2 max-w-3xl mx-auto p-4">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'create' ? "Ask me to create flashcards..." : "Practice your target language..."}
              disabled={isLoading}
              className="bg-muted/50 border-border/60 text-foreground pr-3 focus-visible:ring-primary/20"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-sm h-10 w-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Model Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose which Gemini model to use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="model" className="text-foreground mb-2 block">
                Model
              </Label>
              <Select value={modelInput} onValueChange={setModelInput}>
                <SelectTrigger
                  id="model"
                  className="w-full bg-background border-border text-foreground"
                >
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {getAllModels().map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModel(modelInput);
                setSettingsOpen(false);
                toast({
                  title: "Model updated",
                  description: `Using ${modelInput}`,
                });
              }}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!addToDeckDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAddToDeckDialog(null);
            setSelectedDeckId("");
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add cards to deck</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {addToDeckDialog?.deckData.cards.length} cards will be added to the
              selected deck.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="target-deck" className="text-foreground mb-2 block">
              Select deck
            </Label>
            <Select
              value={selectedDeckId}
              onValueChange={setSelectedDeckId}
            >
              <SelectTrigger
                id="target-deck"
                className="w-full bg-background border-border text-foreground"
              >
                <SelectValue placeholder="Choose a deck" />
              </SelectTrigger>
              <SelectContent>
                {allDecks?.map((deck) => (
                  <SelectItem key={deck.id} value={String(deck.id)}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddToDeckDialog(null);
                setSelectedDeckId("");
              }}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToDeck}
              disabled={!selectedDeckId}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              Add cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
