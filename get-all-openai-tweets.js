const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const saJson = env.match(/FIREBASE_SERVICE_ACCOUNT='(.*)'/)[1];
const serviceAccount = JSON.parse(saJson);

try { initializeApp({ credential: cert(serviceAccount) }); } catch(e) {}
const db = getFirestore();

db.collection('feed_items').where('sourceId', '==', 'social-openai').get().then(snap => {
  console.log(`Found ${snap.size} OpenAI tweets in Firestore.`);
}).catch(console.error);
