const fs = require('fs');
const token = fs.readFileSync('.env.local', 'utf8').match(/APIFY_API_TOKEN=(.*)/)[1].trim();

fetch(`https://api.apify.com/v2/acts/scraper_one~x-profile-posts-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profileUrls: ["https://x.com/realDonaldTrump"], maxPosts: 2 })
})
.then(r => {
  console.log('Status:', r.status);
  return r.text();
})
.then(text => {
  console.log('Response:', text.slice(0, 500));
})
.catch(console.error);
