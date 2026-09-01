const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf-8');
const match = envStr.match(/FIREBASE_SERVICE_ACCOUNT='([^']+)'/);
if (!match) { console.error("No service account"); process.exit(1); }
const sa = JSON.parse(match[1]);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: cert(sa)
});

async function run() {
  const db = getFirestore();
  const snapshot = await db.collection('feed_items').limit(200).get();
  const items = [];
  snapshot.forEach(doc => items.push({ dbId: doc.id, ...doc.data() }));
  
  console.log("Total docs:", items.length);
  const map = new Map();
  for (const item of items) {
    const key = item.url || `${item.title}-${item.publishedAt}` || item.id;
    if (map.has(key)) {
      console.log("DUPLICATE DETECTED IN DB!");
      console.log("Key:", key);
      console.log("Doc 1:", map.get(key).id, "URL:", map.get(key).url);
      console.log("Doc 2:", item.id, "URL:", item.url);
    }
    map.set(key, item);
  }
}
run();
