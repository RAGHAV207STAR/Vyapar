import { execSync } from 'child_process';

try {
  const out = execSync('find / -name "dist" -type d 2>/dev/null', { encoding: 'utf8' });
  console.log('Dist folders found on filesystem:', out);
} catch (e: any) {
  console.log('Error searching:', e.message);
}
