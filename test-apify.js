const fs = require('fs');
const token = fs.readFileSync('.env.local', 'utf8').match(/APIFY_API_TOKEN=(.*)/)[1].trim();

fetch(`https://api.apify.com/v2/acts/scraper_one~x-profile-posts-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profileUrls: ["https://x.com/OpenAI"], maxPosts: 2 })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data[0], null, 2)))
.catch(console.error);
