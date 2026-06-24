const fs = require('fs');
const path = require('path');

function findLucideImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findLucideImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let isImporting = false;
      let imports = [];
      for (const line of lines) {
        if (line.includes("from 'lucide-react'")) {
          imports.push(line);
        } else if (line.startsWith("import {") && !line.includes("}")) {
            isImporting = true;
        } else if (isImporting && line.includes("from 'lucide-react'")) {
            isImporting = false;
        }
      }
      const match = content.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g);
      if (match) {
        match.forEach(m => console.log(m));
      }
    }
  }
}

findLucideImports('./src');
