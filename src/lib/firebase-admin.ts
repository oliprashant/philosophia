import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

type FirebaseAdminEnv = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

let firebaseAdminApp: App | undefined;
let firebaseAdminAuth: Auth | undefined;

function readFirebaseAdminEnv(): FirebaseAdminEnv {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin environment variables. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

export function initAdmin() {
  if (firebaseAdminApp && firebaseAdminAuth) {
    return { auth: firebaseAdminAuth };
  }

  const adminEnv = readFirebaseAdminEnv();

  if (!getApps().length) {
    firebaseAdminApp = initializeApp({
      credential: cert({
        projectId: adminEnv.projectId,
        clientEmail: adminEnv.clientEmail,
        privateKey: adminEnv.privateKey,
      }),
    });
  } else {
    firebaseAdminApp = getApps()[0];
  }

  firebaseAdminAuth = getAuth(firebaseAdminApp);

  return { auth: firebaseAdminAuth };
}

export const auth = initAdmin().auth;

export function getFirebaseAdminAuth() {
  return initAdmin().auth;
}