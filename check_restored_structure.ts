import fs from 'fs';

const content = fs.readFileSync('restored.tsx', 'utf8');
console.log('LENGTH:', content.length);
console.log('START 1000:', content.substring(0, 1000));
console.log('END 1000:', content.substring(content.length - 1000));
