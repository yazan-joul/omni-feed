const fs = require('fs');
const admin = require('firebase-admin');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)='?(.*?)'?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const serviceAccount = JSON.parse(envVars.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clean() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const cutoff = oneMonthAgo.toISOString();

  console.log('Deleting items older than', cutoff);
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

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
