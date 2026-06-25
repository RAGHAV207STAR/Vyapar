import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Cloud, 
  Database, 
  FileText, 
  Info, 
  Laptop, 
  ListRestart, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBilling } from '../context/BillingContext';
import { DataCollisionSession } from '../types';

export default function ConflictReconciliationModal() {
  const { activeCollision, resolveCollision } = useBilling();
  
  const [resolutionStrategy, setResolutionStrategy] = useState<'local' | 'cloud' | 'merge'>('local');
  const [manualSelections, setManualSelections] = useState<Record<string, 'local' | 'cloud'>>({});
  const [isCommiting, setIsCommiting] = useState(false);
  const [commitProgress, setCommitProgress] = useState(0);

  // Auto-initialize manual selections to 'local' for all fields
  useEffect(() => {
    if (activeCollision) {
      const initial: Record<string, 'local' | 'cloud'> = {};
      activeCollision.fields.forEach(f => {
        initial[f.key] = 'local';
      });
      setManualSelections(initial);
      setResolutionStrategy('local'); // Default strategy
    }
  }, [activeCollision]);

  if (!activeCollision) return null;

  // Compute merged preview payload
  const getMergedPayload = () => {
    if (resolutionStrategy === 'local') {
      return activeCollision.localData;
    }
    if (resolutionStrategy === 'cloud') {
      return activeCollision.cloudData;
    }

    // Manual Merge Logic
    const merged = { ...activeCollision.localData };
    activeCollision.fields.forEach(f => {
      const selected = manualSelections[f.key];
      merged[f.key] = selected === 'local' ? activeCollision.localData[f.key] : activeCollision.cloudData[f.key];
    });

    // Special calculations for invoice merged totals if items are from local/cloud
    if (activeCollision.type === 'INVOICE') {
      // Re-calculate subtotal and totals based on items if selected
      const localProds = activeCollision.localData.products || [];
      const cloudProds = activeCollision.cloudData.products || [];
      
      const uniqueProdNames = Array.from(new Set([
        ...localProds.map((p: any) => p.name),
        ...cloudProds.map((p: any) => p.name)
      ]));

      // Reconcile individual product choices
      const chosenItems: any[] = [];
      uniqueProdNames.forEach((prodName: any) => {
        const itemChoice = manualSelections[`prod_${prodName}`] || (localProds.some((p: any) => p.name === prodName) ? 'local' : 'cloud');
        const lp = localProds.find((p: any) => p.name === prodName);
        const cp = cloudProds.find((p: any) => p.name === prodName);
        
        if (itemChoice === 'local' && lp) {
          chosenItems.push(lp);
        } else if (itemChoice === 'cloud' && cp) {
          chosenItems.push(cp);
        }
      });

      merged.products = chosenItems;
      
      const subTotal = chosenItems.reduce((acc: number, item: any) => acc + (parseFloat(item.total) || 0), 0);
      merged.subTotal = subTotal;

      const discountPercent = merged.discountPercent || 0;
      const discountAmount = merged.discountAmount || 0;
      const flatGst = merged.gstPercent || 0;

      const afterDiscount = Math.max(0, subTotal - discountAmount - (subTotal * discountPercent / 100));
      const gstAmount = afterDiscount * flatGst / 100;
      
      merged.totalAmount = Math.round(afterDiscount + gstAmount);
      merged.balanceAmount = Math.max(0, merged.totalAmount - (merged.paidAmount || 0));
    }

    return merged;
  };

  const previewRecord = getMergedPayload();

  const handleCommit = async () => {
    setIsCommiting(true);
    setCommitProgress(10);
    
    // Smooth progress simulation
    const interval = setInterval(() => {
      setCommitProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 120);

    try {
      setTimeout(async () => {
        clearInterval(interval);
        setCommitProgress(100);
        await resolveCollision(resolutionStrategy, previewRecord);
        setIsCommiting(false);
      }, 1000);
    } catch (_) {
      clearInterval(interval);
      setIsCommiting(false);
    }
  };

  const formatValue = (val: any, type: string) => {
    if (!val && val !== 0) return 'N/A';
    if (type === 'currency') {
      return `₹ ${parseFloat(val).toLocaleString('en-IN')}`;
    }
    if (type === 'status') {
      return (
        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-wider ${
          val === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
          val === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
          'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          {val}
        </span>
      );
    }
    if (type === 'array') {
      return `${Array.isArray(val) ? val.length : 0} items listed`;
    }
    if (typeof val === 'object') {
      return val.name || val.phone || JSON.stringify(val);
    }
    return String(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto select-none font-sans">
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="bg-white border border-slate-200 max-w-5xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 relative"
      >
        {/* Banner with warning */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                Ledger Conflict Identified
              </span>
              <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                {activeCollision.title}
              </h2>
            </div>
          </div>
          
          <button 
            onClick={() => resolveCollision('cloud', null)} // Cancel / choose cloud safely
            disabled={isCommiting}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss Resolver"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative Help Box */}
        <div className="p-4 bg-amber-50/50 border-b border-amber-200/60 text-amber-800 text-xs font-semibold flex items-start gap-2.5">
          <Info className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {activeCollision.subtitle || "Simultaneous updates were detected on another active terminal. Review field values, choose a merging mechanism, and commit the ledger securely."}
          </p>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[60vh]">
          {/* VISUAL FIELD DIFF ENGINE */}
          <div className="p-5 border border-amber-200/60 bg-amber-50/20 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 select-none">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
              Detailed Side-by-Side Discrepancy Analysis
            </h3>
            <div className="space-y-3">
              {activeCollision.fields.filter(f => f.differs).map(f => {
                const localVal = activeCollision.localData[f.key];
                const cloudVal = activeCollision.cloudData[f.key];
                
                let desc = "";
                if (f.key === 'stock') {
                  desc = `Cloud terminal lists stock as ${cloudVal} units, while the local device offline-write registers ${localVal} units. This represents a variance of ${Math.abs(localVal - cloudVal)} units.`;
                } else if (f.key === 'products') {
                  const localLen = Array.isArray(localVal) ? localVal.length : 0;
                  const cloudLen = Array.isArray(cloudVal) ? cloudVal.length : 0;
                  desc = `Cloud server version records ${cloudLen} products, whereas the local device receipt state lists ${localLen} products.`;
                } else if (f.type === 'currency') {
                  desc = `Server records transaction amount as ₹${parseFloat(cloudVal).toLocaleString('en-IN')}, while your local device has recorded ₹${parseFloat(localVal).toLocaleString('en-IN')}.`;
                } else if (f.type === 'status') {
                  desc = `Payment status is logged as "${cloudVal}" on the server, but your offline device logs it as "${localVal}".`;
                } else {
                  desc = `Cloud value is "${formatValue(cloudVal, f.type)}" vs Local device value "${formatValue(localVal, f.type)}".`;
                }

                return (
                  <div key={f.key} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans hover:shadow-xs transition duration-200">
                    <div className="space-y-1.5 md:max-w-[55%]">
                      <span className="text-[10px] font-black uppercase text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg inline-block">
                        {f.label}
                      </span>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        {desc}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[100px]">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">Device</span>
                        <span className="text-xs font-black text-rose-600 font-mono">{formatValue(localVal, f.type)}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[100px]">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">Server</span>
                        <span className="text-xs font-black text-emerald-600 font-mono">{formatValue(cloudVal, f.type)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main comparison screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Split Decorative Line */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-[1px] bg-slate-100 -translate-x-1/2 pointer-events-none" />

            {/* SCREEN 1: LOCAL DESIGN */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
              resolutionStrategy === 'local' 
                ? 'bg-indigo-50/50 border-indigo-400 shadow-md shadow-indigo-100/40' 
                : 'bg-slate-50/40 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                  Local Device State
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                  {activeCollision.localTimestamp}
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-3.5">
                {activeCollision.fields.map(f => (
                  <div key={f.key} className="flex flex-col gap-1 text-slate-600">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {f.label}
                    </span>
                    <div className={`p-3 rounded-xl border text-sm font-bold truncate ${
                      f.differs 
                        ? 'bg-amber-500/5 border-amber-200 text-amber-950' 
                        : 'bg-white border-slate-150 text-slate-700'
                    }`}>
                      {formatValue(activeCollision.localData[f.key], f.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SCREEN 2: CLOUD DESIGN */}
            <div className={`p-5 rounded-2xl border transition-all duration-300 ${
              resolutionStrategy === 'cloud' 
                ? 'bg-indigo-50/50 border-indigo-400 shadow-md shadow-indigo-100/40' 
                : 'bg-slate-50/40 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  Cloud Firestore Server
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                  {activeCollision.cloudTimestamp}
                </span>
              </div>

              {/* Data Rows */}
              <div className="space-y-3.5">
                {activeCollision.fields.map(f => (
                  <div key={f.key} className="flex flex-col gap-1 text-slate-600">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {f.label}
                    </span>
                    <div className={`p-3 rounded-xl border text-sm font-bold truncate ${
                      f.differs 
                        ? 'bg-amber-500/5 border-amber-200 text-amber-950' 
                        : 'bg-white border-slate-150 text-slate-700'
                    }`}>
                      {formatValue(activeCollision.cloudData[f.key], f.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: STRATEGY CONFIGURATION */}
          <div className="p-5 bg-slate-50 border border-slate-250 rounded-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
              Select Merging Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* LWW Option */}
              <button
                type="button"
                onClick={() => setResolutionStrategy('local')}
                className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-all ${
                  resolutionStrategy === 'local'
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  resolutionStrategy === 'local' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {resolutionStrategy === 'local' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Last-Write-Wins (Local)</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Keep local device parameters and force overwrite of Cloud Firestore.
                  </p>
                </div>
              </button>

              {/* Cloud Override Option */}
              <button
                type="button"
                onClick={() => setResolutionStrategy('cloud')}
                className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-all ${
                  resolutionStrategy === 'cloud'
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  resolutionStrategy === 'cloud' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {resolutionStrategy === 'cloud' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Cloud Safe Override</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Discard local updates and pull active cloud instance parameters.
                  </p>
                </div>
              </button>

              {/* Interactive Manual Merge */}
              <button
                type="button"
                onClick={() => setResolutionStrategy('merge')}
                className={`p-4 border rounded-xl flex items-start gap-3 text-left transition-all ${
                  resolutionStrategy === 'merge'
                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  resolutionStrategy === 'merge' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {resolutionStrategy === 'merge' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1">
                    Manual Field Merge
                    <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded-md font-bold uppercase">🧬 Hybrid</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">
                    Iterate field by field to select which data points to retain.
                  </p>
                </div>
              </button>
            </div>

            {/* MANUAL SELECTION DRAWER IF STRATEGY === 'MERGE' */}
            <AnimatePresence>
              {resolutionStrategy === 'merge' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white border border-slate-200 rounded-xl p-4 space-y-3.5"
                >
                  <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide">
                    🧬 Interactive Hybrid Merger Pane
                  </p>
                  
                  <div className="space-y-4">
                    {activeCollision.fields.filter(f => f.differs).map(f => {
                      if (f.key === 'products') {
                        const localProds = activeCollision.localData.products || [];
                        const cloudProds = activeCollision.cloudData.products || [];
                        
                        // Let's gather all unique product names that exist in local or cloud
                        const uniqueProdNames = Array.from(new Set([
                          ...localProds.map((p: any) => p.name),
                          ...cloudProds.map((p: any) => p.name)
                        ]));

                        return (
                          <div key={f.key} className="p-4 border border-indigo-150 bg-indigo-50/15 rounded-xl space-y-3 col-span-12">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-200/50 pb-2">
                              <span className="text-xs font-black uppercase text-indigo-955 flex items-center gap-1.5 select-none">
                                <ListRestart className="w-4 h-4 text-indigo-600 shrink-0" />
                                {f.label} - Individual Line-Item Allocation
                              </span>
                              <span className="text-[9px] text-indigo-700 font-extrabold bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full mt-1 sm:mt-0 uppercase">
                                itemized control
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                              Select whether you want to use the local device configuration or the cloud server configuration for each specific line item below. The grand subtotal and totals will automatically update in real-time.
                            </p>

                            <div className="space-y-2 select-none">
                              {uniqueProdNames.map((prodName: any) => {
                                const lp = localProds.find((p: any) => p.name === prodName);
                                const cp = cloudProds.find((p: any) => p.name === prodName);
                                
                                const itemChoice = manualSelections[`prod_${prodName}`] || (lp ? 'local' : 'cloud');

                                return (
                                  <div key={prodName} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-sans">
                                    <div className="space-y-0.5 max-w-sm">
                                      <h5 className="text-xs font-black text-slate-800 tracking-tight">{prodName}</h5>
                                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                                        SKU: {lp?.sku || cp?.sku || 'N/A'}
                                      </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 shrink-0 sm:w-80">
                                      {/* Local Choice button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManualSelections(prev => ({
                                            ...prev,
                                            [`prod_${prodName}`]: 'local'
                                          }));
                                        }}
                                        className={`px-3 py-1.5 border rounded-lg text-left flex justify-between items-center text-[11px] transition-all truncate outline-none cursor-pointer ${
                                          itemChoice === 'local'
                                            ? 'bg-rose-50/50 border-rose-400 text-rose-950 font-black'
                                            : 'bg-slate-50 border-slate-150 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                        }`}
                                        disabled={!lp}
                                      >
                                        <div className="truncate shrink">
                                          {lp ? `${lp.quantity} ${lp.unit} @ ₹${lp.price}` : 'Not Present'}
                                        </div>
                                        <span className="text-[8px] uppercase font-extrabold border border-current rounded px-1 shrink-0 ml-1">Device</span>
                                      </button>

                                      {/* Cloud Choice button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManualSelections(prev => ({
                                            ...prev,
                                            [`prod_${prodName}`]: 'cloud'
                                          }));
                                        }}
                                        className={`px-3 py-1.5 border rounded-lg text-left flex justify-between items-center text-[11px] transition-all truncate outline-none cursor-pointer ${
                                          itemChoice === 'cloud'
                                            ? 'bg-emerald-50/50 border-emerald-400 text-emerald-950 font-black'
                                            : 'bg-slate-50 border-slate-150 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                        }`}
                                        disabled={!cp}
                                      >
                                        <div className="truncate shrink">
                                          {cp ? `${cp.quantity} ${cp.unit} @ ₹${cp.price}` : 'Not Present'}
                                        </div>
                                        <span className="text-[8px] uppercase font-extrabold border border-current rounded px-1 shrink-0 ml-1">Server</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={f.key} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div className="sm:col-span-4 select-none">
                            <span className="text-xs font-black uppercase text-slate-700 block animate-none">
                              {f.label}
                            </span>
                          </div>
                          
                          <div className="sm:col-span-8 grid grid-cols-2 gap-2 select-none">
                            {/* Pick Local Selector */}
                            <button
                              type="button"
                              onClick={() => setManualSelections(prev => ({ ...prev, [f.key]: 'local' }))}
                              className={`p-2.5 border rounded-lg text-left transition-colors flex items-center justify-between truncate font-sans text-xs outline-none cursor-pointer ${
                                manualSelections[f.key] === 'local'
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{formatValue(activeCollision.localData[f.key], f.type)}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white border border-current rounded font-bold shrink-0 ml-1">Device</span>
                            </button>

                            {/* Pick Cloud Selector */}
                            <button
                              type="button"
                              onClick={() => setManualSelections(prev => ({ ...prev, [f.key]: 'cloud' }))}
                              className={`p-2.5 border rounded-lg text-left transition-colors flex items-center justify-between truncate font-sans text-xs outline-none cursor-pointer ${
                                manualSelections[f.key] === 'cloud'
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{formatValue(activeCollision.cloudData[f.key], f.type)}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-white border border-current rounded font-bold shrink-0 ml-1">Server</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOOTER: PREVIEW RESULTS AND RESOLVE */}
        <div className="bg-slate-50/50 p-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Summary Preview Indicator */}
          <div className="space-y-1 max-w-lg">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
              Resulting Ledger Preview
            </span>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-extrabold text-slate-700">
              {activeCollision.type === 'INVOICE' ? (
                <>
                  <span>Client: {previewRecord.customerDetails?.name || 'Walkin'}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span>Grand Total: ₹ {previewRecord.totalAmount?.toLocaleString('en-IN')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Payment Status: <span className="text-indigo-600 font-extrabold">{previewRecord.paymentStatus}</span></span>
                </>
              ) : (
                <>
                  <span>SKU: {previewRecord.sku}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Product: {previewRecord.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reconciled Stock: <span className="text-rose-600 font-black">{previewRecord.stock} units</span></span>
                </>
              )}
            </div>
          </div>

          {/* Commit Action Buttons */}
          <div className="flex items-center gap-2.5 self-end">
            <button
              onClick={() => resolveCollision('cloud', null)}
              disabled={isCommiting}
              className="px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-650 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              Cancel & Pull Server
            </button>
            
            <button
              onClick={handleCommit}
              disabled={isCommiting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-150 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCommiting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Ledger Synced {commitProgress}%</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-white" />
                  <span>Authorize & Commit Ledger</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
