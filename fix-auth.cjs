const fs = require('fs');
const files = [
  'src/context/BillingContext.tsx',
  'src/context/InventoryContext.tsx',
  'src/context/AnalyticsContext.tsx',
  'src/context/NotificationContext.tsx'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    let data = fs.readFileSync(f, 'utf8');
    data = data.replace(/ \&\& auth\?\.currentUser \&\& auth\.currentUser\.uid === user\.uid/g, '');
    data = data.replace(/ \|\| !auth\?\.currentUser \|\| auth\.currentUser\.uid !== user\.uid/g, '');
    data = data.replace(/ \&\& auth\?\.currentUser \&\& auth\.currentUser\.uid === uid/g, '');
    fs.writeFileSync(f, data);
  }
}
console.log("Done fixing sync issues.");
