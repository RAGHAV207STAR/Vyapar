import React, { useState, useMemo } from 'react';
import { Bill } from '../types';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

export function formatIndianCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface TableWidgetProps {
  title: string;
  columns: { key: string; label: string; isCurrency?: boolean; isPercent?: boolean }[];
  data: any[];
  limit?: number;
  icon?: React.ReactNode;
}

export function TableWidget({ title, columns, data, limit = 5, icon }: TableWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const displayData = showAll ? data : data.slice(0, limit);

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col h-full w-full min-w-0 transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="overflow-x-auto rounded-[16px] border border-slate-100 bg-slate-50/30">
        <table className="w-full text-left text-sm text-slate-700 border-collapse">
          <thead className="bg-slate-100/50 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key} className={`px-4 py-3.5 ${idx === 0 ? 'rounded-tl-[16px]' : ''} ${idx === columns.length - 1 ? 'rounded-tr-[16px]' : ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {displayData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                {columns.map(col => {
                  let val = row[col.key];
                  if (col.isCurrency) val = formatIndianCurrency(val || 0);
                  if (col.isPercent) val = `${(val || 0).toFixed(1)}%`;
                  
                  return (
                    <td key={col.key} className="px-4 py-3.5 font-semibold text-slate-600 whitespace-nowrap group-hover:text-slate-900 transition-colors">
                      {col.key === 'growth' ? (
                         <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                           {val}
                         </span>
                      ) : col.key === 'margin' || col.key === 'pct' ? (
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, row[col.key] || 0))}%` }} />
                           </div>
                           <span className="text-xs">{val}</span>
                        </div>
                      ) : (
                        val
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-1">
                      <span className="text-slate-300">∅</span>
                    </div>
                    No data available for this period
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length > limit && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="mt-5 text-[11px] font-extrabold tracking-wide text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl py-2.5 px-5 transition-all self-start cursor-pointer inline-flex items-center gap-2 uppercase"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>View all {title.split(' (')[0].toLowerCase()} <ArrowRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}

export function useAnalyticsTablesData(activeBills: Bill[], activeTransactions: any[], inventory: any[], advancedKPIs: any) {
  return useMemo(() => {
    // 1. Process Products
    const prodMap = new Map<string, any>();
    activeBills.forEach(b => {
      b.products.forEach(item => {
        if (!item.inventoryId) return;
        if (!prodMap.has(item.inventoryId)) {
          const invItem = inventory.find(i => i.id === item.inventoryId);
          prodMap.set(item.inventoryId, {
            id: item.inventoryId,
            name: item.name || invItem?.name || 'Unknown',
            qty: 0,
            revenue: 0,
            cost: 0,
            category: invItem?.category || 'Uncategorized'
          });
        }
        const p = prodMap.get(item.inventoryId);
        p.qty += item.quantity;
        p.revenue += item.total;
        
        // Approx cost
        const invItem = inventory.find(i => i.id === item.inventoryId);
        const costPrice = invItem ? invItem.purchasePrice : 0;
        p.cost += (costPrice * item.quantity);
      });
    });

    const prodArray = Array.from(prodMap.values()).map(p => ({
      ...p,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      growth: '-'
    }));

    // Ranked products
    const productsByRev = [...prodArray].sort((a,b) => b.revenue - a.revenue).map((p, i) => ({ slNo: i+1, ...p }));
    const productsByProfit = [...prodArray].sort((a,b) => b.profit - a.profit).map((p, i) => ({ slNo: i+1, ...p }));
    const fastMoving = [...prodArray].sort((a,b) => b.qty - a.qty).map((p, i) => ({ slNo: i+1, ...p }));
    const slowMoving = [...prodArray].filter(p => p.qty > 0).sort((a,b) => a.qty - b.qty).map((p, i) => ({ slNo: i+1, ...p }));

    // Dead stock
    const activeProdIds = new Set(prodMap.keys());
    const deadStock = inventory
      .filter(i => !activeProdIds.has(i.id) && i.stockQuantity > 0)
      .sort((a,b) => (b.stockQuantity * b.purchasePrice) - (a.stockQuantity * a.purchasePrice))
      .map((p, i) => ({
        slNo: i+1,
        name: p.name,
        stockQty: p.stockQuantity,
        value: p.stockQuantity * p.purchasePrice
      }));

    // 2. Customers
    const custMap = new Map<string, any>();
    activeBills.forEach(b => {
      const name = b.customerDetails?.name || 'Walk-in Customer';
      if (!custMap.has(name)) {
        custMap.set(name, { name, revenue: 0, outstanding: 0 });
      }
      const c = custMap.get(name);
      c.revenue += b.totalAmount;
      if (b.balanceAmount > 0) {
        c.outstanding += b.balanceAmount;
      }
    });

    const custArray = Array.from(custMap.values());
    const customersByRev = [...custArray].sort((a,b) => b.revenue - a.revenue).map((c, i) => ({ slNo: i+1, ...c }));
    const customersByOut = [...custArray].filter(c => c.outstanding > 0).sort((a,b) => b.outstanding - a.outstanding).map((c, i) => ({ slNo: i+1, ...c }));

    // 3. Category
    const catMap = new Map<string, any>();
    prodArray.forEach(p => {
      if (!catMap.has(p.category)) catMap.set(p.category, { category: p.category, qty: 0, revenue: 0, cost: 0, profit: 0 });
      const c = catMap.get(p.category);
      c.qty += p.qty;
      c.revenue += p.revenue;
      c.cost += p.cost;
      c.profit += p.profit;
    });

    const categoryDocs = Array.from(catMap.values()).map((c, i) => ({
      slNo: i+1,
      ...c,
      margin: c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0
    })).sort((a,b) => b.profit - a.profit);

    // 4. Monthly Revenue
    const monthMap = new Map<string, any>();
    activeBills.forEach(b => {
      const d = new Date(b.invoiceDate);
      const mZip = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (!monthMap.has(mZip)) {
        monthMap.set(mZip, { month: mZip, invoices: 0, revenue: 0, profit: 0 });
      }
      const mx = monthMap.get(mZip);
      mx.invoices += 1;
      mx.revenue += b.totalAmount;
      
      const cost = b.products.reduce((acc, item) => {
        const invItem = inventory.find(i => i.id === item.inventoryId);
        return acc + ((invItem?.purchasePrice || 0) * item.quantity);
      }, 0);
      mx.profit += (b.totalAmount - cost);
    });

    const monthlyArray = Array.from(monthMap.values()).sort((a,b) => a.month.localeCompare(b.month)).map((m, i) => {
      const parts = m.month.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
      const mName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      return { slNo: i+1, monthName: mName, ...m };
    });

    // 5. Expenses & Cash Flow
    const expMap = new Map<string, number>();
    const expenseList: any[] = [];
    const inMap = new Map<string, number>();
    const outMap = new Map<string, number>();
    
    let totalInflow = 0;
    let totalOutflow = 0;

    activeTransactions.forEach(t => {
      const isOut = ['business_expense', 'owner_withdrawal', 'personal_expense', 'supplier_payment'].includes(t.transactionType);
      const isIn = ['business_income', 'customer_payment', 'personal_income', 'owner_deposit'].includes(t.transactionType);
      
      if (isIn) {
        inMap.set(t.transactionType, (inMap.get(t.transactionType) || 0) + t.amount);
        totalInflow += t.amount;
      }
      if (isOut) {
        outMap.set(t.transactionType, (outMap.get(t.transactionType) || 0) + t.amount);
        totalOutflow += t.amount;
      }

      if (t.transactionType === 'business_expense') {
        const cat = t.category || 'Other';
        expMap.set(cat, (expMap.get(cat) || 0) + t.amount);
        expenseList.push(t);
      }
    });

    const expCategories = Array.from(expMap.entries()).map(([k,v], i) => ({ category: k, amount: v })).sort((a,b) => b.amount - a.amount).map((x, i) => ({ slNo: i+1, pct: totalOutflow > 0 ? (x.amount/totalOutflow)*100 : 0, ...x }));
    const expenseData = [...expenseList].sort((a,b) => b.amount - a.amount).map((x, i) => ({ slNo: i+1, notes: x.notes || x.category, date: new Date(x.transactionDate).toLocaleDateString(), amount: x.amount }));
    
    const inflowData = Array.from(inMap.entries()).map(([k,v], i) => ({ slNo: i+1, type: k.replace('_', ' ').toUpperCase(), amount: v, pct: totalInflow > 0 ? (v/totalInflow)*100 : 0 })).sort((a,b) => b.amount - a.amount);
    const outflowData = Array.from(outMap.entries()).map(([k,v], i) => ({ slNo: i+1, type: k.replace('_', ' ').toUpperCase(), amount: v, pct: totalOutflow > 0 ? (v/totalOutflow)*100 : 0 })).sort((a,b) => b.amount - a.amount);

    // 6. Ratios
    const ratioList = [
      { slNo: 1, ratio: 'Gross Profit Margin', value: `${advancedKPIs.grossProfitMargin.toFixed(1)}%` },
      { slNo: 2, ratio: 'Net Profit Margin', value: `${advancedKPIs.netProfitMargin.toFixed(1)}%` },
      { slNo: 3, ratio: 'Operating Expense Ratio', value: `${advancedKPIs.pctExpensesRevenue.toFixed(1)}%` },
      { slNo: 4, ratio: 'Return on Investment', value: `${advancedKPIs.returnOnInvestment.toFixed(1)}%` },
    ];

    return { 
      products: { rev: productsByRev, profit: productsByProfit, fast: fastMoving, slow: slowMoving, dead: deadStock },
      customers: { rev: customersByRev, out: customersByOut },
      categories: categoryDocs,
      monthly: monthlyArray,
      expenses: { cats: expCategories, list: expenseData },
      ratios: ratioList,
      inflows: inflowData,
      outflows: outflowData
    };

  }, [activeBills, activeTransactions, inventory, advancedKPIs]);
}
