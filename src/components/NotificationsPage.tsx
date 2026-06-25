import React, { useState, useMemo } from 'react';
import { useNotification, NotificationItem } from '../context/NotificationContext';
import { useBilling } from '../context/BillingContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Package, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  BarChart2, 
  Lock, 
  FileDown, 
  AlertCircle,
  Inbox,
  AlertTriangle,
  Search,
  Check,
  Copy,
  Info,
  Sliders,
  Sparkles,
  Terminal,
  X,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationsPage() {
  const { profile } = useBilling();
  const isAdmin = profile?.role === 'admin';

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    settings,
    updateSettings,
    permissionGranted,
    fcmToken,
    requestPermission,
    testTriggerNotification
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [showFCM, setShowFCM] = useState(false);
  const [copiedNotificationId, setCopiedNotificationId] = useState<string | null>(null);

  // Formatting helper
  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lowStock':
        return <Package className="h-5 w-5 text-rose-600" />;
      case 'duePayment':
        return <CreditCard className="h-5 w-5 text-amber-600" />;
      case 'dailySummary':
        return <TrendingUp className="h-5 w-5 text-teal-600" />;
      case 'weeklySummary':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'monthlySummary':
        return <BarChart2 className="h-5 w-5 text-purple-600" />;
      case 'inactivity':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'inventoryReview':
        return <Package className="h-5 w-5 text-emerald-600" />;
      case 'security':
        return <Lock className="h-5 w-5 text-violet-600" />;
      case 'export':
        return <FileDown className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-indigo-600" />;
    }
  };

  const getNotifTypeDetails = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lowStock': 
        return { label: 'Inventory Restock Warning', badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200/50 hover:bg-rose-100/70', bg: 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent' };
      case 'duePayment': 
        return { label: 'Pending Dues reminder', badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100/70', bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent' };
      case 'dailySummary': 
        return { label: 'Daily summary reports', badgeStyle: 'bg-teal-50 text-teal-700 border-teal-200/50 hover:bg-teal-100/70', bg: 'bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent' };
      case 'weeklySummary': 
        return { label: 'Weekly insights data', badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100/70', bg: 'bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent' };
      case 'monthlySummary': 
        return { label: 'Monthly growth summary', badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/50 hover:bg-purple-100/70', bg: 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent' };
      case 'inactivity': 
        return { label: 'Inactivity alert trigger', badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100/70', bg: 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent' };
      case 'inventoryReview': 
        return { label: 'Periodic stock review', badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100/70', bg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent' };
      case 'security': 
        return { label: 'Account login security', badgeStyle: 'bg-violet-50 text-violet-700 border-violet-200/50 hover:bg-violet-100/70', bg: 'bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent' };
      case 'export': 
        return { label: 'Documents export status', badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200/50 hover:bg-orange-100/70', bg: 'bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent' };
      default: 
        return { label: 'General notice updates', badgeStyle: 'bg-slate-50 text-slate-700 border-slate-200/50 hover:bg-slate-100/70', bg: 'bg-gradient-to-r from-slate-500/10 via-slate-500/5 to-transparent' };
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      return 'Recent Alert';
    }
  };

  const handleCopyFCM = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleCopyNotificationText = (notif: NotificationItem) => {
    const copyText = `🔔 *${notif.title}*\n${notif.body}\nGenerated: ${formatDateTime(notif.createdAt)}`;
    navigator.clipboard.writeText(copyText);
    setCopiedNotificationId(notif.id);
    setTimeout(() => setCopiedNotificationId(null), 2000);
  };

  // Filter & Search Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tab unread state filter
      if (activeTab === 'unread' && n.read) return false;

      // 2. Sidebar/Badge Type Filter
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;

      // 3. Search query string
      if (searchTerm) {
        const queryLower = searchTerm.toLowerCase();
        return n.title.toLowerCase().includes(queryLower) || n.body.toLowerCase().includes(queryLower);
      }

      return true;
    });
  }, [notifications, activeTab, typeFilter, searchTerm]);

  // Settings structure with labels and keys
  const notificationPreferences = [
    { key: 'lowStockAlerts', label: 'Inventory Low Stock Warnings', desc: 'Alerts you instantly when item volumes fall below threshold parameters' },
    { key: 'duePaymentReminders', label: 'Customer Due Balance Remainders', desc: 'Triggers reminders for overdue or pending invoice balances' },
    { key: 'dailyBusinessSummary', label: 'Daily Workspace Summary Report', desc: 'Receives daily sales receipts, invoice totals and calculated margins' },
    { key: 'weeklyBusinessReport', label: 'Weekly Performance Intelligence', desc: 'Sends weekly business timeline reports and top customer analyses' },
    { key: 'monthlyPerformanceReport', label: 'Monthly Growth Records', desc: 'Provides detailed monthly summaries of balance sheets and stock values' },
    { key: 'businessInactivityReminders', label: 'Inactivity Notice Reminders (3-30d)', desc: 'Gives prompt notifications if database updates have stalled' },
    { key: 'inventoryReviewReminders', label: 'Periodic Stock Audits (7d)', desc: 'Notifies the administrator to verify stock physical ledger quantities' },
    { key: 'securityAlerts', label: 'Account & Credentials Security Warnings', desc: 'Notifies when critical security state changes or logins occur' },
    { key: 'exportCompletionNotifications', label: 'Documents Export Completion Alerts', desc: 'Alerts when PDF/Excel generation cycles complete' },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in pb-20 text-left w-full min-w-0 font-sans select-none">
      {/* Premium Hero Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] sm:text-xs font-bold text-slate-500 mb-2.5 uppercase tracking-widest shadow-sm">
            <Bell className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Workspace Live Sync
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 tracking-tight leading-none flex items-center gap-2">
            Notification Management
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase mt-1.5">
            Synchronize, review alerts, adjust permissions, and simulate platform warnings
          </p>
        </div>

        {/* Action Buttons Panel */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-[#4f46e5] text-xs font-extrabold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 text-rose-600 text-xs font-extrabold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear All History
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Column = Notifications List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Full Section: Notifications List & Search Filters (Col-span 12) */}
        <div className="lg:col-span-12 space-y-6 min-w-0">
          
          {/* Filters & Category Controls Card */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <Sliders className="w-4 h-4 text-indigo-500" /> Filter Alerts By Category:
              </span>
              
              {/* Specific Alert Category Chooser Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer text-slate-700 transition"
              >
                <option value="all">📁 All Categories</option>
                <option value="lowStock">📦 Inventory Low Stock</option>
                <option value="duePayment">💳 Pending Dues Reminders</option>
                <option value="dailySummary">📊 Daily summaries</option>
                <option value="weeklySummary">📆 Weekly insight summaries</option>
                <option value="monthlySummary">🌟 Monthly performances</option>
                <option value="inactivity">⏳ Inactivity logs</option>
                <option value="inventoryReview">📋 Inventory Audits</option>
                <option value="security">🔐 Account Security</option>
                <option value="export">📥 Document Exports</option>
              </select>
            </div>

            {/* Read/Unread State Toggles */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 select-none">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-black cursor-pointer transition ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Logs ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`px-4 py-2 rounded-lg text-xs font-black cursor-pointer transition ${
                    activeTab === 'unread'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {filteredNotifications.length} matches
              </span>
            </div>
          </div>

          {/* Notifications Scroll List Content */}
          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-3xl border border-slate-200/90 py-16 px-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm"
                >
                  <div className="h-14 w-14 bg-indigo-50/80 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <div className="max-w-md">
                    <h5 className="text-base font-black text-slate-800">Clear Notification Workspace</h5>
                    <p className="text-xs leading-relaxed font-semibold text-slate-400 mt-1.5">
                      {searchTerm 
                        ? `We couldn't find any received alerts matching your search term "${searchTerm}". Try broadening filters.`
                        : typeFilter !== 'all'
                        ? "No alerts have been recorded under this category group."
                        : activeTab === 'unread'
                        ? "You have processed and marked all received live-sync alerts as read!"
                        : "Your notification feed is currently silent. No background operational alerts have triggered yet."}
                    </p>
                  </div>
                </motion.div>
              ) : (
                filteredNotifications.map((notif) => {
                  const details = getNotifTypeDetails(notif.type);
                  return (
                    <motion.div
                      layout
                      key={notif.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`relative bg-white border rounded-3xl overflow-hidden transition-all duration-300 shadow-xs hover:shadow-md hover:border-slate-300/80 flex flex-col ${
                        !notif.read ? 'border-indigo-200 ring-1 ring-indigo-100/55' : 'border-slate-200/80'
                      }`}
                    >
                      {/* Left category highlight bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${!notif.read ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                      
                      {/* Inner Row Content */}
                      <div className="p-4 sm:p-5 flex items-start gap-4 flex-1 select-text">
                        {/* Interactive Colored Category Emblem Circle */}
                        <div className={`p-3 rounded-2xl border shrink-0 ${!notif.read ? 'bg-indigo-55/70 border-indigo-120/50 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                          {getNotifIcon(notif.type)}
                        </div>

                        {/* Middle Text Details */}
                        <div className="flex-1 min-w-0 space-y-1.5 text-left">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${details.badgeStyle}`}>
                              {details.label}
                            </span>
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-450 whitespace-nowrap">
                              {formatDateTime(notif.createdAt)}
                            </span>
                          </div>

                          <h3 className={`text-sm sm:text-base tracking-tight leading-snug break-words ${
                            !notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                          }`}>
                            {notif.title}
                          </h3>

                          <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed break-words whitespace-pre-line">
                            {notif.body}
                          </p>
                        </div>

                        {/* Interactive Side Button Actions */}
                        <div className="flex flex-col sm:flex-row gap-1.5 shrink-0 self-center select-none">
                          {/* Copy Content Box */}
                          <div className="relative">
                            <button
                              onClick={() => handleCopyNotificationText(notif)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0 h-9 w-9"
                              title="Copy details"
                            >
                              {copiedNotificationId === notif.id ? (
                                <Check className="h-4.5 w-4.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-4.5 w-4.5" />
                              )}
                            </button>
                          </div>

                          {/* Quick Mark Read checkmark button */}
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-xl text-[#4f46e5] font-bold transition cursor-pointer active:scale-95 flex items-center justify-center shrink-0 h-9 w-9"
                              title="Mark read"
                            >
                              <CheckCheck className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
