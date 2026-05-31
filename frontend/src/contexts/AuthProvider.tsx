'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, onIdTokenChanged, getRedirectResult } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '@/backend/firebase/config';
import { UserProfile } from '@/shared/types';
import { ensureUserProfile } from '@/backend/firebase/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPlayer: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isApprovedOwner: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isPlayer: false,
  isOwner: false,
  isAdmin: false,
  isApprovedOwner: false,
});

function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Handle redirect result resolution on page load/mount
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log('Redirect sign-in resolved successfully, ensuring profile...');
          await ensureUserProfile(result.user, undefined, 'player');
        }
      })
      .catch((err) => {
        console.error('Error resolving redirect sign-in result:', err);
      });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (firebaseUser) {
        setLoading(true);
        let hasResolved = false;

        // Set a timeout fallback (15 seconds) to resolve loading if document creation takes too long
        timeoutId = setTimeout(() => {
          if (!hasResolved) {
            console.warn('Profile listener timed out; resolving loading with null profile.');
            setProfile(null);
            setLoading(false);
          }
        }, 15000);

        // Subscribe to real-time updates for user profile doc
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
            hasResolved = true;
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          } else {
            // The user profile doc does not exist yet (could be signup process in progress).
            // Set profile to null but DO NOT set loading to false yet. Let the profile creation
            // complete and trigger the next snapshot callback.
            setProfile(null);
          }
        }, (err) => {
          console.error('Error listening to user profile doc:', err);
          setProfile(null);
          setLoading(false);
          hasResolved = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        });
      } else {
        document.cookie = `auth-token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        setProfile(null);
        setLoading(false);
      }
    });

    // Separately listen for token refreshes so the cookie stays valid
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const isSecure = window.location.protocol === 'https:';
          const secureFlag = isSecure ? '; Secure' : '';
          document.cookie = `auth-token=${token}; path=/; max-age=${3600 * 24 * 7}${secureFlag}; SameSite=Lax`;
        } catch (error) {
          console.error('Error setting auth-token cookie:', error);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
      if (unsubscribeProfile) unsubscribeProfile();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Derived role helpers
  const adminEmails = getAdminEmails();
  const userEmail = user?.email?.toLowerCase() || '';

  const isAdmin = adminEmails.length > 0 && adminEmails.includes(userEmail);
  const isOwner = profile?.role === 'owner' && !isAdmin;
  const isPlayer = !isOwner && !isAdmin && !!user;
  const isApprovedOwner = isOwner && profile?.approvalStatus === 'approved';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPlayer, isOwner, isAdmin, isApprovedOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
