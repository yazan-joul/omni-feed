import { TwitterAdapter } from './src/lib/adapters/twitter.adapter';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
process.env.APIFY_API_TOKEN = env.match(/APIFY_API_TOKEN=(.*)/)[1].trim();

const adapter = new TwitterAdapter();
adapter.fetchFeed({
  id: "custom-trump",
  name: "Donald J. Trump",
  url: "https://x.com/realDonaldTrump",
  platform: "twitter"
}).then(res => {
  console.log('Result length:', res.length);
  if (res.length > 0) {
    console.log(res[0]);
  }
}).catch(console.error);
