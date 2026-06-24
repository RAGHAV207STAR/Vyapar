import fs from 'fs';

let file = 'src/components/InventoryDashboard.tsx';
let data = fs.readFileSync(file, 'utf8');

// Find where to insert state:
let stateIndex = data.indexOf('const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);');
data = data.substring(0, stateIndex) + 'const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);\n  const [enableQuickScan, setEnableQuickScan] = useState(true);\n' + data.substring(stateIndex + 'const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);'.length);

data = data.replace(
  /{[\s\S]*?\/\* BARCODE SCANNER HIGHLIGHT  \*\/[\s\S]*?<div className="bg-gradient-to-r from-blue-50 to-indigo-50\/30 border border-indigo-100\/60 shadow-inner shadow-indigo-500\/5 p-4 md:p-5 rounded-\[1\.5rem\] flex flex-col md:flex-row gap-4 items-center justify-between relative overflow-hidden group">[\s\S]*?<div className="absolute inset-0 bg-gradient-to-r from-slate-900\/\[0\.02\] to-transparent pointer-events-none"><\/div>[\s\S]*?<div className="relative z-10 flex-1 w-full md:w-auto">[\s\S]*?<h3 className="text-sm font-black text-indigo-950 tracking-tight flex items-center gap-2">[\s\S]*?<Barcode className="w-5 h-5 text-indigo-600" \/>[\s\S]*?Quick Scan & Auto-Fill[\s\S]*?<\/h3>[\s\S]*?<div className="mt-1\.5 flex items-start gap-2 text-indigo-600\/70">[\s\S]*?<span className="text-\[11px\] font-bold tracking-tight leading-snug">[\s\S]*?Connect barcode scanner device for better experience\.[\s\S]*?<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0">[\s\S]*?<div className="relative flex-1 sm:w-56">[\s\S]*?<input [\s\S]*?id="barcode-primary-box"[\s\S]*?value={formData\.barcode} [\s\S]*?onChange={e => setFormData\({ \.\.\.formData, barcode: e\.target\.value }\)} [\s\S]*?onKeyDown={handleEnterToNext} [\s\S]*?className="w-full pl-10 pr-4 py-3\.5 bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold transition-all outline-none text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900\/5 shadow-inner" [\s\S]*?placeholder="Enter UPC \/ EAN\.\.\." [\s\S]*?\/>[\s\S]*?<Barcode className="w-4 h-4 text-slate-400 absolute left-3\.5 top-1\/2 -translate-y-1\/2" \/>[\s\S]*?<\/div>[\s\S]*?<button[\s\S]*?type="button"[\s\S]*?onClick={\(\) => setShowBarcodeScanner\(true\)}[\s\S]*?className="px-6 py-3\.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white rounded-xl shadow-lg shadow-indigo-600\/25 transition-all flex items-center justify-center gap-2 border border-indigo-500\/50 outline-none focus:ring-4 focus:ring-indigo-600\/20 shrink-0 group"[\s\S]*?title="Scan Barcode"[\s\S]*?>[\s\S]*?<Barcode className="w-5 h-5 shrink-0" \/>[\s\S]*?<span className="text-sm font-bold whitespace-nowrap">Scan Barcode<\/span>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `              {/* BARCODE SCANNER HIGHLIGHT  */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-indigo-100/60 shadow-inner shadow-indigo-500/5 p-4 md:p-5 rounded-[1.5rem] flex flex-col md:flex-row gap-4 items-center justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/[0.02] to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col w-full md:w-auto flex-1">
                  <div className="flex items-center justify-between w-full mb-3 md:mb-0 md:hidden">
                     <h3 className="text-sm font-black text-indigo-950 tracking-tight flex items-center gap-2">
                        <Camera className="w-5 h-5 text-indigo-600" />
                        Quick Scan
                      </h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={enableQuickScan} onChange={(e) => setEnableQuickScan(e.target.checked)} />
                          <div className={\`block w-10 h-6 rounded-full transition-colors \${enableQuickScan ? 'bg-indigo-500' : 'bg-slate-300'}\`}></div>
                          <div className={\`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${enableQuickScan ? 'transform translate-x-4' : ''}\`}></div>
                        </div>
                      </label>
                  </div>

                  <div className="hidden md:flex items-center gap-3">
                    <h3 className="text-sm font-black text-indigo-950 tracking-tight flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-600" />
                      Quick Scan & Auto-Fill
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer ml-4">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={enableQuickScan} onChange={(e) => setEnableQuickScan(e.target.checked)} />
                          <div className={\`block w-10 h-6 rounded-full transition-colors \${enableQuickScan ? 'bg-indigo-500' : 'bg-slate-300'}\`}></div>
                          <div className={\`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${enableQuickScan ? 'transform translate-x-4' : ''}\`}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{enableQuickScan ? 'On' : 'Off'}</span>
                    </label>
                  </div>
                  
                  {enableQuickScan && (
                    <div className="mt-1.5 flex items-start gap-2 text-indigo-600/70">
                      <span className="text-[11px] font-bold tracking-tight leading-snug">
                        Use device camera to instantly scan barcodes.
                      </span>
                    </div>
                  )}
                </div>

                {enableQuickScan && (
                  <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative flex-1 sm:w-56">
                      <input 
                        id="barcode-primary-box"
                        value={formData.barcode} 
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                        onKeyDown={handleEnterToNext} 
                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold transition-all outline-none text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 shadow-inner" 
                        placeholder="Enter UPC / EAN..." 
                      />
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 border border-indigo-500/50 outline-none focus:ring-4 focus:ring-indigo-600/20 shrink-0 group"
                      title="Scan via Camera"
                    >
                      <Camera className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold whitespace-nowrap">Use Camera</span>
                    </button>
                  </div>
                )}
              </div>`
);

fs.writeFileSync(file, data);
console.log("Replaced Barcode Scanner Toggle UI");
