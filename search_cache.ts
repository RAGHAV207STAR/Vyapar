import fs from 'fs';
import path from 'path';

function searchForString(dir: string, searchStr: string) {
    if(!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            searchForString(full, searchStr);
        } else if (stat.isFile() && (full.endsWith('.js') || full.endsWith('.map') || full.endsWith('.cjs'))) {
            try {
               const content = fs.readFileSync(full, 'utf8');
               if (content.includes(searchStr)) {
                   console.log(`Found in: ${full}`);
               }
            } catch (e) {}
        }
    }
}
console.log("Searching...");
searchForString('dist', 'logistics-premium-header');
