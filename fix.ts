import fs from 'fs';
const file = 'src/components/AnalyticsDashboard.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replaceAll('grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5', 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5');
fs.writeFileSync(file, data);
console.log('Fixed grids!');
