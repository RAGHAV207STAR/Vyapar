import http from 'http';
import fs from 'fs';

http.get('http://localhost:3000/src/components/InventoryDashboard.tsx?raw', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
      fs.writeFileSync('restored.tsx', data);
      console.log('Restored to restored.tsx', data.length);
  });
}).on('error', e => console.log('Error', e.message));
