import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { addFlashcard, updateFlashcard, deleteFlashcard, deleteDeck } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Play, Trash2, Edit, Upload, Download, Keyboard, ListChecks, CircleDot, Image, X, Gamepad2, LayoutGrid, Volume2 } from "lucide-react";
import { importFromCSV, importFromExcel, exportToCSV, exportToExcel } from "@/lib/importExport";
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
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function DeckDetails() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
  const cards = useLiveQuery(
    () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
    [deckId]
  );

  const handleSaveCard = async () => {
    if (!front.trim() || (deck?.deckType !== 'one-sided' && !back.trim())) {
      toast({
        title: "Error",
        description: deck?.deckType === 'one-sided' ? "Please fill in the card text" : "Please fill in both sides of the card",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCard) {
        await updateFlashcard(editingCard.id!, {
          front,
          back,
          imageUrl: imageUrl || undefined,
        });
        toast({ title: "Success", description: "Card updated" });
      } else {
        await addFlashcard({
          deckId: Number(deckId),
          front,
          back,
          imageUrl: imageUrl || undefined,
          createdAt: new Date(),
          ease: 2.5,
          interval: 0,
          repetitions: 0,
        });
        toast({ title: "Success", description: "Card created" });
      }
      setIsDialogOpen(false);
      setFront("");
      setBack("");
      setImageUrl("");
      setEditingCard(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save card",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (confirm("Delete this card?")) {
      try {
        await deleteFlashcard(cardId);
        toast({ title: "Success", description: "Card deleted" });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete card",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditCard = (card: any) => {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setImageUrl(card.imageUrl || "");
    setIsDialogOpen(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let importedCards;
      if (file.name.endsWith('.csv')) {
        importedCards = await importFromCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importedCards = await importFromExcel(file);
      } else {
        toast({
          title: "Error",
          description: "Please upload a CSV or Excel file",
          variant: "destructive",
        });
        return;
      }

      for (const card of importedCards) {
        await addFlashcard({
          deckId: Number(deckId),
          front: card.front,
          back: card.back,
          imageUrl: card.imageUrl,
          createdAt: new Date(),
          ease: 2.5,
          interval: 0,
          repetitions: 0,
        });
      }

      toast({
        title: "Success",
        description: `Imported ${importedCards.length} cards`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import cards",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportToCSV(Number(deckId), deck?.name || 'deck');
      toast({ title: "Success", description: "Exported to CSV" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(Number(deckId), deck?.name || 'deck');
      toast({ title: "Success", description: "Exported to Excel" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export",
        variant: "destructive",
      });
    }
  };

  if (!deck) return null;

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
            onClick={() => navigate("/decks")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Decks
          </Button>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {deck.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {cards?.length || 0} card{cards?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={() => navigate(`/study/${deckId}`)}
                disabled={!cards || cards.length === 0}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow flex-1 sm:flex-none"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Study
              </Button>
              <Button
                onClick={() => navigate(`/typing-study/${deckId}`)}
                disabled={!cards || cards.length === 0 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <Keyboard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Type
              </Button>
              <Button
                onClick={() => navigate(`/quiz/${deckId}`)}
                disabled={!cards || cards.length === 0 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Quiz
              </Button>
              <Button
                onClick={() => navigate(`/multiple-choice/${deckId}`)}
                disabled={!cards || cards.length < 4 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <CircleDot className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Choice
              </Button>
              <Button
                onClick={() => navigate(`/shooter/${deckId}`)}
                disabled={!cards || cards.length < 3 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-green-500/50 text-green-600 hover:bg-green-500/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Shooter
              </Button>
              <Button
                onClick={() => navigate(`/snake/${deckId}`)}
                disabled={!cards || cards.length < 3 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-green-500/50 text-green-600 hover:bg-green-500/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Snake
              </Button>
              <Button
                onClick={() => navigate(`/tetris/${deckId}`)}
                disabled={!cards || cards.length < 3 || deck?.deckType === 'one-sided'}
                variant="outline"
                className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10 flex-1 sm:flex-none disabled:opacity-50"
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Tetris
              </Button>
              <Button
                onClick={() => navigate(`/speak-it/${deckId}`)}
                disabled={!cards || cards.length === 0}
                variant="outline"
                className="border-purple-500/50 text-purple-600 hover:bg-purple-500/10 flex-1 sm:flex-none"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Speak It
              </Button>
              <Button
                onClick={() => {
                  setEditingCard(null);
                  setFront("");
                  setBack("");
                  setImageUrl("");
                  setIsDialogOpen(true);
                }}
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={!cards || cards.length === 0}
                variant="outline"
                className="border-border text-foreground hover:bg-muted"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {!cards || cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-muted-foreground mb-6">
              No cards in this deck yet
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Card
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gradient-card border-border p-6 hover:border-primary/50 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs text-primary font-medium">
                      Card #{index + 1}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCard(card)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCard(card.id!)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Front</p>
                      <p className="text-sm text-foreground line-clamp-2">
                        {card.front}
                      </p>
                    </div>
                    {card.imageUrl && (
                      <img
                        src={card.imageUrl}
                        alt="Card"
                        className="max-h-16 rounded-md"
                      />
                    )}
                    {deck?.deckType !== 'one-sided' && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Back</p>
                        <p className="text-sm text-foreground line-clamp-2">
                          {card.back}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleImport}
        className="hidden"
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCard ? "Edit Card" : "Create New Card"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="front" className="text-foreground">
                Front
              </Label>
              <Textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Question or prompt"
                className="bg-background border-border text-foreground"
              />
            </div>
            {deck?.deckType !== 'one-sided' && (
              <div>
                <Label htmlFor="back" className="text-foreground">
                  Back
                </Label>
                <Textarea
                  id="back"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Answer or definition"
                  className="bg-background border-border text-foreground"
                />
              </div>
            )}
            <div>
              <Label className="text-foreground">Image (optional)</Label>
              {imageUrl ? (
                <div className="relative mt-2">
                  <img
                    src={imageUrl}
                    alt="Card image"
                    className="max-h-32 rounded-lg border border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setImageUrl("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2 border-dashed border-border text-muted-foreground hover:text-foreground"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              )}
            </div>
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
              onClick={handleSaveCard}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              {editingCard ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
