import http from 'http';

http.get('http://localhost:3000/src/components/InventoryDashboard.tsx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Length:', data.length));
}).on('error', e => console.log('Error', e.message));
