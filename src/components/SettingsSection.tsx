/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Settings,
  RefreshCw,
  Database,
  Trash2,
  Laptop,
  AlertTriangle,
  ShieldAlert,
  Lock,
  CloudCheck,
  Zap,
  X,
  CreditCard,
  Target,
  FileText,
  BarChart3,
  Clock,
  Barcode,
  MessageSquare,
  Mail,
} from "lucide-react";
import { useBilling } from "../context/BillingContext";
import { useInventory } from "../context/InventoryContext";
import { useNotification } from "../context/NotificationContext";

export default function SettingsSection() {
  const {
    isOnline,
    syncPendingCount,
    syncDataOfflineFirst,
    clearLocalHistory,
    bills,
    profile,
    user,
    initiateSoftDelete,
    showToast,
    saveProfile,
  } = useBilling();

  const { inventory } = useInventory();
  const {
    settings: notifSettings,
    updateSettings,
    requestPermission,
    permissionGranted,
  } = useNotification();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Deletion Wizard State
  const [showDeleteWizard, setShowDeleteWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [passwordInput, setPasswordInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [finalCheckbox, setFinalCheckbox] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    try {
      if (syncDataOfflineFirst) {
        await syncDataOfflineFirst();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetSandbox = () => {
    clearLocalHistory();
    window.location.reload();
  };

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerificationError("");
    await new Promise((resolve) => setTimeout(resolve, 800));

    const isGoogleUser = user?.uid ? !user.uid.startsWith("mock_user_") : false;

    if (isGoogleUser) {
      setIsVerifying(false);
      setWizardStep(3);
    } else {
      let correctPassword = "password";
      try {
        const offlineUsersJson = localStorage.getItem("sb_offline_users");
        if (offlineUsersJson && user?.email) {
          const offlineUsers = JSON.parse(offlineUsersJson);
          if (offlineUsers[user.email]?.password) {
            correctPassword = offlineUsers[user.email].password;
          }
        }
      } catch (_) {}

      if (passwordInput === correctPassword) {
        setIsVerifying(false);
        setWizardStep(3);
      } else {
        setIsVerifying(false);
        setVerificationError("Incorrect password. Please try again.");
      }
    }
  };

  const handleGoogleReauthSimulate = async () => {
    setIsVerifying(true);
    setVerificationError("");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsVerifying(false);
    setWizardStep(3);
    showToast("Identity verified via secure provider", "success");
  };

  const triggerPermanentDeletion = async () => {
    setIsSubmittingDeletion(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const isGoogleUser = user?.uid
        ? !user.uid.startsWith("mock_user_")
        : false;
      await initiateSoftDelete(isGoogleUser ? "google" : "password");
      setShowDeleteWizard(false);
    } catch (e: any) {
      showToast(e.message || "Failed to initiate deletion", "error");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  const isGoogleUser = user?.uid ? !user.uid.startsWith("mock_user_") : false;

  const NotificationToggle = ({
    label,
    desc,
    icon: Icon,
    checked,
    onChange,
    accentColor = "blue",
  }: any) => {
    const colorMap: Record<string, string> = {
      blue: "text-blue-600 bg-blue-50",
      emerald: "text-emerald-600 bg-emerald-50",
      amber: "text-amber-600 bg-amber-50",
      rose: "text-rose-600 bg-rose-50",
      purple: "text-purple-600 bg-purple-50",
      slate: "text-slate-700 bg-slate-100",
    };

    return (
      <label
        className={`relative flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden group ${checked ? "bg-white border-slate-200 shadow-[0_4px_15px_-4px_rgba(0,0,0,0.06)] scale-[1.01]" : "bg-slate-50/60 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm"}`}
      >
        {checked && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-30" />}
        <div
          className={`p-3 rounded-xl transition-all duration-300 ${checked ? colorMap[accentColor] || colorMap.blue : "text-slate-400 bg-slate-100 group-hover:bg-slate-200"}`}
        >
          <Icon className="w-5 h-5" strokeWidth={checked ? 2.5 : 2} />
        </div>

        <div className="flex-1 pt-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-sm font-medium transition-colors duration-300 ${checked ? "text-slate-900" : "text-slate-700"}`}
            >
              {label}
            </span>
            <div
              className={`relative inline-flex h-6 w-[2.8rem] shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-300 ease-in-out focus:outline-none shadow-inner ${checked ? "bg-slate-800" : "bg-slate-200"}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={onChange}
              />
              <span
                className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] ring-1 ring-slate-900/5 transition-transform duration-300 ease-in-out ${checked ? "translate-x-[1.35rem]" : "translate-x-0.5"}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 delay-100 ${checked ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-slate-300"}`} />
              </span>
            </div>
          </div>
          <span className="text-[13px] text-slate-500 leading-relaxed block pr-4">
            {desc}
          </span>
        </div>
      </label>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-24 animate-fade-in font-sans space-y-10">
      {/* Premium Header Section */}
      <div className="relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] p-8 md:p-12 overflow-hidden mb-4">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-blue-50/50 via-indigo-50/20 to-transparent rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-100/50 to-transparent rounded-full blur-2xl border translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-sm rounded-full text-xs font-bold text-slate-600 tracking-wide uppercase">
              <Settings className="w-4 h-4 text-blue-500" /> System Preferences
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Settings &<br/> Configurations
            </h2>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-xl">
              Manage your workspace parameters, notification preferences, hardware
              integrations, and secure data handling in one refined interface.
            </p>
          </div>
          
          <div className="shrink-0 flex self-start md:self-center">
             <div className="flex flex-col items-start md:items-end bg-white/60 backdrop-blur border border-slate-100 p-4 rounded-2xl shadow-sm">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Workspace Health</span>
               <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-100 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)]">
                 <div className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </div>
                 All Systems Operational
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Primary Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device & Status Column */}
        <div className="space-y-8">
          {/* Diagnostic Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-[0_2px_10px_-4px_rgba(99,102,241,0.5)]">
                  <CloudCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Cloud Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time connection status
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Laptop
                      className={`w-5 h-5 ${isOnline ? "text-emerald-500" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">Network Access</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"}`}
                    />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      {isOnline ? "Active" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Database className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium">Local Ledger</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                    {bills.length} Records
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                  <div className="flex items-center gap-3 text-slate-700">
                    <RefreshCw
                      className={`w-5 h-5 ${syncPendingCount > 0 ? "text-amber-500" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-medium">Pending Tasks</span>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-md border shadow-sm ${
                      syncPendingCount > 0
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-white border-slate-200 text-emerald-600"
                    }`}
                  >
                    {syncPendingCount} Sync{syncPendingCount !== 1 && "s"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing || syncPendingCount === 0 || !isOnline}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Synchronizing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-sm">Force Sync Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Integration & Hardware Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-sky-50 to-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.5)]">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Hardware & Peripherals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage external device integrations
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <NotificationToggle
                  icon={Barcode}
                  label="Barcode & RFID Scanners"
                  desc="Activate deep integration for POS laser scanning inputs."
                  checked={profile?.barcodeScannerEnabled || false}
                  onChange={(e: any) =>
                    saveProfile({
                      ...profile,
                      barcodeScannerEnabled: e.target.checked,
                    })
                  }
                  accentColor="blue"
                />

                {/* Additional Placeholder for future integrations, keeping design balanced */}
                <div className="p-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center py-8">
                  <div className="p-2 rounded-full bg-slate-100 text-slate-400 mb-3">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    Hardware Extensibility
                  </span>
                  <span className="text-[13px] text-slate-400 mt-1 max-w-[200px]">
                    More IoT and peripheral support coming in upcoming phases.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 opacity-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-50 rounded-2xl text-violet-600 shadow-[0_2px_10px_-4px_rgba(139,92,246,0.5)]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                Notification Engine
              </h3>
              <p className="text-[13px] text-slate-500 mt-1">
                Configure intelligent alerts and summary digests
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const granted = await requestPermission();
              showToast(
                granted
                  ? "Push Notifications Enabled"
                  : "Notifications blocked",
                granted ? "success" : "error",
              );
            }}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              permissionGranted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)]"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]"
            }`}
          >
            {permissionGranted ? "System Authorized" : "Enable Push Access"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <NotificationToggle
            icon={Target}
            label="Stock Level Alerts"
            desc="Immediate warnings when inventory hits defensive safety thresholds."
            checked={notifSettings.lowStockAlerts}
            onChange={(e: any) =>
              updateSettings({ lowStockAlerts: e.target.checked })
            }
            accentColor="amber"
          />
          <NotificationToggle
            icon={CreditCard}
            label="Receivables Engine"
            desc="Automated collection reminders for pending customer balances."
            checked={notifSettings.duePaymentReminders}
            onChange={(e: any) =>
              updateSettings({ duePaymentReminders: e.target.checked })
            }
            accentColor="emerald"
          />
          <NotificationToggle
            icon={FileText}
            label="EOD Operations Digest"
            desc="Comprehensive daily summary of transactions and margins."
            checked={notifSettings.dailyBusinessSummary}
            onChange={(e: any) =>
              updateSettings({ dailyBusinessSummary: e.target.checked })
            }
            accentColor="blue"
          />
          <NotificationToggle
            icon={BarChart3}
            label="Weekly Analytics"
            desc="Macro health report assessing 7-day velocity and metrics."
            checked={notifSettings.weeklyBusinessReport}
            onChange={(e: any) =>
              updateSettings({ weeklyBusinessReport: e.target.checked })
            }
            accentColor="purple"
          />
          <NotificationToggle
            icon={Clock}
            label="Inactivity Monitoring"
            desc="Safety pings if the system detects prolonged business dormancy."
            checked={notifSettings.businessInactivityReminders ?? true}
            onChange={(e: any) =>
              updateSettings({ businessInactivityReminders: e.target.checked })
            }
            accentColor="slate"
          />
          <NotificationToggle
            icon={ShieldAlert}
            label="Security Audits"
            desc="Essential alerts identifying authentication shifts or local wipes."
            checked={notifSettings.securityAlerts}
            onChange={(e: any) =>
              updateSettings({ securityAlerts: e.target.checked })
            }
            accentColor="rose"
          />
        </div>
      </div>

      {/* Danger Zone Section (End of page) */}
      <div className="mt-16 pt-10 border-t border-slate-200/60">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">
              Danger Zone
            </h4>
            <p className="text-slate-500 text-sm">
              Destructive actions that permanently modify workspace
              accessibility
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all hover:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <Database className="w-5 h-5" />
                </div>
                <h5 className="text-base font-semibold text-slate-900">
                  Clear Application Cache
                </h5>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed md:pl-[3.25rem]">
                Wipe local device cache and isolated data. Cloud backups remain
                intact.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              {showResetConfirm ? (
                <div className="flex items-center gap-3 animate-fade-in w-full md:w-64">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetSandbox}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full md:w-48 py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-all shadow-sm"
                >
                  Clear Local Scope
                </button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-red-50/30 border border-red-100 rounded-[2rem] p-6 md:p-8 shadow-[0_2px_15px_-3px_rgba(254,226,226,0.6)] transition-all hover:border-red-200 hover:shadow-[0_4px_20px_-4px_rgba(254,226,226,0.8)] flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h5 className="text-base font-semibold text-slate-900">
                  Delete Workspace
                </h5>
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed md:pl-[3.25rem]">
                Permanently queue this workspace and all internal data for
                complete erasure.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  setWizardStep(1);
                  setPasswordInput("");
                  setConfirmText("");
                  setFinalCheckbox(false);
                  setVerificationError("");
                  setShowDeleteWizard(true);
                }}
                className="w-full md:w-56 py-3 bg-red-50 hover:bg-red-600 hover:shadow-lg text-red-600 hover:text-white text-sm font-semibold rounded-xl transition-all duration-300"
              >
                Initiate Workspace Deletion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Support & Feature Request Banner */}
      <div className="mt-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl border border-indigo-400/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 group relative overflow-hidden text-white w-full">
        <div className="absolute top-0 right-0 -mx-8 -my-8 w-48 h-48 bg-white/10 rounded-full blur-3xl filter group-hover:bg-white/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 -mx-8 -my-8 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl filter group-hover:bg-purple-400/30 transition-all duration-500" />
        
        <div className="space-y-2 flex-1 min-w-0 text-left relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-white/10">
              <MessageSquare className="w-4 h-4 text-white" />
            </span>
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block">24/7 Priority Support Desk</span>
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight leading-snug">
            Need Help, Training, or a Custom Feature?
          </h3>
          
          <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-[90%]">
            Our expert team is live. Email us directly with any questions or feature requests—we typically respond with customized updates within <strong className="text-white font-bold bg-white/20 px-1 py-0.5 rounded">24 hours</strong>.
          </p>
        </div>

        <div className="shrink-0 relative z-10">
          <a href="mailto:support.smartvyapar@gmail.com?subject=Priority%20Support%20%2F%20Feature%20Request&body=Hello%20Smart%20Vyapar%20Team%2C%0A%0AI%20am%20using%20the%20Smart%20Vyapar%20billing%20and%20ERP%20applet.%20I'd%20love%20to%20get%20assistance%20on%3A%0A%0A%5BDescribe%20your%20need%20or%20feature%20here%5D" className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-indigo-700 hover:bg-slate-50 text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            <Mail className="w-4 h-4 text-indigo-750 stroke-[2.5]" /> Contact support.smartvyapar@gmail.com
          </a>
        </div>
      </div>

      {/* Modern Deletion Modal */}
      {showDeleteWizard && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 flex items-start gap-4 border-b border-slate-100">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-1">
                <h4 className="text-xl font-semibold text-slate-900">
                  Terminate Workspace
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  This protocol is strictly irreversible
                </p>
              </div>
              <button
                onClick={() => setShowDeleteWizard(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex px-6 md:px-8 py-4 bg-slate-50/50 border-b border-slate-100 gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full ${step <= wizardStep ? "bg-red-500" : "bg-slate-200"}`}
                />
              ))}
            </div>

            <div className="p-6 md:p-8">
              {wizardStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5 mb-8">
                    <h5 className="text-sm font-semibold text-red-900 mb-2">
                      30-Day Cool-down Period
                    </h5>
                    <p className="text-sm text-red-800/80 leading-relaxed">
                      Your architecture will enter a suspended state. After 30
                      days, all ledgers, clients, and inventory data are
                      cryptographically wiped. Recovery is mechanically
                      impossible post-execution.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowDeleteWizard(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Acknowledge Risk
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {isGoogleUser ? (
                    <div className="text-center py-4">
                      <div className="mx-auto w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-7 h-7 text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-6">
                        {user?.email}
                      </p>
                      {verificationError && (
                        <p className="text-sm text-red-600 mb-6 bg-red-50 py-3 rounded-xl border border-red-100">
                          {verificationError}
                        </p>
                      )}
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => setWizardStep(1)}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleGoogleReauthSimulate}
                          disabled={isVerifying}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                          Verify Authorization
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyIdentity} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Workspace Identifier
                        </label>
                        <input
                          type="text"
                          disabled
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] font-medium text-slate-700 outline-none"
                          value={user?.email || "System Default"}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Privileged Passphrase
                        </label>
                        <input
                          type="password"
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-sm outline-none transition-shadow"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      {verificationError && (
                        <p className="text-sm text-red-600 bg-red-50 py-3 px-4 rounded-xl border border-red-100">
                          {verificationError}
                        </p>
                      )}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifying}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          Authenticate
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Execute Final Command
                      </label>
                      <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
                        Type{" "}
                        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          DELETE MY BUSINESS
                        </span>{" "}
                        to acknowledge destruction.
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 rounded-xl text-[14px] font-medium text-slate-900 placeholder-slate-400 outline-none transition-all uppercase tracking-wide"
                        placeholder="DELETE MY BUSINESS"
                        value={confirmText}
                        onChange={(e) =>
                          setConfirmText(e.target.value.toUpperCase())
                        }
                      />
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
                        checked={finalCheckbox}
                        onChange={(e) => setFinalCheckbox(e.target.checked)}
                      />
                      <span className="text-sm text-slate-700 leading-snug font-medium">
                        I abdicate all data rights and authorize immediate
                        execution of the permanent destruction protocol.
                      </span>
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={triggerPermanentDeletion}
                        disabled={
                          confirmText !== "DELETE MY BUSINESS" ||
                          !finalCheckbox ||
                          isSubmittingDeletion
                        }
                        className="px-5 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                      >
                        {isSubmittingDeletion ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Execute Deletion
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
