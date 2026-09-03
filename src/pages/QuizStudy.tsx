import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Flashcard, shuffleArray } from "@/lib/db";
import { addStudySession } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizResult {
  card: Flashcard;
  userAnswer: "correct" | "incorrect";
  timeSpent: number;
}

export default function QuizStudy() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

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

  useEffect(() => {
    setCardStartTime(Date.now());
  }, [currentIndex]);

  const handleAnswer = async (isCorrect: boolean) => {
    if (!currentCard) return;

    const timeSpent = (Date.now() - cardStartTime) / 1000;
    const newResult: QuizResult = { 
      card: currentCard, 
      userAnswer: isCorrect ? "correct" : "incorrect", 
      timeSpent 
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    setIsFlipped(false);

    if (currentIndex < (cards?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Save session stats
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      const correctCount = newResults.filter(r => r.userAnswer === "correct").length;
      await addStudySession({
        deckId: Number(deckId),
        mode: 'quiz',
        cardsStudied: newResults.length,
        correctCount,
        totalTime,
        completedAt: new Date(),
      });
      setIsComplete(true);
    }
  };

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  const correctCount = results.filter((r) => r.userAnswer === "correct").length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (!deck || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No cards to quiz</p>
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

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-background/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-primary">{accuracy}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-foreground">{correctCount}/{cards.length}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4">
                  <p className="text-3xl font-bold text-foreground">{totalTime}s</p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>

              <div className="space-y-3 mb-8 text-left max-h-64 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      result.userAnswer === "correct" ? "bg-green-500/10" : "bg-destructive/10"
                    }`}
                  >
                    {result.userAnswer === "correct" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.card.front}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.card.back}</p>
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
                    setStartTime(Date.now());
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
          mode: 'quiz',
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{Math.round((Date.now() - startTime) / 1000)}s</span>
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
            <Card
              className="bg-gradient-card border-border p-8 min-h-[350px] flex flex-col items-center justify-center cursor-pointer mb-6"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {currentCard?.imageUrl && !isFlipped && (
                <img
                  src={currentCard.imageUrl}
                  alt="Flashcard"
                  className="max-w-full max-h-40 mb-4 rounded-lg"
                />
              )}
              <div className="text-xs text-primary font-medium mb-4">
                {isFlipped ? "ANSWER" : "QUESTION"}
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-foreground text-center">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </p>
              <p className="text-sm text-muted-foreground mt-6">
                {isFlipped ? "Did you get it right?" : "Click to reveal answer"}
              </p>
            </Card>
          </motion.div>
        </AnimatePresence>

        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 justify-center"
          >
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleAnswer(false)}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 flex-1 max-w-[200px]"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Incorrect
            </Button>
            <Button
              size="lg"
              onClick={() => handleAnswer(true)}
              className="bg-gradient-primary text-primary-foreground flex-1 max-w-[200px]"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Correct
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
