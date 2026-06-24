import fs from 'fs';

try {
  const content = fs.readFileSync('src/App.tsx', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('InventoryDashboard')) {
      console.log(`Line ${index + 1}: ${line}`);
    }
  });
} catch(e: any) {
  console.log('Error:', e.message);
}
