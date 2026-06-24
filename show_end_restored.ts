import fs from 'fs';

try {
  const content = fs.readFileSync('restored.tsx', 'utf8');
  console.log('Last 2000 characters of restored.tsx:');
  console.log(content.substring(content.length - 2000));
} catch (e: any) {
  console.log('Error:', e.message);
}
