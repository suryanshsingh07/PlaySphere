import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile, UserRole } from '@/shared/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Google sign-in always defaults to 'player' role (unless email is whitelisted admin)
    await ensureUserProfile(result.user, undefined, 'player');
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.warn('Popup blocked, falling back to sign-in with redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('Google sign-in popup closed by user.');
      return null;
    }
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: 'player' | 'owner' = 'player'
) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserProfile(result.user, displayName, role);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function ensureUserProfile(user: User, displayName?: string, role?: UserRole) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const adminEmails = getAdminEmails();
  const userEmail = user.email?.toLowerCase() || '';
  const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);
  const defaultRole: UserRole = isAdmin ? 'admin' : (role || 'player');

  if (!snap.exists()) {
    const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
      uid: user.uid,
      displayName: displayName || user.displayName || 'Player',
      email: user.email || '',
      savedVenues: [],
      role: defaultRole,
      // Owners start as pending approval; players and admins have no approvalStatus needed
      ...(defaultRole === 'owner' ? { approvalStatus: 'pending' as const } : {}),
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profile);
  } else {
    // If it exists, let's verify if there are legacy fields or missing fields
    const data = snap.data();
    const updates: Partial<UserProfile> = {};

    // 1. If role is missing, or is 'user', map it to 'player' (or defaultRole/admin)
    if (!data.role || data.role === 'user') {
      updates.role = defaultRole;
    } else if (isAdmin && data.role !== 'admin') {
      // If user is whitelisted admin but role in database is different, update to admin
      updates.role = 'admin';
    }

    // 2. If displayName is missing, fill it
    if (!data.displayName) {
      updates.displayName = displayName || user.displayName || 'Player';
    }

    // 3. If email is missing, fill it
    if (!data.email) {
      updates.email = user.email || '';
    }

    // 4. If savedVenues is missing, fill it
    if (!data.savedVenues) {
      updates.savedVenues = [];
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}
