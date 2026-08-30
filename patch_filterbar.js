const fs = require('fs');
let code = fs.readFileSync('src/components/FilterBar.tsx', 'utf8');

// The platform refresh button currently has no icon/spinner, it's just a button.
// Let's add a RotateCw icon there.
code = code.replace(
  'import { Search, LayoutGrid, List, Rss, Clock, CheckCircle2 } from \'lucide-react\';',
  'import { Search, LayoutGrid, List, Rss, Clock, CheckCircle2, RotateCw } from \'lucide-react\';'
);

code = code.replace(
  'className={`flex items-center px-2 py-1.5 rounded-r-lg border-l border-white/10 transition-all border border-l-0 ${',
  'disabled={isLoading}\n          className={`flex items-center px-2 py-1.5 rounded-r-lg border-l border-white/10 transition-all border border-l-0 ${'
);

code = code.replace(
  '          >\n            <span className="sr-only">Refresh</span>',
  '          >\n            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? \'animate-spin text-cyan-400\' : \'opacity-60 group-hover:opacity-100\'}`} />\n            <span className="sr-only">Refresh</span>'
);

fs.writeFileSync('src/components/FilterBar.tsx', code);
