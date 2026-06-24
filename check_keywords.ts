import fs from 'fs';

try {
  const content = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  ['const', 'let', 'function', 'class', 'import', 'export'].forEach(kw => {
    const matches = content.match(new RegExp('\\b' + kw + '\\b', 'g'));
    console.log(`Keyword "${kw}": ${matches ? matches.length : 0} times`);
  });
} catch (e: any) {
  console.log('Error:', e.message);
}
