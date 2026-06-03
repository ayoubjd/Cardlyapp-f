import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, shuffleArray } from "@/lib/db";
import { updateFlashcard, addStudySession } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Volume2, Check, X } from "lucide-react";
import { calculateNextReview } from "@/lib/spacedRepetition";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { speakFrench } from "@/lib/tts";

export default function TypingStudy() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [studied, setStudied] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime] = useState(Date.now());

  const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
  const rawCards = useLiveQuery(
    () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
    [deckId]
  );

  // Shuffle cards once when loaded
  const cards = useMemo(() => {
    if (!rawCards) return undefined;
    return shuffleArray(rawCards);
  }, [rawCards]);

  const currentCard = cards?.[currentIndex];

  const normalizeText = (text: string) => {
    return text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  };

  const handleExit = async () => {
    if (studied > 0) {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      await addStudySession({
        deckId: Number(deckId),
        mode: 'typing',
        cardsStudied: studied,
        correctCount,
        totalTime,
        completedAt: new Date(),
      });
    }
    navigate(`/deck/${deckId}`);
  };

  const handleSubmit = () => {
    if (!currentCard || !userAnswer.trim()) return;

    const normalized = normalizeText(userAnswer);
    const expected = normalizeText(currentCard.back);
    const correct = normalized === expected;

    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleContinue = async () => {
    if (!currentCard) return;

    try {
      const quality = isCorrect ? 5 : 2;
      const result = calculateNextReview(currentCard, quality);
      await updateFlashcard(currentCard.id!, {
        ease: result.ease,
        interval: result.interval,
        repetitions: result.repetitions,
        lastReviewed: new Date(),
        nextReview: result.nextReview,
      });

      setStudied((prev) => prev + 1);
      if (isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      setShowResult(false);
      setUserAnswer("");

      if (currentIndex < (cards?.length || 0) - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Save session stats
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        await addStudySession({
          deckId: Number(deckId),
          mode: 'typing',
          cardsStudied: studied + 1,
          correctCount: correctCount + (isCorrect ? 1 : 0),
          totalTime,
          completedAt: new Date(),
        });
        
        toast({
          title: "Session Complete!",
          description: `You studied ${studied + 1} cards`,
        });
        navigate(`/deck/${deckId}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save review",
        variant: "destructive",
      });
    }
  };

  const handleSpeak = () => {
    if (currentCard) {
      speakFrench(currentCard.front);
    }
  };

  if (!deck || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No cards to study</p>
          <Button onClick={() => navigate(`/deck/${deckId}`)}>
            Back to Deck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Button
            variant="ghost"
            onClick={handleExit}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Study
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                {deck.name} - Typing Mode
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Card {currentIndex + 1} of {cards.length}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-xs sm:text-sm text-muted-foreground">Studied</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{studied}</p>
            </div>
          </div>
        </motion.div>

        <div className="mb-8">
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <motion.div
              className="bg-gradient-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentIndex + 1) / cards.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-gradient-card border-border shadow-card p-6 sm:p-8 mb-6">
            <div className="flex items-start justify-between mb-6 gap-3">
              <div className="flex-1 min-w-0">
                <div className="mb-2 text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
                  Question
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground leading-relaxed break-words">
                  {currentCard.front}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSpeak}
                className="hover:bg-primary/10 hover:text-primary flex-shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {!showResult ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Type your answer..."
                    className="text-lg py-6 bg-background border-border text-foreground"
                    autoFocus
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!userAnswer.trim()}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow"
                  >
                    Submit
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div
                    className={`p-6 rounded-lg ${
                      isCorrect
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-destructive/10 border-2 border-destructive"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {isCorrect ? (
                        <Check className="w-6 h-6 text-primary" />
                      ) : (
                        <X className="w-6 h-6 text-destructive" />
                      )}
                      <p className="font-semibold text-lg text-foreground">
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Your answer:
                        </p>
                        <p className="text-foreground">{userAnswer}</p>
                      </div>
                      {!isCorrect && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Correct answer:
                          </p>
                          <p className="text-foreground font-medium">
                            {currentCard.back}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleContinue}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
