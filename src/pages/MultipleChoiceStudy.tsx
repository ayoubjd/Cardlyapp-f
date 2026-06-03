import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Flashcard, shuffleArray } from "@/lib/db";
import { addStudySession } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizResult {
  card: Flashcard;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function MultipleChoiceStudy() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
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

  // Generate options for current card
  const options = useMemo(() => {
    if (!cards || !currentCard || cards.length < 2) return [];

    const correctAnswer = currentCard.back;
    const otherAnswers = cards
      .filter((c) => c.id !== currentCard.id)
      .map((c) => c.back);

    // Get up to 3 wrong answers
    const wrongAnswers = shuffleArray(otherAnswers).slice(0, 3);

    // Combine and shuffle all options
    return shuffleArray([correctAnswer, ...wrongAnswers]);
  }, [cards, currentCard, currentIndex]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer) return; // Already answered
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    if (!currentCard || !selectedAnswer) return;

    const isCorrect = selectedAnswer === currentCard.back;
    const newResults = [
      ...results,
      {
        card: currentCard,
        selectedAnswer,
        correctAnswer: currentCard.back,
        isCorrect,
      },
    ];
    setResults(newResults);

    setSelectedAnswer(null);

    if (currentIndex < (cards?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Save session stats
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      const correctCount = newResults.filter(r => r.isCorrect).length;
      await addStudySession({
        deckId: Number(deckId),
        mode: 'multiple-choice',
        cardsStudied: newResults.length,
        correctCount,
        totalTime,
        completedAt: new Date(),
      });
      setIsComplete(true);
    }
  };

  const correctCount = results.filter((r) => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (!deck || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No cards available</p>
          <Button onClick={() => navigate(`/deck/${deckId}`)}>Back to Deck</Button>
        </div>
      </div>
    );
  }

  if (cards.length < 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-muted-foreground mb-4">
            Multiple choice mode requires at least 4 cards to generate options.
            You have {cards.length} card{cards.length !== 1 ? "s" : ""}.
          </p>
          <Button onClick={() => navigate(`/deck/${deckId}`)}>Back to Deck</Button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-gradient-card border-border p-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold text-foreground mb-2">Quiz Complete!</h1>
              <p className="text-muted-foreground mb-6">{deck.name}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-background/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-primary">{accuracy}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-foreground">{correctCount}/{cards.length}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
              </div>

              <div className="space-y-3 mb-8 text-left max-h-64 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      result.isCorrect ? "bg-green-500/10" : "bg-destructive/10"
                    }`}
                  >
                    {result.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{result.card.front}</p>
                      {!result.isCorrect && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Your answer: <span className="text-destructive">{result.selectedAnswer}</span>
                          <br />
                          Correct: <span className="text-green-500">{result.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/deck/${deckId}`)}
                  className="flex-1"
                >
                  Back to Deck
                </Button>
                <Button
                  onClick={() => {
                    setCurrentIndex(0);
                    setResults([]);
                    setIsComplete(false);
                    setSelectedAnswer(null);
                  }}
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                >
                  Try Again
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleExit = async () => {
    if (results.length > 0) {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
        await addStudySession({
          deckId: Number(deckId),
          mode: 'multiple-choice',
          cardsStudied: results.length,
          correctCount,
          totalTime,
          completedAt: new Date(),
        });
    }
    navigate(`/deck/${deckId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={handleExit}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Quiz
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{deck.name}</h1>
              <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {cards.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{correctCount}</p>
              <p className="text-xs text-muted-foreground">correct</p>
            </div>
          </div>
          <Progress value={((currentIndex + 1) / cards.length) * 100} className="h-2" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="bg-gradient-card border-border p-6 sm:p-8 mb-6">
              {currentCard?.imageUrl && (
                <img
                  src={currentCard.imageUrl}
                  alt="Flashcard"
                  className="max-w-full max-h-40 mx-auto mb-4 rounded-lg"
                />
              )}
              <div className="text-xs text-primary font-medium mb-2 text-center">QUESTION</div>
              <p className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-8">
                {currentCard?.front}
              </p>

              <div className="grid gap-3">
                {options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentCard?.back;
                  const showResult = selectedAnswer !== null;

                  let className = "p-4 text-left border rounded-xl transition-all ";
                  if (showResult) {
                    if (isCorrect) {
                      className += "bg-green-500/20 border-green-500 text-foreground";
                    } else if (isSelected) {
                      className += "bg-destructive/20 border-destructive text-foreground";
                    } else {
                      className += "bg-muted/50 border-border text-muted-foreground";
                    }
                  } else {
                    className += "bg-background border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer text-foreground";
                  }

                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={className}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={showResult}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {showResult && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-destructive shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {selectedAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={handleNext}
              className="bg-gradient-primary text-primary-foreground px-12"
            >
              {currentIndex < (cards?.length || 0) - 1 ? "Next Question" : "See Results"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
