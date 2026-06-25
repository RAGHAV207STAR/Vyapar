import React from 'react';
import { Package, TrendingUp, Calendar, ArrowUpRight, Award, ShieldAlert, FileText } from 'lucide-react';

interface SupplierLedgerHubProps {
  supplierHistory: any[];
  productPurchaseRecords: Record<string, any[]>;
  inventory: any[];
  historySubTab: 'suppliers' | 'products';
  formatNum: (val: number) => string;
}

export default function SupplierLedgerHub({
  supplierHistory,
  productPurchaseRecords,
  inventory,
  historySubTab,
  formatNum
}: SupplierLedgerHubProps) {

  return (
    <div id="vmitra-supplier-ledger-hub" className="space-y-6 text-left animate-fade-in">
      
      {/* SUPPLIERS VIEW */}
      {historySubTab === 'suppliers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-3xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Supplier Ledger
              </h4>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Transaction logs and receipt history per supplier.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-indigo-700 rounded-xl font-bold uppercase tracking-wider">
                {supplierHistory.length} Shipments logged
              </span>
            </div>
          </div>

          {supplierHistory.length === 0 ? (
            <div className="p-16 text-center text-slate-450 font-bold text-xs flex flex-col items-center justify-center gap-2.5">
              <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <span>No transactions logged in the supplier ledger accounts yet.</span>
              <p className="text-[9px] uppercase text-slate-400 tracking-wider font-mono">Log arriving inventory inside the Receive Center to register accounting logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 text-[9.5px] font-black uppercase text-slate-400 border-b">
                  <tr>
                    <th className="px-6 py-3.5">PO ID</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Fulfillment</th>
                    <th className="px-6 py-3.5">Received</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Discrepancy</th>
                    <th className="px-6 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {supplierHistory.map((sh, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/45 transition-colors">
                      <td className="px-6 py-4 font-mono font-black text-indigo-700">{sh.poId}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">{sh.supplier}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                          sh.status === 'Fully Received' || sh.status === 'RECEIVED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                        }`}>
                          {sh.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-800">{sh.receivedCount} units</td>
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono">₹{formatNum(sh.totalOutflow || sh.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          sh.discrepancyAction && sh.discrepancyAction !== 'None'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : 'bg-slate-100 text-slate-650'
                        }`}>
                          {sh.discrepancyAction ? sh.discrepancyAction.replace('_', ' ') : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">{new Date(sh.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS PURCHASE VIEW */}
      {historySubTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-3xs overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 space-y-1">
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Purchase Logs
            </h4>
            <p className="text-[10.5px] text-slate-500 font-medium">
              Unit rate costs tracked across historical supplier shipments.
            </p>
          </div>

          {Object.keys(productPurchaseRecords).length === 0 ? (
            <div className="p-16 text-center text-slate-450 font-bold text-xs flex flex-col items-center justify-center gap-2.5">
              <TrendingUp className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <span>No product buying records indexed yet.</span>
              <p className="text-[9px] uppercase text-slate-400 tracking-wider">Log check-ins on active orders to build unit-pricing charts dynamically.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 p-6 space-y-5 max-h-160 overflow-y-auto">
              {Object.entries(productPurchaseRecords).map(([key, records]: [string, any]) => {
                const catalogProd = inventory.find(i => i.id === key);
                const displayName = catalogProd ? catalogProd.name : key;

                return (
                  <div key={key} className="p-4 bg-slate-50/40 border border-slate-200 rounded-2xl space-y-3.5">
                    
                    <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                      <span className="font-extrabold text-slate-850 text-xs sm:text-sm flex items-center gap-2">
                        📦 {displayName}
                      </span>
                      <span className="text-[9.5px] bg-[#111111] text-indigo-200 px-3 py-1 rounded-full font-black uppercase tracking-wider font-mono">
                        {records.length} Historic Shipments Indexed
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-150 bg-white shadow-3xs">
                      <table className="w-full text-xs text-slate-700">
                        <thead className="bg-slate-50/60 text-[9px] font-black uppercase text-slate-400 border-b">
                          <tr>
                            <th className="px-5 py-2.5">PO ID</th>
                            <th className="px-5 py-2.5">Supplier</th>
                            <th className="px-5 py-2.5">Quantity Received</th>
                            <th className="px-5 py-2.5">Unit Rate Paid</th>
                            <th className="px-5 py-2.5 font-sans">Total Expense</th>
                            <th className="px-5 py-2.5">Delivery Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {records.map((rec: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-5 py-2.5 font-mono font-black text-indigo-700">{rec.poId}</td>
                              <td className="px-5 py-2.5 font-semibold text-slate-800">{rec.supplier}</td>
                              <td className="px-5 py-2.5 font-mono text-[#222222]">+{rec.quantity} units</td>
                              <td className="px-5 py-2.5 font-black text-indigo-650 font-mono">₹{formatNum(rec.cost)}</td>
                              <td className="px-5 py-2.5 font-black text-slate-900 font-mono">₹{formatNum(rec.total)}</td>
                              <td className="px-5 py-2.5 text-slate-400 font-semibold font-mono">{new Date(rec.date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
