import fs from 'fs';
import path from 'path';

function findFiles(dir: string, pattern: RegExp) {
    try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
            const tempPath = path.join(dir, f);
            if (fs.statSync(tempPath).isDirectory()) {
                if (f === 'node_modules' || f === 'dist') continue;
                findFiles(tempPath, pattern);
            } else if (pattern.test(f)) {
                console.log("Found matching file:", tempPath, "Size:", fs.statSync(tempPath).size);
            }
        }
    } catch(e) {}
}

console.log("Searching in processes and parent directories...");
findFiles(path.resolve('.'), /item/i);
findFiles(path.resolve('.'), /inventory/i);
findFiles('/tmp', /inventory/i);
findFiles('/tmp', /item/i);
