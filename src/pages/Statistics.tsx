import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Clock, Target, TrendingUp, Calendar, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Statistics() {
  const navigate = useNavigate();
  
  const sessions = useLiveQuery(() => 
    db.studySessions.orderBy('completedAt').reverse().toArray()
  );
  
  const decks = useLiveQuery(() => db.decks.toArray());
  const cards = useLiveQuery(() => db.flashcards.toArray());

  const totalSessions = sessions?.length || 0;
  const totalCardsStudied = sessions?.reduce((sum, s) => sum + s.cardsStudied, 0) || 0;
  const totalCorrect = sessions?.reduce((sum, s) => sum + s.correctCount, 0) || 0;
  const totalTime = sessions?.reduce((sum, s) => sum + s.totalTime, 0) || 0;
  const overallAccuracy = totalCardsStudied > 0 ? Math.round((totalCorrect / totalCardsStudied) * 100) : 0;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'spaced': return 'Spaced Repetition';
      case 'typing': return 'Typing';
      case 'quiz': return 'Practice Quiz';
      case 'multiple-choice': return 'Multiple Choice';
      default: return mode;
    }
  };

  const getDeckName = (deckId: number) => {
    return decks?.find(d => d.id === deckId)?.name || 'Unknown Deck';
  };

  // Get sessions from last 7 days
  const last7Days = sessions?.filter(s => {
    const sessionDate = new Date(s.completedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }) || [];

  const streakDays = calculateStreak(sessions || []);

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
            onClick={() => navigate("/")}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Decks
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Statistics</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-card border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalSessions}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Study Sessions</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-card border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalCardsStudied}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Cards Studied</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-card border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{overallAccuracy}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Accuracy</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-card border-border p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{formatTime(totalTime)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Time</p>
            </Card>
          </motion.div>
        </div>

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-gradient-card border-border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{streakDays} day{streakDays !== 1 ? 's' : ''}</p>
                <p className="text-muted-foreground">Current streak</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Sessions</h2>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.slice(0, 10).map((session, idx) => (
                <Card key={session.id} className="bg-gradient-card border-border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{getDeckName(session.deckId)}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{getModeLabel(session.mode)}</span>
                        <span>•</span>
                        <span>{session.cardsStudied} cards</span>
                        <span>•</span>
                        <span>{formatTime(session.totalTime)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-primary">
                        {session.cardsStudied > 0 ? Math.round((session.correctCount / session.cardsStudied) * 100) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gradient-card border-border p-8 text-center">
              <p className="text-muted-foreground">No study sessions yet. Start studying to see your progress!</p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function calculateStreak(sessions: { completedAt: Date }[]): number {
  if (sessions.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const studyDays = new Set<string>();
  sessions.forEach(s => {
    const date = new Date(s.completedAt);
    date.setHours(0, 0, 0, 0);
    studyDays.add(date.toISOString());
  });
  
  let streak = 0;
  const checkDate = new Date(today);
  
  // Check if studied today
  if (!studyDays.has(checkDate.toISOString())) {
    // Check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    if (!studyDays.has(checkDate.toISOString())) {
      return 0;
    }
  }
  
  // Count consecutive days
  while (studyDays.has(checkDate.toISOString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
}