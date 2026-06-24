import fs from 'fs';

try {
  console.log('Container / contents:', fs.readdirSync('/'));
} catch (e: any) {
  console.log('Error reading container /:', e.message);
}
