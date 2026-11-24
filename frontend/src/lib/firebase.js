import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance = null;
let googleProviderInstance = null;

/**
 * Lazy async loader for Firebase Auth SDK.
 * Dynamically imports 'firebase/auth' only when explicitly needed (e.g. Google Sign-In on /login),
 * preventing /dashboard from downloading the 344 KB Firebase Auth bundle and eliminating the
 * firebaseapp.com/__/auth/iframe overhead on initial paint.
 */
export async function getFirebaseAuth() {
  if (!authInstance) {
    const { getAuth, GoogleAuthProvider } = await import("firebase/auth");
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
  }
  return { auth: authInstance, googleProvider: googleProviderInstance };
}

// Transparent proxy for backward-compatibility with synchronous `auth` references (e.g. auth.signOut())
export const auth = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    return async (...args) => {
      const { auth: loadedAuth } = await getFirebaseAuth();
      const fnOrVal = loadedAuth[prop];
      if (typeof fnOrVal === 'function') {
        return fnOrVal.apply(loadedAuth, args);
      }
      return fnOrVal;
    };
  }
});

export const googleProvider = new Proxy({}, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    return async (...args) => {
      const { googleProvider: loadedProvider } = await getFirebaseAuth();
      const fnOrVal = loadedProvider[prop];
      if (typeof fnOrVal === 'function') {
        return fnOrVal.apply(loadedProvider, args);
      }
      return fnOrVal;
    };
  }
});

export default app;
