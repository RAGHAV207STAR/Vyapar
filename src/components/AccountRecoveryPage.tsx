import React, { useEffect, useState } from 'react';
import { useBilling } from '../context/BillingContext';
import { ShieldAlert, RefreshCw, LogOut, CheckCircle2, Trash2, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AccountRecoveryPage() {
  const { profile, recoverAccount, permanentPurgeAccount, logout, showToast } = useBilling();
  const [daysRemaining, setDaysRemaining] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmPermanent, setShowConfirmPermanent] = useState(false);
  const [simulatedTimePassed, setSimulatedTimePassed] = useState(false);

  // Parse dates safely
  const deletionDateStr = profile?.deletedAt 
    ? new Date(profile.deletedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  const recoveryDeadlineStr = profile?.recoveryDeadline
    ? new Date(profile.recoveryDeadline).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  // Calculate actual remaining days
  useEffect(() => {
    if (!profile?.recoveryDeadline) return;

    const calculateDays = () => {
      const deadline = new Date(profile.recoveryDeadline).getTime();
      const now = new Date().getTime();
      const diffMs = deadline - now;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    };

    setDaysRemaining(calculateDays());

    // Check if expired on load
    const deadline = new Date(profile.recoveryDeadline).getTime();
    if (new Date().getTime() > deadline) {
      handleAutoPurge();
    }
  }, [profile]);

  const handleAutoPurge = async () => {
    setIsProcessing(true);
    showToast("🕒 30-Day Recovery Period is Expired. Initiating Permanent Purge...", "error");
    await permanentPurgeAccount();
    setIsProcessing(false);
  };

  const handleRecover = async () => {
    setIsProcessing(true);
    try {
      await recoverAccount();
    } catch (e: any) {
      showToast(e.message || "Failed to recover account", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulatePurge = async () => {
    setIsProcessing(true);
    setSimulatedTimePassed(true);
    showToast("🕒 Test Accelerator: Simulated 30 days passing...", "info");
    setTimeout(async () => {
      await permanentPurgeAccount();
      setIsProcessing(false);
    }, 1500);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center font-sans relative overflow-hidden p-6 text-left">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/90 border border-slate-700/60 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6 md:space-y-8 backdrop-blur-xl"
      >
        {/* Urgent Shield Warning Header */}
        <div className="flex items-center space-x-4 border-b border-slate-700/50 pb-6">
          <div className="h-14 w-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-red-400">BUSINESS DELETION SCHEDULED</span>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
              Recover Business Account?
            </h2>
          </div>
        </div>

        {/* Business details summary box */}
        <div className="bg-slate-950/40 border border-slate-700/30 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Shop Name</span>
              <span className="text-sm font-bold text-slate-150">{profile.shopName}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Business ID</span>
              <code className="text-xs font-mono font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                {profile.businessId || 'N/A'}
              </code>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Scheduled on</span>
              <span className="text-xs font-semibold text-slate-300">{deletionDateStr}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Purge Deadline</span>
              <span className="text-xs font-semibold text-red-300">{recoveryDeadlineStr}</span>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-semibold flex items-center">
              <Clock className="h-4 w-4 text-amber-500 mr-2" />
              Days remaining to cancel permanent purge:
            </span>
            <span className="text-2xl font-mono font-black text-amber-400 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              {simulatedTimePassed ? 0 : daysRemaining}
            </span>
          </div>
        </div>

        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
          <p className="text-xs font-semibold text-red-200 leading-relaxed">
            ⚠️ <strong>Smart Vyapar Notice:</strong> This workspace has been shut down and is offline. Active logins and database replication have been disabled. 
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Restoring your profile will instantly reinstate your entire stock ledger, active customer databases, and historical transaction reports, exactly as of the scheduled date.
          </p>
        </div>

        {/* Buttons / Controls Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={handleRecover}
            disabled={isProcessing}
            className="inline-flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Recover Business Account</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            disabled={isProcessing}
            className="inline-flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-slate-700 hover:bg-slate-650 text-slate-200 hover:text-white font-bold transition-all border border-slate-600/50 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Continue Deletion (Logout)</span>
          </button>
        </div>

        {/* Diagnostic Accelerator / Simulator (Premium Touch for testing/verification) */}
        {!simulatedTimePassed && (
          <div className="border-t border-slate-700/40 pt-6 flex flex-col items-center justify-between sm:flex-row gap-4">
            <div className="text-left space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                Sandbox Testing Utility
              </span>
              <p className="text-[11px] text-slate-400 font-medium">
                Simulate 30 days passing to verify the <strong>automatic execution of permanent deletes</strong>.
              </p>
            </div>
            <button
              onClick={handleSimulatePurge}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1.5 py-2 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Simulate Timeline Purge</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
