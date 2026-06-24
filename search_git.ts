import fs from 'fs';
import path from 'path';

function searchFile(dir: string, name: string) {
    if(!fs.existsSync(dir)) return;
    try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const full = path.join(dir, f);
            if (f === name) {
                console.log("Found .git in:", full);
            }
            if (fs.statSync(full).isDirectory()) {
                if (f === 'node_modules') continue;
                searchFile(full, name);
            }
        }
    } catch(e) {}
}
searchFile(path.resolve('..'), '.git');
searchFile(path.resolve('.'), '.git');
