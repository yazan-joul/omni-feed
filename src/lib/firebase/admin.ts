import 'server-only';
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
      
      // Unwrap outer quotes if passed as a quoted string
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        raw = raw.slice(1, -1).trim();
      }

      // If it contains escaped quotes like {\"type\":...}, unescape them
      if (raw.includes('\\"')) {
        raw = raw.replace(/\\"/g, '"');
      }

      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(raw);
      } catch (firstErr) {
        try {
          // If still a string after JSON.parse
          serviceAccount = JSON.parse(JSON.parse(raw));
        } catch {
          throw firstErr;
        }
      }

      if (typeof serviceAccount === 'string') {
        serviceAccount = JSON.parse(serviceAccount);
      }

      if (serviceAccount && serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      console.log('[Firebase Admin] Initialized successfully');
      return app;
    } catch (error) {
      console.error('[Firebase Admin] Initialization error:', error);
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

