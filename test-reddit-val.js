async function checkReddit(sub) {
  const url = `https://www.reddit.com/r/${sub}/about.json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
       const data = await res.json();
       console.log(sub, data?.data?.title ? 'EXISTS' : 'NOT FOUND');
    } else {
       console.log(sub, res.status);
    }
  } catch (e) {
    console.log(e.message);
  }
}
checkReddit('news');
checkReddit('asdasdasdasdsdfsdf');
