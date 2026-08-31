const inputs = [
  "https://www.instagram.com/therock/",
  "instagram.com/therock",
  "https://instagram.com/therock?igshid=xyz",
  "therock",
  "@therock"
];

inputs.forEach(rawInput => {
  let handle = rawInput;
  if (rawInput.includes('instagram.com') || rawInput.includes('instagr.am')) {
    const match = rawInput.match(/instagr(?:am\.com|\.am)\/(?:p\/)?([a-zA-Z0-9_.]+)/i);
    handle = match ? match[1] : 'profile';
  } else if (handle.startsWith('@')) {
    handle = handle.slice(1);
  }
  console.log(`Input: ${rawInput} => Handle: ${handle}`);
});
