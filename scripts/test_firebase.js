const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)='?(.*?)'?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

let serviceAccount = JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Testing Index...');
  try {
    const snapshot = await db.collection('feed_items')
      .where('platform', '==', 'twitter')
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get();
    console.log('Query succeeded!');
  } catch (err) {
    console.error('Query failed:', err.message);
  }

  console.log('\nCleaning Old Items...');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const cutoff = oneMonthAgo.toISOString();

  let totalDeleted = 0;
  let batchSize = 500;
  let hasMore = true;

  while (hasMore) {
    const snapshot = await db.collection('feed_items')
      .where('publishedAt', '<', cutoff)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
    console.log(`Deleted ${totalDeleted} items so far...`);
  }

  console.log(`Finished! Total deleted: ${totalDeleted}`);
  process.exit(0);
}

run();
