import fs from 'fs';
import path from 'path';

const dir = '/dist/assets';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    console.log(f, 'Size:', stat.size, 'Mtime:', stat.mtime);
  }
} else {
  console.log('/dist/assets does not exist');
}
