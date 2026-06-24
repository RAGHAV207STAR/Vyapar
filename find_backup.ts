import fs from 'fs';
import path from 'path';

function findFile(dir: string, fileRegex: RegExp) {
    if(!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            findFile(full, fileRegex);
        } else if (fileRegex.test(f)) {
            console.log(full);
        }
    }
}
console.log("Looking for history...");
findFile('.history', /InventoryDashboard/);
findFile('.vite', /InventoryDashboard/);
findFile('node_modules/.cache', /InventoryDashboard/);
