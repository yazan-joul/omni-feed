const fs = require('fs');
const token = fs.readFileSync('.env.local', 'utf8').match(/APIFY_API_TOKEN=(.*)/)[1].trim();

fetch(`https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=45`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: ["einarjyc"], resultsLimit: 2 })
})
.then(r => r.text())
.then(text => console.log(text.slice(0, 500)))
.catch(console.error);
