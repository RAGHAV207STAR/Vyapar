/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  MapPin, 
  Building, 
  Receipt, 
  Pencil, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBilling } from '../context/BillingContext';
import { Customer, CustomerDetails } from '../types';
import { 
  formatOwnerName, 
  formatMobileNumber, 
  validateMobileNumber, 
  formatAddress, 
  formatGSTNumber, 
  validateGSTNumber, 
  handleEnterToNext 
} from '../utils/validation';

interface CustomerDirectoryProps {
  onCreateInvoice: (customer: CustomerDetails) => void;
}

export default function CustomerDirectory({ onCreateInvoice }: CustomerDirectoryProps) {
  const { customers, bills, saveCustomer, deleteCustomer, showConfirm, showToast } = useBilling();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-dues' | 'settled'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Helper: Calculate dynamic stats for a single customer
  const getCustomerStats = (customer: Customer) => {
    const custPhone = customer.phone?.trim();
    const custName = customer.name?.trim().toLowerCase();

    // Filter bills belonging to this customer
    const customerBills = bills.filter(b => {
      const bPhone = b.customerDetails?.phone?.trim();
      const bName = b.customerDetails?.name?.trim()?.toLowerCase();
      
      if (custPhone && bPhone) {
        return bPhone === custPhone;
      }
      return bName === custName;
    });

    const totalSales = customerBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPaid = customerBills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const totalDue = customerBills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
    const totalBillsCount = customerBills.length;

    return {
      totalSales,
      totalPaid,
      totalDue,
      totalBillsCount
    };
  };

  // Dynamic calculations for Directory Overview (Global Stats)
  const directoryStats = React.useMemo(() => {
    let totalDuesSum = 0;
    let activeCustomersCount = 0;
    let totalSalesSum = 0;

    customers.forEach(c => {
      const { totalDue, totalBillsCount, totalSales } = getCustomerStats(c);
      totalDuesSum += totalDue;
      totalSalesSum += totalSales;
      if (totalBillsCount > 0) {
        activeCustomersCount++;
      }
    });

    return {
      totalCustomers: customers.length,
      activeCustomers: activeCustomersCount,
      totalDues: totalDuesSum,
      totalSales: totalSalesSum
    };
  }, [customers, bills]);

  // Count per filters
  const filterCounts = React.useMemo(() => {
    let dues = 0;
    let settled = 0;
    customers.forEach(c => {
      const stats = getCustomerStats(c);
      if (stats.totalDue > 0) dues++;
      else if (stats.totalBillsCount > 0) settled++;
    });
    return { dues, settled };
  }, [customers, bills]);

  // Filter and Search Customers List
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(c => {
      const stats = getCustomerStats(c);
      
      // Filter by status
      if (filterType === 'with-dues' && stats.totalDue <= 0) return false;
      if (filterType === 'settled' && (stats.totalDue > 0 || stats.totalBillsCount === 0)) return false;

      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(searchLower) ||
        (c.phone && c.phone.includes(searchLower)) ||
        (c.address && c.address.toLowerCase().includes(searchLower)) ||
        (c.gstNumber && c.gstNumber.toLowerCase().includes(searchLower));

      return matchesSearch;
    });
  }, [customers, bills, searchTerm, filterType]);

  // Helper to generate initials & avatar background color dynamically
  const getAvatarStyle = (name: string) => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
    
    // Consistent color based on name hash
    const colors = [
      'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'bg-rose-500/10 text-rose-600 border-rose-500/20',
      'bg-sky-500/10 text-sky-600 border-sky-500/20',
      'bg-violet-500/10 text-violet-600 border-violet-500/20',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return { initials, colorClass: colors[index] };
  };

  // Handle Edit Trigger
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || '');
    setFormAddress(customer.address || '');
    setFormGst(customer.gstNumber || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle Add Trigger
  const handleAddNewClick = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormGst('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate and Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) {
      errors.name = "Customer name is required";
    }

    if (!formPhone.trim()) {
      errors.phone = "Genuine mobile number is required";
    } else {
      const cleanPhone = formPhone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        errors.phone = "Must be a genuine 10-digit mobile number";
      } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = "Invalid format: Must start with 6-9 (genuine Indian mobile)";
      }
    }

    if (formGst.trim()) {
      if (!validateGSTNumber(formGst)) {
        errors.gstNumber = "Invalid GSTIN format (e.g. 07AAAAA1111A1Z1)";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Check for exact duplicate (name, phone, address)
    const isDuplicate = customers.some(c => 
      c.name.trim().toLowerCase() === formName.trim().toLowerCase() &&
      c.phone.trim() === formPhone.trim() &&
      c.address.trim().toLowerCase() === formAddress.trim().toLowerCase() &&
      (!editingCustomer || c.id !== editingCustomer.id)
    );

    if (isDuplicate) {
      showToast("This customer already added with the same name, mobile number, and address.", "error");
      return;
    }

    try {
      await saveCustomer({
        id: editingCustomer?.id,
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim(),
        gstNumber: formGst.trim() ? formGst.toUpperCase().trim() : undefined
      });

      showToast(
        editingCustomer 
          ? "Customer profile updated successfully!" 
          : "Customer added to directory successfully!", 
        "success"
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving customer", err);
      showToast("Failed to save customer details", "error");
    }
  };

  // Handle Delete
  const handleDeleteClick = (customer: Customer) => {
    showConfirm({
      title: "Delete Customer Profile",
      message: `Are you sure you want to delete the profile of "${customer.name}"? Historical invoice records will NOT be deleted, but contact details will be removed from the directory.`,
      confirmText: "Delete Profile",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteCustomer(customer.id);
          showToast("Customer profile deleted successfully", "success");
        } catch (err) {
          console.error("Error deleting customer", err);
          showToast("Failed to delete customer profile", "error");
        }
      }
    });
  };

  return (
    <div className="p-2 md:p-4 max-w-full w-full space-y-6">
      {/* Premium Header Container */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 text-slate-900 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-indigo-100/30 text-left border border-indigo-100/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-80 h-80 bg-sky-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100/80 border border-indigo-200/50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              <Users className="w-3.5 h-3.5" />
              Directory Manager
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 text-slate-900">
              Customer Directory
            </h1>
          </div>

          <button
            id="btn_add_customer"
            onClick={handleAddNewClick}
            className="self-start md:self-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 transition-all text-white text-xs font-black shadow-[0_4px_20px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_25px_0_rgba(79,70,229,0.4)] rounded-2xl uppercase tracking-widest cursor-pointer group active:scale-98 border border-indigo-400/20"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards (Grid of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Customers */}
        <div id="stat_total_customers" className="bg-white border border-slate-100 hover:border-slate-200/80 p-5 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group flex items-center justify-between">
          <div className="space-y-1.5 text-left min-w-0 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Saved Directory</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{directoryStats.totalCustomers}</h3>
            <span className="text-[10px] font-semibold text-slate-500 block">Registered profiles</span>
          </div>
          <div className="w-12 h-12 bg-indigo-550/[0.08] text-indigo-600 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all">
            <Users className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Active Billing */}
        <div id="stat_active_billing" className="bg-white border border-slate-100 hover:border-slate-200/80 p-5 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group flex items-center justify-between">
          <div className="space-y-1.5 text-left min-w-0 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Clients</span>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{directoryStats.activeCustomers}</h3>
            <span className="text-[10px] font-semibold text-indigo-600 block">With generated invoices</span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/[0.08] text-emerald-600 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all">
            <TrendingUp className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Total Receivables */}
        <div id="stat_total_receivables" className="bg-white border border-slate-100 hover:border-slate-200/80 p-5 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group flex items-center justify-between">
          <div className="space-y-1.5 text-left min-w-0 flex-1">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block">Outstanding Receivable</span>
            <h3 className="text-2xl font-black text-rose-600 tracking-tight truncate">₹{directoryStats.totalDues.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            <span className="text-[10px] font-semibold text-slate-500 block">Live dues balance</span>
          </div>
          <div className="w-12 h-12 bg-rose-500/[0.08] text-rose-600 border border-rose-500/20 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all">
            <CreditCard className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Cumulative Revenue */}
        <div id="stat_total_sales" className="bg-white border border-slate-100 hover:border-slate-200/80 p-5 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group flex items-center justify-between">
          <div className="space-y-1.5 text-left min-w-0 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cumulative Revenue</span>
            <h3 className="text-2xl font-black text-slate-850 tracking-tight truncate">₹{directoryStats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            <span className="text-[10px] font-semibold text-slate-500 block">Aggregate sales</span>
          </div>
          <div className="w-12 h-12 bg-indigo-550/[0.08] text-indigo-600 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all">
            <Receipt className="w-5 h-5 font-bold" />
          </div>
        </div>
      </div>

      {/* Advanced Filter, Sorting & Search Engine */}
      <div className="bg-white border border-slate-100 p-4 sm:p-5 rounded-[2rem] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="customer_search_input"
            type="text"
            placeholder="Search saved customers by name, phone, billing address, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-12 py-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-4 top-3.5 text-xs font-black text-slate-400 hover:text-slate-650 px-1.5 py-0.5 bg-slate-200/50 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tab-Pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="filter_cust_all"
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-250 flex items-center gap-2 cursor-pointer border ${
              filterType === 'all' 
                ? 'bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10' 
                : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-600'
            }`}
          >
            All Contacts
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${filterType === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500'}`}>
              {customers.length}
            </span>
          </button>
          <button
            id="filter_cust_dues"
            onClick={() => setFilterType('with-dues')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-250 flex items-center gap-2 cursor-pointer border ${
              filterType === 'with-dues' 
                ? 'bg-rose-600 border-rose-650 text-white shadow-md shadow-rose-650/15' 
                : 'bg-rose-500/[0.05] border-rose-100 hover:bg-rose-50 hover:border-rose-200 text-rose-600'
            }`}
          >
            With Dues
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${filterType === 'with-dues' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
              {filterCounts.dues}
            </span>
          </button>
          <button
            id="filter_cust_settled"
            onClick={() => setFilterType('settled')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase transition-all duration-250 flex items-center gap-2 cursor-pointer border ${
              filterType === 'settled' 
                ? 'bg-emerald-600 border-emerald-650 text-white shadow-md shadow-emerald-650/15' 
                : 'bg-emerald-500/[0.05] border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 text-emerald-600'
            }`}
          >
            Fully Settled
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${filterType === 'settled' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
              {filterCounts.settled}
            </span>
          </button>
        </div>
      </div>

      {/* Directory Grid with full width */}
      <AnimatePresence mode="popLayout">
        {filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-dashed border-slate-200/80 p-16 text-center rounded-[2.5rem] flex flex-col items-center justify-center"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <Users className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Customers Match Filter</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-md leading-relaxed">
              {searchTerm 
                ? "We couldn't locate any directory profiles matching your current search query. Try clearing the search input." 
                : "No saved customers found under this category yet! Keep creating invoices, or add your accounts manually above."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddNewClick}
                className="mt-5 bg-indigo-50 hover:bg-indigo-100 transition-all text-indigo-650 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border border-indigo-100"
              >
                Add Customer Profile Manually
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-5 w-full">
            {filteredCustomers.map((cust) => {
              const stats = getCustomerStats(cust);
              const avatar = getAvatarStyle(cust.name);

              return (
                <motion.div
                  key={cust.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-slate-100/50 hover:border-slate-200/80 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Initial Avatar */}
                        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-xs shrink-0 ${avatar.colorClass}`}>
                          {avatar.initials}
                        </div>
                        <div className="min-w-0 text-left">
                          <h4 className="text-xs font-black text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                            {cust.name}
                          </h4>
                          {cust.phone ? (
                            <a 
                              href={`tel:${cust.phone}`}
                              className="text-[10px] font-bold text-slate-400 flex items-center mt-1 hover:text-indigo-600 transition-colors"
                            >
                              <Phone className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                              {cust.phone}
                            </a>
                          ) : (
                            <span className="text-[9.5px] font-semibold text-slate-450 mt-1 block">
                              No contact details
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Payment State Badge */}
                      <div className="shrink-0">
                        {stats.totalBillsCount === 0 ? (
                          <span className="text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200/40 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                            No Invoices
                          </span>
                        ) : stats.totalDue > 0 ? (
                          <span className="text-[9px] font-bold bg-rose-500/[0.07] text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            Due
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-emerald-500/[0.07] text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 shrink-0" />
                            Settled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compact Details Bento Bar */}
                    <div className="mt-4 space-y-1.5 border-t border-slate-50 pt-3 text-left">
                      {cust.address ? (
                        <div className="flex items-start text-slate-500 text-[10px] bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 p-2.5 rounded-2xl transition-colors min-h-12">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed font-semibold text-slate-650">{cust.address}</span>
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-2xl py-3 px-2 text-center text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                          No Address Added
                        </div>
                      )}

                      {cust.gstNumber && (
                        <div className="flex items-center text-indigo-700 font-bold bg-indigo-50/50 border border-indigo-100/50 px-3 py-1.5 rounded-2xl w-max max-w-full">
                          <Building className="w-3.5 h-3.5 text-indigo-500 mr-2 shrink-0" />
                          <span className="uppercase text-[9px] tracking-wide font-mono">GSTIN: {cust.gstNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* High-fidelity Bento Financial Box */}
                    <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-100/80 rounded-[1.5rem] p-3 mt-4 grid grid-cols-3 gap-1.5 text-center transition-colors">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Invoices</span>
                        <span className="text-xs font-black text-slate-750 block">{stats.totalBillsCount}</span>
                      </div>
                      <div className="space-y-0.5 border-x border-slate-200/50">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Cumulative</span>
                        <span className="text-xs font-black text-slate-800 block">₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Receivables</span>
                        <span className={`text-xs font-black block ${stats.totalDue > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                          ₹{stats.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Action Controls */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-50 shrink-0">
                    <button
                      onClick={() => onCreateInvoice({
                        name: cust.name,
                        phone: cust.phone || '',
                        address: cust.address || '',
                        gstNumber: cust.gstNumber
                      })}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 py-2 px-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-indigo-100/30"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                    <button
                      onClick={() => handleEditClick(cust)}
                      title="Edit Profile"
                      className="p-2 border border-slate-200/70 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-2xl transition-all cursor-pointer shadow-3xs hover:-translate-y-0.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cust)}
                      title="Delete Profile"
                      className="p-2 border border-slate-200/70 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all cursor-pointer shadow-3xs hover:-translate-y-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal (Glassmorphic Backdrop & Slick Transitions) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-[2rem] border border-slate-100 max-w-md w-full shadow-2xl overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 flex items-center justify-between text-white relative border-b border-indigo-500/20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_45%)] pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 p-2.5 rounded-2xl shrink-0 shadow-lg shadow-indigo-500/5">
                    {editingCustomer ? <Pencil className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-400/90 block">
                      {editingCustomer ? "Update Directory Profile" : "New Customer Register"}
                    </span>
                    <h2 className="text-base font-extrabold text-white mt-0.5 leading-tight">
                      {editingCustomer ? `Edit Profile` : "Create Customer Account"}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-all duration-200 cursor-pointer p-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl hover:scale-105 active:scale-95 shadow-md shadow-black/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-6 space-y-5 bg-white">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Users className="w-3 h-3 text-slate-400" />
                    Customer / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Users className="w-4 h-4 opacity-70" />
                    </div>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => {
                        setFormName(formatOwnerName(e.target.value));
                        if (formErrors.name) {
                          setFormErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      onKeyDown={handleEnterToNext}
                      placeholder="Enter complete customer or company name"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50/75 border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 transition-all focus:bg-white ${
                        formErrors.name 
                          ? 'border-rose-350 focus:ring-rose-500/10 focus:border-rose-400' 
                          : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {formErrors.name && (
                    <span className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Mobile Number (WhatsApp/Call) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4 opacity-70" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => {
                        setFormPhone(formatMobileNumber(e.target.value));
                        if (formErrors.phone) {
                          setFormErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      onKeyDown={handleEnterToNext}
                      placeholder="e.g. 9876543210 (10 digits)"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50/75 border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 transition-all focus:bg-white ${
                        formErrors.phone 
                          ? 'border-rose-350 focus:ring-rose-500/10 focus:border-rose-400' 
                          : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {formErrors.phone && (
                    <span className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.phone}
                    </span>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    Billing / Shipping Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4 opacity-70" />
                    </div>
                    <textarea
                      rows={2.5}
                      value={formAddress}
                      onChange={(e) => setFormAddress(formatAddress(e.target.value))}
                      onKeyDown={handleEnterToNext}
                      placeholder="Enter customer's complete billing/shipping address details"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/75 border border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </div>

                {/* GSTIN */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Receipt className="w-3 h-3 text-slate-400" />
                    GSTIN / Corporate Tax ID (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Receipt className="w-4 h-4 opacity-70" />
                    </div>
                    <input
                      type="text"
                      value={formGst}
                      onChange={(e) => {
                        setFormGst(formatGSTNumber(e.target.value));
                        if (formErrors.gstNumber) {
                          setFormErrors(prev => ({ ...prev, gstNumber: '' }));
                        }
                      }}
                      onKeyDown={handleEnterToNext}
                      placeholder="e.g. 07AAAAA1111A1Z1"
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50/75 border rounded-2xl text-xs font-semibold uppercase focus:outline-none focus:ring-4 transition-all focus:bg-white ${
                        formErrors.gstNumber 
                          ? 'border-rose-350 focus:ring-rose-500/10' 
                          : 'border-slate-200 focus:ring-indigo-500/10 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                  {formErrors.gstNumber && (
                    <span className="text-[10px] font-semibold text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {formErrors.gstNumber}
                    </span>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-all text-slate-650 hover:text-slate-800 font-extrabold text-xs rounded-2xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-550 active:bg-indigo-700 transition-all text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    {editingCustomer ? "Update Profile" : "Create Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
