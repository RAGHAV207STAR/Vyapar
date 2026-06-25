/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  X,
  Inbox,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NotificationCenter({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useBilling();
  const isAdmin = profile?.role === 'admin';

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    settings,
    testTriggerNotification
  } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [showTester, setShowTester] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lowStock':
        return <Package className="h-4.5 w-4.5 text-rose-600 animate-bounce" />;
      case 'duePayment':
        return <CreditCard className="h-4.5 w-4.5 text-amber-600" />;
      case 'dailySummary':
        return <TrendingUp className="h-4.5 w-4.5 text-teal-600" />;
      case 'weeklySummary':
        return <Calendar className="h-4.5 w-4.5 text-blue-600" />;
      case 'monthlySummary':
        return <BarChart2 className="h-4.5 w-4.5 text-purple-600" />;
      case 'inactivity':
        return <AlertTriangle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />;
      case 'inventoryReview':
        return <Package className="h-4.5 w-4.5 text-emerald-600 animate-pulse" />;
      case 'security':
        return <Lock className="h-4.5 w-4.5 text-violet-600" />;
      case 'export':
        return <FileDown className="h-4.5 w-4.5 text-orange-600" />;
      default:
        return <AlertCircle className="h-4.5 w-4.5 text-indigo-600" />;
    }
  };

  const getNotifTypeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'lowStock': return 'bg-rose-50 border-rose-100';
      case 'duePayment': return 'bg-amber-50 border-amber-100';
      case 'dailySummary': return 'bg-teal-50 border-teal-100';
      case 'weeklySummary': return 'bg-blue-50 border-blue-100';
      case 'monthlySummary': return 'bg-purple-50 border-purple-100';
      case 'inactivity': return 'bg-amber-50 border-amber-100';
      case 'inventoryReview': return 'bg-emerald-50 border-emerald-100';
      case 'security': return 'bg-violet-50 border-violet-100';
      case 'export': return 'bg-orange-50 border-orange-100';
      default: return 'bg-slate-50 border-slate-100';
    }
  };

  const formatTime = (isoString: string) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => {
          if (onNavigate) {
            onNavigate();
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="relative p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-2xl cursor-pointer transition duration-300 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-500"
        aria-label="Toggle notifications center"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1.5 flex items-center justify-center text-[10px] font-black text-white bg-indigo-600 rounded-full border-2 border-white animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 shadow-2xl rounded-3xl z-[999] overflow-hidden flex flex-col text-left"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#fbfbfa] to-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Notification Center</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">Device Synchronization Live</p>
              </div>
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    onClick={() => setShowTester(!showTester)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-lg text-[9px] font-black tracking-wider uppercase transition cursor-pointer"
                  >
                    {showTester ? 'Hide Tester' : 'Test Panel'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Test Simulation Trigger Section */}
            {showTester && isAdmin && (
              <div className="bg-slate-50 border-b border-slate-150 p-3 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3 h-3 text-indigo-600 shrink-0" />
                  Trigger Test Alerts (For Client + Server verification)
                </span>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                  <button
                    onClick={() => testTriggerNotification('lowStock')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    📦 Low Stock Alert
                  </button>
                  <button
                    onClick={() => testTriggerNotification('duePayment')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    💳 Due Balance Alert
                  </button>
                  <button
                    onClick={() => testTriggerNotification('dailySummary')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    📊 Daily Summary
                  </button>
                  <button
                    onClick={() => testTriggerNotification('weeklySummary')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    📆 Weekly Report
                  </button>
                  <button
                    onClick={() => testTriggerNotification('monthlySummary')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    🌟 Monthly Summary
                  </button>
                  <button
                    onClick={() => testTriggerNotification('security')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    🔐 Security Alert
                  </button>
                  <button
                    onClick={() => testTriggerNotification('export')}
                    className="p-1 bg-white hover:bg-slate-100 text-[10px] border border-slate-200 rounded font-bold text-slate-700 transition text-left pl-2"
                  >
                    📥 Export Complete
                  </button>
                  <button
                    onClick={() => testTriggerNotification('inventoryReview')}
                    className="p-1 bg-indigo-50/50 hover:bg-indigo-150 text-[10px] border border-indigo-100 rounded font-bold text-indigo-800 transition text-left pl-2"
                  >
                    📋 Inventory Review (7d)
                  </button>
                  <button
                    onClick={() => testTriggerNotification('inactivity')}
                    className="p-1 bg-amber-50/50 hover:bg-amber-150 text-[10px] border border-amber-150 rounded font-bold text-amber-805 transition text-left pl-2"
                  >
                    ⏳ Inactivity (3d)
                  </button>
                  <button
                    onClick={() => testTriggerNotification('inactivity')}
                    className="p-1 bg-amber-50/50 hover:bg-amber-150 text-[10px] border border-amber-150 rounded font-bold text-amber-805 transition text-left pl-2"
                  >
                    ⏳ Inactivity (7d)
                  </button>
                  <button
                    onClick={() => testTriggerNotification('inactivity')}
                    className="p-1 bg-amber-50/50 hover:bg-amber-150 text-[10px] border border-amber-150 rounded font-bold text-amber-805 transition text-left pl-2"
                  >
                    ⏳ Inactivity (15d)
                  </button>
                  <button
                    onClick={() => testTriggerNotification('inactivity')}
                    className="p-1 bg-amber-50/50 hover:bg-amber-150 text-[10px] border border-amber-150 rounded font-bold text-amber-850 transition text-left pl-2"
                  >
                    ⏳ Inactivity (30d)
                  </button>
                </div>
              </div>
            )}

            {/* Quick Filter tabs */}
            <div className="flex border-b border-slate-100 px-3 bg-[#fbfbfa]">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-3 text-[11px] font-black border-b-2 tracking-wide cursor-pointer transition ${
                  activeTab === 'all' 
                    ? 'border-indigo-600 text-indigo-700 font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`py-2 px-3 text-[11px] font-black border-b-2 tracking-wide cursor-pointer transition ${
                  activeTab === 'unread' 
                    ? 'border-indigo-600 text-indigo-700 font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Lists content scroll area */}
            <div className="max-h-80 md:max-h-96 overflow-y-auto divide-y divide-slate-50">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Clear Workspace</h5>
                    <p className="text-[10px] leading-relaxed font-semibold text-slate-400 mt-1">
                      {activeTab === 'unread' ? "You have read all received alerts." : "No business events to notify."}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 flex items-start space-x-3 text-left transition hover:bg-slate-50 ${
                      !notif.read ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    {/* Visual Emblem Icon colored per category */}
                    <div className={`p-2 rounded-xl border shrink-0 ${getNotifTypeColor(notif.type)}`}>
                      {getNotifIcon(notif.type)}
                    </div>

                    {/* Meta Text */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className={`text-xs tracking-tight truncate leading-snug ${
                          !notif.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                        }`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] font-mono font-bold text-slate-400 whitespace-nowrap pt-0.5">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 leading-relaxed break-words">
                        {notif.body}
                      </p>
                    </div>

                    {/* Read Toggle Quick Action */}
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 hover:bg-white border hover:border-slate-205 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer self-center shrink-0 transition"
                        title="Mark read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions Footer Panel */}
            <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex justify-between gap-4">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-[10px] font-black text-indigo-700 hover:text-indigo-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer uppercase tracking-wider flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5 shrink-0" />
                Mark all read
              </button>
              
              <button
                onClick={clearAll}
                disabled={notifications.length === 0}
                className="text-[10px] font-black text-rose-600 hover:text-rose-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer uppercase tracking-wider flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                Clear list
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
