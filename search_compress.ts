import fs from 'fs';
import path from 'path';

function searchForFunction(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchForFunction(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('compressAndResizeImage')) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

searchForFunction(process.cwd());
