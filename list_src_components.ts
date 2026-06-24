import fs from 'fs';
import path from 'path';

const dir = 'src/components';
try {
  const files = fs.readdirSync(dir);
  console.log('Files in src/components:', files);
} catch (e: any) {
  console.log('Error reading src/components:', e.message);
}
