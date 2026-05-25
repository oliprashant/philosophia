"use client";

import { useEffect, useState } from 'react';
import { getIdToken, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getFirebaseAuth, logOut, signInWithGoogle } from '@/lib/firebase-client';

type UnifiedAuthUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
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

  useEffect(() => {
    const firebaseAuth = getFirebaseAuth();

    if (!firebaseAuth) {
      setLoading(false);
      setUser(null);
      return;
    }

    const syncFirebaseUser = async (nextUser: FirebaseUser) => {
      try {
        const idToken = await getIdToken(nextUser, true);
        const response = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: nextUser.uid,
            email: nextUser.email,
            displayName: nextUser.displayName,
            photoURL: nextUser.photoURL,
          }),
        });

        if (!response.ok) {
          throw new Error(`Firebase sync failed with ${response.status}`);
        }

        const payload = (await response.json()) as { user: UnifiedAuthUser };
        setUser({
          ...payload.user,
          displayName: nextUser.displayName || payload.user.name,
          photoURL: nextUser.photoURL || payload.user.image,
        });
      } catch (error) {
        console.error('Firebase auth sync failed:', error);
        setUser(buildFallbackUser(nextUser));
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      void syncFirebaseUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    logOut,
  };
}