import fs from 'fs';

let file = 'src/components/DashboardHome.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  /<h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">[\s\S]*?<\/h2>/,
  `<h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 border border-indigo-100/50 rounded-xl sm:rounded-2xl shadow-sm">
              <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
            </div>
            Business Dashboard
          </h2>`
);

data = data.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1\.5 matches-welcome">[\s\S]*?<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2 sm:mt-3 matches-welcome">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Overview & Key Performance Indicators
            </p>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shadow-xs w-fit">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Live Updates</span>
            </span>
          </div>`
);

data = data.replace(
  /<div className="inline-flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">[\s\S]*?Today[\s\S]*?<\/button>[\s\S]*?This Week[\s\S]*?<\/button>[\s\S]*?<\/div>/i,
  `<div className="inline-flex bg-slate-100/80 p-1 sm:p-1.5 rounded-2xl sm:rounded-[1.25rem] border border-slate-200 shadow-inner w-full sm:w-auto overflow-hidden">
          <button 
            onClick={() => setTimeRange('TODAY')}
            className={\`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 border \${timeRange === 'TODAY' ? 'bg-white text-indigo-700 border-slate-200/60 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}\`}
          >
            Today
          </button>
          <button 
            onClick={() => setTimeRange('THIS_WEEK')}
            className={\`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 border \${timeRange === 'THIS_WEEK' ? 'bg-white text-indigo-700 border-slate-200/60 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}\`}
          >
            This Week
          </button>
        </div>`
);

fs.writeFileSync(file, data);
console.log("Replaced DashboardHome.tsx UI");
