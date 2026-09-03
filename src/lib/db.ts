import Dexie, { Table } from 'dexie';

export interface Flashcard {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  imageUrl?: string;
  createdAt: Date;
  lastReviewed?: Date;
  nextReview?: Date;
  ease: number;
  interval: number;
  repetitions: number;
  cloudId?: string;
}

export interface Deck {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
  color?: string;
  category?: string;
  deckType?: 'standard' | 'one-sided';
  cloudId?: string;
}

export interface StudySession {
  id?: number;
  deckId: number;
  mode: 'spaced' | 'typing' | 'quiz' | 'multiple-choice';
  cardsStudied: number;
  correctCount: number;
  totalTime: number;
  completedAt: Date;
  cloudId?: string;
}

export class FlashcardsDB extends Dexie {
  flashcards!: Table<Flashcard>;
  decks!: Table<Deck>;
  studySessions!: Table<StudySession>;

  constructor() {
    super('FlashcardsDB');
    this.version(1).stores({
      flashcards: '++id, deckId, createdAt, nextReview',
      decks: '++id, name, createdAt'
    });
    this.version(2).stores({
      flashcards: '++id, deckId, createdAt, nextReview',
      decks: '++id, name, createdAt',
      studySessions: '++id, deckId, mode, completedAt'
    });
    this.version(3).stores({
      flashcards: '++id, deckId, createdAt, nextReview',
      decks: '++id, name, createdAt, category',
      studySessions: '++id, deckId, mode, completedAt'
    });
  }
}

export const db = new FlashcardsDB();

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

import { defaultDecks } from './default-data';

const OLD_LANGUAGE_CATEGORIES = ['english', 'french', 'spanish', 'japanese', 'chinese'];

export async function seedDatabase() {
  console.log("Checking for default decks...");

  await db.transaction('rw', db.decks, db.flashcards, async () => {
    // Clean up old language-category decks from previous app version
    const allDecks = await db.decks.toArray();
    for (const deck of allDecks) {
      if (deck.category && OLD_LANGUAGE_CATEGORIES.includes(deck.category)) {
        console.log(`Removing old language deck: ${deck.name} (${deck.category})`);
        await db.flashcards.where('deckId').equals(deck.id!).delete();
        await db.decks.delete(deck.id!);
      }
    }

    // Seed the 3 default decks
    for (const deckData of defaultDecks) {
      const existing = await db.decks.where('name').equals(deckData.name).first();

      if (!existing) {
        console.log(`Seeding deck: ${deckData.name}`);
        const deckId = await db.decks.add({
          name: deckData.name,
          description: deckData.description,
          createdAt: new Date(),
          color: '#10b981',
          category: 'general'
        });

        const cardsToAdd = deckData.cards.map(card => ({
          deckId: Number(deckId),
          front: card.front,
          back: card.back,
          imageUrl: card.imageUrl,
          createdAt: new Date(),
          ease: 2.5,
          interval: 0,
          repetitions: 0
        }));
        await db.flashcards.bulkAdd(cardsToAdd);
      } else {
        // Update existing deck's description (may have changed)
        if (existing.description !== deckData.description) {
          await db.decks.update(existing.id!, { description: deckData.description });
        }
        // Check if deck content changed — replace cards if so
        const existingCards = await db.flashcards.where('deckId').equals(existing.id!).toArray();
        const contentChanged =
          existingCards.length !== deckData.cards.length ||
          existingCards.some((c, i) => c.front !== deckData.cards[i]?.front);
        if (contentChanged) {
          console.log(`Updating cards for deck: ${deckData.name}`);
          await db.flashcards.where('deckId').equals(existing.id!).delete();
          const cardsToAdd = deckData.cards.map(card => ({
            deckId: Number(existing.id!),
            front: card.front,
            back: card.back,
            imageUrl: card.imageUrl,
            createdAt: new Date(),
            ease: 2.5,
            interval: 0,
            repetitions: 0
          }));
          await db.flashcards.bulkAdd(cardsToAdd);
        } else if (deckData.cards.some(c => c.imageUrl)) {
          // Update images if content hasn't changed but image URLs differ
          for (let i = 0; i < deckData.cards.length && i < existingCards.length; i++) {
            const srcCard = deckData.cards[i];
            const destCard = existingCards[i];
            if (srcCard.imageUrl && srcCard.imageUrl !== destCard.imageUrl && destCard.front === srcCard.front) {
              await db.flashcards.update(destCard.id!, { imageUrl: srcCard.imageUrl });
              console.log(`Updated image for card: ${destCard.front}`);
            }
          }
        }
      }
    }
  });

  console.log("Seeding check complete.");
}
