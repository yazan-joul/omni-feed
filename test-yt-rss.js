const xml2js = require('xml2js');
async function test() {
  const url = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Google Developers channel
  const res = await fetch(url);
  const text = await res.text();
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(text);
  console.log('Number of videos in YouTube RSS feed:', result.feed.entry ? result.feed.entry.length : 0);
}
test();
