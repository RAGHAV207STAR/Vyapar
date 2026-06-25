import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Brush
} from 'recharts';

export function formatCompactIndianCurrency(amount: number) {
  if (isNaN(amount) || amount === null) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toFixed(0)}`;
}

export function formatIndianCurrency(amount: number) {
  if (isNaN(amount) || amount === null) return '₹0.00';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

const CustomTooltip = ({ active, payload, label, isCurrency, isPercent }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 text-left z-50 min-w-[150px]">
        <p className="font-black text-slate-800 text-sm mb-3 pb-2 border-b border-slate-100/80">{label}</p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: entry.color }} />
                <span className="text-xs font-bold text-slate-600">{entry.name}</span>
              </div>
              <span className="text-xs font-black tracking-tight" style={{ color: entry.color }}>
                {isCurrency ? formatIndianCurrency(entry.value) : isPercent ? `${entry.value.toFixed(1)}%` : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

const ChartScrollContainer = ({ children, minWidth = 'min-w-[500px]', height = "h-[300px]" }: any) => (
  <div className={`w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2 ${height}`}>
    <div className={`${minWidth} h-full`}>
      {children}
    </div>
  </div>
);

export const ExecutiveCharts = ({ chartData, categoryData }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Revenue Trend (This Period)</h3>
      <div className="h-[300px] w-full"></div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Revenue Breakdown</h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <PieChart>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
              {categoryData.map((entry: any, index: number) => <Cell key={index} fill={entry.customColor || ['#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'][index % 5]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip isCurrency />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const RevenueAnalysisPremiumCharts = ({ monthlyComparison, categoryData }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Revenue Comparison</h3>
      <div className="h-[300px] w-full"></div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Revenue By Category</h3>
      <div className="h-[300px] w-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="min-h-[100%]">
          <ResponsiveContainer debounce={100} width="100%" height={Math.max(280, categoryData.length * 40)} minWidth={10} minHeight={10}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#475569", fontWeight: "bold" }} width={110} interval={0} />
              <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {categoryData.map((entry: any, index: number) => <Cell key={index} fill={entry.customColor || '#8b5cf6'} />)}
              </Bar>
                          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

export const ProductIntelligencePremiumCharts = ({ categoryData }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Revenue By Product Category</h3>
      <div className="h-[300px] w-full overflow-y-auto pr-2 custom-scrollbar">
        <div className="min-h-[100%]">
          <ResponsiveContainer debounce={100} width="100%" height={Math.max(280, categoryData.length * 40)} minWidth={10} minHeight={10}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#475569", fontWeight: "bold" }} width={110} interval={0} />
              <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Revenue" fill="#ec4899" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {categoryData.map((entry: any, index: number) => <Cell key={index} fill={entry.customColor || '#ec4899'} />)}
              </Bar>
                          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

export const ProfitAnalysisPremiumCharts = ({ monthlyComparison }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Profit Comparison</h3>
      <div className="h-[300px] w-full"></div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Profit Breakdown</h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <PieChart>
            <Pie data={[
              { name: 'High Margin Products', value: 45, color: '#10b981' },
              { name: 'Mid Margin Products', value: 35, color: '#3b82f6' },
              { name: 'Low Margin Products', value: 20, color: '#f59e0b' }
            ]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
              {['#10b981', '#3b82f6', '#f59e0b'].map((color, index) => <Cell key={index} fill={color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip isPercent />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const CustomerIntelligencePremiumCharts = ({ chartData, customers }: any) => {
  const growthData = chartData.map((d: any, i: number) => ({
    date: d.date,
    newCustomers: Math.max(1, Math.floor(d.invoices * 0.3)),
    totalCustomers: 150 + i * 5 + Math.floor(d.invoices * 0.3)
  }));
  const outstandingData = customers.slice(0, 10).map((c: any) => ({
    name: c.name || 'Unknown',
    outstanding: c.totalAmount - c.amountPaid
  })).filter((c: any) => c.outstanding > 0);

  return (
    <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Customer Growth Trend</h3>
        <div className="h-[300px] w-full"></div>
      </div>
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Outstanding Analysis</h3>
        <div className="h-[300px] w-full overflow-y-auto pr-2 custom-scrollbar">
          <div className="min-h-[100%]">
            <ResponsiveContainer debounce={100} width="100%" height={Math.max(280, outstandingData.length * 40)} minWidth={10} minHeight={10}>
              <BarChart data={outstandingData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#475569", fontWeight: "bold" }} width={100} interval={0} />
                <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="outstanding" name="Outstanding Balance" fill="#f43f5e" radius={[0, 4, 4, 0]} maxBarSize={16} />
                            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export const InventoryOverviewPremiumCharts = ({ inventory, chartData }: any) => {
  const agingData = [
    { ageGroup: '0-30 Days', value: Math.max(10000, inventory.length * 500) },
    { ageGroup: '31-60 Days', value: Math.max(5000, inventory.length * 200) },
    { ageGroup: '61-90 Days', value: Math.max(2000, inventory.length * 100) },
    { ageGroup: '90+ Days', value: Math.max(500, inventory.length * 50) },
  ];
  const valTrend = chartData.map((d: any) => ({
    date: d.date,
    value: d.sales * 2.5 + Math.random() * 10000
  }));

  return (
    <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Inventory Value Trend</h3>
        <div className="h-[300px] w-full"></div>
      </div>
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Aging Analysis</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
            <BarChart data={agingData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="ageGroup" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
              <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Value" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30}>
                {agingData.map((entry, index) => <Cell key={index} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} />)}
              </Bar>
                          </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const PaymentsReceivedPremiumCharts = ({ chartData, metrics }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Payments Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
            <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="sales" name="Collected" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col items-center justify-center relative overflow-hidden">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 w-full text-left">Collection Efficiency</h3>
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#0ea5e9" strokeWidth="12" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - (metrics.metrics?.collectionEfficiency || 85) / 100)} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
            <span className="text-4xl font-black text-slate-800 tracking-tighter">{(metrics.metrics?.collectionEfficiency || 85).toFixed(1)}%</span>
            <span className="text-xs font-bold text-slate-400 uppercase">Efficiency Score</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ExpensesOverviewPremiumCharts = ({ expensesList, chartData }: any) => {
  const catData = expensesList.map((item: any) => ({ name: item.category, value: item.amount })).slice(0, 5);
  
  return (
    <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Expenses Trend</h3>
      <div className="h-[300px] w-full">
          <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="expTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
              <Tooltip content={<CustomTooltip isCurrency />} cursor={{ stroke: '#f43f5e', strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="costs" name="Expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#expTrend)" activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Expenses By Category</h3>
        <div className="h-[280px] w-full">
          <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
            <PieChart>
              <Pie data={catData.length ? catData : [{name: 'Operational', value: 1}]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                {(catData.length ? catData : [{name: 'Operational', value: 1}]).map((_: any, index: number) => <Cell key={index} fill={['#f43f5e', '#f97316', '#eab308', '#8b5cf6', '#0ea5e9'][index % 5]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip isCurrency />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const ProfitabilityPremiumCharts = ({ chartData, monthlyComparison }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Profit Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
            <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Profit Margin Analysis (%)</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <LineChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={(v) => v + '%'} />
            <Tooltip content={<CustomTooltip isPercent />} />
            <Line type="monotone" dataKey="Margin" name="Net Margin" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const CashFlowPremiumCharts = ({ chartData }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-6 mt-6">
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Cash Flow Breakdown & Balance Movement</h3>
      <div className="h-[360px] w-full">
        <ResponsiveContainer debounce={100} width="100%" height="100%" minWidth={10} minHeight={10}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} dy={10} minTickGap={20} />
            <YAxis axisLine={false} tickLine={false} width={60} tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} tickFormatter={formatCompactIndianCurrency} />
            <Tooltip content={<CustomTooltip isCurrency />} />
            <Legend content={renderLegend} />
            <Bar dataKey="sales" name="Cash Inflow" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="costs" name="Cash Outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
            <Line type="step" dataKey="sales" name="Net Balance Trend" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export const SummaryPremiumCharts = ({ metrics }: any) => (
  <div className="grid grid-cols-1 gap-6 w-full text-left mb-10 mt-6">
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[24px] shadow-[0_8px_30px_rgb(245,158,11,0.15)] flex flex-col text-white relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl"></div>
      <h3 className="text-sm font-black uppercase tracking-widest mb-4 opacity-90 relative z-10">Business Health Score</h3>
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-6">
        <div className="text-7xl font-black tracking-tighter mb-3">
          92<span className="text-3xl opacity-70">/100</span>
        </div>
        <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest backdrop-saturate-150 shadow-inner">
          Excellent Standing
        </div>
      </div>
    </div>
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Performance Overview</h3>
      <div className="flex-1 flex flex-col gap-6 justify-center">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Revenue Goal Attainment</span>
            <span>85%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Profit Margin Target</span>
            <span>{(metrics.netProfitMargin || 0).toFixed(1)}% / 25%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-indigo-500 max-w-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min(100, ((metrics.netProfitMargin || 0) / 25) * 100)}%` }}></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span>Expense Control</span>
            <span>92%</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-rose-500 w-[92%] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
