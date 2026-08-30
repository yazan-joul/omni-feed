const fs = require('fs');
const file = 'src/app/api/cron/ingest/route.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the ID generation logic
const oldIdLogic = `
        // Safe ID base64
        let safeId = Buffer.from(item.id).toString('base64').replace(/[/+=]/g, '_');
        
        // Handle Twitter duplicate IDs bug by using URL if available
        if (item.platform === 'twitter' && item.url) {
          safeId = Buffer.from(\`tw-\${item.sourceId}-\${item.url}\`).toString('base64').replace(/[/+=]/g, '_');
        }
`;

const newIdLogic = `
        // Ensure absolute uniqueness across all platforms by injecting the item.url into the ID if it exists
        const uniqueString = item.url ? \`\${item.sourceId}-\${item.url}\` : item.id;
        const safeId = Buffer.from(uniqueString).toString('base64').replace(/[/+=]/g, '_');
`;

code = code.replace(oldIdLogic.trim(), newIdLogic.trim());
fs.writeFileSync(file, code);
