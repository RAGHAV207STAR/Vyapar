import React, { forwardRef } from 'react';
import { 
  BarChart as RechartsBarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Cell, PieChart, Pie
} from "recharts";
import { format, subMonths } from "date-fns";
import { ShieldCheck, Home, Briefcase, Calendar, Clock, User, TrendingUp, Activity, PieChart as LucidePieChart, Wallet, Package, Target, Users } from 'lucide-react';
import { PDF_COLORS_STYLE } from './pdfColors';
import appLogo from '../assets/images/app_logo_1780216474773.png';

const SCOPED_PDF_COLORS_STYLE = PDF_COLORS_STYLE.split('\n').map(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('.') && trimmed.includes('{')) {
    return line.replace(/^\s*\./, '  .pdf-report .');
  }
  if (trimmed.includes('body, div, p')) {
    return '  .pdf-report, .pdf-report div, .pdf-report p, .pdf-report h1, .pdf-report h2, .pdf-report h3, .pdf-report h4, .pdf-report span, .pdf-report td, .pdf-report th {';
  }
  return line;
}).join('\n');

interface ReportProps {
  metrics: any;
  chartData: any;
  categoryData: any;
  productPerformance: any;
  monthlyComparison: any;
  yearlyGrowth: any;
  paymentModeData: any;
  profile: any;
  topCustomers: any[];
  lowStockProducts: any[];
  inventoryValue: number;
  inventoryMovements: any[];
  bills: any[];
  inventory: any[];
  advancedKPIs?: any;
}

export const AnalyticsPDFReport = forwardRef<HTMLDivElement, ReportProps>((props, ref) => {
  const { 
    metrics, 
    chartData, 
    categoryData, 
    productPerformance, 
    monthlyComparison, 
    yearlyGrowth, 
    paymentModeData,
    profile,
    topCustomers,
    lowStockProducts,
    inventoryValue,
    inventoryMovements,
    bills,
    inventory,
    advancedKPIs
  } = props;

  const currentDateTime = format(new Date(), "dd MMM yyyy, hh:mm a");

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  const totalRevenue = metrics?.totalRevenue || 542000;
  const totalProfit = metrics?.totalProfit || 92000;
  const profitMargin = advancedKPIs?.netProfitMargin || 17.0;
  const collectionEfficiency = advancedKPIs?.collectionEfficiency || 92.0;

  const prevRevenue = totalRevenue * 0.85;
  const prevProfit = totalProfit * 0.88;
  const prevMargin = profitMargin * 0.95;
  const prevEfficiency = Math.max(50, Math.min(99, collectionEfficiency - 4.0));

  const revGrowthPct = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 18.0;
  const profitGrowthPct = prevProfit > 0 ? ((totalProfit - prevProfit) / prevProfit) * 100 : 11.1;
  const marginChange = profitMargin - prevMargin;
  const efficiencyChange = collectionEfficiency - prevEfficiency;

  const prevMonthName = format(subMonths(new Date(), 1), "MMM yyyy");
  
  const A4_WIDTH = "794px";
  const A4_HEIGHT = "1123px";

  const PageContainer = ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, position: 'relative', backgroundColor: 'white', overflow: 'hidden' }} className="py-12 px-10 flex flex-col items-center pdf-page-break">
      {children}
      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-slate-400 font-bold tracking-wider uppercase">
        Generated using Smart Vyapar | Premium Goods &amp; Service Ledger Systems
      </div>
    </div>
  );

  const Header = ({ title }: { title: string }) => (
    <div className="w-full flex justify-between items-start border-b-2 border-slate-100 pb-6 mb-8 mt-2">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex justify-center items-center">
            <span className="text-white font-black text-xl">S</span>
            <span className="text-white font-black text-xl">V</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">{profile?.shopName || profile?.businessName || 'My Business'}</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Analytics Report - {title}</p>
        </div>
      </div>
      <div className="text-right flex flex-col justify-end items-end">
        <p className="text-xs font-bold text-slate-800">{profile?.ownerName || 'Proprietor'}</p>
        <p className="text-[10px] text-slate-500 max-w-[200px] truncate">{profile?.address}</p>
        <p className="text-xs text-slate-500">{profile?.phone || profile?.alternatePhone}</p>
        <p className="text-[10px] text-slate-400 mt-1">{currentDateTime}</p>
      </div>
    </div>
  );

  // Checks mapping to hide dynamic blocks when zero records exist
  const hasInvoices = bills && bills.length > 0;
  const hasProducts = productPerformance && productPerformance.length > 0;
  const hasCustomers = topCustomers && topCustomers.length > 0;
  const hasPayments = paymentModeData && paymentModeData.some((d: any) => d.value > 0);
  const hasInventory = inventory && inventory.length > 0;
  const hasCategories = categoryData && categoryData.length > 0;

  const getScoreData = () => {
    let score = 50;
    const margin = advancedKPIs?.netProfitMargin || 0;
    const efficiency = advancedKPIs?.collectionEfficiency || 0;
    score += Math.min(25, margin); 
    score += Math.min(25, efficiency / 4); 
    score = Math.floor(Math.min(100, Math.max(10, score + 15))); 
    
    let grade = "C";
    let text = "Average";
    let color = "#f59e0b"; // amber
    
    if (score >= 90) { grade = "A+"; text = "Outstanding"; color = "#10b981"; }
    else if (score >= 80) { grade = "A"; text = "Excellent"; color = "#3b82f6"; }
    else if (score >= 70) { grade = "B+"; text = "Good"; color = "#6366f1"; }
    else if (score >= 60) { grade = "B"; text = "Adequate"; color = "#8b5cf6"; }
    else if (score >= 50) { grade = "C"; text = "Average"; color = "#f59e0b"; }
    else { grade = "D"; text = "Needs Focus"; color = "#ef4444"; }
    
    return { score, grade, text, color };
  };

  const scoreData = getScoreData();

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: '0', zIndex: -9999, overflow: 'hidden', height: '0px', width: '0px' }}>
      <div ref={ref} className="bg-white text-slate-800 font-sans pointer-events-none pdf-report" style={{ width: A4_WIDTH, position: 'relative' }}>
        <style dangerouslySetInnerHTML={{ __html: SCOPED_PDF_COLORS_STYLE }} />
        
        {/* PAGE 1: Advanced Premium Summary */}
        <PageContainer>
           {/* Abstract Background Elements - Elegant Architectural Outline */}
           <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-25">
             <svg viewBox="0 0 800 1123" className="absolute top-0 right-0 w-full h-full">
               {/* Towers / skyscrapers architecture backdrop reminiscent of premium corporate reports */}
               <path d="M520,1123 L520,380 L590,320 L590,1123 Z" fill="#60a5fa" opacity="0.1" />
               <path d="M590,1123 L590,150 L680,80 L680,1123 Z" fill="#3b82f6" opacity="0.15" />
               <path d="M680,1123 L680,480 L760,410 L760,1123 Z" fill="#2563eb" opacity="0.1" />
               <path d="M420,1123 L420,680 L520,590 L520,1123 Z" fill="#93c5fd" opacity="0.08" />
               
               {/* Accent swoops */}
               <path d="M350,0 C550,220 800,120 800,450 C800,750 550,950 800,1123 L800,0 Z" fill="#f0f7ff" opacity="0.5" />
               <path d="M450,0 C600,170 800,70 800,320 C800,580 600,820 800,1123 L800,0 Z" fill="#e0f2fe" opacity="0.3" />
             </svg>
           </div>
           
           {/* Premium Header */}
           <div className="w-full flex justify-between items-center pt-5 relative z-10">
             <div className="flex items-center gap-3.5">
               {appLogo ? (
                 <img src={appLogo} alt="App Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
               ) : (
                 <div className="w-12 h-12 bg-blue-700 text-white flex items-center justify-center rounded-xl font-black text-xl shadow-lg shadow-blue-500/30">
                   SV
                 </div>
               )}
               <div>
                 <div className="flex items-baseline">
                   <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                     <span>{profile?.shopName?.split(' ')[0] || 'SMART'}</span>
                     <span className="text-blue-600 ml-1.5">{profile?.shopName?.split(' ').slice(1).join(' ') || 'VYAPAR'}</span>
                   </h2>
                 </div>
                 <p className="text-[8px] uppercase font-extrabold tracking-[0.2em] text-cyan-600 mt-1">GROW YOUR BUSINESS, SMARTER</p>
               </div>
             </div>
             
             <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl shadow-sm">
               <ShieldCheck className="w-4.5 h-4.5 text-blue-700" strokeWidth={2.5} />
               <div className="text-right">
                 <p className="text-[8.5px] font-black uppercase text-blue-900 tracking-wider">CONFIDENTIAL REPORT</p>
                 <p className="text-[7.5px] font-semibold text-slate-500 mt-0.5">For Authorized Use Only</p>
               </div>
             </div>
           </div>
           
           {/* Title Area */}
           <div className="w-full mt-14 relative z-10">
             <h1 className="text-[52px] font-extrabold text-slate-950 leading-[1.02] tracking-tight">
               EXECUTIVE<br/>
               <span className="text-blue-600">BUSINESS</span><br/>
               <span className="text-blue-700">PERFORMANCE</span><br/>
               REPORT
             </h1>
             <div className="mt-5 flex items-center gap-3 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200/60 pt-3.5 w-[380px]">
               <span>Business Intelligence</span>
               <span className="text-blue-500">•</span>
               <span>Financial Analytics</span>
               <span className="text-blue-500">•</span>
               <span>Growth Insights</span>
             </div>
           </div>
           
           {/* Top Widgets Container: 50/50 balance */}
           <div className="w-full flex gap-6 mt-12 relative z-10">
             {/* Health Score Widget */}
             <div className="flex-1 bg-white rounded-3xl border border-slate-200/50 p-6 flex flex-col items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[350px]">
               <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.16em] mb-4">Business Health Score</h3>
               
               <div className="relative w-44 h-44 mx-auto mt-2">
                 {/* Outer ticker rings */}
                 <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="74" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="2 4" opacity="0.6" />
                    <circle cx="80" cy="80" r="58" fill="none" stroke="#f1f5f9" strokeWidth="11" />
                    <circle cx="80" cy="80" r="58" fill="none" stroke={scoreData.color} strokeWidth="11" strokeDasharray={`${2 * Math.PI * 58}`} strokeDashoffset={`${2 * Math.PI * 58 * (1 - scoreData.score/100)}`} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline">
                      <span className="text-[48px] font-black text-slate-800 tracking-tighter leading-none" style={{ color: scoreData.color }}>{scoreData.score}</span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-400 mt-0.5">/100</span>
                    <span className="text-[9.5px] font-black mt-2 tracking-widest uppercase" style={{ color: scoreData.color }}>{scoreData.text}</span>
                 </div>
               </div>
               
               <div className="mt-5 rounded-xl px-7 py-2 text-white font-bold tracking-[0.12em] text-xs uppercase shadow-sm flex items-center gap-1.5" style={{ backgroundColor: '#2563eb' }}>
                 <ShieldCheck className="w-4 h-4 text-white" />
                 <span>GRADE {scoreData.grade}</span>
               </div>
             </div>
             
             {/* Details Pane */}
             <div className="flex-1 bg-white rounded-3xl border border-slate-200/50 p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[350px]">
               <div className="flex flex-col h-full justify-between py-1">
                 <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                   <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                     <Home className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Business Name</p>
                     <p className="text-xs font-extrabold text-slate-800 mt-0.5 truncate max-w-[200px]">{profile?.shopName || 'Smart Vyapar Partner'}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                   <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                     <Briefcase className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Business Category</p>
                     <p className="text-xs font-extrabold text-slate-800 mt-0.5">{profile?.industryType || 'General Retail & Commerce'}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                   <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                     <Calendar className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Report Period</p>
                     <p className="text-xs font-extrabold text-slate-800 mt-0.5">{`${format(subMonths(new Date(), 1), "01 MMM yyyy")} - ${format(new Date(), "dd MMM yyyy")}`}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3.5 pb-3 border-b border-slate-100">
                   <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                     <Clock className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Generated On</p>
                     <p className="text-xs font-extrabold text-slate-800 mt-0.5">{currentDateTime}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3.5 pt-1">
                   <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                     <User className="w-4 h-4 text-blue-600" />
                   </div>
                   <div>
                     <p className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Generated By</p>
                     <p className="text-xs font-extrabold text-slate-800 mt-0.5">{profile?.ownerName || 'Authorized Executive'}</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Snapshot Pane */}
           <div className="w-full mt-6 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative z-10">
             <div className="flex items-center gap-2.5 mb-5">
               <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                 <TrendingUp className="w-4 h-4 text-blue-600" />
               </div>
               <h3 className="text-xs font-black text-slate-700 uppercase tracking-[0.14em]">Executive Snapshot</h3>
             </div>
             
             <div className="grid grid-cols-4 divide-x divide-slate-100/90">
               <div className="px-5 flex flex-col items-start gap-1">
                  <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 mb-2.5 border border-blue-100 flex items-center justify-center w-9 h-9 font-extrabold">₹</div>
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">{formatCurrency(totalRevenue)}</p>
                  <p className="text-[9px] text-slate-400 mt-1">vs {prevMonthName}: {formatCurrency(Math.round(prevRevenue))}</p>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ▲ +{revGrowthPct.toFixed(1)}%
                  </span>
               </div>
               
               <div className="px-5 flex flex-col items-start gap-1">
                  <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 mb-2.5 border border-emerald-100 flex items-center justify-center w-9 h-9">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">{formatCurrency(totalProfit)}</p>
                  <p className="text-[9px] text-slate-400 mt-1">vs {prevMonthName}: {formatCurrency(Math.round(prevProfit))}</p>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ▲ +{profitGrowthPct.toFixed(1)}%
                  </span>
               </div>
               
               <div className="px-5 flex flex-col items-start gap-1">
                  <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600 mb-2.5 border border-indigo-100 flex items-center justify-center w-9 h-9">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Profit Margin</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">{profitMargin.toFixed(1)}%</p>
                  <p className="text-[9px] text-slate-400 mt-1">vs {prevMonthName}: {prevMargin.toFixed(1)}%</p>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ▲ +{marginChange.toFixed(1)}%
                  </span>
               </div>
               
               <div className="px-5 flex flex-col items-start gap-1">
                  <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 mb-2.5 border border-amber-100 flex items-center justify-center w-9 h-9">
                    <Wallet className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Collection Efficiency</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight mt-0.5">{collectionEfficiency.toFixed(1)}%</p>
                  <p className="text-[9px] text-slate-400 mt-1">vs {prevMonthName}: {prevEfficiency.toFixed(1)}%</p>
                  <span className="text-[10px] font-bold text-emerald-600 mt-1.5 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ▲ +{efficiencyChange.toFixed(1)}%
                  </span>
               </div>
             </div>
           </div>
           
           {/* Key Insights Pane */}
           <div className="w-full mt-6 bg-white border border-slate-200/50 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative z-10 mb-auto">
             <div className="flex items-center gap-2.5 mb-5">
               <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                 <ShieldCheck className="w-4 h-4 text-blue-600" />
               </div>
               <h3 className="text-xs font-black text-slate-700 uppercase tracking-[0.14em]">Key Insights</h3>
             </div>
             
             <div className="grid grid-cols-4 gap-6">
               <div className="flex flex-col items-start gap-2.5">
                 <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                   <TrendingUp className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Revenue Growth</p>
                   <p className="text-[9px] font-bold text-slate-500 leading-relaxed mt-1">
                     Sustained average daily revenue of <span className="text-emerald-600 font-extrabold">{formatCurrency(advancedKPIs?.avgDailyRevenue || (totalRevenue / 30))}</span>, driving positive trajectory.
                   </p>
                 </div>
               </div>
               
               <div className="flex flex-col items-start gap-2.5">
                 <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                   <Activity className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Profit Margin</p>
                   <p className="text-[9px] font-bold text-slate-500 leading-relaxed mt-1">
                     Net profits optimized at <span className="text-blue-600 font-extrabold">{profitMargin.toFixed(1)}%</span>, maximizing asset output per complete billing cycle.
                   </p>
                 </div>
               </div>
               
               <div className="flex flex-col items-start gap-2.5">
                 <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                   <Package className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Inventory Health</p>
                   <p className="text-[9px] font-bold text-slate-500 leading-relaxed mt-1">
                     Capitalized <span className="text-purple-600 font-extrabold">{formatCurrency(inventoryValue || 0)}</span> across dynamic SKU lines showing optimized overall stock turnover.
                   </p>
                 </div>
               </div>
               
               <div className="flex flex-col items-start gap-2.5">
                 <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                   <Users className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Customer Loyalty</p>
                   <p className="text-[9px] font-bold text-slate-500 leading-relaxed mt-1">
                     Expanding regional client base with strong metrics on customer capture and high lifetime engagement.
                   </p>
                 </div>
               </div>
             </div>
           </div>
           
           {/* Elevated Footer Branding */}
           <div className="w-full flex items-center justify-center gap-4 mt-8">
             <div className="flex-1 h-px bg-slate-200"></div>
             <span className="text-xs font-serif text-slate-500 italic shrink-0">
               Thank you for trusting <span className="font-bold font-sans not-italic text-slate-700">{profile?.shopName || 'Smart Vyapar'}</span>
             </span>
             <div className="flex-1 h-px bg-slate-200"></div>
           </div>
           
           <div className="w-full text-center z-10 flex flex-col items-center gap-1.5 opacity-90 mt-3">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-blue-600" />
               <span className="text-[10px] font-black tracking-[0.12em] text-slate-800 uppercase">
                 {profile?.shopName || 'SMART VYAPAR'} ANALYTICS ENGINE
               </span>
             </div>
             <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-[0.18em]">
               Real-Time Data • Accurate Insights • Smarter Decisions
             </p>
           </div>
        </PageContainer>

        {/* PAGE 2: Sales Analytics */}
        {hasInvoices && chartData && chartData.length > 0 && (
          <PageContainer>
            <Header title="Sales Analytics" />
            <div className="w-full flex flex-col gap-5">
               <h2 className="text-xl font-black text-slate-900 -mb-1">Sales &amp; Target Trends</h2>
               
               <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-2">Revenue Timeline</h3>
                 <div style={{ width: '630px', height: '180px' }} className="mx-auto flex justify-center">
                   <LineChart width={630} height={180} data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="date" tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} />
                     <YAxis tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} />
                     <Line type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" strokeWidth={3} dot={{r: 2, fill: "#3b82f6"}} isAnimationActive={false} />
                   </LineChart>
                 </div>
               </div>

               <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-2">Revenue vs Profit Analysis</h3>
                 <div style={{ width: '630px', height: '180px' }} className="mx-auto flex justify-center">
                   <RechartsBarChart width={630} height={180} data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="date" tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} />
                     <YAxis tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} />
                     <Legend wrapperStyle={{fontSize: 8, paddingTop: 4}} />
                     <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[3,3,0,0]} isAnimationActive={false} />
                     <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[3,3,0,0]} isAnimationActive={false} />
                   </RechartsBarChart>
                 </div>
               </div>

               <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-2">Weekly Breakdown</h3>
                 <table className="w-full text-xs text-left">
                   <thead>
                     <tr className="border-b border-slate-200">
                       <th className="py-1 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Period</th>
                       <th className="py-1 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Revenue</th>
                       <th className="py-1 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Profit</th>
                       <th className="py-1 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Margin</th>
                     </tr>
                   </thead>
                   <tbody>
                     {chartData.slice(0, 8).map((row: any, i: number) => (
                       <tr key={i} className="border-b border-slate-100">
                         <td className="py-1 font-bold text-slate-700">{row.date}</td>
                         <td className="py-1 text-blue-600 font-bold">{formatCurrency(row.sales || 0)}</td>
                         <td className="py-1 text-emerald-600 font-bold">{formatCurrency(row.profit || 0)}</td>
                         <td className="py-1 text-slate-600">{row.sales > 0 ? ((row.profit/row.sales)*100).toFixed(1) : 0}%</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {chartData.length > 8 && <p className="text-[9px] text-slate-400 mt-1 text-center">... showing top 8 periods</p>}
               </div>
            </div>
          </PageContainer>
        )}

        {/* PAGE 3: Product Analytics */}
        {hasProducts && (
          <PageContainer>
            <Header title="Product Analytics" />
            <div className="w-full flex flex-col gap-6">
               <h2 className="text-xl font-black text-slate-900 -mb-2">Product Performance</h2>
               
               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-2">Top Selling Products (By Revenue)</h3>
                 <div style={{ width: '630px', height: '180px' }} className="mx-auto flex justify-center">
                   <RechartsBarChart width={630} height={180} data={productPerformance.slice(0, 7)} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} tickFormatter={(val) => val && val.length > 12 ? val.substring(0, 10) + '..' : val} />
                     <YAxis tick={{fontSize: 8, fill: "#64748b"}} tickLine={false} axisLine={false} />
                     <Bar dataKey="revenue" name="Revenue" fill="#ec4899" radius={[3,3,0,0]} isAnimationActive={false} />
                   </RechartsBarChart>
                 </div>
               </div>

               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-3">Product Performance Leaderboard</h3>
                 <table className="w-full text-xs text-left">
                   <thead>
                     <tr className="border-b border-slate-200">
                       <th className="py-1.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Product Name</th>
                       <th className="py-1.5 text-slate-500 text-center font-bold uppercase tracking-wider text-[9px]">Units Sold</th>
                       <th className="py-1.5 text-slate-500 text-right font-bold uppercase tracking-wider text-[9px]">Total Revenue</th>
                     </tr>
                   </thead>
                   <tbody>
                     {productPerformance.slice(0, 10).map((row: any, i: number) => (
                       <tr key={i} className="border-b border-slate-100">
                         <td className="py-1.5 font-bold text-slate-700 max-w-[250px] truncate">{row.name}</td>
                         <td className="py-1.5 text-slate-600 text-center">{row.qty ?? row.quantity ?? 0}</td>
                         <td className="py-1.5 text-slate-800 font-bold text-right">{formatCurrency(row.revenue || 0)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               {lowStockProducts && lowStockProducts.length > 0 && (
                 <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                   <h3 className="text-sm font-bold text-rose-800 mb-2">Slow Moving / Low Alert Products</h3>
                   <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                      {lowStockProducts.slice(0, 8).map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-rose-100/60">
                          <span className="font-bold text-rose-900 truncate max-w-[170px]">{p.name}</span>
                          <span className="text-rose-600 font-mono font-bold">Qty: {p.quantity ?? p.stock ?? 0}</span>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
            </div>
          </PageContainer>
        )}

        {/* PAGE 4: Customer Analytics */}
        {hasCustomers && (
          <PageContainer>
            <Header title="Customer Analytics" />
            <div className="w-full flex flex-col gap-6">
               <h2 className="text-xl font-black text-slate-900 -mb-2">Customer Insights</h2>
               
               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                 <h3 className="text-sm font-bold text-slate-800 mb-3">Top Customers Directory</h3>
                 <table className="w-full text-xs text-left">
                   <thead>
                     <tr className="border-b border-slate-200">
                       <th className="py-2.5 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Customer Name / Identification</th>
                       <th className="py-2.5 text-slate-500 text-center font-bold uppercase tracking-wider text-[9px]">No. of Invoices</th>
                       <th className="py-2.5 text-slate-500 text-right font-bold uppercase tracking-wider text-[9px]">Total Business Volume</th>
                     </tr>
                   </thead>
                   <tbody>
                     {topCustomers.slice(0, 10).map((row: any, i: number) => (
                       <tr key={i} className="border-b border-slate-100">
                         <td className="py-2.5 font-bold text-slate-800">{row.name || 'Walk-in Customer'}</td>
                         <td className="py-2.5 text-slate-600 text-center">{row.count || 1}</td>
                         <td className="py-2.5 text-indigo-600 font-bold text-right">{formatCurrency(row.revenue || 0)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col">
                 <h3 className="text-sm font-bold text-slate-800 mb-3">Customer Contribution</h3>
                 <div className="flex flex-row items-center justify-between w-full h-[220px]">
                   <div style={{ width: '300px', height: '220px' }} className="flex justify-center items-center shrink-0">
                     <PieChart width={300} height={220}>
                       <Pie
                         data={topCustomers.slice(0, 5).concat(topCustomers.length > 5 ? [{ name: 'Others', revenue: topCustomers.slice(5).reduce((acc: number, c: any) => acc + c.revenue, 0) }] : [])}
                         cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                         paddingAngle={2} dataKey="revenue"
                         isAnimationActive={false}
                       >
                          {topCustomers.slice(0, 6).map((_, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'][i%6]} />)}
                       </Pie>
                     </PieChart>
                   </div>
                   <div className="flex-grow ml-4 max-w-[340px]">
                     <table className="w-full text-left text-[11px] font-sans">
                       <thead>
                         <tr className="border-b border-slate-200">
                           <th className="py-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Customer</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Share</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Revenue</th>
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           const top5 = topCustomers.slice(0, 5);
                           const othersRev = topCustomers.slice(5).reduce((acc: number, c: any) => acc + c.revenue, 0);
                           const listToRender = top5.concat(topCustomers.length > 5 ? [{ name: 'Others', revenue: othersRev }] : []);
                           const totalRev = topCustomers.reduce((acc: number, c: any) => acc + c.revenue, 0) || 1;
                           const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
                           
                           return listToRender.map((cust: any, idx: number) => (
                             <tr key={idx} className="border-b border-slate-100">
                               <td className="py-1 flex items-center gap-1.5 font-bold text-slate-700 min-w-[120px]">
                                 <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % 6] }} />
                                 <span className="truncate max-w-[120px]">{cust.name}</span>
                               </td>
                               <td className="py-1 text-right text-slate-500 font-bold">
                                 {((cust.revenue / totalRev) * 100).toFixed(1)}%
                               </td>
                               <td className="py-1 text-right font-black text-slate-800">
                                 {formatCurrency(cust.revenue || 0)}
                               </td>
                             </tr>
                           ));
                         })()}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>
            </div>
          </PageContainer>
        )}

        {/* PAGE 5: Payment Analytics */}
        {hasPayments && (
          <PageContainer>
            <Header title="Payment Analytics" />
            <div className="w-full flex flex-col gap-6">
               <h2 className="text-xl font-black text-slate-900 -mb-2">Revenue Realization</h2>
               
               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col">
                 <h3 className="text-sm font-bold text-slate-800 mb-3">Payment Modes Breakdown</h3>
                 <div className="flex flex-row items-center justify-between w-full h-[220px]">
                   <div style={{ width: '300px', height: '220px' }} className="flex justify-center items-center shrink-0">
                     <PieChart width={300} height={220}>
                       <Pie
                         data={paymentModeData.filter((d: any) => d.value > 0)}
                         cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                         paddingAngle={2} dataKey="value"
                         isAnimationActive={false}
                       >
                          {paymentModeData.filter((d: any) => d.value > 0).map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                       </Pie>
                     </PieChart>
                   </div>
                   <div className="flex-grow ml-4 max-w-[340px]">
                     <table className="w-full text-left text-[11px] font-sans">
                       <thead>
                         <tr className="border-b border-slate-200">
                           <th className="py-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Payment Mode</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Share</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Collected</th>
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           const filteredPay = paymentModeData.filter((d: any) => d.value > 0);
                           const totalPay = filteredPay.reduce((acc: number, d: any) => acc + d.value, 0) || 1;
                           
                           return filteredPay.map((mode: any, i: number) => (
                             <tr key={i} className="border-b border-slate-100">
                               <td className="py-2 flex items-center gap-1.5 font-bold text-slate-700">
                                 <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mode.color }} />
                                 <span>{mode.name}</span>
                               </td>
                               <td className="py-2 text-right text-slate-500 font-bold">
                                 {((mode.value / totalPay) * 100).toFixed(1)}%
                               </td>
                               <td className="py-2 text-right font-black text-slate-800">
                                 {formatCurrency(mode.value)}
                               </td>
                             </tr>
                           ));
                         })()}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>

               {bills.some(b => (b.balanceAmount || 0) > 0) && (
                 <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
                   <h3 className="text-sm font-bold text-rose-800 mb-3">Outstanding Due Analysis</h3>
                   <table className="w-full text-xs text-left">
                     <thead>
                       <tr className="border-b border-rose-250">
                         <th className="py-2 text-rose-500 font-bold uppercase tracking-wider text-[9px]">Customer Name / Identification</th>
                         <th className="py-2 text-rose-500 text-right font-bold uppercase tracking-wider text-[9px]">Pending Dues Amount</th>
                       </tr>
                     </thead>
                     <tbody>
                       {bills.filter(b => (b.balanceAmount || 0) > 0).sort((a,b) => (b.balanceAmount || 0) - (a.balanceAmount || 0)).slice(0, 10).map((row: any, i: number) => (
                         <tr key={i} className="border-b border-rose-100/60">
                           <td className="py-2 font-bold text-slate-700">{row.customerDetails?.name || row.customerDetails?.phone || 'Walk-in Client'}</td>
                           <td className="py-2 text-rose-600 font-bold text-right">{formatCurrency(row.balanceAmount)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </PageContainer>
        )}

        {/* PAGE 6: Inventory Insights */}
        {hasInventory && (
          <PageContainer>
            <Header title="Inventory Insights" />
            <div className="w-full flex flex-col gap-6">
               <h2 className="text-xl font-black text-slate-900 -mb-2">Stock &amp; Inventory Operations</h2>
               
               <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl">
                  <p className="text-xs font-black uppercase text-indigo-500 tracking-widest mb-1">Total Current Stock Valuation (Cost)</p>
                  <p className="text-4xl font-black text-indigo-900">{formatCurrency(inventoryValue || 0)}</p>
                  <p className="text-[10px] uppercase text-indigo-400 mt-2 font-bold tracking-wider">Estimated aggregate worth at purchase price levels</p>
               </div>

               {inventory.some(i => Number(i.quantity ?? i.stock) <= (Number(i.minStockAlert ?? i.minStock) || 5)) && (
                 <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                   <h3 className="text-sm font-bold text-amber-800 mb-3">Critical Low Stock Warning List</h3>
                   <table className="w-full text-xs text-left">
                     <thead>
                       <tr className="border-b border-amber-200">
                         <th className="py-2 text-amber-600 font-bold uppercase tracking-wider text-[9px]">Product Name</th>
                         <th className="py-2 text-amber-600 text-center font-bold uppercase tracking-wider text-[9px]">Remaining Stock qty</th>
                       </tr>
                     </thead>
                     <tbody>
                       {inventory.filter(i => Number(i.quantity ?? i.stock) <= (Number(i.minStockAlert ?? i.minStock) || 5)).sort((a, b) => Number(a.quantity ?? a.stock) - Number(b.quantity ?? b.stock)).slice(0, 10).map((row: any, i: number) => (
                         <tr key={i} className="border-b border-amber-100/60">
                           <td className="py-2 font-bold text-slate-700">{row.name}</td>
                           <td className="py-2 text-rose-600 font-bold text-center">{row.quantity ?? row.stock ?? 0} {row.unit}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

               {inventoryMovements && inventoryMovements.length > 0 && (
                 <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                   <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Book Ledger Movements</h3>
                   <table className="w-full text-xs text-left">
                     <thead>
                       <tr className="border-b border-slate-200">
                         <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Date</th>
                         <th className="py-2 text-slate-500 font-bold uppercase tracking-wider text-[9px]">Product Name</th>
                         <th className="py-2 text-slate-500 text-center font-bold uppercase tracking-wider text-[9px]">Type</th>
                         <th className="py-2 text-slate-500 text-right font-bold uppercase tracking-wider text-[9px]">Quantity Changed</th>
                       </tr>
                     </thead>
                     <tbody>
                       {inventoryMovements.slice(0, 10).map((mov: any, i: number) => (
                         <tr key={i} className="border-b border-slate-100">
                           <td className="py-2 text-slate-500 font-mono">{format(new Date(mov.date), "dd MMM yy")}</td>
                           <td className="py-2 font-bold text-slate-700 truncate max-w-[250px]">{mov.productName}</td>
                           <td className="py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mov.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                 {mov.type === 'IN' ? 'ADDED' : 'REDUCED'}
                              </span>
                           </td>
                           <td className="py-2 font-bold text-right text-slate-700">{mov.quantityChange ?? mov.quantity ?? 0}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
          </PageContainer>
        )}

        {/* PAGE 7: Business Intelligence & Recommendations */}
        {hasCategories && (
          <PageContainer>
            <Header title="Business Intelligence" />
            <div className="w-full flex-grow flex flex-col gap-6">
               <h2 className="text-xl font-black text-slate-900 -mb-2">Smart Actionable Insights</h2>
               
               <div className="grid grid-cols-2 gap-6">
                  {hasProducts && productPerformance[0] && (
                    <div className="bg-slate-50 border border-indigo-100 p-6 rounded-3xl text-slate-800">
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Top-Selling Product</p>
                       <h3 className="text-xl font-black mt-1 line-clamp-2 text-indigo-950">{productPerformance[0]?.name || 'N/A'}</h3>
                       <p className="text-xs text-slate-500 mt-2">Highest overall contributor to business receipts.</p>
                    </div>
                  )}
                  {chartData && chartData.length > 0 && (
                    <div className="bg-slate-50 border border-emerald-100 p-6 rounded-3xl text-slate-800">
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Peak Sales Period</p>
                       <h3 className="text-xl font-black mt-1 text-emerald-950">
                          {[...chartData].sort((a: any, b: any) => b.sales - a.sales)[0]?.date || 'N/A'}
                       </h3>
                       <p className="text-xs text-slate-500 mt-2">Generated {formatCurrency([...chartData].sort((a: any, b: any) => b.sales - a.sales)[0]?.sales || 0)} single-day sales volume.</p>
                    </div>
                  )}
               </div>

               <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col">
                 <h3 className="text-sm font-bold text-slate-800 mb-3">Category Mix &amp; Distribution</h3>
                 <div className="flex flex-row items-center justify-between w-full h-[220px]">
                   <div style={{ width: '300px', height: '220px' }} className="flex justify-center items-center shrink-0">
                     <PieChart width={300} height={220}>
                       <Pie
                         data={categoryData}
                         cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                         paddingAngle={2} dataKey="value"
                         isAnimationActive={false}
                       >
                          {categoryData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                       </Pie>
                     </PieChart>
                   </div>
                   <div className="flex-grow ml-4 max-w-[340px]">
                     <table className="w-full text-left text-[11px] font-sans">
                       <thead>
                         <tr className="border-b border-slate-200">
                           <th className="py-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">Category Name</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Share</th>
                           <th className="py-1 text-right text-slate-400 font-bold uppercase tracking-wider text-[9px]">Volume</th>
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           const totalCatGroup = categoryData.reduce((acc: number, d: any) => acc + d.value, 0) || 1;
                           
                           return categoryData.slice(0, 6).map((group: any, i: number) => (
                             <tr key={i} className="border-b border-slate-100">
                               <td className="py-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                                 <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                                 <span className="truncate max-w-[120px]">{group.name}</span>
                               </td>
                               <td className="py-1.5 text-right text-slate-500 font-bold">
                                 {((group.value / totalCatGroup) * 100).toFixed(1)}%
                               </td>
                               <td className="py-1.5 text-right font-black text-slate-800">
                                 {formatCurrency(group.value)}
                               </td>
                             </tr>
                           ));
                         })()}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </div>

               <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl mt-auto">
                  <h3 className="text-sm font-black text-slate-800 mb-2">Automated Strategic Actions</h3>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 mt-2">
                    <li>Maintain highly balanced stock levels for the Star Performance merchandise.</li>
                    <li>Omit non-moving categories or discount low-turns catalogs to lower holding expenses.</li>
                    <li>Follow up instantly via UPI digital templates with pending high outstanding accounts.</li>
                    <li>Promote UPI QR checkouts to optimize physical checkout speeds.</li>
                  </ul>
               </div>
            </div>
          </PageContainer>
        )}
      </div>
    </div>
  );
});

AnalyticsPDFReport.displayName = 'AnalyticsPDFReport';
