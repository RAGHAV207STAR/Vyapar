import fs from 'fs';

let file = 'src/components/InventoryDashboard.tsx';
let data = fs.readFileSync(file, 'utf8');

// Find the form
let formMatch = data.substring(data.indexOf('<form \n            onSubmit={handleSaveProduct} '));
// get next part
console.log(formMatch.substring(3000, 5000));
