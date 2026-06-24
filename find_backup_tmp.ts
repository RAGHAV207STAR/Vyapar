import os from 'os';
import fs from 'fs';
import path from 'path';

const tmp = os.tmpdir();
console.log("Tmp dir is", tmp);
function findFile(dir: string, fileRegex: RegExp) {
    try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const full = path.join(dir, f);
            try {
                if (fs.statSync(full).isDirectory()) {
                    if (full.includes('node_modules')) continue;
                    findFile(full, fileRegex);
                } else if (fileRegex.test(f)) {
                    console.log("Found:", full);
                }
            } catch(e) {}
        }
    } catch(e) {}
}
findFile(tmp, /InventoryDashboard/i);
findFile('/workspace', /InventoryDashboard/i);
findFile('/app', /InventoryDashboard/i);
