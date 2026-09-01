const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf-8');
const match = envStr.match(/FIREBASE_SERVICE_ACCOUNT='([^']+)'/);
const sa = JSON.parse(match[1]);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: cert(sa) });

async function run() {
  const db = getFirestore();
  try {
    const snap = await db.collection('feed_items').select().limit(5).get();
    console.log("Success! Docs:", snap.size);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
