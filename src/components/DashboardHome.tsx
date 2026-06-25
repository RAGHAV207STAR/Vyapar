/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { TrendingUp, Receipt, Users, Activity, AlertTriangle, LayoutDashboard, Wallet, IndianRupee, ShoppingCart, TrendingDown, ArrowRight, MessageSquare, Mail, Eye, Plus, ShoppingBag } from "lucide-react";
import { useBilling } from "../context/BillingContext";
import { useInventory } from "../context/InventoryContext";
import { useAnalytics } from "../context/AnalyticsContext";
import { Bill } from "../types";

const formatStockDisplay = (qty: number, category: string) => {
  if (!qty) return '0';
  const c = (category || '').toLowerCase();
  const isPrecious = c.includes('gold') || c.includes('silver') || c.includes('diamond') || c.includes('platinum') || c.includes('jewelry') || c.includes('gem');
  
  if (isPrecious) {
    return Number(Number(qty).toFixed(4)).toString();
  }
  return Number(Number(qty).toFixed(2)).toString();
};

const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

const formatInvoiceDateTime = (createdAt?: number | string) => {
  if (!createdAt) return "Just Now";
  try {
    const d = new Date(createdAt);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(createdAt);
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

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  Brush,
  AreaChart,
  Area
} from "recharts";

interface DashboardHomeProps {
  onNavigate: (tab: string) => void;
  onViewBill: (bill: Bill) => void;
}

export default function DashboardHome({
  onNavigate,
  onViewBill,
}: DashboardHomeProps) {
  const { profile, bills } = useBilling();
  const { inventory } = useInventory();
  const { getCacheForRange, chartDataForRange, getStampRange } = useAnalytics();
  
  const [timeRange, setTimeRange] = useState<'TODAY' | 'THIS_WEEK' | 'CUSTOM'>('TODAY');

  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().substring(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().substring(0, 10);
  });

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹ ${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹ ${(amount / 100000).toFixed(2)}L`;
    } else {
      return `₹ ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
  };

  const rangeCache: any = getCacheForRange(timeRange, customStartDate, customEndDate) || {};
  const metrics = rangeCache.metrics || { totalRevenue: 0, totalProfit: 0, totalInvoices: 0, totalCustomers: 0 };
  const lowStockProducts = rangeCache.lowStockProducts || [];
  const paymentBreakdownData = rangeCache.paymentBreakdownData || [];
  const rangeChartData = chartDataForRange(timeRange, customStartDate, customEndDate) || [];

  const chartContainerRef1 = useRef<HTMLDivElement>(null);
  const chartContainerRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartContainerRef1.current) {
      chartContainerRef1.current.scrollLeft = chartContainerRef1.current.scrollWidth;
    }
  }, [rangeChartData]);

  useEffect(() => {
    if (chartContainerRef2.current) {
      chartContainerRef2.current.scrollLeft = chartContainerRef2.current.scrollWidth;
    }
  }, [rangeChartData]);

  const prevTimeRangeMap: Record<string, string> = { TODAY: "YESTERDAY", THIS_WEEK: "LAST_WEEK" };
  const prevTimeRange = prevTimeRangeMap[timeRange] || null;
  const prevRangeCache: any = prevTimeRange ? getCacheForRange(prevTimeRange) : null;
  const prevMetrics = prevRangeCache?.metrics || { totalRevenue: 0, totalProfit: 0, totalInvoices: 0, totalCustomers: 0 };

  const getGrowth = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : 0);
    return ((curr - prev) / Math.abs(prev)) * 100;
  };
  
  const kpis = {
    sales: metrics?.totalRevenue ?? 0,
    profit: metrics?.totalProfit ?? 0,
    outstanding: (bills || []).reduce((acc, b) => acc + (b?.balanceAmount || 0), 0),
    invoices: metrics?.totalInvoices ?? 0
  };

  const salesGrowth = prevTimeRange ? getGrowth(kpis.sales, prevMetrics.totalRevenue) : null;
  const profitGrowth = prevTimeRange ? getGrowth(kpis.profit, prevMetrics.totalProfit) : null;
  const invoicesGrowth = prevTimeRange ? getGrowth(kpis.invoices, prevMetrics.totalInvoices) : null;

  // Dynamic precise Outstanding Due calculations (lifetime liabilities comparison)
  const { start: currentPeriodStart } = getStampRange ? getStampRange(timeRange, customStartDate, customEndDate) : { start: null };
  const outstandingThis = kpis.outstanding;
  const outstandingPrev = useMemo(() => {
    if (!currentPeriodStart) return outstandingThis;
    return (bills || []).filter(b => {
      if (!b) return false;
      const d = b.createdAt ? new Date(b.createdAt) : new Date();
      return d.getTime() < currentPeriodStart;
    }).reduce((acc, b) => acc + (b?.balanceAmount || 0), 0);
  }, [bills, currentPeriodStart, outstandingThis]);

  const outstandingGrowth = prevTimeRange ? getGrowth(outstandingThis, outstandingPrev) : null;

  const paymentStatusData = paymentBreakdownData.length > 0 ? paymentBreakdownData : [{ name: 'No Data', value: 1, color: '#f1f5f9' }];
  
  const customerMetrics = useMemo(() => {
    const activeThis = metrics?.totalCustomers ?? 0;
    const activePrev = prevMetrics?.totalCustomers ?? 0;
    const growth = activeThis - activePrev;
    const growthPercent = getGrowth(activeThis, activePrev).toFixed(1);
    
    return { activeCustomers: activeThis, growth, growthPercent };
  }, [metrics, prevMetrics]);

  // Compute 3 most critically low stock items for the immediate dashboard notification alert
  const criticalLowStock = useMemo(() => {
    return (inventory || [])
      .filter((p: any) => {
        const limit = p.minStockAlert !== undefined ? p.minStockAlert : 5;
        return Number(p.stock || 0) <= limit;
      })
      .sort((a: any, b: any) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 3);
  }, [inventory]);

  // Compute 5 most recent bills sorted descending by creation timestamp
  const recentBills = useMemo(() => {
    return [...(bills || [])]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [bills]);

  // Sparkline data generators with safe fallback arrays
  const miniRevenueData = useMemo(() => {
    const base = (rangeChartData || []).map(item => ({ value: item.Sales || 0 }));
    if (base.length === 0 || base.every(v => v.value === 0)) {
      return [14, 22, 17, 28, 24, 35, 32].map(v => ({ value: v }));
    }
    return base;
  }, [rangeChartData]);

  const miniProfitData = useMemo(() => {
    const base = (rangeChartData || []).map(item => ({ value: item.Profit || 0 }));
    if (base.length === 0 || base.every(v => v.value === 0)) {
      return [4, 11, 7, 16, 12, 23, 19].map(v => ({ value: v }));
    }
    return base;
  }, [rangeChartData]);

  const renderGrowthBadge = (percentage: string | number | null, isPositive: boolean = true, invertColors: boolean = false) => {
    if (percentage === null) return null;
    const isGood = invertColors ? !isPositive : isPositive;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
        isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}>
        {isPositive ? '↑' : '↓'} {percentage}
      </span>
    );
  };

  // Corporate black tooltip definition
  const CustomMainTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 text-white border border-slate-800 p-4 rounded-2xl shadow-2xl space-y-1.5 select-none text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
                <span className="text-xs font-medium text-slate-400 capitalize">{entry.name}:</span>
                <span className="text-xs font-extrabold text-white">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 w-full font-sans animate-fade-in text-left pb-16">
      
      {/* HEADER & TIME TOGGLE */}
      <div 
        id="vmitra-premium-overview-header" 
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-white via-slate-50 to-indigo-50/20 border border-slate-200/80 rounded-2xl mb-6 text-left shadow-sm shadow-slate-100 relative overflow-hidden"
      >
        {/* Subtle light visual ambient glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[30px] pointer-events-none" />
        
        <div className="relative z-10 animate-fade-in flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1 bg-transparent">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[9px] font-extrabold uppercase tracking-widest">
                {profile?.shopName ? `🏪 ${profile.shopName}` : "🏢 Enterprise Hub"}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-extrabold uppercase tracking-widest">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Live Sync Active
              </span>
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-slate-850 tracking-tight leading-snug">
              Overview Analytics
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Realtime insights, inventory tracking alerts, and key performance metrics.
            </p>
          </div>
        </div>
        
        {/* Toggle Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 relative z-10 bg-transparent">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
            <button 
              type="button"
              onClick={() => setTimeRange('TODAY')}
              className={`px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 border ${timeRange === 'TODAY' ? 'bg-[#003580] text-white border-[#002b66] shadow-md scale-102 font-sans' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55 font-bold'}`}
            >
              📊 Today
            </button>
            <button 
              type="button"
              onClick={() => setTimeRange('THIS_WEEK')}
              className={`px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 border ${timeRange === 'THIS_WEEK' ? 'bg-[#003580] text-white border-[#002b66] shadow-md scale-102 font-sans' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55 font-bold'}`}
            >
              📆 Weekly
            </button>
            <button 
              type="button"
              onClick={() => setTimeRange('CUSTOM')}
              className={`px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all duration-200 border ${timeRange === 'CUSTOM' ? 'bg-[#003580] text-white border-[#002b66] shadow-md scale-102 font-sans' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/55 font-bold'}`}
              title="Custom Run"
            >
              🗓️ Period
            </button>
          </div>

          {timeRange === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              <div className="relative bg-white border border-slate-205 hover:border-indigo-400 focus-within:border-indigo-500 rounded-xl px-3.5 py-1.5 transition flex items-center min-w-[100px] justify-center shadow-2xs cursor-pointer group">
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span className="text-xs font-black text-slate-705 font-mono tracking-wider group-hover:text-indigo-600 transition-colors">
                  {formatDateToDDMMYY(customStartDate) || "Start"}
                </span>
              </div>
              <span className="text-slate-400 font-black text-xs uppercase tracking-widest px-0.5">to</span>
              <div className="relative bg-white border border-slate-205 hover:border-indigo-400 focus-within:border-indigo-500 rounded-xl px-3.5 py-1.5 transition flex items-center min-w-[100px] justify-center shadow-2xs cursor-pointer group">
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span className="text-xs font-black text-slate-705 font-mono tracking-wider group-hover:text-indigo-600 transition-colors">
                  {formatDateToDDMMYY(customEndDate) || "End"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CRITICAL LOW STOCK WARNINGS BANNER */}
      {criticalLowStock.length > 0 && (
        <div 
          id="critical-inventory-badge-alerts" 
          className="bg-slate-950 border border-rose-500/25 rounded-[2rem] p-6 sm:p-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 transition-all duration-300 shadow-xl shadow-rose-950/20 animate-fade-in text-left relative overflow-hidden ring-1 ring-rose-500/10"
        >
          {/* Neon radial backlight glows */}
          <div className="absolute top-0 left-0 w-80 h-40 bg-rose-550/[0.06] rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-64 h-32 bg-amber-550/[0.04] rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex items-start gap-4 text-left relative z-10 flex-1 min-w-0">
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-450 shadow-[0_0_15px_rgba(239,68,68,0.1)] shrink-0 mt-1">
              <AlertTriangle className="w-6 h-6 stroke-[2.5] text-rose-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2 flex-wrap leading-none">
                Hazard Warning • <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">{criticalLowStock.length} Core lines depleted</span>
              </h4>
              <p className="text-[13px] font-semibold text-slate-200 leading-relaxed mt-2 max-w-3xl">
                The warehouse ledger reports that {criticalLowStock.length} essential inventory assets are currently running dangerously below active safety buffers. Reorder is necessary to maintain seamless operations.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {criticalLowStock.map((item: any, idx: number) => {
                  const percentOfLimit = Math.round((Number(item.stock || 0) / (item.minStockAlert || 5)) * 105);
                  return (
                    <div 
                      key={idx} 
                      className="inline-flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] hover:border-rose-550/20 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-300 transition-colors"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-slate-100 font-extrabold">{item.name}</span>
                      <span className="text-slate-500">|</span>
                      <span className="font-mono text-xs font-black text-rose-400">{formatStockDisplay(item.stock, item.category || 'General')}</span> / 
                      <span className="font-mono text-slate-400 text-[10px]">{item.minStockAlert || 5}</span> 
                      <span className="text-[9.5px] px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-black font-mono">({Math.min(99, percentOfLimit)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => onNavigate('Purchase Orders')}
            className="w-full xl:w-auto self-stretch xl:self-auto shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-[0_4px_25px_0_rgba(244,63,94,0.3)] hover:shadow-[0_6px_30px_0_rgba(244,63,94,0.4)] transition-all rounded-2xl uppercase tracking-widest cursor-pointer group active:scale-98 relative z-10 border border-rose-500/20"
          >
            <ShoppingBag className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" /> 
            <span>Trigger PO Reorder</span>
          </button>
        </div>
      )}

      {/* 1. TOP ROW: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Total revenue */}
        <div className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="space-y-1.5 flex-1 min-w-0 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Sales</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate pr-2">
              {formatCompactCurrency(kpis.sales)}
            </h3>
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              {salesGrowth !== null ? (
                <>
                  {renderGrowthBadge(`${Math.abs(salesGrowth).toFixed(1)}%`, salesGrowth >= 0)}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs {prevTimeRange?.replace("_", " ")}</span>
                </>
              ) : (
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Custom period metrics</span>
              )}
            </div>
          </div>
          <div className="w-20 h-10 shrink-0 select-none">
            <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
              <BarChart data={miniRevenueData}>
                <Bar dataKey="value" fill="#14b8a6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="space-y-1.5 flex-1 min-w-0 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net Profit</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate pr-2">
              {formatCompactCurrency(kpis.profit)}
            </h3>
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              {profitGrowth !== null ? (
                <>
                  {renderGrowthBadge(`${Math.abs(profitGrowth).toFixed(1)}%`, profitGrowth >= 0)}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs {prevTimeRange?.replace("_", " ")}</span>
                </>
              ) : (
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Profit target computed</span>
              )}
            </div>
          </div>
          <div className="w-20 h-10 shrink-0 select-none">
            <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
              <AreaChart data={miniProfitData}>
                <defs>
                  <linearGradient id="miniProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={1.5} fill="url(#miniProfitGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="space-y-1.5 flex-1 min-w-0 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Invoices</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate pr-2">
              {kpis.invoices}
            </h3>
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              {invoicesGrowth !== null ? (
                <>
                  {renderGrowthBadge(`${Math.abs(invoicesGrowth).toFixed(1)}%`, invoicesGrowth >= 0)}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs {prevTimeRange?.replace("_", " ")}</span>
                </>
              ) : (
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Checkout count</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Receipt className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/40 hover:-translate-y-0.5 group relative overflow-hidden">
          <div className="space-y-1.5 flex-1 min-w-0 text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Outstanding Due</span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none truncate pr-2">
              {formatCompactCurrency(kpis.outstanding)}
            </h3>
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              {outstandingGrowth !== null ? (
                <>
                  {renderGrowthBadge(`${Math.abs(outstandingGrowth).toFixed(1)}%`, outstandingGrowth >= 0, true)}
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{outstandingGrowth >= 0 ? "increase" : "decrease"} overall</span>
                </>
              ) : (
                <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Total balance active</span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-650 rounded-2xl flex items-center justify-center border border-rose-100 shadow-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Wallet className="w-5 h-5 font-bold" />
          </div>
        </div>
      </div>

      {/* 2. SALES LINE CHART */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="text-left pl-4 border-l-4 border-gradient-to-b from-indigo-500 to-indigo-700 relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-full" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2.5">
              <span>{timeRange === 'TODAY' ? "Today's Sales Performance" : timeRange === 'THIS_WEEK' ? "Current Week Sales Performance" : "Custom Period Sales Performance"}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
            </h3>
            <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider">
              {timeRange === 'TODAY' ? "Hourly comparison of core revenue and profits" : timeRange === 'THIS_WEEK' ? "Daily comparison of core revenue and profits" : `Acquisition comparison from ${customStartDate} to ${customEndDate}`}
            </p>
          </div>
          {timeRange === 'TODAY' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/60 rounded-xl text-[10px] font-black text-indigo-700 uppercase tracking-wider animate-pulse self-start sm:self-auto select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
              <span>← Scroll horizontally to see full day →</span>
            </div>
          )}
        </div>
        
        <div className="flex items-stretch h-[320px] w-full mt-2 space-x-1.5">
          {/* Fixed Y-Axis Section */}
          {rangeChartData.length > 0 && (
            <div className="w-14 shrink-0 select-none pb-12" style={{ contentVisibility: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rangeChartData} margin={{ top: 15, right: 0, left: 0, bottom: 40 }}>
                  <XAxis hide={true} dataKey="name" />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={55}
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold", fontFamily: "Inter, sans-serif" }} 
                    tickFormatter={(v) => formatCompactCurrency(v)} 
                  />
                  <Area type="monotone" dataKey="Sales" stroke="transparent" fill="transparent" activeDot={false} />
                  <Area type="monotone" dataKey="Profit" stroke="transparent" fill="transparent" activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scrollable grid, X-Axis & Area content */}
          <div ref={chartContainerRef1} className="flex-1 overflow-x-auto pb-2 custom-chart-scroll">
            <div className="h-full min-w-[700px]">
              {rangeChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Insufficient parameters to map. Select a wider range.
                </div>
              ) : (
                <ResponsiveContainer debounce={100} width="100%" height="100%">
                  <AreaChart data={rangeChartData} margin={{ top: 15, right: 15, left: 5, bottom: 40 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="mainProfitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} 
                      dy={10} 
                      minTickGap={25}
                    />
                    <YAxis hide={true} />
                    {/* Stock tracking inspect system via dashed vertical crosshairs */}
                    <RechartsTooltip 
                      content={<CustomMainTooltip />}
                      cursor={{ stroke: '#2563eb', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '15px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="Sales" 
                      name="Revenue"
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#salesGradient)" 
                      dot={{ stroke: "#2563eb", strokeWidth: 2, r: 4, fill: "#fff" }} 
                      activeDot={{ r: 7, fill: "#2563eb", stroke: "#fff", strokeWidth: 2.5 }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Profit" 
                      name="Net Profit"
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#mainProfitGrad)" 
                      dot={{ stroke: "#10b981", strokeWidth: 2, r: 4, fill: "#fff" }} 
                      activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 2.5 }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK RECENT BILLS / TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="p-1 px-1.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-indigo-700 font-mono text-[10px]">REALTIME</span>
              Quick Recent Invoices
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Instantly view, audit, and re-print the last 5 transactions generated
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('Bill History')}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-750 transition-colors duration-250 cursor-pointer"
          >
            Manage Bill Ledger →
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[700px] border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-5 py-4">No</th>
                <th className="px-5 py-4">Customer Details</th>
                <th className="px-5 py-4">Date & Stamp</th>
                <th className="px-5 py-4">Channel Mode</th>
                <th className="px-5 py-4">Grand Total</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {recentBills.length > 0 ? (
                recentBills.map((bill: any, idx: number) => {
                  const billNo = bill.invoiceNumber || bill.billId?.substring(0, 8) || `INV-${bill.createdAt || idx}`;
                  const customerName = bill.customerDetails?.name || "Walk-In Customer";
                  const customerPhone = bill.customerDetails?.phone || "N/A";
                  
                  // Safe payment badge styles
                  const pMode = (bill.paymentMode || "Cash").toUpperCase();
                  const modeBadgeColor = pMode.includes("UPI") 
                    ? "bg-purple-50 text-purple-700 border-purple-100/60" 
                    : pMode.includes("CARD")
                    ? "bg-blue-50 text-blue-700 border-blue-100/60"
                    : "bg-slate-55/70 text-slate-600 border-slate-200/55";

                  // Outstanding check for status badge
                  const isFullyPaid = Number(bill.balanceAmount || 0) <= 0;
                  const isPartiallyPaid = Number(bill.balanceAmount || 0) > 0 && Number(bill.balanceAmount || 0) < Number(bill.totalAmount || 0);
                  
                  return (
                    <tr key={bill.billId || idx} className="hover:bg-slate-50/40 transition whitespace-nowrap">
                      <td className="px-5 py-4 font-mono font-black text-slate-900 border-none">
                        #{billNo}
                      </td>
                      <td className="px-5 py-4 border-none">
                        <div>
                          <p className="font-extrabold text-slate-800 text-[12px]">{customerName}</p>
                          {customerPhone !== "N/A" && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{customerPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-bold border-none">
                        {formatInvoiceDateTime(bill.createdAt)}
                      </td>
                      <td className="px-5 py-4 border-none">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wider ${modeBadgeColor}`}>
                          💵 {pMode}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900 text-[12px] border-none">
                        {formatCurrency(bill.totalAmount || 0)}
                      </td>
                      <td className="px-5 py-4 border-none">
                        {isFullyPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-md">
                            Fully Paid
                          </span>
                        ) : isPartiallyPaid ? (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-755 text-[9px] font-black uppercase tracking-wider rounded-md">
                            Partially Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-800 text-[9px] font-black uppercase tracking-wider rounded-md">
                            Unpaid / Due
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right border-none">
                        <button
                          type="button"
                          onClick={() => onViewBill(bill)}
                          className="inline-flex items-center gap-1.5 p-1.5 px-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-105 active:scale-95 text-indigo-750 text-xs font-black rounded-xl transition cursor-pointer shadow-3xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-650" />
                          <span>Quick Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center border-none">
                    <div className="inline-flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-slate-350" />
                      </div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-widest">No Transactions Found</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">You haven't generated any bills for this shop yet</p>
                      <button
                        type="button"
                        onClick={() => onNavigate('Create Bill')}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition"
                      >
                        ⚡ Generate First Bill
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. CUSTOMER KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between hover:border-slate-200 transition-all duration-300">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer Growth</p>
            <div className="flex items-end gap-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none">{customerMetrics.growth > 0 ? '+' : ''}{customerMetrics.growth}</h3>
              <span className={`text-[11px] font-bold mb-0.5 ${Number(customerMetrics.growthPercent) >= 0 ? 'text-emerald-600 animate-pulse' : 'text-rose-600'}`}>
                {Number(customerMetrics.growthPercent) >= 0 ? '↑' : '↓'} {Math.abs(Number(customerMetrics.growthPercent))}% vs {prevTimeRange?.replace("_", " ")}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">New users registered during timeframe</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
            <Users className="w-5 h-5 font-bold" />
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-between hover:border-slate-200 transition-all duration-300">
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Customers</p>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-none">{customerMetrics.activeCustomers}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Currently executing transacting store accounts</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
            <Activity className="w-5 h-5 font-bold" />
          </div>
        </div>
      </div>

      {/* 4 & 5. CHARTS ROW (GROUPED BAR & DOUGHNUT) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* REVENUE VS PROFIT GROUPED BAR CHART */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col items-start w-full">
          <div className="w-full mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Revenue Vs Profit Analysis</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {timeRange === 'TODAY' ? "Hourly volume comparison" : "Current week volume comparison"}
              </p>
            </div>
            {timeRange === 'TODAY' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100/60 rounded-xl text-[10px] font-black text-indigo-700 uppercase tracking-wider animate-pulse self-start sm:self-auto select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-ping" />
                <span>← Scroll horizontally to see full day →</span>
              </div>
            )}
          </div>
          
        <div className="flex items-stretch h-[260px] w-full mt-2 space-x-1.5">
          {/* Fixed Y-Axis Section */}
          {rangeChartData.length > 0 && (
            <div className="w-14 shrink-0 select-none pb-12" style={{ contentVisibility: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rangeChartData} margin={{ top: 15, right: 0, left: 0, bottom: 40 }}>
                  <XAxis hide={true} dataKey="name" />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={55} 
                    tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} 
                    tickFormatter={(v) => formatCompactCurrency(v)} 
                  />
                  <Bar dataKey="Sales" fill="transparent" />
                  <Bar dataKey="Profit" fill="transparent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scrollable grid, X-Axis & Bar content */}
          <div ref={chartContainerRef2} className="flex-1 overflow-x-auto pb-2 custom-chart-scroll">
            <div className="h-full min-w-[700px]">
              {rangeChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Insufficient parameters to map. Select a wider range.
                </div>
              ) : (
                <ResponsiveContainer debounce={100} width="100%" height="100%">
                  <BarChart data={rangeChartData} margin={{ top: 15, right: 15, left: 5, bottom: 40 }} barGap={8}>
                    <defs>
                      <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95}/>
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.95}/>
                      </linearGradient>
                      <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.95}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} minTickGap={25} />
                    <YAxis hide={true} />
                    <RechartsTooltip 
                      content={<CustomMainTooltip />}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Bar dataKey="Sales" name="Revenue" fill="url(#revenueBarGrad)" radius={[6, 6, 0, 0]} barSize={24} />
                    <Bar dataKey="Profit" name="Net Profit" fill="url(#profitBarGrad)" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* PAYMENT STATUS DOUGHNUT CHART */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 flex flex-col justify-between w-full">
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Payment Status</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {timeRange === 'TODAY' ? "Paid vs Outstanding (Today)" : "Paid vs Outstanding (This Week)"}
            </p>
          </div>
          
          <div className="h-[200px] w-full flex items-center justify-center relative select-none">
            <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={paymentStatusData.length > 1 ? 4 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: entry.name !== 'No Data' ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.06))' : 'none' }} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: "bold", padding: '8px 12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[9px] font-black uppercase text-slate-405 tracking-wider">Total Volume</span>
              <span className="text-lg font-black text-slate-900 leading-tight">
                {formatCompactCurrency(paymentStatusData.reduce((acc, curr) => acc + (curr.name !== 'No Data' ? curr.value : 0), 0))}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {paymentStatusData.filter(d => d.name !== 'No Data').map((status, idx) => (
              <div key={idx} className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 flex flex-col text-left">
                <div className="flex items-center gap-1.5 mb-1 text-[9px] uppercase font-black tracking-wider text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.name}
                </div>
                <span className="font-black text-slate-800 text-xs truncate" style={{ color: status.color }}>
                  {formatCompactCurrency(status.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. LOW STOCK ALERT INVENTORY */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-0.5">Low Stock Alert</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Merchandise items running below custom safety thresholds</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate("Inventory")}
            className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 group select-none cursor-pointer"
          >
            <span>Manage Stock</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[600px] border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Min. Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-sans">
              {(() => {
                const sortedLowStock = [...(lowStockProducts || [])].sort((a, b) => {
                  const aStock = Number(a.stock || 0);
                  const bStock = Number(b.stock || 0);
                  if (aStock <= 0 && bStock > 0) return -1;
                  if (bStock <= 0 && aStock > 0) return 1;
                  return aStock - bStock;
                });
                return sortedLowStock.length > 0 ? (
                  sortedLowStock.map((item, idx) => {
                    const isOutOfStock = Number(item.stock || 0) <= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/40 transition whitespace-nowrap">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                              isOutOfStock 
                                ? 'bg-red-50 border-red-100/80 text-red-600' 
                                : 'bg-amber-50 border-amber-100/80 text-amber-600'
                            }`}>
                              <ShoppingCart className="w-4.5 h-4.5" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-slate-800 text-xs">{item.name}</p>
                                {isOutOfStock && (
                                  <span className="px-2 py-0.5 bg-red-100 border border-red-200 text-red-800 rounded-md text-[8px] font-black uppercase tracking-wider animate-pulse-subtle">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              <p className="font-mono font-bold text-[9px] text-slate-400">SKU: {item.sku || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-slate-100 text-slate-500 uppercase tracking-wide">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <span className={`font-black flex items-center gap-1.5 ${
                            isOutOfStock ? 'text-red-650' : 'text-amber-600'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{formatStockDisplay(item.stock, item.category || 'General')}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">{item.unit || 'pcs'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left font-bold text-slate-500">
                          <span>{item.minStockAlert || 5}</span>
                          <span className="text-[10px] uppercase ml-1 font-semibold text-slate-400">{item.unit || 'pcs'}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="inline-flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-505 flex items-center justify-center mb-3">
                          <TrendingUp className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Stock Levels Healthy</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">No items currently below safety threshold levels</p>
                      </div>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Support & Feature Request Banner */}
      <div className="mt-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl border border-indigo-400/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 group relative overflow-hidden text-white w-full">
        <div className="absolute top-0 right-0 -mx-8 -my-8 w-48 h-48 bg-white/10 rounded-full blur-3xl filter group-hover:bg-white/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 -mx-8 -my-8 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl filter group-hover:bg-purple-400/30 transition-all duration-500" />
        
        <div className="space-y-2 flex-1 min-w-0 text-left relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-white/10">
              <MessageSquare className="w-4 h-4 text-white" />
            </span>
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block">24/7 Priority Support Desk</span>
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight leading-snug">
            Need Help, Training, or a Custom Feature?
          </h3>
          
          <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-[90%]">
            Our expert team is live. Email us directly with any questions or feature requests—we typically respond with customized updates within <strong className="text-white font-bold bg-white/20 px-1 py-0.5 rounded">24 hours</strong>.
          </p>
        </div>

        <div className="shrink-0 relative z-10">
          <a href="mailto:support.smartvyapar@gmail.com?subject=Priority%20Support%20%2F%20Feature%20Request&body=Hello%20Smart%20Vyapar%20Team%2C%0A%0AI%20am%20using%20the%20Smart%20Vyapar%20billing%20and%20ERP%20applet.%20I'd%20love%20to%20get%20assistance%20on%3A%0A%0A%5BDescribe%20your%20need%20or%20feature%20here%5D" className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-indigo-700 hover:bg-slate-50 text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            <Mail className="w-4 h-4 text-indigo-750 stroke-[2.5]" /> Contact support.smartvyapar@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
}
