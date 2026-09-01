const http = require('http');

async function testApi() {
  const params = new URLSearchParams({
    platform: 'twitter',
    mediaType: 'all',
  });
  
  // Need to start a dev server to fetch from it, or just use node directly
}
