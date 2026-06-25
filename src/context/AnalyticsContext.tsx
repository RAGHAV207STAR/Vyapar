import React, { createContext, useContext, useMemo } from 'react';
import { useBilling } from './BillingContext';
import { useInventory } from './InventoryContext';
import { Bill } from '../types';

interface AnalyticsCache {
  metrics: {
    totalRevenue: number;
    totalProfit: number;
    totalLoss: number;
    totalInvoices: number;
    totalCustomers: number;
    totalItemsSold: number;
    profitMargin: number;
    averageBillValue: number;
  };
  inventoryValue: number;
  inventoryMetrics: { totalValue: number };
  ledgerMetrics: { totalStockAdded: number; totalStockSold: number; totalAdjustments: number; damagedStock: number };
  productPerformance: { name: string; revenue: number; qty: number }[];
  categoryData: { name: string; value: number; color: string }[];
  paymentBreakdownData: { name: string; value: number; color: string }[];
  monthlyComparison: { month: string; Sales: number; Profit: number }[];
  yearlyGrowth: { year: string; volume: number }[];
  topCustomers: { name: string; revenue: number; count: number }[];
  lowStockProducts: any[];
}

interface AnalyticsEngineContextType {
  cache: AnalyticsCache;
  getCacheForRange: (rangeKey: string, customStart?: string, customEnd?: string) => AnalyticsCache;
  chartDataForRange: (rangeKey: string, customStart?: string, customEnd?: string) => any[];
  getFilteredBillsForRange: (rangeKey: string, customStart?: string, customEnd?: string) => Bill[];
  getStampRange: (rangeKey: string, customStart?: string, customEnd?: string) => { start: number | null, end: number | null };
}

const AnalyticsContext = createContext<AnalyticsEngineContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bills } = useBilling();
  const { inventory, movements } = useInventory();

  // Create lookup maps once per dependency change
  const inventoryLookups = useMemo(() => {
    const idMap = new Map<string, any>();
    const nameMap = new Map<string, any>();
    (inventory || []).forEach((item) => {
      if (item.id) idMap.set(item.id, item);
      if (item.name) nameMap.set(item.name.toLowerCase(), item);
    });
    return { idMap, nameMap };
  }, [inventory]);

  // Master calculation function
  const computeAnalyticsForBills = (filteredBills: Bill[], filteredMovements: any[] = movements || []) => {
    let totalRevenue = 0;
    let totalPurchaseCost = 0;
    let uniqueCustomers = new Set();
    let totalItemsSold = 0;

    const { idMap, nameMap } = inventoryLookups;

    filteredBills.forEach((bill) => {
      if (!bill) return;
      totalRevenue += bill.totalAmount || 0;
      if (bill.customerDetails?.phone) {
        uniqueCustomers.add(bill.customerDetails.phone);
      } else if (bill.customerDetails?.name) {
        uniqueCustomers.add(bill.customerDetails.name.toLowerCase());
      }
      (bill.products || []).forEach((item) => {
        if (!item) return;
        totalItemsSold += item.quantity || 0;
        const itemNameLower = (item.name || '').toLowerCase();
        const invItem = (item.inventoryId ? idMap.get(item.inventoryId) : null) || nameMap.get(itemNameLower);
        const purchasePrice = invItem?.purchasePrice || item.price * 0.7; // 70% cost fallback
        totalPurchaseCost += purchasePrice * (item.quantity || 0);
      });
    });

    const totalProfit = totalRevenue - totalPurchaseCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageBillValue = filteredBills.length > 0 ? (totalRevenue / filteredBills.length) : 0;
    
    // Ledger Metrics
    let totalStockAdded = 0;
    let totalStockSold = 0;
    let totalAdjustments = 0;
    let damagedStock = 0;

    (filteredMovements || []).forEach((m) => {
      if (!m) return;
      if (m.type === "IN") {
        totalStockAdded += m.quantity || 0;
      } else if (m.type === "OUT") {
        if (m.actionType === "Invoice Generated" || m.reason?.toLowerCase().includes("invoice") || m.actionType === "Stock Reduced") {
          totalStockSold += m.quantity || 0;
        }
      }
      if (m.actionType === "Stock Adjustment") totalAdjustments++;
      if (m.reason?.toLowerCase().includes("damage") || m.reason?.toLowerCase().includes("damaged")) damagedStock += m.quantity || 0;
    });

    // Product performance
    const pSales: Record<string, { name: string; revenue: number; qty: number }> = {};
    filteredBills.forEach(b => {
      if (!b) return;
      (b.products || []).forEach(p => {
        if (!p || !p.name) return;
        if (!pSales[p.name]) pSales[p.name] = { name: p.name, revenue: 0, qty: 0 };
        pSales[p.name].revenue += (p.price || 0) * (p.quantity || 0);
        pSales[p.name].qty += p.quantity || 0;
      });
    });
    const productPerformance = Object.values(pSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Category data
    const cSales: Record<string, number> = {};
    filteredBills.forEach(b => {
      if (!b) return;
      (b.products || []).forEach(p => {
        if (!p || !p.name) return;
        const inv = nameMap.get(p.name.toLowerCase());
        const cat = inv?.category || "Uncategorized";
        cSales[cat] = (cSales[cat] || 0) + ((p.price || 0) * (p.quantity || 0));
      });
    });
    const categoryData = Object.entries(cSales).map(([name, value], idx) => ({ 
      name, value, color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"][idx % 6] 
    })).sort((a, b) => b.value - a.value);

    // Payment breakdown
    const counts: Record<string, number> = { "Cash": 0, "UPI": 0, "Card": 0, "Dues": 0 };
    filteredBills.forEach((bill) => {
      if (!bill) return;
      counts["Dues"] += bill.balanceAmount || 0;
      const mode = bill.paymentMode === "CASH" ? "Cash" : bill.paymentMode === "UPI" ? "UPI" : bill.paymentMode === "CARD" ? "Card" : "Cash";
      counts[mode] += bill.paidAmount || 0;
    });
    const paymentBreakdownData = Object.entries(counts).map(([name, value], idx) => ({
      name, value, color: ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e"][idx]
    })).filter((item) => item.value > 0);

    // Monthly Comparison
    const mData: Record<string, { month: string; Sales: number; Profit: number }> = {};
    filteredBills.forEach(bill => {
      if (!bill) return;
      const d = getBillLocalDate(bill);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      if (!mData[key]) mData[key] = { month: key, Sales: 0, Profit: 0 };
      mData[key].Sales += bill.totalAmount || 0;
      let billCost = 0;
      (bill.products || []).forEach(p => {
        if (!p || !p.name) return;
        const inv = nameMap.get(p.name.toLowerCase());
        billCost += (inv?.purchasePrice || p.price * 0.7) * (p.quantity || 0);
      });
      mData[key].Profit += ((bill.totalAmount || 0) - billCost);
    });
    const monthlyComparison = Object.values(mData).sort((a,b) => a.month.localeCompare(b.month));

    // Yearly Growth
    const yData: Record<string, { year: string; volume: number }> = {};
    filteredBills.forEach(b => {
      if (!b) return;
      const d = getBillLocalDate(b);
      const y = d.getFullYear().toString();
      if(!yData[y]) yData[y] = { year: y, volume: 0 };
      yData[y].volume += b.totalAmount || 0;
    });
    const yearlyGrowth = Object.values(yData).sort((a,b) => a.year.localeCompare(b.year));

    // Top Customers
    const cData: Record<string, {name: string, revenue: number, count: number}> = {};
    filteredBills.forEach(b => {
      if (!b) return;
      const c = b.customerDetails?.phone || b.customerDetails?.name || 'Walk-in Customer';
      if (!cData[c]) cData[c] = {name: b.customerDetails?.name || c, revenue: 0, count: 0};
      cData[c].revenue += b.totalAmount || 0;
      cData[c].count += 1;
    });
    const topCustomers = Object.values(cData).sort((a,b) => b.revenue - a.revenue);

    return {
      metrics: {
        totalRevenue,
        totalProfit,
        totalLoss: totalProfit < 0 ? Math.abs(totalProfit) : 0,
        totalInvoices: filteredBills.length,
        totalCustomers: uniqueCustomers.size,
        totalItemsSold,
        profitMargin,
        averageBillValue,
      },
      ledgerMetrics: { totalStockAdded, totalStockSold, totalAdjustments, damagedStock },
      productPerformance,
      categoryData,
      paymentBreakdownData,
      monthlyComparison,
      yearlyGrowth,
      topCustomers,
    };
  };

  const getStampRange = (rangeKey: string, startDate?: string, endDate?: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let start: number | null = null;
    let end: number | null = null;

    switch (rangeKey) {
      case "TODAY": {
        start = today.getTime();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        end = tomorrow.getTime() - 1;
        break;
      }
      case "YESTERDAY": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = yesterday.getTime();
        end = today.getTime() - 1;
        break;
      }
      case "THIS_WEEK": {
        const monday = new Date(today);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        start = monday.getTime();
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        end = sunday.getTime();
        break;
      }
      case "LAST_WEEK": {
        const thisMonday = new Date(today);
        const day = thisMonday.getDay();
        const diff = thisMonday.getDate() - day + (day === 0 ? -6 : 1);
        thisMonday.setDate(diff);
        thisMonday.setHours(0, 0, 0, 0);
        
        const lastMonday = new Date(thisMonday);
        lastMonday.setDate(thisMonday.getDate() - 7);
        start = lastMonday.getTime();
        
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        lastSunday.setHours(23, 59, 59, 999);
        end = lastSunday.getTime();
        break;
      }
      case "THIS_MONTH": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        start = firstDay.getTime();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        end = nextMonth.getTime() - 1;
        break;
      }
      case "LAST_MONTH": {
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = firstDayOfLastMonth.getTime();
        const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        end = firstDayOfThisMonth.getTime() - 1;
        break;
      }
      case "THIS_YEAR": {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        start = firstDayOfYear.getTime();
        const firstDayOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
        end = firstDayOfNextYear.getTime() - 1;
        break;
      }
      case "CUSTOM": {
        if (startDate) {
          const startD = new Date(startDate.replace(/-/g, '/'));
          startD.setHours(0, 0, 0, 0);
          start = startD.getTime();
        } else {
          start = 0;
        }
        
        let endD = new Date();
        if (endDate) {
          endD = new Date(endDate.replace(/-/g, '/'));
          endD.setHours(23, 59, 59, 999);
        } else {
          endD.setHours(23, 59, 59, 999);
        }
        end = endD.getTime();
        break;
      }
      case "ALL":
      default:
        start = null;
        end = null;
        break;
    }
    return { start, end };
  };

  const getBillLocalDate = (bill: Bill) => {
    if (!bill) return new Date();
    let baseDate: Date;

    if (bill.invoiceDate && typeof bill.invoiceDate === 'string') {
      try {
        // invoiceDate is YYYY-MM-DD. Replace '-' with '/' to force local timezone parsing
        baseDate = new Date(bill.invoiceDate.replace(/-/g, '/'));
      } catch (err) {
        console.warn("Error parsing invoice date:", err);
        baseDate = new Date();
      }
    } else if (bill.invoiceDate) {
      const d = new Date(bill.invoiceDate);
      baseDate = !isNaN(d.getTime()) ? d : new Date();
    } else {
      baseDate = bill.createdAt ? new Date(bill.createdAt) : new Date();
    }

    // Overlay precision hours, minutes, seconds, milliseconds from bill.createdAt
    if (bill.createdAt) {
      const createdD = new Date(bill.createdAt);
      if (!isNaN(createdD.getTime())) {
        baseDate.setHours(createdD.getHours());
        baseDate.setMinutes(createdD.getMinutes());
        baseDate.setSeconds(createdD.getSeconds());
        baseDate.setMilliseconds(createdD.getMilliseconds());
      }
    }
    return baseDate;
  };

  const getFilteredBills = (start: number | null, end: number | null) => {
    const rawBills = bills || [];
    if (start === null && end === null) return rawBills.filter(Boolean);
    return rawBills.filter((bill) => {
      if (!bill) return false;
      const d = getBillLocalDate(bill);
      const t = d.getTime();
      return !isNaN(t) && t >= start && t <= end;
    });
  };

  const getFilteredMovements = (start: number | null, end: number | null) => {
    if (start === null && end === null) return movements || [];
    return (movements || []).filter((mov) => {
      if (!mov.date) return false;
      const t = new Date(mov.date).getTime();
      return !isNaN(t) && t >= start && t <= end;
    });
  };

  // Base cache for ALL time
  const globalCache = useMemo(() => {
    const inventoryValue = inventory.reduce((total, item) => total + ((item.purchasePrice || item.sellingPrice * 0.7) * Number(item.stock || 0)), 0);
    const lowStockProducts = inventory.filter(i => Number(i.stock || 0) <= (Number(i.minStockAlert) || 5) || Number(i.stock || 0) <= 0);
    const { start, end } = getStampRange("ALL");
    const filteredBills = getFilteredBills(start, end);
    const res = computeAnalyticsForBills(filteredBills, getFilteredMovements(start, end));
    return {
      ...res,
      inventoryValue,
      inventoryMetrics: { totalValue: inventoryValue },
      lowStockProducts
    };
  }, [bills, inventory, movements, inventoryLookups]);

  // Provide a function to get cache dynamically without rerendering everything
  // To optimize, we memoize common periods.
  
  const cacheToday = useMemo(() => {
    const { start, end } = getStampRange("TODAY");
    return computeAnalyticsForBills(getFilteredBills(start, end), getFilteredMovements(start, end));
  }, [bills, inventoryLookups, movements]);

  const cacheThisWeek = useMemo(() => {
    const { start, end } = getStampRange("THIS_WEEK");
    return computeAnalyticsForBills(getFilteredBills(start, end), getFilteredMovements(start, end));
  }, [bills, inventoryLookups, movements]);

  const cacheThisMonth = useMemo(() => {
    const { start, end } = getStampRange("THIS_MONTH");
    return computeAnalyticsForBills(getFilteredBills(start, end), getFilteredMovements(start, end));
  }, [bills, inventoryLookups, movements]);
  
  const getCacheForRange = (rangeKey: string, customStart?: string, customEnd?: string) => {
    if (rangeKey === "ALL") return { ...globalCache };
    if (rangeKey === "TODAY") return { ...globalCache, ...cacheToday };
    if (rangeKey === "THIS_WEEK") return { ...globalCache, ...cacheThisWeek };
    if (rangeKey === "THIS_MONTH") return { ...globalCache, ...cacheThisMonth };

    const { start, end } = getStampRange(rangeKey, customStart, customEnd);
    const res = computeAnalyticsForBills(getFilteredBills(start, end), getFilteredMovements(start, end));
    return { ...globalCache, ...res };
  };

  const chartDataForRange = (rangeKey: string, customStart?: string, customEnd?: string) => {
    const { start, end } = getStampRange(rangeKey, customStart, customEnd);
    const filteredBills = getFilteredBills(start, end);
    const { idMap, nameMap } = inventoryLookups;

    // If TODAY or YESTERDAY, output hourly records of sales
    if (rangeKey === "TODAY" || rangeKey === "YESTERDAY") {
      const formatHourLabel = (h: number): string => {
        if (h === 0) return "12 AM";
        if (h === 12) return "12 PM";
        return h > 12 ? `${h - 12} PM` : `${h} AM`;
      };

      const isToday = rangeKey === "TODAY";
      const currentHour = isToday ? new Date().getHours() : 23;

      const hourlyMap: Record<string, { date: string; name: string; sales: number; Sales: number; profit: number; Profit: number; invoices: number; cost: number; timestamp: number }> = {};
      for (let i = 0; i <= currentHour; i++) {
        const label = formatHourLabel(i);
        hourlyMap[label] = {
          date: label,
          name: label,
          sales: 0,
          Sales: 0,
          profit: 0,
          Profit: 0,
          invoices: 0,
          cost: 0,
          timestamp: i
        };
      }

      filteredBills.forEach((bill) => {
        if (!bill) return;
        const d = getBillLocalDate(bill);
        const h = d.getHours();
        const label = formatHourLabel(h);
        
        // Dynamic safeguard: if code runs into a future hour record due to clock variations, spawn it properly
        if (!hourlyMap[label]) {
          hourlyMap[label] = {
            date: label,
            name: label,
            sales: 0,
            Sales: 0,
            profit: 0,
            Profit: 0,
            invoices: 0,
            cost: 0,
            timestamp: h
          };
        }

        hourlyMap[label].sales += bill.totalAmount || 0;
        hourlyMap[label].Sales += bill.totalAmount || 0;
        hourlyMap[label].invoices += 1;

        let billCost = 0;
        (bill.products || []).forEach((item) => {
          if (!item) return;
          const itemNameLower = (item.name || '').toLowerCase();
          const invItem = (item.inventoryId ? idMap.get(item.inventoryId) : null) || nameMap.get(itemNameLower);
          const purchasePrice = invItem?.purchasePrice || item.price * 0.7;
          billCost += purchasePrice * (item.quantity || 0);
        });
        hourlyMap[label].profit += (bill.totalAmount || 0) - billCost;
        hourlyMap[label].Profit += (bill.totalAmount || 0) - billCost;
        hourlyMap[label].cost += billCost;
      });

      return Object.values(hourlyMap).sort((a, b) => a.timestamp - b.timestamp);
    }

    // Calculate duration in days if it's CUSTOM
    let daysDiff = 30; // default to moderate
    if (rangeKey === "CUSTOM" && customStart && customEnd) {
      const sD = new Date(customStart.replace(/-/g, '/'));
      const eD = new Date(customEnd.replace(/-/g, '/'));
      daysDiff = Math.ceil(Math.abs(eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Classify duration: Small, Moderate, Big
    let isSmall = ["TODAY", "YESTERDAY", "THIS_WEEK", "THIS_MONTH"].includes(rangeKey);
    let isModerate = ["LAST_MONTH", "THIS_YEAR"].includes(rangeKey);
    let isBig = rangeKey === "ALL";

    if (rangeKey === "CUSTOM") {
      if (daysDiff <= 31) {
        isSmall = true;
        isModerate = false;
        isBig = false;
      } else if (daysDiff <= 365) {
        isSmall = false;
        isModerate = true;
        isBig = false;
      } else {
        isSmall = false;
        isModerate = false;
        isBig = true;
      }
    }

    const dataMap: Record<string, { date: string; name: string; sales: number; Sales: number; profit: number; Profit: number; invoices: number; cost: number; timestamp: number }> = {};

    filteredBills.forEach((bill) => {
      const d = getBillLocalDate(bill);
      
      // Determine group key and formatted display label
      let groupKey = "";
      let displayName = "";

      if (isSmall) {
        // Daily grouping
        groupKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        if (rangeKey === "THIS_WEEK") {
          const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          displayName = weekdays[d.getDay()];
        } else {
          displayName = d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
        }
      } else if (isModerate) {
        // Monthly grouping
        groupKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        displayName = d.toLocaleDateString("en-IN", { month: 'short', year: '2-digit' });
      } else {
        // Yearly grouping
        groupKey = `${d.getFullYear()}`;
        displayName = d.getFullYear().toString();
      }

      if (!dataMap[groupKey]) {
        dataMap[groupKey] = {
          date: displayName, // Be compatible with components expecting date
          name: displayName, // Be compatible with components expecting name
          sales: 0,
          Sales: 0,
          profit: 0,
          Profit: 0,
          invoices: 0,
          cost: 0,
          timestamp: d.getTime()
        };
      }
      dataMap[groupKey].sales += bill.totalAmount || 0;
      dataMap[groupKey].Sales += bill.totalAmount || 0;
      dataMap[groupKey].invoices += 1;

      let billCost = 0;
      (bill.products || []).forEach((item) => {
        if (!item) return;
        const itemNameLower = (item.name || '').toLowerCase();
        const invItem = (item.inventoryId ? idMap.get(item.inventoryId) : null) || nameMap.get(itemNameLower);
        const purchasePrice = invItem?.purchasePrice || item.price * 0.7;
        billCost += purchasePrice * (item.quantity || 0);
      });
      dataMap[groupKey].profit += (bill.totalAmount || 0) - billCost;
      dataMap[groupKey].Profit += (bill.totalAmount || 0) - billCost;
      dataMap[groupKey].cost += billCost;
    });

    // For THIS_WEEK, we want to pre-populate all days of the current week up to today
    if (rangeKey === "THIS_WEEK") {
      const { start: weekStart } = getStampRange("THIS_WEEK");
      if (weekStart) {
        const dayMap: Record<string, typeof dataMap[string]> = {};
        const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          const dayName = weekdaysShort[d.getDay()];
          
          dayMap[dayName] = {
            date: dayName,
            name: dayName,
            sales: 0,
            Sales: 0,
            profit: 0,
            Profit: 0,
            invoices: 0,
            cost: 0,
            timestamp: d.getTime()
          };
        }

        // Merge actual sales data
        Object.values(dataMap).forEach(val => {
          if (val && dayMap[val.name]) {
            dayMap[val.name].sales += val.sales || 0;
            dayMap[val.name].Sales += val.Sales || 0;
            dayMap[val.name].profit += val.profit || 0;
            dayMap[val.name].Profit += val.Profit || 0;
            dayMap[val.name].invoices += val.invoices || 0;
            dayMap[val.name].cost += val.cost || 0;
          }
        });

        const todayDay = new Date().getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
        const dayToIndexMap: Record<number, number> = {
          1: 0, // Mon
          2: 1, // Tue
          3: 2, // Wed
          4: 3, // Thu
          5: 4, // Fri
          6: 5, // Sat
          0: 6  // Sun
        };
        const maxDisplayIndex = dayToIndexMap[todayDay] ?? 6;
        const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        // Return all 7 days of the week to ensure uniform, professional X-axis spacing
        return weekdayOrder
          .map(dayName => dayMap[dayName])
          .filter(Boolean);
      }
    }

    const sortedData = Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
    return sortedData;
  };


  const getFilteredBillsForRange = (rangeKey: string, customStart?: string, customEnd?: string) => {
    const { start, end } = getStampRange(rangeKey, customStart, customEnd);
    return getFilteredBills(start, end);
  };

  return (
    <AnalyticsContext.Provider value={{ cache: globalCache, getCacheForRange, chartDataForRange, getFilteredBillsForRange, getStampRange }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
