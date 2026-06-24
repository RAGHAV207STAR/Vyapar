import fs from 'fs';

let file = 'src/components/BarcodeScannerModal.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /{ fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },/,
  '{ fps: 10, aspectRatio: 1.0 },'
);

fs.writeFileSync(file, data);
console.log("Removed qrbox");
