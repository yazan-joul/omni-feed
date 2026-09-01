const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf-8');
const match = envStr.match(/FIREBASE_SERVICE_ACCOUNT='([^']+)'/);
const sa = JSON.parse(match[1]);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: cert(sa) });

async function run() {
  const db = getFirestore();
  let cursor = null;
  console.time('Total');
  for (let i=0; i<3; i++) {
    console.time('Query ' + i);
    let q = db.collection('feed_items').orderBy('publishedAt', 'desc').limit(20);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    cursor = snap.docs[snap.docs.length-1]?.data().publishedAt;
    console.timeEnd('Query ' + i);
  }
  console.timeEnd('Total');
}
run();
