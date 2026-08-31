const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)='?(.*?)'?$/);
  if (match) envVars[match[1]] = match[2];
});

let serviceAccount = JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const snapshot = await db.collection('feed_items')
    .where('platform', '==', 'instagram')
    .orderBy('publishedAt', 'desc')
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const item = snapshot.docs[0].data();
    console.log("Title:", item.title);
    console.log("Thumbnail:", item.thumbnailUrl);
  }
}
run();
