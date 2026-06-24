import fs from 'fs';
import path from 'path';

try {
  console.log('/tmp files:', fs.readdirSync('/tmp'));
} catch(e) {
  console.log('Error reading /tmp:', e.message);
}
