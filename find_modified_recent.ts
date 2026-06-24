import { execSync } from 'child_process';

try {
  const out = execSync('find . -not -path "*/node_modules/*" -not -path "*/.git/*" -mtime -1 -type f 2>/dev/null', { encoding: 'utf8' });
  console.log('Modified files excluding node_modules:', out);
} catch (e: any) {
  console.log('Error:', e.message);
}
