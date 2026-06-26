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

    if (formPhone.trim()) {
      const cleanPhone = formPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 12) {
        errors.phone = "Invalid phone number (must be 10-12 digits)";
      }
    }

    if (formGst.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(formGst.toUpperCase().trim())) {
        errors.gstNumber = "Invalid GSTIN format (e.g. 07AAAAA1111A1Z1)";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
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
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center">
            <Users id="customers_icon" className="w-6 h-6 text-indigo-600 mr-2" />
            Customers
          </h1>
        </div>
        <button
          id="btn_add_customer"
          onClick={handleAddNewClick}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Customer
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div id="stat_total_customers" className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Saved Directory</span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{directoryStats.totalCustomers}</h3>
            <span className="text-[10px] font-medium text-slate-500">Registered customers</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Billing */}
        <div id="stat_active_billing" className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Active Clients</span>
            <h3 className="text-lg font-extrabold text-slate-800 mt-0.5">{directoryStats.activeCustomers}</h3>
            <span className="text-[10px] font-medium text-indigo-600">Generated invoices</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Receivables */}
        <div id="stat_total_receivables" className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-500/80 tracking-wider uppercase">Total Accounts Receivable</span>
            <h3 className="text-lg font-extrabold text-red-600 mt-0.5">₹{directoryStats.totalDues.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] font-medium text-slate-500">Live outstanding balance</span>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Total Sales */}
        <div id="stat_total_sales" className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cumulative Revenue</span>
            <h3 className="text-lg font-extrabold text-indigo-950 mt-0.5">₹{directoryStats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[10px] font-medium text-slate-500">Aggregate customer sales</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filtering Area */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="customer_search_input"
            type="text"
            placeholder="Search saved customers by name, phone, address, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <button
            id="filter_cust_all"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            All Customers
          </button>
          <button
            id="filter_cust_dues"
            onClick={() => setFilterType('with-dues')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'with-dues' 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'bg-red-50 hover:bg-red-100/80 text-red-600'
            }`}
          >
            With Outstanding Dues
          </button>
          <button
            id="filter_cust_settled"
            onClick={() => setFilterType('settled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filterType === 'settled' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-600'
            }`}
          >
            Fully Settled
          </button>
        </div>
      </div>

      {/* Customers List / Grid */}
      <AnimatePresence mode="popLayout">
        {filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-dashed border-slate-200/80 p-12 text-center rounded-2xl flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-slate-700">No Customers Found</h3>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm">
              {searchTerm 
                ? "We couldn't find any customers matching your search criteria. Try clarifying your input." 
                : "No saved customers yet! Customers are automatically saved here when you create bills, or you can add them manually."}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddNewClick}
                className="mt-4 bg-indigo-50 hover:bg-indigo-100/80 transition-colors text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-bold"
              >
                Add Customer Profile Manually
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredCustomers.map((cust) => {
              const stats = getCustomerStats(cust);
              return (
                <motion.div
                  key={cust.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col justify-between hover:border-slate-200 transition-all group"
                >
                  <div>
                    {/* Header: Name and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">
                          {cust.name}
                        </h4>
                        {cust.phone ? (
                          <a 
                            href={`tel:${cust.phone}`}
                            className="text-[10px] font-medium text-slate-500 flex items-center mt-1 hover:text-indigo-600 transition-colors"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            {cust.phone}
                          </a>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 mt-1 block">
                            No contact details
                          </span>
                        )}
                      </div>

                      {/* Status indicator badge (dynamic dues) */}
                      {stats.totalBillsCount === 0 ? (
                        <span className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full shrink-0">
                          No Bills
                        </span>
                      ) : stats.totalDue > 0 ? (
                        <span className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          ₹{stats.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Due
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          Settled
                        </span>
                      )}
                    </div>

                    {/* Address & GSTIN */}
                    <div className="mt-3.5 space-y-1.5 border-t border-slate-50 pt-3 text-[10px]">
                      {cust.address && (
                        <div className="flex items-start text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 mr-1.5 shrink-0 mt-0.5" />
                          <span className="truncate-2-lines leading-relaxed">{cust.address}</span>
                        </div>
                      )}
                      {cust.gstNumber && (
                        <div className="flex items-center text-slate-600 font-semibold bg-indigo-50/40 border border-indigo-100/30 px-2 py-1 rounded-lg w-max max-w-full">
                          <Building className="w-3 h-3 text-indigo-500 mr-1.5 shrink-0" />
                          <span className="uppercase text-[9px]">GSTIN: {cust.gstNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Financial Overview */}
                    <div className="bg-slate-50/70 rounded-xl p-3 mt-4 grid grid-cols-3 gap-1.5 text-center">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Bills</span>
                        <span className="text-xs font-bold text-slate-700 mt-0.5 block">{stats.totalBillsCount}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
                        <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">₹{stats.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
                        <span className={`text-xs font-extrabold mt-0.5 block ${stats.totalDue > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          ₹{stats.totalDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-slate-50 shrink-0">
                    <button
                      onClick={() => onCreateInvoice({
                        name: cust.name,
                        phone: cust.phone || '',
                        address: cust.address || '',
                        gstNumber: cust.gstNumber
                      })}
                      className="flex-1 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 py-1.5 px-3 rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 mr-1" />
                      Create Invoice
                    </button>
                    <button
                      onClick={() => handleEditClick(cust)}
                      title="Edit Customer"
                      className="p-1.5 border border-slate-200/60 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cust)}
                      title="Delete Customer"
                      className="p-1.5 border border-slate-200/60 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 max-w-md w-full shadow-xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-indigo-950 px-5 py-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    {editingCustomer ? "Update Profile" : "Register Profile"}
                  </h3>
                  <h2 className="text-sm font-bold text-white mt-0.5">
                    {editingCustomer ? `Edit Customer: ${editingCustomer.name}` : "Add New Customer Contact"}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-indigo-200 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Customer / Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    placeholder="Enter customer or corporate name"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 ${
                      formErrors.name 
                        ? 'border-red-300 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.name && (
                    <span className="text-[9px] font-semibold text-red-500 mt-1 block">{formErrors.name}</span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mobile Number (WhatsApp/Call)
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 ${
                      formErrors.phone 
                        ? 'border-red-300 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.phone && (
                    <span className="text-[9px] font-semibold text-red-500 mt-1 block">{formErrors.phone}</span>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Billing/Shipping Address
                  </label>
                  <textarea
                    rows={2}
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Enter complete customer physical address"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    GSTIN / Corporate Tax ID
                  </label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => {
                      setFormGst(e.target.value);
                      if (formErrors.gstNumber) {
                        setFormErrors(prev => ({ ...prev, gstNumber: '' }));
                      }
                    }}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 ${
                      formErrors.gstNumber 
                        ? 'border-red-300 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.gstNumber && (
                    <span className="text-[9px] font-semibold text-red-500 mt-1 block">{formErrors.gstNumber}</span>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                  >
                    {editingCustomer ? "Update Profile" : "Add Customer"}
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
