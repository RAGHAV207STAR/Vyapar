import fs from 'fs';

let file = 'src/components/InventoryDashboard.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace Box with Package in the JSX
data = data.replaceAll('<Box className="w-3.5 h-3.5"/>', '<Package className="w-3.5 h-3.5"/>');

// Remove Box from imports
data = data.replace('  Box,\n', '');

fs.writeFileSync(file, data);

console.log('done!');
