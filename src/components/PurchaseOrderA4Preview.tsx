import React, { useState, useEffect, useRef } from 'react';
import { User, Truck, ClipboardList, Globe } from 'lucide-react';
import appLogo from '../assets/images/app_logo_1780216474773.png';

export const PurchaseOrderA4Preview = ({ po, profile, inventory, formatNum, isPdf = false }: any) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPdf) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (parent) {
        const parentWidth = parent.getBoundingClientRect().width;
        if (parentWidth > 0) {
          const paddingWidth = parentWidth > 768 ? 64 : 32;
          const availableWidth = Math.max(200, parentWidth - paddingWidth);
          
          const scaleX = availableWidth / 794;
          
          // Limit max scale to 1.15 to prevent excessive swelling on ultra-big screens while looking sharp and readable
          const newScale = Math.min(1.15, scaleX);
          setScale(newScale);
        }
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const parentWidth = rect.width;
        if (parentWidth > 0) {
          const targetWidth = 794;
          const newScale = Math.min(1.15, parentWidth / targetWidth);
          setScale(newScale);
        }
      }
    };

    updateScale();
    
    // Set up ResizeObserver to trace size changes dynamically
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    
    if (containerRef.current && containerRef.current.parentElement) {
      observer.observe(containerRef.current.parentElement);
    }
    
    window.addEventListener('resize', updateScale);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isPdf]);

  let tableRows = [...(po.items || [])];
  if (tableRows.length === 0) {
    tableRows.push(null);
  }

  const expectedDeliveryDate = (() => {
    const d = new Date(po.date || po.updatedAt || Date.now());
    d.setDate(d.getDate() + 7);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  })();

  const poDate = (() => {
    const d = new Date(po.date || po.updatedAt || Date.now());
    const day = String(d.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
  })();

  return (
    <div 
      ref={containerRef}
      className={`flex justify-center items-start overflow-hidden ${isPdf ? 'w-full p-0 bg-white' : 'p-0 mx-auto'}`}
      style={isPdf ? {} : { 
        height: `${1123 * scale}px`,
        width: `${794 * scale}px`
      }}
    >
      <div 
        className={`bg-white text-slate-800 relative flex flex-col justify-between font-sans shrink-0 ${isPdf ? 'w-[210mm] min-h-[297mm] p-0 rounded-none' : 'shadow-[0_5px_40px_rgba(0,0,0,0.08)]'}`} 
        style={{ 
          boxSizing: 'border-box',
          width: isPdf ? '210mm' : '794px',
          minHeight: isPdf ? '297mm' : '1123px',
          transform: isPdf ? 'none' : `scale(${scale})`,
          transformOrigin: 'top center',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="flex-[1_0_auto] flex flex-col p-6 pb-2 relative z-10 w-full max-w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 w-1/2">
              {profile?.logo ? (
                <img src={profile.logo} alt="Logo" className="w-12 h-12 object-contain rounded shrink-0 grayscale mix-blend-multiply" referrerPolicy="no-referrer" />
              ) : (
                <img src={appLogo} alt="App Logo" className="w-12 h-12 object-contain rounded shrink-0 mix-blend-multiply" />
              )}
              <h1 className="text-[28px] font-black tracking-tight text-[#003580] leading-none truncate">
                {profile?.shopName || 'Smart Vyapar'}
              </h1>
            </div>

            <div className="flex flex-col items-end">
              <h2 className="text-[28px] font-black uppercase text-[#003580] leading-none mb-1">
                PURCHASE ORDER
              </h2>
              <div className="flex items-center gap-1 opacity-80">
                <div className="h-[2px] w-2 bg-[#003580]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#003580]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#003580]"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#003580]"></div>
                <div className="h-[2px] w-12 bg-[#003580]"></div>
              </div>
            </div>
          </div>
          
          <div className="h-[2px] w-full bg-[#003580] mb-5"></div>

          {/* Quick Info Bar */}
          <div className="flex divide-x border border-slate-200 divide-slate-200 rounded-sm mb-5 bg-[#f8fbff]">
            <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
              <div className="w-8 h-8 rounded shrink-0 bg-white flex items-center justify-center text-[#4da1ff]">
                <ClipboardList className="w-5 h-5 text-[#4da1ff] drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#000000] font-medium leading-tight">PO No.</span>
                <span className="text-[13px] text-[#000000] font-bold tracking-wide leading-tight">{po.id || 'PO-2025-000125'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
              <div className="w-8 h-8 rounded shrink-0 bg-white flex items-center justify-center text-[#4da1ff]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#4da1ff] drop-shadow-sm"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#000000] font-medium leading-tight">PO Date</span>
                <span className="text-[13px] text-[#000000] font-bold tracking-wide leading-tight">{poDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 px-4 py-2.5">
              <div className="w-8 h-8 rounded shrink-0 bg-white flex items-center justify-center text-[#4da1ff]">
                <Truck className="w-5 h-5 text-[#4da1ff] drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#000000] font-medium leading-tight">Expected Delivery Date</span>
                <span className="text-[13px] text-[#000000] font-bold tracking-wide leading-tight">{expectedDeliveryDate}</span>
              </div>
            </div>
          </div>

          {/* Supplier & Delivery Details block */}
          <div className="grid grid-cols-2 gap-0 border-t border-b border-slate-200 mb-5 relative">
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-200"></div>
            {/* Supplier Details */}
            <div className="p-4 pl-0 pr-6">
              <div className="flex items-center gap-2 text-[#003580] font-bold text-xs uppercase tracking-widest mb-3">
                <User className="w-4 h-4 fill-[#003580] text-[#003580]" />
                <span>Supplier Details</span>
              </div>
              <div className="grid grid-cols-[100px_4px_1fr] text-[11px] gap-y-2 text-[#000]">
                <span>Supplier Name</span>
                <span>:</span>
                <span>{po.supplier || 'N/A'}</span>
                
                <span>Mobile Number</span>
                <span>:</span>
                <span>{po.supplierPhone || '+91 00000 00000'}</span>
                
                <span>Address</span>
                <span>:</span>
                <span>{po.supplierAddress ? po.supplierAddress : 'N/A'}</span>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="p-4 pr-0 pl-6">
              <div className="flex items-center gap-2 text-[#003580] font-bold text-xs uppercase tracking-widest mb-3">
                <div className="text-[#003580]">
                  <svg width="14" height="18" viewBox="0 0 24 24" fill="#003580" stroke="#003580" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle fill="white" cx="12" cy="10" r="3"/></svg>
                </div>
                <span>Delivery Details</span>
              </div>
              <div className="grid grid-cols-[100px_4px_1fr] text-[11px] gap-y-2 text-[#000]">
                <span>Delivery To</span>
                <span>:</span>
                <span>{profile?.shopName || 'Smart Vyapar Store'}</span>
                
                <span>Address</span>
                <span>:</span>
                <span>{po.deliveryInstructions || profile?.address || 'N/A'}</span>
                
                <span>Contact Person</span>
                <span>:</span>
                <span>{profile?.ownerName || 'N/A'}</span>

                <span>Mobile Number</span>
                <span>:</span>
                <span>{profile?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="w-full relative z-10 border border-[#003580]">
            <table className="w-full text-left border-collapse text-[11px] box-border">
              <thead>
                <tr className="bg-[#003580] text-white font-bold text-[11px]">
                  <th className="py-2.5 px-2 text-center border-r border-[#ffffff33] w-12 font-medium">S.No.</th>
                  <th className="py-2.5 px-3 border-r border-[#ffffff33] font-medium">Item Name</th>
                  <th className="py-2.5 px-2 text-center border-r border-[#ffffff33] w-24 font-medium">HSN Code</th>
                  <th className="py-2.5 px-2 text-center border-r border-[#ffffff33] w-14 font-medium">Qty</th>
                  <th className="py-2.5 px-2 text-center border-r border-[#ffffff33] w-16 font-medium">Unit</th>
                  <th className="py-2.5 px-3 text-right border-r border-[#ffffff33] w-24 font-medium">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-28 font-medium">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {tableRows.map((item: any, idx: number) => {
                  const hasItem = item !== null && item !== undefined && item.productName;
                  const qty = hasItem ? (typeof item.qty === 'number' ? item.qty : Number(item.qty) || 0) : '';
                  const costStr = hasItem ? (typeof item.cost === 'number' ? item.cost : Number(item.cost) || 0) : '';
                  const cost = Number(costStr) || 0;
                  const amount = (Number(qty) || 0) * cost;
                  const invProduct = hasItem && inventory ? inventory?.find((p: any) => p.id === item.productId) : null;
                  const hsn = invProduct?.hsn && invProduct.hsn.trim() ? invProduct.hsn : (hasItem ? "-" : "");
                  const unit = hasItem ? (item.unit || 'PCS') : '';

                  return (
                  <tr key={idx} className="h-6 leading-tight border-b border-dotted border-slate-300 last:border-b-0" style={{borderBottomStyle: 'dotted', borderBottomWidth: '1px'}}>
                    <td className="py-1 px-2 text-center text-slate-800 border-r border-slate-200">{hasItem ? idx + 1 : idx + 1}</td>
                    <td className="py-1 px-3 text-[#000] truncate max-w-[200px] border-r border-slate-200">{hasItem ? item.productName : '\u00A0'}</td>
                    <td className="py-1 px-2 text-center text-[#000] border-r border-slate-200">{hsn}</td>
                    <td className="py-1 px-2 text-center text-[#000] border-r border-slate-200">{qty}</td>
                    <td className="py-1 px-2 text-center text-[#000] uppercase border-r border-slate-200">{unit}</td>
                    <td className="py-1 px-3 text-right text-[#000] border-r border-slate-200">{hasItem ? Number(cost).toFixed(2) : '\u00A0'}</td>
                    <td className="py-1 px-3 text-right text-[#000]">{hasItem ? formatNum(amount) + '.00' : '\u00A0'}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start mt-4 h-[120px]">
            {/* Notes Section */}
            <div className="w-[300px]">
              <div className="flex items-center gap-2 text-[#003580] font-bold text-sm mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <span>Notes :</span>
              </div>
              <p className="text-[11px] text-[#000] mb-2 pl-1 leading-relaxed max-w-[280px]">
                {po.purchaseNotes || po.supplierInstructions || 'Please supply the above items as per the expected date.'}
              </p>
              <div className="border-b border-blue-200 w-full mb-[6px]"></div>
              <div className="border-b border-blue-200 w-[90%]"></div>
            </div>

            {/* Totals Section */}
            <div className="w-[280px]">
               <div className="grid grid-cols-[140px_1fr] text-[11px] items-center border border-slate-200 mb-[-1px]">
                  <div className="p-2 pl-4 text-black font-semibold border-r border-slate-200">Total Qty</div>
                  <div className="p-2 text-center font-bold text-black border-slate-200">
                    {po.items?.reduce((acc: number, cur: any) => acc + Number(cur.qty || 0), 0) || 0}
                  </div>
               </div>
               <div className="grid grid-cols-[140px_1fr] text-[11px] items-center border border-slate-200 mb-[-1px]">
                  <div className="p-2 pl-4 text-black font-semibold border-r border-slate-200">Subtotal</div>
                  <div className="p-2 text-center font-bold text-black border-slate-200">
                    ₹ {formatNum(po.subTotal || po.items?.reduce((acc: number, c: any) => acc + (Number(c.qty) * (Number(c.cost) || 0)), 0) || 0)}.00
                  </div>
               </div>
               {po.gstAmount !== undefined && Number(po.gstAmount) > 0 && (
                <div className="grid grid-cols-[140px_1fr] text-[11px] items-center border border-slate-200 mb-[-1px]">
                  <div className="p-2 pl-4 text-black font-semibold border-r border-slate-200">GST ({po.gstPercent || 18}%)</div>
                  <div className="p-2 text-center font-bold text-black border-slate-200">
                    + ₹ {formatNum(po.gstAmount)}.00
                  </div>
               </div>
               )}
               {Number(po.otherCharges) > 0 && (
                <div className="grid grid-cols-[140px_1fr] text-[11px] items-center border border-slate-200 mb-[-1px]">
                  <div className="p-2 pl-4 text-black font-semibold border-r border-slate-200">Shipping Cost</div>
                  <div className="p-2 text-center font-bold text-black border-slate-200">
                    + ₹ {formatNum(po.otherCharges)}.00
                  </div>
               </div>
               )}
               <div className="grid grid-cols-[140px_1fr] text-[14px] items-center border border-[#badbfd] bg-[#e6f2ff] overflow-hidden">
                  <div className="p-2.5 pl-4 text-[#003580] font-bold border-r border-[#badbfd]">Grand Total (₹)</div>
                  <div className="p-2.5 pr-4 text-right font-black text-[#003580]">
                    {formatNum(po.totalAmount || Math.round((po.subTotal || po.items?.reduce((acc: number, c: any) => acc + (Number(c.qty) * (Number(c.cost) || 0)), 0) || 0) * (1 + ((po.gstPercent || 0) / 100))) + Number(po.otherCharges || 0))}.00
                  </div>
               </div>

               <div className="mt-12 flex justify-between items-end pr-2">
                 <div className="flex flex-col text-[9.5px] text-slate-500 font-medium">
                 </div>
                 <div className="flex flex-col items-end pr-4">
                   <div className="text-[10px] text-[#003580] font-extrabold text-center tracking-widest uppercase mb-12">
                      Authorized Signatory
                   </div>
                   <div className="border-b-2 border-slate-300 w-48"></div>
                   <div className="text-[9px] font-bold text-slate-400 mt-2 tracking-wide">For {profile?.shopName || 'Company'}</div>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-auto"></div>

          <div className="px-8 pb-8">
            {/* Brand Footer Strip with clip-path angled slanted ribbon decoration */}
            <div className="rounded-xl overflow-hidden text-white py-2 px-6 flex justify-between items-center text-[9px] font-bold bg-[#003580] relative h-7">
              {/* Left slanted ribbon */}
              <div className="absolute left-0 bottom-0 top-0 w-8 bg-blue-500 select-none" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%, 0 100%)' }}></div>
              
              <div className="flex-1 text-center font-sans">
                <span className="normal-case text-slate-200">Generated by </span>
                <span className="uppercase text-blue-300 tracking-wider font-extrabold">Smart Vyapar</span>
                <span className="text-slate-300 font-extrabold"> | www.smartvyapar.com</span>
              </div>

              {/* Right slanted ribbon */}
              <div className="absolute right-0 bottom-0 top-0 w-8 bg-blue-500 select-none" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
            </div>

            <div className="bg-slate-50 text-center py-1 border border-slate-200/60 rounded-b-xl mt-1 select-all">
              <a 
                href="https://ais-pre-bcqmpkyatfvrlpxxjt4o47-224993737646.asia-east1.run.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 font-extrabold hover:underline text-[9px] leading-tight block"
              >
                https://ais-pre-bcqmpkyatfvrlpxxjt4o47-224993737646.asia-east1.run.app
              </a>
            </div>
          </div>      </div>

      </div>
    </div>
  );
};
