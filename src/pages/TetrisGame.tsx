import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RotateCcw, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { processGameResult } from "@/lib/study-integration";

const BLOCK_SIZE = 40;
const COLS = 12;
const GAME_ROWS = 13;
const OPTIONS_ROWS = 2;
const TOTAL_ROWS = GAME_ROWS + OPTIONS_ROWS;
const CANVAS_WIDTH = COLS * BLOCK_SIZE;
const CANVAS_HEIGHT = TOTAL_ROWS * BLOCK_SIZE;

const FALLING_BLOCK_W = 3;
const FALLING_BLOCK_H = 1;

const OPTIONS_Y = GAME_ROWS * BLOCK_SIZE;
const FALL_SPEED = 2;
const FAST_FALL_SPEED = 8;
const MAX_FALL_SPEED = 6;
const SPEED_INCREMENT = 0.3;
const STREAK_THRESHOLD = 5;

type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface FallingBlock {
  col: number;
  y: number;
  isGolden?: boolean;
}

interface OptionData {
  word: string;
  isCorrect: boolean;
}

interface StuckBlock {
  col: number;
  row: number;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export default function TetrisGame() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const deck = useLiveQuery(() => db.decks.get(Number(deckId)));
  const cards = useLiveQuery(
    () => db.flashcards.where("deckId").equals(Number(deckId)).toArray(),
    [deckId]
  );

  const validCards = useMemo(() => {
    if (!cards) return [];
    return cards.filter(c => c.back && c.back.trim().length > 0);
  }, [cards]);

  const gameStateRef = useRef<GameState>('START');
  const fallingBlockRef = useRef<FallingBlock | null>(null);
  const optionsRef = useRef<OptionData[]>([]);
  const stuckGridRef = useRef<boolean[][]>([]);
  const stuckBlocksRef = useRef<StuckBlock[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(FALL_SPEED);
  const baseSpeedRef = useRef(FALL_SPEED);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const currentCardIndexRef = useRef(0);
  const shuffledDeckRef = useRef<any[]>([]);
  const correctStreakRef = useRef(0);
  const goldenCooldownRef = useRef(0);

  const [uiState, setUiState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const initGrid = () => {
    stuckGridRef.current = Array.from({ length: GAME_ROWS }, () => Array(COLS).fill(false));
    stuckBlocksRef.current = [];
  };

  const doesCollide = (col: number, row: number) => {
    if (row < 0 || col < 0) return true;
    if (row + FALLING_BLOCK_H > GAME_ROWS) return true;
    if (col + FALLING_BLOCK_W > COLS) return true;
    for (let r = row; r < row + FALLING_BLOCK_H; r++) {
      for (let c = col; c < col + FALLING_BLOCK_W; c++) {
        if (stuckGridRef.current[r]?.[c]) return true;
      }
    }
    return false;
  };

  const startGame = () => {
    if (!validCards || validCards.length === 0) return;
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = undefined;
    }
    shuffledDeckRef.current = [...validCards].sort(() => Math.random() - 0.5);
    currentCardIndexRef.current = 0;
    scoreRef.current = 0;
    speedRef.current = FALL_SPEED;
    baseSpeedRef.current = FALL_SPEED;
    correctStreakRef.current = 0;
    goldenCooldownRef.current = 0;
    initGrid();
    setScore(0);
    setUiState('PLAYING');
    gameStateRef.current = 'PLAYING';
    nextLevel();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = () => {
    gameStateRef.current = 'GAME_OVER';
    setUiState('GAME_OVER');
    setCurrentQuestion("");
  };

  const generateOptions = (correctCard: any) => {
    const correctWord = correctCard.back;
    const otherCards = validCards.filter(c => c.id !== correctCard.id);
    const distractors = otherCards
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(c => c.back);

    const allWords = [correctWord, ...distractors].sort(() => Math.random() - 0.5);
    return allWords.map(w => ({
      word: w,
      isCorrect: w === correctWord,
    }));
  };

  const nextLevel = () => {
    if (currentCardIndexRef.current >= shuffledDeckRef.current.length) {
      currentCardIndexRef.current = 0;
      shuffledDeckRef.current = [...validCards].sort(() => Math.random() - 0.5);
    }

    const card = shuffledDeckRef.current[currentCardIndexRef.current];
    setCurrentQuestion(card.front);

    speedRef.current = baseSpeedRef.current;

    const spawnCol = Math.floor((COLS - FALLING_BLOCK_W) / 2);
    if (doesCollide(spawnCol, 0)) {
      handleGameOver();
      return;
    }

    let isGolden = false;
    if (goldenCooldownRef.current <= 0) {
      isGolden = Math.random() < 0.1;
      if (isGolden) goldenCooldownRef.current = 3;
    } else {
      goldenCooldownRef.current--;
    }
    fallingBlockRef.current = {
      col: spawnCol,
      y: -FALLING_BLOCK_H * BLOCK_SIZE,
      isGolden,
    };

    optionsRef.current = generateOptions(card);
  };

  const onBlockSettle = (block: FallingBlock) => {
    const zoneSize = COLS / 3;
    const centerCol = block.col + Math.floor(FALLING_BLOCK_W / 2);
    const zoneIndex = Math.floor(centerCol / zoneSize);

    const card = shuffledDeckRef.current[currentCardIndexRef.current];
    const cardId = card?.id;
    const selectedOption = optionsRef.current[zoneIndex];

    if (selectedOption?.isCorrect) {
      processGameResult(cardId, true);
      scoreRef.current += 100;
      setScore(scoreRef.current);
      correctStreakRef.current++;
      if (correctStreakRef.current % STREAK_THRESHOLD === 0) {
        baseSpeedRef.current = Math.min(baseSpeedRef.current + SPEED_INCREMENT, MAX_FALL_SPEED);
      }
      if (block.isGolden) {
        for (let i = 0; i < 3 && stuckBlocksRef.current.length > 0; i++) {
          const sb = stuckBlocksRef.current.pop()!;
          for (let r = sb.row; r < sb.row + FALLING_BLOCK_H; r++) {
            for (let c = sb.col; c < sb.col + FALLING_BLOCK_W; c++) {
              if (r >= 0 && r < GAME_ROWS && c >= 0 && c < COLS) {
                stuckGridRef.current[r][c] = false;
              }
            }
          }
        }
      }
      currentCardIndexRef.current++;
      fallingBlockRef.current = null;
      nextLevel();
    } else {
      processGameResult(cardId, false);
      correctStreakRef.current = 0;
      baseSpeedRef.current = FALL_SPEED;
      speedRef.current = FALL_SPEED;
      const gridRow = Math.floor(block.y / BLOCK_SIZE);
      if (gridRow < 0) {
        handleGameOver();
        return;
      }
      for (let r = gridRow; r < gridRow + FALLING_BLOCK_H; r++) {
        for (let c = block.col; c < block.col + FALLING_BLOCK_W; c++) {
          if (r >= 0 && r < GAME_ROWS && c >= 0 && c < COLS) {
            stuckGridRef.current[r][c] = true;
          }
        }
      }
      stuckBlocksRef.current.push({ col: block.col, row: gridRow });
      let topBlocked = false;
      for (let c = 0; c < COLS; c++) {
        if (stuckGridRef.current[0][c]) {
          topBlocked = true;
          break;
        }
      }
      if (topBlocked) {
        handleGameOver();
        return;
      }
      currentCardIndexRef.current++;
      fallingBlockRef.current = null;
      nextLevel();
    }
  };

  const handleInput = useCallback((action: 'LEFT' | 'RIGHT' | 'DOWN') => {
    if (gameStateRef.current !== 'PLAYING' || !fallingBlockRef.current) return;
    const block = fallingBlockRef.current;
    if (action === 'LEFT') {
      if (block.col > 0) block.col--;
    } else if (action === 'RIGHT') {
      if (block.col + FALLING_BLOCK_W < COLS) block.col++;
    } else if (action === 'DOWN') {
      speedRef.current = FAST_FALL_SPEED;
    }
  }, []);

  const update = () => {
    const block = fallingBlockRef.current;
    if (!block) return;

    block.y += speedRef.current;

    const currentRow = Math.floor(block.y / BLOCK_SIZE);
    if (currentRow < 0) return;

    if (doesCollide(block.col, currentRow)) {
      let row = currentRow - 1;
      while (row >= 0 && doesCollide(block.col, row)) {
        row--;
      }
      if (row < 0) {
        handleGameOver();
        return;
      }
      block.y = row * BLOCK_SIZE;
      onBlockSettle(block);
      return;
    }

    const nextRow = currentRow + 1;
    const maxRow = GAME_ROWS - FALLING_BLOCK_H;

    if (nextRow > maxRow || doesCollide(block.col, nextRow)) {
      block.y = currentRow * BLOCK_SIZE;
      onBlockSettle(block);
    }
  };

  const gameLoop = (time: number) => {
    if (gameStateRef.current !== 'PLAYING') {
      lastTimeRef.current = time;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    lastTimeRef.current = time;
    update();
    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += BLOCK_SIZE) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += BLOCK_SIZE) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (let col = 4; col < COLS; col += 4) {
      const x = col * BLOCK_SIZE;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, OPTIONS_Y); ctx.stroke();
    }

    stuckBlocksRef.current.forEach(sb => {
      const x = sb.col * BLOCK_SIZE;
      const y = sb.row * BLOCK_SIZE;
      const w = FALLING_BLOCK_W * BLOCK_SIZE;
      const h = FALLING_BLOCK_H * BLOCK_SIZE;
      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 6);
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const block = fallingBlockRef.current;
    if (block) {
      const x = block.col * BLOCK_SIZE;
      const y = block.y;
      const w = FALLING_BLOCK_W * BLOCK_SIZE;
      const h = FALLING_BLOCK_H * BLOCK_SIZE;
      const isGolden = block.isGolden;

      ctx.fillStyle = isGolden ? 'rgba(34, 197, 94, 0.25)' : 'rgba(236, 72, 153, 0.25)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = isGolden ? '#22c55e' : '#ec4899';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = isGolden ? '#4ade80' : '#f472b6';
      ctx.shadowBlur = 10;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const arrowSize = Math.min(w, h) * 0.35;
      ctx.fillStyle = isGolden ? '#4ade80' : '#f472b6';
      ctx.beginPath();
      ctx.moveTo(cx, cy - arrowSize);
      ctx.lineTo(cx + arrowSize * 0.8, cy + arrowSize * 0.2);
      ctx.lineTo(cx + arrowSize * 0.3, cy + arrowSize * 0.2);
      ctx.lineTo(cx + arrowSize * 0.3, cy + arrowSize);
      ctx.lineTo(cx - arrowSize * 0.3, cy + arrowSize);
      ctx.lineTo(cx - arrowSize * 0.3, cy + arrowSize * 0.2);
      ctx.lineTo(cx - arrowSize * 0.8, cy + arrowSize * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isGolden ? '#4ade80' : '#a1a1aa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = '9px sans-serif';
      ctx.fillText(isGolden ? '★ clear' : 'look ↑', cx, y - 3);
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, OPTIONS_Y, CANVAS_WIDTH, OPTIONS_ROWS * BLOCK_SIZE);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, OPTIONS_Y); ctx.lineTo(CANVAS_WIDTH, OPTIONS_Y); ctx.stroke();

    const optW = CANVAS_WIDTH / 3;
    const optH = OPTIONS_ROWS * BLOCK_SIZE;
    const optY = OPTIONS_Y;
    const zoneNames = ['A', 'B', 'C'];

    optionsRef.current.forEach((opt, i) => {
      const ox = i * optW;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(ox + 4, optY + 4, optW - 8, optH - 8, 8);
      ctx.fill();
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(zoneNames[i], ox + optW / 2, optY + 8);

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      let fontSize = 16;
      let lines: string[] = [];
      const maxTextWidth = optW - 24;
      const maxTextHeight = optH - 24;

      do {
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        lines = wrapText(ctx, opt.word, maxTextWidth);
        const totalHeight = lines.length * fontSize * 1.3;
        if (totalHeight <= maxTextHeight) break;
        fontSize--;
      } while (fontSize > 8);

      const lineHeight = fontSize * 1.3;
      const totalLinesHeight = lines.length * lineHeight;
      const startY = optY + (optH - totalLinesHeight) / 2 + lineHeight / 2 + 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, ox + optW / 2, startY + i * lineHeight);
      });
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleInput('LEFT'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleInput('RIGHT'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); handleInput('DOWN'); }
      if (e.key === ' ') {
        e.preventDefault();
        if (gameStateRef.current === 'PLAYING') {
          gameStateRef.current = 'PAUSED';
          setUiState('PAUSED');
        } else if (gameStateRef.current === 'PAUSED') {
          gameStateRef.current = 'PLAYING';
          setUiState('PLAYING');
          lastTimeRef.current = performance.now();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        speedRef.current = baseSpeedRef.current;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInput]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  if (!deck) return <div>Loading...</div>;

  return (
    <div className="h-dvh bg-slate-950 text-white overflow-hidden flex flex-col touch-none">
      <div className="flex-shrink-0 w-full max-w-md mx-auto px-4 pt-3 pb-1 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate(`/deck/${deckId}`)} className="text-slate-400 h-8">
            <ArrowLeft className="mr-1 h-4 w-4" /> Exit
          </Button>
          <div className="flex items-center gap-2">
            <div className="font-mono text-lg text-pink-500 font-bold leading-tight">{score}</div>
          </div>
        </div>

        {uiState === 'PLAYING' && currentQuestion && (
          <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-lg text-center backdrop-blur-sm shadow-lg min-h-[2.5rem] flex items-center justify-center">
            <p className="text-sm font-medium text-pink-100 leading-tight">{currentQuestion}</p>
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-0 px-3 pb-3 flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="relative rounded-xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-slate-950"
          style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block w-full h-full"
          />

          {uiState === 'START' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-4 text-center">
              <h1 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">TETRIS CONNECT</h1>
              <p className="text-slate-300 text-sm mb-6 max-w-[180px]">Drop the block on the correct zone.</p>
              <Button onClick={startGame} className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-4 text-lg rounded-full shadow-lg hover:shadow-pink-500/20 transition-all w-full max-w-[180px]">
                <Play className="mr-2 fill-current" /> PLAY
              </Button>
            </div>
          )}

          {uiState === 'PAUSED' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
              <h2 className="text-2xl font-bold text-white mb-2">PAUSED</h2>
              <p className="text-slate-400 text-sm mb-4">Press SPACE to resume</p>
              <Button onClick={() => {
                gameStateRef.current = 'PLAYING';
                setUiState('PLAYING');
                lastTimeRef.current = performance.now();
              }} className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm">
                <Play className="mr-2 fill-current" /> RESUME
              </Button>
            </div>
          )}

          {uiState === 'GAME_OVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-10">
              <h2 className="text-2xl font-bold text-red-500 mb-1">GAME OVER</h2>
              <p className="text-slate-400 text-sm mb-4">Final Score: {score}</p>
              <Button onClick={startGame} className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm">
                <RotateCcw className="mr-2" /> RESTART
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-cols-3 gap-2 pb-3 w-full max-w-xs mx-auto md:hidden">
        <Button className="h-10 rounded-xl bg-slate-900 active:bg-slate-800 active:scale-95 transition-all border border-slate-800" onClick={() => handleInput('LEFT')}>
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Button>
        <Button className="h-10 rounded-xl bg-slate-900 active:bg-slate-800 active:scale-95 transition-all border border-slate-800" onClick={() => handleInput('DOWN')}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </Button>
        <Button className="h-10 rounded-xl bg-slate-900 active:bg-slate-800 active:scale-95 transition-all border border-slate-800" onClick={() => handleInput('RIGHT')}>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}
