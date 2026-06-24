import fs from 'fs';

let file = 'src/components/BarcodeScannerModal.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /import { X, Camera, AlertCircle, RefreshCw } from 'lucide-react';/,
  "import { X, Camera, AlertCircle, SwitchCamera } from 'lucide-react';"
);

data = data.replace(
  /<RefreshCw className="w-4 h-4" \/>\s*Switch Camera/,
  `<SwitchCamera className="w-4 h-4" />
            Flip Camera`
);

fs.writeFileSync(file, data);
console.log("Replaced Camera Flip UI");
