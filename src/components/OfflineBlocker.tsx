import React from 'react';
import { WifiOff, CloudOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function OfflineBlocker({ featureName }: { featureName: string }) {
  return (
    <div className="flex-1 w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-lg shadow-slate-200/50"
      >
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">You're Offline</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Please connect to the internet to use <strong className="text-slate-800">{featureName}</strong>. This feature requires a live cloud connection to synchronize data.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start text-left gap-3">
          <CloudOff className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 font-medium">
            Basic functions like creating bills and managing your inventory will continue to work normally while offline.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
