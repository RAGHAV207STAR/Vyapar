import { execSync } from 'child_process';

try {
  const out = execSync('find / -name "*InventoryDashboard*" 2>/dev/null', { encoding: 'utf8' });
  console.log('Found instances of InventoryDashboard:', out);
} catch (e: any) {
  console.log('Error searching filesystem:', e.message);
}
