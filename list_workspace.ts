import fs from 'fs';
import path from 'path';

try {
  console.log('/workspace contents:', fs.readdirSync('/workspace'));
  if (fs.existsSync('/workspace/dist')) {
    console.log('/workspace/dist exists! contents:', fs.readdirSync('/workspace/dist'));
    if (fs.existsSync('/workspace/dist/assets')) {
        console.log('/workspace/dist/assets contents:', fs.readdirSync('/workspace/dist/assets'));
    }
  }
} catch (e: any) {
  console.log('Error reading /workspace:', e.message);
}
