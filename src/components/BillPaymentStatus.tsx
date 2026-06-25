/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  IndianRupee, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Send, 
  Edit3, 
  X, 
  Check, 
  Copy, 
  ArrowUpDown, 
  Calendar,
  Eye,
  CreditCard
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { useFinancial } from '../context/FinancialContext';
import { Bill } from '../types';

interface BillPaymentStatusProps {
  onViewBill: (bill: Bill) => void;
  onNavigate: (tab: string) => void;
}

export default function BillPaymentStatus({ onViewBill, onNavigate }: BillPaymentStatusProps) {
  const { bills, updateBillPayment, showToast } = useBilling();
  const { addTransaction } = useFinancial();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'DUE_DESC' | 'DUE_ASC'>('DATE_DESC');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Selected bill for receiving dynamic partial/full payments
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentModeInput, setPaymentModeInput] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD'>('CASH');
  const [paymentStatusInput, setPaymentStatusInput] = useState<'PAID' | 'PENDING' | 'OVERDUE'>('PAID');

  // Selected bill for generating payment reminder message
  const [reminderBill, setReminderBill] = useState<Bill | null>(null);

  // Financial Metrics Calculation
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalCollected = 0;
    let totalDues = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    bills.forEach(bill => {
      totalSales += bill.totalAmount || 0;
      totalCollected += bill.paidAmount || 0;
      totalDues += bill.balanceAmount || 0;

      if (bill.paymentStatus === 'PAID' || bill.balanceAmount <= 0) {
        paidCount++;
      } else if (bill.paymentStatus === 'OVERDUE') {
        overdueCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalSales,
      totalCollected,
      totalDues,
      paidCount,
      pendingCount,
      overdueCount
    };
  }, [bills]);

  // Date Filtering Helper
  const isWithinDateRange = (itemDateStr: string, range: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => {
    if (range === 'ALL') return true;
    const itemDate = new Date(itemDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (range === 'TODAY') {
      const compareDate = new Date(itemDateStr);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === today.getTime();
    }

    if (range === 'WEEK') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      return itemDate >= oneWeekAgo;
    }

    if (range === 'MONTH') {
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      return itemDate >= oneMonthAgo;
    }

    return true;
  };

  // Filter & Sort Logic
  const filteredAndSortedBills = useMemo(() => {
    return bills
      .filter(bill => {
        // 1. Search term (Invoice, Customer Name, Phone)
        const matchSearch = 
          bill.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bill.customerDetails.phone.includes(searchTerm);

        // 2. Status Filter
        const billStatus = (bill.balanceAmount === 0) ? 'PAID' : (bill.paymentStatus || 'PENDING');
        const matchStatus = statusFilter === 'ALL' || billStatus === statusFilter;

        // 3. Date Filter
        const matchDate = isWithinDateRange(bill.invoiceDate || bill.createdAt, dateFilter);

        return matchSearch && matchStatus && matchDate;
      })
      .sort((a, b) => {
        if (sortBy === 'DATE_DESC') {
          return new Date(b.invoiceDate || b.createdAt).getTime() - new Date(a.invoiceDate || a.createdAt).getTime();
        }
        if (sortBy === 'DATE_ASC') {
          return new Date(a.invoiceDate || a.createdAt).getTime() - new Date(b.invoiceDate || b.createdAt).getTime();
        }
        if (sortBy === 'DUE_DESC') {
          return (b.balanceAmount || 0) - (a.balanceAmount || 0);
        }
        if (sortBy === 'DUE_ASC') {
          return (a.balanceAmount || 0) - (b.balanceAmount || 0);
        }
        return 0;
      });
  }, [bills, searchTerm, statusFilter, sortBy, dateFilter]);

  // Open transaction recorder
  const handleOpenPaymentModal = (bill: Bill) => {
    setSelectedBill(bill);
    // Suggest clearing the full remaining balance
    setPaymentAmount(bill.balanceAmount.toString());
    setPaymentStatusInput(bill.balanceAmount > 0 ? 'PAID' : 'PAID');
    setPaymentModeInput('CASH');
  };

  // Submit payment recorder
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast("Please enter a valid collectable amount.", "error");
      return;
    }

    // Determine total amount previously paid + new payment amount
    const newlyCollected = parsedAmount;
    
    // Total aggregate paid sum cannot exceed the total amount of the invoice
    // Wait, let's understand if paymentAmount input represents:
    // A: The NEW total total paidAmount (i.e. we update it directly)
    // B: Or just incremental? The context signature:
    // updateBillPayment(billId, paidAmount, status)
    // Here `paidAmount` argument in updateBillPayment updates the field directly:
    // bill.paidAmount = paidAmount.
    // So the input should be the total paid amount!
    // Let's make it clear in the UI:
    // User can select "Receive incremental amount" or "Set Total Collected Amount".
    // Alternatively, we let them input the "New Payment Received" and we calculate the total:
    // Total New Paid Amount = selectedBill.totalAmount - remainingBalance + dynamicInput
    // Wait, the bill total is selectedBill.totalAmount. 
    // If they receive an incremental payment of `newlyCollected`, the new absolute `paidAmount` registered is:
    // `selectedBill.paidAmount + newlyCollected`.
    // Let's verify. Yes, let's calculate:
    const newTotalPaid = Math.min(selectedBill.totalAmount, selectedBill.paidAmount + newlyCollected);
    const newBalance = Math.max(0, selectedBill.totalAmount - newTotalPaid);

    // If new balance is 0, status must be PAID. Otherwise use status input.
    const finalStatus = newBalance === 0 ? 'PAID' : paymentStatusInput;

    try {
      await updateBillPayment(selectedBill.billId, newTotalPaid, finalStatus);
      
      if (newlyCollected > 0 && selectedBill.customerDetails) {
        try {
          await addTransaction({
            transactionType: 'customer_payment',
            category: 'Payment Received',
            amount: newlyCollected,
            source: 'Customer Payment',
            referenceId: selectedBill.invoiceNumber,
            notes: `Received via ${paymentModeInput} from ${selectedBill.customerDetails.name}`,
            transactionDate: new Date().toISOString().split('T')[0]
          });
        } catch (e) {
          console.error("Failed adding payment transaction", e);
        }
      }

      showToast(`Payment of ₹${newlyCollected.toLocaleString("en-IN")} successfully recorded, updated Invoice ${selectedBill.invoiceNumber}`, "success");
      setSelectedBill(null);
    } catch (err) {
      showToast("Error updating ledger records.", "error");
    }
  };

  // Pre-generate professional reminder text
  const reminderMessage = useMemo(() => {
    if (!reminderBill) return '';
    return `Dear ${reminderBill.customerDetails.name},\nThis is a friendly payment reminder regarding Outstanding Invoice #${reminderBill.invoiceNumber} dated ${reminderBill.invoiceDate}.\n\n• Invoice Total: ₹${reminderBill.totalAmount.toLocaleString("en-IN")}\n• Already Paid: ₹${reminderBill.paidAmount.toLocaleString("en-IN")}\n• Balance Outstanding: ₹${reminderBill.balanceAmount.toLocaleString("en-IN")}\n\nKindly clear the pending balance at your earliest convenience. Thank you for your business.`;
  }, [reminderBill]);

  const copyReminderToClipboard = () => {
    if (!reminderMessage) return;
    navigator.clipboard.writeText(reminderMessage);
    showToast("Reminder template copied to clipboard!", "success");
    setReminderBill(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100 mb-4 text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600 animate-pulse-subtle" />
            Bill Payment Status
          </h2>
          <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 matches-welcome">
            Track customer dues and supplier payments
          </p>
          <div className="mt-2">
            <button
              onClick={() => window.location.pathname !== '/purchase-orders' && window.dispatchEvent(new CustomEvent('navigate', { detail: '/purchase-orders' }))}
              className="text-[10px] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
            >
              Need Procurement Details?
            </button>
          </div>
        </div>
        <button
          onClick={() => onNavigate('Create Bill')}
          className="self-start sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI: Outstanding Dues */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50/70 via-white to-red-50/30 p-5 rounded-3xl border-2 border-rose-200 hover:border-rose-450 hover:shadow-lg hover:shadow-rose-100/40 transition-all duration-300 space-y-2 group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-black text-rose-600 uppercase tracking-widest block">Outstanding Dues</span>
            <div className="w-10 h-10 rounded-xl bg-rose-105 text-rose-700 flex items-center justify-center shadow-xs shadow-rose-200/50">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-900 tracking-tight relative z-10">
            ₹{(metrics.totalDues || 0).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </h3>
        </div>

        {/* KPI: Collected Amount */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 p-5 rounded-3xl border-2 border-emerald-200 hover:border-emerald-450 hover:shadow-lg hover:shadow-emerald-100/40 transition-all duration-300 space-y-2 group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-widest block">Collected Cash</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-105 text-emerald-700 flex items-center justify-center shadow-xs shadow-emerald-200/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight relative z-10">
            ₹{(metrics.totalCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </h3>
        </div>

        {/* KPI: Total Billing Volumes */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 p-5 rounded-3xl border-2 border-blue-200 hover:border-blue-450 hover:shadow-lg hover:shadow-blue-100/40 transition-all duration-300 space-y-2 group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest block">Total Sales</span>
            <div className="w-10 h-10 rounded-xl bg-blue-105 text-blue-700 flex items-center justify-center shadow-xs shadow-blue-200/50">
              <IndianRupee className="w-5 h-5 flex-shrink-0" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight relative z-10">
            ₹{(metrics.totalSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </h3>
        </div>

        {/* KPI: Dues Ratio */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 p-5 rounded-3xl border-2 border-amber-200 hover:border-amber-450 hover:shadow-lg hover:shadow-amber-100/40 transition-all duration-300 space-y-2 group">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] sm:text-xs font-black text-amber-600 uppercase tracking-widest block">Active Defaulters</span>
            <div className="w-10 h-10 rounded-xl bg-amber-105 text-amber-700 flex items-center justify-center shadow-xs shadow-amber-200/50">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight relative z-10">
            {metrics.pendingCount + metrics.overdueCount} <span className="text-xs font-black text-slate-450 uppercase">Bills</span>
          </h3>
        </div>
      </div>

      {/* FILTER & CONTROL PANEL BAR */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 border border-slate-200/80 p-5 rounded-3xl shrink-0 flex flex-col gap-4 shadow-xl shadow-slate-100/40">
        {/* Search row & filter triggers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Searching input */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-505 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by Invoice #, name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-205 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 text-sm rounded-2xl transition-all font-semibold shadow-sm placeholder-slate-400"
            />
          </div>

          {/* Status buttons */}
          <div className="lg:col-span-4 flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 overflow-x-auto">
            {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`flex-1 min-w-[65px] text-[10px] font-black tracking-widest uppercase py-1.5 px-2 rounded-xl cursor-pointer transition-all
                  ${statusFilter === status 
                    ? 'bg-indigo-650 text-white shadow-md shadow-indigo-100' 
                    : 'text-slate-500 hover:text-slate-800 border border-transparent hover:bg-slate-50'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="lg:col-span-3 flex items-center relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 cursor-pointer shadow-sm"
            >
              <option value="ALL">🗓️ All Time Records</option>
              <option value="TODAY">⚡ Generated Today</option>
              <option value="WEEK">📅 Last 7 Days</option>
              <option value="MONTH">💼 Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Sort order options */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort Results:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'DATE_DESC', label: 'Newest Invoices' },
              { id: 'DATE_ASC', label: 'Oldest Invoices' },
              { id: 'DUE_DESC', label: 'Highest Dues first' },
              { id: 'DUE_ASC', label: 'Lowest Dues first' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id as any)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all
                  ${sortBy === option.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE DESK / CARD CONTAINER LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredAndSortedBills.length === 0 ? (
          <div className="p-10 sm:p-14 text-center relative select-none">
            <div className="absolute top-2 left-6 w-20 h-20 bg-indigo-50/20 rounded-full blur-xl pointer-events-none" />
            <div className="relative mx-auto w-14 h-14 bg-gradient-to-tr from-slate-100 to-indigo-50 border border-slate-200 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <Filter className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">No matching financial invoices found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't track active pending ledgers matching these query tags. Modify transaction search ranges, balance categories, or client parameters.
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  const searchInput = document.querySelector('input[placeholder*="Search by number"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.value = "";
                    const event = new Event('input', { bubbles: true });
                    searchInput.dispatchEvent(event);
                  }
                }}
                className="mt-4 px-4 py-1.5 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 rounded-lg text-[10px] font-black shadow-xs transition duration-200 cursor-pointer"
              >
                Clear Search Term
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop View: Ledger Grid Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-5">Invoice # / Date</th>
                    <th className="py-4 px-4">Client Name & Phone</th>
                    <th className="py-4 px-4 text-right">Total Amount</th>
                    <th className="py-4 px-4 text-right">Paid Amount</th>
                    <th className="py-4 px-4 text-right text-rose-500">Balance Due</th>
                    <th className="py-4 px-4 text-center">Payment Status</th>
                    <th className="py-4 px-5 text-right">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600 font-semibold">
                  {filteredAndSortedBills.map(bill => {
                    const hasDue = bill.balanceAmount > 0;
                    const billStatus = (bill.balanceAmount === 0) ? 'PAID' : (bill.paymentStatus || 'PENDING');

                    return (
                      <tr key={bill.billId} className="hover:bg-slate-50/40 transition-colors">
                        {/* Invoice id & Date */}
                        <td className="py-3 px-5 text-left">
                          <span className="font-extrabold text-slate-800 block text-[13px]">{bill.invoiceNumber}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">{bill.invoiceDate}</span>
                        </td>

                        {/* Customer Name */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-800 block text-[13px]">{bill.customerDetails.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{bill.customerDetails.phone}</span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-right font-bold text-slate-900 text-[13px]">
                          ₹{(bill.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total Paid */}
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 text-[13px]">
                          ₹{(bill.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Capital Outstanding balance */}
                        <td className={`py-3 px-4 text-right font-black text-[13px] ${hasDue ? 'text-rose-500' : 'text-slate-400'}`}>
                          ₹{(bill.balanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Payment Status Badges */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase
                            ${billStatus === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : billStatus === 'OVERDUE' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-black' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full 
                              ${billStatus === 'PAID' 
                                ? 'bg-emerald-500 animate-pulse' 
                                : billStatus === 'OVERDUE' 
                                  ? 'bg-rose-500 animate-bounce' 
                                  : 'bg-amber-500 animate-pulse'
                              }`} 
                            />
                            {billStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-5 text-right flex items-center justify-end gap-1.5 h-16">
                          <button
                            onClick={() => onViewBill(bill)}
                            title="View Invoices Detail"
                            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {hasDue ? (
                            <>
                              <button
                                onClick={() => handleOpenPaymentModal(bill)}
                                title="Clear dues / record payment amount"
                                className="px-2.5 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-[11px] font-extrabold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Collect</span>
                              </button>

                              <button
                                onClick={() => setReminderBill(bill)}
                                title="Pre-generate WhatsApp / SMS Reminder SMS"
                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors border border-amber-100"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="text-[10px] font-black text-slate-300 pr-3 uppercase tracking-wider">
                              Full clear
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive View: Interactive Client Cards */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredAndSortedBills.map(bill => {
                const hasDue = bill.balanceAmount > 0;
                const billStatus = (bill.balanceAmount === 0) ? 'PAID' : (bill.paymentStatus || 'PENDING');

                return (
                  <div key={bill.billId} className="p-4 space-y-3.5 hover:bg-slate-50/40 transition-colors">
                    {/* Top line details */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">{bill.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">{bill.invoiceDate}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase
                        ${billStatus === 'PAID' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                          : billStatus === 'OVERDUE' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-150' 
                            : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full 
                          ${billStatus === 'PAID' 
                            ? 'bg-emerald-500 animate-pulse' 
                            : billStatus === 'OVERDUE' 
                              ? 'bg-rose-500 animate-bounce' 
                              : 'bg-amber-500 animate-pulse'
                          }`} 
                        />
                        {billStatus}
                      </span>
                    </div>

                    {/* Customer overview block */}
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-150/70 flex flex-col gap-1.5 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Client Name:</span>
                        <span className="text-slate-950 font-extrabold">{bill.customerDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-700 select-all">{bill.customerDetails.phone || '-'}</span>
                      </div>
                    </div>

                    {/* Numeric totals row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50/40 p-2 rounded-xl border border-slate-150/55">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Total Val</span>
                        <span className="text-slate-900 font-extrabold mt-0.5 block">₹{(bill.totalAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="bg-emerald-50/10 p-2 rounded-xl border border-emerald-150/20">
                        <span className="text-[9px] text-emerald-605 uppercase tracking-wider block font-bold">Paid</span>
                        <span className="text-emerald-650 font-extrabold mt-0.5 block">₹{(bill.paidAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className={`p-2 rounded-xl border ${hasDue ? 'bg-rose-50/20 border-rose-150/20' : 'bg-slate-50/40 border-slate-150/55'}`}>
                        <span className={`text-[9px] uppercase tracking-wider block font-bold ${hasDue ? 'text-rose-505' : 'text-slate-400'}`}>Balance</span>
                        <span className={`font-black mt-0.5 block ${hasDue ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>₹{(bill.balanceAmount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Trigger Actions row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-150/50">
                      <button
                        onClick={() => onViewBill(bill)}
                        className="px-3 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      {hasDue ? (
                        <>
                          <button
                            onClick={() => handleOpenPaymentModal(bill)}
                            className="flex-1 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100/90 active:scale-95 border border-indigo-150 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>

                          <button
                            onClick={() => setReminderBill(bill)}
                            className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl cursor-pointer transition-colors border border-amber-150 flex items-center justify-center.5"
                            title="Send payment reminder template"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 text-center py-2 text-[10px] font-black text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100 uppercase tracking-widest leading-none flex items-center justify-center">
                          🎉 FULL CLear
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MODAL: Record partial or full payment */}
      {selectedBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden select-none"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Update Ledger</h3>
                <p className="text-[11px] text-slate-400 font-extrabold font-mono uppercase mt-0.5 mt-1">Invoice: {selectedBill.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Total Invoice value:</span>
                  <span className="font-extrabold text-slate-800">₹{(selectedBill.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Collected previously:</span>
                  <span className="font-extrabold text-slate-800">₹{(selectedBill.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-indigo-100/60 font-black">
                  <span className="text-rose-500 uppercase tracking-wider text-[10px]">Pending Due Balance:</span>
                  <span className="text-rose-500 text-[13px]">₹{(selectedBill.balanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Payment collect Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Collect payment Received (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold opacity-70">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={selectedBill.balanceAmount}
                    required
                    value={paymentAmount}
                    onChange={(e) => {
                      let valStr = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = valStr.split('.');
                      if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                      let numVal = Number(valStr) || 0;
                      
                      const maxLimit = selectedBill.balanceAmount || 0;
                      if (numVal > maxLimit) {
                        numVal = maxLimit;
                        valStr = maxLimit.toString();
                        // Display error feedback
                        const tooltip = document.getElementById("p-collect-limit-hint");
                        if (tooltip) {
                          tooltip.classList.remove("opacity-0");
                          setTimeout(() => tooltip.classList.add("opacity-0"), 3000);
                        }
                      }
                      setPaymentAmount(valStr);
                    }}
                    onKeyDown={(e) => {
                      if (['-', 'e', '+'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full pl-8 pr-20 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none text-slate-800 font-extrabold tracking-tight text-lg"
                  />
                  <div
                    id="p-collect-limit-hint"
                    className="absolute left-0 -top-7 bg-rose-650 bg-rose-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-md opacity-0 transition-opacity duration-300 pointer-events-none z-20 shadow-md"
                  >
                    ⚠️ Payment capped at the pending due balance (₹{selectedBill.balanceAmount?.toLocaleString('en-IN')})
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedBill.balanceAmount.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition duration-200"
                  >
                    Set Max Due
                  </button>
                </div>
                {paymentAmount && Number(paymentAmount) > 0 && (
                  <div className="text-right mt-1 text-[10px] font-black text-emerald-600 font-mono animate-fade-in">
                    Formatted: {Number(paymentAmount).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </div>
                )}
              </div>

              {/* Status input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">New Payment Status (if partial)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PENDING', label: 'Pending Dues' },
                    { id: 'OVERDUE', label: 'Overdue Dues' }
                  ].map(option => {
                    const willBeFullyPaid = parseFloat(paymentAmount) >= selectedBill.balanceAmount;
                    const disabled = willBeFullyPaid;
                    return (
                      <button
                        type="button"
                        key={option.id}
                        disabled={disabled}
                        onClick={() => setPaymentStatusInput(option.id as any)}
                        className={`text-xs font-bold py-2 px-3 border rounded-xl cursor-pointer transition-all uppercase tracking-wide
                          ${willBeFullyPaid 
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' 
                            : paymentStatusInput === option.id 
                              ? 'bg-slate-900 border-slate-900 text-white' 
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {parseFloat(paymentAmount) >= selectedBill.balanceAmount && (
                  <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider text-center mt-1">
                    🎉 Balance cleared. Invoice is auto-marked as PAID!
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  Confirm Collection
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: Copy Reminder text pre-generator */}
      {reminderBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden select-none"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Share Payment Reminder</h3>
                <p className="text-[11px] text-slate-400 font-extrabold font-mono uppercase mt-0.5">Invoice: {reminderBill.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setReminderBill(null)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Copy the pre-rendered payment reminder template below to send it to the client via WhatsApp, SMS, or Email:
              </p>

              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl relative">
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap select-all leading-normal">
                  {reminderMessage}
                </pre>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReminderBill(null)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={copyReminderToClipboard}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Template</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
