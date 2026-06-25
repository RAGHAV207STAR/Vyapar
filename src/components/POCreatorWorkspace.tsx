import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useBilling } from '../context/BillingContext';
import { 
  Plus, Search, FileText, Check, Download, Share2, Mail, Save, ChevronDown, 
  Trash2, Package, Sparkles, Building2, Copy, Loader2, Info, ArrowLeft, ArrowRight, ArrowUpRight,
  Barcode, Printer, AlertTriangle, ToggleLeft, ToggleRight, Eye, RefreshCw, X,
  Camera, ShoppingCart, User, Truck, ClipboardList, Globe
} from 'lucide-react';
const BarcodeScannerModal = React.lazy(() => import('./BarcodeScannerModal'));
import { PurchaseOrderA4Preview } from './PurchaseOrderA4Preview';

interface POCreatorWorkspaceProps {
  inventory: any[];
  poDraftItems: any[];
  setPoDraftItems: React.Dispatch<React.SetStateAction<any[]>>;
  draftSupplier: string;
  setDraftSupplier: (val: string) => void;
  categoryFilterQuery: string;
  setCategoryFilterQuery: (val: string) => void;
  customSearchTerm: string;
  setCustomSearchTerm: (val: string) => void;
  customQtyInput: number | "";
  setCustomQtyInput: React.Dispatch<React.SetStateAction<number | "">>;
  customUnitInput: string;
  setCustomUnitInput: (val: string) => void;
  quickProductForm: any;
  setQuickProductForm: React.Dispatch<React.SetStateAction<any>>;
  isDuplicateReviewing: boolean;
  setIsDuplicateReviewing: (val: boolean) => void;
  reEditingPoId: string | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  purchaseNotes: string;
  setPurchaseNotes: (val: string) => void;
  deliveryInstructions: string;
  setDeliveryInstructions: (val: string) => void;
  supplierInstructions: string;
  setSupplierInstructions: (val: string) => void;
  isNotesExpanded: boolean;
  setIsNotesExpanded: (val: boolean) => void;
  activeDraftId: string | null;
  handleAddManualLine: (name: string, id: string | null, qty: number, price: number, cat: string, unit?: string) => void;
  handleSaveDraftManual: (shouldRedirect?: boolean) => void;
  generatePO_PDF: (dObj: any) => void;
  triggerWhatsAppDispatch: (dObj: any) => void;
  triggerEmailDispatch: (dObj: any) => void;
  handleFinalizeCustomDraftFile: (force: boolean, saveAsNew?: boolean) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  formatNum: (val: number) => string;
  smartAnalysis?: any; // Passed from parent
  onPrintPO?: () => void; // Optional print trigger
}

export default function POCreatorWorkspace({
  inventory = [],
  poDraftItems = [],
  setPoDraftItems,
  draftSupplier,
  setDraftSupplier,
  categoryFilterQuery,
  setCategoryFilterQuery,
  customSearchTerm,
  setCustomSearchTerm,
  customQtyInput,
  setCustomQtyInput,
  customUnitInput,
  setCustomUnitInput,
  quickProductForm,
  setQuickProductForm,
  isDuplicateReviewing,
  setIsDuplicateReviewing,
  reEditingPoId,
  autoSaveStatus,
  purchaseNotes,
  setPurchaseNotes,
  deliveryInstructions,
  setDeliveryInstructions,
  supplierInstructions,
  setSupplierInstructions,
  isNotesExpanded,
  setIsNotesExpanded,
  activeDraftId,
  handleAddManualLine,
  handleSaveDraftManual,
  generatePO_PDF,
  triggerWhatsAppDispatch,
  triggerEmailDispatch,
  handleFinalizeCustomDraftFile,
  showToast,
  formatNum,
  smartAnalysis,
  onPrintPO
}: POCreatorWorkspaceProps) {
  const { movements } = useInventory();
  const { profile } = useBilling();

  // Active step flow state: 1, 2, 3, 4
  const [activeStep, setActiveStep] = useState<number>(1);
  const [showInAppPreview, setShowInAppPreview] = useState<boolean>(false);


  // Guided step names
  const steps = [
    { title: 'Source', desc: 'Choose Source' },
    { title: 'Builder', desc: 'Product Builder' },
    { title: 'Supplier', desc: 'Supplier Details' }
  ];

  // Active step navigation helpers
  const handleNextStep = () => {
    if (activeStep === 1) {
      if (poDraftItems.length === 0 && orderSource !== 'smart') {
        showToast("Select source and prepare products below. Or load smart restocks.", "info");
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (poDraftItems.length === 0) {
        showToast("Please add at least one product before proceeding.", "warning");
        return;
      }
      setActiveStep(3);
    }
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(1, prev - 1));
  };

  // Step 1 selected order source state (default to 'smart')
  const [orderSource, setOrderSource] = useState<'smart' | 'inventory' | 'custom'>('smart');
  const [smartSubTab, setSmartSubTab] = useState<'out' | 'low' | 'fast'>('out');

  const [showNewSupplierModal, setShowNewSupplierModal] = useState<boolean>(false);
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', phone: '', address: '' });

  // States for step-specific items search inside Step 1 and 2
  const [localProductSearch, setLocalProductSearch] = useState<string>('');
  const [barcodeSearch, setBarcodeSearch] = useState<string>('');
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  // User modifiable values
  const [gstPercentValue, setGstPercentValue] = useState<number | string>('');
  const [shippingValue, setShippingValue] = useState<number | string>('');

  const [toggles, setToggles] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        if (activeDraftId) {
          const rawDrafts = localStorage.getItem('vmitra_po_drafts');
          if (rawDrafts) {
            const parsed = JSON.parse(rawDrafts);
            const found = parsed.find((d: any) => d.id === activeDraftId);
            if (found) {
              return {
                showItemCost: found.showItemCost !== undefined ? found.showItemCost : true,
                showTotalCost: found.showTotalCost !== undefined ? found.showTotalCost : true,
                showGst: found.showGst !== undefined ? found.showGst : true,
                showLogisticPrice: found.showLogisticPrice !== undefined ? found.showLogisticPrice : true
              };
            }
          }
        } else if (reEditingPoId) {
          const rawPending = localStorage.getItem('logistics_pending_pos');
          if (rawPending) {
            const parsed = JSON.parse(rawPending);
            const found = parsed.find((d: any) => d.id === reEditingPoId);
            if (found) {
              return {
                showItemCost: found.showItemCost !== undefined ? found.showItemCost : true,
                showTotalCost: found.showTotalCost !== undefined ? found.showTotalCost : true,
                showGst: found.showGst !== undefined ? found.showGst : true,
                showLogisticPrice: found.showLogisticPrice !== undefined ? found.showLogisticPrice : true
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed loading initial print config", e);
    }
    return {
      showItemCost: true,
      showTotalCost: true,
      showGst: true,
      showLogisticPrice: true
    };
  });

  // Barcode advanced scanner simulator states
  const [activeScannedId, setActiveScannedId] = useState<string | null>(null);
  const [scannerSoundEnabled, setScannerSoundEnabled] = useState<boolean>(true);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [isScanningLineId, setIsScanningLineId] = useState<string | null>(null);

  // Audio web synth feedback for simulated laser scan
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // Crisp scanner frequency
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // High pitch tidy pulse
    } catch (e) {
      console.log("Web audio beep suppressed:", e);
    }
  };

  // Dropdown for selecting from known suppliers in database
  const [showSupplierDropdown, setShowSupplierDropdown] = useState<boolean>(false);
  const existingSuppliersList = useMemo(() => {
    const list = new Set<string>();
    inventory.forEach(p => {
      if (p.supplierName && p.supplierName.trim()) {
        list.add(p.supplierName.trim());
      }
    });
    return Array.from(list);
  }, [inventory]);

  const filteredSuppliers = useMemo(() => {
    if (!draftSupplier) return existingSuppliersList;
    return existingSuppliersList.filter(s => s.toLowerCase().includes(draftSupplier.toLowerCase()));
  }, [draftSupplier, existingSuppliersList]);

  // Draft readiness score
  const getDraftReadiness = () => {
    let score = 0;
    const requirements: string[] = [];
    if (draftSupplier.trim()) score += 30; else requirements.push("Set Supplier");
    if (poDraftItems.length > 0) score += 40; else requirements.push("Add Products");
    const validQty = poDraftItems.length > 0 && poDraftItems.every(i => Number(i.qty || 0) > 0);
    if (validQty) score += 30; else if (poDraftItems.length > 0) requirements.push("Verify quantities are > 0");

    return {
      percentage: score,
      status: requirements.length > 0 ? `Needs: ${requirements.join(" • ")}` : "100% Ready to Generate"
    };
  };

  const readiness = getDraftReadiness();

  // Helper to build payload matching core PO object scheme for PDF & Sharing handlers
  const handleBuildPayload = () => {
    const sub = poDraftItems.reduce((acc, i) => acc + (Number(i.qty || 0) * Number(i.cost || 0)), 0);
    const taxPct = Number(gstPercentValue) || 0;
    const tax = Math.round(sub * (taxPct / 100));
    const shipping = Number(shippingValue) || 0;
    return {
      id: reEditingPoId || activeDraftId || `PO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      supplier: draftSupplier.trim() || 'General Supplier',
      items: poDraftItems,
      date: new Date().toISOString(),
      subTotal: sub,
      gstPercent: taxPct,
      gstAmount: tax,
      cgstAmount: Math.round(tax / 2),
      sgstAmount: Math.round(tax / 2),
      otherCharges: shipping,
      totalAmount: sub + tax + shipping,
      purchaseNotes,
      deliveryInstructions,
      supplierInstructions,
      notes: purchaseNotes || 'Guided workflow purchase order.',
      status: 'Draft',
      showItemCost: toggles.showItemCost,
      showTotalCost: toggles.showTotalCost,
      showGst: toggles.showGst,
      showLogisticPrice: toggles.showLogisticPrice
    };
  };

  // Groups of smart replenishment recommendations
  const smartRestockGroups = useMemo(() => {
    // 1. Out of Stock
    const outOfStock = inventory
      .filter(p => {
        const stockVal = Number(p.stock ?? 0);
        return stockVal <= 0;
      })
      .map(p => ({
        product: p,
        suggestedQty: Math.max((p.minStockAlert || 5) * 3, 20),
        unitCost: p.purchasePrice || 0,
        preferredSupplier: p.supplierName || 'General Supplier',
        reason: 'Out of Stock - Urgent fulfill required'
      }));

    // 2. Low Stock
    const lowStock = inventory
      .filter(p => {
        const stockVal = Number(p.stock ?? 0);
        const alertLimit = Number(p.minStockAlert !== undefined && p.minStockAlert !== null ? p.minStockAlert : 5);
        return stockVal > 0 && stockVal <= alertLimit;
      })
      .map(p => {
        const stockVal = Number(p.stock ?? 0);
        return {
          product: p,
          suggestedQty: Math.max((p.minStockAlert || 5) * 2 - stockVal, 15),
          unitCost: p.purchasePrice || 0,
          preferredSupplier: p.supplierName || 'General Supplier',
          reason: `Low Stock (${stockVal} left)`
        };
      });

    // 3. Fast Selling (High Demand)
    const productSalesMap = new Map<string, number>();
    movements?.forEach(m => {
      if (m.type === 'OUT' && m.productId) {
        productSalesMap.set(m.productId, (productSalesMap.get(m.productId) || 0) + (m.quantity || 0));
      }
    });

    const fastSelling = inventory
      .filter(p => {
        const salesVolume = productSalesMap.get(p.id) || 0;
        return salesVolume > 0 || String(p.id).charCodeAt(0) % 3 === 0;
      })
      .map(p => {
        const salesVolume = productSalesMap.get(p.id) || 0;
        const volumeText = salesVolume > 0 ? `${salesVolume} sold recently` : 'High velocity item';
        return {
          product: p,
          suggestedQty: Math.max((p.minStockAlert || 5) * 2, 25),
          unitCost: p.purchasePrice || 0,
          preferredSupplier: p.supplierName || 'General Supplier',
          reason: `Fast Selling (${volumeText})`
        };
      });

    return { outOfStock, lowStock, fastSelling };
  }, [inventory, movements]);

  // Smart recommendations filter based on the source tab
  const activeSmartRecommendations = useMemo(() => {
    if (smartSubTab === 'out') return smartRestockGroups.outOfStock;
    if (smartSubTab === 'low') return smartRestockGroups.lowStock;
    return smartRestockGroups.fastSelling;
  }, [smartSubTab, smartRestockGroups]);

  // Bulk add smart recommendations
  const handleBulkAddRecommendations = () => {
    if (activeSmartRecommendations.length === 0) {
      showToast("No critical replenishment recommendations available.", "info");
      return;
    }
    let addedCount = 0;
    activeSmartRecommendations.forEach((r: any) => {
      const exists = poDraftItems.find(i => i.productId === r.product.id);
      if (!exists) {
        handleAddManualLine(
          r.product.name, 
          r.product.id, 
          r.suggestedQty || 10, 
          r.unitCost || r.product.purchasePrice || 0, 
          r.product.category || 'General', 
          r.product.unit || 'units'
        );
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`Automatically imported ${addedCount} urgent low-stock items into Product Builder!`, "success");
      setActiveStep(2);
    } else {
      showToast("All recommended catalog items are already in your checklist.", "info");
      setActiveStep(2);
    }
  };

  // Simple inventory lookup for Step 2
  const filteredInventoryForBuilder = useMemo(() => {
    let result = inventory;
    if (localProductSearch) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(localProductSearch.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(localProductSearch.toLowerCase()))
      );
    }
    if (categoryFilterQuery && categoryFilterQuery !== 'ALL') {
      result = result.filter(p => p.category === categoryFilterQuery);
    }
    return result;
  }, [inventory, localProductSearch, categoryFilterQuery]);

  // Handle barcode scanning simulation
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!barcodeSearch.trim()) return;
    const term = barcodeSearch.trim();
    const found = inventory.find(p => 
      (p.sku && p.sku.toLowerCase() === term.toLowerCase()) || 
      (p.id && String(p.id).toLowerCase() === term.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase() === term.toLowerCase())
    );
    if (found) {
      if (scannerSoundEnabled) playBeepSound();
      handleAddManualLine(found.name, found.id, 10, found.purchasePrice || 0, found.category || 'General', found.unit || 'units');
      
      const newScanObj = {
        id: found.id,
        name: found.name,
        barcode: found.barcode || found.sku || `890103${String(found.id).substring(0,6).toUpperCase()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: found.purchasePrice || 0
      };
      setRecentScans(prev => [newScanObj, ...prev.slice(0, 5)]);
      setBarcodeSearch('');
    } else {
      showToast(`SKU/Barcode "${barcodeSearch}" not found. Enter custom details.`, "warning");
    }
  };

  const handleCameraScan = (decodedText: string) => {
    setShowScannerModal(false);
    if (!decodedText.trim()) return;
    const term = decodedText.trim();
    const found = inventory.find(p => 
      (p.sku && p.sku.toLowerCase() === term.toLowerCase()) || 
      (p.id && String(p.id).toLowerCase() === term.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase() === term.toLowerCase())
    );
    if (found) {
      if (scannerSoundEnabled) playBeepSound();
      handleAddManualLine(found.name, found.id, 10, found.purchasePrice || 0, found.category || 'General', found.unit || 'units');
      
      const newScanObj = {
        id: found.id,
        name: found.name,
        barcode: found.barcode || found.sku || `890103${String(found.id).substring(0,6).toUpperCase()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: found.purchasePrice || 0
      };
      setRecentScans(prev => [newScanObj, ...prev.slice(0, 5)]);
    } else {
      showToast(`Scanned Code "${term}" not found in inventory catalog.`, "warning");
    }
  };

  const handleDirectInstantScan = (prod: any) => {
    const fakeBarcode = prod.barcode || `890103${String(prod.id).substring(0, 6).toUpperCase()}`;
    setIsScanningLineId(prod.id);
    if (scannerSoundEnabled) {
      playBeepSound();
    }
    setTimeout(() => {
      handleAddManualLine(prod.name, prod.id, 10, prod.purchasePrice || 0, prod.category || 'General', prod.unit || 'units');
      
      const newScanObj = {
        id: prod.id,
        name: prod.name,
        barcode: fakeBarcode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: prod.purchasePrice || 0
      };
      setRecentScans(prev => [newScanObj, ...prev.slice(0, 5)]);
      setIsScanningLineId(null);
    }, 450);
  };

  // Format draft totals
  const subTotal = poDraftItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.cost || 0)), 0);
  const taxPct = Number(gstPercentValue) || 0;
  const estimatedGST = Math.round(subTotal * (taxPct / 100));
  const estTotal = subTotal + estimatedGST + (Number(shippingValue) || 0);

  if (showInAppPreview) {
    return (
      <div className="space-y-6 w-full font-sans animate-fade-in text-left pb-16">
        {/* Top Header / Back Bar */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-8">
          <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowInAppPreview(false)}
                className="group flex items-center justify-center w-12 h-12 rounded-xl border border-indigo-400/20 bg-indigo-500/10 hover:bg-white text-indigo-300 hover:text-slate-900 shadow-lg cursor-pointer transition-all duration-300"
                title="Go Back"
              >
                <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
              </button>
              <div>
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider block bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Draft Proposal
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• {reEditingPoId || activeDraftId || "PO-CREATE-PREVIEW"}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Document Studio Room
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => generatePO_PDF(handleBuildPayload())}
                className="px-4 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 border border-emerald-400/20"
              >
                <Download className="w-4 h-4" /> Download PDF File
              </button>

              {reEditingPoId ? (
                <>
                  <button
                    onClick={() => {
                      handleFinalizeCustomDraftFile(false, true); // saveAsNew = true
                      setShowInAppPreview(false);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Save as New PO
                  </button>
                  <button
                    onClick={() => {
                      handleFinalizeCustomDraftFile(false, false); // saveAsNew = false
                      setShowInAppPreview(false);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Replace with this
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleFinalizeCustomDraftFile(false);
                    setShowInAppPreview(false);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                >
                  <Check className="w-4 h-4" /> Save in Receiving
                </button>
              )}

              <button
                onClick={() => setShowInAppPreview(false)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-black uppercase transition-all cursor-pointer active:scale-95"
              >
                Exit Studio
              </button>
            </div>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Metadata Sidebar Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[20px] pointer-events-none" />
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Document Details</h3>
              <div className="space-y-4 text-sm text-left">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Supplier Partner</span>
                  <span className="font-extrabold text-slate-200 text-base block text-left">{draftSupplier || 'General Vendor'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Est Net Cost</span>
                  <span className="font-black text-white text-xl block text-left">₹{formatNum(estTotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Line Item Count</span>
                  <span className="font-extrabold text-indigo-300 block text-left">{poDraftItems.length} unique lines</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Total Qty Order Size</span>
                  <span className="font-extrabold text-emerald-400 block text-left">
                    {poDraftItems.reduce((sum, item) => sum + Number(item.qty || 0), 0)} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Created / Last Edited</span>
                  <span className="font-mono text-xs text-slate-400 block text-left">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Sheet Render Area */}
          <div className="lg:col-span-3 bg-slate-50 border border-slate-200/80 rounded-[2rem] p-4 sm:p-8 flex items-start justify-center overflow-x-auto min-h-[700px] shadow-inner relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-t-[2rem]" />
            <PurchaseOrderA4Preview 
              po={{
                id: reEditingPoId || activeDraftId || "PO-CREATE-PREVIEW",
                date: Date.now(),
                supplier: draftSupplier,
                deliveryInstructions: profile?.address,
                items: poDraftItems,
                purchaseNotes: purchaseNotes,
                supplierInstructions: '',
                subTotal: subTotal,
                gstPercent: taxPct,
                gstAmount: estimatedGST,
                otherCharges: shippingValue,
                totalAmount: estTotal,
              }}
              profile={profile}
              inventory={inventory}
              formatNum={formatNum}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vmitra-po-creator" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
      
      {/* LEFT & CENTER COLUMN: STEPS WORKSPACE */}
      <div className={`${activeStep === 3 ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
        
        {/* STEPPER INDICATOR */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            {steps.map((s, idx) => {
              const stepNum = idx + 1;
              const isActive = activeStep === stepNum;
              const isCompleted = activeStep > stepNum;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    // Allowed jumping back easily, or forward if requirements allow
                    if (stepNum < activeStep || (stepNum <= 3 && poDraftItems.length > 0) || (stepNum === 4 && poDraftItems.length > 0 && draftSupplier)) {
                      setActiveStep(stepNum);
                    }
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 group focus:outline-none transition-all flex-1 justify-center last:flex-none cursor-pointer"
                >
                  <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-150 ring-4 ring-indigo-50 border border-indigo-600' 
                      : isCompleted 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-slate-50 text-slate-400 border border-slate-200/60 hover:bg-slate-100 hover:border-slate-350'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : stepNum}
                  </div>
                  <div className="text-left">
                    <span className={`block text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold transition-colors leading-tight ${isActive ? 'text-indigo-650 font-black' : 'text-slate-500 group-hover:text-slate-700 font-bold'}`}>{s.title}</span>
                    <span className="hidden xs:block text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-tight leading-none mt-0.5">{s.desc}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`hidden sm:block h-[1.5px] flex-1 mx-2 lg:mx-4 rounded-full ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-indigo-200' : 'bg-slate-100'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: CHOOSE ORDER SOURCE */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Redesigned Standalone Title/Hero for Step 1 */}
            <div className="relative overflow-hidden bg-slate-50 border border-slate-200/60 p-4 sm:p-5 md:p-6 rounded-2xl shadow-3xs text-left">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9.5px] font-extrabold uppercase tracking-wider">
                    Step 1 of 3 • Procurement Setup
                  </div>
                  <h3 className="font-black text-lg sm:text-xl md:text-2xl text-slate-900 tracking-tight uppercase leading-tight">Order Source</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold max-w-xl">
                    Select a source to populate purchase items.
                  </p>
                </div>
              </div>
            </div>

            {/* THREE LARGE CARDS IN A SINGLE HORIZONTAL ROW */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              
              {/* CARD A: Smart Restock */}
              <button
                type="button"
                onClick={() => setOrderSource('smart')}
                className={`py-2 px-1.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer relative group ${
                  orderSource === 'smart' 
                    ? 'border-indigo-600 bg-gradient-to-b from-indigo-50/50 to-indigo-100/20 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02]' 
                    : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 sm:mb-2 transition-all duration-300 ${
                    orderSource === 'smart' 
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                      : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105'
                  }`}>
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <span className={`tracking-tight text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight transition-all ${
                    orderSource === 'smart' ? 'text-indigo-950 font-black' : 'text-slate-600 group-hover:text-indigo-950 font-extrabold'
                  }`}>
                    Smart Restock
                  </span>
                  <p className="hidden md:block text-[9.5px] lg:text-[10.5px] text-slate-400 mt-1 font-semibold">AI Recommended Alerts</p>
                </div>
                {activeSmartRecommendations.length > 0 && (
                  <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[8px] sm:text-[10px] bg-rose-600 text-white border-2 border-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-md animate-pulse">
                    {activeSmartRecommendations.length}
                  </span>
                )}
              </button>

              {/* CARD B: Inventory Items */}
              <button
                type="button"
                onClick={() => setOrderSource('inventory')}
                className={`py-2 px-1.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer relative group ${
                  orderSource === 'inventory' 
                    ? 'border-indigo-600 bg-gradient-to-b from-indigo-50/50 to-indigo-100/20 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02]' 
                    : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 sm:mb-2 transition-all duration-300 ${
                    orderSource === 'inventory' 
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                      : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105'
                  }`}>
                    <Package className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <span className={`tracking-tight text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight transition-all ${
                    orderSource === 'inventory' ? 'text-indigo-950 font-black' : 'text-slate-600 group-hover:text-slate-950 font-extrabold'
                  }`}>
                    Inventory Items
                  </span>
                  <p className="hidden md:block text-[9.5px] lg:text-[10.5px] text-slate-400 mt-1 font-semibold">Your Cached Catalog</p>
                </div>
                <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[8px] sm:text-[9.5px] bg-slate-100 text-slate-600 border border-slate-200 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full font-black shadow-md">
                  {inventory.length}
                </span>
              </button>

              {/* CARD C: Custom Item */}
              <button
                type="button"
                onClick={() => setOrderSource('custom')}
                className={`py-2 px-1.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer relative group ${
                  orderSource === 'custom' 
                    ? 'border-indigo-600 bg-gradient-to-b from-indigo-50/50 to-indigo-100/20 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02]' 
                    : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 sm:mb-2 transition-all duration-300 ${
                    orderSource === 'custom' 
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200 scale-110' 
                      : 'bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-105'
                  }`}>
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                  </div>
                  <span className={`tracking-tight text-[10px] sm:text-xs md:text-sm lg:text-base leading-tight transition-all ${
                    orderSource === 'custom' ? 'text-indigo-950 font-black' : 'text-slate-600 group-hover:text-slate-950 font-extrabold'
                  }`}>
                    Custom Item
                  </span>
                  <p className="hidden md:block text-[9.5px] lg:text-[10.5px] text-slate-400 mt-1 font-semibold">One-off Ad-hoc SKU</p>
                </div>
              </button>

            </div>

            {/* SELECTION INTERACTIVE PRE-BUILDER ACTIONS */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-3xs text-left">
              
              {orderSource === 'smart' && (
                <div className="space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-150 pb-3 p-2 bg-gradient-to-r from-slate-50 to-indigo-50/15 rounded-xl">
                    <div className="pl-1">
                      <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> Smart Recommendations
                      </h4>
                      <p className="text-[10.5px] text-slate-500 font-bold leading-normal mt-0.5">
                        AI-suggested quantities based on current stock levels, safety buffer thresholds, and velocity indices.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBulkAddRecommendations}
                      disabled={activeSmartRecommendations.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white font-black text-xs px-5 py-2.5 rounded-xl text-center shadow-md cursor-pointer flex items-center gap-1.5 whitespace-nowrap self-end sm:self-auto transition-all border border-transparent"
                    >
                      <Plus className="w-3.5 h-3.5" /> Auto-Load All {activeSmartRecommendations.length} Items
                    </button>
                  </div>

                  {/* Smart Sub-Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSmartSubTab('out')}
                      className={`py-2 px-1.5 rounded-lg text-center font-extrabold text-[10.5px] uppercase cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                        smartSubTab === 'out'
                          ? 'bg-rose-600 text-white shadow-3xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-400 group-hover:animate-pulse" />
                      Out of Stock ({smartRestockGroups.outOfStock.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmartSubTab('low')}
                      className={`py-2 px-1.5 rounded-lg text-center font-extrabold text-[10.5px] uppercase cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                        smartSubTab === 'low'
                          ? 'bg-amber-500 text-white shadow-3xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-300" />
                      Low Stock ({smartRestockGroups.lowStock.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmartSubTab('fast')}
                      className={`py-2 px-1.5 rounded-lg text-center font-extrabold text-[10.5px] uppercase cursor-pointer transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                        smartSubTab === 'fast'
                          ? 'bg-indigo-600 text-white shadow-3xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-300" />
                      Fast Selling ({smartRestockGroups.fastSelling.length})
                    </button>
                  </div>

                  {activeSmartRecommendations.length > 0 ? (
                    <div className="pt-2 max-h-64 overflow-y-auto space-y-2 pr-1">
                      {activeSmartRecommendations.map((rec: any, idx: number) => {
                        const inPO = poDraftItems.find(it => it.productId === rec.product.id);
                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 bg-slate-50/40 rounded-xl border border-slate-150 hover:border-slate-250 hover:bg-slate-50/70 transition-all">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">{rec.product.name}</span>
                                {smartSubTab === 'out' && <span className="text-[8px] sm:text-[9px] bg-rose-50 border border-rose-150 text-rose-700 font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0">OUT OF STOCK</span>}
                                {smartSubTab === 'low' && <span className="text-[8px] sm:text-[9px] bg-amber-50 border border-amber-150 text-amber-700 font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0">LOW STOCK</span>}
                                {smartSubTab === 'fast' && <span className="text-[8px] sm:text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black uppercase px-1.5 py-0.5 rounded leading-none shrink-0">FAST SELLER</span>}
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold block mt-1">
                                Current Stock: <span className="font-mono font-extrabold text-slate-705 bg-slate-100 px-1 py-0.5 rounded">{rec.product.stock} {rec.product.unit || 'units'}</span> • <span className="text-slate-450 italic">{rec.reason}</span>
                              </span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="font-black text-indigo-700 text-xs bg-indigo-50/70 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                                Suggested: {rec.suggestedQty}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleAddManualLine(rec.product.name, rec.product.id, rec.suggestedQty, rec.unitCost, rec.product.category, rec.product.unit);
                                }}
                                className={`text-[10.5px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  inPO 
                                    ? 'bg-emerald-50 border-emerald-150 text-emerald-700 cursor-default' 
                                    : 'bg-white hover:bg-slate-900 text-slate-700 hover:text-white border-slate-200 hover:border-slate-900 shadow-3xs'
                                }`}
                              >
                                {inPO ? '✓ Added' : '+ Add Item'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center bg-gradient-to-b from-slate-50 to-indigo-50/10 rounded-2xl border-2 border-indigo-150 border-dashed space-y-2 max-w-lg mx-auto shadow-3xs">
                      <Sparkles className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                      <span className="font-extrabold text-xs text-slate-800 block uppercase tracking-wider">No Recommendations Currently</span>
                      <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                        Excellent! Your product inventory catalog is fully healthy! There are currently no items meeting this stock category condition.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {orderSource === 'inventory' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-600" /> Catalog Search
                      </h4>
                      <p className="text-[10.5px] text-slate-500 font-semibold leading-normal">
                        Select catalog items to populate the draft purchase order list.
                      </p>
                    </div>

                    {/* Compact Filter */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={categoryFilterQuery}
                        onChange={(e) => setCategoryFilterQuery(e.target.value)}
                        className="text-[10.5px] font-black border border-slate-200 rounded-lg p-1.5 text-slate-700 bg-white"
                      >
                        <option value="ALL">All Categories</option>
                        {Array.from(new Set(inventory.map(i => i.category || 'General'))).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={localProductSearch}
                        onChange={(e) => setLocalProductSearch(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 max-w-40 bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                    {filteredInventoryForBuilder.slice(0, 16).map(prod => {
                      const inPO = poDraftItems.find(it => it.productId === prod.id);
                      return (
                        <div key={prod.id} className="p-2.5 rounded-xl border border-slate-150 hover:border-slate-350 bg-white flex justify-between items-center transition-all text-xs">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 block truncate">{prod.name}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Stock level: {prod.stock} {prod.unit || 'units'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddManualLine(prod.name, prod.id, 10, prod.purchasePrice || 0, prod.category || 'General', prod.unit || 'units');
                            }}
                            className={`px-3 py-1.5 rounded-lg text-center font-black text-[10px] uppercase transition-all ${
                              inPO 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default' 
                                : 'bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white cursor-pointer'
                            }`}
                          >
                            {inPO ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {orderSource === 'custom' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Plus className="w-4 h-4 text-amber-500 animate-pulse" /> Add Custom Item
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <label className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Product Name *</label>
                      <input
                        type="text"
                        placeholder="E.g. Premium Linen Wool"
                        value={customSearchTerm}
                        onChange={(e) => setCustomSearchTerm(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Est. Cost (₹)</label>
                      <input
                        type="number"
                        placeholder="₹ 200"
                        value={customQtyInput} // reused state internally in parent
                        onChange={(e) => setCustomQtyInput(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Unit type</label>
                      <select
                        value={customUnitInput}
                        onChange={(e) => setCustomUnitInput(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-bold cursor-pointer"
                      >
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="units">Units (units)</option>
                        <option value="box">Box (box)</option>
                        <option value="pack">Pack (pack)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="g">Grams (g)</option>
                        <option value="ltr">Liters (ltr)</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="mtr">Meters (mtr)</option>
                        <option value="set">Set (set)</option>
                        <option value="dozen">Dozen (dozen)</option>
                        <option value="carton">Carton (carton)</option>
                        <option value="rolls">Rolls (rolls)</option>
                        <option value="sqft">Sq. Feet (sqft)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!customSearchTerm.trim()) {
                        showToast("Please enter product name.", "warning");
                        return;
                      }
                      const estCostValue = customQtyInput === "" ? 0 : Number(customQtyInput);
                      handleAddManualLine(customSearchTerm, null, 10, estCostValue, 'Custom', customUnitInput || 'units');
                      setCustomSearchTerm('');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-xl tracking-wider cursor-pointer"
                  >
                    + Add Custom Line Item
                  </button>
                </div>
              )}

            </div>

            {/* UNIVERSAL SKU AND BARCODE SCAN BAR WITH DIRECT CAMERA TRIGGER - ONLY VISIBLE BELOW INVENTORY ITEMS */}
            {orderSource === 'inventory' && (
              <div className="bg-white rounded-2xl p-5 border border-slate-205 shadow-3xs space-y-4 text-left animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                      <Barcode className="w-5 h-5 text-indigo-600" /> Universal SKU & Barcode Scanner
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-bold leading-normal">
                      Enter any item SKU or scan physical product barcodes to instantly add them to your current purchase order.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter SKU, EAN/UPC identifier, or scan barcode..."
                      value={barcodeSearch}
                      onChange={(e) => setBarcodeSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeSubmit();
                        }
                      }}
                      className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:font-sans placeholder:font-bold placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => handleBarcodeSubmit()}
                      className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl border border-indigo-600 transition-colors shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowScannerModal(true);
                        showToast("Camera scanner active. Please hold barcode in front of camera.", "info");
                      }}
                      className="flex-1 sm:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs uppercase px-5 py-3 rounded-xl border border-indigo-100 transition-colors shadow-3xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Open Camera Scan
                    </button>
                  </div>
                </div>

                {/* QUICK RECENT SCANS LIST IF APPLICABLE */}
                {recentScans.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Recently Scanned:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recentScans.slice(0, 3).map((scan, sIdx) => (
                        <span key={sIdx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-bold text-slate-700">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" /> {scan.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADDED PRODUCTS OVERVIEW LIST SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-3xs text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <FileText className="w-5 h-5 text-indigo-600" /> Added Products Checklist ({poDraftItems.length})
                  </h4>
                </div>
                {poDraftItems.length > 0 && (
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase px-2.5 py-1 rounded-full">
                    Total Draft: ₹{formatNum(poDraftItems.reduce((acc, i) => acc + (Number(i.qty || 0) * Number(i.cost || 0)), 0))}
                  </span>
                )}
              </div>

              {poDraftItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-150 border-dashed space-y-2">
                  <Package className="w-10 h-10 text-slate-350 mx-auto" />
                  <span className="font-bold text-xs text-slate-400 block">No items added to current PO yet.</span>
                  <p className="text-[10.5px] text-slate-500 font-semibold">Use Smart alerts, inventory fast search, custom item form, or SKU barcode scanner above to add items.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-150 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="pb-3 text-left">Item Name</th>
                        <th className="pb-3 text-center">Category</th>
                        <th className="pb-3 text-center">Order Qty</th>
                        <th className="pb-3 text-right">Est. Cost (₹)</th>
                        <th className="pb-3 text-right">Draft Subtotal</th>
                        <th className="pb-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-bold text-xs">
                      {poDraftItems.map((item, idx) => {
                        const productRecord = inventory.find(i => i.id === item.productId);
                        const estQty = productRecord ? Math.max((productRecord.minStockAlert || 5) * 2, 10) : 10;
                        const estPrice = productRecord ? (productRecord.purchasePrice || 0) : 0;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 max-w-xs">
                              <span className="font-extrabold text-slate-850 block truncate">{item.productName}</span>
                              <span className="text-[9px] text-slate-350 font-extrabold uppercase tracking-wide mt-0.5">
                                Measure: {item.unit || 'units'}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-650 text-[10px] font-black uppercase">
                                {item.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`Est. ${estQty}`}
                                  value={item.qty === "" ? "" : item.qty}
                                  onChange={(e) => {
                                    const valRaw = e.target.value;
                                    const val = valRaw === "" ? "" : Number(valRaw);
                                    setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: (val === "" ? 0 : val) * (it.cost === "" ? 0 : Number(it.cost)) } : it));
                                  }}
                                  className="w-20 text-center font-extrabold text-[12px] border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-1 bg-white shadow-3xs transition-all focus:outline-none placeholder:text-slate-350"
                                />
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1 text-[11px]">
                                <span className="text-slate-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  placeholder={estPrice ? `Est. ${estPrice}` : "0"}
                                  value={item.cost === "" ? "" : item.cost}
                                  onChange={(e) => {
                                    const valRaw = e.target.value;
                                    const val = valRaw === "" ? "" : Number(valRaw);
                                    setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, cost: val, total: (it.qty === "" ? 0 : Number(it.qty)) * (val === "" ? 0 : val) } : it));
                                  }}
                                  className="w-24 text-right font-extrabold text-[12px] border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1 bg-white shadow-3xs transition-all focus:outline-none placeholder:text-slate-350"
                                />
                              </div>
                            </td>
                            <td className="py-3 text-right font-black text-slate-800">
                              ₹{formatNum(Number(item.qty || 0) * Number(item.cost || 0))}
                            </td>
                            <td className="py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setPoDraftItems(prev => prev.filter((_, i) => i !== idx));
                                  showToast("Item excluded from builder list.", "info");
                                }}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Exclude row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-3xs"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PRODUCT BUILDER */}
        {activeStep === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-3xs p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Step 2 of 3</span>
                <h3 className="font-extrabold text-lg text-slate-800 leading-tight">Product Builder</h3>
                <p className="text-xs text-slate-500 font-semibold">Fine-tune quantities, rates and costs for the draft items.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs uppercase cursor-pointer"
                >
                  Change Source
                </button>
              </div>
            </div>

            {/* PRODUCT BUILDER MAIN WORKSPACE - TABLE (DESKTOP) / CARDS (MOBILE) */}
            {poDraftItems.length === 0 ? (
              <div className="py-14 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                  <Package className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-700">No products inside builder workspace</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mt-1">
                    Your purchase checklist is currently empty. Head back to Step 1 Order Source to load replenishment recommendations or custom items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-black text-[11px] uppercase cursor-pointer"
                >
                  Select Order Source
                </button>
              </div>
            ) : (
              <div>
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-y-auto max-h-[290px] border border-slate-150 rounded-2xl bg-white shadow-3xs scrollbar-thin relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50/95 z-20 shadow-[inset_0_-1px_0_rgba(148,163,184,0.15)] backdrop-blur-xs">
                      <tr className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-3 text-center">Current Stock</th>
                        <th className="py-3 px-3 text-center">Suggested Qty</th>
                        <th className="py-3 px-3 text-center">Order Qty</th>
                        <th className="py-3 px-3 text-right">Unit Cost (₹)</th>
                        <th className="py-3 px-3 text-right">Estimated Total</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-bold text-xs">
                      {poDraftItems.map((item, idx) => {
                        const productRecord = inventory.find(i => i.id === item.productId);
                        const currStock = productRecord ? productRecord.stock : 0;
                        const minAlert = productRecord ? (productRecord.minStockAlert || 5) : 5;
                        const isStockLow = currStock <= minAlert;
                        const estQty = productRecord ? Math.max(minAlert * 2, 10) : 10;
                        const estPrice = productRecord ? (productRecord.purchasePrice || 0) : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="font-extrabold text-slate-850 block truncate">{item.productName}</span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5">
                                Category: {item.category || 'General'} • Measure: {item.unit || 'units'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-black ${
                                isStockLow ? 'bg-amber-50 text-amber-800 border border-amber-200/50' : 'bg-slate-100 text-slate-650'
                              }`}>
                                {currStock}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center text-[11px] text-indigo-700">
                              {productRecord ? Math.max(minAlert * 2, 10) : '—'}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center">
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`Est. ${estQty}`}
                                  value={item.qty === "" ? "" : item.qty}
                                  onChange={(e) => {
                                    const valRaw = e.target.value;
                                    const val = valRaw === "" ? "" : Number(valRaw);
                                    setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: (val === "" ? 0 : val) * (it.cost === "" ? 0 : Number(it.cost)) } : it));
                                  }}
                                  className="w-20 text-center font-extrabold text-[12px] border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-1 bg-white shadow-3xs transition-all focus:outline-none placeholder:text-slate-350"
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-slate-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  placeholder={estPrice ? `Est. ${estPrice}` : "0"}
                                  value={item.cost === "" ? "" : item.cost}
                                  onChange={(e) => {
                                    const valRaw = e.target.value;
                                    const val = valRaw === "" ? "" : Number(valRaw);
                                    setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, cost: val, total: (it.qty === "" ? 0 : Number(it.qty)) * (val === "" ? 0 : val) } : it));
                                  }}
                                  className="w-24 text-right font-extrabold text-[12px] border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1 bg-white shadow-3xs transition-all focus:outline-none placeholder:text-slate-350"
                                />
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-black text-slate-850">
                              ₹{formatNum(Number(item.qty || 0) * Number(item.cost || 0))}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setPoDraftItems(prev => prev.filter((_, i) => i !== idx));
                                  showToast("Item excluded from builder list.", "info");
                                }}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Exclude row"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE / TABLET CARDS VIEW */}
                <div className="block md:hidden space-y-3 overflow-y-auto max-h-[385px] pr-1.5 scrollbar-thin">
                  {poDraftItems.map((item, idx) => {
                    const productRecord = inventory.find(i => i.id === item.productId);
                    const currStock = productRecord ? productRecord.stock : 0;
                    const minAlert = productRecord ? (productRecord.minStockAlert || 5) : 5;
                    const estQty = productRecord ? Math.max(minAlert * 2, 10) : 10;
                    const estPrice = productRecord ? (productRecord.purchasePrice || 0) : 0;
                    return (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-3xs space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 text-xs block truncate">{item.productName}</span>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 block tracking-wide">
                              Category: {item.category || 'General'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPoDraftItems(prev => prev.filter((_, i) => i !== idx));
                              showToast("Item excluded from builder list.", "info");
                            }}
                            className="p-1 px-2 text-rose-600 hover:bg-rose-55 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold justify-between">
                          <div className="text-left">
                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Current Stock</span>
                            <span className="text-xs font-bold text-slate-600 block mt-0.5">{currStock} units</span>
                          </div>
                          
                          <div className="text-left">
                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Estimated Cost</span>
                            <span className="text-xs font-bold text-slate-800 block mt-0.5">₹{formatNum(item.cost)}</span>
                          </div>

                          <div className="text-left">
                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider">Estimated Total</span>
                            <span className="text-xs font-black text-indigo-700 block mt-0.5">₹{formatNum(item.qty * item.cost)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider mb-1">Quantity</span>
                            <input
                              type="number"
                              min="1"
                              placeholder={`Est. ${estQty}`}
                              value={item.qty === "" ? "" : item.qty}
                              onChange={(e) => {
                                const valRaw = e.target.value;
                                const val = valRaw === "" ? "" : Number(valRaw);
                                setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: (val === "" ? 0 : val) * (it.cost === "" ? 0 : Number(it.cost)) } : it));
                              }}
                              className="w-full text-xs font-extrabold text-center p-1.5 rounded-lg border border-slate-200 h-8 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                          </div>

                          <div>
                            <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider mb-1">Unit rate Cost (₹)</span>
                            <input
                              type="number"
                              placeholder={estPrice ? `Est. ${estPrice}` : "0"}
                              value={item.cost === "" ? "" : item.cost}
                              onChange={(e) => {
                                const valRaw = e.target.value;
                                const val = valRaw === "" ? "" : Number(valRaw);
                                setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, cost: val, total: (it.qty === "" ? 0 : Number(it.qty)) * (val === "" ? 0 : val) } : it));
                              }}
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-200 font-extrabold h-8 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-right"
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              <button
                type="button"
                onClick={handleNextStep}
                disabled={poDraftItems.length === 0}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUPPLIER DETAILS */}
        {activeStep === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-3xs p-6 space-y-6 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">Step 3 of 3</span>
              <h3 className="font-extrabold text-lg text-slate-800 leading-tight">Supplier Details</h3>
              <p className="text-xs text-slate-500 font-semibold font-sans">Set shipping destination, supplier notes, and custom options.</p>
            </div>

            {/* SUPPLIER SELECTOR */}
            <div className="space-y-2 text-left relative z-10">
              <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest leading-none">Preferred Supplier Account *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Type to search or select a supplier..."
                    value={draftSupplier}
                    onChange={(e) => {
                      setDraftSupplier(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full pl-10 pr-16 py-3.5 bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 shadow-sm transition-all cursor-pointer"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {draftSupplier && (
                      <button
                        type="button"
                        onClick={() => { setDraftSupplier(''); setShowSupplierDropdown(false); }}
                        className="text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 p-1.5 rounded-lg border border-slate-100 hover:border-rose-100 transition-colors shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                      className={`p-1.5 rounded-lg border transition-all shadow-2xs ${showSupplierDropdown ? 'bg-indigo-50 text-indigo-600 border-indigo-200 rotate-180' : 'bg-white text-slate-400 hover:text-indigo-500 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50'}`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* SUPPLIER SUGGESTION POPUP */}
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="absolute z-[99] left-0 right-0 top-full mt-1.5 bg-white border border-slate-250 shadow-lg rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-50 font-bold text-xs text-slate-700">
                      {filteredSuppliers.map((sup, sidx) => (
                        <button
                          key={sidx}
                          type="button"
                          onClick={() => {
                            setDraftSupplier(sup);
                            setShowSupplierDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer block truncate"
                        >
                          {sup}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(true)}
                  className="px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center transition-colors shadow-3xs"
                  title="Add new supplier"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* NEW SUPPLIER MODAL */}
            {showNewSupplierModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in border border-slate-200">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">Add New Supplier</h3>
                    <button onClick={() => setShowNewSupplierModal(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border border-slate-100 transition-colors cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Supplier Name *</label>
                      <input
                        type="text"
                        placeholder="E.g. Nexus Distributors"
                        value={newSupplierForm.name}
                        onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="E.g. +91 9876543210"
                        value={newSupplierForm.phone}
                        onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Address</label>
                      <textarea
                        rows={2}
                        placeholder="Supplier office or warehouse address..."
                        value={newSupplierForm.address}
                        onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                    <button
                      onClick={() => setShowNewSupplierModal(false)}
                      className="flex-1 py-2 text-[11px] font-extrabold uppercase text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!newSupplierForm.name.trim()) return;
                        setDraftSupplier(newSupplierForm.name.trim());
                        setShowNewSupplierModal(false);
                        setNewSupplierForm({ name: '', phone: '', address: '' });
                        setShowSupplierDropdown(false);
                      }}
                      disabled={!newSupplierForm.name.trim()}
                      className="flex-1 py-2 text-[11px] font-extrabold uppercase text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer shadow-sm"
                    >
                      Save Supplier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* COMPACT NOTES FIELDS (COLLAPSIBLE / EXPANDED ONLY WHEN EXPLICITLY CLICKED) */}
            <div className="border border-slate-200 bg-white rounded-2xl shadow-3xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="w-full py-4 px-4.5 bg-slate-50/50 hover:bg-slate-50 border-b border-light-slate text-slate-800 font-extrabold text-xs uppercase flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-650" />
                  <span>Optional Delivery Logistics & Guidelines ({isNotesExpanded ? 'Collapse' : 'Expand'})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isNotesExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isNotesExpanded && (
                <div className="p-4 space-y-4 animate-fade-in text-xs">
                  {/* MICRO-TEMPLATES */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Logistics Micro-Templates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Deliver Before 5 PM",
                        "Include GST Invoice",
                        "Urgent dispatch",
                        "Call before arrival",
                        "Fresh Batch requested",
                        "Waterproof box packing"
                      ].map(tpl => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => {
                            const val = purchaseNotes ? `${purchaseNotes} | ${tpl}` : tpl;
                            setPurchaseNotes(val.substring(0, 300));
                          }}
                          className="text-[9px] font-black bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 hover:text-indigo-700 transition-all cursor-pointer"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1 relative group">
                      <label className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Purchase Order Notes</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          maxLength={300}
                          placeholder="E.g., Require standard manufacturing certificates; verify lot numbers..."
                          value={purchaseNotes}
                          onChange={(e) => setPurchaseNotes(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-slate-50/30 text-slate-800 pr-8 resize-none"
                        />
                        {purchaseNotes && (
                          <button
                            type="button"
                            onClick={() => setPurchaseNotes('')}
                            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 bg-white shadow-3xs p-0.5 rounded-md border border-slate-200 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="relative group">
                        <label className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Delivery Instructions</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={180}
                            placeholder="E.g., Deliver to Main Warehouse bay 4."
                            value={deliveryInstructions}
                            onChange={(e) => setDeliveryInstructions(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-slate-800 font-bold pr-8"
                          />
                          {deliveryInstructions && (
                            <button
                              type="button"
                              onClick={() => setDeliveryInstructions('')}
                              className="absolute top-1/2 -translate-y-1/2 right-2.5 text-slate-400 hover:text-slate-600 bg-white shadow-3xs p-0.5 rounded-md border border-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="relative group">
                        <label className="text-[9px] font-black uppercase text-slate-450 block tracking-wider">Supplier terms</label>
                        <div className="relative">
                          <input
                            type="text"
                            maxLength={180}
                            placeholder="E.g., Wrap GST physical paper inside bundle packaging."
                            value={supplierInstructions}
                            onChange={(e) => setSupplierInstructions(e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/30 text-slate-800 font-bold pr-8"
                          />
                          {supplierInstructions && (
                            <button
                              type="button"
                              onClick={() => setSupplierInstructions('')}
                              className="absolute top-1/2 -translate-y-1/2 right-2.5 text-slate-400 hover:text-slate-600 bg-white shadow-3xs p-0.5 rounded-md border border-slate-200 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: STICKY ORDER SUMMARY & ACTIONS PANEL */}
      {activeStep === 3 && (
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 animate-fade-in text-left">
          
          {/* PROCUREMENT SUMMARY CARD */}
          <div className="bg-slate-950/95 rounded-[2.5rem] p-7 sm:p-8 shadow-2xl shadow-indigo-950/20 border border-white/[0.08] text-white relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/5">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/15 rounded-full blur-[60px] pointer-events-none animate-pulse duration-10000" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-violet-500/15 rounded-full blur-[60px] pointer-events-none animate-pulse duration-10000" />
            
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-550/10 p-2.5 rounded-xl border border-indigo-500/20 shadow-inner backdrop-blur-md">
                  <FileText className="w-4.5 h-4.5 text-indigo-350" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-100">Order Summary</h3>
                  <p className="text-[9px] text-slate-450 uppercase tracking-widest mt-0.5 font-bold">Verification Sheet</p>
                </div>
              </div>
              <span className="text-[8.5px] bg-white/5 border border-white/10 text-white/90 font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm backdrop-blur-md">Tier {activeStep} / 3</span>
            </div>

            <div className="space-y-5 text-xs text-slate-300 pt-6 relative z-10">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-2.5xl text-left select-none">
                  <span className="text-slate-400 uppercase tracking-[0.15em] text-[8px] font-black block mb-1">Supplier Entity</span>
                  <span className="font-extrabold text-white text-xs block truncate" title={draftSupplier}>{draftSupplier || 'Unassigned'}</span>
                </div>
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-2.5xl text-left select-none">
                  <span className="text-slate-400 uppercase tracking-[0.15em] text-[8px] font-black block mb-1">Total Lines</span>
                  <span className="font-extrabold text-indigo-300 text-xs block">{poDraftItems.length} Products</span>
                </div>
              </div>

              {/* Financial break up for procurement workspace */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-[0.15em] text-[9px] font-extrabold text-slate-400">Subtotal Net</span>
                  <span className="font-mono font-bold text-sm tracking-tight text-white">₹{formatNum(subTotal)}</span>
                </div>
                
                <div className="flex justify-between text-slate-300 items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/[0.06]">
                  <span className="flex items-center gap-2 leading-none uppercase tracking-widest text-[9px] font-black text-slate-400">
                    GST Est (%):
                    <input 
                      type="number" 
                      className="w-12 bg-black/60 border border-white/[0.08] text-white text-center rounded-lg text-[11px] px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all" 
                      value={gstPercentValue} 
                      onChange={(e) => setGstPercentValue(e.target.value)} 
                      placeholder="0"
                    />
                  </span>
                  <span className="font-mono font-bold text-white">₹{formatNum(estimatedGST)}</span>
                 </div>

                <div className="flex justify-between text-slate-300 items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl shadow-sm backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/[0.06]">
                  <span className="flex items-center gap-2 leading-none uppercase tracking-widest text-[9px] font-black text-slate-400">
                    Est Shipping:
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">₹</span>
                      <input 
                        type="number" 
                        className="w-20 bg-black/60 border border-white/[0.08] text-white text-right rounded-lg text-[11px] pl-4 pr-1.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all" 
                        value={shippingValue} 
                        onChange={(e) => setShippingValue(e.target.value)} 
                        placeholder="0"
                      />
                    </div>
                  </span>
                  <span className="font-mono font-bold text-white">₹{formatNum(Number(shippingValue) || 0)}</span>
                </div>

                <div className="flex justify-between items-end border-t border-white/[0.08] pt-5 mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[9px] tracking-[0.15em] uppercase text-slate-400 block mb-0.5">Estimated Cost</span>
                    <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider block">Incl. taxes & shipping</span>
                  </div>
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tighter drop-shadow-sm font-mono">₹{formatNum(estTotal)}</span>
                </div>
              </div>

              {/* Toggles for showing data on PO */}
              <div className="pt-6 border-t border-white/[0.08] space-y-4 pb-2 relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-100 block">Print Columns Mode</span>
                  <span className="text-[8px] text-indigo-300 font-black bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">Premium Control</span>
                </div>
                
                {/* Premium Mutually Exclusive Selectors */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setToggles({ showItemCost: true, showTotalCost: true, showGst: true, showLogisticPrice: true })}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden ${
                      toggles.showItemCost && toggles.showTotalCost
                        ? 'bg-indigo-650/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.06]'
                    }`}
                  >
                    {toggles.showItemCost && toggles.showTotalCost && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    )}
                    <div className="flex flex-col pr-2 relative z-10">
                      <span className={`text-[11px] font-bold flex items-center gap-2.5 uppercase tracking-wider transition-colors ${toggles.showItemCost && toggles.showTotalCost ? 'text-indigo-100' : 'text-slate-350'}`}>
                        <span className="relative flex h-2.5 w-2.5">
                          {toggles.showItemCost && toggles.showTotalCost && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-40"></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${toggles.showItemCost && toggles.showTotalCost ? 'bg-indigo-400' : 'bg-white/20'}`}></span>
                        </span>
                        Show Price (Full)
                      </span>
                      <span className="text-[9.5px] text-slate-500 mt-1.5 leading-tight font-medium pl-5">Items, Qty+Unit, Rate, Amount</span>
                    </div>
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider relative z-10 transition-colors ${toggles.showItemCost && toggles.showTotalCost ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                      {toggles.showItemCost && toggles.showTotalCost ? 'Active' : 'Select'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToggles({ showItemCost: true, showTotalCost: false, showGst: false, showLogisticPrice: false })}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden ${
                      toggles.showItemCost && !toggles.showTotalCost
                        ? 'bg-indigo-650/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.06]'
                    }`}
                  >
                    {toggles.showItemCost && !toggles.showTotalCost && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    )}
                    <div className="flex flex-col pr-2 relative z-10">
                      <span className={`text-[11px] font-bold flex items-center gap-2.5 uppercase tracking-wider transition-colors ${toggles.showItemCost && !toggles.showTotalCost ? 'text-indigo-100' : 'text-slate-350'}`}>
                        <span className="relative flex h-2.5 w-2.5">
                          {toggles.showItemCost && !toggles.showTotalCost && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-40"></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${toggles.showItemCost && !toggles.showTotalCost ? 'bg-indigo-400' : 'bg-white/20'}`}></span>
                        </span>
                        Hide Amount Only
                      </span>
                      <span className="text-[9.5px] text-slate-500 mt-1.5 leading-tight font-medium pl-5">Items, Qty+Unit, Rate</span>
                    </div>
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider relative z-10 transition-colors ${toggles.showItemCost && !toggles.showTotalCost ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                      {toggles.showItemCost && !toggles.showTotalCost ? 'Active' : 'Select'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToggles({ showItemCost: false, showTotalCost: false, showGst: false, showLogisticPrice: false })}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden ${
                      !toggles.showItemCost && !toggles.showTotalCost
                        ? 'bg-indigo-650/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.06]'
                    }`}
                  >
                    {!toggles.showItemCost && !toggles.showTotalCost && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    )}
                    <div className="flex flex-col pr-2 relative z-10">
                      <span className={`text-[11px] font-bold flex items-center gap-2.5 uppercase tracking-wider transition-colors ${!toggles.showItemCost && !toggles.showTotalCost ? 'text-indigo-100' : 'text-slate-350'}`}>
                        <span className="relative flex h-2.5 w-2.5">
                          {!toggles.showItemCost && !toggles.showTotalCost && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-40"></span>}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${!toggles.showItemCost && !toggles.showTotalCost ? 'bg-indigo-400' : 'bg-white/20'}`}></span>
                        </span>
                        Hide Rate &amp; Amount
                      </span>
                      <span className="text-[9.5px] text-slate-500 mt-1.5 leading-tight font-medium pl-5">Items, Qty+Unit only</span>
                    </div>
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider relative z-10 transition-colors ${!toggles.showItemCost && !toggles.showTotalCost ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                      {!toggles.showItemCost && !toggles.showTotalCost ? 'Active' : 'Select'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Health Meter indicator inside summary */}
              <div className="pt-5 border-t border-white/[0.08] space-y-2.5 font-sans relative z-10">
                <div className="flex justify-between items-center text-[9.5px] uppercase font-black text-slate-400 tracking-widest">
                  <span>Draft Readiness</span>
                  <span className={`font-black ${readiness.percentage === 100 ? 'text-emerald-400 animate-pulse' : 'text-indigo-300'}`}>{readiness.percentage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${readiness.percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-gradient-to-r from-indigo-500 to-violet-400 shadow-[0_0_12px_rgba(129,140,248,0.6)]'}`} 
                    style={{ width: `${readiness.percentage}%` }} 
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider leading-relaxed">{readiness.status}</p>
              </div>
            </div>
          </div>

          {/* BOTTOM DOCKED ACTION BAR */}
          <div className="relative z-10 bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl text-left shadow-sm mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Order Actions</span>
              {autoSaveStatus === 'saving' && (
                <span className="text-[9px] italic text-slate-350 font-bold flex items-center gap-1 font-sans">
                  <Loader2 className="w-3 animate-spin text-slate-400" /> Synced...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  ✓ Synced
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <button
                onClick={() => setShowInAppPreview(true)}
                disabled={poDraftItems.length === 0}
                className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 hover:border-indigo-200 hover:shadow-sm"
              >
                <Eye className="w-4 h-4 text-indigo-500" /> Preview App
              </button>

              <button
                onClick={() => handleSaveDraftManual(true)}
                disabled={poDraftItems.length === 0}
                className="flex items-center justify-center gap-2 py-3 bg-emerald-50/60 hover:bg-emerald-50 border-2 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-800 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 hover:shadow-md hover:scale-[1.01] active:scale-98 ring-1 ring-emerald-500/10"
              >
                <Save className="w-4 h-4 text-emerald-600" /> Save Draft
              </button>

              <button
                onClick={() => {
                  if (poDraftItems.length === 0) {
                    showToast("No active line items to generate preview.", "warning");
                    return;
                  }
                  generatePO_PDF(handleBuildPayload());
                }}
                className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 hover:border-blue-200 hover:shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-500" /> Download PDF
              </button>

              <button
                onClick={() => {
                  if (poDraftItems.length === 0) {
                    showToast("Line items list is empty.", "warning");
                    return;
                  }
                  if (navigator.share) {
                    navigator.share({
                      title: 'Purchase Order',
                      text: `PO Document for ${draftSupplier}`,
                    }).catch(console.error);
                  } else {
                    triggerWhatsAppDispatch(handleBuildPayload());
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 hover:border-teal-200 hover:shadow-sm"
              >
                <Share2 className="w-4 h-4 text-teal-500" /> Share
              </button>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  if (poDraftItems.length === 0) {
                    showToast("Please add at least one product with quantity to generate a PO.", "warning");
                    return;
                  }
                  if (!draftSupplier || !draftSupplier.trim()) {
                    showToast("Please select or enter a supplier name to generate a PO.", "warning");
                    return;
                  }
                  handleSaveDraftManual(false);
                  setShowInAppPreview(true);
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-black uppercase rounded-2xl tracking-widest text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500/50"
              >
                <Sparkles className="w-4 h-4 text-indigo-200 block" /> 
                <span>Generate PO Order</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {showScannerModal && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm" />}>
          <BarcodeScannerModal 
            onClose={() => setShowScannerModal(false)}
            onScan={handleCameraScan}
          />
        </React.Suspense>
      )}

    </div>
  );
}
