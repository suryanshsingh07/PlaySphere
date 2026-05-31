import * as admin from 'firebase-admin';

// Initialize the Admin SDK dynamically using the project ID
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
