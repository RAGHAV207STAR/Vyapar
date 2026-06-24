import fs from 'fs';

try {
  const content = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  
  // Let's count standard dashboard keywords in the file
  const words = ['table', 'pagination', 'currentPage', 'totalPages', 'itemsPerPage', 'searchQuery', 'filterCategory', 'lowStockAlert', 'Download PDF', 'exportToExcel'];
  words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = content.match(regex);
    console.log(`Word "${word}": ${matches ? matches.length : 0} occurrences`);
  });
} catch (e: any) {
  console.log('Error:', e.message);
}
