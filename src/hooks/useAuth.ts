"use client";

import { useEffect, useRef, useState } from 'react';
import { getIdToken, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth, logOut as logOutFirebase, signInWithGoogle } from '@/lib/firebase-client';

type UnifiedAuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  facebook: string | null;
  instagram: string | null;
  pinterest: string | null;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
  firebaseUid: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  displayName: string | null;
  photoURL: string | null;
};

function buildFallbackUser(firebaseUser: FirebaseUser): UnifiedAuthUser {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || null,
    email: firebaseUser.email || '',
    image: firebaseUser.photoURL || null,
    bio: null,
    facebook: null,
    instagram: null,
    pinterest: null,
    role: 'READER',
    firebaseUid: firebaseUser.uid,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    displayName: firebaseUser.displayName || null,
    photoURL: firebaseUser.photoURL || null,
  };
}

export function useAuth() {
  const [user, setUser] = useState<UnifiedAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasDatabaseSession = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadDatabaseSession = async () => {
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { user?: UnifiedAuthUser };
        if (cancelled || !payload.user) return;

        hasDatabaseSession.current = true;
        setUser({
          ...payload.user,
          displayName: payload.user.name,
          photoURL: payload.user.image,
        });
      } catch (error) {
        console.error('Database auth lookup failed:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDatabaseSession();

    const firebaseAuth = getFirebaseAuth();

    if (!firebaseAuth) {
      return () => {
        cancelled = true;
      };
    }

    const syncFirebaseUser = async (nextUser: FirebaseUser) => {
      try {
        const idToken = await getIdToken(nextUser, true);
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            firebaseUid: nextUser.uid,
            email: nextUser.email,
            name: nextUser.displayName,
            image: nextUser.photoURL,
          }),
        });

        if (!response.ok) {
          throw new Error(`Firebase sync failed with ${response.status}`);
        }

        const payload = (await response.json()) as { user: UnifiedAuthUser };
        hasDatabaseSession.current = true;
        setUser({
          ...payload.user,
          displayName: nextUser.displayName || payload.user.name,
          photoURL: nextUser.photoURL || payload.user.image,
        });
      } catch (error) {
        console.error('Firebase auth sync failed:', error);
        if (!hasDatabaseSession.current) {
          setUser(buildFallbackUser(nextUser));
        }
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (!nextUser) {
        if (!hasDatabaseSession.current) {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      void syncFirebaseUser(nextUser);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    logOut: async () => {
      try {
        await logOutFirebase();
      } catch (error) {
        console.error('Firebase sign-out failed:', error);
      }

      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Native sign-out failed:', error);
      }

      hasDatabaseSession.current = false;
      setUser(null);
    },
  };
}