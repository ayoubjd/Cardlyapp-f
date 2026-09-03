import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { addDeck, updateDeck, deleteDeck } from "@/lib/sync";
import { DeckCard } from "@/components/DeckCard";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Decks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<any>(null);
  const [deckName, setDeckName] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [deckType, setDeckType] = useState<'standard' | 'one-sided'>('standard');

  const decks = useLiveQuery(() => db.decks.toArray());
  const allFlashcards = useLiveQuery(() => db.flashcards.toArray());

  const getCardCount = (deckId: number) => {
    return allFlashcards?.filter((card) => card.deckId === deckId).length || 0;
  };

  const handleCreateDeck = async () => {
    if (!deckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingDeck) {
        await updateDeck(editingDeck.id!, {
          name: deckName,
          description: deckDescription,
        });
        toast({
          title: "Success",
          description: "Deck updated successfully",
        });
      } else {
        await addDeck({
          name: deckName,
          description: deckDescription,
          createdAt: new Date(),
          category: 'custom',
          deckType: deckType
        });
        toast({
          title: "Success",
          description: "Deck created successfully",
        });
      }
      setIsDialogOpen(false);
      setDeckName("");
      setDeckDescription("");
      setDeckType("standard");
      setEditingDeck(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save deck",
        variant: "destructive",
      });
    }
  };

  const handleEditDeck = (deck: any) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setDeckDescription(deck.description || "");
    setIsDialogOpen(true);
  };

  const handleDeleteDeck = async (deckId: number) => {
    if (confirm("Are you sure you want to delete this deck and all its cards?")) {
      try {
        await deleteDeck(deckId);
        toast({
          title: "Success",
          description: "Deck deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete deck",
          variant: "destructive",
        });
      }
    }
  };

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
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">My Decks</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Create and study flashcards for any subject. Learn languages through fun games: Shooter, Snake, Tetris, Speak It.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/ai")}
                variant="outline"
                className="border-border text-foreground hover:bg-muted w-full sm:w-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                AI Assistant
              </Button>
              <Button
                onClick={() => {
                  setEditingDeck(null);
                  setDeckName("");
                  setDeckDescription("");
                  setDeckType("standard");
                  setIsDialogOpen(true);
                }}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Deck
              </Button>
            </div>
          </div>
        </motion.div>

        {decks && decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <DeckCard
                key={deck.id}
                deck={deck}
                cardCount={getCardCount(deck.id!)}
                onSelect={() => navigate(`/deck/${deck.id}`)}
                onEdit={() => handleEditDeck(deck)}
                onDelete={() => handleDeleteDeck(deck.id!)}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No decks yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first deck to start learning
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Deck
            </Button>
          </motion.div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingDeck ? "Edit Deck" : "Create New Deck"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-foreground">
                Deck Name
              </Label>
              <Input
                id="name"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g., My Biology Notes"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-foreground">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={deckDescription}
                onChange={(e) => setDeckDescription(e.target.value)}
                placeholder="What will you learn?"
                className="bg-background border-border text-foreground"
              />
            </div>
            {!editingDeck && (
              <div>
                <Label className="text-foreground mb-2 block">
                  Deck Type
                </Label>
                <Select value={deckType} onValueChange={(v: any) => setDeckType(v)}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Select Deck Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Front & Back)</SelectItem>
                    <SelectItem value="one-sided">One-Sided (Front Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeck}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {editingDeck ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
