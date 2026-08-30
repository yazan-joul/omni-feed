import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function initFirebase() {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT is not set in environment variables');
      return null;
    }
    try {
      let raw = serviceAccountJson.trim();
      if (raw.startsWith('"') && raw.endsWith('"')) {
        try {
          raw = JSON.parse(raw);
        } catch {}
      }
      const serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
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

