/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  FileText, 
  Calendar, 
  ArrowUpDown, 
  Filter, 
  Eye, 
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle,
  Target,
  MoreVertical,
  Receipt,
  Pencil,
  ListRestart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBilling } from '../context/BillingContext';
import { Bill } from '../types';

interface BillHistoryProps {
  onViewBill: (bill: Bill) => void;
  onEditBill?: (bill: Bill) => void;
}

export default function BillHistory({ onViewBill, onEditBill }: BillHistoryProps) {
  const { bills, deleteBill, profile, showConfirm, showToast } = useBilling();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [filterType, setFilterType] = useState<'all' | 'synced' | 'offline'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [viewDensity, setViewDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  // Deletion helper
  const handleDelete = (e: React.MouseEvent, billId: string, invNum: string) => {
    e.stopPropagation();
    showConfirm({
      title: "Delete Receipt",
      message: `Are you absolutely sure you want to permanently delete receipt record ${invNum}? This action cannot be restored.`,
      confirmText: "Delete Permanently",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteBill(billId);
          showToast(`Deleted invoice ${invNum} successfully`, 'success');
          // removing from selection if it was selected
          setSelectedBills(prev => {
            const newSet = new Set(prev);
            newSet.delete(billId);
            return newSet;
          });
        } catch (err) {
          console.error("Error deleting bill", err);
          showToast("Failed to delete invoice", 'error');
        }
      }
    });
  };

  const handleBulkDelete = () => {
    showConfirm({
      title: "Delete Multiple Receipts",
      message: `You are about to permanently delete ${selectedBills.size} bills. This action cannot be undone and these records cannot be restored.`,
      confirmText: `Delete ${selectedBills.size} Bills`,
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          const promises = Array.from(selectedBills).map(id => deleteBill(id));
          await Promise.all(promises);
          showToast(`Successfully deleted ${selectedBills.size} invoices`, 'success');
          setSelectedBills(new Set());
        } catch (err) {
          console.error("Error in bulk deletion", err);
          showToast("Failed to delete some invoices", 'error');
        }
      }
    });
  };

  const toggleSelection = (billId: string) => {
    setSelectedBills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  // Searching, Filtering and Sorting logic
  const processedBills = bills
    .filter(bill => {
      const s = searchTerm.toLowerCase();
      const matchSearch = 
        bill.invoiceNumber.toLowerCase().includes(s) ||
        bill.customerDetails.name.toLowerCase().includes(s) ||
        (bill.customerDetails.phone && bill.customerDetails.phone.includes(s)) ||
        (bill.businessId && bill.businessId.toLowerCase().includes(s)) ||
        (profile?.businessId && profile.businessId.toLowerCase().includes(s)) ||
        (profile?.shopName && profile.shopName.toLowerCase().includes(s));
      
      const matchSyncFilter = 
        filterType === 'all' ||
        (filterType === 'synced' && bill.isSynced) ||
        (filterType === 'offline' && !bill.isSynced);
        
      const matchPaymentFilter = 
        paymentFilter === 'ALL' ||
        bill.paymentStatus === paymentFilter;

      return matchSearch && matchSyncFilter && matchPaymentFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in font-sans pb-20">
      
      {/* Premium Header Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 via-fuchsia-900 to-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-purple-500/20 mb-8 group hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)] transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-700" />
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl -translate-y-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] sm:text-xs font-bold text-purple-200 border border-white/10 backdrop-blur-sm mb-1 uppercase tracking-widest">
               <Receipt className="w-3.5 h-3.5" /> Ledger & Records
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-3">
               Transaction History
             </h2>
             <p className="text-sm text-purple-100/80 font-medium max-w-md leading-relaxed">
               Manage completed invoices, track recent transactions, and search historical billing data.
             </p>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER ROWS CONTROLS */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border border-slate-200/80 p-5 rounded-3xl flex flex-col xl:flex-row gap-4 items-center justify-between shadow-xl shadow-slate-100/40">
        {/* Search */}
        <div className="relative w-full xl:max-w-md rounded-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-purple-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Business ID, Mobile, Shop or Invoice..."
            className="block w-full pl-11 pr-4 py-3 bg-white font-semibold text-sm border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-600 transition-all duration-300 shadow-sm"
          />
        </div>

        {/* Filters and Sorting dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto shrink-0 justify-start xl:justify-end">
          {/* Sorting Selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 cursor-pointer shadow-sm min-w-[150px] transition-all"
          >
            <option value="date-desc">⏳ Newest Receipts</option>
            <option value="date-asc">⌛ Oldest Receipts</option>
            <option value="amount-desc">💎 Highest Value</option>
            <option value="amount-asc">🪙 Lowest Value</option>
          </select>
          
          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 cursor-pointer shadow-sm transition-all"
          >
            <option value="ALL">⭐ All Statuses</option>
            <option value="PAID">🟢 PAID Invoices</option>
            <option value="PENDING">🟡 PENDING Invoices</option>
          </select>

          {/* View Density Toggle Button */}
          <button
            type="button"
            onClick={() => setViewDensity(prev => prev === 'compact' ? 'comfortable' : 'compact')}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 shadow-sm transition-all cursor-pointer hover:text-purple-700 hover:border-purple-200 flex items-center gap-1.5"
          >
            <ListRestart className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">{viewDensity === 'compact' ? 'Compact' : 'Comfortable'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedBills.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center bg-rose-200 text-rose-800 w-8 h-8 rounded-full font-bold text-sm">
                {selectedBills.size}
              </span>
              <span className="text-sm font-bold text-rose-900">
                Receipts Selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedBills(new Set())}
                className="px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded-xl transition"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-[0_0_10px_rgba(225,29,72,0.3)] transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY ITEMS RESULTS CODES */}
      {processedBills.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] border-2 border-slate-100 shadow-[0_12px_45px_rgba(0,0,0,0.02)] py-16 sm:py-24 text-center select-none w-full max-w-2xl mx-auto my-6 animate-fade-in">
          {/* Decorative radial glows */}
          <div className="absolute top-0 right-12 w-28 h-28 bg-purple-200/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-4 left-12 w-24 h-24 bg-fuchsia-200/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-100 h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-purple-150">
             <FileSpreadsheet className="h-8 w-8 text-purple-600 stroke-[1.75] animate-pulse-subtle" />
          </div>
          
          <h4 className="text-lg font-black text-slate-800 tracking-tight">No invoices collected in archives</h4>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
            {bills.length === 0 
              ? "You haven't generated any transactional billing records yet. Initialize your shop's very first sale in the main console immediately." 
              : "We found no matches matching your active registration filters. Refine some of your search tags or date limits."}
          </p>

          {bills.length > 0 && (
            <div className="pt-6">
              <button
                type="button"
                onClick={() => {
                  // Find a way to reset filters or refresh
                  const resetBtn = document.querySelector('[title="Reset Filters"]') as HTMLButtonElement;
                  if (resetBtn) resetBtn.click();
                }}
                className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 rounded-xl text-xs font-black text-purple-700 hover:text-purple-900 transition-all duration-300 cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-transparent md:bg-white md:border border-slate-200 md:rounded-3xl md:shadow-lg overflow-hidden">
          {/* Mobile Stacked Card List View: hidden on desktop/tablet, visible on mobile */}
          <div className="md:hidden space-y-4">
            {processedBills.map((bill) => (
              <div 
                key={bill.billId}
                onClick={() => onViewBill(bill)}
                className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-150 hover:border-purple-300 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-lg hover:shadow-purple-100/10 active:scale-[0.99] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedBills.has(bill.billId)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelection(bill.billId);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-5 h-5 rounded-md border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="font-mono font-black text-purple-900 text-sm">
                      {bill.invoiceNumber}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                    bill.paymentStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-300/40'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300/40'
                  }`}>
                    {bill.paymentStatus || 'PAID'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 text-sm truncate">{bill.customerDetails.name}</div>
                    {bill.customerDetails.phone && (
                      <div className="text-xs text-slate-500 font-bold mt-1 font-mono">{bill.customerDetails.phone}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-purple-950 text-base font-mono">
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold mt-1">
                      {new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    {!bill.isSynced && (
                      <span className="text-[10px] text-sky-600 font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span> Offline Mode
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewBill(bill); }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition"
                    >
                      View
                    </button>
                    {onEditBill && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditBill(bill); }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-650 font-extrabold rounded-xl text-xs transition flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, bill.billId, bill.invoiceNumber)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-xl text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet Table view: hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200">
                  <th className="py-4.5 pl-6 pr-2 w-[40px]">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={processedBills.length > 0 && selectedBills.size === processedBills.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBills(new Set(processedBills.map(b => b.billId)));
                          } else {
                            setSelectedBills(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </div>
                  </th>
                  <th className="py-4.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Code</th>
                  <th className="py-4.5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                  <th className="py-4.5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Date</th>
                  <th className="py-4.5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total Value</th>
                  <th className="py-4.5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4.5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90 bg-white">
                <AnimatePresence>
                {processedBills.map((bill) => {
                  const rowPadding = viewDensity === 'compact' ? 'py-2' : 'py-4.5';
                  return (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={bill.billId} 
                    onClick={() => onViewBill(bill)}
                    className={`hover:bg-purple-50/15 transition duration-150 cursor-pointer group ${selectedBills.has(bill.billId) ? 'bg-purple-50/40' : 'even:bg-slate-50/10'}`}
                  >
                    {/* Checkbox */}
                    <td className={`${rowPadding} pl-6 pr-2`}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedBills.has(bill.billId)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(bill.billId);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </div>
                    </td>

                    {/* Invoice ID */}
                    <td className={`${rowPadding} px-3`}>
                      <div className={`font-mono font-black text-purple-900 ${viewDensity === 'compact' ? 'text-xs' : 'text-sm'}`}>
                        {bill.invoiceNumber}
                      </div>
                      {!bill.isSynced && (
                         <div className="text-[10px] text-sky-600 font-bold mt-0.5 flex items-center gap-1">
                           <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span> Unsynced Offline
                         </div>
                      )}
                    </td>

                    {/* Client Name & Phone */}
                    <td className={`${rowPadding} px-6`}>
                      <div className={`font-black ${viewDensity === 'compact' ? 'text-xs' : 'text-sm'} text-slate-850`}>
                        {bill.customerDetails.name}
                      </div>
                      {bill.customerDetails.phone && viewDensity === 'comfortable' && (
                        <div className="text-xs text-slate-450 font-normal font-mono mt-0.5">{bill.customerDetails.phone}</div>
                      )}
                    </td>

                    {/* Creation Date */}
                    <td className={`${rowPadding} px-6`}>
                      <div className={`${viewDensity === 'compact' ? 'text-xs' : 'text-sm'} font-semibold text-slate-700`}>
                        {new Date(bill.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}
                      </div>
                    </td>

                    {/* Grand Total */}
                    <td className={`${rowPadding} px-6`}>
                      <div className={`font-black text-slate-900 ${viewDensity === 'compact' ? 'text-sm' : 'text-[15px]'} font-mono`}>
                        <span className="font-semibold text-slate-400 text-xs mr-0.5">₹</span>
                        {bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Payment Badge */}
                    <td className={`${rowPadding} px-6 text-center`}>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        bill.paymentStatus === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-300/40'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300/40'
                      }`}>
                        {bill.paymentStatus || 'PAID'}
                      </span>
                    </td>

                    {/* Action buttons list */}
                    <td className={`${rowPadding} px-6 text-right`}>
                      <div className="flex items-center justify-end space-x-1 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onViewBill(bill); }}
                          className={`${viewDensity === 'compact' ? 'p-1.5' : 'p-2'} rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors`}
                          title="View Receipt"
                        >
                          <Eye className={viewDensity === 'compact' ? 'h-4 w-4' : 'h-4.5 w-4.5'} />
                        </button>
                        {onEditBill && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditBill(bill); }}
                            className={`${viewDensity === 'compact' ? 'p-1.5' : 'p-2'} rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors`}
                            title="Edit"
                          >
                            <Pencil className={viewDensity === 'compact' ? 'h-4 w-4' : 'h-4.5 w-4.5'} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, bill.billId, bill.invoiceNumber)}
                          className={`${viewDensity === 'compact' ? 'p-1.5' : 'p-2'} rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors`}
                          title="Delete Record"
                        >
                          <Trash2 className={viewDensity === 'compact' ? 'h-4 w-4' : 'h-4.5 w-4.5'} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )})}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
