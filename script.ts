import * as fs from 'fs';
import * as path from 'path';

const file = path.join(process.cwd(), 'src/components/FinancialCenter.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove font-mono
content = content.replace(/\bfont-mono\b/g, '');

// 2. Change Audit Duration section
const durationRegex = /\{\/\* Advanced Premium Duration Selection Control bar \*\/\}([\s\S]*?)\{\/\* Tabs navigation selectors \*\/\}/;

const newDurationSection = `{/* Ultra-Premium Compact Duration Selection Bar */}
      <div className="bg-gradient-to-r from-zinc-50 to-white p-2.5 sm:p-4 rounded-3xl border border-zinc-200/60 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-100 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 flex-wrap z-10">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm">
            <CalendarDays className="w-4 h-4 text-zinc-500" />
            <h2 className="text-[11px] font-black uppercase text-zinc-800 tracking-widest mt-0.5">Duration</h2>
          </div>
          
          <div className="flex bg-zinc-100/80 p-1 rounded-full border border-zinc-200/50 flex-wrap">
            {[
              { id: 'all_time', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: '30 Days' },
              { id: 'this_quarter', label: 'Quarter' },
              { id: 'this_year', label: 'Year' },
              { id: 'custom', label: 'Custom' }
            ].map((item) => {
              const isSelected = duration === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setDuration(item.id as DurationType)}
                  className={\`py-1.5 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all \${
                    isSelected 
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' 
                      : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
                  }\`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          
          {duration !== 'all_time' && (
            <span className="px-3 py-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Range Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 z-10 w-full xl:w-auto">
          {duration === 'custom' && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-sm flex-1 xl:flex-none">
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 outline-none w-full xl:w-auto"
              />
              <span className="text-zinc-400 font-black text-[10px] uppercase">to</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 outline-none w-full xl:w-auto"
              />
            </div>
          )}
          
          <p className="hidden md:flex text-[10px] font-semibold text-zinc-500 items-center justify-end gap-1.5 bg-white py-2 px-4 rounded-full border border-zinc-200 shadow-sm min-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {activeRangeText}
          </p>
        </div>
      </div>

      {/* Tabs navigation selectors */}
`;

content = content.replace(durationRegex, newDurationSection);


// 3. Make the main header look premium via Zinc, Stone, Teal, Purple
const headerRegex = /\{\/\* Premium Elegant SaaS Header \*\/\}([\s\S]*?)<div className="absolute inset-0 bg-\[linear-gradient/;

const newHeader = `{/* Premium Elegant SaaS Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#0a0a0b] text-zinc-100 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient`;

content = content.replace(headerRegex, newHeader);


// Change card styles to a more premium zinc/stone style
content = content.replace(/bg-gradient-to-br from-slate-950 to-slate-900 text-white/g, 'bg-[#111113] text-zinc-50 border border-zinc-800');
content = content.replace(/text-4xl sm:text-5xl font-black tracking-tight/g, 'text-4xl sm:text-5xl font-black tracking-tighter');
content = content.replace(/border-slate-200/g, 'border-zinc-200');
content = content.replace(/bg-slate-50/g, 'bg-zinc-50');
content = content.replace(/text-slate-/g, 'text-zinc-');
content = content.replace(/border-slate-/g, 'border-zinc-');
content = content.replace(/bg-slate-/g, 'bg-zinc-');
content = content.replace(/shadow-slate-/g, 'shadow-zinc-');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated FinancialCenter.tsx!");
