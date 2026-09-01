import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  let clean = val.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean || undefined;
}

// Debug: log raw environment variable presence (not values) to help diagnose
// missing/malformed NEXT_PUBLIC_FIREBASE_* env vars on deployed environments.
if (typeof window !== 'undefined') {
  console.log('[Firebase Client Debug] Raw env var presence:', {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

if (typeof window !== 'undefined') {
  console.log('[Firebase Client Debug] Cleaned config presence:', {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
  });
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let dbClient: Firestore | null = null;

if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
  console.log('[Firebase Client Debug] Attempting to initialize Firebase client app...');
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    dbClient = getFirestore(app);
    console.log('[Firebase Client Debug] Firebase client initialized successfully:', {
      appName: app.name,
      hasAuth: !!auth,
      hasFirestore: !!dbClient,
    });
  } catch (err) {
    console.error('[Firebase Client] Failed to initialize:', err);
  }
} else if (typeof window !== 'undefined' && !firebaseConfig.apiKey) {
  console.error(
    '[Firebase Client Debug] Skipping initialization: NEXT_PUBLIC_FIREBASE_API_KEY is missing or empty after cleaning. ' +
      'Verify the NEXT_PUBLIC_FIREBASE_* environment variables are set correctly and available at build time.'
  );
}

export { app, auth, googleProvider, dbClient };
