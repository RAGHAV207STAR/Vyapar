import fs from 'fs';
import path from 'path';

function findFileContains(dir: string, stringToFind: string) {
    try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) {
                if (f === 'node_modules' || f === '.git') continue;
                findFileContains(full, stringToFind);
            } else {
                if (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.json') || f.endsWith('.bak')) {
                    const content = fs.readFileSync(full, 'utf8');
                    if (content.includes(stringToFind) && full !== 'src/components/InventoryDashboard.tsx') {
                        console.log("Found matching file in src containing word:", full, "Size:", fs.statSync(full).size);
                    }
                }
            }
        }
    } catch(e) {}
}

console.log("Searching in src...");
findFileContains(path.resolve('.'), 'isProductModalOpen');
