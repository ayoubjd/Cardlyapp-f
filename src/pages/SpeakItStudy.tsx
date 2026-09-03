import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Settings, Volume2, Square, Globe2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { detectLanguage } from "@/lib/language-detect";

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
];

export default function SpeakItStudy() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  
  const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
  const cards = useLiveQuery(
    () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
    [deckId]
  );

  const [isConfiguring, setIsConfiguring] = useState(true);
  const [frontLanguage, setFrontLanguage] = useState('auto');
  const [backLanguage, setBackLanguage] = useState('auto');
  const [readMode, setReadMode] = useState<'front' | 'back' | 'both'>('both');
  const [rate, setRate] = useState(1);
  const [detectedFrontLang, setDetectedFrontLang] = useState<string | null>(null);
  const [detectedBackLang, setDetectedBackLang] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { speak, cancel } = useTextToSpeech({ lang: 'auto', rate: rate });
  
  // To track active playback independently of React state
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const LANG_NAMES: Record<string, string> = {
    en: 'English', fr: 'French', es: 'Spanish', de: 'German',
    zh: 'Chinese', ja: 'Japanese', ar: 'Arabic', ru: 'Russian', he: 'Hebrew',
  };

  const langFor = (text: string, setting: string) => setting === 'auto' ? detectLanguage(text) : setting;

  const playCard = async (index: number) => {
    if (!cards || cards.length === 0) return;
    
    const card = cards[index];
    const frontLang = langFor(card.front, frontLanguage);
    const backLang = langFor(card.back, backLanguage);
    setDetectedFrontLang(frontLang);
    setDetectedBackLang(backLang);
    
    if (readMode === 'both' || readMode === 'front') {
        if (isPlayingRef.current) await speak(card.front, frontLang);
    }
    
    if (readMode === 'both' && isPlayingRef.current) {
        await new Promise(r => setTimeout(r, 600));
    }
    
    if ((readMode === 'both' || readMode === 'back') && isPlayingRef.current) {
        await speak(card.back, backLang);
    }

    if (isPlayingRef.current) {
        if (index < cards.length - 1) {
            setTimeout(() => {
                if (isPlayingRef.current) {
                    setCurrentIndex(index + 1);
                }
            }, 1000);
        } else {
            setIsPlaying(false);
        }
    }
  };

  useEffect(() => {
    if (isPlaying && !isConfiguring) {
        playCard(currentIndex);
    } else {
        cancel();
    }
  }, [currentIndex, isPlaying, isConfiguring]);

  const togglePlay = () => {
    if (isPlaying) {
        setIsPlaying(false);
        cancel();
    } else {
        setIsPlaying(true);
    }
  };

  const nextCard = () => {
    cancel();
    if (cards && currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = () => {
    cancel();
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
  };

  const stopAndConfigure = () => {
      setIsPlaying(false);
      cancel();
      setIsConfiguring(true);
      setCurrentIndex(0);
  }

  if (!deck || !cards) return null;

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">No cards in this deck.</p>
        <Button onClick={() => navigate(`/deck/${deckId}`)}>Back to Deck</Button>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-shrink-0 px-4 py-4 border-b border-border/30 flex items-center justify-between z-10">
        <Button variant="ghost" onClick={() => navigate(`/deck/${deckId}`)} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="font-semibold text-foreground hidden sm:block">Speak It: {deck.name}</h1>
        {!isConfiguring && (
            <Button variant="ghost" size="sm" onClick={stopAndConfigure}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
            </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <AnimatePresence mode="wait">
            {isConfiguring ? (
                <motion.div
                    key="config"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md"
                >
                    <Card className="p-6 bg-card border-border shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-full bg-purple-500/20 text-purple-500">
                                <Volume2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Speak It Mode</h2>
                                <p className="text-sm text-muted-foreground">Hands-free audio studying</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center">
                                        <Globe2 className="w-4 h-4 mr-2" /> Front Voice Language
                                    </Label>
                                    <Select value={frontLanguage} onValueChange={setFrontLanguage}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map(lang => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center">
                                        <Globe2 className="w-4 h-4 mr-2" /> Back Voice Language
                                    </Label>
                                    <Select value={backLanguage} onValueChange={setBackLanguage}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LANGUAGES.map(lang => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-foreground">Sides to Read</Label>
                                <Select value={readMode} onValueChange={(v: any) => setReadMode(v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Sides" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both">Front & Back</SelectItem>
                                        <SelectItem value="front">Front Only</SelectItem>
                                        <SelectItem value="back">Back Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-foreground">Reading Speed</Label>
                                    <span className="text-xs text-muted-foreground">{rate}x</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2.0" 
                                    step="0.1" 
                                    value={rate} 
                                    onChange={(e) => setRate(parseFloat(e.target.value))}
                                    className="w-full accent-purple-500"
                                />
                            </div>

                            <Button 
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg mt-4 h-12 text-lg"
                                onClick={() => {
                                    setIsConfiguring(false);
                                    setIsPlaying(true);
                                }}
                            >
                                <Play className="w-5 h-5 mr-2 fill-current" /> Start Listening
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            ) : (
                <motion.div
                    key="player"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl flex flex-col items-center gap-8"
                >
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground font-medium px-1">
                            <span>Card {currentIndex + 1} of {cards.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <Card className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center bg-card shadow-2xl border-border relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="w-full space-y-6"
                            >
                                {(readMode === 'both' || readMode === 'front') && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-purple-500/80 uppercase tracking-wider flex items-center justify-center gap-2">
                                          Front
                                          {detectedFrontLang && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500/80">
                                              {frontLanguage !== 'auto' ? LANGUAGES.find(l => l.code === frontLanguage)?.name ?? frontLanguage.toUpperCase() : LANG_NAMES[detectedFrontLang] ?? detectedFrontLang.toUpperCase()}
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-2xl md:text-4xl font-bold text-foreground">
                                            {cards[currentIndex].front}
                                        </p>
                                    </div>
                                )}
                                
                                {readMode === 'both' && <div className="w-16 h-1 mx-auto bg-border rounded-full" />}

                                {(readMode === 'both' || readMode === 'back') && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-indigo-500/80 uppercase tracking-wider flex items-center justify-center gap-2">
                                          Back
                                          {detectedBackLang && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500/80">
                                              {backLanguage !== 'auto' ? LANGUAGES.find(l => l.code === backLanguage)?.name ?? backLanguage.toUpperCase() : LANG_NAMES[detectedBackLang] ?? detectedBackLang.toUpperCase()}
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xl md:text-3xl text-muted-foreground">
                                            {cards[currentIndex].back}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Card>

                    <div className="flex items-center gap-4 sm:gap-6 bg-card px-8 py-4 rounded-full shadow-lg border border-border">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={prevCard} 
                            disabled={currentIndex === 0}
                            className="h-12 w-12 hover:bg-muted"
                        >
                            <SkipBack className="w-6 h-6" />
                        </Button>
                        
                        <Button 
                            onClick={togglePlay}
                            className={`h-16 w-16 rounded-full shadow-xl text-white ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                            {isPlaying ? (
                                <Pause className="w-8 h-8 fill-current" />
                            ) : (
                                <Play className="w-8 h-8 fill-current ml-1" />
                            )}
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={nextCard} 
                            disabled={currentIndex === cards.length - 1}
                            className="h-12 w-12 hover:bg-muted"
                        >
                            <SkipForward className="w-6 h-6" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
