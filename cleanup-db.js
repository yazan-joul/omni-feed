const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

async function clean() {
  console.log('Fetching all docs...');
  const snap = await db.collection('feed_items').get();
  const seenIds = new Set();
  const batch = db.batch();
  let deleted = 0;
  
  snap.forEach(doc => {
    const data = doc.data();
    if (seenIds.has(data.id)) {
      console.log('Duplicate found:', data.id);
      batch.delete(doc.ref);
      deleted++;
    } else {
      seenIds.add(data.id);
    }
  });
  
  if (deleted > 0) {
    await batch.commit();
    console.log(`Deleted ${deleted} duplicate documents.`);
  } else {
    console.log('No duplicates found.');
  }
}
clean().catch(console.error);
