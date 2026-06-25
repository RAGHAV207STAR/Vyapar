/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useBilling } from "../context/BillingContext";
import { useInventory } from "../context/InventoryContext";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Receipt, 
  Calendar, 
  AlertTriangle, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Phone, 
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Brush
} from "recharts";
import { motion } from "motion/react";
import * as XLSX from "xlsx";
import { generatePdfReport } from "../utils/generatePdfReport";

// Formatting currency in Indian style (₹)
const formatIndianCurrency = (num: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

// Compact Indian formatting (e.g. 1.25L, 3Cr)
const formatCompactIndianCurrency = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
};

const formatDateToDDMMYY = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0].substring(2);
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}/${year}`;
};

export default function AnalyticsDashboard() {
  const { bills, profile, showToast } = useBilling();
  const { inventory } = useInventory();

  // Chart view interval state: "7_DAYS" | "30_DAYS" | "THIS_MONTH" | "CUSTOM"
  const [chartSelection, setChartSelection] = useState<"7_DAYS" | "30_DAYS" | "THIS_MONTH" | "CUSTOM">("7_DAYS");

  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef.current) {
      chartContainerRef.current.scrollLeft = chartContainerRef.current.scrollWidth;
    }
  }, [chartSelection, customStartDate, customEndDate]);

  // Export progress states
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Parse safety helper
  const parseNormalizedDate = (invoiceDate?: string, createdAt?: string | number) => {
    if (invoiceDate && typeof invoiceDate === 'string') {
      try {
        return new Date(invoiceDate.replace(/-/g, '/'));
      } catch (e) {
        return new Date(createdAt || Date.now());
      }
    }
    return new Date(createdAt || Date.now());
  };

  // --- COMPUTE KPI METRICS ---
  const kpis = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYearMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYearMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let todaySales = 0;
    let yesterdaySales = 0;
    let thisMonthSales = 0;
    let lastMonthSales = 0;

    (bills || []).forEach(b => {
      if (!b) return;
      const bDate = b.invoiceDate ? b.invoiceDate.substring(0, 10) : "";
      const amt = Number(b.totalAmount || 0);

      if (bDate === todayStr) {
        todaySales += amt;
      } else if (bDate === yesterdayStr) {
        yesterdaySales += amt;
      }

      if (bDate.startsWith(currentYearMonthPrefix)) {
        thisMonthSales += amt;
      } else if (bDate.startsWith(prevYearMonthPrefix)) {
        lastMonthSales += amt;
      }
    });

    const totalOutstanding = (bills || []).reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0);

    const lowStockCount = (inventory || []).filter(p => {
      const limit = p.minStockAlert !== undefined ? p.minStockAlert : 5;
      return Number(p.stock || 0) <= limit;
    }).length;

    // Trend Calculations
    let todayTrend = 0;
    if (yesterdaySales > 0) {
      todayTrend = ((todaySales - yesterdaySales) / yesterdaySales) * 100;
    } else if (todaySales > 0) {
      todayTrend = 100;
    }

    let monthTrend = 0;
    if (lastMonthSales > 0) {
      monthTrend = ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100;
    } else if (thisMonthSales > 0) {
      monthTrend = 100;
    }

    return {
      todaySales,
      todaySalesTrend: todayTrend,
      thisMonthSales,
      monthTrend,
      totalOutstanding,
      lowStockCount
    };
  }, [bills, inventory]);

  // --- CALENDAR DATE GENERATION FOR TREND CHARTS ---
  const chartData = useMemo(() => {
    const today = new Date();
    const dates: string[] = [];

    if (chartSelection === "7_DAYS") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    } else if (chartSelection === "30_DAYS") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    } else if (chartSelection === "THIS_MONTH") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysCount = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysCount; i++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
    } else if (chartSelection === "CUSTOM") {
      const startD = new Date(customStartDate);
      const endD = new Date(customEndDate);
      // Safety cap visual range to 180 days to avoid performance limits
      const daysDiff = Math.min(180, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
      for (let i = 0; i <= daysDiff; i++) {
        const d = new Date(startD);
        d.setDate(startD.getDate() + i);
        if (d > endD) break;
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    }

    const salesMap = new Map<string, number>();
    (bills || []).forEach(b => {
      if (b.invoiceDate) {
        const normalized = b.invoiceDate.substring(0, 10);
        salesMap.set(normalized, (salesMap.get(normalized) || 0) + Number(b.totalAmount || 0));
      }
    });

    return dates.map(dateStr => {
      const d = parseNormalizedDate(dateStr);
      const displayLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      return {
        date: dateStr,
        displayDate: displayLabel,
        sales: salesMap.get(dateStr) || 0
      };
    });
  }, [bills, chartSelection, customStartDate, customEndDate]);

  // --- COMPUTE GST & TAX LIABILITIES ---
  const taxMetrics = useMemo(() => {
    let subTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;
    let activeInvoicesCount = 0;

    (bills || []).forEach(b => {
      if (!b) return;
      const dateStr = b.invoiceDate ? b.invoiceDate.substring(0, 10) : "";
      
      let matches = false;
      if (chartSelection === "7_DAYS") {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 7);
        const billDate = new Date(dateStr.replace(/-/g, '/'));
        matches = billDate >= limitDate;
      } else if (chartSelection === "30_DAYS") {
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 30);
        const billDate = new Date(dateStr.replace(/-/g, '/'));
        matches = billDate >= limitDate;
      } else if (chartSelection === "THIS_MONTH") {
        const currentPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        matches = dateStr.startsWith(currentPrefix);
      } else if (chartSelection === "CUSTOM") {
        const sDate = new Date(customStartDate);
        const eDate = new Date(customEndDate);
        const billDate = new Date(dateStr.replace(/-/g, '/'));
        matches = billDate >= sDate && billDate <= eDate;
      }

      if (matches) {
        const invoiceTotal = Number(b.totalAmount || 0);
        const invoiceTax = Number(b.gstAmount || (Number(b.cgstAmount || 0) + Number(b.sgstAmount || 0) + Number(b.igstAmount || 0)));
        
        const invoiceCgst = b.cgstAmount !== undefined ? Number(b.cgstAmount) : Number(invoiceTax / 2);
        const invoiceSgst = b.sgstAmount !== undefined ? Number(b.sgstAmount) : Number(invoiceTax / 2);
        const invoiceIgst = Number(b.igstAmount || 0);

        cgst += invoiceCgst;
        sgst += invoiceSgst;
        igst += invoiceIgst;
        totalTax += invoiceTax;
        subTotal += (invoiceTotal - invoiceTax);
        activeInvoicesCount++;
      }
    });

    return {
      taxableRevenue: subTotal,
      cgst,
      sgst,
      igst,
      totalTax,
      activeInvoicesCount
    };
  }, [bills, chartSelection, customStartDate, customEndDate]);

  // --- COMPUTE TOP SELLING PRODUCTS ---
  const topSellingProducts = useMemo(() => {
    const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
    let totalRevenueSum = 0;

    (bills || []).forEach(b => {
      const items = b.products || [];
      items.forEach((item: any) => {
        const name = item.name || "Default Product";
        const qty = Number(item.quantity || 0);
        const total = Number(item.total || (qty * (item.price || 0)));

        const existing = productAgg.get(name);
        if (existing) {
          existing.qty += qty;
          existing.revenue += total;
        } else {
          productAgg.set(name, { name, qty, revenue: total });
        }
        totalRevenueSum += total;
      });
    });

    return Array.from(productAgg.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({
        ...item,
        revenuePercentage: totalRevenueSum > 0 ? (item.revenue / totalRevenueSum) * 100 : 0
      }));
  }, [bills]);

  // --- COMPUTE OUTSTANDING CUSTOMERS ---
  const outstandingCustomers = useMemo(() => {
    const custMap = new Map<string, { name: string; phone: string; due: number; lastInvoice: string }>();

    (bills || []).forEach(b => {
      const due = Number(b.balanceAmount || 0);
      if (due > 0) {
        const name = b.customerDetails?.name || "Walk-In Customer";
        const phone = b.customerDetails?.phone || "N/A";
        const date = b.invoiceDate || "";
        const idKey = phone !== "N/A" ? phone : name;

        const existing = custMap.get(idKey);
        if (existing) {
          existing.due += due;
          if (date && (!existing.lastInvoice || date > existing.lastInvoice)) {
            existing.lastInvoice = date;
          }
        } else {
          custMap.set(idKey, { name, phone, due, lastInvoice: date });
        }
      }
    });

    return Array.from(custMap.values())
      .sort((a, b) => b.due - a.due)
      .slice(0, 5);
  }, [bills]);

  // --- COMPUTE CRITICAL LOW STOCK ---
  const criticalLowStock = useMemo(() => {
    const alerts = (inventory || []).filter(p => {
      const limit = p.minStockAlert !== undefined ? p.minStockAlert : 5;
      return Number(p.stock || 0) <= limit;
    });

    return alerts
      .sort((a, b) => {
        const aLimit = a.minStockAlert !== undefined ? a.minStockAlert : 5;
        const bLimit = b.minStockAlert !== undefined ? b.minStockAlert : 5;
        const aRatio = aLimit > 0 ? Number(a.stock || 0) / aLimit : 0;
        const bRatio = bLimit > 0 ? Number(b.stock || 0) / bLimit : 0;
        return aRatio - bRatio;
      })
      .slice(0, 5);
  }, [inventory]);

  // --- EXPORT TO EXCEL WORKFLOW ---
  const handleExportXLSX = () => {
    try {
      const headerSummary = [
        ["Vyapar Mitra Analytics Export Summary"],
        ["Export Date:", new Date().toLocaleDateString('en-IN')],
        ["Shop:", profile?.shopName || "Our Shop"],
        [],
        ["Metric", "Value"],
        ["Today's Sales", formatIndianCurrency(kpis.todaySales)],
        ["This Month Sales", formatIndianCurrency(kpis.thisMonthSales)],
        ["Total Outstanding Dues", formatIndianCurrency(kpis.totalOutstanding)],
        ["Low Stock Items Warning", kpis.lowStockCount],
        []
      ];

      const invoicesHeaders = [["Invoice No", "Date", "Customer Name", "Customer Phone", "Grand Total", "Outstanding Balance"]];
      const invoicesRows = (bills || []).map(b => [
        b.invoiceNumber || b.billId?.substring(0, 8) || "N/A",
        b.invoiceDate || "N/A",
        b.customerDetails?.name || "Walk-In Customer",
        b.customerDetails?.phone || "N/A",
        b.totalAmount || 0,
        b.balanceAmount || 0
      ]);

      const wb = XLSX.utils.book_new();
      const wsMain = XLSX.utils.aoa_to_sheet([...headerSummary, ...invoicesHeaders, ...invoicesRows]);
      XLSX.utils.book_append_sheet(wb, wsMain, "Business Summary");

      XLSX.writeFile(wb, `VyaparMitra_Business_Report_${new Date().toISOString().substring(0,10)}.xlsx`);
      showToast("Excel spreadsheet generated successfully!", "success");
    } catch (e: any) {
      showToast("Failed to generate Excel sheet: " + e.message, "error");
    }
  };

  // --- EXPORT PDF REPORT ---
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const computedMetrics = {
        totalRevenue: (bills || []).reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
        totalOutstanding: kpis.totalOutstanding,
        lowStockCount: kpis.lowStockCount
      };

      await generatePdfReport({
        dateRange: "Dynamic Period",
        startDate: "",
        endDate: "",
        metrics: computedMetrics,
        chartData: chartData.map(c => ({ label: c.displayDate, sales: c.sales })),
        categoryData: {},
        productPerformance: topSellingProducts.map(tp => ({ productName: tp.name, totalPurchased: tp.qty, revenueValue: tp.revenue })),
        monthlyComparison: {},
        yearlyGrowth: {},
        paymentModeData: {},
        profile: profile || { shopName: "Our Shop" },
        topCustomers: outstandingCustomers.map(oc => ({ customerName: oc.name, phone: oc.phone, totalSales: oc.due })),
        lowStockProducts: criticalLowStock.map(ls => ({ productName: ls.name, stock: ls.stock, minStockAlert: ls.minStockAlert || 5 })),
        inventoryValue: (inventory || []).reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.purchasePrice || 0)), 0),
        inventoryMovements: [],
        bills: bills || [],
        inventory: inventory || []
      });
      showToast("PDF Business Report downloaded successfully!", "success");
    } catch (e: any) {
      showToast("Failed to generate PDF Report: " + e.message, "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // --- WHATSAPP REMINDER TRIGGER ---
  const handleWhatsAppReminder = (cust: typeof outstandingCustomers[0]) => {
    const formattedAmt = formatIndianCurrency(cust.due);
    const message = `Hello ${cust.name}, this is a gentle restock/payment follow-up from ${profile?.shopName || "our shop"} regarding your outstanding dues of ${formattedAmt}. We appreciate your business and kind support. Thank you!`;
    const cleanPhone = cust.phone.replace(/[^0-9]/g, "");
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    showToast(`WhatsApp reminder prepared for ${cust.name}!`, "success");
  };

  // --- REDIRECT TO PURCHASE ORDER FOR RESTOCKS ---
  const handleCreatePurchaseOrder = () => {
    showToast("Redirecting to Purchase Order Creator workspace...", "info");
    window.dispatchEvent(new CustomEvent('navigate', { detail: '/purchase-orders' }));
  };

  return (
    <div id="analytics-portal-container" className="flex flex-col gap-8 max-w-7xl mx-auto w-full select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2.5 border-b border-slate-200/80 pb-6 text-left relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider shadow-3xs">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Executive Intelligence Portal
        </div>
        <div>
          <h1 className="text-3xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
            Business <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Analytics</span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-2.5 max-w-2xl leading-relaxed">
            Real-time performance indicators, cashflow trends, and intelligence tracking mapped straight from your shop floor.
          </p>
        </div>
      </div>

      {/* SECTION 1: BUSINESS SNAPSHOT (4 Premium KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1 : Today's Sales */}
        <div className="bg-slate-900 rounded-3xl p-6 shadow-md transition-transform duration-300 border border-slate-800 relative overflow-hidden group text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Today's Sales</span>
            <div className="h-10 w-10 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700/60 shadow-3xs">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mb-2">
            <span className="font-sans font-black text-3xl text-white tracking-tight">
              {formatIndianCurrency(kpis.todaySales)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {kpis.todaySalesTrend >= 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.todaySalesTrend.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/25">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {Math.abs(kpis.todaySalesTrend).toFixed(1)}%
              </span>
            )}
            <span className="text-slate-400 font-medium ml-1">vs yesterday</span>
          </div>
        </div>

        {/* KPI 2 : This Month Sales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 transition-shadow duration-300 hover:shadow-xs text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">This Month Sales</span>
            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-3xs">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="font-sans font-black text-3xl text-slate-900 tracking-tight">
              {formatIndianCurrency(kpis.thisMonthSales)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {kpis.monthTrend >= 0 ? (
              <span className="flex items-center gap-0.5 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.monthTrend.toFixed(1)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-red-650 font-bold bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {Math.abs(kpis.monthTrend).toFixed(1)}%
              </span>
            )}
            <span className="text-slate-500 font-medium ml-1">vs last month</span>
          </div>
        </div>

        {/* KPI 3 : Outstanding Amount */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 transition-shadow duration-300 hover:shadow-xs text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Outstanding Due</span>
            <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-3xs">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="font-sans font-black text-3xl text-slate-900 tracking-tight">
              {formatIndianCurrency(kpis.totalOutstanding)}
            </span>
          </div>
          <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-100/60 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Requires Follow-up</span>
          </div>
        </div>

        {/* KPI 4 : Low Stock Alerts */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 transition-shadow duration-300 hover:shadow-xs text-left">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Low Stock Alert</span>
            <div className="h-10 w-10 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shadow-3xs">
              <Package className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mb-2">
            <span className="font-sans font-black text-3xl text-slate-900 tracking-tight">
              {kpis.lowStockCount} Items
            </span>
          </div>
          <div className="text-xs font-bold text-rose-650 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100/60 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Need replenishment</span>
          </div>
        </div>

      </div>

      {/* SECTION 2: SALES TREND */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Sales Revenues</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">Aggregate invoice performance timeline</p>
          </div>

          {/* Single chart selection buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-205 shadow-inner">
              {(["7_DAYS", "30_DAYS", "THIS_MONTH", "CUSTOM"] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setChartSelection(option)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all duration-200 ${chartSelection === option ? "bg-white text-slate-950 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                  title={option === "7_DAYS" ? "7 Days" : option === "30_DAYS" ? "30 Days" : option === "THIS_MONTH" ? "This Month" : "Custom Run"}
                >
                  {option === "7_DAYS" ? "7 Days" : option === "30_DAYS" ? "30 Days" : option === "THIS_MONTH" ? "This Month" : "🗓️"}
                </button>
              ))}
            </div>

            {chartSelection === "CUSTOM" && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 self-stretch sm:self-auto">
                <div className="relative bg-white border border-slate-200 hover:border-indigo-500 rounded-xl px-3 py-1.5 transition flex items-center min-w-[95px] justify-center shadow-3xs cursor-pointer">
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {formatDateToDDMMYY(customStartDate) || "DD/MM/YY"}
                  </span>
                </div>
                <span className="text-slate-400 font-extrabold text-xs">to</span>
                <div className="relative bg-white border border-slate-200 hover:border-indigo-500 rounded-xl px-3 py-1.5 transition flex items-center min-w-[95px] justify-center shadow-3xs cursor-pointer">
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {formatDateToDDMMYY(customEndDate) || "DD/MM/YY"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Beautiful Modern Clean Chart Area */}
        <div className="flex items-stretch h-72 w-full mt-2 space-x-1.5">
          {/* Fixed Y-Axis Section */}
          {chartData.length > 0 && (
            <div className="w-14 shrink-0 select-none pb-5" style={{ contentVisibility: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <XAxis hide={true} dataKey="displayDate" />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => formatCompactIndianCurrency(v)}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    width={50}
                  />
                  <Area type="monotone" dataKey="sales" stroke="transparent" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scrollable grid, X-Axis & Area content */}
          <div ref={chartContainerRef} className="flex-1 overflow-x-auto pb-2 custom-chart-scroll">
            <div className="h-full min-w-[700px]">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Insufficient parameters to map. Select a wider range.
                </div>
              ) : (
                <ResponsiveContainer debounce={100} width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="displayDate" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis hide={true} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-xl text-xs border border-slate-800 text-left">
                              <p className="font-extrabold text-slate-400 uppercase tracking-widest text-[9px]">{data.displayDate}</p>
                              <p className="font-black text-sm text-indigo-300 mt-1">{formatIndianCurrency(data.sales)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GST / TAX LIABILITY ESTIMATE WIDGET */}
      <div id="tax-estimates-bento-card" className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/45 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
              💼 TAX COMPLIANCE CO-PILOT
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-2.5 flex items-center gap-2">
              GST & Tax Liability Estimates
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              Refined estimates matching {chartSelection === "7_DAYS" ? "the last 7 days" : chartSelection === "30_DAYS" ? "the last 30 days" : chartSelection === "THIS_MONTH" ? "this active month" : "your selected custom range"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Period Bills Audited</span>
            <span className="text-base sm:text-lg font-black text-slate-800 font-mono">{taxMetrics.activeInvoicesCount} invoices</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1: Taxable Turn-over */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxable Turnover</span>
            <h4 className="text-xl font-mono font-black text-slate-900 mt-2">{formatIndianCurrency(taxMetrics.taxableRevenue)}</h4>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="text-[10px] text-slate-500 font-bold">Excludes compiled GST</span>
            </div>
          </div>

          {/* Card 2: CGST Collected */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CGST Collected</span>
            <h4 className="text-xl font-mono font-black text-slate-900 mt-2">{formatIndianCurrency(taxMetrics.cgst)}</h4>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-slate-500 font-bold">Central GST Split</span>
            </div>
          </div>

          {/* Card 3: SGST Collected */}
          <div className="bg-slate-50/50 border border-slate-200/50 p-5 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SGST Collected</span>
            <h4 className="text-xl font-mono font-black text-slate-900 mt-2">{formatIndianCurrency(taxMetrics.sgst)}</h4>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-500 font-bold">State GST Split</span>
            </div>
          </div>

          {/* Card 4: Net Tax Liability (CGST + SGST + IGST) */}
          <div className="bg-indigo-600 border border-indigo-700 p-5 rounded-2xl text-white relative overflow-hidden shadow-xs">
            <div className="absolute right-0 bottom-0 pointer-events-none text-indigo-500/20 translate-x-4 translate-y-4">
              <TrendingUp className="w-24 h-24 stroke-[5]" />
            </div>
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">EST. TAX LIABILITY</span>
            <h4 className="text-2xl font-mono font-black text-white mt-1.5">{formatIndianCurrency(taxMetrics.totalTax)}</h4>
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[9px] text-indigo-150 font-extrabold uppercase tracking-wider">Dynamic Period Total</span>
            </div>
          </div>
        </div>

        {/* Breakdown Progress Visual Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-2">
            <span>CGST vs. SGST vs. IGST Compliance Ratio</span>
            <span className="font-mono">100% Tax Accounts Verified</span>
          </div>
          
          {taxMetrics.totalTax > 0 ? (
            <div>
              <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden border border-slate-200/40">
                <div 
                  style={{ width: `${(taxMetrics.cgst / taxMetrics.totalTax) * 100}%` }} 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  title="CGST Ratio"
                />
                <div 
                  style={{ width: `${(taxMetrics.sgst / taxMetrics.totalTax) * 100}%` }} 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  title="SGST Ratio"
                />
                <div 
                  style={{ width: `${(taxMetrics.igst / (taxMetrics.totalTax || 1)) * 100}%` }} 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  title="IGST Ratio"
                />
              </div>
              <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  CGST Ratio: {((taxMetrics.cgst / taxMetrics.totalTax) * 100).toFixed(0)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  SGST Ratio: {((taxMetrics.sgst / taxMetrics.totalTax) * 100).toFixed(0)}%
                </span>
                {taxMetrics.igst > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    IGST Ratio: {((taxMetrics.igst / taxMetrics.totalTax) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-[11px] font-bold text-slate-400 italic">
              No GST entries recorded for this timescale. Turn-over transactions are non-taxable or walk-ins.
            </div>
          )}
        </div>
      </div>

      {/* BENTO ROW FOR DETAILED LISTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 3: TOP SELLING PRODUCTS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Highest Sellers</h3>
                <p className="text-[10px] font-black text-indigo-600 block uppercase tracking-widest mt-0.5">Top stock items by total billing revenue</p>
              </div>
            </div>

            <div className="space-y-4">
              {topSellingProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">
                  No products successfully cataloged inside current invoices yet.
                </div>
              ) : (
                topSellingProducts.map((p, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100 last:border-b-0">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-black text-slate-900 block truncate max-w-[180px]">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{p.qty} items sold</span>
                      </div>
                      <span className="font-black text-indigo-750 font-mono">{formatIndianCurrency(p.revenue)}</span>
                    </div>
                    {/* Share percent progress-bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.max(p.revenuePercentage, 3)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {topSellingProducts.length > 0 && (
            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
              <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest">Compiled on active in-memory cache</span>
            </div>
          )}
        </div>

        {/* SECTION 4: OUTSTANDING CUSTOMERS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Outstanding Customers</h3>
                <p className="text-[10px] font-black text-amber-600 block uppercase tracking-widest mt-0.5">Protect cashflow with reminders</p>
              </div>
            </div>

            <div className="space-y-4">
              {outstandingCustomers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">
                  Awaiting outstanding custom billing entries. No active due list found.
                </div>
              ) : (
                outstandingCustomers.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-b-0 text-xs">
                    <div>
                      <span className="font-black text-slate-900 block truncate max-w-[160px]">{c.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Last Bill: {c.lastInvoice || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-amber-700 font-mono">{formatIndianCurrency(c.due)}</span>
                      <button
                        onClick={() => handleWhatsAppReminder(c)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100 text-emerald-700 rounded-xl cursor-pointer transition-colors duration-200"
                        title={`Send polite WhatsApp collection reminder to ${c.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {outstandingCustomers.length > 0 && (
            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
              <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest">Grouped by customer phone indexes</span>
            </div>
          )}
        </div>

        {/* SECTION 5: LOW STOCK ALERTS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Low Stock Warnings</h3>
                <p className="text-[10px] font-black text-rose-600 block uppercase tracking-widest mt-0.5">Critical inventory deficit alerts</p>
              </div>
            </div>

            <div className="space-y-4">
              {criticalLowStock.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-bold text-xs">
                  Congratulations! All products in catalog have super healthy stock levels.
                </div>
              ) : (
                criticalLowStock.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-b-0 text-xs">
                    <div>
                      <span className="font-black text-slate-900 block truncate max-w-[160px]">{p.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">Min Alert: {p.minStockAlert !== undefined ? p.minStockAlert : 5} {p.unit || "units"}</span>
                    </div>
                    <div>
                      <span className="font-black text-rose-650 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-100">
                        {p.stock} left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4 text-center">
            <button
              onClick={handleCreatePurchaseOrder}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 py-2.5 rounded-2xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200"
            >
              <span>Draft Restock POs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
