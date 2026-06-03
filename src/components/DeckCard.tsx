import { Card } from "@/components/ui/card";
import { Deck } from "@/lib/db";
import { BookOpen, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface DeckCardProps {
  deck: Deck;
  cardCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DeckCard({ deck, cardCount, onSelect, onEdit, onDelete }: DeckCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-glow cursor-pointer group"
        onClick={onSelect}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {deck.name}
                </h3>
                <p className="text-sm text-muted-foreground">{cardCount} cards</p>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {deck.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {deck.description}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
