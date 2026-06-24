import fs from 'fs';

try {
  console.log('/app contents:', fs.readdirSync('/app'));
} catch(e: any) {
  console.log('Error reading /app:', e.message);
}
try {
  console.log('/app/applet contents:', fs.readdirSync('/app/applet'));
} catch(e: any) {
  console.log('Error reading /app/applet:', e.message);
}
