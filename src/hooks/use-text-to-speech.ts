import { useState, useEffect, useCallback } from 'react';

interface UseTextToSpeechOptions {
  lang: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useTextToSpeech({ lang, rate = 1.0, pitch = 1.0, volume = 1.0 }: UseTextToSpeechOptions) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const scoreVoice = useCallback((voice: SpeechSynthesisVoice, targetLang: string) => {
    let score = 0;
    
    // 1. Language matching (highest priority)
    // Map our short codes to standard BCP-47 patterns if necessary
    const targetLangLower = targetLang.toLowerCase();
    const voiceLangLower = voice.lang.toLowerCase();
    
    if (voiceLangLower === targetLangLower) {
      score += 100; // Exact match (e.g. 'en-us' to 'en-us')
    } else if (voiceLangLower.startsWith(targetLangLower)) {
      score += 80;  // Partial match (e.g. 'en-gb' to 'en')
    } else {
      return 0; // Not the requested language
    }

    // 2. Voice quality keywords (premium, neural, natural, enhanced)
    const name = voice.name.toLowerCase();
    if (name.includes('premium') || name.includes('neural') || name.includes('natural') || name.includes('enhanced')) {
      score += 50;
    }
    
    // Vendor prioritization (Google Cloud and Microsoft Cognitive often sound best)
    if (name.includes('google') || name.includes('microsoft')) {
      score += 20;
    }

    // 3. Local vs Cloud preference based on online/offline status
    if (!navigator.onLine) {
      if (!voice.localService) {
        return -1000; // Absolutely reject cloud voices when offline
      }
      score += 50; // Prefer local voices
    } else {
      // Prefer high-quality cloud voices when online
      if (!voice.localService) score += 30;
    }

    return score;
  }, []);

  const getBestVoice = useCallback((targetLang: string) => {
    if (voices.length === 0) return null;
    
    let bestVoice = voices[0];
    let maxScore = -1;

    for (const voice of voices) {
      const score = scoreVoice(voice, targetLang);
      if (score > maxScore) {
        maxScore = score;
        bestVoice = voice;
      }
    }
    return maxScore >= 0 ? bestVoice : null;
  }, [voices, scoreVoice]);

  const speak = useCallback((text: string, overrideLang?: string): Promise<void> => {
    const activeLang = overrideLang ?? lang;
    return new Promise((resolve) => {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = activeLang;
        
        const voice = getBestVoice(activeLang);
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        (window as any)._currentUtterance = utterance;
        
        let startTimeout: NodeJS.Timeout;
        
        utterance.onstart = () => {
           clearTimeout(startTimeout);
        };
        
        utterance.onend = () => {
           clearTimeout(startTimeout);
           resolve();
        };
        
        utterance.onerror = (e) => {
           console.error("TTS Error:", e);
           clearTimeout(startTimeout);
           resolve();
        };
        
        startTimeout = setTimeout(() => {
           console.warn("TTS timeout: speech didn't start for text:", text);
           window.speechSynthesis.cancel();
           resolve();
        }, 3000);
        
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();
    });
  }, [lang, rate, pitch, volume, getBestVoice]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel, voices, getBestVoice };
}
