import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RotateCcw, Zap, Skull, Heart, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { processGameResult } from "@/lib/study-integration";

// Game Constants
const GRID_SIZE = 20;
const INITIAL_SPEED = 180;
const SPEED_INCREMENT_ON_ERROR = 30; // ms faster per error

type Position = { x: number, y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEVEL_COMPLETE';
type Difficulty = 'EASY' | 'HARD';

type FoodItem = {
    id: number;
    x: number;
    y: number;
    letter: string;
    type: 'correct' | 'distractor';
    indexInWord?: number;
};

export default function SnakeGame() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Game State
    const snakeRef = useRef<Position[]>([]);
    const directionRef = useRef<Direction>('RIGHT');
    const nextDirectionRef = useRef<Direction>('RIGHT');
    const foodRef = useRef<FoodItem[]>([]);
    const scoreRef = useRef(0);
    const streakRef = useRef(0);
    const livesRef = useRef(3);
    const errorCountRef = useRef(0); // Tracks wrong hits for speed calc
    const lastTickRef = useRef(0);
    const currentWordIndexRef = useRef(0);
    const collectedLettersRef = useRef<string[]>([]);
    const gameLoopRef = useRef<number>();
    const isPausedRef = useRef(false);

    // Config
    const shuffledDeckRef = useRef<any[]>([]);

    // UI state
    const [gameState, setGameState] = useState<GameState>('START');
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [lives, setLives] = useState(3);
    const [collectedCount, setCollectedCount] = useState(0); // For UI updates
    const [difficulty, setDifficulty] = useState<Difficulty>('EASY');

    const [canvasSize, setCanvasSize] = useState(600);

    const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
    const cards = useLiveQuery(
        () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
        [deckId]
    );

    const validCards = useMemo(() => {
        if (!cards) return [];
        return cards.filter(c => c.back && c.back.trim().length > 0);
    }, [cards]);

    const getCurrentCard = () => shuffledDeckRef.current[currentWordIndexRef.current];

    // Helper: Clean word for snake targets (alphanumeric only)
    const getSnakeTargets = (text: string) => {
        return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().split('');
    };

    // Helper: Get display tokens (preserve spaces/separators)
    const getDisplayTokens = (text: string) => {
        // Split by characters but keep non-alphanumeric as is
        return text.toUpperCase().split('').map(char => {
            if (/[A-Z0-9]/.test(char)) return { char, isTarget: true };
            return { char, isTarget: false };
        });
    };

    // --- Core Logic ---

    const generateFood = (wordRaw: string, currentSnake: Position[]) => {
        const targets = getSnakeTargets(wordRaw);
        const items: FoodItem[] = [];

        const occupied = new Set<string>();
        currentSnake.forEach(p => occupied.add(`${p.x},${p.y}`));

        // Safe Zone
        const center = Math.floor(GRID_SIZE / 2);
        for (let x = center - 2; x <= center + 4; x++) {
            for (let y = center - 2; y <= center + 2; y++) {
                occupied.add(`${x},${y}`);
            }
        }

        const getRandomPos = () => {
            let pos: Position;
            let attempts = 0;
            do {
                pos = {
                    x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
                    y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
                };
                attempts++;
            } while (occupied.has(`${pos.x},${pos.y}`) && attempts < 200);
            return pos;
        };

        const addFood = (letter: string, type: 'correct' | 'distractor', index?: number) => {
            if (!letter || letter.trim() === '') return;

            const pos = getRandomPos();
            occupied.add(`${pos.x},${pos.y}`);
            items.push({
                id: Math.random(),
                x: pos.x,
                y: pos.y,
                letter,
                type,
                indexInWord: index
            });
        };

        // Add correct letters
        targets.forEach((letter, index) => {
            addFood(letter, 'correct', index);
        });

        // Add distractors
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const distractorCount = Math.max(5, 15 - targets.length);

        for (let i = 0; i < distractorCount; i++) {
            const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            addFood(randomLetter, 'distractor');
        }

        return items;
    };

    const startGame = useCallback(() => {
        if (!validCards || validCards.length === 0) return;
        shuffledDeckRef.current = [...validCards].sort(() => Math.random() - 0.5);

        scoreRef.current = 0;
        streakRef.current = 0;
        livesRef.current = 3;
        errorCountRef.current = 0;
        currentWordIndexRef.current = 0;

        setScore(0);
        setStreak(0);
        setLives(3);

        startLevel();
        setGameState('PLAYING');
    }, [validCards]);

    const startLevel = () => {
        const card = getCurrentCard();
        if (!card) {
            setGameState('GAME_OVER');
            return;
        }

        // Spawn
        const startX = Math.floor(GRID_SIZE / 2);
        const startY = Math.floor(GRID_SIZE / 2);

        snakeRef.current = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];
        directionRef.current = 'RIGHT';
        nextDirectionRef.current = 'RIGHT';
        collectedLettersRef.current = [];

        // Don't reset lives/score between levels, but maybe error speed reset?
        // User said "choose wrong letter snake get faster every time". usually implies persistent or per-level?
        // Let's reset error speed per level to make it fair, or keep it? 
        // "Every time" implies cumulative within the attempt. Let's keep it cumulative for the session for difficulty, 
        // OR reset per word. Let's reset per word to give breathing room.
        errorCountRef.current = 0;

        const word = card.back.trim();
        foodRef.current = generateFood(word, snakeRef.current);

        setCollectedCount(0);
        isPausedRef.current = false;

        requestAnimationFrame(drawGame);
    };

    // Controls
    const changeDirection = (dir: Direction) => {
        if (gameState !== 'PLAYING') return;

        const current = directionRef.current;
        if (dir === 'UP' && current !== 'DOWN') nextDirectionRef.current = 'UP';
        if (dir === 'DOWN' && current !== 'UP') nextDirectionRef.current = 'DOWN';
        if (dir === 'LEFT' && current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
        if (dir === 'RIGHT' && current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); changeDirection('UP'); break;
                case 'ArrowDown': e.preventDefault(); changeDirection('DOWN'); break;
                case 'ArrowLeft': e.preventDefault(); changeDirection('LEFT'); break;
                case 'ArrowRight': e.preventDefault(); changeDirection('RIGHT'); break;
                case ' ': e.preventDefault(); isPausedRef.current = !isPausedRef.current; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    // Touch logic (Swipe) preserved as alternative
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current || gameState !== 'PLAYING') return;
        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
            changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        } else if (Math.abs(dy) > 30) {
            changeDirection(dy > 0 ? 'DOWN' : 'UP');
        }
    };

    // Main Loop
    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const loop = (timestamp: number) => {
            if (!lastTickRef.current) lastTickRef.current = timestamp;
            const deltaTime = timestamp - lastTickRef.current;

            // Speed Calculation: Base - Streak Bonus + Error Penalty
            // Errors make it FASTER (smaller delay)
            let speed = INITIAL_SPEED
                - (streakRef.current * 5)
                - (errorCountRef.current * SPEED_INCREMENT_ON_ERROR); // Faster with every error

            speed = Math.max(60, speed); // Cap max speed

            if (!isPausedRef.current && deltaTime > speed) {
                updateGame();
                lastTickRef.current = timestamp;
            }
            drawGame();
            gameLoopRef.current = requestAnimationFrame(loop);
        };
        gameLoopRef.current = requestAnimationFrame(loop);
        return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
    }, [gameState]);

    const updateGame = () => {
        const head = { ...snakeRef.current[0] };
        directionRef.current = nextDirectionRef.current;
        switch (directionRef.current) {
            case 'UP': head.y -= 1; break;
            case 'DOWN': head.y += 1; break;
            case 'LEFT': head.x -= 1; break;
            case 'RIGHT': head.x += 1; break;
        }

        // Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            handleLifeLost("Hit wall");
            return;
        }
        // Self Collision
        if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
            handleLifeLost("Bit self");
            return;
        }

        const foodIndex = foodRef.current.findIndex(f => f.x === head.x && f.y === head.y);
        let grow = false;



        // ...

        if (foodIndex !== -1) {
            const eaten = foodRef.current[foodIndex];
            const currentCard = getCurrentCard();
            const correctOrder = getSnakeTargets(currentCard.back);
            const neededIndex = collectedLettersRef.current.length;

            if (eaten.type === 'correct' && eaten.indexInWord === neededIndex) {
                collectedLettersRef.current.push(eaten.letter);
                setCollectedCount(collectedLettersRef.current.length);
                foodRef.current.splice(foodIndex, 1);
                grow = true;
                if (collectedLettersRef.current.length === correctOrder.length) handleLevelComplete();
            } else {
                // Wrong Letter Hit
                handleLifeLost("Wrong letter");
                // Valid SRS Fail
                if (currentCard && currentCard.id) {
                    processGameResult(currentCard.id, false);
                }

                foodRef.current.splice(foodIndex, 1);
                return;
            }
        }

        const newSnake = [head, ...snakeRef.current];
        if (!grow) newSnake.pop();
        snakeRef.current = newSnake;
    };

    const handleLifeLost = (reason: string) => {
        livesRef.current -= 1;
        setLives(livesRef.current);
        errorCountRef.current += 1; // Makes game faster

        if (livesRef.current <= 0) {
            setGameState('GAME_OVER');
        } else {
            if (reason === "Hit wall" || reason === "Bit self") {
                const startX = Math.floor(GRID_SIZE / 2);
                const startY = Math.floor(GRID_SIZE / 2);
                snakeRef.current = [
                    { x: startX, y: startY },
                    { x: startX - 1, y: startY },
                    { x: startX - 2, y: startY }
                ];
                directionRef.current = 'RIGHT';
                nextDirectionRef.current = 'RIGHT';
            }
        }
    };

    const handleLevelComplete = () => {
        // Valid SRS Success
        const currentCard = getCurrentCard();
        if (currentCard && currentCard.id) {
            processGameResult(currentCard.id, true);
        }

        scoreRef.current += 50 + (streakRef.current * 10);
        streakRef.current++;
        setScore(scoreRef.current);
        setStreak(streakRef.current);

        if (currentWordIndexRef.current < shuffledDeckRef.current.length - 1) {
            currentWordIndexRef.current++;
            startLevel();
        } else {
            setGameState('GAME_OVER');
        }
    };

    const drawGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (canvas.width !== canvasSize || canvas.height !== canvasSize) {
            canvas.width = canvasSize;
            canvas.height = canvasSize;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cellSize = canvasSize / GRID_SIZE;

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Grid
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, canvasSize);
            ctx.moveTo(0, i * cellSize); ctx.lineTo(canvasSize, i * cellSize);
        }
        ctx.stroke();

        // Food
        const currentCard = getCurrentCard();
        if (currentCard) {
            const neededIndex = collectedLettersRef.current.length;
            foodRef.current.forEach(f => {
                const cx = f.x * cellSize + cellSize / 2;
                const cy = f.y * cellSize + cellSize / 2;

                let bgFill = '#3b82f6';

                if (difficulty === 'EASY') {
                    const isTarget = f.type === 'correct' && f.indexInWord === neededIndex;
                    if (isTarget) {
                        bgFill = '#22c55e'; // Green
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#22c55e';
                    } else if (f.type === 'correct') {
                        bgFill = '#3b82f6'; // Blue
                        ctx.shadowBlur = 0;
                    } else {
                        bgFill = '#ef4444'; // Red
                        ctx.shadowBlur = 0;
                    }
                } else {
                    bgFill = '#6366f1'; // Indigo for all
                    ctx.shadowBlur = 0;
                }

                ctx.fillStyle = bgFill;
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${cellSize * 0.5}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(f.letter, cx, cy + 1);
            });
        }

        // Snake
        snakeRef.current.forEach((s, i) => {
            const sx = s.x * cellSize;
            const sy = s.y * cellSize;
            ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';

            const gap = 2;
            ctx.beginPath();
            ctx.roundRect(sx + gap, sy + gap, cellSize - gap * 2, cellSize - gap * 2, 4);
            ctx.fill();

            if (i === 0) {
                ctx.fillStyle = '#064e3b';
                const eyeOff = cellSize * 0.25;
                const eyeSz = cellSize * 0.1;
                ctx.beginPath();
                ctx.arc(sx + cellSize / 2 - eyeOff, sy + cellSize / 2 - eyeOff, eyeSz, 0, Math.PI * 2);
                ctx.arc(sx + cellSize / 2 + eyeOff, sy + cellSize / 2 - eyeOff, eyeSz, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    // Resize - compute square size from container element
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleResize = () => {
            const width = Math.min(container.clientWidth, 800);
            if (width > 0) setCanvasSize(width);
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(container);
        handleResize();
        return () => observer.disconnect();
    }, [gameState]);

    // Sync canvas internal size to match CSS size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
    }, [canvasSize]);

    if (!deck) return null;
    const currentCard = getCurrentCard();

    return (
        <div className="h-dvh bg-slate-950 text-white overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 w-full px-4 pt-3 pb-1 flex items-center justify-between">
                <Button variant="ghost" onClick={() => navigate(`/deck/${deckId}`)} className="text-slate-400 hover:text-white h-8">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Exit
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 font-bold leading-tight">LIVES</span>
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <Heart key={i} className={`w-4 h-4 ${i < lives ? 'fill-red-500 text-red-500' : 'text-slate-700'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="text-right leading-tight">
                        <div className="text-[10px] text-slate-500 font-bold">SCORE</div>
                        <div className="text-lg font-mono text-green-400 leading-tight">{score}</div>
                    </div>
                </div>
            </div>

            {/* Clue Section */}
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && currentCard && (
                <div className="flex-shrink-0 w-full px-4 pb-1">
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl w-full max-w-2xl mx-auto flex flex-col items-center shadow-lg">
                        <h2 className="text-lg font-bold text-white text-center leading-tight">{currentCard.front}</h2>
                        <div className="flex gap-1 flex-wrap justify-center min-h-[1.5rem] items-end">
                            {(() => {
                                const tokens = getDisplayTokens(currentCard.back);
                                let targetIndexCounter = 0;
                                return tokens.map((token, i) => {
                                    if (token.isTarget) {
                                        const isCollected = targetIndexCounter < collectedLettersRef.current.length;
                                        targetIndexCounter++;
                                        const char = token.char;
                                        return (
                                            <div key={i} className={`w-6 h-7 flex items-center justify-center border-b text-sm font-bold ${isCollected ? 'text-green-400 border-green-500' : 'text-transparent border-slate-700'}`}>
                                                {isCollected ? char : '_'}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={i} className="w-6 h-7 flex items-center justify-center text-sm font-bold text-slate-500">
                                                {token.char}
                                            </div>
                                        );
                                    }
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Game Container - fills remaining space */}
            <div className="flex-1 relative min-h-0 px-3 pb-3 flex items-center justify-center overflow-hidden">
                <div
                    ref={containerRef}
                    className="relative bg-slate-900 rounded-lg shadow-2xl border-2 border-slate-800 max-w-full max-h-full overflow-hidden"
                    style={{ aspectRatio: '1/1' }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <canvas ref={canvasRef} className="w-full h-full block rounded-lg touch-none" style={{ touchAction: 'none' }} />

                    {gameState === 'START' && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/90 z-10 backdrop-blur-sm rounded-lg">
                            <div className="text-center w-full max-w-xs">
                                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-blue-600 mb-1">SNAKE SPELLER</h1>
                                <div className="mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <p className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">Select Difficulty</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div onClick={() => setDifficulty('EASY')} className={`cursor-pointer p-2 rounded-lg border-2 ${difficulty === 'EASY' ? 'border-green-500 bg-green-500/20' : 'border-slate-700'}`}>
                                            <Zap className={`w-4 h-4 mx-auto mb-0.5 ${difficulty === 'EASY' ? 'text-green-400' : 'text-slate-500'}`} />
                                            <div className="text-xs font-bold">EASY</div>
                                        </div>
                                        <div onClick={() => setDifficulty('HARD')} className={`cursor-pointer p-2 rounded-lg border-2 ${difficulty === 'HARD' ? 'border-red-500 bg-red-500/20' : 'border-slate-700'}`}>
                                            <Skull className={`w-4 h-4 mx-auto mb-0.5 ${difficulty === 'HARD' ? 'text-red-400' : 'text-slate-500'}`} />
                                            <div className="text-xs font-bold">HARD</div>
                                        </div>
                                    </div>
                                </div>
                                <Button size="default" onClick={startGame} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-10 text-base rounded-full">
                                    <Play className="fill-white mr-2 w-4 h-4" /> START
                                </Button>
                            </div>
                        </div>
                    )}
                    {gameState === 'GAME_OVER' && (
                        <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950/90 z-10 backdrop-blur-sm rounded-lg">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-red-500 mb-1">GAME OVER</h2>
                                <p className="text-slate-400 text-sm mb-4">Word: <span className="text-white font-mono">{currentCard?.back}</span></p>
                                <div className="flex gap-3 justify-center">
                                    <Button size="sm" onClick={startGame} className="bg-white text-slate-900 hover:bg-slate-200">Replay</Button>
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/deck/${deckId}`)} className="text-slate-400">Exit</Button>
                                </div>
                            </div>
                        </div>
                    )}
                    {gameState === 'PAUSED' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-sm rounded-lg">
                            <Button size="sm" onClick={() => isPausedRef.current = false} className="bg-white text-black px-6 py-3 font-bold rounded-full">RESUME</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* MOBILE D-PAD CONTROLS */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-2 pb-3 w-40 mx-auto md:hidden">
                <div></div>
                <Button variant="outline" className="h-10 bg-slate-800 border-slate-700 active:bg-slate-700" onClick={() => changeDirection('UP')}>
                    <ChevronUp className="w-5 h-5 text-slate-200" />
                </Button>
                <div></div>
                <Button variant="outline" className="h-10 bg-slate-800 border-slate-700 active:bg-slate-700" onClick={() => changeDirection('LEFT')}>
                    <ChevronLeft className="w-5 h-5 text-slate-200" />
                </Button>
                <Button variant="outline" className="h-10 bg-slate-800 border-slate-700 active:bg-slate-700" onClick={() => changeDirection('DOWN')}>
                    <ChevronDown className="w-5 h-5 text-slate-200" />
                </Button>
                <Button variant="outline" className="h-10 bg-slate-800 border-slate-700 active:bg-slate-700" onClick={() => changeDirection('RIGHT')}>
                    <ChevronRight className="w-5 h-5 text-slate-200" />
                </Button>
            </div>
            </div>
    );
}
