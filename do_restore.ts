import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Dynamically import restored_original
    const restoredModule = await import('./restored_original');
    const content = restoredModule.default;
    
    if (typeof content === 'string') {
      console.log('Successfully loaded content of length:', content.length);
      fs.writeFileSync('src/components/InventoryDashboard.tsx', content, 'utf8');
      console.log('Successfully wrote content to src/components/InventoryDashboard.tsx!');
    } else {
      console.log('Error: content is not a string, it is', typeof content);
    }
  } catch (e: any) {
    console.log('Error during dynamic import restoration:', e.message);
  }
}

main();
