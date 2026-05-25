"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider as FirebaseGoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function resolveAuthDomain(authDomain: string, projectId: string): string {
  const normalizedAuthDomain = authDomain.trim().toLowerCase();
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    return authDomain;
  }

  const firebaseHostedDomain = `${normalizedProjectId}.firebaseapp.com`;

  if (!normalizedAuthDomain) {
    return firebaseHostedDomain;
  }

  const isFirebaseHosted =
    normalizedAuthDomain.endsWith('.firebaseapp.com') ||
    normalizedAuthDomain.endsWith('.web.app');

  if (isFirebaseHosted) {
    return authDomain;
  }

  // If authDomain is set to the current custom site domain (common on Vercel),
  // Firebase's /__/auth/handler endpoint is missing and Google sign-in fails with 404.
  if (typeof window !== 'undefined' && normalizedAuthDomain === window.location.hostname.toLowerCase()) {
    return firebaseHostedDomain;
  }

  return authDomain;
}

const firebaseConfig: FirebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: resolveAuthDomain(
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? ''
  ),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function isDev() {
  return process.env.NODE_ENV !== 'production';
}

function mask(value: string | undefined) {
  if (!value) return '(missing)';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function getMissingKeys() {
  return (Object.entries(firebaseConfig) as Array<[keyof FirebaseClientConfig, string]>)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function getDebugConfig() {
  return {
    apiKey: mask(firebaseConfig.apiKey),
    authDomain: firebaseConfig.authDomain || '(missing)',
    projectId: firebaseConfig.projectId || '(missing)',
    storageBucket: firebaseConfig.storageBucket || '(missing)',
    messagingSenderId: firebaseConfig.messagingSenderId || '(missing)',
    appId: mask(firebaseConfig.appId),
  };
}

function logConfigStatus(context: string) {
  if (!isDev()) return;

  const missingKeys = getMissingKeys();
  if (missingKeys.length > 0) {
    console.error(`[firebase-client] ${context}: missing env vars`, {
      missingKeys,
      loaded: getDebugConfig(),
    });
    return;
  }

  console.debug(`[firebase-client] ${context}: config ready`, getDebugConfig());
}

function getFirebaseConfigOrNull(): FirebaseClientConfig | null {
  if (!isBrowser()) {
    return null;
  }

  const missingKeys = getMissingKeys();
  if (missingKeys.length > 0) {
    logConfigStatus('browser check');
    return null;
  }

  return firebaseConfig;
}

function requireFirebaseAuth(): Auth {
  const authInstance = getFirebaseAuth();

  if (!authInstance) {
    throw new Error(
      'Firebase config is missing. Add the NEXT_PUBLIC_FIREBASE_* env vars first.'
    );
  }

  return authInstance;
}

export function getFirebaseApp(): FirebaseApp | null {
  const config = getFirebaseConfigOrNull();

  if (!config) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
  if (!isBrowser()) {
    return null;
  }

  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export { FirebaseGoogleAuthProvider as GoogleAuthProvider };

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = requireFirebaseAuth();
  const provider = new FirebaseGoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function logOut(): Promise<void> {
  const auth = requireFirebaseAuth();
  await signOut(auth);
}

export const auth = getFirebaseAuth();
