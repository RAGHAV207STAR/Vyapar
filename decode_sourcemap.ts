import fs from 'fs';

try {
  const content = fs.readFileSync('restored.tsx', 'utf8');
  console.log('Total content length:', content.length);
  
  // Find the sourcemap section
  // It usually starts with "sourceMappingURL=data:application/json;charset=utf-8;base64,"
  const searchStr = 'sourceMappingURL=data:application/json;charset=utf-8;base64,';
  const index = content.indexOf(searchStr);
  if (index !== -1) {
    console.log('Found sourceMappingURL at position:', index);
    let base64Part = content.substring(index + searchStr.length);
    // strip out characters like ` or " or ; at the end
    base64Part = base64Part.replace(/[`"\s;]+$/, '');
    console.log('Base64 part length:', base64Part.length);
    
    const buffer = Buffer.from(base64Part, 'base64');
    const sourcemapJsonStr = buffer.toString('utf8');
    console.log('Decoded sourcemap JSON length:', sourcemapJsonStr.length);
    
    const sourcemap = JSON.parse(sourcemapJsonStr);
    console.log('Sourcemap keys:', Object.keys(sourcemap));
    if (sourcemap.sources) {
      console.log('Sources:', sourcemap.sources);
    }
    if (sourcemap.sourcesContent && sourcemap.sourcesContent[0]) {
      const originalSource = sourcemap.sourcesContent[0];
      console.log('Found original source inside sourcesContent! Length:', originalSource.length);
      fs.writeFileSync('restored_original.tsx', originalSource, 'utf8');
      console.log('Successfully saved original source code to restored_original.tsx!');
    } else {
      console.log('No sourcesContent array found in sourcemap.');
    }
  } else {
    console.log('Could not find base64 sourceMappingURL in restored.tsx');
  }
} catch (e: any) {
  console.log('Error decoding sourcemap:', e.message);
}
