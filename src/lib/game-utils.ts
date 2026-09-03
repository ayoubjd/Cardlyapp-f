import { Flashcard } from './db';

export interface Enemy {
    id: number;
    x: number;
    y: number;
    word: string;
    isCorrect: boolean;
    speed: number;
    width: number;
    height: number;
    color: string;
    type: 'correct' | 'wrong';
    initialX: number;
    movementType: 'straight' | 'sine' | 'search';
    phaseOffset: number;
}

export interface Bullet {
    id: number;
    x: number;
    y: number;
    speed: number;
    width: number;
    height: number;
    color: string;
}

export interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

export interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    brightness: number;
}

// Check collision between two rectangles
export function checkCollision(
    obj1: { x: number; y: number; width: number; height: number },
    obj2: { x: number; y: number; width: number; height: number }
): boolean {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// Get random wrong answers from deck (excluding correct answer)
export function getWrongAnswers(
    cards: Flashcard[],
    correctAnswer: string,
    count: number
): string[] {
    if (correctAnswer === undefined || correctAnswer === null || correctAnswer === '') return [];
    const wrongCards = cards.filter(card => card.back !== correctAnswer);
    const shuffled = [...wrongCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(card => card.back);
}

// Calculate difficulty based on score
export function getDifficulty(score: number): {
    enemyCount: number;
    enemySpeed: number;
    spawnInterval: number;
} {
    const level = Math.floor(score / 50);
    return {
        enemyCount: 4, // Always 4 enemies per word
        enemySpeed: 1.2 + level * 0.3, // Reduced start speed (was 1.5)
        spawnInterval: Math.max(2500 - level * 200, 1000),
    };
}

// Compute text wrapping: returns lines and chosen font size so it fits in maxWidth (≤ 3 lines)
function getTextLayout(word: string, maxWidth: number): { lines: string[]; fontSize: number } {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { lines: [word || ''], fontSize: 14 };

    const doWrap = (fs: number): string[] => {
        ctx.font = `bold ${fs}px Arial`;
        if (ctx.measureText(word || '').width <= maxWidth) return [word || ''];
        const words = (word || '').split(' ');
        const lines: string[] = [];
        let cur = '';
        for (const w of words) {
            const test = cur ? cur + ' ' + w : w;
            ctx.font = `bold ${fs}px Arial`;
            if (ctx.measureText(test).width > maxWidth && cur) {
                lines.push(cur);
                cur = w;
            } else {
                cur = test;
            }
        }
        if (cur) lines.push(cur);
        return lines;
    };

    let fontSize = 14;
    let lines = doWrap(fontSize);
    while (lines.length > 3 && fontSize > 8) {
        fontSize--;
        lines = doWrap(fontSize);
    }
    return { lines, fontSize };
}

// Create enemy with width adapted to word length (wraps to ≤ 3 lines for long phrases)
export function createEnemy(
    id: number,
    word: string,
    isCorrect: boolean,
    canvasWidth: number,
    speed: number
): Enemy {
    const isMobile = canvasWidth < 600;
    const maxShipWidth = isMobile ? Math.min(canvasWidth * 0.5, 140) : Math.min(canvasWidth * 0.45, 200);
    const padding = isMobile ? 28 : 36;
    const textAvailWidth = maxShipWidth - 15;

    const { lines, fontSize } = getTextLayout(word, textAvailWidth);
    const lineCount = lines.length;

    let width: number;
    let height: number;

    if (lineCount === 1) {
        const tmpCtx = document.createElement('canvas').getContext('2d');
        let tw = 100;
        if (tmpCtx) {
            tmpCtx.font = 'bold 14px Arial';
            tw = tmpCtx.measureText(word || '').width;
        }
        width = Math.max(isMobile ? 64 : 80, Math.min(tw + padding, maxShipWidth));
        height = isMobile ? 40 : 60;
    } else {
        width = maxShipWidth;
        const lineH = fontSize + 4;
        height = Math.max(isMobile ? 40 : 60, lineCount * lineH + 20);
    }

    const x = Math.random() * (canvasWidth - width);

    // Randomize colors (Unlink from correctness)
    const colors = ['#ef4444', '#f97316', '#a855f7', '#0ea5e9', '#10b981', '#ec4899']; // Red, Orange, Purple, Blue, Green, Pink
    const color = colors[Math.floor(Math.random() * colors.length)];
    const type = isCorrect ? 'correct' : 'wrong';

    // Movement: All active zig-zag/sine
    const movementType = Math.random() > 0.5 ? 'sine' : 'search';

    // Ensure 'search' acts like zigzag/sine but wider
    const phaseOffset = Math.random() * Math.PI * 2;

    return {
        id,
        x,
        y: -height,
        word,
        isCorrect,
        speed,
        width,
        height,
        color,
        type,
        initialX: x,
        movementType,
        phaseOffset
    };
}

export function createParticle(x: number, y: number, color: string): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    return {
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 3 + 2
    };
}

// Create bullet at player position
export function createBullet(id: number, playerX: number, playerWidth: number): Bullet {
    return {
        id,
        x: playerX + playerWidth / 2 - 2.5,
        y: 550, // This should probably be dynamic based on canvas height, but hardcoded for now is fine as long as we pass playerY if needed. 
        // Better: We should probably require playerY passed in if we want it fully dynamic. 
        // For now, I'll keep the signature but expect y adjustment in the game loop or logic if needed, 
        // but '550' assumes a 600 height. I should make this smarter or just accept it's a fixed spawn point relative to player.
        // Actually, let's just use the hardcoded value and adjust it in updating logic if canvas height changes? 
        // No, let's fix this properly in the caller or here. 
        // I'll leave '550' for now but rely on the Caller to possibly overwrite it if needed, or better yet, I should update the signature.
        // Let's update signature to take playerY.
        speed: 8,
        width: 4,
        height: 20,
        color: '#f43f5e' // Rose/Red laser
    };
}

// Fixed createBullet to handle variable height if I wanted, but for now sticking to the existing pattern but correcting the syntax.
// Actually, let's overloading `createBullet` slightly or just fix the Y later. 
// I will keep it simple for now to match the existing calls, but note that the caller might need to set Y if the canvas height is different.
// Wait, the previous code had specific hardcoded Y.
// Let's modify createBullet signature to be safe for mobile/variable height.
export function createBulletWithLocation(id: number, x: number, y: number): Bullet {
    return {
        id,
        x: x - 2,
        y: y,
        speed: 8,
        width: 4,
        height: 20,
        color: '#f43f5e'
    };
}

export function createStars(count: number, width: number, height: number): Star[] {
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
            brightness: Math.random()
        });
    }
    return stars;
}

// Drawing Functions

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    // Fuselage
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2); // Nose
    ctx.quadraticCurveTo(player.width / 3, 0, player.width / 2, player.height / 2); // Right wing tip
    ctx.lineTo(0, player.height / 3); // Rear center
    ctx.lineTo(-player.width / 2, player.height / 2); // Left wing tip
    ctx.quadraticCurveTo(-player.width / 3, 0, 0, -player.height / 2); // Back to nose
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-5, player.height / 3);
    ctx.lineTo(5, player.height / 3);
    ctx.lineTo(0, player.height / 2 + 10);
    ctx.fill();

    ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

    // Turbo flame above the rectangle
    const flameHeight = enemy.height * 0.55;
    const time = Date.now() / 150;
    const flicker = Math.sin(time) * 0.25 + 0.75;
    const flicker2 = Math.sin(time * 1.5 + 1) * 0.2 + 0.8;

    // Outer flame
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-enemy.width / 6, -enemy.height / 2);
    ctx.lineTo(-enemy.width / 10, -enemy.height / 2 - flameHeight * flicker);
    ctx.lineTo(0, -enemy.height / 2 - flameHeight * flicker2);
    ctx.lineTo(enemy.width / 10, -enemy.height / 2 - flameHeight * flicker);
    ctx.lineTo(enemy.width / 6, -enemy.height / 2);
    ctx.closePath();
    ctx.fill();

    // Inner flame
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-enemy.width / 7, -enemy.height / 2);
    ctx.lineTo(0, -enemy.height / 2 - flameHeight * 0.65 * flicker2);
    ctx.lineTo(enemy.width / 7, -enemy.height / 2);
    ctx.closePath();
    ctx.fill();

    // Core flame
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.moveTo(-enemy.width / 10, -enemy.height / 2);
    ctx.lineTo(0, -enemy.height / 2 - flameHeight * 0.4 * flicker);
    ctx.lineTo(enemy.width / 10, -enemy.height / 2);
    ctx.closePath();
    ctx.fill();

    // Rectangle body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.roundRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height, 5);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height, 5);
    ctx.stroke();

    // Draw Word (multiline support)
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxTextWidth = enemy.width - 15;

    // Compute lines — wraps at spaces, max 3 lines, reduces font if needed
    const computeLines = (fs: number): string[] => {
        ctx.font = `bold ${fs}px Arial`;
        if (ctx.measureText(enemy.word || '').width <= maxTextWidth) return [enemy.word || ''];
        const words = (enemy.word || '').split(' ');
        const out: string[] = [];
        let cur = '';
        for (const w of words) {
            const test = cur ? cur + ' ' + w : w;
            ctx.font = `bold ${fs}px Arial`;
            if (ctx.measureText(test).width > maxTextWidth && cur) {
                out.push(cur);
                cur = w;
            } else {
                cur = test;
            }
        }
        if (cur) out.push(cur);
        return out;
    };

    let fontSize = 14;
    let lines = computeLines(fontSize);
    while (lines.length > 3 && fontSize > 8) {
        fontSize--;
        lines = computeLines(fontSize);
    }

    const lineH = fontSize + 4;
    const totalTextH = lines.length * lineH + 8;
    const bgY = -totalTextH / 2;

    // Text background covering all lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(-enemy.width / 2 + 5, bgY, enemy.width - 10, totalTextH, 5);
    ctx.fill();

    // Draw each line centered
    ctx.fillStyle = "#ffffff";
    const startY = bgY + 4 + lineH / 2;
    lines.forEach((line, i) => {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(line, 0, startY + i * lineH);
    });

    ctx.restore();
}

export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet) {
    ctx.save();
    ctx.translate(bullet.x, bullet.y);

    // Glowing laser effect
    ctx.strokeStyle = bullet.color;
    ctx.lineWidth = bullet.width;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = bullet.color;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, bullet.height);
    ctx.stroke();

    ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}
