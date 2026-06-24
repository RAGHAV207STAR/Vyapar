import fs from 'fs';

try {
  const content = fs.readFileSync('restored.tsx', 'utf8');
  console.log('restored.tsx start:', content.substring(0, 150));
  console.log('restored.tsx end:', content.substring(content.length - 150));

  // Let's strip the "export default `.....`;" wrapper
  // It starts with: export default `
  // and ends with: `;
  let stripped = content;
  if (stripped.startsWith('export default `')) {
    stripped = stripped.substring('export default `'.length);
  } else if (stripped.startsWith('export default "')) {
    stripped = stripped.substring('export default "'.length);
  }
  
  if (stripped.endsWith('`;')) {
    stripped = stripped.substring(0, stripped.length - 2);
  } else if (stripped.endsWith('";')) {
    stripped = stripped.substring(0, stripped.length - 2);
  } else if (stripped.endsWith('`')) {
    stripped = stripped.substring(0, stripped.length - 1);
  }

  // Handle escaped characters if any are present (e.g., \` or \$)
  // Since it was a backtick literal, any actual backseat or dollar signs might be escaped.
  // Let's first check if there are many backslash escaped characters in the stripped output
  console.log('Stripped length:', stripped.length);
  
  // Write the stripped layout to src/components/InventoryDashboard.tsx
  fs.writeFileSync('src/components/InventoryDashboard.tsx', stripped, 'utf8');
  console.log('Successfully wrote to src/components/InventoryDashboard.tsx');
} catch (e: any) {
  console.log('Error extracting:', e.message);
}
