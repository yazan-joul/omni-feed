const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

db.collection('feed_items').where('sourceId', '==', 'pod-changelog').get().then(snap => {
  console.log('Changelog count:', snap.size);
  const ids = [];
  snap.forEach(doc => ids.push(doc.data().id));
  console.log('Unique IDs:', new Set(ids).size);
}).catch(console.error);
