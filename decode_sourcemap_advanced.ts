import fs from 'fs';

try {
  const content = fs.readFileSync('restored.tsx', 'utf8');
  console.log('Total content length:', content.length);
  
  // Let's search for "mappings" or other common properties of sourcemaps. Let's see if we can find any base64 boundary.
  // In a JSON sourcemap, the JSON is base64 encoded.
  // When base64 decoded, it starts with '{"version":' which in base64 is 'eyJ2ZXJzaW9uIj'
  const base64Starter = 'eyJ2ZXJzaW9uI';
  const index = content.indexOf(base64Starter);
  if (index !== -1) {
    console.log('Found base64 sourcemap starting at index:', index);
    let base64Part = content.substring(index);
    // clean trailing backtick/semi/spaces
    base64Part = base64Part.replace(/[`"\s;]+$/, '');
    console.log('Base64 part length:', base64Part.length);
    
    const buffer = Buffer.from(base64Part, 'base64');
    const decoded = buffer.toString('utf8');
    console.log('Decoded start:', decoded.substring(0, 500));
    console.log('Decoded end:', decoded.substring(decoded.length - 500));
    
    const sourcemap = JSON.parse(decoded);
    if (sourcemap.sourcesContent && sourcemap.sourcesContent[0]) {
      fs.writeFileSync('restored_original.tsx', sourcemap.sourcesContent[0], 'utf8');
      console.log('SUCCESS! Wrote restored_original.tsx!');
    } else {
      console.log('No sourcesContent array found in sourcemap.');
    }
  } else {
    console.log('Could not find base64 starter "eyJ2ZXJzaW9uI" in restored.tsx');
    // Let's write a utility to find any block of base64 that looks like JSON
    // We know the end is: "names":[]}
    // The base64 for ',"names":[]}' or similar is usually at the very end. Let's print the last 5000 characters and analyze where it starts.
    const lastPart = content.substring(content.length - 10000);
    // Find the first non-code-like, heavily base64-like substring.
    // Base64 text typically doesn't contain spaces, curly braces, and contains lots of capital letters and numbers.
    // Let's split on non-base64 characters to find the longest base64 sequence.
    const matches = lastPart.match(/[A-Za-z0-9+/=]{100,}/g);
    if (matches) {
      console.log('Found large base64-like blocks:', matches.map(m => m.length));
      for (const m of matches) {
        try {
          const buf = Buffer.from(m, 'base64');
          const str = buf.toString('utf8');
          if (str.includes('version') && str.includes('mappings')) {
             console.log('FOUND VALID SOURCEMAP DECODING! Length:', str.length);
             console.log('Decoded sample:', str.substring(0, 300));
             const map = JSON.parse(str);
             if (map.sourcesContent && map.sourcesContent[0]) {
               fs.writeFileSync('restored_original.tsx', map.sourcesContent[0], 'utf8');
               console.log('SUCCESS! Wrote from regex-detected base64!');
               break;
             }
          }
        } catch(err) {}
      }
    }
  }
} catch (e: any) {
  console.log('Error:', e.message);
}
