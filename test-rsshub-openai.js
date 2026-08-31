fetch("https://rsshub.app/twitter/user/OpenAI")
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
