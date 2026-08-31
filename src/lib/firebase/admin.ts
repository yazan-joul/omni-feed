import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function parseServiceAccount(rawInput: string) {
  let raw = rawInput.trim();
  for (let i = 0; i < 3; i++) {
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') {
          raw = parsed.trim();
        } else {
          return parsed;
        }
      } catch {
        raw = raw.replace(/^["']+|["']+$/g, '').trim();
      }
    }
  }
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (parsed && typeof parsed === 'object' && parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function initFirebase() {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT is not set in environment variables');
      return null;
    }
    try {
      const serviceAccount = parseServiceAccount(serviceAccountJson);
      
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[Firebase Admin] Initialized successfully');
      return app;
    } catch (error) {
      console.error('[Firebase Admin] Initialization error', error);
      return null;
    }
  }
  return getApps()[0];
}

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    initFirebase();
    if (getApps().length > 0) {
      _db = getFirestore();
      try {
        _db.settings({ ignoreUndefinedProperties: true });
      } catch (e) {
        // Already configured, ignore
      }
    } else {
      throw new Error('Firebase app is not initialized. Please configure FIREBASE_SERVICE_ACCOUNT.');
    }
  }
  return _db;
}

// Proxy export for backward compatibility so `db.collection(...)` works safely at runtime
export const db = new Proxy({} as Firestore, {
  get(target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  }
});

