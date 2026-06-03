# 🃏 Cardly — The Ultimate Language Learning App

> **Your all-in-one flashcard platform with AI tutoring, 5 study modes, 3 arcade games, cloud sync, and more.**
>
> Built for learners who want fluency, not just memorization.

---

## 📋 Table of Contents

1. [🎯 Core Concept](#-core-concept)
2. [📖 Study Modes (4 Ways to Review)](#-study-modes-4-ways-to-review)
3. [🎮 Game Modes (3 Arcade Games)](#-game-modes-3-arcade-games)
4. [🤖 AI Assistant](#-ai-assistant)
5. [🗣️ Text-to-Speech (TTS)](#️-text-to-speech-tts)
6. [🌐 Import & Export](#-import--export)
7. [☁️ Cloud Sync & Auth](#️-cloud-sync--auth)
8. [📊 Statistics & Streaks](#-statistics--streaks)
9. [📦 Pre-Installed Decks](#-pre-installed-decks)
10. [📱 Progressive Web App (PWA)](#-progressive-web-app-pwa)
11. [🎨 Design & UX](#-design--ux)
12. [🔧 Tech Stack](#-tech-stack)

---

## 🎯 Core Concept

Cardly is a **fully offline-capable, cross-device flashcard app** purpose-built for language learners. It combines:

- **🧠 Spaced Repetition** (SM-2 algorithm — the same one behind Anki and SuperMemo)
- **🎮 3 arcade games** that turn vocabulary drills into fun
- **🤖 An AI language tutor** powered by Google Gemini
- **🗣️ Text-to-speech** in any language your device supports
- **☁️ Cloud sync** via Firebase Firestore
- **📊 Smart analytics** with study streaks and accuracy tracking

It's a **complete language learning ecosystem** — not just flashcards, but a full interactive experience that keeps learners coming back every day.

---

## 📖 Study Modes (5 Ways to Review)

### 1️⃣ Spaced Repetition (Classic Flip)

| Feature | Details |
|---------|---------|
| **Algorithm** | SM-2 (same as Anki / SuperMemo) |
| **Mechanic** | See the front → tap to reveal the back → rate yourself 0–5 |
| **Adaptive** | Cards you struggle with appear more often |
| **Best for** | Building long-term retention, daily review habit |

The SM-2 algorithm tracks three metrics per card:
- **Ease factor** (1.3–∞) — adjusts based on your recall quality
- **Interval** (days until next review) — grows exponentially for known cards
- **Repetitions** — count of consecutive correct recalls

> 💡 *Perfect for: Daily vocabulary review, grammar rules, kanji practice*

### 2️⃣ Typing Practice (Active Recall)

| Feature | Details |
|---------|---------|
| **Mechanic** | See the front → type the answer from memory |
| **Matching** | Auto-correct normalization (forgiving comparison) |
| **Best for** | Spelling, writing systems, verb conjugations |

This is the **ultimate test of true recall**. Typing forces the brain to retrieve the exact spelling and structure — no half-remembering allowed. The auto-correct normalization handles minor typos and capitalization differences so learners aren't punished for small mistakes.

> 💡 *Perfect for: Spelling practice, kanji writing, verb forms, sentence construction*

### 3️⃣ Quiz Mode (Timed Practice)

| Feature | Details |
|---------|---------|
| **Mechanic** | Each card has a visible countdown timer |
| **Flow** | See question → reveal answer → mark correct/wrong |
| **Best for** | Quick review sessions, building speed |

A **rapid-fire experience** that builds recall speed. The timer adds healthy pressure without being punishing — perfect for those "I have 5 minutes" moments.

> 💡 *Perfect for: Quick warm-ups, last-minute test prep, speed drills*

### 4️⃣ Multiple Choice (Recognition)

| Feature | Details |
|---------|---------|
| **Options** | 4 shuffled choices per card (1 correct, 3 wrong) |
| **Images** | Cards with `imageUrl` show the image in the question |
| **Best for** | Recognition practice, beginners, image-based learning |

The **gentlest study mode** — ideal for absolute beginners or when energy is low. Wrong answers are randomly pulled from other cards in the same deck, so every session tests slightly different distractors.

> 💡 *Perfect for: First exposure to new words, image-based vocabulary, low-energy days*

### 5️⃣ 🎤 Speak It — "Voice Training"

| Feature | Details |
|---------|---------|
| **Mechanic** | Card is read aloud via browser TTS → you respond |
| **Auto-Advance** | Plays through your **entire deck non-stop** — front then back, card after card, like a personalized podcast |
| **Per-side TTS** | **Separate language dropdown for Front and Back** |
| **Auto-detect** | Default "Auto-detect" per side intelligently detects the language |
| **Side badges** | Shows detected language or manually selected language per side |
| **Language detection** | Built-in heuristic detector (English, French, Spanish, German, Japanese, Chinese, Arabic, Russian, Hebrew) |
| **Best for** | Pronunciation training, listening comprehension, passive immersion |

**The most unique language feature**. Each card side can use a **different TTS voice and language**:

- **Front** might be English (auto-detect), using an English voice
- **Back** might be French (manually set), using a French voice

The two independent dropdowns let learners configure the exact experience they want. Language badges show whether each side is using auto-detected or manually selected voice.

**Auto-Advance mode** reads every card aloud one after another — no tapping, no clicking. Perfect for listening while commuting, cooking, or winding down.

> 💡 *Language learning twist: Listen to the front in your target language, speak the answer, then check. Or let Auto-Advance play through a full deck as passive immersion.*

---

## 🎮 Game Modes (3 Arcade Games)

Games work with **any deck** but truly shine with **language flashcards** (front = word in target language, back = translation). Every correct answer updates the SM-2 spaced repetition stats — so playing games IS studying.

### 1️⃣ 🚀 Shooter — "Flashcard Invaders"

| Feature | Details |
|---------|---------|
| **Genre** | Space shooter (like Space Invaders) |
| **Mechanic** | Enemies fall with words on them — type the correct answer to shoot |
| **Difficulty** | Scales with score (more enemies, faster spawns, higher speed) |
| **Enemy movement** | Sine-wave zigzag + homing patterns |
| **Visuals** | Custom canvas rendering with particle explosions, engine glow, laser beams, diabolic enemy horns |
| **Controls** | Arrow keys / A D to move, Space / click to shoot, or type the word shown on the enemy |
| **SRS** | Correct = Good (quality 4), Wrong = Fail (quality 1) |

Shooter is the **most exciting game mode**. Enemies descend with words — the correct answer is among them, and you must shoot it before it reaches you. Each correct hit fires a laser that destroys the enemy with a particle explosion. As your score climbs, difficulty ramps up automatically.

> 💡 *Language learning twist: Front of card appears as a label, enemies show possible answers in the target language. You must identify and shoot the right translation.*

### 2️⃣ 🐍 Snake — "Vocabulary Snake"

| Feature | Details |
|---------|---------|
| **Genre** | Classic snake |
| **Mechanic** | Correct answer is food (eat it to grow); wrong answers are poison |
| **Visuals** | Grid-based arena with colored cells |
| **SRS** | Updates SM-2 stats on each answer |

The **nostalgic classic** meets flashcards. The snake grows longer with every correct answer, and the screen fills with food/poison options. Fast-paced, intuitive, and highly addictive.

> 💡 *Language learning twist: Food items display translations — eat the right one to grow. Great for vocabulary pairs.*

### 3️⃣ 🧱 Tetris — "Flashcard Tetris"

| Feature | Details |
|---------|---------|
| **Genre** | Tetris |
| **Mechanic** | Flashcards fall as Tetris blocks — answer correctly to clear the row |
| **Flow** | Quick answers = more space; slow answers = blocks stack up |
| **Visuals** | Classic Tetris grid with flashcard text on falling blocks |
| **SRS** | Updates SM-2 stats on each answer |

**Tetris meets flashcards**. Each falling block shows a flashcard front. Answer correctly and the block clears. Let it stack to the top and it's game over. The quicker you answer, the more space you have — building both speed and knowledge.

> 💡 *Language learning twist: Perfect for verb conjugations — each falling block shows a verb in the target language, type the correct conjugation to clear it.*

## 🤖 AI Assistant

The AI Assistant is a **Google Gemini-powered language tutor** built directly into the app. It offers **two modes**:

### 🎯 Mode 1: Create Decks

Ask for any topic and the AI instantly builds a complete flashcard deck:

```
"Create 10 Spanish food vocabulary cards"
"Make a deck about French verbs"
"Generate English to Arabic business phrases"
```

The AI responds with a structured deck including:
- **Deck name** (auto-extracted from the first line)
- **Flashcard pairs** (parsed from natural text using pattern matching)

Each AI response with deck data shows two buttons:
- **"Create Deck"** — saves as a new deck with all cards
- **"Add to existing deck"** — appends cards to a deck you already have

### 💬 Mode 2: Normal Chat (Language Tutor)

Switch to **Normal Chat** mode to have a real conversation. The AI becomes a **patient language tutor** that:

- Corrects your grammar and spelling mistakes
- Suggests more natural phrasing
- Keeps the conversation flowing naturally
- Answers questions about grammar, vocabulary, and usage
- Never creates decks unless you explicitly ask

### ⚙️ Technical Features

| Feature | Details |
|---------|---------|
| **Model** | Google Gemini 2.5 Flash Lite (default) |
| **Fallback** | Auto-fallback to non-streaming if streaming fails |
| **Retry** | Exponential backoff (2 retries) on rate limits |
| **Timeout** | 30-second request timeout |
| **Streaming** | Real-time token-by-token display |
| **Persistence** | Chat history saved to `localStorage` |
| **Clear chat** | "Drop Chat" button clears history |
| **Model settings** | Dialog to switch between Gemini models |
| **Mode selector** | Segmented toggle: "Decks" / "Chat" |

### 📋 Example Use Cases

| What to ask | What happens |
|-------------|--------------|
| "Create 20 Japanese food vocabulary cards" | Gets a ready-to-study deck instantly |
| "Help me practice my French" | AI converses in French, corrects mistakes |
| "Add these 5 words to my Spanish deck" | Cards are appended to the selected deck |
| "Explain the difference between ser and estar" | AI teaches the grammar concept |
| "Correct my Spanish: 'Yo voy a la tienda ayer'" | AI fixes the tense and explains why |

---

## 🗣️ Text-to-Speech (TTS)

### Multi-Language Voice Engine

Cardly has a **sophisticated TTS engine** that works with your device's built-in speech synthesis:

**Front-end voices (per-side language selection):**
- **Separate dropdown** for Front and Back card sides
- **Auto-detect** mode per side uses built-in language detection
- Detects: 🇺🇸 English, 🇫🇷 French, 🇪🇸 Spanish, 🇩🇪 German, 🇯🇵 Japanese, 🇨🇳 Chinese, 🇸🇦 Arabic, 🇷🇺 Russian, 🇮🇱 Hebrew
- Manual override lets you lock any side to a specific language

**Back-end voice engine (`tts.ts`):**
- `speakEnglish()` — finds best English voice with smart prioritization
- `speakFrench()` — finds best French voice with similar prioritization
- `refreshVoices()` — force-refreshes voice list
- Multiple retry attempts with increasing delays for voice loading
- Falls back gracefully if no voice is available

**React hook (`use-text-to-speech`):**
- `getBestVoice(targetLang)` — scores voices by language match, quality (premium/neural), and online/offline status
- `speak(text, overrideLang?)` — speaks with intelligent voice selection
- Offline-aware — rejects cloud voices when offline, prefers them when online

---

## 🌐 Import & Export

### Import

| Format | Column Detection | How it works |
|--------|-----------------|--------------|
| **CSV** (.csv) | Case-insensitive: `front`/`question`, `back`/`answer`, `image`/`img` | Uses PapaParse |
| **Excel** (.xlsx) | Same flexible column matching | Uses SheetJS (xlsx) |

The import system is **smart about column names** — it doesn't care if your columns are called "Front", "front", "Question", or "question". It finds them.

### Export

| Format | File naming | Content |
|--------|-------------|---------|
| **CSV** | `{DeckName}_flashcards.csv` | Front, Back, Image URL columns |
| **Excel** | `{DeckName}_flashcards.xlsx` | Same data in ready-to-share spreadsheet |

One-click export — perfect for backups, sharing with students, or analyzing data in a spreadsheet.

---

## ☁️ Cloud Sync & Auth

### Authentication

| Method | Details |
|--------|---------|
| **Email + Password** | Standard sign-up / sign-in |
| **Google Sign-In** | One-click OAuth with official Google logo |

Both methods use Firebase Authentication.

### Firestore Sync

| Feature | Details |
|---------|---------|
| **Data synced** | Decks, flashcards, study sessions |
| **Sync trigger** | On login (`syncAllFromFirestore`) |
| **Direction** | Firestore → Dexie (load) → Dexie → Firestore (push) |
| **Conflict resolution** | Firestore is source of truth |
| **Offline** | Dexie (IndexedDB) is the primary store — works fully offline |
| **Persistence** | Firestore offline persistence enabled |

**How sync works:**
1. User signs in → `syncAllFromFirestore()` fires
2. Clears local Dexie database
3. Loads all decks, cards, and sessions from Firestore into Dexie
4. If Firestore is empty (new user), seeds default decks, then pushes them up

**Best-effort writes:** Deck and card creation always saves locally first. Firestore sync is wrapped in try-catch — even if the network is down, data is never lost.

---

## 📊 Statistics & Streaks

The **Statistics page** gives learners a complete picture of their progress:

| Metric | Details |
|--------|---------|
| **📚 Study Sessions** | Total number of review sessions completed |
| **🎯 Cards Studied** | Total cards reviewed across all sessions |
| **🏆 Accuracy** | Overall correct percentage |
| **⏱️ Total Time** | Cumulative study time across all modes and games |
| **🔥 Streak** | Consecutive days studied (today counts if studied yesterday) |
| **📋 Recent Sessions** | Last 10 sessions with deck name, mode, cards, time, date |

**Streak calculation:**
- Checks if the user studied today or yesterday
- Counts consecutive days backward
- Resets to 0 if more than one day is missed

**Session tracking per mode:** Each study mode and game logs its own session with:
- `cardsStudied`, `correctCount`, `totalTime`, `completedAt`
- Mode label (Spaced Repetition, Typing, Quiz, Multiple Choice)

---

## 📦 Pre-Installed Decks

Cardly ships with **4 starter decks** to get learners going immediately:

### 1️⃣ Health Q&A
> 15 cards — Common health questions and answers

### 2️⃣ English → Japanese 🇯🇵
> 33 cards — Essential Japanese vocabulary with kanji, kana, and romaji

### 3️⃣ English → Spanish 🇪🇸
> 30 cards — Single-word Spanish vocabulary (nouns, greetings, body parts)

### 4️⃣ Animals Quiz 🐾
> 16 cards — Fascinating animal facts with **stable Wikimedia Commons photos**

The Animals Quiz deck is special — every card has a **permanent Wikimedia Commons image URL**. These images NEVER break or change. Species include: Elephant Seal, Koala, Octopus, Snail, Chameleon, Wood Frog, Saltwater Crocodile, Bat, Horseshoe Crab, Immortal Jellyfish, Ostrich, Kangaroo Rat, Blue Whale, Cow, Cuttlefish, and Honey Bee.

---

## 📱 Progressive Web App (PWA)

Cardly is a **fully installable PWA**:

| Feature | Details |
|---------|---------|
| **Install prompt** | Custom "Install App" button with dialog |
| **Mobile** | Works on Android, iOS, iPadOS |
| **Desktop** | Works on Windows, macOS, Linux (Chrome/Edge) |
| **Offline** | Dexie (IndexedDB) keeps all data locally |
| **Service Worker** | Auto-generated by `vite-plugin-pwa` |
| **Manifest** | Custom webmanifest with app name and icons |
| **Splash screen** | OS-native splash on launch |

The install button appears automatically when the browser supports PWA installation. Users can also install manually via the browser menu.

---

## 🎨 Design & UX

### Visual Design

| Element | Detail |
|---------|--------|
| **Theme** | Dark mode by default with CSS custom properties |
| **Gradients** | Primary gradient (`#BE95FF` → `#6C63FF`) used throughout |
| **Animations** | Framer Motion for page transitions, card reveals, hover effects |
| **Cards** | Glass-morphism (`bg-gradient-card`), rounded-2xl, subtle borders |
| **Shadows** | Glow effect (`shadow-glow`) on interactive elements |
| **Typography** | System font stack, responsive sizing (sm/md/lg) |

### Component Library

Built on **shadcn/ui** (Radix primitives + Tailwind CSS):

- `Button`, `Input`, `Card`, `Select`, `Dialog`, `Label`
- `Textarea`, `ScrollArea`, `Tooltip`, `Toast`, `Sonner` (notifications)

### Layout

- **Responsive** — mobile-first with breakpoints at `sm:`, `md:`, `lg:`
- **Container** — centered, max-width constrained (`max-w-6xl`, `max-w-3xl`)
- **Grid** — auto-fitting cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`)

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS 3 |
| **UI Library** | shadcn/ui (Radix primitives) |
| **Animation** | Framer Motion |
| **Local DB** | Dexie.js (IndexedDB) |
| **Auth** | Firebase Authentication |
| **Cloud DB** | Firebase Firestore |
| **AI** | Google Gemini API (`gemini-2.5-flash-lite`) |
| **File parsing** | PapaParse (CSV), SheetJS (Excel) |
| **PWA** | vite-plugin-pwa |
| **Icons** | Lucide React |
| **Notifications** | Sonner + custom toast hook |

---

## ✨ Feature Count: 50+ Features at a Glance

| Category | Features |
|----------|----------|
| **📖 Study** | Spaced Repetition (SM-2), Typing Practice, Quiz Mode, Multiple Choice, Speak It (per-side TTS + Auto-Advance) |
| **🎮 Games** | Shooter, Snake, Tetris |
| **🤖 AI** | Create Decks, Normal Chat, Streaming responses, Model settings, Chat persistence |
| **🗣️ TTS** | Per-side language dropdowns, Auto-detect, 8+ language detection, French/English engines |
| **📊 Analytics** | Session count, cards studied, accuracy, study time, streak tracking |
| **🌐 Import/Export** | CSV import, Excel import, CSV export, Excel export |
| **☁️ Sync** | Email auth, Google Sign-In, Firestore sync, offline-first |
| **📦 Defaults** | Health Q&A, English→Japanese, English→Spanish, Animals Quiz (with images) |
| **📱 Platform** | PWA installable, fully offline, responsive design, service worker |
| **🎨 Design** | Dark theme, glass-morphism, animations, gradients, glow effects |

---

## 🚀 Why This App Is Perfect For Your Audience

If your channel is about **language learning**, here's why Cardly is the perfect app to offer your audience:

1. **🎯 It's built FOR language learners** — not a generic flashcard app
2. **🗣️ Per-side TTS with auto-detect** — learners practice listening AND speaking in TWO languages
3. **🎮 Games that actually teach** — Shooter, Snake, Tetris all integrate SM-2 spaced repetition
4. **🤖 AI tutor conversations** — Normal Chat mode lets learners practice naturally with an AI that corrects them
5. **📚 Pre-loaded language decks** — Japanese (33 cards), Spanish (30 cards), and room for AI-generated ones
6. **🔥 Streak tracking** — gamifies daily practice (huge for retention)
7. **📱 PWA = zero friction** — learners install it like an app, no app store required
8. **☁️ Cross-device sync** — start on phone, continue on laptop
9. **🌐 Import from Excel/CSV** — teachers can upload their own vocabulary lists
10. **🧠 SM-2 algorithm** — the gold standard for long-term memory

---

*Cardly — Learn Smarter. 🃏✨*
