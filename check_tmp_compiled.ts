import fs from 'fs';

try {
  const content = fs.readFileSync('/tmp/InventoryDashboard.js', 'utf8');
  console.log('Size of InventoryDashboard.js:', content.length);
  console.log('First 2000 chars:', content.substring(0, 2000));
} catch(e: any) {
  console.log('Error reading /tmp/InventoryDashboard.js:', e.message);
}
