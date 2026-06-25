/**
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
  Info,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { useInventory } from "../context/InventoryContext";
import { useBilling } from "../context/BillingContext";
import { motion, AnimatePresence } from "motion/react";
import { compressAndResizeImage } from "../utils/imageCompressor";

const BarcodeScannerModal = React.lazy(() => import('./BarcodeScannerModal'));
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  XLSX.writeFile(workbook, `Inventory_Status_Report_${new Date().toISOString().substring(0, 10)}.xlsx`);
};

const exportToPDF = (products: any[]) => {
  const doc = new jsPDF() as any;
  doc.setFont("Helvetica", "bold");
  doc.text("INVENTORY STATUS REPORT", 14, 20);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
  
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
  
  autoTable(doc, {
    startY: 32,
    head: headers,
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    styles: { fontSize: 8 },
  });
  
  doc.save(`Inventory_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
};

export const STANDARD_CATEGORIES = [
  "Apparel, Clothing & Fashion",
  "Auto Parts & Accessories",
  "Baby Goods & Toys",
  "Bags, Luggage & Wallets",
  "Beauty & Cosmetics",
  "Beverages & Soft Drinks",
  "Books, Novels & Educational",
  "Building & Construction Materials",
  "Chemicals & Industrial Raw Materials",
  "Computers, Laptops & IT Hardware",
  "Dairy Products & Eggs",
  "Digital Goods & Software Subscriptions",
  "Electricals & Wiring",
  "Electronics & Gadgets",
  "Footwear, Shoes & Sandals",
  "Furniture, Bedding & Mattresses",
  "Gardening, Plants & Outdoor",
  "Gifts, Crafts & Hobbies",
  "Hardware, Tools & Fasteners",
  "Home Decor, Art & Rugs",
  "Jewelry, Watches & Eyewear",
  "Kitchenware, Cookware & Tableware",
  "Medical Supplies, Gloves & Kits",
  "Medicines, Drugs & Pharmacy",
  "Mobile Phones & Smart Accessories",
  "Office Supplies, Paper & Stationery",
  "Packaged Foods & Snacks",
  "Paints, Coatings & Varnishes",
  "Personal Care, Hygiene & Toiletries",
  "Pet Supplies, Food & Accessories",
  "Plumbing, Pipes & Sanitary Fittings",
  "Raw Fruits & Vegetables",
  "Safety, Security & Fire Equipment",
  "Services, Consultation & Labor",
  "Sports & Fitness Equipment",
  "Tobacco & Related Items"
];

export const STANDARD_UNITS = [
  "Piece (pcs)",
  "Box (box)",
  "Pack (pack)",
  "Set (set)",
  "Dozen (doz)",
  "Carton (ctn)",
  "Bag (bag)",
  "Case (cs)",
  "Pair (pr)",
  "Roll (rl)",
  "Bundle (bdl)",
  "Kilogram (kg)",
  "Gram (g)",
  "Metric Ton (ton)",
  "Pound (lbs)",
  "Ounce (oz)",
  "Litre (l)",
  "Millilitre (ml)",
  "Gallon (gal)",
  "Barrel (bbl)",
  "Meter (m)",
  "Centimeter (cm)",
  "Millimeter (mm)",
  "Inch (in)",
  "Feet (ft)",
  "Yard (yd)",
  "Square Meter (sqm)",
  "Square Feet (sqft)",
  "Cubic Meter (cbm)",
  "Cubic Feet (cft)",
  "Lakh",
  "Thousand",
  "Bottle (btl)",
  "Can (can)",
  "Sheet (sht)",
  "Coil (cl)",
  "Drum (dr)",
  "Service / Hour",
  "Job / Project"
];

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
    unit: 'Piece (pcs)',
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

  useEffect(() => {
    const pendingJson = sessionStorage.getItem('pendingNewInboundProduct');
    if (pendingJson) {
      try {
        const item = JSON.parse(pendingJson);
        setFormData({
            name: item.productName || '',
            category: item.category || 'General',
            unit: 'Piece (pcs)',
            stock: item.qty?.toString() || '0',
            minStockAlert: '5',
            sku: `SKU-${Date.now().toString().slice(-6)}`,
            barcode: '',
            sellingPrice: Math.round((item.cost || 0) * 1.5).toString(),
            purchasePrice: (item.cost || 0).toString(),
            imageUrl: '',
            supplierName: item.supplierName || '',
            description: '',
            hsn: ''
        });
        setProductModalOpen(true);
        sessionStorage.removeItem('pendingNewInboundProduct');
      } catch (err) {}
    }
  }, []);

  const categoryOptions = useMemo(() => {
    const inventoryCats = inventory.map(item => item.category).filter(Boolean);
    const combined = Array.from(new Set([...STANDARD_CATEGORIES, ...inventoryCats]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [inventory]);

  // Form Submissions
  const handleEnterToNext = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLInputElement).form;
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
        const returnData = sessionStorage.getItem('returnToPurchasesAfterAdd');
        if (returnData) {
          window.dispatchEvent(new CustomEvent('navigate', { detail: '/purchase-orders' }));
          // We don't remove it here so that AIPurchaseOrderManager can read it on mount
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setProductModalOpen(false);
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
        `Authorization of restock PO from ${poFormData.supplierName || 'vendor'} (Cost: ₹${poFormData.unitCost})`,
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
    <div className="w-full space-y-6">
      
      {/* Dynamic Inventory Matrix Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-indigo-950/15">
        {/* Abstract glowing premium design accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 text-left space-y-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Global Stock System
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-3">
              <Layers className="w-7 h-7 text-indigo-400 stroke-[2.5]" />
              Inventory Dashboard
            </h1>
            <p className="text-xs text-slate-300 font-semibold mt-1">Manage products and current stock levels. Track barcodes, opening stock, and manual quantities.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.pathname !== '/ai-replenishment' && window.dispatchEvent(new CustomEvent('navigate', { detail: '/ai-replenishment' }))} 
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              Need replenishment planning?
            </button>
            <button
              onClick={() => window.location.pathname !== '/purchase-orders' && window.dispatchEvent(new CustomEvent('navigate', { detail: '/purchase-orders' }))}
              className="text-[10px] bg-indigo-900 border border-indigo-700 hover:bg-indigo-800 text-indigo-200 font-extrabold uppercase py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              Ready to reorder inventory?
            </button>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setLedgerOpen(true)}
            className="px-5 py-3.5 bg-white/10 hover:bg-white/15 active:scale-95 text-white rounded-2xl text-xs font-black shadow-md transition-all border border-white/10 flex items-center gap-2 cursor-pointer outline-none uppercase tracking-wider backdrop-blur-xs"
          >
            <History className="w-4 h-4 text-indigo-300 shrink-0" />
            Stock Ledger
          </button>
          
          <button
            onClick={handleOpenNewProduct}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 border border-indigo-400/40 cursor-pointer outline-none uppercase tracking-wider relative group"
            id="add-item-tag-button-ref"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl blur-md opacity-25 group-hover:opacity-75 transition duration-300" />
            <Plus className="w-5 h-5 text-white stroke-[2.5] shrink-0 relative z-10" />
            <span className="relative z-10">Add Item Tag</span>
          </button>
        </div>
      </div>

      {/* Bento Scorecards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/60 hover:border-indigo-500/40 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.08)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 bg-indigo-50/70 border border-indigo-100 group-hover:bg-indigo-100/80 group-hover:border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
            <Package className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block group-hover:text-indigo-600/80 transition-colors">Registered items</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block group-hover:translate-x-0.5 transition-transform">{totalSKUs} SKUs</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/60 hover:border-emerald-500/40 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 bg-emerald-50/70 border border-emerald-100 group-hover:bg-emerald-100/80 group-hover:border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
            <IndianRupee className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block group-hover:text-emerald-600/80 transition-colors">Asset Valuation</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block group-hover:translate-x-0.5 transition-transform">₹{totalStockWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/60 hover:border-rose-500/40 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 bg-rose-50/70 border border-rose-100 group-hover:bg-rose-100/80 group-hover:border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block group-hover:text-rose-600/80 transition-colors">Low Stock alert</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
              {lowStockCount} items
              {lowStockCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/60 hover:border-amber-500/40 p-5 rounded-3xl flex items-center gap-4 shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="w-12 h-12 bg-amber-50/70 border border-amber-100 group-hover:bg-amber-100/80 group-hover:border-amber-200 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105">
            <XCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="relative z-10 text-left">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block group-hover:text-amber-600/80 transition-colors">Out of Stock</span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block group-hover:translate-x-0.5 transition-transform">{outOfStockCount} items</span>
          </div>
        </div>
      </div>

      {/* Control Filters Area */}
      <div className="bg-white border border-slate-200 hover:border-indigo-150 p-5 rounded-3xl flex flex-col gap-4 shadow-sm transition-all duration-300 hover:shadow-[0_4px_25px_rgba(99,102,241,0.03)]">
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Dynamic Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Name, SKU, Barcode..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-bold transition-all outline-none text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-600/10 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category selection */}
            <select
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold border border-slate-200 rounded-xl py-3 px-4 text-xs outline-none cursor-pointer select-none transition-all shadow-xs focus:ring-4 focus:ring-slate-100"
            >
              <option value="ALL">📂 All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* In-Stock Limits selector */}
            <select
              value={stockStatusFilter}
              onChange={e => { setStockStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-white hover:bg-slate-50 text-slate-700 font-extrabold border border-slate-200 rounded-xl py-3 px-4 text-xs outline-none cursor-pointer select-none transition-all shadow-xs focus:ring-4 focus:ring-slate-100"
            >
              <option value="ALL">📈 All Stocks Level</option>
              <option value="LOW">⚠️ Low Stock Alerts</option>
              <option value="OUT">❌ Out of Stock</option>
              <option value="HEALTHY">✅ In Stock (Healthy)</option>
            </select>

            <div className="flex items-center gap-2 border-slate-200 md:border-l md:pl-3 w-full md:w-auto justify-end md:justify-start">
              <button
                onClick={() => showToast("This feature is coming soon in the next update!", "info")}
                title="Export list to Excel spreadsheet"
                className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 transition-all cursor-pointer outline-none flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="md:hidden lg:inline">Export Excel</span>
              </button>
              
              <button
                onClick={() => showToast("This feature is coming soon in the next update!", "info")}
                title="Export list to PDF Catalog"
                className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 transition-all cursor-pointer outline-none flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-95"
              >
                <FileDown className="w-4 h-4 text-indigo-600" />
                <span className="md:hidden lg:inline">Export PDF</span>
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
                          <span className={`font-black text-sm leading-none ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
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
                        <p className={`text-base font-black font-mono leading-none mt-1 ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
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
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-indigo-50/80 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Package className="w-4.5 h-4.5 text-indigo-600 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                    {editingProduct ? 'Update Product Details' : 'New Product Registration'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Catalog Data Management</p>
                </div>
              </div>
              
              <button
                onClick={() => setProductModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition outline-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 space-y-6 select-none max-h-[60vh] overflow-y-auto">
                
                {/* Compact Barcode Quick scan segment */}
                <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-2.5 flex-1 text-left w-full">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <Barcode className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[11px] font-bold text-slate-700 tracking-wide">Quick-Fill UPC/EAN</h4>
                        <span className="text-[8px] bg-slate-200/70 text-slate-550 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">Optional</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <div className="relative flex-1 sm:w-48">
                      <input 
                        id="barcode-primary-box"
                        value={formData.barcode} 
                        onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                        onKeyDown={handleEnterToNext} 
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-lg text-xs font-mono font-bold transition-all outline-none text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 shadow-2xs" 
                        placeholder="Scan or type barcode..." 
                      />
                      <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-950 outline-none focus:ring-4 focus:ring-slate-900/10 shrink-0 cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                      title="Scan via Camera"
                    >
                      <Camera className="w-3 h-3 shrink-0" />
                      <span>Scan</span>
                    </button>
                  </div>
                </div>

              {/* GROUP 1: General Details */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">General Identity</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Name <span className="text-rose-500">*</span></label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                      placeholder="e.g., Wireless Ergonomic Keyboard" 
                    />
                  </div>

                  <div className="group/field transition-all duration-200">
                    <label className="block text-[11px] font-black text-slate-500 group-hover/field:text-slate-800 transition-colors uppercase tracking-widest mb-2">Category <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <select
                        className={`px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 group-hover/field:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm ${isCustomCategory ? 'w-1/3' : 'w-full'}`}
                        value={isCustomCategory ? 'OTHER' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === 'OTHER') {
                            setIsCustomCategory(true);
                            setFormData({ ...formData, category: '' });
                          } else {
                            setIsCustomCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                      >
                        {!categoryOptions.includes(formData.category) && !isCustomCategory && formData.category && (
                          <option value={formData.category}>{formData.category}</option>
                        )}
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="OTHER">Other...</option>
                      </select>
                      {isCustomCategory && (
                        <input 
                          required 
                          value={formData.category} 
                          onChange={e => setFormData({ ...formData, category: e.target.value })} 
                          onKeyDown={handleEnterToNext}
                          className="w-2/3 px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                          placeholder="Enter new category" 
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  <div className="group/field transition-all duration-200">
                    <label className="block text-[11px] font-black text-slate-500 group-hover/field:text-slate-800 transition-colors uppercase tracking-widest mb-2">Unit of Measure <span className="text-rose-500">*</span></label>
                    <select 
                      required 
                      value={formData.unit} 
                      onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 group-hover/field:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none cursor-pointer shadow-sm hover:border-slate-300"
                    >
                      {!STANDARD_UNITS.includes(formData.unit) && formData.unit && (
                        <option value={formData.unit}>{formData.unit}</option>
                      )}
                      {STANDARD_UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GROUP 2: Inventory Tracking */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inventory & Tracking</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                      {editingProduct ? 'Current In Stock' : 'Initial Stock Level'} <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      disabled={!!editingProduct}
                      type="number" 
                      min="0" 
                      value={formData.stock} 
                      onChange={(e) => {
                        let valStr = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, stock: valStr });
                      }} 
                      onKeyDown={(e) => {
                        if (['-', 'e', '+', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                        handleEnterToNext(e);
                      }}
                      onBlur={() => {
                        if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
                          setFormData({ ...formData, stock: "0" });
                        }
                      }}
                      className={`w-full px-4 py-3.5 border rounded-xl text-sm font-mono font-bold outline-none transition-all shadow-sm
                        ${editingProduct 
                          ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' 
                          : 'bg-white border-slate-200 focus:border-slate-900 text-slate-900 focus:ring-4 focus:ring-slate-900/5'
                        }`} 
                      placeholder="Opening Quantity" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">
                       Min Stock Alert Limit <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      value={formData.minStockAlert} 
                      onChange={(e) => {
                        let valStr = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, minStockAlert: valStr });
                      }} 
                      onKeyDown={(e) => {
                        if (['-', 'e', '+', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                        handleEnterToNext(e);
                      }}
                      onBlur={() => {
                        if (!formData.minStockAlert || isNaN(Number(formData.minStockAlert)) || Number(formData.minStockAlert) < 0) {
                          setFormData({ ...formData, minStockAlert: "5" });
                        }
                      }}
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none shadow-sm" 
                      placeholder="Trigger alert when below..." 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">SKU <span className="text-slate-400 font-semibold">(Optional)</span></label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-700 select-none transition-colors">
                        <input 
                          type="checkbox" 
                          id="sku-restrict-toggle"
                          checked={isSkuRestricted} 
                          onChange={e => {
                            setIsSkuRestricted(e.target.checked);
                            if (e.target.checked) setFormData(prev => ({ ...prev, sku: '' }));
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer transition-colors"
                        />
                        <span>Auto-generate</span>
                      </label>
                    </div>
                    <input 
                      id="sku-input-box"
                      disabled={isSkuRestricted}
                      value={isSkuRestricted ? "AUTO GENERATED" : formData.sku} 
                      onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} 
                      onKeyDown={handleEnterToNext} 
                      className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold transition-all outline-none shadow-sm ${isSkuRestricted ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-500' : 'text-slate-900 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5'}`} 
                      placeholder={isSkuRestricted ? "Input field is locked" : "Leave empty to auto-generate"} 
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 3: Pricing & Economics */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <IndianRupee className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Economics & Pricing</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Selling Price <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        min="0.1"
                        value={formData.sellingPrice} 
                        onChange={(e) => {
                          let valStr = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = valStr.split('.');
                          if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                          setFormData({ ...formData, sellingPrice: valStr });
                        }} 
                        onKeyDown={(e) => {
                          if (['-', 'e', '+'].includes(e.key)) {
                            e.preventDefault();
                          }
                          handleEnterToNext(e);
                        }}
                        onBlur={() => {
                          const num = Number(formData.sellingPrice);
                          if (isNaN(num) || num <= 0) {
                            setFormData({ ...formData, sellingPrice: "1.00" });
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-black text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Purchase / Cost Price <span className="text-slate-400 font-semibold">(Optional)</span></label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</div>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.purchasePrice} 
                        onChange={(e) => {
                          let valStr = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = valStr.split('.');
                          if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                          setFormData({ ...formData, purchasePrice: valStr });
                        }} 
                        onKeyDown={(e) => {
                          if (['-', 'e', '+'].includes(e.key)) {
                            e.preventDefault();
                          }
                          handleEnterToNext(e);
                        }}
                        onBlur={() => {
                          const num = Number(formData.purchasePrice);
                          if (isNaN(num) || num < 0) {
                            setFormData({ ...formData, purchasePrice: "0.00" });
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">HSN/SAC Tariffs Code <span className="text-slate-400 font-semibold">(Optional)</span></label>
                    <input 
                      value={formData.hsn} 
                      onChange={e => setFormData({ ...formData, hsn: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() })} 
                      onKeyDown={handleEnterToNext} 
                      className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                      placeholder="e.g. 84713010" 
                    />
                  </div>
                </div>
              </div>

              {/* GROUP 4: Extended details */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Media & Extras</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Image File Upload component */}
                    <div className="col-span-1 md:col-span-1 border-r-0 md:border-r border-slate-200/60 pr-0 md:pr-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Product Image</label>
                      {formData.imageUrl ? (
                        <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-2xl p-2 flex flex-col items-center gap-2">
                          <img 
                            src={formData.imageUrl} 
                            alt="Product preview" 
                            className="w-full h-28 object-cover rounded-xl shrink-0 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="w-full text-xs font-black text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 uppercase tracking-wider py-2 rounded-xl transition-colors cursor-pointer text-center"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div className="relative border border-dashed border-slate-300 hover:border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all bg-white cursor-pointer group h-full min-h-[140px]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressedUrl = await compressAndResizeImage(file, 200, 200, 0.85);
                                  setFormData({ ...formData, imageUrl: compressedUrl });
                                } catch (err) {
                                  showToast("Failed to process image. Try a different format.", "error");
                                }
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white text-slate-400 transition-colors shadow-sm">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black text-slate-700">Click or Drag Image</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1">JPG, PNG up to 2MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-5">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Supplier / Vendor Name <span className="text-slate-400 font-semibold">(Optional)</span></label>
                        <input 
                          value={formData.supplierName} 
                          onChange={e => setFormData({ ...formData, supplierName: e.target.value })} 
                          onKeyDown={handleEnterToNext} 
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none shadow-sm" 
                          placeholder="e.g. Apex Logistics Ltd." 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Description <span className="text-slate-400 font-semibold">(Optional)</span></label>
                        <textarea 
                          rows={3} 
                          value={formData.description} 
                          onChange={e => setFormData({ ...formData, description: e.target.value })} 
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 focus:border-slate-900 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none resize-none shadow-sm" 
                          placeholder="Add physical dimensions, materials, or special conditions..." 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="px-8 py-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setProductModalOpen(false)} 
                className="px-6 py-3 font-bold text-sm text-slate-500 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl shadow-sm transition-all outline-none cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="px-6 py-3 font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] rounded-xl shadow-lg shadow-indigo-500/25 transition-all focus:ring-4 focus:ring-indigo-500/20 outline-none cursor-pointer flex items-center gap-2 border border-indigo-500/30"
              >
                <CheckCircle2 className="w-5 h-5"/>
                {editingProduct ? 'Save Changes' : 'Confirm & Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* 2. Manual stock Adjustment Modal */}
      {isAdjustStockModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Adjust stock</h3>
                <span className="text-[11px] text-slate-400 font-extrabold font-mono mt-0.5 mt-1 truncate block max-w-[200px]">{selectedProduct.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAdjustStockModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex justify-between items-center font-bold">
                <span className="text-xs text-slate-500">Current Catalog Stock:</span>
                <span className="text-sm text-indigo-700 font-black">{formatStockDisplay(selectedProduct.stock, selectedProduct.category)} {selectedProduct.unit}</span>
              </div>

              {/* Adjust movement type action selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStockFormData({ ...stockFormData, type: 'IN' })}
                  className={`py-2 px-3 text-xs font-black rounded-xl border cursor-pointer transition-all uppercase tracking-wider
                    ${stockFormData.type === 'IN' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  Add (+)
                </button>
                <button
                  type="button"
                  onClick={() => setStockFormData({ ...stockFormData, type: 'OUT' })}
                  className={`py-2 px-3 text-xs font-black rounded-xl border cursor-pointer transition-all uppercase tracking-wider
                    ${stockFormData.type === 'OUT' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/10' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  Reduce (-)
                </button>
              </div>

              {/* Adjustment Quantity input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Adjustment Quantity ({selectedProduct.unit}) *</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={stockFormData.quantity}
                  onChange={e => setStockFormData({ ...stockFormData, quantity: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl focus:outline-none text-slate-800 font-mono font-black text-base"
                  placeholder="e.g. 50"
                />
              </div>

              {/* Correction Reason log field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reason for adjustment *</label>
                <input 
                  required
                  type="text"
                  value={stockFormData.reason}
                  onChange={e => setStockFormData({ ...stockFormData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl focus:outline-none text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                  placeholder="e.g. Physical stock count or correction"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAdjustStockModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 px-4 text-white text-xs font-black rounded-xl cursor-pointer uppercase tracking-wider shadow-md
                    ${stockFormData.type === 'IN' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/10'
                    }`}
                >
                  Apply Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Detailed Product Slider Info dialogue sheet */}
      {detailProduct && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-end p-0">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            <div className="p-6 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Product Details</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono tracking-wide mt-0.5">{detailProduct.sku || '-'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600 font-semibold leading-relaxed">
              {detailProduct.imageUrl && (
                <div className="w-full h-44 rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                  <img 
                    src={detailProduct.imageUrl} 
                    alt={detailProduct.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Product Name</span>
                <p className="text-base font-black text-slate-900 leading-tight">{detailProduct.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Category</span>
                  <p className="text-slate-850 font-extrabold text-[13px]">{detailProduct.category}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block">Supplier Name</span>
                  <p className="text-slate-850 font-extrabold text-[13px]">{detailProduct.supplierName || 'Unknown / -'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3.5 border-y border-slate-100/80 text-center font-bold text-slate-700 bg-slate-50/50 rounded-2xl px-2">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Quantity</span>
                  <p className="text-lg font-black text-slate-900">{formatStockDisplay(detailProduct.stock, detailProduct.category)} <span className="text-[10px] font-bold text-slate-400">{detailProduct.unit}</span></p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Min alert</span>
                  <p className="text-lg font-black text-slate-800">{detailProduct.minStockAlert}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Unit Price</span>
                  <p className="text-lg font-black text-indigo-750 font-mono">₹{detailProduct.sellingPrice.toLocaleString()}</p>
                </div>
              </div>

              {detailProduct.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Item Description</span>
                  <p className="text-slate-650 font-medium whitespace-pre-wrap bg-slate-50/80 p-3 rounded-2xl border border-slate-105">{detailProduct.description}</p>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditProduct(detailProduct);
                    setDetailProduct(null);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer select-none text-center block"
                >
                  Edit Attribute Specifications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenAdjustStock(detailProduct);
                  }}
                  className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer select-none text-center block"
                >
                  Adjust In-Stock Balance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Complete Stock Movements Ledger log views sheet dynamically */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden text-left flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4.5 border-b border-indigo-50 bg-slate-50/60 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Stock Movement Ledger Logs</h3>
                <p className="text-[11px] text-slate-400 font-medium">Tracking history for item corrections, audits, and sales invoice reductions.</p>
              </div>
              <button
                type="button"
                onClick={() => setLedgerOpen(false)}
                className="p-1 px-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Micro Filter toolbar for dynamic Ledger searches */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs shrink-0 font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Audits Filter:</span>
                
                {/* Date Filter Selection */}
                <select
                  value={ledgerDateFilter}
                  onChange={e => setLedgerDateFilter(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px]"
                >
                  <option value="ALL">All Time Movements</option>
                  <option value="TODAY">Adjusted Today</option>
                  <option value="THIS_WEEK">Last 7 Days</option>
                  <option value="THIS_MONTH">This Calendar Month</option>
                </select>
              </div>

              {/* Product Reference Dropdown Filter */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <select
                  value={ledgerProductFilter}
                  onChange={e => setLedgerProductFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px] max-w-[180px]"
                >
                  <option value="ALL">All Product Ledger</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              {/* Action type correction filter */}
              <div>
                <select
                  value={ledgerActionFilter}
                  onChange={e => setLedgerActionFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-[11px]"
                >
                  <option value="ALL">All Actions Types</option>
                  <option value="Product Created">Product Created</option>
                  <option value="Stock Adjustment">Correction Audits</option>
                  <option value="Invoice Generated">Invoices deduct</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden w-full">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-250 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="py-3 px-4">Timestamp Reference</th>
                      <th className="py-3 px-4">Target Product SKU</th>
                      <th className="py-3 px-3 text-center">Transfer Type</th>
                      <th className="py-3 px-3 text-right">Adjustment Qty</th>
                      <th className="py-3 px-4">Audit Action / Reason Log</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {filteredLedgerMovements.map(mov => {
                      const dateObj = new Date(mov.date);
                      const relatedProduct = inventory.find(i => i.id === mov.productId);

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-800 block">
                              {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-slate-450 block font-medium">
                              {dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900 block truncate max-w-[200px]">{mov.productName}</span>
                            {relatedProduct?.sku && (
                              <span className="text-[9.5px] font-mono text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded font-black inline-block mt-0.5">
                                {relatedProduct.sku}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase
                              ${mov.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-rose-50 text-rose-700 border border-rose-150'}`}>
                              {mov.type === 'IN' ? 'RECEIVE' : 'DEDUCT'}
                            </span>
                          </td>

                          <td className={`py-3 px-3 text-right font-black font-mono text-xs ${mov.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {mov.type === 'IN' ? '+' : '-'}{mov.quantity}
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-800 font-extrabold">{mov.actionType || 'Adjustment'}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5 truncate max-w-[245px]" title={mov.reason}>
                              {mov.reason}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredLedgerMovements.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No audit movements recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 ADVANCED PURCHASE ORDER (PO) GENERATOR MODAL */}
      <AnimatePresence>
        {draftingPOItem && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
                    <History className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block">AI Automated Drafting Engine</span>
                    <h3 className="text-sm font-black text-white leading-none">Draft Purchase Order PO-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDraftingPOItem(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Product Summary */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 block">Restock Item Target</span>
                  <p className="text-xs font-black text-indigo-950 uppercase">{draftingPOItem.product.name}</p>
                  <div className="flex items-center gap-4 text-[10px] text-indigo-700 font-extrabold mt-1">
                    <span>SKU: {draftingPOItem.product.sku}</span>
                    <span>•</span>
                    <span>Current Stock: {formatStockDisplay(draftingPOItem.product.stock, draftingPOItem.product.category)} units</span>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 text-slate-650">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Supplier Name</label>
                    <input 
                      type="text"
                      className="p-2.5 border border-slate-250 rounded-xl font-bold text-xs text-slate-700 focus:outline-none focus:border-indigo-500 bg-white"
                      placeholder="e.g. Acme Supplier Corp, Dell India, Samsung Wholesale"
                      value={poFormData.supplierName}
                      onChange={e => setPoFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5 text-slate-650">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Reorder Qty</label>
                      <input 
                        type="number"
                        min="1"
                        className="p-2.5 border border-slate-250 rounded-xl font-bold text-xs font-mono text-slate-800 bg-white"
                        value={poFormData.quantity}
                        onChange={e => setPoFormData(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-slate-650 font-sans">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unit Cost</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input 
                          type="number"
                          min="0"
                          className="w-full p-2.5 pl-6 border border-slate-250 rounded-xl font-bold text-xs font-mono text-slate-800 bg-white"
                          value={poFormData.unitCost}
                          onChange={e => setPoFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PO Valuation and Recommendation metadata */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 font-bold">Estimated Cost Valuation:</span>
                    <span className="font-extrabold text-slate-800">
                      ₹ {(poFormData.quantity * poFormData.unitCost).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 font-bold">Inbound Shipment Target:</span>
                    <span className="font-extrabold text-slate-800">
                      Standard Transport Rail (Express)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-black">
                    <span className="text-indigo-650">Smart Buy Recommendations:</span>
                    <span className="text-emerald-600 bg-emerald-55/10 border border-emerald-200 px-20 px-2 py-0.5 rounded-full text-[10px]">PASSES BUDGET CAP</span>
                  </div>
                </div>
              </div>

              {/* PO Issuance footer action */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2 text-right">
                <button
                  type="button"
                  onClick={() => setDraftingPOItem(null)}
                  disabled={poIsSubmitting}
                  className="px-4 py-2 border border-slate-250 text-slate-650 bg-white hover:bg-slate-50 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleIssuePOCommit}
                  disabled={poIsSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-150 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {poIsSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Generating Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      <span>Authorize Inbound PO</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Barcode Scanner Modal Component */}
      {showBarcodeScanner && (
        <React.Suspense fallback={<div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm" />}>
          <BarcodeScannerModal 
            onClose={() => setShowBarcodeScanner(false)}
            onScan={(decodedText) => {
              setFormData(prev => ({ ...prev, barcode: decodedText }));
              setShowBarcodeScanner(false);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}
