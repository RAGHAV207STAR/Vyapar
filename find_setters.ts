import fs from 'fs';

try {
  const content = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  
  // Find words of form set[A-Z][a-zA-Z0-9]*
  const setterRegex = /\bset([A-Z][a-zA-Z0-9]*)\b/g;
  const matches = new Set<string>();
  let match;
  while ((match = setterRegex.exec(content)) !== null) {
    matches.add(match[0]);
  }
  console.log('Setters found:', Array.from(matches));

  // Let's also look for state names of form is[A-Z][a-zA-Z0-9]* or show[A-Z][a-zA-Z0-9]*
  const stateRegex = /\b(is|show|enable)([A-Z][a-zA-Z0-9]*)\b/g;
  const states = new Set<string>();
  while ((match = stateRegex.exec(content)) !== null) {
     states.add(match[0]);
  }
  console.log('States/boolean flags found:', Array.from(states));
} catch(e: any) {
  console.log('Error:', e.message);
}
