import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Brain, LogIn, UserPlus, LogOut, User,
  Gamepad2, Volume2,
  Upload, Download, Languages, Sparkles, Star, ArrowRight, Cloud,
  GraduationCap, MessageSquare, Wand2, ListPlus,
} from "lucide-react";
import { motion } from "framer-motion";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { logOut } from "@/lib/firebase";

/* ─── Tiny SVG previews for each mode ─── */

function PreviewCard() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="20" y="15" width="160" height="90" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      <rect x="35" y="30" width="60" height="16" rx="4" fill="hsl(var(--primary)/0.25)" />
      <rect x="105" y="30" width="60" height="16" rx="4" fill="hsl(var(--muted-foreground)/0.15)" />
      <rect x="35" y="55" width="130" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.12)" />
      <rect x="35" y="70" width="100" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.12)" />
      <text x="100" y="105" textAnchor="middle" fill="hsl(var(--muted-foreground)/0.4)" fontSize="9" fontFamily="Arial">Tap to flip</text>
      <path d="M160 65 L170 75 L180 65" stroke="hsl(var(--primary)/0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M170 75 L170 35" stroke="hsl(var(--primary)/0.35)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    </svg>
  );
}

function PreviewTyping() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="20" y="12" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      <rect x="35" y="25" width="130" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.15)" />
      <rect x="35" y="40" width="80" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.1)" />
      <rect x="20" y="72" width="160" height="34" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.4)" strokeWidth="1.5" />
      <text x="35" y="93" fill="hsl(var(--muted-foreground)/0.5)" fontSize="11" fontFamily="Arial">Type your answer...</text>
      <rect x="140" y="76" width="28" height="26" rx="6" fill="hsl(var(--primary)/0.2)" />
      <text x="154" y="93" textAnchor="middle" fill="hsl(var(--primary)/0.7)" fontSize="14" fontFamily="Arial">OK</text>
    </svg>
  );
}

function PreviewQuiz() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="155" y="10" width="35" height="18" rx="5" fill="hsl(var(--primary)/0.2)" />
      <text x="172" y="23" textAnchor="middle" fill="hsl(var(--primary)/0.7)" fontSize="9" fontFamily="Arial" fontWeight="bold">45s</text>
      <rect x="20" y="36" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      <rect x="35" y="50" width="130" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.15)" />
      <rect x="35" y="65" width="90" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.1)" />
      <circle cx="100" cy="112" r="6" fill="hsl(var(--primary)/0.12)" />
      <circle cx="120" cy="112" r="6" fill="hsl(var(--primary)/0.12)" />
      <circle cx="140" cy="112" r="6" fill="hsl(var(--primary)/0.12)" />
      <circle cx="100" cy="112" r="4" fill="hsl(var(--primary)/0.5)" />
    </svg>
  );
}

function PreviewMC() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="20" y="10" width="160" height="20" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.2)" strokeWidth="1" />
      <text x="100" y="24" textAnchor="middle" fill="hsl(var(--muted-foreground)/0.5)" fontSize="9" fontFamily="Arial">What is the capital of France?</text>
      <rect x="20" y="36" width="160" height="16" rx="6" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.3)" strokeWidth="1" />
      <circle cx="30" cy="44" r="4" fill="hsl(var(--primary)/0.5)" />
      <text x="44" y="48" fill="hsl(var(--foreground)/0.7)" fontSize="9" fontFamily="Arial">Paris</text>
      <rect x="20" y="56" width="160" height="16" rx="6" fill="hsl(var(--card))" />
      <circle cx="30" cy="64" r="4" fill="hsl(var(--muted-foreground)/0.2)" />
      <text x="44" y="68" fill="hsl(var(--muted-foreground)/0.5)" fontSize="9" fontFamily="Arial">London</text>
      <rect x="20" y="76" width="160" height="16" rx="6" fill="hsl(var(--card))" />
      <circle cx="30" cy="84" r="4" fill="hsl(var(--muted-foreground)/0.2)" />
      <text x="44" y="88" fill="hsl(var(--muted-foreground)/0.5)" fontSize="9" fontFamily="Arial">Berlin</text>
      <rect x="20" y="96" width="160" height="16" rx="6" fill="hsl(var(--card))" />
      <circle cx="30" cy="104" r="4" fill="hsl(var(--muted-foreground)/0.2)" />
      <text x="44" y="108" fill="hsl(var(--muted-foreground)/0.5)" fontSize="9" fontFamily="Arial">Madrid</text>
    </svg>
  );
}

function PreviewShooter() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <circle cx="60" cy="20" r="5" fill="hsl(var(--primary)/0.15)" />
      <circle cx="140" cy="15" r="3" fill="hsl(var(--muted-foreground)/0.1)" />
      <circle cx="30" cy="40" r="4" fill="hsl(var(--muted-foreground)/0.12)" />
      <rect x="30" y="30" width="60" height="22" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--destructive)/0.4)" strokeWidth="1" />
      <text x="60" y="44" textAnchor="middle" fill="hsl(var(--destructive)/0.7)" fontSize="8" fontFamily="Arial" fontWeight="bold">Bonjour</text>
      <rect x="120" y="40" width="60" height="22" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.4)" strokeWidth="1" />
      <text x="150" y="54" textAnchor="middle" fill="hsl(var(--primary)/0.7)" fontSize="8" fontFamily="Arial" fontWeight="bold">Hello</text>
      {/* Ship */}
      <path d="M90 98 L100 108 L110 98 Z" fill="hsl(var(--primary)/0.6)" />
      <path d="M85 98 L115 98" stroke="hsl(var(--primary)/0.4)" strokeWidth="1.5" />
      {/* Laser */}
      <line x1="100" y1="98" x2="100" y2="70" stroke="hsl(var(--primary)/0.5)" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="100" cy="68" r="3" fill="hsl(var(--primary)/0.6)" />
    </svg>
  );
}

function PreviewSnake() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="40" y="10" width="120" height="100" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      {/* Grid lines */}
      {[0,1,2,3,4].map(i => <line key={`hg${i}`} x1={40} y1={30+i*20} x2={160} y2={30+i*20} stroke="hsl(var(--border)/0.3)" strokeWidth="0.5" />)}
      {[0,1,2,3,4].map(i => <line key={`vg${i}`} x1={60+i*20} y1={10} x2={60+i*20} y2={110} stroke="hsl(var(--border)/0.3)" strokeWidth="0.5" />)}
      {/* Snake */}
      <rect x="100" y="70" width="18" height="18" rx="3" fill="hsl(var(--primary)/0.15)" stroke="hsl(var(--primary)/0.4)" strokeWidth="1" />
      <rect x="82" y="70" width="18" height="18" rx="3" fill="hsl(var(--primary)/0.2)" stroke="hsl(var(--primary)/0.35)" strokeWidth="1" />
      <rect x="64" y="70" width="18" height="18" rx="3" fill="hsl(var(--primary)/0.25)" stroke="hsl(var(--primary)/0.3)" strokeWidth="1" />
      <rect x="46" y="70" width="18" height="18" rx="3" fill="hsl(var(--primary)/0.3)" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      <rect x="46" y="52" width="18" height="18" rx="3" fill="hsl(var(--primary)/0.35)" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      {/* Food */}
      <circle cx="145" cy="45" r="5" fill="hsl(var(--destructive)/0.6)" />
      <text x="145" y="47" textAnchor="middle" fill="white" fontSize="5" fontFamily="Arial">🍎</text>
      <text x="100" y="120" textAnchor="middle" fill="hsl(var(--muted-foreground)/0.3)" fontSize="8" fontFamily="Arial">3  |  0</text>
    </svg>
  );
}

function PreviewTetris() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="15" y="10" width="100" height="100" rx="4" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      {/* Stacked blocks */}
      <rect x="20" y="60" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.2)" stroke="hsl(var(--primary)/0.25)" strokeWidth="0.5" />
      <rect x="38" y="60" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.2)" stroke="hsl(var(--primary)/0.25)" strokeWidth="0.5" />
      <rect x="56" y="60" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.2)" stroke="hsl(var(--primary)/0.25)" strokeWidth="0.5" />
      <rect x="56" y="78" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.25)" stroke="hsl(var(--primary)/0.3)" strokeWidth="0.5" />
      <rect x="74" y="78" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.25)" stroke="hsl(var(--primary)/0.3)" strokeWidth="0.5" />
      <rect x="92" y="78" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.25)" stroke="hsl(var(--primary)/0.3)" strokeWidth="0.5" />
      {/* Falling piece */}
      <rect x="38" y="30" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary)/0.5)" strokeWidth="1" />
      <rect x="56" y="30" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary)/0.5)" strokeWidth="1" />
      <rect x="74" y="30" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary)/0.5)" strokeWidth="1" />
      <rect x="56" y="12" width="18" height="18" rx="2" fill="hsl(var(--primary)/0.4)" stroke="hsl(var(--primary)/0.5)" strokeWidth="1" />
      {/* Next piece hint */}
      <rect x="130" y="15" width="55" height="45" rx="6" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" />
      <text x="157" y="28" textAnchor="middle" fill="hsl(var(--muted-foreground)/0.4)" fontSize="7" fontFamily="Arial">NEXT</text>
      <rect x="140" y="33" width="12" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="152" y="33" width="12" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="164" y="33" width="12" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="152" y="45" width="12" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <text x="157" y="106" textAnchor="middle" fill="hsl(var(--muted-foreground)/0.4)" fontSize="7" fontFamily="Arial">Score: 0</text>
    </svg>
  );
}

function PreviewSpeakIt() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-28 sm:h-32 rounded-xl" fill="none">
      <rect width="200" height="120" rx="10" fill="hsl(var(--primary)/0.08)" />
      <rect x="20" y="12" width="160" height="50" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary)/0.25)" strokeWidth="1" />
      <rect x="35" y="26" width="130" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.15)" />
      <rect x="35" y="40" width="90" height="10" rx="3" fill="hsl(var(--muted-foreground)/0.1)" />
      {/* Waveform */}
      <rect x="25" y="75" width="4" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="33" y="71" width="4" height="20" rx="2" fill="hsl(var(--primary)/0.4)" />
      <rect x="41" y="68" width="4" height="26" rx="2" fill="hsl(var(--primary)/0.5)" />
      <rect x="49" y="72" width="4" height="18" rx="2" fill="hsl(var(--primary)/0.4)" />
      <rect x="57" y="69" width="4" height="24" rx="2" fill="hsl(var(--primary)/0.5)" />
      <rect x="65" y="74" width="4" height="14" rx="2" fill="hsl(var(--primary)/0.35)" />
      <rect x="73" y="70" width="4" height="22" rx="2" fill="hsl(var(--primary)/0.45)" />
      <rect x="81" y="67" width="4" height="28" rx="2" fill="hsl(var(--primary)/0.55)" />
      <rect x="89" y="73" width="4" height="16" rx="2" fill="hsl(var(--primary)/0.35)" />
      <rect x="97" y="69" width="4" height="24" rx="2" fill="hsl(var(--primary)/0.45)" />
      <rect x="105" y="75" width="4" height="12" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="113" y="71" width="4" height="20" rx="2" fill="hsl(var(--primary)/0.4)" />
      <rect x="121" y="68" width="4" height="26" rx="2" fill="hsl(var(--primary)/0.5)" />
      <rect x="129" y="74" width="4" height="14" rx="2" fill="hsl(var(--primary)/0.35)" />
      <rect x="137" y="70" width="4" height="22" rx="2" fill="hsl(var(--primary)/0.45)" />
      <rect x="145" y="76" width="4" height="10" rx="2" fill="hsl(var(--primary)/0.25)" />
      <circle cx="100" cy="110" r="6" fill="hsl(var(--primary)/0.12)" />
      <circle cx="100" cy="110" r="3" fill="hsl(var(--primary)/0.4)" />
    </svg>
  );
}

/* ─── Shared components ─── */

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <motion.div className="text-center mb-10 sm:mb-14" {...fadeUp}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4 shadow-glow ring-1 ring-primary/30">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">{title}</h2>
      <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}

function FeatureCard({ preview, title, description, delay = 0 }: {
  preview: React.ReactNode; title: string; description: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      className="group relative bg-gradient-card border border-border rounded-2xl shadow-card hover:shadow-glow transition-all duration-500 hover:-translate-y-1 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">{preview}</div>
      <div className="relative z-10 p-4 sm:p-5 pt-3 sm:pt-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function FeatureIconCard({ icon: Icon, title, description, delay = 0 }: {
  icon: any; title: string; description: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.5 }}
      className="group relative bg-gradient-card border border-border rounded-2xl shadow-card hover:shadow-glow transition-all duration-500 hover:-translate-y-1 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 p-5 sm:p-6 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-primary/15 flex items-center justify-center mb-4 ring-1 ring-primary/20">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cta = () => navigate(user ? "/decks" : "/auth");

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Auth Bar ── */}
        <motion.div className="flex justify-end mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                <User className="w-3.5 h-3.5 inline mr-1" />{user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => logOut()} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
                <LogIn className="w-4 h-4 mr-1" /> Sign In
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="border-border text-foreground hover:bg-muted">
                <UserPlus className="w-4 h-4 mr-1" /> Sign Up
              </Button>
            </div>
          )}
        </motion.div>

        {/* ════════════════════════════ HERO ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative text-center py-10 sm:py-16 lg:py-20 mb-10 sm:mb-16 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <Logo size={180} className="w-36 sm:w-44 md:w-[180px]" />
            </motion.div>
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-2 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Cardly
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Learn <span className="text-primary">Smarter</span>
            </motion.p>
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-4 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Master any subject with Cardly — flashcards, interactive games, and smart study modes.
              Your knowledge syncs everywhere — study offline, learn anytime.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button size="lg" onClick={cta} className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow text-base sm:text-lg px-8 py-6 rounded-xl group">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                {user ? "My Decks" : "Get Started"}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/statistics")} className="border-border text-foreground hover:bg-muted text-base sm:text-lg px-8 py-6 rounded-xl">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Statistics
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/ai")} className="border-border text-foreground hover:bg-muted text-base sm:text-lg px-8 py-6 rounded-xl">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                AI Assistant
              </Button>
              <PWAInstallButton />
            </motion.div>
          </div>
        </motion.div>

        {/* ════════════════════════════ STUDY MODES ════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <SectionHeader icon={Brain} title="Study Modes" subtitle="Five powerful ways to review your flashcards and lock in knowledge" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6 max-w-6xl mx-auto">
            <FeatureCard
              preview={<PreviewCard />}
              title="Spaced Repetition"
              description="The classic flip-and-review mode powered by the SM-2 algorithm. See the front, tap to reveal the answer, then rate yourself. Cards you struggle with appear more often — maximizing retention while minimizing study time."
              delay={0}
            />
            <FeatureCard
              preview={<PreviewTyping />}
              title="Typing Practice"
              description="The ultimate active recall test. See the front of the card and type the back exactly from memory. Builds real fluency and exposes weak spots immediately. Supports auto-correct normalization for forgiving matching."
              delay={0.06}
            />
            <FeatureCard
              preview={<PreviewQuiz />}
              title="Quiz Mode"
              description="A rapid-fire quiz experience with a countdown timer for each card. See the question, reveal the answer when ready, then mark yourself correct or wrong. Perfect for quick review sessions when you're short on time."
              delay={0.12}
            />
            <FeatureCard
              preview={<PreviewMC />}
              title="Multiple Choice"
              description="Test yourself with four shuffled answer options per card. Images appear on applicable cards. Pick the right answer from the choices — ideal for building recognition skills and quick recall under pressure."
              delay={0.18}
            />
            <FeatureCard
              preview={<PreviewSpeakIt />}
              title="Speak It"
              description="Train pronunciation and listening. Hear every card read aloud with crystal-clear TTS, then speak your answer. Or use auto-advance mode — the app reads through your entire deck front-to-back non-stop, like a personalized podcast for language immersion."
              delay={0.24}
            />
          </div>
        </section>

        {/* ════════════════════════════ GAME MODES ════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <SectionHeader
            icon={Gamepad2}
            title="Learn Through Games"
            subtitle="Turn studying into an adventure — games work best with language flashcards (vocabulary, phrases, translations) but any deck works. Play your way to fluency and earn SRS progress with every correct answer!"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
            <FeatureCard
              preview={<PreviewShooter />}
              title="Shooter"
              description="Aliens bear your flashcards! The correct answer floats among wrong ones — type it fast to shoot the right enemy. Each correct hit updates your SM-2 score. Wave-based difficulty ramps up as you progress. Ideal for vocabulary and translation drills."
              delay={0}
            />
            <FeatureCard
              preview={<PreviewSnake />}
              title="Snake"
              description="Classic snake meets flashcards. The correct answer is your food — eat it to grow; wrong answers are poison. Fast-paced vocabulary drilling with a nostalgic twist. Best with language pairs (front = word in language A, back = translation in language B)."
              delay={0.08}
            />
            <FeatureCard
              preview={<PreviewTetris />}
              title="Tetris"
              description="Flashcards fall as Tetris blocks. Identify the correct answer to clear the row before blocks stack to the top. The quicker you answer, the more room you have. Combines spatial thinking with rapid recall — perfect for verb conjugations and vocabulary sets."
              delay={0.16}
            />
          </div>
        </section>

        {/* ════════════════════════════ FEATURES GRID ════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <SectionHeader icon={Sparkles} title="Everything You Need" subtitle="Built-in tools to make learning seamless, flexible, and powerful" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            <FeatureIconCard icon={Upload} title="Import from CSV & Excel" delay={0} description="Already have a word list or question bank? Import it instantly. Upload CSV or Excel files and your cards are created in bulk with all fields mapped automatically. Supports front, back, and image columns." />
            <FeatureIconCard icon={Download} title="Export to CSV & Excel" delay={0.06} description="Take your data anywhere. Export any deck to CSV or Excel with one click. Perfect for backing up your work, sharing decks with classmates, or analyzing your flashcard data in a spreadsheet." />
            <FeatureIconCard icon={Volume2} title="Text-to-Speech (TTS)" delay={0.12} description="Hear every card read aloud with natural-sounding browser voices. Tap the speaker button on any card to hear correct pronunciation. Supports English and French out of the box — install additional language voices in your OS settings to unlock any language." />
            <FeatureIconCard icon={Languages} title="Multi-Language Voice Support" delay={0.18} description="Built-in bilingual voice engine reads cards in English (en) and French (fr) using your device's speech synthesis. The app auto-detects available voices — install Arabic, Spanish, German, Japanese, or any other language pack on your system to extend TTS support." />
            <FeatureIconCard icon={Cloud} title="Cloud Sync" delay={0.24} description="Sign in with your account and your decks, flashcards, and study history sync automatically across all your devices via Firestore. Start studying on your phone, continue on your laptop — progress follows you everywhere." />
            <FeatureIconCard icon={Star} title="Spaced Repetition (SM-2)" delay={0.3} description="The proven SM-2 algorithm schedules reviews at the perfect time. Cards you struggle with appear more often; ones you know well are shown less frequently. Maximizes retention while minimizing study time. Used by Anki and SuperMemo." />
          </div>
        </section>

        {/* ════════════════════════════ AI ASSISTANT ════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <SectionHeader
            icon={Wand2}
            title="AI Assistant"
            subtitle="Your flashcard coworker — create decks, generate content, and learn smarter with AI"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
            <FeatureIconCard icon={ListPlus} title="Create Decks from Words" delay={0} description="Give the AI any topic — vocabulary, phrases, concepts, or facts — and it instantly builds a deck with cards. Ask for 'French greetings' or 'Python interview questions' and get a ready-to-study deck in seconds." />
            <FeatureIconCard icon={MessageSquare} title="Explain & Teach Any Topic" delay={0.06} description="Stuck on a concept? Ask the AI to explain it. It can break down complex topics, give examples, and then create flashcards from the explanation so you can review later." />
            <FeatureIconCard icon={Brain} title="Generate Quiz Questions" delay={0.12} description="Turn any subject into a study session. Ask the AI to create flashcards with questions on one side and answers on the other — perfect for test prep, language learning, or mastering new material." />
            <FeatureIconCard icon={Languages} title="Translate & Build Vocab" delay={0.18} description="Need translations? Ask for 'English to Arabic business phrases' or 'Spanish travel vocabulary'. The AI creates bilingual flashcards with the original on the front and translation on the back." />
            <FeatureIconCard icon={Sparkles} title="Create from Existing Content" delay={0.24} description="Paste in text from a lesson, article, or notes and ask the AI to extract the key terms into flashcards. It parses the content and returns organized cards ready to study." />
            <FeatureIconCard icon={BookOpen} title="Add to Any Deck" delay={0.3} description="Already have a deck? The AI can add new cards to it. Just ask 'Add these words to my Spanish deck' and the new cards are appended directly — no manual copy-paste needed." />
          </div>

          {/* ── AI Language Practice ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mt-8 p-6 sm:p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden max-w-3xl mx-auto text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_60%)]" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-primary/30">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Practice Languages by Chatting</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed mb-5">
                Switch to <strong className="text-foreground">Normal Chat</strong> mode and have a real conversation in your target language.
                The AI will correct your mistakes, suggest better phrasing, and keep the conversation flowing — like a patient tutor who's always available.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/ai")}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow px-6 py-5 rounded-xl"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Try AI Language Tutor
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/ai")}
              className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow text-base sm:text-lg px-8 py-6 rounded-xl"
            >
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Open AI Assistant
            </Button>
          </motion.div>
        </section>

        {/* ════════════════════════════ BOTTOM CTA ════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative text-center py-12 sm:py-16 rounded-3xl bg-gradient-to-b from-primary/10 via-transparent to-transparent border border-primary/10 mb-8 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="relative z-10">
            <Star className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">Ready to learn something new?</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto px-4">
              Create your first deck, pick a study mode, or jump into a game. Your journey starts with one card.
            </p>
            <Button size="lg" onClick={cta} className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow text-base sm:text-lg px-8 py-6 rounded-xl">
              {user ? <><BookOpen className="w-5 h-5 mr-2" /> Go to My Decks</> : <><UserPlus className="w-5 h-5 mr-2" /> Create Free Account</>}
            </Button>
          </div>
        </motion.div>

        {/* ── Footer ── */}
        <motion.div className="text-center pb-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-xs text-muted-foreground/60">Cardly — Learn anything, anywhere.</p>
        </motion.div>

      </div>
    </div>
  );
};

export default Index;
