const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

db.collection('feed_items').where('sourceId', '==', 'social-openai').get().then(snap => {
  console.log('OpenAI Twitter count:', snap.size);
  snap.forEach(doc => console.log(doc.data().url, doc.id));
}).catch(console.error);

db.collection('feed_items').where('platform', '==', 'twitter').get().then(snap => {
  console.log('Total Twitter count:', snap.size);
}).catch(console.error);
