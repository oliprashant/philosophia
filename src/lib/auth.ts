export type AuthSession = null;

export async function auth(): Promise<AuthSession> {
  return null;
}

export const handlers = {
  GET: async () => {
    throw new Error('Server auth has been removed from this project.');
  },
  POST: async () => {
    throw new Error('Server auth has been removed from this project.');
  },
};

export async function signIn() {
  throw new Error('Server auth has been removed from this project.');
}

export async function signOut() {
  throw new Error('Server auth has been removed from this project.');
}
