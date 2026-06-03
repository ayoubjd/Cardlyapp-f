let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];
let voiceLoadAttempts = 0;

// Force refresh voices from the system
const forceRefreshVoices = (): SpeechSynthesisVoice[] => {
  // Cancel any speech to reset the synthesis
  window.speechSynthesis.cancel();

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    availableVoices = voices;
    voicesLoaded = true;
  }
  return voices;
};

// Load and cache voices with multiple attempts
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const attemptLoad = () => {
      voiceLoadAttempts++;
      const voices = forceRefreshVoices();

      console.log(`Voice load attempt ${voiceLoadAttempts}:`, voices.length, 'voices found');

      if (voices.length > 0) {
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        resolve(voices);
        return true;
      }
      return false;
    };

    // Try immediately
    if (attemptLoad()) return;

    // Wait for voices to load event
    window.speechSynthesis.onvoiceschanged = () => {
      attemptLoad();
    };

    // Multiple retry attempts with increasing delays
    const retryDelays = [100, 300, 500, 1000, 2000];
    retryDelays.forEach((delay) => {
      setTimeout(() => {
        if (!voicesLoaded || availableVoices.length === 0) {
          attemptLoad();
        }
      }, delay);
    });

    // Final fallback
    setTimeout(() => {
      if (!voicesLoaded) {
        attemptLoad();
        resolve(availableVoices);
      }
    }, 3000);
  });
};

// Get the best French voice available
const getFrenchVoice = async (): Promise<SpeechSynthesisVoice | null> => {
  // Always try to get fresh voices
  const currentVoices = forceRefreshVoices();

  if (currentVoices.length === 0) {
    await loadVoices();
  }

  // Get the most up-to-date voice list
  const latestVoices = window.speechSynthesis.getVoices();
  const voicesToSearch = latestVoices.length > 0 ? latestVoices : availableVoices;

  console.log('Searching for French voice among', voicesToSearch.length, 'voices');
  console.log('All voices:', voicesToSearch.map(v => `${v.name} (${v.lang})`));

  // Find all French voices with broader matching
  const frenchVoices = voicesToSearch.filter(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang.startsWith('fr') ||
      lang === 'fra' ||
      name.includes('french') ||
      name.includes('français') ||
      name.includes('francais') ||
      name.includes('france') ||
      // Check for Microsoft French voices specifically
      (name.includes('microsoft') && (name.includes('paul') || name.includes('hortense') || name.includes('julie') || name.includes('claude')))
    );
  });

  console.log('French voices found:', frenchVoices.map(v => `${v.name} (${v.lang})`));

  if (frenchVoices.length === 0) {
    console.warn('No French voices available. Voice list:', voicesToSearch.map(v => v.name).join(', '));
    return null;
  }

  // Prioritize native/local voices over remote ones, and prefer fr-FR
  const prioritized = frenchVoices.sort((a, b) => {
    // Prefer fr-FR
    if (a.lang === 'fr-FR' && b.lang !== 'fr-FR') return -1;
    if (b.lang === 'fr-FR' && a.lang !== 'fr-FR') return 1;
    // Prefer local voices
    if (a.localService && !b.localService) return -1;
    if (b.localService && !a.localService) return 1;
    return 0;
  });

  const selected = prioritized[0];
  console.log('Selected French voice:', selected.name, selected.lang);
  return selected;
};

export const speakFrench = async (text: string): Promise<{ success: boolean; hasFrenchVoice: boolean }> => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return { success: false, hasFrenchVoice: false };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Small delay to ensure voices are loaded after cancel
  await new Promise(r => setTimeout(r, 100));

  // Get French voice first
  const frenchVoice = await getFrenchVoice();

  if (!frenchVoice) {
    console.error('No French voice available. Please restart your browser after installing French language pack.');
    return { success: false, hasFrenchVoice: false };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = frenchVoice;
  utterance.lang = frenchVoice.lang;
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  console.log('Speaking with French voice:', frenchVoice.name);

  return new Promise((resolve) => {
    utterance.onend = () => resolve({ success: true, hasFrenchVoice: true });
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      resolve({ success: false, hasFrenchVoice: true });
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Get the best English voice available
const getEnglishVoice = async (): Promise<SpeechSynthesisVoice | null> => {
  // Always try to get fresh voices
  const currentVoices = forceRefreshVoices();

  if (currentVoices.length === 0) {
    await loadVoices();
  }

  // Get the most up-to-date voice list
  const latestVoices = window.speechSynthesis.getVoices();
  const voicesToSearch = latestVoices.length > 0 ? latestVoices : availableVoices;

  console.log('Searching for English voice among', voicesToSearch.length, 'voices');

  // Find all English voices with broader matching
  const englishVoices = voicesToSearch.filter(v => {
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    return (
      lang.startsWith('en') ||
      name.includes('english') ||
      name.includes('united states') ||
      name.includes('united kingdom')
    );
  });

  if (englishVoices.length === 0) {
    console.warn('No English voices available.');
    return null;
  }

  // Prioritize native/local voices. Prefer en-US for generic English.
  const prioritized = englishVoices.sort((a, b) => {
    // Prefer en-US or en-GB
    const isAStandard = a.lang === 'en-US' || a.lang === 'en-GB';
    const isBStandard = b.lang === 'en-US' || b.lang === 'en-GB';
    if (isAStandard && !isBStandard) return -1;
    if (isBStandard && !isAStandard) return 1;

    // Prefer local voices
    if (a.localService && !b.localService) return -1;
    if (b.localService && !a.localService) return 1;
    return 0;
  });

  const selected = prioritized[0];
  console.log('Selected English voice:', selected.name, selected.lang);
  return selected;
};

export const speakEnglish = async (text: string): Promise<{ success: boolean; hasEnglishVoice: boolean }> => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return { success: false, hasEnglishVoice: false };
  }

  window.speechSynthesis.cancel();
  await new Promise(r => setTimeout(r, 100));

  const englishVoice = await getEnglishVoice();

  if (!englishVoice) {
    console.error('No English voice available.');
    return { success: false, hasEnglishVoice: false };
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = englishVoice;
  utterance.lang = englishVoice.lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  console.log('Speaking with English voice:', englishVoice.name);

  return new Promise((resolve) => {
    utterance.onend = () => resolve({ success: true, hasEnglishVoice: true });
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      resolve({ success: false, hasEnglishVoice: true });
    };

    window.speechSynthesis.speak(utterance);
  });
};

export const hasFrenchVoiceAvailable = async (): Promise<boolean> => {
  const voice = await getFrenchVoice();
  return voice !== null;
};

// Force a voice refresh - can be called externally
export const refreshVoices = (): void => {
  voicesLoaded = false;
  voiceLoadAttempts = 0;
  forceRefreshVoices();
  loadVoices();
};

// Initialize voices on load
if ('speechSynthesis' in window) {
  loadVoices();
  // Multiple interaction points to ensure voices load
  document.addEventListener('click', () => {
    forceRefreshVoices();
    loadVoices();
  }, { once: true });

  // Also try on focus
  window.addEventListener('focus', () => {
    if (availableVoices.length < 5) { // Likely missing voices
      forceRefreshVoices();
    }
  });
}