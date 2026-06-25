import fs from 'fs';
import path from 'path';

function getLucideImports() {
  const srcDir = path.join(process.cwd(), 'src');
  const allIcons = new Set();
  
  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const regex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const icons = match[1].split(',').map(i => i.trim()).filter(Boolean);
          icons.forEach(i => allIcons.add(i));
        }
      }
    }
  }
  
  walk(srcDir);
  return Array.from(allIcons);
}

const icons = getLucideImports();
console.log(icons.join(','));
