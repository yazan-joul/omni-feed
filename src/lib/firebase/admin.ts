import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in environment variables');
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('[Firebase Admin] Initialized successfully');
  } catch (error) {
    console.error('[Firebase Admin] Initialization error', error);
  }
}

const db = getFirestore();
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Already configured during HMR, ignore
}
export { db };
