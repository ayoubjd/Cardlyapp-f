import { Flashcard } from './db';

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ReviewResult {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: Date;
}

/**
 * SM-2 Algorithm implementation
 * @param card - The flashcard to review
 * @param quality - Quality of recall (0-5)
 * @returns Updated card statistics
 */
export function calculateNextReview(
  card: Flashcard,
  quality: ReviewQuality
): ReviewResult {
  let { ease, interval, repetitions } = card;

  if (quality < 3) {
    // Failed recall - reset
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  }

  // Update ease factor
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ease,
    interval,
    repetitions,
    nextReview
  };
}
