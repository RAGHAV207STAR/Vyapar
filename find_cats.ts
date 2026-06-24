import fs from 'fs';
import path from 'path';

function findCategoriesList(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findCategoriesList(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Electronics') || content.includes('Groceries')) {
        console.log(`Found categories in: ${fullPath}`);
        // Let's print clean lines that match
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('Electronics') || line.includes('Groceries')) {
             console.log(`Line ${index+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

findCategoriesList(process.cwd());
