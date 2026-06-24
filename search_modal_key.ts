import fs from 'fs';

try {
  const content = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('isProductModalOpen')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} catch (e: any) {
  console.log('Error:', e.message);
}
