const Parser = require('rss-parser');
const parser = new Parser();
parser.parseURL('https://www.theverge.com/rss/index.xml')
  .then(feed => console.log('Verge count:', feed.items.length))
  .catch(console.error);
