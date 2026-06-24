import http from 'http';
import fs from 'fs';

http.get('http://localhost:3000/src/components/InventoryDashboard.tsx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
      fs.writeFileSync('/tmp/InventoryDashboard.js', data);
      console.log('Saved to /tmp/InventoryDashboard.js');
  });
}).on('error', e => console.log('Error', e.message));
