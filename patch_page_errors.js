const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  '      if (data.success) {\n        await fetchFeed();\n      } else {',
  '      if (data.success) {\n        await fetchFeed();\n        if (data.errors && data.errors.length > 0) {\n          alert("Partial Sync: Some sources failed to fetch (e.g., blocked by Twitter/IG).\\n\\nDetails: " + data.errors[0]);\n        }\n      } else {'
);

fs.writeFileSync('src/app/page.tsx', code);
