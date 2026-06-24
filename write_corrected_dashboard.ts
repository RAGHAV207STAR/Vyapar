import fs from 'fs';

try {
  // Read the active dashboard file
  const activeContent = fs.readFileSync('src/components/InventoryDashboard.tsx', 'utf8');
  const lines = activeContent.split('\n');

  // We want to slice from index 6 (line 7) onwards
  const remainingLines = lines.slice(6); // line 7 is index 6
  const remainingText = remainingLines.join('\n');

  const cleanTopHalf = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Package,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  History,
  Image as ImageIcon,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Layers,
  TrendingUp,
  X,
  Upload,
  ListRestart,
  Barcode,
  CheckCircle2,
  IndianRupee,
  Camera,
  Filter,
  Eye,
  PlusCircle,
  TrendingDown,
  Info
} from "lucide-react";
import { useInventory } from "../context/InventoryContext";
import { useBilling } from "../context/BillingContext";
import { motion, AnimatePresence } from "motion/react";
import BarcodeScannerModal from "./BarcodeScannerModal";
import { compressAndResizeImage } from "../utils/imageCompressor";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const formatStockDisplay = (qty: number, category: string) => {
  if (!qty) return '0';
  const c = (category || '').toLowerCase();
  const isPrecious = c.includes('gold') || c.includes('silver') || c.includes('diamond') || c.includes('platinum') || c.includes('jewelry') || c.includes('gem');
  
  if (isPrecious) {
    return Number(Number(qty).toFixed(4)).toString();
  }
  return Number(Number(qty).toFixed(2)).toString();
};

const exportToExcel = (products: any[]) => {
  const data = products.map(p => ({
    "Product Name": p.name,
    "SKU": p.sku || "N/A",
    "Barcode": p.barcode || "N/A",
    "Category": p.category,
    "Unit": p.unit,
    "Stock Balance": p.stock,
    "Min Stock Alert": p.minStockAlert,
    "Selling Price (₹)": p.sellingPrice,
    "Purchase Price (₹)": p.purchasePrice,
    "HSN Code": p.hsn || "N/A",
    "Supplier": p.supplierName || "N/A"
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory List");
  XLSX.writeFile(workbook, \`Inventory_Status_Report_\${new Date().toISOString().substring(0, 10)}.xlsx\`);
};

const exportToPDF = (products: any[]) => {
  const doc = new jsPDF() as any;
  doc.setFont("Helvetica", "bold");
  doc.text("INVENTORY STATUS REPORT", 14, 20);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(\`Generated on: \${new Date().toLocaleString()}\`, 14, 26);
  
  const headers = [["Product Name", "SKU", "Category", "Stock", "Unit", "Price (₹)", "Valuation (₹)"]];
  const tableData = products.map(p => [
    p.name,
    p.sku || "-",
    p.category,
    p.stock.toString(),
    p.unit,
    p.sellingPrice.toLocaleString(),
    (p.stock * p.sellingPrice).toLocaleString()
  ]);
  
  doc.autoTable({
    startY: 32,
    head: headers,
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    styles: { fontSize: 8 },
  });
  
  doc.save(\`Inventory_Report_\${new Date().toISOString().substring(0, 10)}.pdf\`);
};

export default function InventoryDashboard() {
  const { inventory, movements, isLoading, addProduct, updateProduct, deleteProduct, adjustStock } = useInventory();
  const { profile, showToast } = useBilling();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [stockStatusFilter, setStockStatusFilter] = useState("ALL"); // ALL, LOW, OUT, HEALTHY
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Sliders states
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSkuRestricted, setIsSkuRestricted] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [enableQuickScan, setEnableQuickScan] = useState(false);

  const [isAdjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [stockFormData, setStockFormData] = useState({ type: 'IN' as 'IN' | 'OUT', quantity: '', reason: '' });

  const [detailProduct, setDetailProduct] = useState<any | null>(null);

  const [isLedgerOpen, setLedgerOpen] = useState(false);
  const [ledgerDateFilter, setLedgerDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('ALL');
  const [ledgerProductFilter, setLedgerProductFilter] = useState('ALL');
  const [ledgerActionFilter, setLedgerActionFilter] = useState('ALL');

  const [draftingPOItem, setDraftingPOItem] = useState<any | null>(null);
  const [poFormData, setPoFormData] = useState({ supplierName: "", quantity: 50, unitCost: 100 });
  const [poIsSubmitting, setPoIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'Piece',
    stock: '',
    minStockAlert: '5',
    sku: '',
    barcode: '',
    sellingPrice: '',
    purchasePrice: '',
    imageUrl: '',
    supplierName: '',
    description: '',
    hsn: ''
  });

  const categoryOptions = useMemo(() => {
    const list = Array.from(new Set(inventory.map(item => item.category)));
    return list.length > 0 ? list : ["Electronics", "Groceries", "Apparel & Clothing", "Hardware", "Services"];
  }, [inventory]);

  // Form Submissions
  const handleEnterToNext = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLElement).form;
      if (form) {
        const index = Array.prototype.indexOf.call(form, e.target);
        if (index >= 0 && index < form.elements.length - 1) {
          (form.elements[index + 1] as HTMLElement).focus();
        }
      }
    }
  };

  const handleOpenEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      unit: product.unit,
      stock: String(product.stock),
      minStockAlert: String(product.minStockAlert),
      sku: product.sku || '',
      barcode: product.barcode || '',
      sellingPrice: String(product.sellingPrice),
      purchasePrice: String(product.purchasePrice || ''),
      imageUrl: product.imageUrl || '',
      supplierName: product.supplierName || '',
      description: product.description || '',
      hsn: product.hsn || '',
    });
    setIsCustomCategory(!categoryOptions.includes(product.category));
    setIsSkuRestricted(!product.sku);
    setProductModalOpen(true);
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categoryOptions[0] || 'Electronics',
      unit: 'Piece',
      stock: '',
      minStockAlert: '5',
      sku: '',
      barcode: '',
      sellingPrice: '',
      purchasePrice: '',
      imageUrl: '',
      supplierName: '',
      description: '',
      hsn: ''
    });
    setIsCustomCategory(false);
    setIsSkuRestricted(true);
    setProductModalOpen(true);
  };

  const handleOpenAdjustStock = (product: any) => {
    setSelectedProduct(product);
    setStockFormData({ type: 'IN', quantity: '', reason: '' });
    setAdjustStockModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product? This is irreversible.")) {
      try {
        await deleteProduct(id);
        showToast("Product deleted successfully", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to delete product", "error");
      }
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Product Name is required", "error");
      return;
    }
    
    const cat = formData.category.trim();
    if (!cat) {
      showToast("Category is required", "error");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: cat,
      unit: formData.unit,
      purchasePrice: Number(formData.purchasePrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStockAlert: Number(formData.minStockAlert) || 0,
      description: formData.description?.trim() || '',
      imageUrl: formData.imageUrl || '',
      sku: isSkuRestricted ? '' : formData.sku.trim(),
      barcode: formData.barcode?.trim() || '',
      hsn: formData.hsn?.trim() || '',
      supplierName: formData.supplierName?.trim() || '',
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast("Product successfully updated!", "success");
      } else {
        await addProduct(payload);
        showToast("Product successfully registered to inventory!", "success");
      }
      setProductModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save product", "error");
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = Number(stockFormData.quantity);
    if (!qty || qty <= 0) {
      showToast("Adjustment quantity must be greater than zero", "error");
      return;
    }
    if (!stockFormData.reason.trim()) {
      showToast("Reason is required", "error");
      return;
    }
    try {
      await adjustStock(
        selectedProduct.id,
        qty,
        stockFormData.reason.trim(),
        stockFormData.type,
        undefined,
        'Stock Adjustment'
      );
      showToast("Stock level successfully reconciled!", "success");
      setAdjustStockModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to adjust stock", "error");
    }
  };

  const handleIssuePOCommit = async () => {
    if (!draftingPOItem) return;
    setPoIsSubmitting(true);
    try {
      await adjustStock(
        draftingPOItem.product.id,
        poFormData.quantity,
        \`Authorization of restock PO from \${poFormData.supplierName || 'vendor'} (Cost: ₹\${poFormData.unitCost})\`,
        'IN',
        undefined,
        'Restock Order'
      );
      showToast("Restock authorization successfully logged, stock level updated!", "success");
      setDraftingPOItem(null);
    } catch (err: any) {
      showToast(err.message || "Failed to authorize inbound PO", "error");
    } finally {
      setPoIsSubmitting(false);
    }
  };

  // Memoized filters
  const filteredProducts = useMemo(() => {
    return inventory.filter(item => {
      // 1. Text Search
      const search = searchQuery.toLowerCase();
      if (search) {
        const matchesName = item.name.toLowerCase().includes(search);
        const matchesSKU = (item.sku || '').toLowerCase().includes(search);
        const matchesBarcode = (item.barcode || '').toLowerCase().includes(search);
        const matchesHSN = (item.hsn || '').toLowerCase().includes(search);
        const matchesSupplier = (item.supplierName || '').toLowerCase().includes(search);
        if (!matchesName && !matchesSKU && !matchesBarcode && !matchesHSN && !matchesSupplier) return false;
      }
      // 2. Category
      if (filterCategory !== "ALL" && item.category !== filterCategory) return false;
      // 3. Stock Status
      if (stockStatusFilter === "LOW") {
        if (item.stock > item.minStockAlert) return false;
      } else if (stockStatusFilter === "OUT") {
        if (item.stock > 0) return false;
      } else if (stockStatusFilter === "HEALTHY") {
        if (item.stock <= item.minStockAlert) return false;
      }
      return true;
    });
  }, [inventory, searchQuery, filterCategory, stockStatusFilter]);

  // Derived metrics / counts
  const totalSKUs = inventory.length;
  const lowStockCount = inventory.filter(i => i.stock <= i.minStockAlert).length;
  const outOfStockCount = inventory.filter(i => i.stock === 0).length;
  const totalStockWorth = useMemo(() => {
    return inventory.reduce((total, item) => total + (item.stock * item.sellingPrice), 0);
  }, [inventory]);

  // Pagination helpers
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const filteredLedgerMovements = useMemo(() => {
    return movements.filter(mov => {
      if (ledgerProductFilter !== "ALL" && mov.productId !== ledgerProductFilter) return false;
      if (ledgerActionFilter !== "ALL" && mov.actionType !== ledgerActionFilter) return false;
      if (ledgerDateFilter !== "ALL") {
        const dateObj = new Date(mov.date);
        const now = new Date();
        if (ledgerDateFilter === "TODAY") {
          const today = new Date();
          today.setHours(0,0,0,0);
          if (dateObj < today) return false;
        } else if (ledgerDateFilter === "THIS_WEEK") {
          const pastWeek = new Date();
          pastWeek.setDate(now.getDate() - 7);
          if (dateObj < pastWeek) return false;
        } else if (ledgerDateFilter === "THIS_MONTH") {
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (dateObj < thisMonth) return false;
        }
      }
      return true;
    });
  }, [movements, ledgerProductFilter, ledgerActionFilter, ledgerDateFilter]);

  return (
    <div className="flex-1 bg-slate-50/55 min-h-screen p-4 md:p-8 space-y-6">
      
      {/* Dynamic Inventory Matrix Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-rose-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span> Live Catalog Metrics
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            <Layers className="w-7 h-7 text-indigo-600 stroke-[2.5]" />
            Stocks Control Center
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Supervise stock balance adjustments, SKU registrations, and automated reorder drafting logs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLedgerOpen(true)}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl text-xs font-black shadow-sm transition-all border border-slate-250 flex items-center gap-2 cursor-pointer outline-none uppercase tracking-wider"
          >
            <History className="w-4 h-4 text-slate-500 shrink-0" />
            Stock Ledger
          </button>
          
          <button
            onClick={handleOpenNewProduct}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 border border-indigo-500/30 cursor-pointer outline-none uppercase tracking-wider"
          >
            <Plus className="w-5 h-5 text-white stroke-[2.5] shrink-0" />
            Add SKU Item
          </button>
        </div>
      </div>

      {/* Bento Scorecards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50/70 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Registered items</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalSKUs} SKUs</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50/70 border border-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Asset Valuation</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">₹{totalStockWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50/70 border border-rose-100 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Low Stock alert</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block flex items-center gap-1.5">
              {lowStockCount} items
              {lowStockCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-amber-50/70 border border-amber-100 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Out of Stock</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">{outOfStockCount} items</span>
          </div>
        </div>
      </div>

      {/* Control Filters Area */}
      <div className="bg-white border border-slate-200/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Dynamic Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Name, SKU, Barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-bold transition-all outline-none text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category selection */}
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none cursor-pointer select-none transition-colors"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* In-Stock Limits selector */}
            <select
              value={stockStatusFilter}
              onChange={e => { setStockStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold outline-none cursor-pointer select-none transition-colors"
            >
              <option value="ALL">All Stocks Level</option>
              <option value="LOW">Low Stock alert limits</option>
              <option value="OUT">Out of Stock</option>
              <option value="HEALTHY">In Stock (Healthy)</option>
            </select>

            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 ml-auto md:ml-0">
              <button
                onClick={() => exportToExcel(filteredProducts)}
                title="Export list to Excel spreadsheet"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 text-slate-500 transition cursor-pointer outline-none"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => exportToPDF(filteredProducts)}
                title="Export list to PDF Catalog"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 text-slate-500 transition cursor-pointer outline-none"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Database Presentation Table / Card container adaptively */}
      <div className="bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 stroke-[3]" />
            Fetching product catalogs matrices...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
            <h3 className="text-slate-800 font-extrabold text-sm mt-4">No matching products found</h3>
            <p className="text-slate-400 text-xs mt-1">Try rewriting your search keyword or relaxing filter options.</p>
          </div>
        ) : (
          <>
            {/* Desktop Presentation Table view of list */}
            <div className="hidden lg:block w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                  <tr>
                    <th className="py-4.5 px-6">Product catalog Name</th>
                    <th className="py-4.5 px-4">Identification SKU</th>
                    <th className="py-4.5 px-4 text-center text-slate-400 font-black">Stock limits status</th>
                    <th className="py-4.5 px-5 text-right">In-Stock Balance</th>
                    <th className="py-4.5 px-5 text-right">Selling Price</th>
                    <th className="py-4.5 px-6 text-center">Catalog Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {paginatedProducts.map(item => {
                    const isLowStock = item.stock <= item.minStockAlert;
                    const isOutOfStock = item.stock === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400 stroke-[2]" />
                              )}
                            </div>
                            <div>
                              <button
                                onClick={() => setDetailProduct(item)}
                                className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 transition truncate block max-w-xs text-left cursor-pointer outline-none animate-none"
                              >
                                {item.name}
                              </button>
                              <span className="text-[10px] text-slate-450 font-black tracking-wide uppercase">{item.category}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 border border-slate-200 py-0.5 px-1.5 rounded-md inline-block">
                            {item.sku || '-'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200">
                              OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
                              LOW STOCK LIMIT
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-250">
                              HEALTHY STOCK
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-5 text-right font-mono">
                          <span className={\`font-black text-sm leading-none \${isLowStock ? 'text-rose-600' : 'text-slate-900'}\`}>
                            {formatStockDisplay(item.stock, item.category)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-extrabold ml-1 uppercase">{item.unit}</span>
                        </td>

                        <td className="py-3 px-5 text-right font-black font-mono text-xs text-slate-900">
                          ₹{item.sellingPrice.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-6">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjustStock(item)}
                              title="Sync Adjust stock level manually"
                              className="p-1 px-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 transition cursor-pointer select-none"
                            >
                              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            <button
                              onClick={() => setDraftingPOItem({ product: item })}
                              title="Draft replenishing PO"
                              className="p-1 px-1.5 rounded-lg bg-[#f0f4ff] text-[#4f4ec0] hover:bg-indigo-100 border border-[#b8b3ff] transition cursor-pointer select-none"
                            >
                              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            <button
                              onClick={() => handleOpenEditProduct(item)}
                              title="Edit Item attribute"
                              className="p-1 px-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-800 border border-slate-200 transition cursor-pointer select-none"
                            >
                              <Edit className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              title="Deregister item completely"
                              className="p-1 px-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-150 transition cursor-pointer select-none"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Adaptive Listing Cards Grid */}
            <div className="lg:hidden p-4 space-y-3.5">
              {paginatedProducts.map(item => {
                const isLowStock = item.stock <= item.minStockAlert;
                const isOutOfStock = item.stock === 0;

                return (
                  <div key={item.id} className="p-4 bg-white border border-slate-200/60 rounded-2xl flex flex-col justify-between shadow-sm gap-4 transition-all">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200/60 overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-6 h-6 text-slate-400 stroke-[1.5]" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setDetailProduct(item)}
                          className="font-black text-slate-900 text-sm leading-tight text-left block w-full truncate cursor-pointer uppercase outline-none"
                        >
                          {item.name}
                        </button>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wide leading-none">{item.category}</span>
                          <span className="text-[9px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 font-extrabold rounded px-1">{item.sku || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 py-3 border-y border-slate-100">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">In-Stock Balance</span>
                        <p className={\`text-base font-black font-mono leading-none mt-1 \${isLowStock ? 'text-rose-600' : 'text-slate-900'}\`}>
                          {formatStockDisplay(item.stock, item.category)} <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Unit Price (retail)</span>
                        <p className="text-base font-black font-mono leading-none text-slate-900 mt-1">
                          ₹{item.sellingPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        {isOutOfStock ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-150">
                            OUT
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-150">
                            LOW ALERT
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-150">
                            HEALTHY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAdjustStock(item)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-lg text-[10px] uppercase border border-slate-250 transition cursor-pointer outline-none"
                        >
                          Manual Adjustment
                        </button>
                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[10px] uppercase transition cursor-pointer outline-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-55 hover:text-rose-700 rounded-lg transition border border-rose-100 cursor-pointer outline-none shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination footer bar */}
            <div className="px-6 py-4.5 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs font-semibold select-none">
              <span className="text-slate-450 font-black uppercase">Showing Page {currentPage} of {totalPages} ({filteredProducts.length} filtered items)</span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer outline-none"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-650" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer outline-none"
                >
                  <ChevronRight className="w-4 h-4 text-slate-650" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 1. Add/Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10">
                  <Plus className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                    {editingProduct ? 'Edit Catalog Attribute' : 'Register New Product'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">Define specifications and inventory metrics</p>
                </div>
              </div>
              
              <button
                onClick={() => setProductModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition outline-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-8 space-y-8 select-none max-h-[60vh] overflow-y-auto">
                
                {/* Embedded Quick Scan segment */}
` + remainingText;

  fs.writeFileSync('src/components/InventoryDashboard.tsx', cleanTopHalf, 'utf8');
  console.log('Corrected dashboard written successfully!');
} catch (e: any) {
  console.log('Error:', e.message);
}
