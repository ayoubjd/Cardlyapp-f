import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, shuffleArray } from "@/lib/db";
import { updateFlashcard, addStudySession } from "@/lib/sync";
import { FlashcardView } from "@/components/FlashcardView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X } from "lucide-react";
import { calculateNextReview, ReviewQuality } from "@/lib/spacedRepetition";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Study() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const handleExit = async () => {
    if (studied > 0) {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      await addStudySession({
        deckId: Number(deckId),
        mode: 'spaced',
        cardsStudied: studied,
        correctCount,
        totalTime,
        completedAt: new Date(),
      });
    }
    navigate(`/deck/${deckId}`);
  };

  const handleReview = async (quality: ReviewQuality) => {
    if (!currentCard) return;

    try {
      const result = calculateNextReview(currentCard, quality);
      await updateFlashcard(currentCard.id!, {
        ease: result.ease,
        interval: result.interval,
        repetitions: result.repetitions,
        lastReviewed: new Date(),
        nextReview: result.nextReview,
      });

      setStudied((prev) => prev + 1);
      if (quality >= 4) {
        setCorrectCount((prev) => prev + 1);
      }
      setIsFlipped(false);

      if (currentIndex < (cards?.length || 0) - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Save session stats
        const totalTime = Math.round((Date.now() - startTime) / 1000);
        await addStudySession({
          deckId: Number(deckId),
          mode: 'spaced',
          cardsStudied: studied + 1,
          correctCount: correctCount + (quality >= 4 ? 1 : 0),
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 mb-4 sm:mb-6"
        >
          <Button
            variant="ghost"
            onClick={handleExit}
            className="mb-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Study
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                {deck.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Card {currentIndex + 1} of {cards.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-muted-foreground">Studied</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{studied}</p>
            </div>
          </div>
        </motion.div>

        <div className="flex-shrink-0 mb-4 sm:mb-6">
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

        <div className="flex-1 flex flex-col min-h-0">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col min-h-0 mb-4"
          >
            <FlashcardView
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
            />
          </motion.div>

          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 px-3 sm:px-4 pb-4 sm:pb-6"
            >
              {/* Mobile: vertical stack, Desktop: horizontal flex */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center max-w-2xl mx-auto">
                {/* Again */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleReview(1)}
                  className="h-12 sm:h-11 border-2 border-red-500/60 text-red-600 hover:bg-red-500/20 hover:border-red-500 w-full sm:w-auto font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Again
                </Button>

                {/* Hard */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleReview(2)}
                  className="h-12 sm:h-11 border-2 border-orange-500/60 text-orange-600 hover:bg-orange-500/20 hover:border-orange-500 w-full sm:w-auto font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Hard
                </Button>

                {/* Good */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleReview(4)}
                  className="h-12 sm:h-11 border-2 border-blue-500/60 text-blue-600 hover:bg-blue-500/20 hover:border-blue-500 w-full sm:w-auto font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Good
                </Button>

                {/* Easy */}
                <Button
                  size="lg"
                  onClick={() => handleReview(5)}
                  className="h-12 sm:h-11 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:w-auto font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Easy
                </Button>

                {/* Very Easy */}
                <Button
                  size="lg"
                  onClick={() => handleReview(6)}
                  className="h-12 sm:h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white w-full sm:w-auto font-semibold text-sm sm:text-base rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Very Easy
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
