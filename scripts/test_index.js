require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function test() {
  try {
    const snapshot = await db.collection('feed_items')
      .where('platform', '==', 'twitter')
      .orderBy('publishedAt', 'desc')
      .limit(1)
      .get();
    console.log('Query succeeded! No index needed or index already exists.');
  } catch (err) {
    console.error('Query failed (this is expected if index is missing):');
    console.error(err.message);
  }
  process.exit(0);
}

test();
