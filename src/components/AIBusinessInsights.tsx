import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Zap, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIBusinessInsightsProps {
  moduleType: 'replenishment' | 'analytics' | 'dashboard';
  contextData: any;
  title?: string;
  description?: string;
}

export default function AIBusinessInsights({ moduleType, contextData, title = "AI Business Analysis", description = "Synthesizing your live operational data into strategic directives using advanced behavioral models." }: AIBusinessInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const generateInsights = async () => {
      // Avoid calling with totally empty data
      if (!contextData || Object.keys(contextData).length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/gemini/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleType, contextData }),
        });
        
        if (!response.ok) {
           const errData = await response.json().catch(() => ({}));
           throw new Error(errData.error || response.statusText);
        }
        
        const data = await response.json();
        setInsights(data.text);
      } catch (err: any) {
        console.info("Status note: Insight response adjusted according to active operational limits.");
        const errMsg = err?.message || "";
        if (errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE")) {
          setError("The AI model is currently experiencing high demand. Please try again in a few moments.");
        } else {
          setError("Unable to generate AI insights at this time. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      generateInsights();
    }, 1800); // Debounce to allow page fully load first

    return () => clearTimeout(timer);
  }, [contextData, moduleType]);

  if (!mounted) return null;

  return (
    <div className="w-full mt-10 mb-6">
      <div className="relative group rounded-[32px] overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-[0_30px_100px_-20px_rgba(79,70,229,0.25)] select-none">
        
        {/* Dynamic Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-500/15 via-blue-500/5 to-transparent rounded-full blur-[80px] opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity duration-1000" />
        
        {/* Glass overlay */}
        <div className="relative z-10 p-1">
          <div className="bg-black/40 backdrop-blur-3xl rounded-[28px] border border-white/[0.08] relative overflow-hidden flex flex-col md:flex-row shadow-2xl">

            {/* Left Header Panel - Always visible */}
            <div className="md:w-[320px] shrink-0 p-8 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col justify-between bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden">
               {/* Grid texture overlay */}
               <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
               
               <div className="relative z-10">
                 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white-10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(79,70,229,0.3)] backdrop-blur-md">
                   <Zap className="w-7 h-7 text-indigo-300 relative z-20" />
                   <div className="absolute inset-0 rounded-2xl border border-indigo-400/30 blur-sm animate-pulse" />
                 </div>
                 
                 <h2 className="text-2xl font-black tracking-tight text-white mb-3 leading-tight">
                   {title}
                 </h2>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed">
                   {description}
                 </p>
               </div>

               <div className="relative z-10 mt-8">
                 <div className="flex items-center gap-3">
                   <div className="h-px bg-gradient-to-r from-indigo-500/50 to-transparent flex-1" />
                   <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400">Gemini Pro 1.5</span>
                   <div className="h-px bg-gradient-to-l from-indigo-500/50 to-transparent flex-1" />
                 </div>
               </div>
            </div>

            {/* Right Content Panel - Dynamic Data output */}
            <div className="flex-1 p-8 md:p-10 relative text-left">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, filter: "blur(10px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="h-full flex flex-col justify-center min-h-[300px]"
                  >
                    <div className="flex items-start gap-5">
                      <div className="mt-1">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                      </div>
                      <div className="space-y-4 w-full">
                        <div className="space-y-1">
                          <h4 className="text-base text-slate-200 font-bold tracking-tight">Synthesizing Operational Models</h4>
                          <p className="text-xs text-slate-500">Evaluating multi-vector performance and market velocities...</p>
                        </div>
                        <div className="space-y-3 pt-2">
                          <div className="h-2 w-3/4 bg-white/5 rounded-full overflow-hidden relative">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 animate-[shimmer_2s_infinite]" />
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 animate-[shimmer_2.5s_infinite]" />
                          </div>
                          <div className="h-2 w-5/6 bg-white/5 rounded-full overflow-hidden relative">
                             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 animate-[shimmer_1.8s_infinite]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col justify-center items-center text-center p-6 bg-rose-500/5 rounded-2xl border border-rose-500/20"
                  >
                    <div className="h-10 w-10 bg-rose-500/20 rounded-full flex items-center justify-center mb-3">
                      <Zap className="w-5 h-5 text-rose-400" />
                    </div>
                    <p className="text-xs text-rose-300/80 font-mono leading-relaxed max-w-sm">{error}</p>
                  </motion.div>
                ) : insights ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="prose prose-invert prose-sm max-w-none 
                      prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-slate-300 prose-p:mb-6
                      prose-headings:text-slate-100 prose-headings:font-black prose-headings:tracking-tight prose-headings:mb-4
                      prose-h2:text-xl prose-h3:text-lg
                      prose-strong:text-indigo-300 prose-strong:font-black
                      prose-ul:space-y-3 prose-ul:mb-6
                      prose-li:text-[14px] prose-li:text-slate-300 prose-li:leading-relaxed
                      prose-li:marker:text-indigo-500"
                  >
                    <div className="text-white/90">
                      <ReactMarkdown>{insights}</ReactMarkdown>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> Executive Note Generated
                      </span>
                      <button className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 group/btn transition-colors">
                        Review Source Data
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="h-full flex items-center justify-center min-h-[300px]"
                  >
                    <p className="text-sm font-medium text-slate-500">Insufficient operational data mapped to generate advisory notes.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
