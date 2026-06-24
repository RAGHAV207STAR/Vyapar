import fs from 'fs';
import path from 'path';

function searchDirectory(dir: string, results: string[] = []) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Skip node_modules and .git
          if (file !== 'node_modules' && file !== '.git') {
            searchDirectory(fullPath, results);
          }
        } else if (file.includes('InventoryDashboard') || file.includes('index-') && file.endsWith('.js')) {
          results.push(fullPath);
        }
      } catch (err) {}
    }
  } catch (err) {}
  return results;
}

const found = searchDirectory(process.cwd());
console.log('Found files in workspace:', found);

const foundTmp = searchDirectory('/tmp');
console.log('Found files in /tmp:', foundTmp);
