async function searchYT(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAg%253D%253D`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await res.text();
  const channelMatch = html.match(/channelId":"([^"]+)"/);
  if (channelMatch) {
    console.log("Channel ID found:", channelMatch[1]);
  } else {
    console.log("Not found");
  }
}
searchYT('mkbhd');
