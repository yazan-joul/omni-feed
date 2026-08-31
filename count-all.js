const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

db.collection('feed_items').get().then(snap => {
  console.log('Total items in DB:', snap.size);
  const bySource = {};
  snap.forEach(doc => {
    const d = doc.data();
    bySource[d.sourceId] = (bySource[d.sourceId] || 0) + 1;
  });
  console.log('By source:', bySource);
}).catch(console.error);
