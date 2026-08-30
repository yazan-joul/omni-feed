const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

db.collection('feed_items').get().then(snap => {
  console.log('Total items:', snap.size);
  const items = [];
  snap.forEach(doc => items.push(doc.data()));
  console.log('Sources:', [...new Set(items.map(i => i.sourceId))]);
  console.log('Platforms:', [...new Set(items.map(i => i.platform))]);
  console.log('Twitter count:', items.filter(i => i.platform === 'twitter').length);
}).catch(console.error);
