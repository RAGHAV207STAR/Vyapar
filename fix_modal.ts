import fs from 'fs';

const modalReplacementContent = `          <form 
            onSubmit={handleSaveProduct} 
            className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-3xl overflow-hidden text-left flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 relative">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md shrink-0">
                  <Package className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                    {editingProduct ? 'Edit Catalog Entry' : 'Create New Product'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Configure inventory item details, pricing, and automated limits.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setProductModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200/60"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 md:p-10 overflow-y-auto w-full text-left bg-slate-50/50 space-y-8 custom-scrollbar">
              
              {/* GROUP 1: General Details */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">General Identity</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Name <span className="text-rose-500">*</span></label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                      placeholder="e.g., Wireless Ergonomic Keyboard" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Category <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select
                        className={\`px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm \${isCustomCategory ? 'w-1/3' : 'w-full'}\`}
                        value={isCustomCategory ? 'OTHER' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === 'OTHER') {
                            setIsCustomCategory(true);
                            setFormData({ ...formData, category: '' });
                          } else {
                            setIsCustomCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                      >
                        {!categoryOptions.includes(formData.category) && !isCustomCategory && formData.category && (
                          <option value={formData.category}>{formData.category}</option>
                        )}
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="OTHER">Other...</option>
                      </select>
                      {isCustomCategory && (
                        <input 
                          required 
                          value={formData.category} 
                          onChange={e => setFormData({ ...formData, category: e.target.value })} 
                          onKeyDown={handleEnterToNext}
                          className="w-2/3 px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                          placeholder="Enter new category" 
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Unit of Measure <span className="text-rose-500">*</span></label>
                    <select 
                      required 
                      value={formData.unit} 
                      onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none cursor-pointer shadow-sm"
                    >
                      {['Piece', 'Box', 'Kg', 'Litre', 'Bag', 'Meter', 'Feet', 'CFT', 'Lakh'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GROUP 2: Inventory Tracking */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory & Tracking</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      {editingProduct ? 'Current In Stock' : 'Initial Stock Level'} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      disabled={!!editingProduct}
                      type="number" 
                      min="0" 
                      value={formData.stock} 
                      onChange={(e) => {
                        let valStr = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, stock: valStr });
                      }} 
                      onKeyDown={(e) => {
                        if (['-', 'e', '+', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                        handleEnterToNext(e);
                      }}
                      onBlur={() => {
                        if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
                          setFormData({ ...formData, stock: "0" });
                        }
                      }}
                      className={\`w-full px-4 py-3.5 border rounded-xl text-sm font-mono font-bold outline-none transition-all shadow-sm
                        \${editingProduct 
                          ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                          : 'bg-white border-slate-200 focus:border-slate-900 text-slate-900 focus:ring-4 focus:ring-slate-900/5'
                        }\`} 
                      placeholder="Opening Quantity" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                       Min Stock Alert Limit <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      value={formData.minStockAlert} 
                      onChange={(e) => {
                        let valStr = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, minStockAlert: valStr });
                      }} 
                      onKeyDown={(e) => {
                        if (['-', 'e', '+', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                        handleEnterToNext(e);
                      }}
                      onBlur={() => {
                        if (!formData.minStockAlert || isNaN(Number(formData.minStockAlert)) || Number(formData.minStockAlert) < 0) {
                          setFormData({ ...formData, minStockAlert: "5" });
                        }
                      }}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none shadow-sm" 
                      placeholder="Trigger alert when below..." 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">SKU <span className="text-slate-400 font-semibold">(Optional)</span></label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-700 select-none transition-colors">
                        <input 
                          type="checkbox" 
                          id="sku-restrict-toggle"
                          checked={isSkuRestricted} 
                          onChange={e => {
                            setIsSkuRestricted(e.target.checked);
                            if (e.target.checked) setFormData(prev => ({ ...prev, sku: '' }));
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer transition-colors"
                        />
                        <span>Auto-generate</span>
                      </label>
                    </div>
                    <input 
                      id="sku-input-box"
                      disabled={isSkuRestricted}
                      value={isSkuRestricted ? "AUTO GENERATED" : formData.sku} 
                      onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} 
                      onKeyDown={handleEnterToNext} 
                      className={\`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold transition-all outline-none shadow-sm \${isSkuRestricted ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-500' : 'text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5'}\`} 
                      placeholder={isSkuRestricted ? "Input field is locked" : "Leave empty to auto-generate"} 
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Barcode <span className="text-slate-400 font-semibold">(Optional)</span></label>
                    <div className="flex gap-2">
                      <input 
                        id="barcode-input-box"
                        value={formData.barcode} 
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                        onKeyDown={handleEnterToNext} 
                        className="flex-1 px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold transition-all outline-none text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 shadow-sm" 
                        placeholder="Enter manually" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowBarcodeScanner(true)}
                        className="px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-colors flex items-center justify-center gap-2 group shrink-0"
                        title="Scan Barcode"
                      >
                        <Barcode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold">Scan</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GROUP 3: Pricing & Economics */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <IndianRupee className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Economics & Pricing</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Selling Price <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        min="0.1"
                        value={formData.sellingPrice} 
                        onChange={(e) => {
                          let valStr = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = valStr.split('.');
                          if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                          setFormData({ ...formData, sellingPrice: valStr });
                        }} 
                        onKeyDown={(e) => {
                          if (['-', 'e', '+'].includes(e.key)) {
                            e.preventDefault();
                          }
                          handleEnterToNext(e);
                        }}
                        onBlur={() => {
                          const num = Number(formData.sellingPrice);
                          if (isNaN(num) || num <= 0) {
                            setFormData({ ...formData, sellingPrice: "1.00" });
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-black text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Purchase / Cost Price <span className="text-slate-400 font-semibold">(Optional)</span></label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.purchasePrice} 
                        onChange={(e) => {
                          let valStr = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = valStr.split('.');
                          if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                          setFormData({ ...formData, purchasePrice: valStr });
                        }} 
                        onKeyDown={(e) => {
                          if (['-', 'e', '+'].includes(e.key)) {
                            e.preventDefault();
                          }
                          handleEnterToNext(e);
                        }}
                        onBlur={() => {
                          const num = Number(formData.purchasePrice);
                          if (isNaN(num) || num < 0) {
                            setFormData({ ...formData, purchasePrice: "0.00" });
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">HSN/SAC Tariffs Code <span className="text-slate-400 font-semibold">(Optional)</span></label>
                    <input 
                      value={formData.hsn} 
                      onChange={e => setFormData({ ...formData, hsn: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                      placeholder="e.g. 84713010" 
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 4: Extended details */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Media & Extras</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Image File Upload component */}
                    <div className="col-span-1 md:col-span-1 border-r-0 md:border-r border-slate-200/60 pr-0 md:pr-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Image</label>
                      {formData.imageUrl ? (
                        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-2xl p-2 flex flex-col items-center gap-2">
                          <img 
                            src={formData.imageUrl} 
                            alt="Product preview" 
                            className="w-full h-28 object-cover rounded-xl shrink-0 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="w-full text-xs font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer text-center"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="relative border border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all bg-white cursor-pointer group h-full min-h-[140px]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressedUrl = await compressAndResizeImage(file, 200, 200, 0.85);
                                  setFormData({ ...formData, imageUrl: compressedUrl });
                                } catch (err) {
                                  showToast("Failed to process image. Try a different format.", "error");
                                }
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white text-slate-400 transition-colors shadow-sm">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-slate-700">Click or Drag Image</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">JPG, PNG up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-5">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Supplier / Vendor Name <span className="text-slate-400 font-semibold">(Optional)</span></label>
                        <input 
                          value={formData.supplierName} 
                          onChange={e => setFormData({ ...formData, supplierName: e.target.value })} 
                          onKeyDown={handleEnterToNext} 
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                          placeholder="e.g. Apex Logistics Ltd." 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Description <span className="text-slate-400 font-semibold">(Optional)</span></label>
                        <textarea 
                          rows={3} 
                          value={formData.description} 
                          onChange={e => setFormData({ ...formData, description: e.target.value })} 
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none resize-none shadow-sm" 
                          placeholder="Add physical dimensions, materials, or special conditions..." 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setProductModalOpen(false)} 
                className="px-6 py-3 font-bold text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-slate-900/5 outline-none cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-6 py-3 font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all focus:ring-4 focus:ring-slate-900/20 outline-none cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5"/>
                {editingProduct ? 'Save Changes' : 'Confirm & Add Product'}
              </button>
            </div>
          </form>`;

let file = 'src/components/InventoryDashboard.tsx';
let data = fs.readFileSync(file, 'utf8');

const regex = /<form\s+onSubmit=\{handleSaveProduct\}[\s\S]*?(?=<\/form>)<\/form>/;

data = data.replace(regex, modalReplacementContent.trim());
fs.writeFileSync(file, data);

console.log('done!');
