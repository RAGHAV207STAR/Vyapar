import { execSync } from 'child_process';
try {
  const result = execSync('git checkout -- src/components/InventoryDashboard.tsx', { encoding: 'utf8' });
  console.log('Restored map from git:', result);
} catch(e: any) {
  console.log('Git error:', e.message, e.stdout, e.stderr);
}
