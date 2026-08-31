const inputs = [
  "https://x.com/mkbhd",
  "twitter.com/mkbhd",
  "mkbhd",
  "@mkbhd"
];

inputs.forEach(rawInput => {
  let handle = rawInput;
  if (rawInput.includes('x.com/') || rawInput.includes('twitter.com/')) {
    const match = rawInput.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)/i);
    handle = match ? match[1] : rawInput;
  } else if (handle.startsWith('@')) {
    handle = handle.slice(1);
  }
  console.log(`Input: ${rawInput} => Handle: ${handle}`);
});
