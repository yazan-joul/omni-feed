const fs = require("fs");
let code = fs.readFileSync("src/components/SourcesModal.tsx", "utf8");
code = code.replace(/\? '\''bg-orange-600\/20 text-orange-400'\''/g, "");
code = code.replace(/<Terminal className="w-4 h-4" \/>/g, "");
fs.writeFileSync("src/components/SourcesModal.tsx", code);
