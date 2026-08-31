const fs = require('fs');
const file = 'src/app/api/feed/route.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /limit\(500\)/,
  "limit(3000)"
);

fs.writeFileSync(file, code);
