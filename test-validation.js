const { POST } = require('./.next/server/app/api/validate-feed/route.js');

// Mock request
function makeReq(url, platform) {
  return {
    json: async () => ({ url, platform })
  };
}

async function runTests() {
  const tests = [
    { name: 'Instagram with @', url: '@TheRock', platform: 'instagram', expectedPlatform: 'instagram' },
    { name: 'Instagram with Name', url: 'TheRock', platform: 'instagram', expectedPlatform: 'instagram' },
    { name: 'Instagram URL', url: 'https://instagram.com/therock', platform: 'instagram', expectedPlatform: 'instagram' },
    { name: 'Twitter with @', url: '@mkbhd', platform: 'twitter', expectedPlatform: 'twitter' },
    { name: 'Twitter with Name', url: 'mkbhd', platform: 'twitter', expectedPlatform: 'twitter' },
    { name: 'Reddit Name', url: 'news', platform: 'reddit', expectedPlatform: 'reddit' },
    { name: 'Reddit with r/', url: 'r/news', platform: 'reddit', expectedPlatform: 'reddit' },
  ];

  for (const t of tests) {
    const res = await POST(makeReq(t.url, t.platform));
    const data = await res.json();
    console.log(`Test: ${t.name} => ${data.success ? 'PASS' : 'FAIL'} (Expected: ${t.expectedPlatform}, Got: ${data.platform}) URL: ${data.url}`);
    if (data.platform !== t.expectedPlatform) {
      console.error('MISMATCH!', data);
    }
  }
}

// We can't easily require the built Next.js route without a full environment, 
// so let's just make direct POST requests to a running instance if one is running, 
// or I can just use curl on localhost:3000 if the server is up.
