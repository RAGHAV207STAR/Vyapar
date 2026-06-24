import fs from 'fs';
import path from 'path';

function searchViteCache() {
  const p = path.join(process.cwd(), 'node_modules/.vite');
  if (fs.existsSync(p)) {
      console.log('Vite directory exists');
      const deps = path.join(p, 'deps');
      if (fs.existsSync(deps)) {
          console.log('deps:', fs.readdirSync(deps));
      }
  } else {
      console.log('No .vite cache');
  }
}
searchViteCache();
