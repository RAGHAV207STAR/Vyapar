import fs from 'fs';
import path from 'path';

function searchForCategoryOptions(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchForCategoryOptions(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('categoryOptions')) {
        console.log(`Found categoryOptions in: ${fullPath}`);
      }
    }
  }
}

searchForCategoryOptions(process.cwd());
