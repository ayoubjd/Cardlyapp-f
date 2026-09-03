import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Enemy,
    Bullet,
    Particle,
    Star,
    checkCollision,
    getWrongAnswers,
    getDifficulty,
    createEnemy,
    createBulletWithLocation,
    createParticle,
    createStars,
    drawPlayer,
    drawEnemy,
    drawBullet,
    drawParticle,
} from "@/lib/game-utils";
import { processGameResult } from "@/lib/study-integration";

export default function ShooterGame() {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameLoopRef = useRef<number>();
    const lastSpawnRef = useRef<number>(0);
    const bulletIdRef = useRef(0);
    const enemyIdRef = useRef(0);

    // Use refs for game state (updated every frame)
    const enemiesRef = useRef<Enemy[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const particlesRef = useRef<Particle[]>([]);
    const starsRef = useRef<Star[]>([]);
    const playerXRef = useRef(300);
    const scoreRef = useRef(0);
    const livesRef = useRef(10);
    const currentCardIndexRef = useRef(0);
    const shuffledCardsRef = useRef<any[]>([]);
    const gameCardsRef = useRef<any[]>([]); // Snapshot at game start, immune to useLiveQuery updates

    // Touch handling refs
    const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const isDraggingRef = useRef(false);

    // Canvas dimensions ref to avoid re-renders but access in loop
    const canvasSizeRef = useRef({ width: 300, height: 150 });


    // Use state only for UI display
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(10);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
    const cards = useLiveQuery(
        () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
        [deckId]
    );

    // Shuffle cards when they load
    const shuffledCards = useMemo(() => {
        if (!cards) return [];
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        shuffledCardsRef.current = shuffled;
        return shuffled;
    }, [cards]);

    // Use gameCardsRef snapshot during gameplay (immune to IndexedDB reshuffles), fall back to live shuffled for initial display
    const displayCards = gameCardsRef.current.length > 0 ? gameCardsRef.current : (shuffledCards || []);
    const currentCard = displayCards[currentCardIndexRef.current];
    const playerWidth = 60;
    const playerHeight = 40;

    // Handle canvas sizing — explicit, reliable, no CSS layout dependency
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const syncSize = () => {
            const w = Math.min(window.innerWidth - 32, 960);
            const h = Math.min(window.innerHeight * 0.78, 800);
            if (w < 50 || h < 50) return;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                canvasSizeRef.current = { width: w, height: h };
                starsRef.current = createStars(50, w, h);
                playerXRef.current = Math.max(0, (w - playerWidth) / 2);
            }
        };
        syncSize();
        window.addEventListener('resize', syncSize);
        return () => window.removeEventListener('resize', syncSize);
    }, []);

    // Handle touch controls
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault(); // Prevent scrolling
            if (!isPlaying) return;

            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();

            // Calculate touch position relative to canvas
            const touchX = touch.clientX - rect.left;

            // Check for drag movement
            if (touchStartRef.current) {
                const moveDist = Math.abs(touch.clientX - touchStartRef.current.x) + Math.abs(touch.clientY - touchStartRef.current.y);
                if (moveDist > 10) { // Threshold for "drag" vs "tap"
                    isDraggingRef.current = true;
                }
            }

            // Move player to touch X directly (clamped)
            playerXRef.current = Math.max(0, Math.min(canvasSizeRef.current.width - playerWidth, touchX - playerWidth / 2));
        };

        const handleTouchStart = (e: TouchEvent) => {
            // Check if user touched a button (Pause, etc)
            const target = e.target as HTMLElement;
            if (target.closest('button')) {
                return; // Let the button click happen
            }

            // Store start info
            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
            isDraggingRef.current = false; // Reset drag state

            // Also update position on initial touch for responsiveness
            handleTouchMove(e);
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (touchStartRef.current) {
                const duration = Date.now() - touchStartRef.current.time;
                // If it was a short tap (<300ms) and NOT a drag, then SHOOT
                if (duration < 300 && !isDraggingRef.current) {
                    shootBullet();
                }
                touchStartRef.current = null;
                isDraggingRef.current = false;
            }
        };

        // Attach to WINDOW to catch drags that go outside the canvas or start slightly off
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPlaying]); // Re-bind if isPlaying changes (though refs handle state)

    // Handle keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                playerXRef.current = Math.max(0, playerXRef.current - 20);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                playerXRef.current = Math.min(canvasSizeRef.current.width - playerWidth, playerXRef.current + 20);
            } else if (e.key === " ") {
                e.preventDefault();
                shootBullet();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPlaying]);

    const shootBullet = useCallback(() => {
        const playerY = canvasSizeRef.current.height - 70;
        const bullet = createBulletWithLocation(bulletIdRef.current++, playerXRef.current + playerWidth / 2, playerY);
        bulletsRef.current.push(bullet);
    }, []);

    const spawnEnemies = useCallback(() => {
        const cards = gameCardsRef.current.length > 0 ? gameCardsRef.current : shuffledCardsRef.current;
        if (!cards || !cards[currentCardIndexRef.current]) {
            console.warn('[Shooter] spawnEnemies: no card at index', currentCardIndexRef.current, 'cards length', cards?.length);
            return;
        }

        const currentCard = cards[currentCardIndexRef.current];
        const difficulty = getDifficulty(scoreRef.current);
        const wrongAnswers = getWrongAnswers(
            cards,
            currentCard.back,
            difficulty.enemyCount - 1
        );

        const newEnemies: Enemy[] = [];
        const canvasWidth = canvasSizeRef.current.width;

        // Helper to check overlap with existing new enemies
        const isOverlapping = (x: number, width: number) => {
            return newEnemies.some(e => Math.abs(e.x - x) < width + 20);
        };

        const getValidX = (width: number) => {
            let attempts = 0;
            let x = 0;
            do {
                x = Math.random() * (canvasWidth - width);
                attempts++;
            } while (isOverlapping(x, width) && attempts < 10);
            return x;
        };

        // Prepare spawn list (Correct + Wrongs)
        const spawnData = [
            { text: currentCard.back, isCorrect: true },
            ...wrongAnswers.map(word => ({ text: word, isCorrect: false }))
        ];

        // Shuffle the spawn list so "Correct" isn't always processed first
        for (let i = spawnData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [spawnData[i], spawnData[j]] = [spawnData[j], spawnData[i]];
        }

        // Generate Enemies
        spawnData.forEach(data => {
            const enemyTemplate = createEnemy(
                enemyIdRef.current++,
                data.text,
                data.isCorrect,
                canvasWidth,
                difficulty.enemySpeed
            );
            const x = getValidX(enemyTemplate.width);
            const yOffset = -(Math.random() * 190 + 60);

            newEnemies.push({
                ...enemyTemplate,
                x: x,
                y: yOffset,
                initialX: x
            });
        });

        enemiesRef.current.push(...newEnemies);
    }, []);


    // Game loop
    useEffect(() => {
        if (!isPlaying || !canvasRef.current || gameCardsRef.current.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const gameLoop = (timestamp: number) => {
            if (!isPlaying) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);

            // Draw background (Starfield)
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(0, 0, canvasSizeRef.current.width, canvasSizeRef.current.height);

            starsRef.current.forEach(star => {
                star.y += star.speed;
                if (star.y > canvasSizeRef.current.height) {
                    star.y = 0;
                    star.x = Math.random() * canvasSizeRef.current.width;
                }
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Update and draw bullets
            bulletsRef.current = bulletsRef.current
                .map((bullet) => ({ ...bullet, y: bullet.y - bullet.speed }))
                .filter((bullet) => bullet.y > -bullet.height);

            bulletsRef.current.forEach((bullet) => {
                drawBullet(ctx, bullet);
            });

            // Update and draw particles
            particlesRef.current = particlesRef.current
                .map(p => ({
                    ...p,
                    x: p.x + p.vx,
                    y: p.y + p.vy,
                    life: p.life - 0.05
                }))
                .filter(p => p.life > 0);

            particlesRef.current.forEach(particle => {
                drawParticle(ctx, particle);
            });

            // Update and draw enemies
            enemiesRef.current = enemiesRef.current.map((enemy) => {
                // Vertical movement
                let newY = enemy.y + enemy.speed;
                let newX = enemy.x;

                // Horizontal movement based on type
                if (enemy.movementType === 'sine') {
                    // Sine wave: x = initialX + amplitude * sin(frequency * y + phase)
                    const amplitude = 50;
                    const frequency = 0.02;
                    newX = enemy.initialX + Math.sin(newY * frequency + enemy.phaseOffset) * amplitude;
                } else if (enemy.movementType === 'search') {
                    // Search/Zigzag: More erratic
                    const amplitude = 80;
                    const frequency = 0.03;
                    newX = enemy.initialX + Math.sin(newY * frequency + enemy.phaseOffset) * amplitude;
                }

                // Clamp to screen boundaries
                newX = Math.max(0, Math.min(canvasSizeRef.current.width - enemy.width, newX));

                return {
                    ...enemy,
                    x: newX,
                    y: newY,
                };
            });

            enemiesRef.current.forEach((enemy) => {
                drawEnemy(ctx, enemy);
            });



            // Check collisions FIRST — a bullet hit takes priority over falling off the bottom in the same frame
            const bulletsToRemove = new Set<number>();
            const enemiesToRemove = new Set<number>();

            for (let bi = 0; bi < bulletsRef.current.length; bi++) {
                const bullet = bulletsRef.current[bi];
                let bulletHit = false;

                for (let ei = 0; ei < enemiesRef.current.length; ei++) {
                    const enemy = enemiesRef.current[ei];

                    if (checkCollision(bullet, enemy) && !enemiesToRemove.has(enemy.id)) {
                        bulletsToRemove.add(bullet.id);
                        enemiesToRemove.add(enemy.id);
                        bulletHit = true;

                        // Visual feedback
                        const color = enemy.isCorrect ? '#10b981' : '#ef4444';
                        for (let i = 0; i < 10; i++) {
                            particlesRef.current.push(createParticle(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, color));
                        }

                        if (enemy.isCorrect) {
                            console.log('[Shooter] CORRECT HIT: cardIdx', currentCardIndexRef.current, 'total', gameCardsRef.current.length, 'word', enemy.word);
                            const liveCard = gameCardsRef.current?.[currentCardIndexRef.current];
                            if (liveCard && liveCard.id) {
                                processGameResult(liveCard.id, true);
                            }

                            scoreRef.current += 10;
                            setScore(scoreRef.current);

                            if (currentCardIndexRef.current < gameCardsRef.current.length - 1) {
                                currentCardIndexRef.current++;
                                console.log('[Shooter] ADVANCE to card', currentCardIndexRef.current);
                                enemiesRef.current = [];
                                bulletsRef.current = [];
                                lastSpawnRef.current = timestamp;
                                spawnEnemies();
                            } else {
                                console.log('[Shooter] LAST CARD CORRECT - WIN');
                                setIsPlaying(false);
                                setGameWon(true);
                                return;
                            }
                        } else {
                            console.log('[Shooter] WRONG HIT: cardIdx', currentCardIndexRef.current, 'enemy word', enemy.word);
                            const liveCard = gameCardsRef.current?.[currentCardIndexRef.current];
                            if (liveCard && liveCard.id) {
                                processGameResult(liveCard.id, false);
                            }

                            livesRef.current = Math.max(0, livesRef.current - 1);
                            setLives(livesRef.current);

                            enemiesRef.current = [];
                            bulletsRef.current = [];
                            lastSpawnRef.current = timestamp;
                            spawnEnemies();
                        }

                        break; // One bullet hits at most one enemy
                    }
                }
            }

            bulletsRef.current = bulletsRef.current.filter((b) => !bulletsToRemove.has(b.id));
            enemiesRef.current = enemiesRef.current.filter((e) => !enemiesToRemove.has(e.id));

            // Now check if any enemies reached the bottom (only penalize correct answer falling off)
            const reachedBottom = enemiesRef.current.filter((e) => e.y > canvasSizeRef.current.height);

            const missedCorrect = reachedBottom.find(e => e.isCorrect);
            if (missedCorrect) {
                console.log('[Shooter] CORRECT MISSED (fell off): cardIdx', currentCardIndexRef.current, 'word', missedCorrect.word);
                const liveCard = gameCardsRef.current?.[currentCardIndexRef.current];
                if (liveCard && liveCard.id) {
                    processGameResult(liveCard.id, false);
                }

                livesRef.current = Math.max(0, livesRef.current - 1);
                setLives(livesRef.current);
            }

            enemiesRef.current = enemiesRef.current.filter((enemy) => enemy.y < canvasSizeRef.current.height);

            // If board is empty (all enemies fell off or no enemies left), respawn for current word
            if (enemiesRef.current.length === 0 && bulletsRef.current.length === 0 && gameCardsRef.current.length > 0) {
                console.log('[Shooter] Board empty - respawn cardIdx', currentCardIndexRef.current);
                spawnEnemies();
            }

            // Draw player
            drawPlayer(ctx, { x: playerXRef.current, y: canvasSizeRef.current.height - 70, width: playerWidth, height: playerHeight, color: '#3b82f6' });

            // Check game over
            if (livesRef.current <= 0) {
                setIsPlaying(false);
                setGameOver(true);
                return;
            }

            gameLoopRef.current = requestAnimationFrame(gameLoop);
        };

        gameLoopRef.current = requestAnimationFrame(gameLoop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [isPlaying]);

    const startGame = () => {
        scoreRef.current = 0;
        livesRef.current = 10;
        currentCardIndexRef.current = 0;
        enemiesRef.current = [];
        bulletsRef.current = [];

        // Force-size canvas NOW — no timing race
        const canvas = canvasRef.current;
        if (canvas) {
            const w = Math.min(window.innerWidth - 32, 960);
            const h = Math.min(window.innerHeight * 0.78, 800);
            if (w >= 50 && h >= 50) {
                canvas.width = w;
                canvas.height = h;
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                canvasSizeRef.current = { width: w, height: h };
                starsRef.current = createStars(50, w, h);
            }
            playerXRef.current = Math.max(0, (canvasSizeRef.current.width - playerWidth) / 2);
        }

        // Snapshot the shuffled cards so IndexedDB updates from processGameResult don't reshuffle mid-game
        gameCardsRef.current = shuffledCardsRef.current.length > 0 ? [...shuffledCardsRef.current] : [];

        setScore(0);
        setLives(10);
        setGameOver(false);
        setGameWon(false);
        setIsPlaying(true);
        lastSpawnRef.current = 0;
        spawnEnemies();
    };

    if (!deck || !cards || cards.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">No cards to play</p>
                    <Button onClick={() => navigate(`/deck/${deckId}`)}>
                        Back to Deck
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-dvh bg-background overflow-hidden flex flex-col">
            <div className="flex-shrink-0 px-3 py-1.5 flex items-center justify-between z-10 border-b border-border/30">
                <Button variant="ghost" onClick={() => navigate(`/deck/${deckId}`)} className="-ml-2 h-8">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="flex items-center gap-2">
                    <div className="bg-card px-2 py-1 rounded border text-center">
                        <p className="text-[10px] text-muted-foreground leading-tight">Score</p>
                        <p className="text-base font-bold text-primary leading-tight">{score}</p>
                    </div>
                    <div className="bg-card px-2 py-1 rounded border text-center">
                        <p className="text-[10px] text-muted-foreground leading-tight">Lives</p>
                        <p className="text-base font-bold text-red-500 leading-tight">{lives}</p>
                    </div>
                    {!isPlaying && !gameOver && (
                        <Button onClick={startGame} size="sm" className="h-8">
                            <Play className="w-4 h-4 mr-1" /> Start
                        </Button>
                    )}
                    {isPlaying && (
                        <Button onClick={() => setIsPlaying(false)} size="icon" variant="outline" className="h-8 w-8">
                            <Pause className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {currentCard && (
                <motion.div
                    key={currentCardIndexRef.current}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-shrink-0 px-3 py-1.5"
                >
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-xs text-white/80 mb-0.5">Find the answer:</p>
                        <p className="text-base sm:text-lg font-bold text-white truncate">{currentCard.front}</p>
                    </div>
                </motion.div>
            )}

            <div className="flex-1 relative min-h-0 flex items-center justify-center overflow-hidden">
                <div className="relative rounded-lg border-2 border-primary/30 bg-slate-900 shadow-2xl overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className="block touch-none"
                        onClick={shootBullet}
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1.5 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                        <p className="text-white text-xs sm:text-sm">↔ Move · Tap/Space to Shoot</p>
                    </div>
                    {!isPlaying && !gameOver && !gameWon && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                            <Button onClick={startGame} size="lg" className="shadow-xl text-base px-8">
                                <Play className="w-5 h-5 mr-2" /> Start Game
                            </Button>
                        </div>
                    )}
                    <AnimatePresence>
                        {(gameOver || gameWon) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
                            >
                                <div className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-xs sm:max-w-md mx-3">
                                    {gameWon ? (
                                        <>
                                            <h2 className="text-3xl sm:text-4xl font-bold text-green-400 mb-4">You Win!</h2>
                                            <p className="text-xl sm:text-2xl mb-2">Final Score: {score}</p>
                                            <p className="text-sm text-muted-foreground mb-6">
                                                All cards completed! Great job!
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Game Over!</h2>
                                            <p className="text-xl sm:text-2xl mb-2">Final Score: {score}</p>
                                            <p className="text-sm text-muted-foreground mb-6">
                                                You answered {Math.floor(score / 10)} cards correctly!
                                            </p>
                                        </>
                                    )}
                                    <div className="flex gap-3 justify-center flex-wrap">
                                        <Button onClick={startGame} size="lg">
                                            <Play className="w-4 h-4 mr-2" /> Play Again
                                        </Button>
                                        <Button onClick={() => navigate(`/deck/${deckId}`)} size="lg" variant="outline">
                                            Back to Deck
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
