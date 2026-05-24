import { prisma } from './prisma';
import { getFirebaseAdminAuth } from './firebase-admin';

type FirebaseExchangeSuccess = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
  };
  decoded: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
};

type FirebaseExchangeMissingConfig = {
  ok: false;
  status: 'missing-config';
  message: string;
};

export type FirebaseExchangeResult = FirebaseExchangeSuccess | FirebaseExchangeMissingConfig;

export async function exchangeFirebaseIdToken(idToken: string): Promise<FirebaseExchangeResult> {
  const adminAuth = getFirebaseAdminAuth();

  if (!adminAuth) {
    return {
      ok: false,
      status: 'missing-config',
      message:
        'Server token exchange is not configured yet. Add FIREBASE_SERVICE_ACCOUNT_KEY to enable Firebase Admin verification.',
    };
  }

  const decoded = await adminAuth.verifyIdToken(idToken, true);
  const email = decoded.email;

  if (!email) {
    throw new Error('Firebase ID token did not include an email address.');
  }

  const fallbackName = decoded.name || email.split('@')[0] || email;
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: decoded.name || fallbackName,
      image: decoded.picture || null,
    },
    create: {
      email,
      name: decoded.name || fallbackName,
      image: decoded.picture || null,
      role: 'READER',
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    },
    decoded: {
      uid: decoded.uid,
      email,
      name: decoded.name,
      picture: decoded.picture,
    },
  };
}