
import { db } from './db';
import { updateFlashcard } from './sync';
import { calculateNextReview } from './spacedRepetition';

/**
 * Updates a flashcard's spaced repetition statistics based on game performance.
 * @param cardId - The ID of the flashcard being reviewed.
 * @param isCorrect - Whether the user answered correctly.
 */
export async function processGameResult(cardId: number | undefined, isCorrect: boolean) {
    if (!cardId) return;

    try {
        const card = await db.flashcards.get(cardId);
        if (!card) return;

        // Quality mapping for games:
        // 4 = Correct response (Good / Passed)
        // 1 = Incorrect response (Fail / Hard)
        const quality = isCorrect ? 4 : 1;

        const result = calculateNextReview(card, quality);

        await updateFlashcard(cardId, {
            ease: result.ease,
            interval: result.interval,
            repetitions: result.repetitions,
            nextReview: result.nextReview,
            lastReviewed: new Date()
        });

        console.log(`[Game SRS] Card ${cardId} ${isCorrect ? 'Correct' : 'Wrong'} -> Interval: ${result.interval}, Reps: ${result.repetitions}`);

    } catch (error) {
        console.error("Failed to update spaced repetition stats:", error);
    }
}
