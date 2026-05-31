// Firebase Initialization & Admin Config

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

export function initializeFirebase() {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
        serviceAccountId: process.env.FIREBASE_CLIENT_EMAIL,
        // Additional config from credentials
      });
    } else {
      // Fallback for local development
      admin.initializeApp();
    }
  }

  db = admin.firestore();
  auth = admin.auth();

  return { db, auth };
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

export function getAuth(): admin.auth.Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

/**
 * Verify Firebase ID Token
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const auth = getAuth();
  return auth.verifyIdToken(token);
}

/**
 * Database operations for venues
 */
export async function createVenue(venueData: any) {
  const db = getDb();
  const docRef = await db.collection('venues').add({
    ...venueData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function getVenue(venueId: string) {
  const db = getDb();
  const doc = await db.collection('venues').doc(venueId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function queryVenues(filters: any) {
  const db = getDb();
  let query: admin.firestore.Query = db.collection('venues');

  if (filters.sport) {
    query = query.where('sports', 'array-contains', filters.sport);
  }

  if (filters.area) {
    query = query.where('area', '==', filters.area);
  }

  if (filters.bookable !== undefined) {
    query = query.where('bookable', '==', filters.bookable);
  }

  if (filters.minRating) {
    query = query.where('rating', '>=', filters.minRating);
  }

  const snapshot = await query.limit(50).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Database operations for bookings
 */
export async function createBooking(bookingData: any) {
  const db = getDb();
  const docRef = await db.collection('bookings').add({
    ...bookingData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserBookings(userId: string) {
  const db = getDb();
  const snapshot = await db
    .collection('bookings')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getVenueBookings(venueId: string) {
  const db = getDb();
  const snapshot = await db
    .collection('bookings')
    .where('venueId', '==', venueId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Real-time listeners for dashboard updates
 */
export function subscribeToVenueBookings(venueId: string, callback: (bookings: any[]) => void) {
  const db = getDb();
  return db
    .collection('bookings')
    .where('venueId', '==', venueId)
    .onSnapshot(snapshot => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(bookings);
    });
}

/**
 * Admin operations
 */
export async function createAdminUser(email: string, password: string) {
  const auth = getAuth();
  const user = await auth.createUser({
    email,
    password,
  });
  return user.uid;
}

export async function approveOwnerVerification(claimId: string) {
  const db = getDb();
  await db.collection('verification_claims').doc(claimId).update({
    status: 'approved',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getVerificationClaims(status?: string) {
  const db = getDb();
  let query: admin.firestore.Query = db.collection('verification_claims');

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
