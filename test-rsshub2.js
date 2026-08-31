fetch("https://rsshub.app/twitter/user/OpenAI", {
  headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
})
  .then(r => r.text())
  .then(text => console.log(text.slice(0, 500)))
  .catch(console.error);
