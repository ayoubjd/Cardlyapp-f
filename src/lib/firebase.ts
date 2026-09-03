import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAARkfYhfAHaLz5L2IeqvYII9IW9MlLue0",
  authDomain: "flashcards-games.firebaseapp.com",
  projectId: "flashcards-games",
  storageBucket: "flashcards-games.firebasestorage.app",
  messagingSenderId: "628355525884",
  appId: "1:628355525884:web:fb11e680b183a9d54f3b79",
  measurementId: "G-VR82XHP177",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence: browser not supported");
  }
});

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

const googleProvider = new GoogleAuthProvider();
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function logOut() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function deckToFirestore(deck: any) {
  return {
    name: deck.name,
    description: deck.description || "",
    createdAt: deck.createdAt instanceof Date ? Timestamp.fromDate(deck.createdAt) : deck.createdAt,
    color: deck.color || "#10b981",
    category: deck.category || "general",
    deckType: deck.deckType || "standard",
  };
}

function flashcardToFirestore(card: any) {
  return {
    deckId: card.deckId,
    front: card.front,
    back: card.back,
    imageUrl: card.imageUrl || "",
    createdAt: card.createdAt instanceof Date ? Timestamp.fromDate(card.createdAt) : card.createdAt,
    lastReviewed: card.lastReviewed instanceof Date ? Timestamp.fromDate(card.lastReviewed) : card.lastReviewed || null,
    nextReview: card.nextReview instanceof Date ? Timestamp.fromDate(card.nextReview) : card.nextReview || null,
    ease: card.ease ?? 2.5,
    interval: card.interval ?? 0,
    repetitions: card.repetitions ?? 0,
  };
}

function sessionToFirestore(session: any) {
  return {
    deckId: session.deckId,
    mode: session.mode,
    cardsStudied: session.cardsStudied,
    correctCount: session.correctCount,
    totalTime: session.totalTime,
    completedAt: session.completedAt instanceof Date ? Timestamp.fromDate(session.completedAt) : session.completedAt,
  };
}

export async function syncDecksToFirestore(userId: string, decks: any[]) {
  const batch = writeBatch(firestore);
  for (const deck of decks) {
    const ref = deck.cloudId
      ? doc(firestore, "users", userId, "decks", deck.cloudId)
      : doc(collection(firestore, "users", userId, "decks"));
    batch.set(ref, { ...deckToFirestore(deck), localId: deck.id });
  }
  await batch.commit();
}

export async function syncCardsToFirestore(userId: string, cards: any[]) {
  const batch = writeBatch(firestore);
  for (const card of cards) {
    const ref = card.cloudId
      ? doc(firestore, "users", userId, "flashcards", card.cloudId)
      : doc(collection(firestore, "users", userId, "flashcards"));
    batch.set(ref, { ...flashcardToFirestore(card), localId: card.id });
  }
  await batch.commit();
}

export async function syncSessionsToFirestore(userId: string, sessions: any[]) {
  const batch = writeBatch(firestore);
  for (const session of sessions) {
    const ref = session.cloudId
      ? doc(firestore, "users", userId, "studySessions", session.cloudId)
      : doc(collection(firestore, "users", userId, "studySessions"));
    batch.set(ref, { ...sessionToFirestore(session), localId: session.id });
  }
  await batch.commit();
}

export async function loadDecksFromFirestore(userId: string): Promise<any[]> {
  const snapshot = await getDocs(collection(firestore, "users", userId, "decks"));
  return snapshot.docs.map((d) => ({ cloudId: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() }));
}

export async function loadCardsFromFirestore(userId: string): Promise<any[]> {
  const snapshot = await getDocs(collection(firestore, "users", userId, "flashcards"));
  return snapshot.docs.map((d) => ({ cloudId: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate(), lastReviewed: d.data().lastReviewed?.toDate?.() || null, nextReview: d.data().nextReview?.toDate?.() || null }));
}

export async function loadSessionsFromFirestore(userId: string): Promise<any[]> {
  const snapshot = await getDocs(collection(firestore, "users", userId, "studySessions"));
  return snapshot.docs.map((d) => ({ cloudId: d.id, ...d.data(), completedAt: d.data().completedAt?.toDate() }));
}

export async function addDeckToFirestore(userId: string, deck: any) {
  const { id, cloudId, ...rest } = deck;
  return addDoc(collection(firestore, "users", userId, "decks"), { ...deckToFirestore(rest), localId: id });
}

export async function updateDeckInFirestore(userId: string, cloudId: string, changes: any) {
  return updateDoc(doc(firestore, "users", userId, "decks", cloudId), changes);
}

export async function deleteDeckFromFirestore(userId: string, cloudId: string) {
  const cardsSnap = await getDocs(query(collection(firestore, "users", userId, "flashcards"), where("deckId", "==", cloudId)));
  const batch = writeBatch(firestore);
  cardsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(firestore, "users", userId, "decks", cloudId));
  await batch.commit();
}

export async function addFlashcardToFirestore(userId: string, card: any) {
  const { id, cloudId, ...rest } = card;
  return addDoc(collection(firestore, "users", userId, "flashcards"), { ...flashcardToFirestore(rest), localId: id });
}

export async function updateFlashcardInFirestore(userId: string, cloudId: string, changes: any) {
  return updateDoc(doc(firestore, "users", userId, "flashcards", cloudId), changes);
}

export async function deleteFlashcardFromFirestore(userId: string, cloudId: string) {
  return deleteDoc(doc(firestore, "users", userId, "flashcards", cloudId));
}

export async function addSessionToFirestore(userId: string, session: any) {
  const { id, cloudId, ...rest } = session;
  return addDoc(collection(firestore, "users", userId, "studySessions"), { ...sessionToFirestore(rest), localId: id });
}
