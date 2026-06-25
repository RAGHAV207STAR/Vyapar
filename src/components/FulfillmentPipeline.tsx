import React, { useState } from 'react';
import { 
  X, Search, ChevronDown, Check, Download, Share2, Mail, Trash2, 
  Package, Sparkles, Building2, Copy, Loader2, Info, AlertTriangle, Play, Plus, Clock, Eye
} from 'lucide-react';

interface FulfillmentPipelineProps {
  filteredPendingPOs: any[];
  inventory: any[];
  receivingPo: any | null;
  setReceivingPo: (val: any) => void;
  partialReceipts: Record<string, number>;
  setPartialReceipts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  receivedCosts: Record<string, number>;
  setReceivedCosts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  closedLines: Record<string, boolean>;
  setClosedLines: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isExtractingBill: boolean;
  isDragOverBill: boolean;
  setIsDragOverBill: (val: boolean) => void;
  billFileName: string;
  extractedInvoiceDetails: any;
  setExtractedInvoiceDetails: (val: any) => void;
  registeringProductIndex: any | null;
  setRegisteringProductIndex: (val: any) => void;
  registeringProductForm: any;
  setRegisteringProductForm: React.Dispatch<React.SetStateAction<any>>;
  supplierDiscrepancyAction: 'keep_pending' | 'cancel_remaining' | 'supplier_follow_up';
  setSupplierDiscrepancyAction: (val: any) => void;
  isReceivingProgress: boolean;
  handleSupplierBillUpload: (file: File) => void;
  getNonExistentProductsInbound: () => any[];
  getMissingProductsInbound: () => any[];
  submitPartialReceiving: () => void;
  addProduct: (p: any) => Promise<any>;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  generatePO_PDF: (dObj: any) => void;
  triggerWhatsAppDispatch: (dObj: any) => void;
  triggerEmailDispatch: (dObj: any) => void;
  formatNum: (val: number) => string;
  onUpdatePONote: (poId: string, noteText: string) => void;
  onDeletePO: (poId: string) => void;
}

export default function FulfillmentPipeline({
  filteredPendingPOs = [],
  inventory = [],
  receivingPo,
  setReceivingPo,
  partialReceipts,
  setPartialReceipts,
  receivedCosts,
  setReceivedCosts,
  closedLines,
  setClosedLines,
  isExtractingBill,
  isDragOverBill,
  setIsDragOverBill,
  billFileName,
  extractedInvoiceDetails,
  setExtractedInvoiceDetails,
  registeringProductIndex,
  setRegisteringProductIndex,
  registeringProductForm,
  setRegisteringProductForm,
  supplierDiscrepancyAction,
  setSupplierDiscrepancyAction,
  isReceivingProgress,
  handleSupplierBillUpload,
  getNonExistentProductsInbound,
  getMissingProductsInbound,
  submitPartialReceiving,
  addProduct,
  showToast,
  generatePO_PDF,
  triggerWhatsAppDispatch,
  triggerEmailDispatch,
  formatNum,
  onUpdatePONote,
  onDeletePO
}: FulfillmentPipelineProps) {

  // Local state to toggle notes updating accordion
  const [expandedNotePoId, setExpandedNotePoId] = useState<string | null>(null);
  const [inlineNotesInputs, setInlineNotesInputs] = useState<Record<string, string>>({});

  // Local state for toggling AI Invoice Scanner visibility (hidden by default)
  const [showAiScanner, setShowAiScanner] = useState<boolean>(false);

  // Search filter for pending orders within this tracking view
  const [localSearch, setLocalSearch] = useState<string>('');

  const displayedPOs = React.useMemo(() => {
    if (!localSearch) return filteredPendingPOs;
    return filteredPendingPOs.filter(po => 
      (po.id || '').toLowerCase().includes(localSearch.toLowerCase()) || 
      (po.supplier || '').toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [filteredPendingPOs, localSearch]);

  // Color mapping matching professional specifications
  const statusColors: Record<string, { bg: string; border: string; bar: string }> = {
    'draft': { bg: 'bg-slate-50 text-slate-700', border: 'border-slate-200', bar: 'bg-slate-400' },
    'pending': { bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-150', bar: 'bg-indigo-500' },
    'partially_received': { bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    'received': { bg: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    'closed': { bg: 'bg-rose-50 text-rose-700', border: 'border-rose-150', bar: 'bg-rose-500' },

    'Draft': { bg: 'bg-slate-50 text-slate-700', border: 'border-slate-200', bar: 'bg-slate-400' },
    'Sent': { bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-150', bar: 'bg-indigo-500' },
    'Ordered': { bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-150', bar: 'bg-indigo-500' },
    'Partially Received': { bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' },
    'Received': { bg: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    'Completed': { bg: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    'Cancelled': { bg: 'bg-rose-50 text-rose-700', border: 'border-rose-150', bar: 'bg-rose-500' }
  };

  // Quick Action: full check-in toggle
  const handleFullReceiveClick = () => {
    if (!receivingPo) return;
    const rx: Record<string, number> = {};
    receivingPo.items.forEach((item: any, idx: number) => {
      rx[`${idx}`] = item.qty - (item.receivedQty || 0);
    });
    setPartialReceipts(rx);
    showToast("Filled all remaining quantities to order requirements.", "info");
  };

  // Quick Action: clear check-in toggle
  const handleClearReceiveClick = () => {
    setPartialReceipts({});
    setClosedLines({});
    showToast("Cleared intake inputs.", "info");
  };

  return (
    <div id="vmitra-fulfillment" className="space-y-6 text-left animate-fade-in">
      
      {/* FILTER SEARCH HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200 rounded-3xl shadow-3xs">
        <div className="space-y-1">
          <h3 className="font-extrabold text-[#111111] text-base">Inbound Receiving Pipeline</h3>
          <p className="text-[10.5px] text-slate-450 font-bold uppercase tracking-wider">
            Check-in arriving shipments, verify supplier billing, and update inventory volumes.
          </p>
        </div>

        <div className="flex items-center gap-2 max-w-sm w-full sm:w-64">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-405" />
            <input
              type="text"
              placeholder="Search PO ID, Supplier..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE DELIVERIES PIPELINE GRID */}
      {displayedPOs.length === 0 ? (
        <div className="p-16 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center gap-3 bg-white border border-slate-200 rounded-3xl">
          <Package className="w-10 h-10 text-slate-300 stroke-[1.5]" />
          <div>
            <h4 className="font-extrabold text-slate-700">No active shipments in pipeline</h4>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Select "+ New Purchase Order" to generate order logs first.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedPOs.map((po) => {
            const status = (po.status || 'pending').toLowerCase();
            const colors = statusColors[status] || { bg: 'bg-slate-50 text-slate-700', border: 'border-slate-200', bar: 'bg-slate-400' };
            const isCompleted = status === 'received' || status === 'closed';

            // Calculate exact fulfillment progress percentage
            const totalOrdered = po.items?.reduce((sum: number, i: any) => sum + i.qty, 0) || 1;
            const totalReceived = po.items?.reduce((sum: number, i: any) => sum + (i.receivedQty || 0), 0) || 0;
            const progressPct = Math.min(100, Math.round((totalReceived / totalOrdered) * 100));

            return (
              <div 
                key={po.id} 
                className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 transition-all p-5 flex flex-col justify-between text-left space-y-4 shadow-3xs"
              >
                
                {/* ID AND STATUS HEADER */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-indigo-700">{po.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${colors.bg} ${colors.border}`}>
                        {status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-450 font-bold uppercase block mt-1 tracking-wider">
                      Supplier: <strong className="text-slate-800 font-extrabold">{po.supplier || 'General Supplier'}</strong>
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-semibold font-mono">
                    {new Date(po.date).toLocaleDateString()}
                  </div>
                </div>

                {/* PROGRESS BAR COMPONENT */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-450">
                    <span>Intake Shipment Progress</span>
                    <span className="font-extrabold text-slate-800">{progressPct}% ({totalReceived}/{totalOrdered})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${colors.bar}`} 
                      style={{ width: `${progressPct}%` }} 
                    />
                  </div>
                </div>

                {/* ORDERED STYLES VERIFICATION SUBBLOCK */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-150 p-4.5 space-y-3">
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Ordered Styles Verification</span>
                  <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {po.items.map((item: any, idx: number) => (
                      <div key={idx} className="pt-1.5 flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span className="truncate max-w-[180px] font-bold text-slate-800">{item.productName}</span>
                        <span className="font-black text-slate-500 font-mono text-[10.5px]">
                          {item.receivedQty || 0} / {item.qty} {item.unit || 'units'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3.5 border-t border-slate-200 border-dashed flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="text-[9.5px] text-slate-400 uppercase tracking-wider">Estimated Order Value:</span>
                    <span className="font-extrabold text-slate-900 font-mono">₹{formatNum(po.totalAmount || 0)}</span>
                  </div>
                </div>

                {/* COLLAPSIBLE LOGISTICS NOTES DRAWER */}
                <div className="border-t border-slate-100 pt-2 text-xs">
                  {expandedNotePoId === po.id ? (
                    <div className="space-y-1.5 text-left animate-fade-in mt-1.5">
                      <textarea
                        rows={2}
                        value={inlineNotesInputs[po.id] ?? po.purchaseNotes ?? ''}
                        onChange={(e) => setInlineNotesInputs(prev => ({ ...prev, [po.id]: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                        placeholder="Update tracking/delivery spec guidelines..."
                      />
                      <div className="flex justify-end gap-1.5 text-[9px] font-black uppercase tracking-wider">
                        <button 
                          onClick={() => setExpandedNotePoId(null)}
                          className="bg-slate-105 hover:bg-slate-200 px-2.5 py-1.5 rounded text-slate-600 block cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            onUpdatePONote(po.id, inlineNotesInputs[po.id] || '');
                            setExpandedNotePoId(null);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded block cursor-pointer"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-1">
                      <p className="text-[10px] text-slate-450 font-bold italic truncate max-w-[200px]">
                        {po.purchaseNotes ? `💬 ${po.purchaseNotes}` : "No delivery guidelines specified"}
                      </p>
                      <button
                        onClick={() => {
                          setExpandedNotePoId(po.id);
                          setInlineNotesInputs(prev => ({ ...prev, [po.id]: po.purchaseNotes || '' }));
                        }}
                        className="text-[9px] text-indigo-600 font-black uppercase hover:underline cursor-pointer"
                      >
                        Edit Guideline Settings
                      </button>
                    </div>
                  )}
                </div>

                {/* CORE CONTROLS BOTTOM BUTTONS */}
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-50">
                  
                  {!isCompleted ? (
                    <button
                      onClick={() => {
                        setReceivingPo(po);
                        // Initialize checklists
                        const rx: Record<string, number> = {};
                        const cs: Record<string, number> = {};
                        po.items.forEach((item: any, idX: number) => {
                          rx[`${idX}`] = item.qty - (item.receivedQty || 0);
                          cs[`${idX}`] = item.cost || 0;
                        });
                        setPartialReceipts(rx);
                        setReceivedCosts(cs);
                        setClosedLines({});
                        setExtractedInvoiceDetails(null);
                        setShowAiScanner(false); // keep scanner collapsed initially
                      }}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] tracking-wider font-extrabold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Receive Items
                    </button>
                  ) : (
                    <span className="flex-1 py-1.5 bg-emerald-50 text-emerald-800 border-emerald-150 text-[10px] font-bold uppercase rounded-lg text-center select-none block">
                      ✓ Intake Completed Fully
                    </span>
                  )}

                  <button
                    onClick={() => generatePO_PDF(po)}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Export Purchase documentation PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete/archive this purchase order?")) {
                        onDeletePO(po.id);
                      }
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-250 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer animate-fade-in"
                    title="Delete PO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RECEIVING MANAGER MODAL POPUP (STOCK CHECK-IN INTERFACE) */}
      {receivingPo !== null && (
        <div className="fixed inset-0 z-55 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-350 tracking-widest block">Intake Stock Verification Panel</span>
                <h3 className="font-extrabold text-sm text-slate-100">Check In Arriving Stock: {receivingPo.id}</h3>
              </div>
              <button 
                onClick={() => setReceivingPo(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800 rounded-lg p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scroll Content area */}
            <div className="p-6 max-h-[460px] overflow-y-auto space-y-5 text-left">
              
              {/* COMPACT AI INVOICE SCANNER (COLLAPSED BY DEFAULT) */}
              <div className="border border-slate-200 bg-white rounded-2xl shadow-3xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAiScanner(!showAiScanner)}
                  className="w-full py-3.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs uppercase flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>Scan Supplier Invoice with Smart Vyapar AI ({showAiScanner ? 'Hide Scanner' : 'Click to Scan'})</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAiScanner ? 'rotate-180' : ''}`} />
                </button>

                {showAiScanner && (
                  <div className="p-4 border-t border-slate-200 text-xs text-slate-700 bg-slate-50/30 space-y-3.5 animate-fade-in">
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Upload PDF matching logs or bill photographs. Gemini matches product catalog names, extracts quantities, and updates cost configurations immediately.
                    </p>

                    {isExtractingBill ? (
                      <div className="bg-white border border-slate-150 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
                        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                        <span className="text-xs font-black text-slate-850 uppercase tracking-widest block">Reading Supplier Bill...</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Extracting products, quantities, and matching indices...</p>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOverBill(true); }}
                        onDragLeave={() => setIsDragOverBill(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOverBill(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleSupplierBillUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer bg-white group select-none ${
                          isDragOverBill ? 'border-indigo-500 bg-indigo-50/35' : 'border-slate-250 hover:border-indigo-400'
                        }`}
                        onClick={() => document.getElementById('modal-invoice-upload-trigger')?.click()}
                      >
                        <input 
                          type="file" 
                          id="modal-invoice-upload-trigger" 
                          className="hidden" 
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSupplierBillUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="p-2.5 bg-slate-100 text-slate-500 rounded-full group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <Download className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black text-slate-800 block">
                            {billFileName ? `Selected File: ${billFileName}` : "Upload PDF or Image bill receipt"}
                          </span>
                          <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold block mt-1">Accepts images & compliance documents</span>
                        </div>
                      </div>
                    )}

                    {extractedInvoiceDetails && (
                      <div className="bg-emerald-500/5 border border-emerald-200/50 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase block tracking-wider">✓ Automatic Matching Highlights</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                          <div>
                            <span className="text-[8px] text-slate-400 uppercase tracking-widest">Invoice Number</span>
                            <span className="block text-slate-800 font-mono">{extractedInvoiceDetails.invoiceDetails?.invoiceNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-400 uppercase tracking-widest">extracted Value</span>
                            <span className="block text-slate-800">₹{formatNum(extractedInvoiceDetails.invoiceDetails?.totalAmount || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* QUICK ACTIONS BUTTONS */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleFullReceiveClick}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer"
                >
                  Full Receive (All Items)
                </button>
                <button
                  type="button"
                  onClick={handleClearReceiveClick}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-700 rounded-lg text-[10.5px] font-black uppercase transition-all cursor-pointer"
                >
                  Clear Checklist
                </button>
              </div>

              {/* REAL PRODUCT LINES LIST CHECKLIST OR COMPLIANCE CHECKS */}
              <div className="space-y-3 pt-1">
                <span className="text-[9.5px] font-black text-slate-450 uppercase tracking-widest block">CHECK IN ITEM COMPLIANCE GRID</span>

                {receivingPo.items.map((item: any, idx: number) => {
                  const alreadyCounted = item.receivedQty || 0;
                  const remainingToRec = item.qty - alreadyCounted;
                  const inboxKey = `${idx}`;

                  return (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-900 text-xs block truncate max-w-xs">{item.productName}</span>
                        <p className="text-[10px] text-slate-450 font-bold uppercase leading-normal">
                          Ordered: <span className="font-mono text-slate-800">{item.qty} units</span> • Arrived Previously: <span className="font-mono text-slate-700">{alreadyCounted}</span>
                        </p>
                      </div>

                      {/* EDITORS */}
                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        
                        {/* COST EDITOR */}
                        <div className="text-right w-24">
                          <label className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={receivedCosts[inboxKey] ?? item.cost ?? 0}
                            onChange={(e) => {
                              const costNum = Math.max(0, Number(e.target.value));
                              setReceivedCosts(prev => ({ ...prev, [inboxKey]: costNum }));
                            }}
                            className="w-full text-center font-bold text-xs p-1 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>

                        {/* ARRIVED CHECKLIST INPUT */}
                        <div className="text-right w-24">
                          <label className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">Arrived Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={remainingToRec}
                            value={partialReceipts[inboxKey] ?? 0}
                            onChange={(e) => {
                              const n = Math.min(remainingToRec, Math.max(0, Number(e.target.value)));
                              setPartialReceipts(prev => ({ ...prev, [inboxKey]: n }));
                            }}
                            className="w-full text-center font-black text-xs p-1 bg-white border border-slate-200 rounded-lg text-indigo-750"
                          />
                        </div>

                        {/* MARK MISSING CHECKBOX */}
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            id={`mclose-${idx}`}
                            checked={closedLines[inboxKey] || false}
                            onChange={(e) => {
                              setClosedLines(prev => ({ ...prev, [inboxKey]: e.target.checked }));
                            }}
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <label htmlFor={`mclose-${idx}`} className="text-[9.5px] text-slate-500 font-extrabold uppercase select-none cursor-pointer">
                            Missed
                          </label>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {/* SUPPLIER DISCREPANCY AUDIT RULES */}
              <div className="p-4 bg-amber-500/5 border border-amber-200 rounded-2xl space-y-2.5">
                <span className="text-[9px] font-black text-amber-800 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Compliance Discrepancy Resolution Rule
                </span>
                <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                  Smart Vyapar detects missing stock during intake arrivals. What should be done for remaining items not received?
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSupplierDiscrepancyAction('keep_pending')}
                    className={`py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                      supplierDiscrepancyAction === 'keep_pending' 
                        ? 'bg-white border-amber-500 text-amber-850 shadow-3xs font-black' 
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Keep pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierDiscrepancyAction('cancel_remaining')}
                    className={`py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                      supplierDiscrepancyAction === 'cancel_remaining' 
                        ? 'bg-white border-amber-500 text-amber-850 shadow-3xs font-black' 
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cancel Short
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupplierDiscrepancyAction('supplier_follow_up')}
                    className={`py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                      supplierDiscrepancyAction === 'supplier_follow_up' 
                        ? 'bg-white border-amber-500 text-amber-850 shadow-3xs font-black' 
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Force Close
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceivingPo(null)}
                className="px-4 py-2 text-slate-650 hover:bg-slate-200 rounded-xl font-extrabold text-xs uppercase cursor-pointer"
              >
                Close Panel
              </button>
              <button
                type="button"
                onClick={submitPartialReceiving}
                disabled={isReceivingProgress}
                className="px-6 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-3xs"
              >
                {isReceivingProgress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inbound Logging...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirm Stock Intake</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
