import { db } from "./db";
import { auth } from "./firebase";
import {
  addDeckToFirestore,
  updateDeckInFirestore,
  deleteDeckFromFirestore,
  addFlashcardToFirestore,
  updateFlashcardInFirestore,
  deleteFlashcardFromFirestore,
  addSessionToFirestore,
  loadDecksFromFirestore,
  loadCardsFromFirestore,
  loadSessionsFromFirestore,
} from "./firebase";
import { defaultDecks } from "./default-data";
import { seedDatabase } from "./db";

let syncPromise: Promise<void> | null = null;

export async function syncAllFromFirestore(userId: string): Promise<void> {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const [fireDecks, fireCards, fireSessions] = await Promise.all([
      loadDecksFromFirestore(userId),
      loadCardsFromFirestore(userId),
      loadSessionsFromFirestore(userId),
    ]);

    // Always clear Dexie first to remove any previous user's data
    await db.decks.clear();
    await db.flashcards.clear();
    await db.studySessions.clear();

    if (fireDecks.length === 0) {
      // New user — seed defaults, then push to Firestore
      await seedDatabase();
      await pushLocalToFirestore(userId);
      return;
    }

    // Existing user — reload Dexie from Firestore data
    for (const d of fireDecks) {
      await db.decks.add({
        id: d.localId,
        name: d.name,
        description: d.description || "",
        createdAt: d.createdAt || new Date(),
        color: d.color || "#10b981",
        category: d.category || "general",
        deckType: d.deckType || "standard",
        cloudId: d.cloudId,
      });
    }
    for (const c of fireCards) {
      await db.flashcards.add({
        id: c.localId,
        deckId: c.deckId,
        front: c.front,
        back: c.back,
        imageUrl: c.imageUrl || undefined,
        createdAt: c.createdAt || new Date(),
        lastReviewed: c.lastReviewed || undefined,
        nextReview: c.nextReview || undefined,
        ease: c.ease ?? 2.5,
        interval: c.interval ?? 0,
        repetitions: c.repetitions ?? 0,
        cloudId: c.cloudId,
      });
    }
    for (const s of fireSessions) {
      await db.studySessions.add({
        id: s.localId,
        deckId: s.deckId,
        mode: s.mode,
        cardsStudied: s.cardsStudied,
        correctCount: s.correctCount,
        totalTime: s.totalTime,
        completedAt: s.completedAt || new Date(),
        cloudId: s.cloudId,
      });
    }
  })();
  const result = await syncPromise;
  syncPromise = null;
  return result;
}

async function pushLocalToFirestore(userId: string) {
  const localDecks = await db.decks.toArray();
  for (const deck of localDecks) {
    if (deck.cloudId) continue;
    const deckRef = await addDeckToFirestore(userId, {
      name: deck.name,
      description: deck.description || "",
      createdAt: deck.createdAt,
      color: deck.color || "#10b981",
      category: deck.category || "general",
      deckType: deck.deckType || "standard",
    });
    await db.decks.update(deck.id!, { cloudId: deckRef.id });

    const localCards = await db.flashcards.where("deckId").equals(deck.id!).toArray();
    for (const card of localCards) {
      if (card.cloudId) continue;
      const cardRef = await addFlashcardToFirestore(userId, {
        deckId: deckRef.id,
        front: card.front,
        back: card.back,
        imageUrl: card.imageUrl || undefined,
        createdAt: card.createdAt,
        ease: card.ease ?? 2.5,
        interval: card.interval ?? 0,
        repetitions: card.repetitions ?? 0,
      });
      await db.flashcards.update(card.id!, { cloudId: cardRef.id });
    }
  }
}

function getUserId() {
  return auth.currentUser?.uid;
}

// Deck operations
export async function addDeck(deck: any) {
  const id = await db.decks.add(deck);
  try {
    const userId = getUserId();
    if (userId) {
      const ref = await addDeckToFirestore(userId, { ...deck, id });
      await db.decks.update(id, { cloudId: ref.id });
    }
  } catch (err) {
    console.warn('Firestore sync failed for deck (saved locally):', err);
  }
  return id;
}

export async function updateDeck(id: number, changes: any) {
  await db.decks.update(id, changes);
  const userId = getUserId();
  if (userId) {
    const deck = await db.decks.get(id);
    if (deck?.cloudId) {
      await updateDeckInFirestore(userId, deck.cloudId, changes);
    }
  }
}

export async function deleteDeck(id: number) {
  const userId = getUserId();
  const deck = await db.decks.get(id);
  await db.flashcards.where("deckId").equals(id).delete();
  await db.decks.delete(id);
  if (userId && deck?.cloudId) {
    await deleteDeckFromFirestore(userId, deck.cloudId);
  }
}

// Flashcard operations
export async function addFlashcard(card: any) {
  const id = await db.flashcards.add(card);
  try {
    const userId = getUserId();
    if (userId) {
      const ref = await addFlashcardToFirestore(userId, { ...card, id });
      await db.flashcards.update(id, { cloudId: ref.id });
    }
  } catch (err) {
    console.warn('Firestore sync failed for flashcard (saved locally):', err);
  }
  return id;
}

export async function updateFlashcard(id: number, changes: any) {
  await db.flashcards.update(id, changes);
  const userId = getUserId();
  if (userId) {
    const card = await db.flashcards.get(id);
    if (card?.cloudId) {
      await updateFlashcardInFirestore(userId, card.cloudId, changes);
    }
  }
}

export async function deleteFlashcard(id: number) {
  const userId = getUserId();
  const card = await db.flashcards.get(id);
  await db.flashcards.delete(id);
  if (userId && card?.cloudId) {
    await deleteFlashcardFromFirestore(userId, card.cloudId);
  }
}

// Study session operations
export async function addStudySession(session: any) {
  const id = await db.studySessions.add(session);
  const userId = getUserId();
  if (userId) {
    const ref = await addSessionToFirestore(userId, { ...session, id });
    await db.studySessions.update(id, { cloudId: ref.id });
  }
  return id;
}
