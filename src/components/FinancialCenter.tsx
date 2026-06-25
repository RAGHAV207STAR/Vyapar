import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useBilling } from '../context/BillingContext';
import { FinancialTransaction, TransactionType } from '../types';
import { 
  Briefcase, 
  User, 
  Activity, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Building,
  Landmark,
  X,
  CreditCard,
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Wallet,
  Sparkles,
  Info,
  CalendarDays,
  ListFilter,
  ArrowUpDown,
  FileText,
  ChevronDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

type DurationType = 'all_time' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year' | 'custom';

const EXPENSE_CATEGORIES = ['Home', 'Food', 'Education', 'Medical', 'Travel', 'Shopping', 'Entertainment', 'Family', 'Utilities', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Interest', 'Rental Income', 'Investment Return', 'Other'];

export default function FinancialCenter() {
  const [activeTab, setActiveTab] = useState<'business' | 'personal' | 'overview'>('overview');
  const { transactions, addTransaction } = useFinancial();
  const { showToast, bills } = useBilling();

  const chartContainerRef1 = useRef<HTMLDivElement>(null);
  const chartContainerRef2 = useRef<HTMLDivElement>(null);

  // Duration Filtering State
  const [duration, setDuration] = useState<DurationType>('all_time');
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    if (chartContainerRef1.current) {
      chartContainerRef1.current.scrollLeft = chartContainerRef1.current.scrollWidth;
    }
  }, [transactions, duration]);

  useEffect(() => {
    if (chartContainerRef2.current) {
      chartContainerRef2.current.scrollLeft = chartContainerRef2.current.scrollWidth;
    }
  }, [transactions, duration]);

  const durationsConfig: { id: DurationType; label: string; desc: string; icon: string }[] = useMemo(() => [
    { id: 'all_time', label: 'All Time', desc: 'Complete historical view', icon: '🌍' },
    { id: 'today', label: 'Today', desc: 'Current active calendar day', icon: '📊' },
    { id: 'this_week', label: 'This Week', desc: 'Current calendar week cycle', icon: '📆' },
    { id: 'this_month', label: 'This Month', desc: 'Current billing monthly cycle', icon: '📅' },
    { id: 'last_30_days', label: '30 Days', desc: 'Rolling thirty-day range', icon: '🕒' },
    { id: 'this_quarter', label: 'This Quarter', desc: 'Three-month segment performance', icon: '📈' },
    { id: 'this_year', label: 'This Year', desc: 'Annual progress projection', icon: '🗓️' },
    { id: 'custom', label: 'Custom Range', desc: 'Specify manual start & end parameters', icon: '✨' },
  ], []);

  // Search & Filtering inside Ledger tables
  const [bizSearchQuery, setBizSearchQuery] = useState('');
  const [bizCategoryFilter, setBizCategoryFilter] = useState('all');
  const [bizSortOrder, setBizSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const [persSearchQuery, setPersSearchQuery] = useState('');
  const [persCategoryFilter, setPersCategoryFilter] = useState('all');
  const [persSortOrder, setPersSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Add Record Modal State
  const [isAddingPersonal, setIsAddingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    transactionType: 'personal_expense' as TransactionType,
    category: 'Home',
    amount: '',
    notes: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  // Human-friendly date formatter
  const formatHumanDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const dateParts = dateStr.split('-');
      if (dateParts.length !== 3) return dateStr;
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const date = new Date(year, month, day);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      if (date.getTime() === today.getTime()) {
        return 'Today';
      } else if (date.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper robust date checker supporting YYYY-MM-DD cleanly
  const isWithinDuration = useMemo(() => {
    return (dateStr: string) => {
      if (!dateStr) return false;
      if (duration === 'all_time') return true;

      const dateParts = dateStr.split('-');
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const txDate = new Date(year, month, day);
      txDate.setHours(0, 0, 0, 0);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDate = now.getDate();

      const todayStart = new Date(currentYear, currentMonth, currentDate);
      todayStart.setHours(0, 0, 0, 0);

      switch (duration) {
        case 'today': {
          return txDate.getTime() === todayStart.getTime();
        }
        case 'this_week': {
          const startOfWeek = new Date(todayStart);
          const dayOfWeek = todayStart.getDay();
          startOfWeek.setDate(todayStart.getDate() - dayOfWeek);
          return txDate >= startOfWeek && txDate <= todayStart;
        }
        case 'this_month': {
          const startOfMonth = new Date(currentYear, currentMonth, 1);
          return txDate >= startOfMonth && txDate <= todayStart;
        }
        case 'last_30_days': {
          const startOf30Days = new Date(todayStart);
          startOf30Days.setDate(todayStart.getDate() - 30);
          return txDate >= startOf30Days && txDate <= todayStart;
        }
        case 'this_quarter': {
          const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
          const startOfQuarter = new Date(currentYear, quarterStartMonth, 1);
          return txDate >= startOfQuarter && txDate <= todayStart;
        }
        case 'this_year': {
          const startOfYear = new Date(currentYear, 0, 1);
          return txDate >= startOfYear && txDate <= todayStart;
        }
        case 'custom': {
          if (!customStartDate && !customEndDate) return true;
          if (customStartDate && !customEndDate) {
            const sParts = customStartDate.split('-');
            const sDate = new Date(parseInt(sParts[0], 10), parseInt(sParts[1], 10) - 1, parseInt(sParts[2], 10));
            return txDate >= sDate;
          }
          if (!customStartDate && customEndDate) {
            const eParts = customEndDate.split('-');
            const eDate = new Date(parseInt(eParts[0], 10), parseInt(eParts[1], 10) - 1, parseInt(eParts[2], 10));
            return txDate <= eDate;
          }
          if (customStartDate && customEndDate) {
            const sParts = customStartDate.split('-');
            const sDate = new Date(parseInt(sParts[0], 10), parseInt(sParts[1], 10) - 1, parseInt(sParts[2], 10));
            const eParts = customEndDate.split('-');
            const eDate = new Date(parseInt(eParts[0], 10), parseInt(eParts[1], 10) - 1, parseInt(eParts[2], 10));
            return txDate >= sDate && txDate <= eDate;
          }
          return true;
        }
        default:
          return true;
      }
    };
  }, [duration, customStartDate, customEndDate]);

  // Derived filtered collections based on currently selected time duration
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinDuration(t.transactionDate));
  }, [transactions, isWithinDuration]);

  const filteredBills = useMemo(() => {
    return bills.filter(b => isWithinDuration(b.invoiceDate));
  }, [bills, isWithinDuration]);

  // Dynamic ranges display text mapping
  const activeRangeText = useMemo(() => {
    if (filteredTransactions.length === 0) return 'No records in selected duration';
    
    // Sort transactions temporarily to find outer boundaries (asc)
    const sorted = [...filteredTransactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    const eariliest = sorted[0]?.transactionDate;
    const latest = sorted[sorted.length - 1]?.transactionDate;
    
    if (eariliest === latest) {
      return `Date: ${formatHumanDate(eariliest)}`;
    }
    return `Period: ${formatHumanDate(eariliest)} to ${formatHumanDate(latest)}`;
  }, [filteredTransactions]);

  const businessTxs = useMemo(() => {
    return filteredTransactions.filter(t => 
      t.transactionType.startsWith('business_') || 
      ['customer_payment', 'supplier_payment'].includes(t.transactionType)
    );
  }, [filteredTransactions]);

  const personalTxs = useMemo(() => {
    return filteredTransactions.filter(t => 
      t.transactionType.startsWith('personal_') || 
      ['owner_withdrawal', 'owner_deposit'].includes(t.transactionType)
    );
  }, [filteredTransactions]);

  // Unique category extraction for dynamic filters
  const uniqueBizCategories = useMemo(() => {
    const categories = new Set<string>();
    businessTxs.forEach(t => { if (t.category) categories.add(t.category); });
    return Array.from(categories);
  }, [businessTxs]);

  const uniquePersCategories = useMemo(() => {
    const categories = new Set<string>();
    personalTxs.forEach(t => { if (t.category) categories.add(t.category); });
    return Array.from(categories);
  }, [personalTxs]);

  // Ledger filter & sort logic — Business
  const filteredBizTxs = useMemo(() => {
    let result = [...businessTxs];

    // Search query
    if (bizSearchQuery.trim()) {
      const q = bizSearchQuery.toLowerCase();
      result = result.filter(t => 
        (t.category || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.source || '').toLowerCase().includes(q) ||
        (t.referenceId || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (bizCategoryFilter !== 'all') {
      result = result.filter(t => t.category === bizCategoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (bizSortOrder === 'date_desc') return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      if (bizSortOrder === 'date_asc') return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      if (bizSortOrder === 'amount_desc') return b.amount - a.amount;
      if (bizSortOrder === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [businessTxs, bizSearchQuery, bizCategoryFilter, bizSortOrder]);

  // Ledger filter & sort logic — Personal
  const filteredPersTxs = useMemo(() => {
    let result = [...personalTxs];

    // Search query
    if (persSearchQuery.trim()) {
      const q = persSearchQuery.toLowerCase();
      result = result.filter(t => 
        (t.category || '').toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q) ||
        (t.source || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (persCategoryFilter !== 'all') {
      result = result.filter(t => t.category === persCategoryFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (persSortOrder === 'date_desc') return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      if (persSortOrder === 'date_asc') return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      if (persSortOrder === 'amount_desc') return b.amount - a.amount;
      if (persSortOrder === 'amount_asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [personalTxs, persSearchQuery, persCategoryFilter, persSortOrder]);

  const calcTotals = useMemo(() => {
    let busIncome = 0;
    let busExpense = 0;
    let persIncome = 0;
    let persExpense = 0;
    let ownWithdrawal = 0;
    let ownDeposit = 0;

    filteredTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      switch (t.transactionType) {
        case 'business_income': case 'customer_payment': busIncome += amt; break;
        case 'business_expense': case 'supplier_payment': busExpense += amt; break;
        case 'personal_income': persIncome += amt; break;
        case 'personal_expense': persExpense += amt; break;
        case 'owner_withdrawal': ownWithdrawal += amt; break;
        case 'owner_deposit': ownDeposit += amt; break;
      }
    });

    const netBusinessProfit = busIncome - busExpense;
    const netPosition = netBusinessProfit + ownDeposit + persIncome - ownWithdrawal - persExpense;

    let totalReceivables = 0;
    let totalPayables = 0;
    filteredBills.forEach(b => {
      if ((b as any).type === 'sale') totalReceivables += b.balanceAmount;
      if ((b as any).type === 'purchase') totalPayables += b.balanceAmount;
    });

    // Premium Calculations
    const bizProfitMargin = busIncome > 0 ? (netBusinessProfit / busIncome) * 100 : 0;
    const persSavingRate = persIncome > 0 ? ((persIncome - persExpense) / persIncome) * 100 : 0;
    const extractionRatio = busIncome > 0 ? (ownWithdrawal / busIncome) * 100 : 0;

    return {
      busIncome, busExpense, netBusinessProfit, totalReceivables, totalPayables,
      persIncome, persExpense, ownWithdrawal, ownDeposit,
      netPosition, bizProfitMargin, persSavingRate, extractionRatio
    };
  }, [filteredTransactions, filteredBills]);

  const handleAddPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalForm.amount || Number(personalForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    try {
      await addTransaction({
        transactionType: personalForm.transactionType,
        category: personalForm.category,
        amount: Number(personalForm.amount),
        source: 'Manual Entry',
        notes: personalForm.notes,
        transactionDate: personalForm.transactionDate
      });
      setIsAddingPersonal(false);
      showToast('Transaction added successfully', 'success');
      setPersonalForm({ ...personalForm, amount: '', notes: '' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Generate responsive/dynamic charts data
  const chartData = useMemo(() => {
    const isShortRange = ['today', 'this_week', 'last_30_days', 'this_month', 'custom'].includes(duration);
    const aggregatedData: Record<string, any> = {};
    
    const sortedTxs = [...filteredTransactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    
    if (isShortRange && sortedTxs.length > 0) {
      // Aggregate by Day (YYYY-MM-DD) for smaller ranges
      sortedTxs.forEach(t => {
        const d = t.transactionDate;
        if (!aggregatedData[d]) {
          aggregatedData[d] = { name: d, label: d, revenue: 0, expenses: 0, profit: 0, persSpend: 0, withdrawal: 0 };
        }
        const amt = Number(t.amount);
        if (t.transactionType === 'business_income' || t.transactionType === 'customer_payment') aggregatedData[d].revenue += amt;
        if (t.transactionType === 'business_expense' || t.transactionType === 'supplier_payment') aggregatedData[d].expenses += amt;
        if (t.transactionType === 'personal_expense') aggregatedData[d].persSpend += amt;
        if (t.transactionType === 'owner_withdrawal') aggregatedData[d].withdrawal += amt;
        
        aggregatedData[d].profit = aggregatedData[d].revenue - aggregatedData[d].expenses;
      });
    } else {
      // Legacy Monthly Aggregation (e.g. Trailing Months)
      const monthsSet = new Set<string>();
      
      const trailing6Months = Array.from({length: 6}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }).reverse();
      
      trailing6Months.forEach(m => monthsSet.add(m));
      
      transactions.forEach(t => {
        const m = t.transactionDate.substring(0, 7);
        monthsSet.add(m);
      });
      
      const sortedMonths = Array.from(monthsSet).sort();
      const displayMonths = sortedMonths.slice(-12); // Limit to last 12 months maximum
      
      displayMonths.forEach(m => {
        aggregatedData[m] = { name: m, label: m, revenue: 0, expenses: 0, profit: 0, persSpend: 0, withdrawal: 0 };
      });
      
      transactions.forEach(t => {
        const m = t.transactionDate.substring(0, 7);
        if (aggregatedData[m]) {
          const amt = Number(t.amount);
          if (t.transactionType === 'business_income' || t.transactionType === 'customer_payment') aggregatedData[m].revenue += amt;
          if (t.transactionType === 'business_expense' || t.transactionType === 'supplier_payment') aggregatedData[m].expenses += amt;
          if (t.transactionType === 'personal_expense') aggregatedData[m].persSpend += amt;
          if (t.transactionType === 'owner_withdrawal') aggregatedData[m].withdrawal += amt;
          
          aggregatedData[m].profit = aggregatedData[m].revenue - aggregatedData[m].expenses;
        }
      });
    }
    
    return Object.values(aggregatedData);
  }, [filteredTransactions, transactions, duration]);

  // Premium Floating Tooltip Component for Charts
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl shadow-xl text-left text-xs text-white ring-1 ring-white/10 animate-fade-in">
          <p className="font-bold text-zinc-400 mb-2 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-indigo-400" /> {formatHumanDate(label) || label}
          </p>
          <div className="space-y-1.5 min-w-[170px]">
            {payload.map((p: any) => (
              <div key={p.name} className="flex justify-between items-center gap-6">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke || p.fill }} />
                  {p.name}
                </span>
                <span className=" font-black text-white">
                  ₹ {Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-20 text-left w-full min-w-0 font-sans">
      
      {/* Premium Elegant SaaS Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 bg-gradient-to-r from-white via-slate-50 to-indigo-50/25 text-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-60 h-60 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:20px_20px] opacity-10 pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100/80 rounded-md text-[9px] font-extrabold uppercase tracking-widest text-[#003580] shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#003580]" /> Core Ledger V2.5
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 text-[#003580]">
            <Landmark className="w-7 h-7 text-[#003580] shrink-0" /> Financial Center
          </h1>
          <p className="text-slate-500 font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
            Real-time analytics and segregation auditing for business & personal portfolios. Filter transactions dynamically across standard tax ranges.
          </p>
        </div>

        {/* Global Financial Indicator widget inside Header */}
        <div className="relative z-10 flex flex-wrap gap-4 items-center bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-200/80 shadow-xs self-stretch xl:self-auto justify-between sm:justify-start">
          <div className="space-y-0.5 pr-4 border-r border-slate-200">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Gross Inflow</p>
            <p className="text-xs sm:text-sm font-black text-emerald-650">₹ {(calcTotals.busIncome + calcTotals.persIncome).toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-0.5 pr-4 border-r border-slate-200">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Gross Outflow</p>
            <p className="text-xs sm:text-sm font-black text-rose-655">₹ {(calcTotals.busExpense + calcTotals.persExpense + calcTotals.ownWithdrawal).toLocaleString('en-IN')}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Index Status</p>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
              <span className={`w-1.5 h-1.5 rounded-full ${calcTotals.netPosition >= 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-pulse"}`} />
              {calcTotals.netPosition >= 0 ? "Healthy" : "Deficit"}
            </span>
          </div>
        </div>
      </div>

      {/* Ultra-Premium Compact Duration Selection Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center gap-2.5 z-10 text-left bg-transparent">
          {/* Advanced dropdown selector wrapper */}
          <div className="relative">
            <button
              onClick={() => setDurationDropdownOpen(!durationDropdownOpen)}
              className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-150 shadow-3xs cursor-pointer select-none"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#003580] shrink-0" />
              <div className="text-left shrink-0">
                <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider leading-none">Selected Duration</span>
                <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-extrabold text-[#003580] uppercase tracking-wider">
                  {(durationsConfig.find(o => o.id === duration) || durationsConfig[0]).label}
                  <span className="text-[10px] ml-0.5">{(durationsConfig.find(o => o.id === duration) || durationsConfig[0]).icon}</span>
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ml-1 shrink-0 ${durationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {durationDropdownOpen && (
              <>
                {/* Backdrop Click Handler */}
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setDurationDropdownOpen(false)} 
                />
                
                {/* Floating Options Menu */}
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-md py-1.5 z-30 animate-fade-in divide-y divide-slate-100">
                  <div className="px-3 py-1 bg-slate-50">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Select Filter Duration</p>
                  </div>
                  <div className="p-1 max-h-64 overflow-y-auto space-y-0.5 custom-chart-scroll">
                    {durationsConfig.map((opt) => {
                      const isSelected = duration === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setDuration(opt.id);
                            setDurationDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 text-[#003580] border-l-2 border-[#003580]' 
                              : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-xs shrink-0">{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10.5px] font-black uppercase tracking-wide ${isSelected ? 'text-[#003580]' : 'text-slate-700'}`}>
                              {opt.label}
                            </p>
                            <p className="text-[8.5px] font-medium text-slate-400 truncate leading-none mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {duration !== 'all_time' && (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-100/80 rounded-md flex items-center gap-1 shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Range Active
            </span>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 z-10 w-full sm:w-auto">
          {duration === 'custom' && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner w-full sm:w-auto shrink-0 justify-between">
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-705 focus:ring-1 focus:ring-[#003580]/30 focus:border-[#003580] outline-none max-w-[105px]"
              />
              <span className="text-slate-400 font-extrabold text-[8px] uppercase">to</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-705 focus:ring-1 focus:ring-[#003580]/30 focus:border-[#003580] outline-none max-w-[105px]"
              />
            </div>
          )}
          
          <p className="flex text-[9px] font-semibold text-slate-405 items-center justify-end gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg min-w-0 max-w-full truncate">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{activeRangeText}</span>
          </p>
        </div>
      </div>

      {/* Tabs navigation selectors */}

      <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs border border-slate-200/80">
        {[
          { id: 'overview', label: 'Index Overview' },
          { id: 'business', label: 'Business Ledger' },
          { id: 'personal', label: 'Personal Ledger' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-[#003580] shadow-sm text-white' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* INDEX OVERVIEW TAB PRESENTATION */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Bento Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* Net Available Wealth Card */}
            <div className="bg-gradient-to-br from-white via-slate-50/50 to-white text-slate-900 border border-slate-205 p-5 sm:p-6 rounded-2xl shadow-xs col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-[10px] font-black uppercase text-[#003580] tracking-widest flex items-center gap-1.5 matches-vyapar-mitra">
                     <Wallet className="w-3.5 h-3.5 text-[#003580]" /> Consolidated Net Position
                   </h3>
                   <span className="px-2 py-0.5 bg-[#e6f2ff] text-[#003580] text-[8px] font-bold uppercase rounded border border-blue-100 uppercase tracking-wider">
                     Indexed
                   </span>
                 </div>
                 <p className={`text-xl sm:text-2xl font-black tracking-tighter break-all ${calcTotals.netPosition < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                    ₹ {calcTotals.netPosition.toLocaleString('en-IN')}
                 </p>
                 <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">Consolidates operating cash flow and personal investments.</p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Business Profits
                  </span>
                  <span className="text-emerald-600">₹ {calcTotals.netBusinessProfit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Capital Deposits
                  </span>
                  <span className="text-indigo-600">+₹ {calcTotals.ownDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 font-sans flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-550" /> Capital Extraction
                  </span>
                  <span className="text-rose-600">-₹ {calcTotals.ownWithdrawal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-sans">Net Personal Savings</span>
                  <span className={calcTotals.persIncome - calcTotals.persExpense >= 0 ? "text-emerald-600" : "text-rose-600"}>
                     ₹ {(calcTotals.persIncome - calcTotals.persExpense).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Business operating card */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm col-span-1 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-all">
              <div className="absolute -right-3 -top-3 w-20 h-20 bg-indigo-50 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-100 transition-colors" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                     <Building className="w-5 h-5 text-indigo-600" />
                     <h3 className="text-xs font-black uppercase text-zinc-700 tracking-wider">Business Status</h3>
                  </div>
                  {calcTotals.bizProfitMargin > 0 && (
                     <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-full border border-emerald-100">
                       Margin: {calcTotals.bizProfitMargin.toFixed(1)}%
                     </span>
                  )}
                </div>
                
                <div className="space-y-4">
                   <div className="">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Operating Revenue</p>
                      <p className="text-base sm:text-lg font-black text-emerald-600 break-all">₹ {calcTotals.busIncome.toLocaleString('en-IN')}</p>
                   </div>
                   <div className="">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Indirect expenditure</p>
                      <p className="text-base sm:text-lg font-black text-rose-600 break-all">₹ {calcTotals.busExpense.toLocaleString('en-IN')}</p>
                   </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4 ">
                <div>
                    <p className="text-[9px] font-black uppercase text-zinc-400">Receivables</p>
                    <p className="text-xs font-black text-zinc-700">₹ {calcTotals.totalReceivables.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-zinc-400">Payables</p>
                    <p className="text-xs font-black text-zinc-700">₹ {calcTotals.totalPayables.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Personal Portfolio card */}
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm col-span-1 flex flex-col justify-between relative overflow-hidden group hover:border-zinc-300 transition-all">
              <div className="absolute -right-3 -top-3 w-20 h-20 bg-violet-50 rounded-full blur-xl pointer-events-none group-hover:bg-violet-100 transition-colors" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                     <User className="w-5 h-5 text-indigo-600" />
                     <h3 className="text-xs font-black uppercase text-zinc-700 tracking-wider">Personal Safety Vault</h3>
                  </div>
                  {calcTotals.persSavingRate > 0 && (
                     <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-black uppercase rounded-full border border-violet-100">
                       Savings: {calcTotals.persSavingRate.toFixed(1)}%
                     </span>
                  )}
                </div>
                
                <div className="space-y-4 ">
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Independent Income</p>
                      <p className="text-base sm:text-lg font-black text-emerald-600 break-all">₹ {calcTotals.persIncome.toLocaleString('en-IN')}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Consumption Spending</p>
                      <p className="text-base sm:text-lg font-black text-rose-600 break-all">₹ {calcTotals.persExpense.toLocaleString('en-IN')}</p>
                   </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-4 ">
                <div>
                    <p className="text-[9px] font-black uppercase text-zinc-400">Extracted/Withdrawn</p>
                    <p className="text-xs font-black text-amber-600">₹ {calcTotals.ownWithdrawal.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-zinc-400">Capital Seeded</p>
                    <p className="text-xs font-black text-indigo-600">₹ {calcTotals.ownDeposit.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Core Analytics Visual Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Embed modern minimal scrollbar style definition */}
                <style>{`
                  .custom-chart-scroll::-webkit-scrollbar {
                    height: 6px;
                  }
                  .custom-chart-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 9999px;
                  }
                  .custom-chart-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 9999px;
                    border: 1.5px solid #f1f5f9;
                  }
                  .custom-chart-scroll::-webkit-scrollbar-thumb:hover {
                    background: #003580;
                  }
                `}</style>
                
                {/* Chart 1: Business Trends */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs relative overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">Operating Margins Timeline</h3>
                      <p className="text-slate-400 text-[9px] sm:text-[10px] font-semibold mt-0.5">Aggregates sales revenue against operational debit cycles.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-black uppercase tracking-wider border border-slate-200">
                      Granularity: {['today', 'this_week', 'last_30_days', 'this_month', 'custom'].includes(duration) ? 'Daily' : 'Monthly'}
                    </span>
                  </div>
                  
                  <div className="flex items-stretch h-64 mt-1 space-x-1.5">
                    {/* Fixed Y-Axis Section */}
                    {chartData.length > 0 && (
                      <div className="w-12 shrink-0 select-none pb-5" style={{ contentVisibility: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis hide={true} dataKey="name" />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} tickFormatter={(v) => `₹${v/1000}k`} />
                            <Area type="monotone" dataKey="revenue" stroke="transparent" fill="transparent" activeDot={false} />
                            <Area type="monotone" dataKey="expenses" stroke="transparent" fill="transparent" activeDot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Scrollable grid, X-Axis & Area content */}
                    <div ref={chartContainerRef1} className="flex-1 overflow-x-auto pb-2 custom-chart-scroll">
                      <div className="h-full min-w-[700px]">
                        {chartData.length === 0 ? (
                          <div className="h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-50 rounded-2xl">
                            Insufficient parameters to map. Select a wider range.
                          </div>
                        ) : (
                          <ResponsiveContainer debounce={100} width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                              <YAxis hide={true} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip content={<CustomChartTooltip />} />
                              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Sales Revenue" />
                              <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" name="Business Expenditures" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart 2: Personal Trends */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs relative overflow-hidden">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">Liquidity Extraction Metrics</h3>
                      <p className="text-slate-400 text-[9px] sm:text-[10px] font-semibold mt-0.5">Auditing capital transfers and owner distribution patterns.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-stretch h-52 mt-1 space-x-1.5">
                    {/* Fixed Y-Axis Section */}
                    {chartData.length > 0 && (
                      <div className="w-12 shrink-0 select-none pb-5" style={{ contentVisibility: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis hide={true} dataKey="name" />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} tickFormatter={(v) => `₹${v/1000}k`} />
                            <Line type="monotone" dataKey="persSpend" stroke="transparent" dot={false} activeDot={false} />
                            <Line type="monotone" dataKey="withdrawal" stroke="transparent" dot={false} activeDot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Scrollable grid, X-Axis & Line content */}
                    <div ref={chartContainerRef2} className="flex-1 overflow-x-auto pb-2 custom-chart-scroll">
                      <div className="h-full min-w-[700px]">
                        {chartData.length === 0 ? (
                          <div className="h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-50 rounded-2xl">
                            Insufficient parameters to map. Select a wider range.
                          </div>
                        ) : (
                          <ResponsiveContainer debounce={100} width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} dy={10} />
                              <YAxis hide={true} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <Tooltip content={<CustomChartTooltip />} />
                              <Line type="monotone" dataKey="persSpend" stroke="#8b5cf6" strokeWidth={2.5} dot={{r: 3, stroke: '#ffffff', strokeWidth: 1.5, fill: '#8b5cf6'}} name="Personal Consumption" />
                              <Line type="monotone" dataKey="withdrawal" stroke="#f59e0b" strokeWidth={2.5} dot={{r: 3, stroke: '#ffffff', strokeWidth: 1.5, fill: '#f59e0b'}} name="Owner Distribution" />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
             </div>

             {/* Financial Advisor and Rules Engine Panel */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#003580] animate-pulse" />
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Health Audit Engine</h3>
                   </div>
                   <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                   </span>
                </div>
                
                <div className="space-y-3">
                   {calcTotals.netPosition < 0 && (
                     <div className="flex gap-3.5 p-3.5 border border-slate-100 border-l-[3.5px] border-l-rose-500 bg-rose-50/20 rounded-xl items-start animate-fade-in shadow-3xs hover:bg-rose-50/30 transition">
                       <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                       <div className="text-left">
                         <p className="text-[10px] sm:text-xs font-black text-rose-950 uppercase tracking-wide">Critical Insolvency Deficit</p>
                         <p className="text-[10.5px] font-semibold text-rose-800 mt-1 leading-relaxed">
                           Total outflows exceed liquidity in active duration. Capital seed injection or rigid budget guidelines must immediately serve as correctives.
                         </p>
                       </div>
                     </div>
                   )}
                   
                   {calcTotals.ownWithdrawal > (calcTotals.netBusinessProfit * 0.70) && calcTotals.netBusinessProfit > 0 && (
                     <div className="flex gap-3.5 p-3.5 border border-slate-100 border-l-[3.5px] border-l-amber-500 bg-amber-50/20 rounded-xl items-start shadow-3xs hover:bg-amber-50/30 transition">
                       <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                       <div className="text-left">
                         <p className="text-[10px] sm:text-xs font-black text-amber-950 uppercase tracking-wide">Excess Liquidity Extraction</p>
                         <p className="text-[10.5px] font-semibold text-amber-800 mt-1 leading-relaxed">
                           Withdrawn assets comprise over <span className="font-bold underline">70%</span> of net operating profits. Retain margins in core treasury to shield against scaling risks.
                         </p>
                       </div>
                     </div>
                   )}

                   {calcTotals.totalReceivables > (calcTotals.busIncome * 0.20) && calcTotals.busIncome > 0 && (
                     <div className="flex gap-3.5 p-3.5 border border-slate-100 border-l-[3.5px] border-l-orange-500 bg-orange-50/20 rounded-xl items-start shadow-3xs hover:bg-orange-50/30 transition">
                       <Activity className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
                       <div className="text-left">
                         <p className="text-[10px] sm:text-xs font-black text-orange-950 uppercase tracking-wide">Receivables Blockage Risk</p>
                         <p className="text-[10.5px] font-semibold text-orange-850 mt-1 leading-relaxed">
                           Unpaid customer balance exceeds 20% of generated volume. Enforce prompt milestone invoices to prevent cash locks.
                         </p>
                       </div>
                     </div>
                   )}

                   {chartData.length >= 2 && chartData[chartData.length - 1].expenses > (chartData[chartData.length - 2].expenses * 1.3) && (
                      <div className="flex gap-3.5 p-3.5 border border-slate-100 border-l-[3.5px] border-l-sky-500 bg-sky-50/20 rounded-xl items-start shadow-3xs hover:bg-sky-50/30 transition">
                       <TrendingDown className="w-4.5 h-4.5 text-sky-600 shrink-0 mt-0.5" />
                       <div className="text-left">
                         <p className="text-[10px] sm:text-xs font-black text-sky-950 uppercase tracking-wide">Operational Spill Detected</p>
                         <p className="text-[10.5px] font-semibold text-sky-850 mt-1 leading-relaxed">
                           Operational expenditure spike mapped this period. Assess recent supplier terms or overhead leaks.
                         </p>
                       </div>
                     </div>
                   )}

                   {(calcTotals.netPosition >= 0 && calcTotals.ownWithdrawal <= (calcTotals.netBusinessProfit * 0.5)) && calcTotals.netBusinessProfit > 0 && (
                     <div className="flex gap-3.5 p-3.5 border border-slate-100 border-l-[3.5px] border-l-emerald-500 bg-emerald-50/20 rounded-xl items-start shadow-3xs hover:bg-emerald-50/30 transition">
                       <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                       <div className="text-left">
                         <p className="text-[10px] sm:text-xs font-black text-emerald-950 uppercase tracking-wide">Excellent Treasury Balance</p>
                         <p className="text-[10.5px] font-semibold text-emerald-800 mt-1 leading-relaxed">
                           Synergy index remains excellent. Your distributions are secure, matching internal growth models seamlessly.
                         </p>
                       </div>
                     </div>
                   )}
                </div>

                {/* CFO metrics checklist */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50/50 border border-slate-205 p-4 rounded-xl space-y-3 shadow-3xs relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                  
                  <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#003580]" /> CFO Projections & Ratios
                  </h4>
                  <div className="space-y-2 text-[10px] font-bold text-slate-505">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs hover:border-slate-300 transition cursor-default">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>Profitability Margin:</span>
                      </span>
                      <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${calcTotals.bizProfitMargin >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                        {calcTotals.bizProfitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs hover:border-slate-300 transition cursor-default">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Personal Savings Rate:</span>
                      </span>
                      <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${calcTotals.persSavingRate >= 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {calcTotals.persSavingRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-3xs hover:border-slate-300 transition cursor-default">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Liquidity Extraction Ratio:</span>
                      </span>
                      <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${calcTotals.extractionRatio > 50 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        {calcTotals.extractionRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* BUSINESS LEDGER TAB PRESENTATION */}
      {activeTab === 'business' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Business Revenue', val: calcTotals.busIncome, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
              { label: 'Business Expenses', val: calcTotals.busExpense, color: 'text-rose-600', bg: 'bg-rose-50/50' },
              { label: 'Net Business Profit', val: calcTotals.netBusinessProfit, color: calcTotals.netBusinessProfit >= 0 ? 'text-indigo-600' : 'text-rose-600', bg: 'bg-indigo-50/50' },
              { label: 'Gross Receivables', val: calcTotals.totalReceivables, color: 'text-zinc-700', bg: 'bg-zinc-50' }
            ].map((card, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${card.val >= 0 || idx !== 1 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">{card.label}</span>
                <p className={`text-sm sm:text-base font-black mt-1 break-all ${card.color}`}>₹ {card.val.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Ledger Table controls and container */}
          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
            
            <div className="p-6 border-b border-zinc-100 flex flex-col gap-4 bg-zinc-50/80">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600 shadow-inner"><Briefcase className="w-5 h-5"/></div>
                    <div>
                       <h3 className="font-black text-zinc-800 text-sm">Business Portfolio Ledger</h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Syncing automatically via generated customer bills</p>
                    </div>
                 </div>
              </div>

              {/* Dynamic Ledger filter panels */}
              <div className="flex flex-col xl:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by payee, category type, source ref, notes..."
                    value={bizSearchQuery}
                    onChange={(e) => setBizSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2 shadow-sm">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                    <select
                      value={bizCategoryFilter}
                      onChange={(e) => setBizCategoryFilter(e.target.value)}
                      className="py-2.5 pr-2 bg-transparent text-xs font-bold text-zinc-700 outline-none border-none pointer-events-auto"
                    >
                      <option value="all">All Channels</option>
                      {uniqueBizCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2 shadow-sm">
                    <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                    <select
                      value={bizSortOrder}
                      onChange={(e) => setBizSortOrder(e.target.value as any)}
                      className="py-2.5 pr-2 bg-transparent text-xs font-bold text-zinc-700 outline-none border-none"
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="amount_desc">Amount: High-Low</option>
                      <option value="amount_asc">Amount: Low-High</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Render table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 text-zinc-500 font-black text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-zinc-200">Processing Date</th>
                    <th className="p-4 border-b border-zinc-200">Transaction Category & Type</th>
                    <th className="p-4 border-b border-zinc-200">Origin / Reference ID</th>
                    <th className="p-4 border-b border-zinc-200">Audit Notes</th>
                    <th className="p-4 border-b border-zinc-200 text-right">Value Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredBizTxs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center bg-gradient-to-b from-slate-50/20 to-white">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto select-none py-4">
                           <div className="w-12 h-12 bg-white border border-zinc-100 rounded-xl shadow-xs flex items-center justify-center mb-3">
                             <FileText className="w-6 h-6 text-indigo-500 stroke-[1.5] animate-pulse-subtle" />
                           </div>
                           <h4 className="font-black text-zinc-800 text-xs uppercase tracking-wider">No ledger indexes mapped</h4>
                           <p className="text-[10px] font-semibold text-zinc-400 mt-1 leading-relaxed">
                             We could not find matching business bookkeeping entries. Broaden your search parameters or register new client ledger transactions.
                           </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBizTxs.map(tx => {
                    const isCreditInflow = tx.transactionType.includes('income') || tx.transactionType.includes('customer');
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition duration-150">
                        <td className="p-4  text-xs text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            {formatHumanDate(tx.transactionDate)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase inline-block border ${
                            isCreditInflow 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                          <div className="text-xs font-black text-zinc-700 mt-1 tracking-tight">{tx.category}</div>
                        </td>
                        <td className="p-4">
                           <div className="font-bold text-zinc-800 text-xs">{tx.source}</div>
                           {tx.referenceId && <div className="text-zinc-400  text-[9px] mt-0.5 bg-zinc-100 px-1 py-0.5 rounded inline-block">Ref: {tx.referenceId}</div>}
                        </td>
                        <td className="p-4 text-zinc-500 text-xs max-w-[220px] truncate">{tx.notes || '-'}</td>
                        <td className={`p-4 text-right font-black  text-sm tracking-tight ${
                          isCreditInflow ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isCreditInflow ? '+' : '-'}₹ {Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL LEDGER TAB PRESENTATION */}
      {activeTab === 'personal' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
            {[
              { label: 'Personal Income', val: calcTotals.persIncome, color: 'text-emerald-600', border: 'border-emerald-200' },
              { label: 'Personal Expenses', val: calcTotals.persExpense, color: 'text-rose-600', border: 'border-rose-200' },
              { label: 'Owner Withdrawals', val: calcTotals.ownWithdrawal, color: 'text-amber-600', border: 'border-amber-200' },
              { label: 'Owner Deposits', val: calcTotals.ownDeposit, color: 'text-indigo-600', border: 'border-indigo-200' }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-zinc-200">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider block">{stat.label}</span>
                <p className={`text-sm sm:text-base font-black mt-1 break-all ${stat.color}`}>₹ {stat.val.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
            
            <div className="p-6 border-b border-zinc-100 flex flex-col gap-4 bg-zinc-50/80">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-violet-100 p-2.5 rounded-2xl text-violet-600 shadow-inner"><User className="w-5 h-5"/></div>
                    <div>
                       <h3 className="font-black text-zinc-800 text-sm">Personal & Distribution Ledger</h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Secure records tracking non-operating asset distributions</p>
                    </div>
                 </div>
                 
                 <button 
                   onClick={() => setIsAddingPersonal(true)} 
                   className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-black uppercase rounded-xl shadow-lg hover:shadow-zinc-300 transition-all active:scale-95 self-start sm:self-auto"
                 >
                   <Plus className="w-4 h-4" /> Log record entry
                 </button>
              </div>

              {/* Dynamic Ledger filter panels */}
              <div className="flex flex-col xl:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search personal catalog note tags..."
                    value={persSearchQuery}
                    onChange={(e) => setPersSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2 shadow-sm">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                    <select
                      value={persCategoryFilter}
                      onChange={(e) => setPersCategoryFilter(e.target.value)}
                      className="py-2.5 pr-2 bg-transparent text-xs font-bold text-zinc-700 outline-none border-none"
                    >
                      <option value="all">All Vaults</option>
                      {uniquePersCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2 shadow-sm">
                    <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                    <select
                      value={persSortOrder}
                      onChange={(e) => setPersSortOrder(e.target.value as any)}
                      className="py-2.5 pr-2 bg-transparent text-xs font-bold text-zinc-700 outline-none border-none"
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="date_asc">Oldest Date</option>
                      <option value="amount_desc">Amount: High-Low</option>
                      <option value="amount_asc">Amount: Low-High</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 text-zinc-500 font-black text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4 border-b border-zinc-200">Processing Date</th>
                    <th className="p-4 border-b border-zinc-200">Category & Type</th>
                    <th className="p-4 border-b border-zinc-200">Audit Notes</th>
                    <th className="p-4 border-b border-zinc-200 text-right">Value Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPersTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center bg-gradient-to-b from-slate-50/20 to-white">
                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto select-none py-4">
                           <div className="w-12 h-12 bg-white border border-zinc-100 rounded-xl shadow-xs flex items-center justify-center mb-3">
                             <FileText className="w-6 h-6 text-purple-500 stroke-[1.5] animate-pulse-subtle" />
                           </div>
                           <h4 className="font-black text-zinc-800 text-xs uppercase tracking-wider">No personal logs registered</h4>
                           <p className="text-[10px] font-semibold text-zinc-400 mt-1 leading-relaxed">
                             There are no personal wealth transfers recorded. Tap the &apos;Log New Entry&apos; option above to instantly audit your non-business capital.
                           </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPersTxs.map(tx => {
                    const isCreditInflow = tx.transactionType.includes('income') || tx.transactionType === 'owner_deposit';
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 transition duration-150">
                        <td className="p-4  text-xs text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {formatHumanDate(tx.transactionDate)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase inline-block border ${
                            isCreditInflow 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {tx.transactionType.replace('_', ' ')}
                          </span>
                          <div className="text-xs font-black text-zinc-700 mt-1 tracking-tight">{tx.category}</div>
                        </td>
                        <td className="p-4 text-zinc-500 text-xs truncate max-w-[320px]">{tx.notes || '-'}</td>
                        <td className={`p-4 text-right font-black  text-sm tracking-tight ${
                          isCreditInflow ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isCreditInflow ? '+' : '-'}₹ {Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Personal Record Flow */}
      {isAddingPersonal && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-100 border border-zinc-200">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/80">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-100 p-1.5 rounded-xl text-indigo-600"><CreditCard className="w-5 h-5"/></div>
                <div>
                  <h3 className="font-black text-zinc-800 text-base">Record Assets Log</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Auditing separate capital categories</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingPersonal(false)} 
                className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleAddPersonal} className="p-6 space-y-5">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Type of money movement</label>
                <select 
                  value={personalForm.transactionType}
                  onChange={e => {
                     const type = e.target.value as TransactionType;
                     setPersonalForm({
                        ...personalForm, 
                        transactionType: type,
                        category: type === 'personal_expense' ? EXPENSE_CATEGORIES[0] : (type === 'personal_income' ? INCOME_CATEGORIES[0] : 'Capital')
                     });
                  }}
                  className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                >
                  <option value="personal_expense">Personal Consumption Expense</option>
                  <option value="personal_income">Personal Independent Income</option>
                  <option value="owner_withdrawal">Owner Withdrawal (Capital Extracted)</option>
                  <option value="owner_deposit">Owner Deposit (Capital Invested/Seeded)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 block">Asset Category</label>
                {['owner_withdrawal', 'owner_deposit'].includes(personalForm.transactionType) ? (
                    <input 
                      type="text"
                      disabled
                      value="Capital Transfer Ledger"
                      className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-500 cursor-not-allowed outline-none"
                    />
                ) : (
                    <select
                        value={personalForm.category}
                        onChange={e => setPersonalForm({...personalForm, category: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                    >
                        {(personalForm.transactionType === 'personal_expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Amount (₹)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={personalForm.amount}
                      onChange={(e) => {
                        let valStr = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = valStr.split('.');
                        if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                        setPersonalForm({...personalForm, amount: valStr});
                      }}
                      onKeyDown={(e) => {
                        if (['-', 'e', '+'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onBlur={() => {
                        const num = Number(personalForm.amount);
                        if (isNaN(num) || num <= 0) {
                          setPersonalForm({...personalForm, amount: "100.00"});
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl  text-xs font-black text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                    />
                    {personalForm.amount && Number(personalForm.amount) > 0 && (
                      <span className="absolute right-3 -bottom-2 text-[8px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1 z-10 pointer-events-none transition-all">
                        Format: ₹{Number(personalForm.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Effective Date</label>
                  <input 
                    type="date"
                    required
                    value={personalForm.transactionDate}
                    onChange={e => setPersonalForm({...personalForm, transactionDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl font-bold text-xs text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-500 block">Transaction Notes (Optional)</label>
                <textarea 
                  value={personalForm.notes}
                  onChange={e => setPersonalForm({...personalForm, notes: e.target.value})}
                  placeholder="Record purposes of transfer, vendor types, or category logs..."
                  className="w-full p-4 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow shadow-sm resize-none h-24"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:shadow-zinc-300 hover:scale-[1.01] transition-all duration-200 active:scale-[0.98]"
              >
                Log Wealth Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
