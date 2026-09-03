import { Flashcard } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakFrench } from "@/lib/tts";
import { toast } from "sonner";

interface FlashcardViewProps {
  card: Flashcard;
  onFlip?: () => void;
  isFlipped: boolean;
}

export function FlashcardView({ card, onFlip, isFlipped }: FlashcardViewProps) {
  return (
    <div
      className="relative w-full h-full mx-auto cursor-pointer"
      onClick={onFlip}
      style={{
        perspective: '1500px',
      }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.7,
          ease: [0.43, 0.13, 0.23, 0.96],
          type: "spring",
          stiffness: 80,
          damping: 15
        }}
      >
        {/* Front side */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
          animate={{
            scale: isFlipped ? 0.95 : 1,
            opacity: isFlipped ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-card border-border shadow-glow hover:shadow-[0_0_50px_hsl(var(--primary)/0.3)] p-6 sm:p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.1),transparent_50%)]" />

            <div className="relative z-10 text-center w-full flex-1 overflow-y-auto px-2 flex flex-col justify-center">
              <motion.div
                className="mb-4 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Question</span>
              </motion.div>

              {card.imageUrl && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  src={card.imageUrl}
                  alt="Flashcard"
                  className="max-w-full max-h-32 sm:max-h-48 mx-auto mb-4 sm:mb-6 rounded-xl shadow-lg"
                />
              )}

              <motion.p
                className="text-xl sm:text-2xl md:text-4xl font-semibold text-foreground leading-relaxed px-4 sm:px-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {card.front}
              </motion.p>
            </div>

            <motion.div
              className="absolute bottom-4 sm:bottom-6 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span>Click to reveal answer</span>
            </motion.div>
          </Card>
        </motion.div>

        {/* Back side */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            rotateY: 180
          }}
          animate={{
            scale: isFlipped ? 1 : 0.95,
            opacity: isFlipped ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-card border-border shadow-glow hover:shadow-[0_0_50px_hsl(var(--primary)/0.3)] p-6 sm:p-8 h-full flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--accent)/0.1),transparent_50%)]" />

            <div className="relative z-10 text-center w-full flex-1 overflow-y-auto px-2 flex flex-col justify-center">
              <motion.div
                className="mb-4 sm:mb-6 inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent/10 border border-accent/20"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">Answer</span>
              </motion.div>

              <motion.p
                className="text-xl sm:text-2xl md:text-4xl font-semibold text-foreground leading-relaxed px-4 sm:px-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {card.back}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex gap-2 justify-center mt-6 sm:mt-8">
                  {/* English TTS - Show for English-looking text or default */}
                  {/[a-zA-Z]/.test(card.back) && (
                    <Button
                      variant="ghost"
                      size="lg"
                      className="hover:bg-accent/10 hover:text-accent hover:scale-110 transition-all duration-300 rounded-full shadow-md hover:shadow-glow"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Dynamic import to avoid circular dep issues if any, or just direct import
                        const { speakEnglish } = await import("@/lib/tts");
                        const result = await speakEnglish(card.back);
                        if (!result.hasEnglishVoice) {
                          toast.error("English voice not detected");
                        }
                      }}
                    >
                      <Volume2 className="w-6 h-6 mr-2" />
                      <span className="font-medium">English</span>
                    </Button>
                  )}

                  {/* French TTS - Keep as requested, but maybe check if it looks French? 
                      User said "keep the french tts don't touch it", but also "if a card have both... show both".
                      We'll just show it. Or stick to user request strictly.
                      "keep the french tts don't touch it" implies leaving the existing button? 
                      But I should probably distinct them.
                  */}
                  <Button
                    variant="ghost"
                    size="lg"
                    className="hover:bg-accent/10 hover:text-accent hover:scale-110 transition-all duration-300 rounded-full shadow-md hover:shadow-glow"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const result = await speakFrench(card.back);
                      if (!result.hasFrenchVoice) {
                        toast.error("French voice not detected", {
                          description: "If you installed French, please restart your browser completely (close all tabs). On Windows: Settings → Time & Language → Speech → Add voices → French",
                          duration: 10000,
                        });
                      }
                    }}
                  >
                    <Volume2 className="w-6 h-6 mr-2" />
                    <span className="font-medium">Français</span>
                  </Button>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-4 sm:bottom-6 text-xs sm:text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Click to flip back
            </motion.div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
