import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Decks from "./pages/Decks";
import DeckDetails from "./pages/DeckDetails";
import Study from "./pages/Study";
import TypingStudy from "./pages/TypingStudy";
import QuizStudy from "./pages/QuizStudy";
import MultipleChoiceStudy from "./pages/MultipleChoiceStudy";
import ShooterGame from "./pages/ShooterGame";
import SnakeGame from "./pages/SnakeGame";
import TetrisGame from "./pages/TetrisGame";
import SpeakItStudy from "./pages/SpeakItStudy";
import Statistics from "./pages/Statistics";
import AIAssistant from "./pages/AIAssistant";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { syncAllFromFirestore } from "@/lib/sync";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}



function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const synced = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && !synced.current) {
      synced.current = true;
      syncAllFromFirestore(user.uid).catch(console.error);
    }
    if (!user) {
      synced.current = false;
    }
  }, [user]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={user ? <Navigate to="/decks" replace /> : <Auth />} />
        <Route path="/decks" element={<ProtectedRoute><Decks /></ProtectedRoute>} />
        <Route path="/deck/:deckId" element={<ProtectedRoute><DeckDetails /></ProtectedRoute>} />
        <Route path="/study/:deckId" element={<ProtectedRoute><Study /></ProtectedRoute>} />
        <Route path="/typing-study/:deckId" element={<ProtectedRoute><TypingStudy /></ProtectedRoute>} />
        <Route path="/quiz/:deckId" element={<ProtectedRoute><QuizStudy /></ProtectedRoute>} />
        <Route path="/multiple-choice/:deckId" element={<ProtectedRoute><MultipleChoiceStudy /></ProtectedRoute>} />
        <Route path="/shooter/:deckId" element={<ProtectedRoute><ShooterGame /></ProtectedRoute>} />
        <Route path="/snake/:deckId" element={<ProtectedRoute><SnakeGame /></ProtectedRoute>} />
        <Route path="/tetris/:deckId" element={<ProtectedRoute><TetrisGame /></ProtectedRoute>} />
        <Route path="/speak-it/:deckId" element={<ProtectedRoute><SpeakItStudy /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
