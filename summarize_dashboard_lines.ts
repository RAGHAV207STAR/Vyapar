import fs from 'fs';

try {
  const content = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  const lines = content.split('\n');
  console.log('Total Lines:', lines.length);
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('export ') || 
        trimmed.startsWith('function ') || 
        (trimmed.startsWith('const ') && line.includes('=>')) ||
        trimmed.startsWith('{/*') ||
        (trimmed.includes('return') && trimmed.endsWith('{'))
       ) {
      console.log(`Line ${index + 1}: ${line}`);
    }
  });
} catch (e: any) {
  console.log('Error:', e.message);
}
