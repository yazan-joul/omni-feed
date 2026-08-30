const fs = require('fs');
let code = fs.readFileSync('src/components/FilterBar.tsx', 'utf8');

code = code.replace(
  '<RotateCw className="w-3 h-3" />',
  '<RotateCw className={`w-3.5 h-3.5 ${isLoading ? \'animate-spin\' : \'opacity-60 group-hover:opacity-100\'}`} />'
);

fs.writeFileSync('src/components/FilterBar.tsx', code);
