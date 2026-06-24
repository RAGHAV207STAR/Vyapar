import fs from 'fs';
const data = fs.readFileSync('/tmp/InventoryDashboard.js', 'utf8');
console.log(data.substring(0, 1000));
