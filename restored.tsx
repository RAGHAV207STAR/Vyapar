export default `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React,               {/* BARCODE SCANNER HIGHLIGHT  */}
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
              </div>

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

                  <div className="md:col-span-2">
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
                className="px-6 py-3 font-bold text-sm text-slate-500 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl shadow-sm transition-all outline-none cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-6 py-3 font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] rounded-xl shadow-lg shadow-indigo-500/25 transition-all focus:ring-4 focus:ring-indigo-500/20 outline-none cursor-pointer flex items-center gap-2 border border-indigo-500/30"
              >
                <CheckCircle2 className="w-5 h-5"/>
                {editingProduct ? 'Save Changes' : 'Confirm & Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Manual stock Adjustment Modal */}
      {isAdjustStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Adjust stock</h3>
                <span className="text-[11px] text-slate-400 font-extrabold font-mono mt-0.5 mt-1 truncate block max-w-[200px]">{selectedProduct.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustStockModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex justify-between items-center font-bold">
                <span className="text-xs text-slate-500">Current Catalog Stock:</span>
                <span className="text-sm text-indigo-700 font-black">{formatStockDisplay(selectedProduct.stock, selectedProduct.category)} {selectedProduct.unit}</span>
              </div>

              {/* Adjust movement type action selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStockFormData({ ...stockFormData, type: 'IN' })}
                  className={\`py-2 px-3 text-xs font-black rounded-xl border cursor-pointer transition-all uppercase tracking-wider
                    \${stockFormData.type === 'IN' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }\`}
                >
                  Add (+)
                </button>
                <button
                  type="button"
                  onClick={() => setStockFormData({ ...stockFormData, type: 'OUT' })}
                  className={\`py-2 px-3 text-xs font-black rounded-xl border cursor-pointer transition-all uppercase tracking-wider
                    \${stockFormData.type === 'OUT' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }\`}
                >
                  Reduce (-)
                </button>
              </div>

              {/* Adjustment Quantity input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Adjustment Quantity ({selectedProduct.unit}) *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={stockFormData.quantity}
                  onChange={e => setStockFormData({ ...stockFormData, quantity: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl focus:outline-none text-slate-800 font-mono font-black text-base"
                  placeholder="e.g. 50"
                />
              </div>

              {/* Correction Reason log field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reason for adjustment *</label>
                <input 
                  required
                  type="text"
                  value={stockFormData.reason}
                  onChange={e => setStockFormData({ ...stockFormData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                  placeholder="e.g. Physical stock count or correction"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdjustStockModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={\`flex-1 py-2.5 px-4 text-white text-xs font-black rounded-xl cursor-pointer uppercase tracking-wider shadow-md
                    \${stockFormData.type === 'IN' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    }\`}
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Detailed Product Slider Info dialogue sheet */}
      {detailProduct && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Product Details</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono tracking-wide mt-0.5">{detailProduct.sku || '-'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600 font-semibold leading-relaxed">
              {detailProduct.imageUrl && (
                <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Product Name</span>
                <p className="text-base font-black text-slate-900 leading-tight">{detailProduct.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Category</span>
                  <p className="text-slate-850 font-extrabold text-[13px]">{detailProduct.category}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Supplier Name</span>
                  <p className="text-slate-850 font-extrabold text-[13px]">{detailProduct.supplierName || 'Unknown / -'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3.5 border-y border-slate-100/80 text-center font-bold text-slate-700 bg-slate-50/50 rounded-2xl px-2">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Quantity</span>
                  <p className="text-lg font-black text-slate-900">{formatStockDisplay(detailProduct.stock, detailProduct.category)} <span className="text-[10px] font-bold text-slate-400">{detailProduct.unit}</span></p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Min alert</span>
                  <p className="text-lg font-black text-slate-800">{detailProduct.minStockAlert}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Unit Price</span>
                  <p className="text-lg font-black text-indigo-750 font-mono">₹{detailProduct.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              {detailProduct.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Item Description</span>
                  <p className="text-slate-650 font-medium whitespace-pre-wrap bg-slate-50/80 p-3 rounded-2xl border border-slate-105">{detailProduct.description}</p>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditProduct(detailProduct);
                    setDetailProduct(null);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer select-none text-center block"
                >
                  Edit Attribute Specifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAdjustStock(detailProduct);
                  }}
                  className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer select-none text-center block"
                >
                  Adjust In-Stock Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Stock Movements Ledger log views sheet dynamically */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden text-left flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-indigo-50 bg-slate-50/60 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Stock Movement Ledger Logs</h3>
                <p className="text-[11px] text-slate-400 font-medium">Tracking history for item corrections, audits, and sales invoice reductions.</p>
              </div>
              <button
                type="button"
                onClick={() => setLedgerOpen(false)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Micro Filter toolbar for dynamic Ledger searches */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs shrink-0 font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Audits Filter:</span>
                
                {/* Date Filter Selection */}
                <select
                  value={ledgerDateFilter}
                  onChange={e => setLedgerDateFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px]"
                >
                  <option value="ALL">All Time Movements</option>
                  <option value="TODAY">Adjusted Today</option>
                  <option value="THIS_WEEK">Last 7 Days</option>
                  <option value="THIS_MONTH">This Calendar Month</option>
                </select>
              </div>

              {/* Product Reference Dropdown Filter */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <select
                  value={ledgerProductFilter}
                  onChange={e => setLedgerProductFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px] max-w-[180px]"
                >
                  <option value="ALL">All Product Ledger</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              {/* Action type correction filter */}
              <div>
                <select
                  value={ledgerActionFilter}
                  onChange={e => setLedgerActionFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px]"
                >
                  <option value="ALL">All Actions Types</option>
                  <option value="Product Created">Product Created</option>
                  <option value="Stock Adjustment">Correction Audits</option>
                  <option value="Invoice Generated">Invoices deduct</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-250 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="py-3 px-4">Timestamp Reference</th>
                      <th className="py-3 px-4">Target Product SKU</th>
                      <th className="py-3 px-3 text-center">Transfer Type</th>
                      <th className="py-3 px-3 text-right">Adjustment Qty</th>
                      <th className="py-3 px-4">Audit Action / Reason Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredLedgerMovements.map(mov => {
                      const dateObj = new Date(mov.date);
                      const relatedProduct = inventory.find(i => i.id === mov.productId);

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-800 block">
                              {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-450 block font-medium">
                              {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 block truncate max-w-[200px]">{mov.productName}</span>
                            {relatedProduct?.sku && (
                              <span className="text-[9.5px] font-mono text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded font-black inline-block mt-0.5">
                                {relatedProduct.sku}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={\`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase
                              \${mov.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-rose-50 text-rose-700 border border-rose-150'}\`}>
                              {mov.type === 'IN' ? 'RECEIVE' : 'DEDUCT'}
                            </span>
                          </td>

                          <td className={\`py-3 px-3 text-right font-black font-mono text-xs \${mov.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}\`}>
                            {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-extrabold">{mov.actionType || 'Adjustment'}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate max-w-[245px]" title={mov.reason}>
                              {mov.reason}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLedgerMovements.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No audit movements recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 ADVANCED PURCHASE ORDER (PO) GENERATOR MODAL */}
      <AnimatePresence>
        {draftingPOItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
                    <History className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block">AI Automated Drafting Engine</span>
                    <h3 className="text-sm font-black text-white leading-none">Draft Purchase Order PO-{Date.now().toString().substring(7)}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftingPOItem(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Product Summary */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">Restock Item Target</span>
                  <p className="text-xs font-black text-indigo-950 uppercase">{draftingPOItem.product.name}</p>
                  <div className="flex items-center gap-4 text-[10px] text-indigo-700 font-extrabold mt-1">
                    <span>SKU: {draftingPOItem.product.sku}</span>
                    <span>•</span>
                    <span>Current Stock: {formatStockDisplay(draftingPOItem.product.stock, draftingPOItem.product.category)} units</span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 text-slate-650">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Supplier Name</label>
                    <input 
                      type="text"
                      className="p-2.5 border border-slate-250 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:border-indigo-500 bg-white"
                      placeholder="e.g. Acme Supplier Corp, Dell India, Samsung Wholesale"
                      value={poFormData.supplierName}
                      onChange={e => setPoFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5 text-slate-650">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Reorder Qty</label>
                      <input 
                        type="number"
                        min="1"
                        className="p-2.5 border border-slate-250 rounded-xl font-bold text-xs font-mono text-slate-800 bg-white"
                        value={poFormData.quantity}
                        onChange={e => setPoFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-slate-650 font-sans">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unit Cost</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input 
                          type="number"
                          min="0"
                          className="w-full p-2.5 pl-6 border border-slate-250 rounded-xl font-bold text-xs font-mono text-slate-800 bg-white"
                          value={poFormData.unitCost}
                          onChange={e => setPoFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PO Valuation and Recommendation metadata */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 font-bold">Estimated Cost Valuation:</span>
                    <span className="font-extrabold text-slate-800">
                      ₹ {(poFormData.quantity * poFormData.unitCost).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 font-bold">Inbound Shipment Target:</span>
                    <span className="font-extrabold text-slate-800">
                      Standard Transport Rail (Express)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-black">
                    <span className="text-indigo-650">Smart Buy Recommendations:</span>
                    <span className="text-emerald-600 bg-emerald-55/10 border border-emerald-200 px-20 px-2 py-0.5 rounded-full text-[10px]">PASSES BUDGET CAP</span>
                  </div>
                </div>
              </div>

              {/* PO Issuance footer action */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2 text-right">
                <button
                  type="button"
                  onClick={() => setDraftingPOItem(null)}
                  disabled={poIsSubmitting}
                  className="px-4 py-2 border border-slate-250 text-slate-650 bg-white hover:bg-slate-50 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleIssuePOCommit}
                  disabled={poIsSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-150 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {poIsSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Generating Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      <span>Authorize Inbound PO</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal Component */}
      {showBarcodeScanner && (
        <BarcodeScannerModal 
          onClose={() => setShowBarcodeScanner(false)}
          onScan={(decodedText) => {
            setFormData(prev => ({ ...prev, barcode: decodedText }));
            setShowBarcodeScanner(false);
          }}
        />
      )}
    </div>
  );
}
`;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkludmVudG9yeURhc2hib2FyZC50c3g/cmF3Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFwiLyoqXFxuICogQGxpY2Vuc2VcXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQXBhY2hlLTIuMFxcbiAqL1xcblxcbmltcG9ydCBSZWFjdCwgICAgICAgICAgICAgICB7LyogQkFSQ09ERSBTQ0FOTkVSIEhJR0hMSUdIVCAgKi99XFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiYmctZ3JhZGllbnQtdG8tciBmcm9tLWJsdWUtNTAgdG8taW5kaWdvLTUwLzMwIGJvcmRlciBib3JkZXItaW5kaWdvLTEwMC82MCBzaGFkb3ctaW5uZXIgc2hhZG93LWluZGlnby01MDAvNSBwLTQgbWQ6cC01IHJvdW5kZWQtWzEuNXJlbV0gZmxleCBmbGV4LWNvbCBtZDpmbGV4LXJvdyBnYXAtNCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlbiBncm91cFxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJhYnNvbHV0ZSBpbnNldC0wIGJnLWdyYWRpZW50LXRvLXIgZnJvbS1zbGF0ZS05MDAvWzAuMDJdIHRvLXRyYW5zcGFyZW50IHBvaW50ZXItZXZlbnRzLW5vbmVcXFwiPjwvZGl2PlxcbiAgICAgICAgICAgICAgICBcXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInJlbGF0aXZlIHotMTAgZmxleCBmbGV4LWNvbCB3LWZ1bGwgbWQ6dy1hdXRvIGZsZXgtMVxcXCI+XFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB3LWZ1bGwgbWItMyBtZDptYi0wIG1kOmhpZGRlblxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cXFwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtaW5kaWdvLTk1MCB0cmFja2luZy10aWdodCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPENhbWVyYSBjbGFzc05hbWU9XFxcInctNSBoLTUgdGV4dC1pbmRpZ28tNjAwXFxcIiAvPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIFF1aWNrIFNjYW5cXG4gICAgICAgICAgICAgICAgICAgICAgPC9oMz5cXG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJyZWxhdGl2ZVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGNsYXNzTmFtZT1cXFwic3Itb25seVxcXCIgY2hlY2tlZD17ZW5hYmxlUXVpY2tTY2FufSBvbkNoYW5nZT17KGUpID0+IHNldEVuYWJsZVF1aWNrU2NhbihlLnRhcmdldC5jaGVja2VkKX0gLz5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgYmxvY2sgdy0xMCBoLTYgcm91bmRlZC1mdWxsIHRyYW5zaXRpb24tY29sb3JzICR7ZW5hYmxlUXVpY2tTY2FuID8gJ2JnLWluZGlnby01MDAnIDogJ2JnLXNsYXRlLTMwMCd9YH0+PC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YGRvdCBhYnNvbHV0ZSBsZWZ0LTEgdG9wLTEgYmctd2hpdGUgdy00IGgtNCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi10cmFuc2Zvcm0gJHtlbmFibGVRdWlja1NjYW4gPyAndHJhbnNmb3JtIHRyYW5zbGF0ZS14LTQnIDogJyd9YH0+PC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImhpZGRlbiBtZDpmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1xcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVxcXCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1pbmRpZ28tOTUwIHRyYWNraW5nLXRpZ2h0IGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPENhbWVyYSBjbGFzc05hbWU9XFxcInctNSBoLTUgdGV4dC1pbmRpZ28tNjAwXFxcIiAvPlxcbiAgICAgICAgICAgICAgICAgICAgICBRdWljayBTY2FuICYgQXV0by1GaWxsXFxuICAgICAgICAgICAgICAgICAgICA8L2gzPlxcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgY3Vyc29yLXBvaW50ZXIgbWwtNFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInJlbGF0aXZlXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJjaGVja2JveFxcXCIgY2xhc3NOYW1lPVxcXCJzci1vbmx5XFxcIiBjaGVja2VkPXtlbmFibGVRdWlja1NjYW59IG9uQ2hhbmdlPXsoZSkgPT4gc2V0RW5hYmxlUXVpY2tTY2FuKGUudGFyZ2V0LmNoZWNrZWQpfSAvPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BibG9jayB3LTEwIGgtNiByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1jb2xvcnMgJHtlbmFibGVRdWlja1NjYW4gPyAnYmctaW5kaWdvLTUwMCcgOiAnYmctc2xhdGUtMzAwJ31gfT48L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgZG90IGFic29sdXRlIGxlZnQtMSB0b3AtMSBiZy13aGl0ZSB3LTQgaC00IHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLXRyYW5zZm9ybSAke2VuYWJsZVF1aWNrU2NhbiA/ICd0cmFuc2Zvcm0gdHJhbnNsYXRlLXgtNCcgOiAnJ31gfT48L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQteHMgZm9udC1ib2xkIHRleHQtc2xhdGUtNTAwXFxcIj57ZW5hYmxlUXVpY2tTY2FuID8gJ09uJyA6ICdPZmYnfTwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgXFxuICAgICAgICAgICAgICAgICAge2VuYWJsZVF1aWNrU2NhbiAmJiAoXFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwibXQtMS41IGZsZXggaXRlbXMtc3RhcnQgZ2FwLTIgdGV4dC1pbmRpZ28tNjAwLzcwXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMXB4XSBmb250LWJvbGQgdHJhY2tpbmctdGlnaHQgbGVhZGluZy1zbnVnXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICBVc2UgZGV2aWNlIGNhbWVyYSB0byBpbnN0YW50bHkgc2NhbiBiYXJjb2Rlcy5cXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgIHtlbmFibGVRdWlja1NjYW4gJiYgKFxcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJyZWxhdGl2ZSB6LTEwIHctZnVsbCBtZDp3LWF1dG8gZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBnYXAtMyBzaHJpbmstMCBhbmltYXRlLWluIGZhZGUtaW4gc2xpZGUtaW4tZnJvbS10b3AtMiBkdXJhdGlvbi0zMDBcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInJlbGF0aXZlIGZsZXgtMSBzbTp3LTU2XFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkPVxcXCJiYXJjb2RlLXByaW1hcnktYm94XFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5iYXJjb2RlfSBcXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBiYXJjb2RlOiBlLnRhcmdldC52YWx1ZSB9KX0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtoYW5kbGVFbnRlclRvTmV4dH0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcGwtMTAgcHItNCBweS0zLjUgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tb25vIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBvdXRsaW5lLW5vbmUgdGV4dC1zbGF0ZS05MDAgcGxhY2Vob2xkZXI6Zm9udC1zYW5zIHBsYWNlaG9sZGVyOmZvbnQtc2VtaWJvbGQgcGxhY2Vob2xkZXI6dGV4dC1zbGF0ZS00MDAgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctc2xhdGUtOTAwLzUgc2hhZG93LWlubmVyXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiRW50ZXIgVVBDIC8gRUFOLi4uXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgICAgPEJhcmNvZGUgY2xhc3NOYW1lPVxcXCJ3LTQgaC00IHRleHQtc2xhdGUtNDAwIGFic29sdXRlIGxlZnQtMy41IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMlxcXCIgLz5cXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVxcXCJidXR0b25cXFwiXFxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNob3dCYXJjb2RlU2Nhbm5lcih0cnVlKX1cXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJweC02IHB5LTMuNSBiZy1ncmFkaWVudC10by1yIGZyb20taW5kaWdvLTYwMCB0by1pbmRpZ28tNzAwIGhvdmVyOmZyb20taW5kaWdvLTUwMCBob3Zlcjp0by1pbmRpZ28tNjAwIGFjdGl2ZTpzY2FsZS05NSB0ZXh0LXdoaXRlIHJvdW5kZWQteGwgc2hhZG93LWxnIHNoYWRvdy1pbmRpZ28tNjAwLzI1IHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0yIGJvcmRlciBib3JkZXItaW5kaWdvLTUwMC81MCBvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctaW5kaWdvLTYwMC8yMCBzaHJpbmstMCBncm91cFxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XFxcIlNjYW4gdmlhIENhbWVyYVxcXCJcXG4gICAgICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICAgICAgPENhbWVyYSBjbGFzc05hbWU9XFxcInctNSBoLTUgc2hyaW5rLTBcXFwiIC8+XFxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbSBmb250LWJvbGQgd2hpdGVzcGFjZS1ub3dyYXBcXFwiPlVzZSBDYW1lcmE8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgey8qIEdST1VQIDE6IEdlbmVyYWwgRGV0YWlscyAqL31cXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJzcGFjZS15LTVcXFwiPlxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTIwMC82MCBwYi0yXFxcIj5cXG4gICAgICAgICAgICAgICAgICA8TGF5ZXJzIGNsYXNzTmFtZT1cXFwidy00IGgtNCB0ZXh0LXNsYXRlLTQwMFxcXCIgLz5cXG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVxcXCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFxcXCI+R2VuZXJhbCBJZGVudGl0eTwvaDM+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICBcXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTVcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJjb2wtc3Bhbi0xIG1kOmNvbC1zcGFuLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiYmxvY2sgdGV4dC1bMTFweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IG1iLTJcXFwiPlByb2R1Y3QgTmFtZSA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtcm9zZS01MDBcXFwiPio8L3NwYW4+PC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQgXFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5uYW1lfSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgbmFtZTogZS50YXJnZXQudmFsdWUgfSl9IFxcbiAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2hhbmRsZUVudGVyVG9OZXh0fSBcXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcHgtNCBweS0zLjUgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCByb3VuZGVkLXhsIHRleHQtYmFzZSBmb250LXNlbWlib2xkIHRleHQtc2xhdGUtOTAwIHBsYWNlaG9sZGVyOnRleHQtc2xhdGUtNDAwIGZvY3VzOnJpbmctNCBmb2N1czpyaW5nLXNsYXRlLTkwMC81IHRyYW5zaXRpb24tYWxsIG91dGxpbmUtbm9uZSBzaGFkb3ctc21cXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiZS5nLiwgV2lyZWxlc3MgRXJnb25vbWljIEtleWJvYXJkXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgIC8+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgICAgPGRpdj5cXG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XFxcImJsb2NrIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBtYi0yXFxcIj5DYXRlZ29yeSA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtcm9zZS01MDBcXFwiPio8L3NwYW4+PC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGdhcC0yXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdFxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHB4LTQgcHktMy41IGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJvcmRlci1zbGF0ZS05MDAgcm91bmRlZC14bCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS05MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctNCBmb2N1czpyaW5nLXNsYXRlLTkwMC81IHRyYW5zaXRpb24tYWxsIG91dGxpbmUtbm9uZSBzaGFkb3ctc20gJHtpc0N1c3RvbUNhdGVnb3J5ID8gJ3ctMS8zJyA6ICd3LWZ1bGwnfWB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lzQ3VzdG9tQ2F0ZWdvcnkgPyAnT1RIRVInIDogZm9ybURhdGEuY2F0ZWdvcnl9XFxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQudmFsdWUgPT09ICdPVEhFUicpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNDdXN0b21DYXRlZ29yeSh0cnVlKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgY2F0ZWdvcnk6ICcnIH0pO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNDdXN0b21DYXRlZ29yeShmYWxzZSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEZvcm1EYXRhKHsgLi4uZm9ybURhdGEsIGNhdGVnb3J5OiBlLnRhcmdldC52YWx1ZSB9KTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxcbiAgICAgICAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAgICAgICAgeyFjYXRlZ29yeU9wdGlvbnMuaW5jbHVkZXMoZm9ybURhdGEuY2F0ZWdvcnkpICYmICFpc0N1c3RvbUNhdGVnb3J5ICYmIGZvcm1EYXRhLmNhdGVnb3J5ICYmIChcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9e2Zvcm1EYXRhLmNhdGVnb3J5fT57Zm9ybURhdGEuY2F0ZWdvcnl9PC9vcHRpb24+XFxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgICAgICAgICAgICB7Y2F0ZWdvcnlPcHRpb25zLm1hcChjYXQgPT4gKFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2NhdH0gdmFsdWU9e2NhdH0+e2NhdH08L29wdGlvbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cXG4gICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJPVEhFUlxcXCI+T3RoZXIuLi48L29wdGlvbj5cXG4gICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XFxuICAgICAgICAgICAgICAgICAgICAgIHtpc0N1c3RvbUNhdGVnb3J5ICYmIChcXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXFxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZCBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5jYXRlZ29yeX0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBjYXRlZ29yeTogZS50YXJnZXQudmFsdWUgfSl9IFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtoYW5kbGVFbnRlclRvTmV4dH1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy0yLzMgcHgtNCBweS0zLjUgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTkwMCBwbGFjZWhvbGRlcjp0ZXh0LXNsYXRlLTQwMCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1zbGF0ZS05MDAvNSB0cmFuc2l0aW9uLWFsbCBvdXRsaW5lLW5vbmUgc2hhZG93LXNtXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCJFbnRlciBuZXcgY2F0ZWdvcnlcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0ZvY3VzXFxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMlxcXCI+VW5pdCBvZiBNZWFzdXJlIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1yb3NlLTUwMFxcXCI+Kjwvc3Bhbj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBcXG4gICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQgXFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS51bml0fSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgdW5pdDogZS50YXJnZXQudmFsdWUgfSl9IFxcbiAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2hhbmRsZUVudGVyVG9OZXh0fSBcXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcHgtNCBweS0zLjUgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTkwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctc2xhdGUtOTAwLzUgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIGN1cnNvci1wb2ludGVyIHNoYWRvdy1zbVxcXCJcXG4gICAgICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICAgICAge1snUGllY2UnLCAnQm94JywgJ0tnJywgJ0xpdHJlJywgJ0JhZycsICdNZXRlcicsICdGZWV0JywgJ0NGVCcsICdMYWtoJ10ubWFwKHUgPT4gKFxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24ga2V5PXt1fSB2YWx1ZT17dX0+e3V9PC9vcHRpb24+XFxuICAgICAgICAgICAgICAgICAgICAgICkpfVxcbiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICB7LyogR1JPVVAgMjogSW52ZW50b3J5IFRyYWNraW5nICovfVxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktNVxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwLzYwIHBiLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxQYWNrYWdlIGNsYXNzTmFtZT1cXFwidy00IGgtNCB0ZXh0LXNsYXRlLTQwMFxcXCIgLz5cXG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVxcXCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFxcXCI+SW52ZW50b3J5ICYgVHJhY2tpbmc8L2gzPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgXFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGdhcC01XFxcIj5cXG4gICAgICAgICAgICAgICAgICA8ZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiYmxvY2sgdGV4dC1bMTFweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IG1iLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICB7ZWRpdGluZ1Byb2R1Y3QgPyAnQ3VycmVudCBJbiBTdG9jaycgOiAnSW5pdGlhbCBTdG9jayBMZXZlbCd9IDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1yb3NlLTUwMFxcXCI+Kjwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXFxuICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkIFxcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ISFlZGl0aW5nUHJvZHVjdH1cXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cXFwibnVtYmVyXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgbWluPVxcXCIwXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLnN0b2NrfSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbFN0ciA9IGUudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1teMC05XS9nLCAnJyk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgc3RvY2s6IHZhbFN0ciB9KTtcXG4gICAgICAgICAgICAgICAgICAgICAgfX0gXFxuICAgICAgICAgICAgICAgICAgICAgIG9uS2V5RG93bj17KGUpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoWyctJywgJ2UnLCAnKycsICcuJ10uaW5jbHVkZXMoZS5rZXkpKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUVudGVyVG9OZXh0KGUpO1xcbiAgICAgICAgICAgICAgICAgICAgICB9fVxcbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcm1EYXRhLnN0b2NrIHx8IGlzTmFOKE51bWJlcihmb3JtRGF0YS5zdG9jaykpIHx8IE51bWJlcihmb3JtRGF0YS5zdG9jaykgPCAwKSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBzdG9jazogXFxcIjBcXFwiIH0pO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHB4LTQgcHktMy41IGJvcmRlciByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tb25vIGZvbnQtYm9sZCBvdXRsaW5lLW5vbmUgdHJhbnNpdGlvbi1hbGwgc2hhZG93LXNtXFxuICAgICAgICAgICAgICAgICAgICAgICAgJHtlZGl0aW5nUHJvZHVjdCBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLXNsYXRlLTEwMCBib3JkZXItc2xhdGUtMjAwIHRleHQtc2xhdGUtNTAwIGN1cnNvci1ub3QtYWxsb3dlZCcgXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZSBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJvcmRlci1zbGF0ZS05MDAgdGV4dC1zbGF0ZS05MDAgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctc2xhdGUtOTAwLzUnXFxuICAgICAgICAgICAgICAgICAgICAgICAgfWB9IFxcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiT3BlbmluZyBRdWFudGl0eVxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41IHRleHQtWzExcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBtYi0yXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgIE1pbiBTdG9jayBBbGVydCBMaW1pdCA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtcm9zZS01MDBcXFwiPio8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZCBcXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cXFwibnVtYmVyXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgbWluPVxcXCIwXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLm1pblN0b2NrQWxlcnR9IFxcbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsU3RyID0gZS50YXJnZXQudmFsdWUucmVwbGFjZSgvW14wLTldL2csICcnKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBtaW5TdG9ja0FsZXJ0OiB2YWxTdHIgfSk7XFxuICAgICAgICAgICAgICAgICAgICAgIH19IFxcbiAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFsnLScsICdlJywgJysnLCAnLiddLmluY2x1ZGVzKGUua2V5KSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVFbnRlclRvTmV4dChlKTtcXG4gICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JtRGF0YS5taW5TdG9ja0FsZXJ0IHx8IGlzTmFOKE51bWJlcihmb3JtRGF0YS5taW5TdG9ja0FsZXJ0KSkgfHwgTnVtYmVyKGZvcm1EYXRhLm1pblN0b2NrQWxlcnQpIDwgMCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgbWluU3RvY2tBbGVydDogXFxcIjVcXFwiIH0pO1xcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcHgtNCBweS0zLjUgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLWFtYmVyLTUwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1hbWJlci01MDAvMTAgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIHNoYWRvdy1zbVxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCJUcmlnZ2VyIGFsZXJ0IHdoZW4gYmVsb3cuLi5cXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwibWQ6Y29sLXNwYW4tMlxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIG1iLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3RcXFwiPlNLVSA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtc2xhdGUtNDAwIGZvbnQtc2VtaWJvbGRcXFwiPihPcHRpb25hbCk8L3NwYW4+PC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciB0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1zbGF0ZS03MDAgc2VsZWN0LW5vbmUgdHJhbnNpdGlvbi1jb2xvcnNcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImNoZWNrYm94XFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVxcXCJza3UtcmVzdHJpY3QtdG9nZ2xlXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17aXNTa3VSZXN0cmljdGVkfSBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SXNTa3VSZXN0cmljdGVkKGUudGFyZ2V0LmNoZWNrZWQpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXQuY2hlY2tlZCkgc2V0Rm9ybURhdGEocHJldiA9PiAoeyAuLi5wcmV2LCBza3U6ICcnIH0pKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH19XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInJvdW5kZWQgYm9yZGVyLXNsYXRlLTMwMCB0ZXh0LXNsYXRlLTkwMCBmb2N1czpyaW5nLXNsYXRlLTkwMCBoLTMuNSB3LTMuNSBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9yc1xcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPkF1dG8tZ2VuZXJhdGU8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICAgIDwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgaWQ9XFxcInNrdS1pbnB1dC1ib3hcXFwiXFxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtpc1NrdVJlc3RyaWN0ZWR9XFxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpc1NrdVJlc3RyaWN0ZWQgPyBcXFwiQVVUTyBHRU5FUkFURURcXFwiIDogZm9ybURhdGEuc2t1fSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgc2t1OiBlLnRhcmdldC52YWx1ZS50b1VwcGVyQ2FzZSgpIH0pfSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXtoYW5kbGVFbnRlclRvTmV4dH0gXFxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHctZnVsbCBweC00IHB5LTMuNSBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tb25vIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBvdXRsaW5lLW5vbmUgc2hhZG93LXNtICR7aXNTa3VSZXN0cmljdGVkID8gJ29wYWNpdHktNjAgY3Vyc29yLW5vdC1hbGxvd2VkIGJnLXNsYXRlLTEwMCB0ZXh0LXNsYXRlLTUwMCcgOiAndGV4dC1zbGF0ZS05MDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1zbGF0ZS05MDAvNSd9YH0gXFxuICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtpc1NrdVJlc3RyaWN0ZWQgPyBcXFwiSW5wdXQgZmllbGQgaXMgbG9ja2VkXFxcIiA6IFxcXCJMZWF2ZSBlbXB0eSB0byBhdXRvLWdlbmVyYXRlXFxcIn0gXFxuICAgICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgey8qIEdST1VQIDM6IFByaWNpbmcgJiBFY29ub21pY3MgKi99XFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwic3BhY2UteS01XFxcIj5cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAvNjAgcGItMlxcXCI+XFxuICAgICAgICAgICAgICAgICAgPEluZGlhblJ1cGVlIGNsYXNzTmFtZT1cXFwidy00IGgtNCB0ZXh0LXNsYXRlLTQwMFxcXCIgLz5cXG4gICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVxcXCJ0ZXh0LXhzIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFxcXCI+RWNvbm9taWNzICYgUHJpY2luZzwvaDM+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICBcXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTVcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMlxcXCI+U2VsbGluZyBQcmljZSA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtcm9zZS01MDBcXFwiPio8L3NwYW4+PC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJyZWxhdGl2ZVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJhYnNvbHV0ZSBsZWZ0LTQgdG9wLTEvMiAtdHJhbnNsYXRlLXktMS8yIHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZFxcXCI+4oK5PC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZCBcXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVxcXCJudW1iZXJcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA9XFxcIjAuMDFcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbj1cXFwiMC4xXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5zZWxsaW5nUHJpY2V9IFxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4ge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbFN0ciA9IGUudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1teMC05Ll0vZywgJycpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFydHMgPSB2YWxTdHIuc3BsaXQoJy4nKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAyKSB2YWxTdHIgPSBwYXJ0c1swXSArICcuJyArIHBhcnRzLnNsaWNlKDEpLmpvaW4oJycpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgc2VsbGluZ1ByaWNlOiB2YWxTdHIgfSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgfX0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlEb3duPXsoZSkgPT4ge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFsnLScsICdlJywgJysnXS5pbmNsdWRlcyhlLmtleSkpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRW50ZXJUb05leHQoZSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG51bSA9IE51bWJlcihmb3JtRGF0YS5zZWxsaW5nUHJpY2UpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKG51bSkgfHwgbnVtIDw9IDApIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgc2VsbGluZ1ByaWNlOiBcXFwiMS4wMFxcXCIgfSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInctZnVsbCBwbC05IHByLTQgcHktMy41IGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJvcmRlci1zbGF0ZS05MDAgcm91bmRlZC14bCB0ZXh0LXNtIGZvbnQtbW9ubyBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIHBsYWNlaG9sZGVyOmZvbnQtc2FucyBwbGFjZWhvbGRlcjpmb250LXNlbWlib2xkIHBsYWNlaG9sZGVyOnRleHQtc2xhdGUtNDAwIGZvY3VzOnJpbmctNCBmb2N1czpyaW5nLXNsYXRlLTkwMC81IHRyYW5zaXRpb24tYWxsIG91dGxpbmUtbm9uZSBzaGFkb3ctc21cXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCIwLjAwXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMlxcXCI+UHVyY2hhc2UgLyBDb3N0IFByaWNlIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS00MDAgZm9udC1zZW1pYm9sZFxcXCI+KE9wdGlvbmFsKTwvc3Bhbj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInJlbGF0aXZlXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImFic29sdXRlIGxlZnQtNCB0b3AtMS8yIC10cmFuc2xhdGUteS0xLzIgdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkXFxcIj7igrk8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XFxcIm51bWJlclxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcD1cXFwiMC4wMVxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAgICAgbWluPVxcXCIwXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5wdXJjaGFzZVByaWNlfSBcXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxTdHIgPSBlLnRhcmdldC52YWx1ZS5yZXBsYWNlKC9bXjAtOS5dL2csICcnKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gdmFsU3RyLnNwbGl0KCcuJyk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMikgdmFsU3RyID0gcGFydHNbMF0gKyAnLicgKyBwYXJ0cy5zbGljZSgxKS5qb2luKCcnKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEZvcm1EYXRhKHsgLi4uZm9ybURhdGEsIHB1cmNoYXNlUHJpY2U6IHZhbFN0ciB9KTtcXG4gICAgICAgICAgICAgICAgICAgICAgICB9fSBcXG4gICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249eyhlKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoWyctJywgJ2UnLCAnKyddLmluY2x1ZGVzKGUua2V5KSkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVFbnRlclRvTmV4dChlKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17KCkgPT4ge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbnVtID0gTnVtYmVyKGZvcm1EYXRhLnB1cmNoYXNlUHJpY2UpO1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzTmFOKG51bSkgfHwgbnVtIDwgMCkge1xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBwdXJjaGFzZVByaWNlOiBcXFwiMC4wMFxcXCIgfSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgfX1cXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInctZnVsbCBwbC05IHByLTQgcHktMy41IGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJvcmRlci1zbGF0ZS05MDAgcm91bmRlZC14bCB0ZXh0LXNtIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1zbGF0ZS05MDAgcGxhY2Vob2xkZXI6Zm9udC1zYW5zIHBsYWNlaG9sZGVyOmZvbnQtc2VtaWJvbGQgcGxhY2Vob2xkZXI6dGV4dC1zbGF0ZS00MDAgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctc2xhdGUtOTAwLzUgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIHNoYWRvdy1zbVxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XFxcIjAuMDBcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcIm1kOmNvbC1zcGFuLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwiYmxvY2sgdGV4dC1bMTFweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IG1iLTJcXFwiPkhTTi9TQUMgVGFyaWZmcyBDb2RlIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS00MDAgZm9udC1zZW1pYm9sZFxcXCI+KE9wdGlvbmFsKTwvc3Bhbj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17Zm9ybURhdGEuaHNufSBcXG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgaHNuOiBlLnRhcmdldC52YWx1ZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJycpLnRvVXBwZXJDYXNlKCkgfSl9IFxcbiAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2hhbmRsZUVudGVyVG9OZXh0fSBcXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcHgtNCBweS0zLjUgYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ym9yZGVyLXNsYXRlLTkwMCByb3VuZGVkLXhsIHRleHQtc20gZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTkwMCBwbGFjZWhvbGRlcjpmb250LXNhbnMgcGxhY2Vob2xkZXI6Zm9udC1zZW1pYm9sZCBwbGFjZWhvbGRlcjp0ZXh0LXNsYXRlLTQwMCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1zbGF0ZS05MDAvNSB0cmFuc2l0aW9uLWFsbCBvdXRsaW5lLW5vbmUgc2hhZG93LXNtXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XFxcImUuZy4gODQ3MTMwMTBcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICAgIHsvKiBHUk9VUCA0OiBFeHRlbmRlZCBkZXRhaWxzICovfVxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktNVxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwLzYwIHBiLTJcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxJbWFnZUljb24gY2xhc3NOYW1lPVxcXCJ3LTQgaC00IHRleHQtc2xhdGUtNDAwXFxcIiAvPlxcbiAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XFxcInRleHQteHMgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XFxcIj5NZWRpYSAmIEV4dHJhczwvaDM+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICBcXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImdyaWQgZ3JpZC1jb2xzLTEgZ2FwLTVcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0zIGdhcC01XFxcIj5cXG4gICAgICAgICAgICAgICAgICAgIHsvKiBJbWFnZSBGaWxlIFVwbG9hZCBjb21wb25lbnQgKi99XFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiY29sLXNwYW4tMSBtZDpjb2wtc3Bhbi0xIGJvcmRlci1yLTAgbWQ6Ym9yZGVyLXIgYm9yZGVyLXNsYXRlLTIwMC82MCBwci0wIG1kOnByLTRcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMlxcXCI+UHJvZHVjdCBJbWFnZTwvbGFiZWw+XFxuICAgICAgICAgICAgICAgICAgICAgIHtmb3JtRGF0YS5pbWFnZVVybCA/IChcXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwicmVsYXRpdmUgZ3JvdXAgb3ZlcmZsb3ctaGlkZGVuIGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQtMnhsIHAtMiBmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBnYXAtMlxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8aW1nIFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM9e2Zvcm1EYXRhLmltYWdlVXJsfSBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0PVxcXCJQcm9kdWN0IHByZXZpZXdcXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInctZnVsbCBoLTI4IG9iamVjdC1jb3ZlciByb3VuZGVkLXhsIHNocmluay0wIHNoYWRvdy1zbVxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XFxcIm5vLXJlZmVycmVyXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cXFwiYnV0dG9uXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRGb3JtRGF0YSh7IC4uLmZvcm1EYXRhLCBpbWFnZVVybDogJycgfSl9XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHRleHQteHMgZm9udC1ibGFjayB0ZXh0LXJvc2UtNTAwIGhvdmVyOnRleHQtcm9zZS03MDAgYmctcm9zZS01MCBob3ZlcjpiZy1yb3NlLTEwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgcHktMiByb3VuZGVkLXhsIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyIHRleHQtY2VudGVyXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW1vdmUgSW1hZ2VcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJyZWxhdGl2ZSBib3JkZXIgYm9yZGVyLWRhc2hlZCBib3JkZXItc2xhdGUtMzAwIGhvdmVyOmJvcmRlci1zbGF0ZS05MDAgcm91bmRlZC14bCBwLTYgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgZ2FwLTMgdHJhbnNpdGlvbi1hbGwgYmctd2hpdGUgY3Vyc29yLXBvaW50ZXIgZ3JvdXAgaC1mdWxsIG1pbi1oLVsxNDBweF1cXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImZpbGVcXFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VwdD1cXFwiaW1hZ2UvKlxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2FzeW5jIChlKSA9PiB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZSA9IGUudGFyZ2V0LmZpbGVzPy5bMF07XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXByZXNzZWRVcmwgPSBhd2FpdCBjb21wcmVzc0FuZFJlc2l6ZUltYWdlKGZpbGUsIDIwMCwgMjAwLCAwLjg1KTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgaW1hZ2VVcmw6IGNvbXByZXNzZWRVcmwgfSk7XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd1RvYXN0KFxcXCJGYWlsZWQgdG8gcHJvY2VzcyBpbWFnZS4gVHJ5IGEgZGlmZmVyZW50IGZvcm1hdC5cXFwiLCBcXFwiZXJyb3JcXFwiKTtcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH19XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwiYWJzb2x1dGUgaW5zZXQtMCB3LWZ1bGwgaC1mdWxsIG9wYWNpdHktMCBjdXJzb3ItcG9pbnRlciB6LTEwXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJ3LTEwIGgtMTAgcm91bmRlZC1mdWxsIGJnLXNsYXRlLTUwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdyb3VwLWhvdmVyOmJnLXNsYXRlLTkwMCBncm91cC1ob3Zlcjp0ZXh0LXdoaXRlIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb24tY29sb3JzIHNoYWRvdy1zbVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxVcGxvYWQgY2xhc3NOYW1lPVxcXCJ3LTUgaC01XFxcIiAvPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwidGV4dC1jZW50ZXJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XFxcInRleHQteHMgZm9udC1ibGFjayB0ZXh0LXNsYXRlLTcwMFxcXCI+Q2xpY2sgb3IgRHJhZyBJbWFnZTwvcD5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LW1lZGl1bSBtdC0xXFxcIj5KUEcsIFBORyB1cCB0byAyTUI8L3A+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImNvbC1zcGFuLTEgbWQ6Y29sLXNwYW4tMiBzcGFjZS15LTVcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XFxcImJsb2NrIHRleHQtWzExcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBtYi0yXFxcIj5TdXBwbGllciAvIFZlbmRvciBOYW1lIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS00MDAgZm9udC1zZW1pYm9sZFxcXCI+KE9wdGlvbmFsKTwvc3Bhbj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtmb3JtRGF0YS5zdXBwbGllck5hbWV9IFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0Rm9ybURhdGEoeyAuLi5mb3JtRGF0YSwgc3VwcGxpZXJOYW1lOiBlLnRhcmdldC52YWx1ZSB9KX0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2hhbmRsZUVudGVyVG9OZXh0fSBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHB4LTQgcHktMy41IGJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJvcmRlci1zbGF0ZS05MDAgcm91bmRlZC14bCB0ZXh0LXNtIGZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS05MDAgcGxhY2Vob2xkZXI6dGV4dC1zbGF0ZS00MDAgZm9jdXM6cmluZy00IGZvY3VzOnJpbmctc2xhdGUtOTAwLzUgdHJhbnNpdGlvbi1hbGwgb3V0bGluZS1ub25lIHNoYWRvdy1zbVxcXCIgXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiZS5nLiBBcGV4IExvZ2lzdGljcyBMdGQuXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJibG9jayB0ZXh0LVsxMXB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbWItMlxcXCI+VGVjaG5pY2FsIERlc2NyaXB0aW9uIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS00MDAgZm9udC1zZW1pYm9sZFxcXCI+KE9wdGlvbmFsKTwvc3Bhbj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYSBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezN9IFxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2Zvcm1EYXRhLmRlc2NyaXB0aW9ufSBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldEZvcm1EYXRhKHsgLi4uZm9ybURhdGEsIGRlc2NyaXB0aW9uOiBlLnRhcmdldC52YWx1ZSB9KX0gXFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInctZnVsbCBweC00IHB5LTMuNSBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBmb2N1czpib3JkZXItc2xhdGUtOTAwIHJvdW5kZWQteGwgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXNsYXRlLTkwMCBwbGFjZWhvbGRlcjp0ZXh0LXNsYXRlLTQwMCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1zbGF0ZS05MDAvNSB0cmFuc2l0aW9uLWFsbCBvdXRsaW5lLW5vbmUgcmVzaXplLW5vbmUgc2hhZG93LXNtXFxcIiBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCJBZGQgcGh5c2ljYWwgZGltZW5zaW9ucywgbWF0ZXJpYWxzLCBvciBzcGVjaWFsIGNvbmRpdGlvbnMuLi5cXFwiIFxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8+XFxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgXFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInB4LTggcHktNSBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGJnLXNsYXRlLTUwIGZsZXgganVzdGlmeS1lbmQgZ2FwLTMgc2hyaW5rLTBcXFwiPlxcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcXG4gICAgICAgICAgICAgICAgdHlwZT1cXFwiYnV0dG9uXFxcIiBcXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0UHJvZHVjdE1vZGFsT3BlbihmYWxzZSl9IFxcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInB4LTYgcHktMyBmb250LWJvbGQgdGV4dC1zbSB0ZXh0LXNsYXRlLTUwMCBiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBob3ZlcjpiZy1yb3NlLTUwIGhvdmVyOnRleHQtcm9zZS02MDAgaG92ZXI6Ym9yZGVyLXJvc2UtMjAwIHJvdW5kZWQteGwgc2hhZG93LXNtIHRyYW5zaXRpb24tYWxsIG91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlclxcXCJcXG4gICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgQ2FuY2VsXFxuICAgICAgICAgICAgICA8L2J1dHRvbj5cXG4gICAgICAgICAgICAgIFxcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcXG4gICAgICAgICAgICAgICAgdHlwZT1cXFwic3VibWl0XFxcIiBcXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJweC02IHB5LTMgZm9udC1ib2xkIHRleHQtc20gdGV4dC13aGl0ZSBiZy1ncmFkaWVudC10by1yIGZyb20taW5kaWdvLTYwMCB0by1ibHVlLTYwMCBob3Zlcjpmcm9tLWluZGlnby01MDAgaG92ZXI6dG8tYmx1ZS01MDAgYWN0aXZlOnNjYWxlLVswLjk4XSByb3VuZGVkLXhsIHNoYWRvdy1sZyBzaGFkb3ctaW5kaWdvLTUwMC8yNSB0cmFuc2l0aW9uLWFsbCBmb2N1czpyaW5nLTQgZm9jdXM6cmluZy1pbmRpZ28tNTAwLzIwIG91dGxpbmUtbm9uZSBjdXJzb3ItcG9pbnRlciBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBib3JkZXIgYm9yZGVyLWluZGlnby01MDAvMzBcXFwiXFxuICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgIDxDaGVja0NpcmNsZTIgY2xhc3NOYW1lPVxcXCJ3LTUgaC01XFxcIi8+XFxuICAgICAgICAgICAgICAgIHtlZGl0aW5nUHJvZHVjdCA/ICdTYXZlIENoYW5nZXMnIDogJ0NvbmZpcm0gJiBBZGQgUHJvZHVjdCd9XFxuICAgICAgICAgICAgICA8L2J1dHRvbj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgPC9mb3JtPlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgKX1cXG5cXG4gICAgICB7LyogMi4gTWFudWFsIHN0b2NrIEFkanVzdG1lbnQgTW9kYWwgKi99XFxuICAgICAge2lzQWRqdXN0U3RvY2tNb2RhbE9wZW4gJiYgc2VsZWN0ZWRQcm9kdWN0ICYmIChcXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmaXhlZCBpbnNldC0wIHotWzk5OTldIGJnLXNsYXRlLTkwMC80MCBiYWNrZHJvcC1ibHVyLXhzIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFxcXCI+XFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJiZy13aGl0ZSByb3VuZGVkLTN4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBzaGFkb3ctMnhsIG1heC13LXNtIHctZnVsbCBvdmVyZmxvdy1oaWRkZW4gdGV4dC1sZWZ0IGFuaW1hdGUtaW4gZmFkZS1pbiB6b29tLWluLTk1IGR1cmF0aW9uLTE1MFxcXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInAtNiBib3JkZXItYiBib3JkZXItc2xhdGUtMTAwIGJnLXNsYXRlLTUwLzcwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblxcXCI+XFxuICAgICAgICAgICAgICA8ZGl2PlxcbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVxcXCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS04MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFxcXCI+QWRqdXN0IHN0b2NrPC9oMz5cXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMXB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LWV4dHJhYm9sZCBmb250LW1vbm8gbXQtMC41IG10LTEgdHJ1bmNhdGUgYmxvY2sgbWF4LXctWzIwMHB4XVxcXCI+e3NlbGVjdGVkUHJvZHVjdC5uYW1lfTwvc3Bhbj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICB0eXBlPVxcXCJidXR0b25cXFwiXFxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEFkanVzdFN0b2NrTW9kYWxPcGVuKGZhbHNlKX1cXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJwLTEgcm91bmRlZC1sZyBob3ZlcjpiZy1zbGF0ZS0yMDAgdGV4dC1zbGF0ZS00MDBcXFwiXFxuICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cXFwidy00IGgtNFxcXCIgLz5cXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVBZGp1c3RTdG9ja1N1Ym1pdH0gY2xhc3NOYW1lPVxcXCJwLTYgc3BhY2UteS00XFxcIj5cXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJwLTMuNSBiZy1pbmRpZ28tNTAvNTAgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1pbmRpZ28tMTAwLzUwIGZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBmb250LWJvbGRcXFwiPlxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQteHMgdGV4dC1zbGF0ZS01MDBcXFwiPkN1cnJlbnQgQ2F0YWxvZyBTdG9jazo8L3NwYW4+XFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1zbSB0ZXh0LWluZGlnby03MDAgZm9udC1ibGFja1xcXCI+e2Zvcm1hdFN0b2NrRGlzcGxheShzZWxlY3RlZFByb2R1Y3Quc3RvY2ssIHNlbGVjdGVkUHJvZHVjdC5jYXRlZ29yeSl9IHtzZWxlY3RlZFByb2R1Y3QudW5pdH08L3NwYW4+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICAgIHsvKiBBZGp1c3QgbW92ZW1lbnQgdHlwZSBhY3Rpb24gc2VsZWN0b3IgKi99XFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtMlxcXCI+XFxuICAgICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgICB0eXBlPVxcXCJidXR0b25cXFwiXFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U3RvY2tGb3JtRGF0YSh7IC4uLnN0b2NrRm9ybURhdGEsIHR5cGU6ICdJTicgfSl9XFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHktMiBweC0zIHRleHQteHMgZm9udC1ibGFjayByb3VuZGVkLXhsIGJvcmRlciBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWFsbCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcXG4gICAgICAgICAgICAgICAgICAgICR7c3RvY2tGb3JtRGF0YS50eXBlID09PSAnSU4nIFxcbiAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTYwMCBib3JkZXItZW1lcmFsZC02MDAgdGV4dC13aGl0ZSBzaGFkb3ctbWQgc2hhZG93LWVtZXJhbGQtNTAwLzEwJyBcXG4gICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUgYm9yZGVyLXNsYXRlLTIwMCB0ZXh0LXNsYXRlLTUwMCBob3ZlcjpiZy1zbGF0ZS01MCdcXG4gICAgICAgICAgICAgICAgICAgIH1gfVxcbiAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAgQWRkICgrKVxcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImJ1dHRvblxcXCJcXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTdG9ja0Zvcm1EYXRhKHsgLi4uc3RvY2tGb3JtRGF0YSwgdHlwZTogJ09VVCcgfSl9XFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHktMiBweC0zIHRleHQteHMgZm9udC1ibGFjayByb3VuZGVkLXhsIGJvcmRlciBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWFsbCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcXG4gICAgICAgICAgICAgICAgICAgICR7c3RvY2tGb3JtRGF0YS50eXBlID09PSAnT1VUJyBcXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctcm9zZS02MDAgYm9yZGVyLXJvc2UtNjAwIHRleHQtd2hpdGUgc2hhZG93LW1kIHNoYWRvdy1yb3NlLTUwMC8xMCcgXFxuICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlIGJvcmRlci1zbGF0ZS0yMDAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6Ymctc2xhdGUtNTAnXFxuICAgICAgICAgICAgICAgICAgICB9YH1cXG4gICAgICAgICAgICAgICAgPlxcbiAgICAgICAgICAgICAgICAgIFJlZHVjZSAoLSlcXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICAgIHsvKiBBZGp1c3RtZW50IFF1YW50aXR5IGlucHV0ICovfVxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktMS41XFxcIj5cXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwidGV4dC1bMTBweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGJsb2NrXFxcIj5BZGp1c3RtZW50IFF1YW50aXR5ICh7c2VsZWN0ZWRQcm9kdWN0LnVuaXR9KSAqPC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgIHJlcXVpcmVkXFxuICAgICAgICAgICAgICAgICAgdHlwZT1cXFwibnVtYmVyXFxcIlxcbiAgICAgICAgICAgICAgICAgIG1pbj1cXFwiMVxcXCJcXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17c3RvY2tGb3JtRGF0YS5xdWFudGl0eX1cXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRTdG9ja0Zvcm1EYXRhKHsgLi4uc3RvY2tGb3JtRGF0YSwgcXVhbnRpdHk6IGUudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1teMC05XS9nLCAnJykgfSl9XFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgcHgtNCBweS0yLjUgYmctc2xhdGUtNTAgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgZm9jdXM6Ymctd2hpdGUgZm9jdXM6Ym9yZGVyLWluZGlnby01MDAgcm91bmRlZC14bCBmb2N1czpvdXRsaW5lLW5vbmUgdGV4dC1zbGF0ZS04MDAgZm9udC1tb25vIGZvbnQtYmxhY2sgdGV4dC1iYXNlXFxcIlxcbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVxcXCJlLmcuIDUwXFxcIlxcbiAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICB7LyogQ29ycmVjdGlvbiBSZWFzb24gbG9nIGZpZWxkICovfVxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktMS41XFxcIj5cXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwidGV4dC1bMTBweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGJsb2NrXFxcIj5SZWFzb24gZm9yIGFkanVzdG1lbnQgKjwvbGFiZWw+XFxuICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICByZXF1aXJlZFxcbiAgICAgICAgICAgICAgICAgIHR5cGU9XFxcInRleHRcXFwiXFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e3N0b2NrRm9ybURhdGEucmVhc29ufVxcbiAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFN0b2NrRm9ybURhdGEoeyAuLi5zdG9ja0Zvcm1EYXRhLCByZWFzb246IGUudGFyZ2V0LnZhbHVlIH0pfVxcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHB4LTQgcHktMi41IGJnLXNsYXRlLTUwIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGZvY3VzOmJnLXdoaXRlIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIHJvdW5kZWQteGwgZm9jdXM6b3V0bGluZS1ub25lIHRleHQteHMgZm9udC1zZW1pYm9sZCB0ZXh0LXNsYXRlLTcwMCBwbGFjZWhvbGRlcjp0ZXh0LXNsYXRlLTQwMFxcXCJcXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiZS5nLiBQaHlzaWNhbCBzdG9jayBjb3VudCBvciBjb3JyZWN0aW9uXFxcIlxcbiAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBnYXAtMyBwdC0zXFxcIj5cXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImJ1dHRvblxcXCJcXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRBZGp1c3RTdG9ja01vZGFsT3BlbihmYWxzZSl9XFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJmbGV4LTEgcHktMi41IHB4LTQgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgaG92ZXI6Ymctc2xhdGUtNTAgdGV4dC1zbGF0ZS01MDAgaG92ZXI6dGV4dC1zbGF0ZS03MDAgdGV4dC14cyBmb250LWJvbGQgcm91bmRlZC14bCBjdXJzb3ItcG9pbnRlciB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcXFwiXFxuICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICBDYW5jZWxcXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XFxuICAgICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgICB0eXBlPVxcXCJzdWJtaXRcXFwiXFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgZmxleC0xIHB5LTIuNSBweC00IHRleHQtd2hpdGUgdGV4dC14cyBmb250LWJsYWNrIHJvdW5kZWQteGwgY3Vyc29yLXBvaW50ZXIgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIHNoYWRvdy1tZFxcbiAgICAgICAgICAgICAgICAgICAgJHtzdG9ja0Zvcm1EYXRhLnR5cGUgPT09ICdJTicgXFxuICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWVtZXJhbGQtNjAwIGhvdmVyOmJnLWVtZXJhbGQtNzAwIHNoYWRvdy1lbWVyYWxkLTUwMC8xMCcgXFxuICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXJvc2UtNjAwIGhvdmVyOmJnLXJvc2UtNzAwIHNoYWRvdy1yb3NlLTUwMC8xMCdcXG4gICAgICAgICAgICAgICAgICAgIH1gfVxcbiAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAgQXBwbHkgQ2hhbmdlXFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgPC9mb3JtPlxcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICl9XFxuXFxuICAgICAgey8qIDMuIERldGFpbGVkIFByb2R1Y3QgU2xpZGVyIEluZm8gZGlhbG9ndWUgc2hlZXQgKi99XFxuICAgICAge2RldGFpbFByb2R1Y3QgJiYgKFxcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZpeGVkIGluc2V0LTAgei1bOTk5OV0gYmctc2xhdGUtOTAwLzQwIGJhY2tkcm9wLWJsdXIteHMgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1lbmQgcC0wXFxcIj5cXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImJnLXdoaXRlIHctZnVsbCBtYXgtdy1tZCBoLWZ1bGwgc2hhZG93LTJ4bCBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiBhbmltYXRlLWluIHNsaWRlLWluLWZyb20tcmlnaHQgZHVyYXRpb24tMjAwXFxcIj5cXG4gICAgICAgICAgICBcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwicC02IGJnLXNsYXRlLTUwLzgwIGJvcmRlci1iIGJvcmRlci1zbGF0ZS0yMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHNocmluay0wXFxcIj5cXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJwLTIuNSBiZy1pbmRpZ28tNTAgdGV4dC1pbmRpZ28tNjAwIHJvdW5kZWQteGwgc2hyaW5rLTBcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxQYWNrYWdlIGNsYXNzTmFtZT1cXFwidy01IGgtNVxcXCIgLz5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cXFwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtc2xhdGUtODAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3RcXFwiPlByb2R1Y3QgRGV0YWlsczwvaDM+XFxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LXNlbWlib2xkIGZvbnQtbW9ubyB0cmFja2luZy13aWRlIG10LTAuNVxcXCI+e2RldGFpbFByb2R1Y3Quc2t1IHx8ICctJ308L3A+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICA8YnV0dG9uXFxuICAgICAgICAgICAgICAgIHR5cGU9XFxcImJ1dHRvblxcXCJcXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RGV0YWlsUHJvZHVjdChudWxsKX1cXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJwLTEgcHgtMS41IHJvdW5kZWQtbGcgaG92ZXI6Ymctc2xhdGUtMjAwIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb25cXFwiXFxuICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cXFwidy01IGgtNVxcXCIgLz5cXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtNiBzcGFjZS15LTUgdGV4dC14cyB0ZXh0LXNsYXRlLTYwMCBmb250LXNlbWlib2xkIGxlYWRpbmctcmVsYXhlZFxcXCI+XFxuICAgICAgICAgICAgICB7ZGV0YWlsUHJvZHVjdC5pbWFnZVVybCAmJiAoXFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgaC00NCByb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBvdmVyZmxvdy1oaWRkZW4gYmctc2xhdGUtNTAgc2hyaW5rLTBcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxpbWcgXFxuICAgICAgICAgICAgICAgICAgICBzcmM9e2RldGFpbFByb2R1Y3QuaW1hZ2VVcmx9IFxcbiAgICAgICAgICAgICAgICAgICAgYWx0PXtkZXRhaWxQcm9kdWN0Lm5hbWV9IFxcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJyZXJQb2xpY3k9XFxcIm5vLXJlZmVycmVyXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclxcXCJcXG4gICAgICAgICAgICAgICAgICAvPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICl9XFxuXFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwic3BhY2UteS0xXFxcIj5cXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBibG9ja1xcXCI+UHJvZHVjdCBOYW1lPC9zcGFuPlxcbiAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XFxcInRleHQtYmFzZSBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIGxlYWRpbmctdGlnaHRcXFwiPntkZXRhaWxQcm9kdWN0Lm5hbWV9PC9wPlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZ3JpZCBncmlkLWNvbHMtMiBnYXAtNCBwdC0zIGJvcmRlci10IGJvcmRlci1zbGF0ZS0xMDBcXFwiPlxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwic3BhY2UteS0wLjVcXFwiPlxcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1bOXB4XSB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgZm9udC1ibGFjayB0cmFja2luZy13aWRlc3QgYmxvY2tcXFwiPkNhdGVnb3J5PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS04NTAgZm9udC1leHRyYWJvbGQgdGV4dC1bMTNweF1cXFwiPntkZXRhaWxQcm9kdWN0LmNhdGVnb3J5fTwvcD5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJzcGFjZS15LTAuNVxcXCI+XFxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVs5cHhdIHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZSBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVzdCBibG9ja1xcXCI+U3VwcGxpZXIgTmFtZTwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XFxcInRleHQtc2xhdGUtODUwIGZvbnQtZXh0cmFib2xkIHRleHQtWzEzcHhdXFxcIj57ZGV0YWlsUHJvZHVjdC5zdXBwbGllck5hbWUgfHwgJ1Vua25vd24gLyAtJ308L3A+XFxuICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZ3JpZCBncmlkLWNvbHMtMyBnYXAtMiBweS0zLjUgYm9yZGVyLXkgYm9yZGVyLXNsYXRlLTEwMC84MCB0ZXh0LWNlbnRlciBmb250LWJvbGQgdGV4dC1zbGF0ZS03MDAgYmctc2xhdGUtNTAvNTAgcm91bmRlZC0yeGwgcHgtMlxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJzcGFjZS15LTAuNVxcXCI+XFxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVs4cHhdIHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgYmxvY2tcXFwiPlF1YW50aXR5PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwXFxcIj57Zm9ybWF0U3RvY2tEaXNwbGF5KGRldGFpbFByb2R1Y3Quc3RvY2ssIGRldGFpbFByb2R1Y3QuY2F0ZWdvcnkpfSA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMFxcXCI+e2RldGFpbFByb2R1Y3QudW5pdH08L3NwYW4+PC9wPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktMC41XFxcIj5cXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtWzhweF0gdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIGZvbnQtYm9sZCB0cmFja2luZy13aWRlciBibG9ja1xcXCI+TWluIGFsZXJ0PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtc2xhdGUtODAwXFxcIj57ZGV0YWlsUHJvZHVjdC5taW5TdG9ja0FsZXJ0fTwvcD5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJzcGFjZS15LTAuNVxcXCI+XFxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVs4cHhdIHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZSBmb250LWJvbGQgdHJhY2tpbmctd2lkZXIgYmxvY2tcXFwiPlVuaXQgUHJpY2U8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVxcXCJ0ZXh0LWxnIGZvbnQtYmxhY2sgdGV4dC1pbmRpZ28tNzUwIGZvbnQtbW9ub1xcXCI+4oK5e2RldGFpbFByb2R1Y3Quc2VsbGluZ1ByaWNlLnRvTG9jYWxlU3RyaW5nKCl9PC9wPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAge2RldGFpbFByb2R1Y3QuZGVzY3JpcHRpb24gJiYgKFxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwic3BhY2UteS0xXFxcIj5cXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGJsb2NrXFxcIj5JdGVtIERlc2NyaXB0aW9uPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC1zbGF0ZS02NTAgZm9udC1tZWRpdW0gd2hpdGVzcGFjZS1wcmUtd3JhcCBiZy1zbGF0ZS01MC84MCBwLTMgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci1zbGF0ZS0xMDVcXFwiPntkZXRhaWxQcm9kdWN0LmRlc2NyaXB0aW9ufTwvcD5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICApfVxcblxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInB0LTIgZmxleCBmbGV4LWNvbCBnYXAtMlxcXCI+XFxuICAgICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgICB0eXBlPVxcXCJidXR0b25cXFwiXFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlT3BlbkVkaXRQcm9kdWN0KGRldGFpbFByb2R1Y3QpO1xcbiAgICAgICAgICAgICAgICAgICAgc2V0RGV0YWlsUHJvZHVjdChudWxsKTtcXG4gICAgICAgICAgICAgICAgICB9fVxcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHB5LTIuNSBweC00IGJnLWluZGlnby02MDAgaG92ZXI6YmctaW5kaWdvLTcwMCB0ZXh0LXdoaXRlIHRleHQteHMgZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgcm91bmRlZC14bCBjdXJzb3ItcG9pbnRlciBzZWxlY3Qtbm9uZSB0ZXh0LWNlbnRlciBibG9ja1xcXCJcXG4gICAgICAgICAgICAgICAgPlxcbiAgICAgICAgICAgICAgICAgIEVkaXQgQXR0cmlidXRlIFNwZWNpZmljYXRpb25zXFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgICA8YnV0dG9uXFxuICAgICAgICAgICAgICAgICAgdHlwZT1cXFwiYnV0dG9uXFxcIlxcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcXG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZU9wZW5BZGp1c3RTdG9jayhkZXRhaWxQcm9kdWN0KTtcXG4gICAgICAgICAgICAgICAgICB9fVxcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHB5LTIuNSBweC00IGJvcmRlciBib3JkZXItc2xhdGUtMjAwIGhvdmVyOmJnLXNsYXRlLTUwIHRleHQtc2xhdGUtNjAwIHRleHQteHMgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciByb3VuZGVkLXhsIGN1cnNvci1wb2ludGVyIHNlbGVjdC1ub25lIHRleHQtY2VudGVyIGJsb2NrXFxcIlxcbiAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAgQWRqdXN0IEluLVN0b2NrIEJhbGFuY2VcXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICApfVxcblxcbiAgICAgIHsvKiA0LiBDb21wbGV0ZSBTdG9jayBNb3ZlbWVudHMgTGVkZ2VyIGxvZyB2aWV3cyBzaGVldCBkeW5hbWljYWxseSAqL31cXG4gICAgICB7aXNMZWRnZXJPcGVuICYmIChcXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmaXhlZCBpbnNldC0wIHotWzk5OTldIGJnLXNsYXRlLTkwMC80MCBiYWNrZHJvcC1ibHVyLXhzIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFxcXCI+XFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJiZy13aGl0ZSByb3VuZGVkLTN4bCBzaGFkb3ctMnhsIHctZnVsbCBtYXgtdy00eGwgb3ZlcmZsb3ctaGlkZGVuIHRleHQtbGVmdCBmbGV4IGZsZXgtY29sIGgtWzg1dmhdIGFuaW1hdGUtaW4gZmFkZS1pbiB6b29tLWluLTk1IGR1cmF0aW9uLTE1MFxcXCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInB4LTYgcHktNC41IGJvcmRlci1iIGJvcmRlci1pbmRpZ28tNTAgYmctc2xhdGUtNTAvNjAgZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyIHNocmluay0wXFxcIj5cXG4gICAgICAgICAgICAgIDxkaXY+XFxuICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XFxcInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTgwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0XFxcIj5TdG9jayBNb3ZlbWVudCBMZWRnZXIgTG9nczwvaDM+XFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC1bMTFweF0gdGV4dC1zbGF0ZS00MDAgZm9udC1tZWRpdW1cXFwiPlRyYWNraW5nIGhpc3RvcnkgZm9yIGl0ZW0gY29ycmVjdGlvbnMsIGF1ZGl0cywgYW5kIHNhbGVzIGludm9pY2UgcmVkdWN0aW9ucy48L3A+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgdHlwZT1cXFwiYnV0dG9uXFxcIlxcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRMZWRnZXJPcGVuKGZhbHNlKX1cXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJwLTEgcHgtMS41IHJvdW5kZWQtbGcgaG92ZXI6Ymctc2xhdGUtMjAwIHRleHQtc2xhdGUtNDAwIHRyYW5zaXRpb25cXFwiXFxuICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgIDxYIGNsYXNzTmFtZT1cXFwidy01IGgtNVxcXCIgLz5cXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgIHsvKiBNaWNybyBGaWx0ZXIgdG9vbGJhciBmb3IgZHluYW1pYyBMZWRnZXIgc2VhcmNoZXMgKi99XFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInAtNCBiZy1zbGF0ZS01MCBib3JkZXItYiBib3JkZXItc2xhdGUtMjAwIGZsZXggZmxleC13cmFwIGdhcC0yIHRleHQteHMgc2hyaW5rLTAgZm9udC1ib2xkIHRleHQtc2xhdGUtNjAwXFxcIj5cXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XFxcIj5cXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgbXItMVxcXCI+QXVkaXRzIEZpbHRlcjo8L3NwYW4+XFxuICAgICAgICAgICAgICAgIFxcbiAgICAgICAgICAgICAgICB7LyogRGF0ZSBGaWx0ZXIgU2VsZWN0aW9uICovfVxcbiAgICAgICAgICAgICAgICA8c2VsZWN0XFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2xlZGdlckRhdGVGaWx0ZXJ9XFxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TGVkZ2VyRGF0ZUZpbHRlcihlLnRhcmdldC52YWx1ZSBhcyBhbnkpfVxcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwiYmctd2hpdGUgYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcm91bmRlZC1sZyBweS0xIHB4LTIuNSB0ZXh0LVsxMXB4XVxcXCJcXG4gICAgICAgICAgICAgICAgPlxcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIkFMTFxcXCI+QWxsIFRpbWUgTW92ZW1lbnRzPC9vcHRpb24+XFxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiVE9EQVlcXFwiPkFkanVzdGVkIFRvZGF5PC9vcHRpb24+XFxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiVEhJU19XRUVLXFxcIj5MYXN0IDcgRGF5czwvb3B0aW9uPlxcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIlRISVNfTU9OVEhcXFwiPlRoaXMgQ2FsZW5kYXIgTW9udGg8L29wdGlvbj5cXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICAgIHsvKiBQcm9kdWN0IFJlZmVyZW5jZSBEcm9wZG93biBGaWx0ZXIgKi99XFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBtbC1hdXRvIHNtOm1sLTBcXFwiPlxcbiAgICAgICAgICAgICAgICA8c2VsZWN0XFxuICAgICAgICAgICAgICAgICAgdmFsdWU9e2xlZGdlclByb2R1Y3RGaWx0ZXJ9XFxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TGVkZ2VyUHJvZHVjdEZpbHRlcihlLnRhcmdldC52YWx1ZSl9XFxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCByb3VuZGVkLWxnIHB5LTEgcHgtMi41IHRleHQtWzExcHhdIG1heC13LVsxODBweF1cXFwiXFxuICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBTExcXFwiPkFsbCBQcm9kdWN0IExlZGdlcjwvb3B0aW9uPlxcbiAgICAgICAgICAgICAgICAgIHtpbnZlbnRvcnkubWFwKGkgPT4gKFxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiBrZXk9e2kuaWR9IHZhbHVlPXtpLmlkfT57aS5uYW1lfTwvb3B0aW9uPlxcbiAgICAgICAgICAgICAgICAgICkpfVxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgey8qIEFjdGlvbiB0eXBlIGNvcnJlY3Rpb24gZmlsdGVyICovfVxcbiAgICAgICAgICAgICAgPGRpdj5cXG4gICAgICAgICAgICAgICAgPHNlbGVjdFxcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtsZWRnZXJBY3Rpb25GaWx0ZXJ9XFxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gc2V0TGVkZ2VyQWN0aW9uRmlsdGVyKGUudGFyZ2V0LnZhbHVlKX1cXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcImJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQtbGcgcHktMSBweC0yLjUgdGV4dC1bMTFweF1cXFwiXFxuICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJBTExcXFwiPkFsbCBBY3Rpb25zIFR5cGVzPC9vcHRpb24+XFxuICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiUHJvZHVjdCBDcmVhdGVkXFxcIj5Qcm9kdWN0IENyZWF0ZWQ8L29wdGlvbj5cXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJTdG9jayBBZGp1c3RtZW50XFxcIj5Db3JyZWN0aW9uIEF1ZGl0czwvb3B0aW9uPlxcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIkludm9pY2UgR2VuZXJhdGVkXFxcIj5JbnZvaWNlcyBkZWR1Y3Q8L29wdGlvbj5cXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+XFxuICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICA8L2Rpdj5cXG5cXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLTYgYmctc2xhdGUtNTAvMzBcXFwiPlxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImJnLXdoaXRlIGJvcmRlciBib3JkZXItc2xhdGUtMjAwIHJvdW5kZWQtMnhsIHNoYWRvdy0yeHMgb3ZlcmZsb3ctaGlkZGVuIHctZnVsbFxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgb3ZlcmZsb3cteC1hdXRvXFxcIj5cXG4gICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVxcXCJ3LWZ1bGwgdGV4dC1sZWZ0IGJvcmRlci1jb2xsYXBzZSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgbWluLXctWzcwMHB4XVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVxcXCJiZy1zbGF0ZS01MCBib3JkZXItYiBib3JkZXItc2xhdGUtMjUwIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8dHI+XFxuICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XFxcInB5LTMgcHgtNFxcXCI+VGltZXN0YW1wIFJlZmVyZW5jZTwvdGg+XFxuICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XFxcInB5LTMgcHgtNFxcXCI+VGFyZ2V0IFByb2R1Y3QgU0tVPC90aD5cXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cXFwicHktMyBweC0zIHRleHQtY2VudGVyXFxcIj5UcmFuc2ZlciBUeXBlPC90aD5cXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cXFwicHktMyBweC0zIHRleHQtcmlnaHRcXFwiPkFkanVzdG1lbnQgUXR5PC90aD5cXG4gICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cXFwicHktMyBweC00XFxcIj5BdWRpdCBBY3Rpb24gLyBSZWFzb24gTG9nPC90aD5cXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgICAgPC90aGVhZD5cXG4gICAgICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVxcXCJkaXZpZGUteSBkaXZpZGUtc2xhdGUtMTAwIHRleHQtc2xhdGUtNjAwXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgIHtmaWx0ZXJlZExlZGdlck1vdmVtZW50cy5tYXAobW92ID0+IHtcXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0ZU9iaiA9IG5ldyBEYXRlKG1vdi5kYXRlKTtcXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsYXRlZFByb2R1Y3QgPSBpbnZlbnRvcnkuZmluZChpID0+IGkuaWQgPT09IG1vdi5wcm9kdWN0SWQpO1xcblxcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e21vdi5pZH0gY2xhc3NOYW1lPVxcXCJob3ZlcjpiZy1zbGF0ZS01MC81MFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVxcXCJweS0zIHB4LTRcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcImZvbnQtZXh0cmFib2xkIHRleHQtc2xhdGUtODAwIGJsb2NrXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF0ZU9iai50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUlOJywgeyBkYXk6ICcyLWRpZ2l0JywgbW9udGg6ICdzaG9ydCcsIHllYXI6ICdudW1lcmljJyB9KX1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtWzEwcHhdIHRleHQtc2xhdGUtNDUwIGJsb2NrIGZvbnQtbWVkaXVtXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZGF0ZU9iai50b0xvY2FsZVRpbWVTdHJpbmcoJ2VuLUlOJywgeyBob3VyOiAnMi1kaWdpdCcsIG1pbnV0ZTogJzItZGlnaXQnIH0pfVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxcblxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cXFwicHktMyBweC00XFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJmb250LWJsYWNrIHRleHQtc2xhdGUtOTAwIGJsb2NrIHRydW5jYXRlIG1heC13LVsyMDBweF1cXFwiPnttb3YucHJvZHVjdE5hbWV9PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVsYXRlZFByb2R1Y3Q/LnNrdSAmJiAoXFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVs5LjVweF0gZm9udC1tb25vIHRleHQtaW5kaWdvLTY1MCBiZy1pbmRpZ28tNTAgcHgtMS41IHB5LTAuNSByb3VuZGVkIGZvbnQtYmxhY2sgaW5saW5lLWJsb2NrIG10LTAuNVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVsYXRlZFByb2R1Y3Quc2t1fVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XFxuXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVxcXCJweS0zIHB4LTMgdGV4dC1jZW50ZXJcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BpbmxpbmUtZmxleCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgdGV4dC1bOXB4XSBmb250LWV4dHJhYm9sZCB1cHBlcmNhc2VcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke21vdi50eXBlID09PSAnSU4nID8gJ2JnLWVtZXJhbGQtNTAgdGV4dC1lbWVyYWxkLTcwMCBib3JkZXIgYm9yZGVyLWVtZXJhbGQtMTUwJyA6ICdiZy1yb3NlLTUwIHRleHQtcm9zZS03MDAgYm9yZGVyIGJvcmRlci1yb3NlLTE1MCd9YH0+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge21vdi50eXBlID09PSAnSU4nID8gJ1JFQ0VJVkUnIDogJ0RFRFVDVCd9XFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XFxuXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtgcHktMyBweC0zIHRleHQtcmlnaHQgZm9udC1ibGFjayBmb250LW1vbm8gdGV4dC14cyAke21vdi50eXBlID09PSAnSU4nID8gJ3RleHQtZW1lcmFsZC02MDAnIDogJ3RleHQtcm9zZS02MDAnfWB9PlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7bW92LnR5cGUgPT09ICdJTicgPyAnKycgOiAnLSd9e21vdi5xdWFudGl0eX1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XFxuXFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVxcXCJweS0zIHB4LTRcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtc2xhdGUtODAwIGZvbnQtZXh0cmFib2xkXFxcIj57bW92LmFjdGlvblR5cGUgfHwgJ0FkanVzdG1lbnQnfTwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSB0ZXh0LXNsYXRlLTQwMCBmb250LW1lZGl1bSBibG9jayBtdC0wLjUgdHJ1bmNhdGUgbWF4LXctWzI0NXB4XVxcXCIgdGl0bGU9e21vdi5yZWFzb259PlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttb3YucmVhc29ufVxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XFxuICAgICAgICAgICAgICAgICAgICAgICk7XFxuICAgICAgICAgICAgICAgICAgICB9KX1cXG5cXG4gICAgICAgICAgICAgICAgICAgIHtmaWx0ZXJlZExlZGdlck1vdmVtZW50cy5sZW5ndGggPT09IDAgJiYgKFxcbiAgICAgICAgICAgICAgICAgICAgICA8dHI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNvbFNwYW49ezV9IGNsYXNzTmFtZT1cXFwicHktMTIgdGV4dC1jZW50ZXIgdGV4dC1zbGF0ZS00MDAgZm9udC1ib2xkIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclxcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgICAgICBObyBhdWRpdCBtb3ZlbWVudHMgcmVjb3JkZWQuXFxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgICAgICAgICAgICl9XFxuICAgICAgICAgICAgICAgICAgPC90Ym9keT5cXG4gICAgICAgICAgICAgICAgICA8L3RhYmxlPlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICl9XFxuXFxuICAgICAgey8qIPCflK4gQURWQU5DRUQgUFVSQ0hBU0UgT1JERVIgKFBPKSBHRU5FUkFUT1IgTU9EQUwgKi99XFxuICAgICAgPEFuaW1hdGVQcmVzZW5jZT5cXG4gICAgICAgIHtkcmFmdGluZ1BPSXRlbSAmJiAoXFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmaXhlZCBpbnNldC0wIGJnLXNsYXRlLTk1MC84MCBiYWNrZHJvcC1ibHVyLXNtIHotWzk5OTldIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHAtNFxcXCI+XFxuICAgICAgICAgICAgPG1vdGlvbi5kaXZcXG4gICAgICAgICAgICAgIGluaXRpYWw9e3sgc2NhbGU6IDAuOTUsIG9wYWNpdHk6IDAsIHk6IDEwIH19XFxuICAgICAgICAgICAgICBhbmltYXRlPXt7IHNjYWxlOiAxLCBvcGFjaXR5OiAxLCB5OiAwIH19XFxuICAgICAgICAgICAgICBleGl0PXt7IHNjYWxlOiAwLjk1LCBvcGFjaXR5OiAwLCB5OiAxMCB9fVxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVxcXCJiZy13aGl0ZSBib3JkZXIgYm9yZGVyLXNsYXRlLTIwMCBtYXgtdy1sZyB3LWZ1bGwgcm91bmRlZC0yeGwgc2hhZG93LTJ4bCBvdmVyZmxvdy1oaWRkZW4gZmxleCBmbGV4LWNvbCBmb250LXNhbnNcXFwiXFxuICAgICAgICAgICAgPlxcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImJnLXNsYXRlLTkwMCB0ZXh0LXdoaXRlIHAtNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXNsYXRlLTgwMFxcXCI+XFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41XFxcIj5cXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwicC0yIGJnLWluZGlnby01MDAvMTAgYm9yZGVyIGJvcmRlci1pbmRpZ28tNTAwLzMwIHRleHQtaW5kaWdvLTQwMCByb3VuZGVkLWxnXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgIDxIaXN0b3J5IGNsYXNzTmFtZT1cXFwidy00IGgtNCB0ZXh0LWluZGlnby00MDBcXFwiIC8+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgPGRpdj5cXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1bOXB4XSB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgZm9udC1leHRyYWJvbGQgdGV4dC1pbmRpZ28tNDAwIGJsb2NrXFxcIj5BSSBBdXRvbWF0ZWQgRHJhZnRpbmcgRW5naW5lPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cXFwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgbGVhZGluZy1ub25lXFxcIj5EcmFmdCBQdXJjaGFzZSBPcmRlciBQTy17RGF0ZS5ub3coKS50b1N0cmluZygpLnN1YnN0cmluZyg3KX08L2gzPlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImJ1dHRvblxcXCJcXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXREcmFmdGluZ1BPSXRlbShudWxsKX1cXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInRleHQtc2xhdGUtNDAwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvbi1jb2xvcnMgY3Vyc29yLXBvaW50ZXJcXFwiXFxuICAgICAgICAgICAgICAgID5cXG4gICAgICAgICAgICAgICAgICA8WCBjbGFzc05hbWU9XFxcInctNSBoLTVcXFwiIC8+XFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwicC01IHNwYWNlLXktNCBtYXgtaC1bNzB2aF0gb3ZlcmZsb3cteS1hdXRvXFxcIj5cXG4gICAgICAgICAgICAgICAgey8qIFByb2R1Y3QgU3VtbWFyeSAqL31cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInAtNCBiZy1pbmRpZ28tNTAvNTAgYm9yZGVyIGJvcmRlci1pbmRpZ28tMTUwIHJvdW5kZWQteGwgc3BhY2UteS0xXFxcIj5cXG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtWzlweF0gZm9udC1ibGFjayB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIgdGV4dC1pbmRpZ28tNjAwIGJsb2NrXFxcIj5SZXN0b2NrIEl0ZW0gVGFyZ2V0PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cXFwidGV4dC14cyBmb250LWJsYWNrIHRleHQtaW5kaWdvLTk1MCB1cHBlcmNhc2VcXFwiPntkcmFmdGluZ1BPSXRlbS5wcm9kdWN0Lm5hbWV9PC9wPlxcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVxcXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNCB0ZXh0LVsxMHB4XSB0ZXh0LWluZGlnby03MDAgZm9udC1leHRyYWJvbGQgbXQtMVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5TS1U6IHtkcmFmdGluZ1BPSXRlbS5wcm9kdWN0LnNrdX08L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj7igKI8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5DdXJyZW50IFN0b2NrOiB7Zm9ybWF0U3RvY2tEaXNwbGF5KGRyYWZ0aW5nUE9JdGVtLnByb2R1Y3Quc3RvY2ssIGRyYWZ0aW5nUE9JdGVtLnByb2R1Y3QuY2F0ZWdvcnkpfSB1bml0czwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgIHsvKiBGb3JtIGZpZWxkcyAqL31cXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInNwYWNlLXktNFxcXCI+XFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZsZXggZmxleC1jb2wgZ2FwLTEuNSB0ZXh0LXNsYXRlLTY1MFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVxcXCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRleHQtc2xhdGUtNDAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlc3QgYmxvY2tcXFwiPlN1cHBsaWVyIE5hbWU8L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVxcXCJ0ZXh0XFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInAtMi41IGJvcmRlciBib3JkZXItc2xhdGUtMjUwIHJvdW5kZWQteGwgZm9udC1ib2xkIHRleHQteHMgdGV4dC1zbGF0ZS03MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOmJvcmRlci1pbmRpZ28tNTAwIGJnLXdoaXRlXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cXFwiZS5nLiBBY21lIFN1cHBsaWVyIENvcnAsIERlbGwgSW5kaWEsIFNhbXN1bmcgV2hvbGVzYWxlXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9Gb3JtRGF0YS5zdXBwbGllck5hbWV9XFxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFBvRm9ybURhdGEocHJldiA9PiAoeyAuLi5wcmV2LCBzdXBwbGllck5hbWU6IGUudGFyZ2V0LnZhbHVlIH0pKX1cXG4gICAgICAgICAgICAgICAgICAgIC8+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImdyaWQgZ3JpZC1jb2xzLTIgZ2FwLTMuNVxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHRleHQtc2xhdGUtNjUwXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cXFwidGV4dC1bMTBweF0gZm9udC1ibGFjayB0ZXh0LXNsYXRlLTQwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXN0IGJsb2NrIGZvbnQtc2Fuc1xcXCI+UmVvcmRlciBRdHk8L2xhYmVsPlxcbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgXFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cXFwibnVtYmVyXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbj1cXFwiMVxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInAtMi41IGJvcmRlciBib3JkZXItc2xhdGUtMjUwIHJvdW5kZWQteGwgZm9udC1ib2xkIHRleHQteHMgZm9udC1tb25vIHRleHQtc2xhdGUtODAwIGJnLXdoaXRlXFxcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwb0Zvcm1EYXRhLnF1YW50aXR5fVxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFBvRm9ybURhdGEocHJldiA9PiAoeyAuLi5wcmV2LCBxdWFudGl0eTogTWF0aC5tYXgoMSwgcGFyc2VJbnQoZS50YXJnZXQudmFsdWUpIHx8IDEpIH0pKX1cXG4gICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgXFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBmbGV4LWNvbCBnYXAtMS41IHRleHQtc2xhdGUtNjUwIGZvbnQtc2Fuc1xcXCI+XFxuICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XFxcInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS00MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVzdCBibG9ja1xcXCI+VW5pdCBDb3N0PC9sYWJlbD5cXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInJlbGF0aXZlXFxcIj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcImFic29sdXRlIGxlZnQtMi41IHRvcC0xLzIgLXRyYW5zbGF0ZS15LTEvMiB0ZXh0LXNsYXRlLTQwMCBmb250LWJvbGQgdGV4dC14c1xcXCI+4oK5PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XFxcIm51bWJlclxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1pbj1cXFwiMFxcXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwidy1mdWxsIHAtMi41IHBsLTYgYm9yZGVyIGJvcmRlci1zbGF0ZS0yNTAgcm91bmRlZC14bCBmb250LWJvbGQgdGV4dC14cyBmb250LW1vbm8gdGV4dC1zbGF0ZS04MDAgYmctd2hpdGVcXFwiXFxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cG9Gb3JtRGF0YS51bml0Q29zdH1cXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHNldFBvRm9ybURhdGEocHJldiA9PiAoeyAuLi5wcmV2LCB1bml0Q29zdDogcGFyc2VGbG9hdChlLnRhcmdldC52YWx1ZSkgfHwgMCB9KSl9XFxuICAgICAgICAgICAgICAgICAgICAgICAgLz5cXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgPC9kaXY+XFxuXFxuICAgICAgICAgICAgICAgIHsvKiBQTyBWYWx1YXRpb24gYW5kIFJlY29tbWVuZGF0aW9uIG1ldGFkYXRhICovfVxcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiYm9yZGVyIGJvcmRlci1zbGF0ZS0yMDAgcm91bmRlZC14bCBwLTQgYmctc2xhdGUtNTAgc3BhY2UteS0yXFxcIj5cXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQteHMgZm9udC1zZW1pYm9sZFxcXCI+XFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XFxcInRleHQtc2xhdGUtNTAwIGZvbnQtYm9sZFxcXCI+RXN0aW1hdGVkIENvc3QgVmFsdWF0aW9uOjwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwiZm9udC1leHRyYWJvbGQgdGV4dC1zbGF0ZS04MDBcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICDigrkgeyhwb0Zvcm1EYXRhLnF1YW50aXR5ICogcG9Gb3JtRGF0YS51bml0Q29zdCkudG9Mb2NhbGVTdHJpbmcoJ2VuLUlOJyl9XFxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgPC9kaXY+XFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGRcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LXNsYXRlLTUwMCBmb250LWJvbGRcXFwiPkluYm91bmQgU2hpcG1lbnQgVGFyZ2V0Ojwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwiZm9udC1leHRyYWJvbGQgdGV4dC1zbGF0ZS04MDBcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgICBTdGFuZGFyZCBUcmFuc3BvcnQgUmFpbCAoRXhwcmVzcylcXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwicHQtMiBib3JkZXItdCBib3JkZXItc2xhdGUtMjAwIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LXhzIGZvbnQtYmxhY2tcXFwiPlxcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LWluZGlnby02NTBcXFwiPlNtYXJ0IEJ1eSBSZWNvbW1lbmRhdGlvbnM6PC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVxcXCJ0ZXh0LWVtZXJhbGQtNjAwIGJnLWVtZXJhbGQtNTUvMTAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTIwMCBweC0yMCBweC0yIHB5LTAuNSByb3VuZGVkLWZ1bGwgdGV4dC1bMTBweF1cXFwiPlBBU1NFUyBCVURHRVQgQ0FQPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgICAgICA8L2Rpdj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcblxcbiAgICAgICAgICAgICAgey8qIFBPIElzc3VhbmNlIGZvb3RlciBhY3Rpb24gKi99XFxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cXFwiYmctc2xhdGUtNTAgcC00IGJvcmRlci10IGJvcmRlci1zbGF0ZS0yMDAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1lbmQgZ2FwLTIgdGV4dC1yaWdodFxcXCI+XFxuICAgICAgICAgICAgICAgIDxidXR0b25cXG4gICAgICAgICAgICAgICAgICB0eXBlPVxcXCJidXR0b25cXFwiXFxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RHJhZnRpbmdQT0l0ZW0obnVsbCl9XFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3BvSXNTdWJtaXR0aW5nfVxcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cXFwicHgtNCBweS0yIGJvcmRlciBib3JkZXItc2xhdGUtMjUwIHRleHQtc2xhdGUtNjUwIGJnLXdoaXRlIGhvdmVyOmJnLXNsYXRlLTUwIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJsYWNrIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyXFxcIlxcbiAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAgQ2FuY2VsXFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxcbiAgICAgICAgICAgICAgICBcXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxcbiAgICAgICAgICAgICAgICAgIHR5cGU9XFxcImJ1dHRvblxcXCJcXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVJc3N1ZVBPQ29tbWl0fVxcbiAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtwb0lzU3VibWl0dGluZ31cXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XFxcInB4LTUgcHktMiBiZy1pbmRpZ28tNjAwIGhvdmVyOmJnLWluZGlnby03MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ibGFjayBzaGFkb3ctbGcgc2hhZG93LWluZGlnby0xNTAgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBkaXNhYmxlZDpvcGFjaXR5LTUwXFxcIlxcbiAgICAgICAgICAgICAgICA+XFxuICAgICAgICAgICAgICAgICAge3BvSXNTdWJtaXR0aW5nID8gKFxcbiAgICAgICAgICAgICAgICAgICAgPD5cXG4gICAgICAgICAgICAgICAgICAgICAgPFJlZnJlc2hDdyBjbGFzc05hbWU9XFxcInctMy41IGgtMy41IGFuaW1hdGUtc3BpbiB0ZXh0LXdoaXRlXFxcIiAvPlxcbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5HZW5lcmF0aW5nIExlZGdlci4uLjwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgIDwvPlxcbiAgICAgICAgICAgICAgICAgICkgOiAoXFxuICAgICAgICAgICAgICAgICAgICA8PlxcbiAgICAgICAgICAgICAgICAgICAgICA8Q2hlY2sgY2xhc3NOYW1lPVxcXCJ3LTMuNSBoLTMuNSB0ZXh0LXdoaXRlXFxcIiBzdHJva2VXaWR0aD17M30gLz5cXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+QXV0aG9yaXplIEluYm91bmQgUE88L3NwYW4+XFxuICAgICAgICAgICAgICAgICAgICA8Lz5cXG4gICAgICAgICAgICAgICAgICApfVxcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cXG4gICAgICAgICAgICAgIDwvZGl2PlxcbiAgICAgICAgICAgIDwvbW90aW9uLmRpdj5cXG4gICAgICAgICAgPC9kaXY+XFxuICAgICAgICApfVxcbiAgICAgIDwvQW5pbWF0ZVByZXNlbmNlPlxcblxcbiAgICAgIHsvKiBCYXJjb2RlIFNjYW5uZXIgTW9kYWwgQ29tcG9uZW50ICovfVxcbiAgICAgIHtzaG93QmFyY29kZVNjYW5uZXIgJiYgKFxcbiAgICAgICAgPEJhcmNvZGVTY2FubmVyTW9kYWwgXFxuICAgICAgICAgIG9uQ2xvc2U9eygpID0+IHNldFNob3dCYXJjb2RlU2Nhbm5lcihmYWxzZSl9XFxuICAgICAgICAgIG9uU2Nhbj17KGRlY29kZWRUZXh0KSA9PiB7XFxuICAgICAgICAgICAgc2V0Rm9ybURhdGEocHJldiA9PiAoeyAuLi5wcmV2LCBiYXJjb2RlOiBkZWNvZGVkVGV4dCB9KSk7XFxuICAgICAgICAgICAgc2V0U2hvd0JhcmNvZGVTY2FubmVyKGZhbHNlKTtcXG4gICAgICAgICAgfX1cXG4gICAgICAgIC8+XFxuICAgICAgKX1cXG4gICAgPC9kaXY+XFxuICApO1xcbn1cXG5cIiJdLCJtYXBwaW5ncyI6IkFBQUEsZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTsiLCJuYW1lcyI6W119