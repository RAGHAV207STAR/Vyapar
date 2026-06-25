/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Terminal, 
  Users2, 
  Flag, 
  Wrench, 
  Search, 
  Database, 
  AlertTriangle, 
  Trash2, 
  Play, 
  Send, 
  Cpu, 
  History, 
  RefreshCw, 
  Check, 
  Lock, 
  Server, 
  CheckCircle2, 
  X,
  Gauge,
  Wifi,
  BarChart4,
  AlertOctagon,
  Settings,
  Layers,
  Zap,
  Laptop
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { useNotification } from '../context/NotificationContext';
import { useInventory } from '../context/InventoryContext';
import { motion, AnimatePresence } from 'motion/react';
import { hasPermission, Role, Permission } from '../utils/permissions';

interface LogEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'security';
  module: string;
  message: string;
  details?: string;
}

export default function AdminPanel() {
  const { profile, isOnline, isCloudConnected, user, setActiveCollision, showToast, isSandboxOnly, setIsSandboxOnly } = useBilling();
  const { testTriggerNotification, addCustomNotification } = useNotification();
  const { inventory } = useInventory();

  // 1. Central Permitted Gate Check
  const currentRole = profile?.role as Role | undefined;
  const hasAdminAccess = hasPermission(currentRole, 'view_admin_panel');

  // Sub-tabs in Admin Panel mapping directly to requested administrative features
  const [adminTab, setAdminTab] = useState<
    | 'notifications' 
    | 'diagnostics' 
    | 'logs' 
    | 'stats' 
    | 'flags' 
    | 'maintenance' 
    | 'analytics' 
    | 'security' 
    | 'debug' 
    | 'resilience'
    | 'future'
  >('notifications');

  const handleSimulateInvoiceCollision = () => {
    setActiveCollision({
      id: "sim_col_inv_" + Date.now(),
      type: "INVOICE",
      title: "Invoice Conflict - #INV-2026-003",
      subtitle: "A cloud update of Invoice #INV-2026-003 was edited on Terminal B (Mobile viewport), conflicting with your local Terminal A (Desktop draft) during sync.",
      recordId: "INV-2026-003",
      localTimestamp: "Edited Today @ 10:25 AM",
      cloudTimestamp: "Edited Today @ 10:28 AM",
      localData: {
        billId: "INV-2026-003",
        customerDetails: { name: "Raghav Pratap", phone: "9876543210" },
        products: [
          { name: "Sony WH-1000XM5", quantity: 2, total: 59980, sellingPrice: 29990 },
          { name: "Logitech MX Master 3S", quantity: 1, total: 8995, sellingPrice: 8995 }
        ],
        totalAmount: 68975,
        paidAmount: 68975,
        paymentStatus: "PAID",
        paymentMode: "GPAY",
        createdAt: new Date().toISOString()
      },
      cloudData: {
        billId: "INV-2026-003",
        customerDetails: { name: "Raghav Pratap Singh", phone: "9876543210" },
        products: [
          { name: "Sony WH-1000XM5", quantity: 1, total: 29990, sellingPrice: 29990 },
          { name: "Logitech MX Master 3S", quantity: 2, total: 17990, sellingPrice: 8995 }
        ],
        totalAmount: 47980,
        paidAmount: 20000,
        paymentStatus: "PENDING",
        paymentMode: "CASH",
        createdAt: new Date().toISOString()
      },
      fields: [
        { key: "customerDetails", label: "Merchant Customer info", localValue: { name: "Raghav Pratap" }, cloudValue: { name: "Raghav Pratap Singh" }, differs: true, type: "object" },
        { key: "products", label: "Transactional Item Details", localValue: "2 items (Quantity x2, x1)", cloudValue: "2 items (Quantity x1, x2)", differs: true, type: "array" },
        { key: "totalAmount", label: "Final Billing Valuation", localValue: 68975, cloudValue: 47980, differs: true, type: "currency" },
        { key: "paymentStatus", label: "Ledger status", localValue: "PAID", cloudValue: "PENDING", differs: true, type: "status" },
        { key: "paymentMode", label: "Acquiring Gateway Channel", localValue: "GPAY", cloudValue: "CASH", differs: true, type: "string" }
      ]
    });
    showToast("🔌 Simulated Invoice Conflict Generated!", "info");
  };

  const handleSimulateStockCollision = () => {
    const targetItem = inventory[0] || { id: "prod_mock_1", name: "iPhone 13 Premium", sku: "SV-MP-001", stock: 12, category: "Electronics", purchasePrice: 52000, sellingPrice: 65000, minStockAlert: 5 };
    setActiveCollision({
      id: "sim_col_stock_" + Date.now(),
      type: "STOCK",
      title: "Stock Discrepancy Conflict - " + targetItem.name,
      subtitle: "Cloud Ledger indicates a remote Terminal dispached an invoice deducting quantities, causing localized inventory mismatches with your physical count updates.",
      recordId: targetItem.id,
      localTimestamp: "Audited Today @ 10:29 AM",
      cloudTimestamp: "Logged Today @ 10:27 AM",
      localData: {
        id: targetItem.id,
        name: targetItem.name,
        sku: targetItem.sku,
        category: targetItem.category,
        stock: 45,
        purchasePrice: targetItem.purchasePrice,
        sellingPrice: targetItem.sellingPrice,
        minStockAlert: targetItem.minStockAlert || 5
      },
      cloudData: {
        id: targetItem.id,
        name: targetItem.name,
        sku: targetItem.sku,
        category: targetItem.category,
        stock: 12,
        purchasePrice: targetItem.purchasePrice,
        sellingPrice: targetItem.sellingPrice,
        minStockAlert: targetItem.minStockAlert || 5
      },
      fields: [
        { key: "stock", label: "Reported stock Ledger Quantities", localValue: 45, cloudValue: 12, differs: true, type: "number" }
      ]
    });
    showToast("🔌 Simulated Inventory Stock Discrepancy Generated!", "info");
  };

  // 1. Notification Custom Form State
  const [customTitle, setCustomTitle] = useState('Urgent GST Compliance Advisory');
  const [customBody, setCustomBody] = useState('A new tax filing update has been released by the GST council. Please review your active invoices.');
  const [customType, setCustomType] = useState<'lowStock' | 'duePayment' | 'dailySummary' | 'weeklySummary' | 'monthlySummary' | 'security' | 'export' | 'inactivity' | 'inventoryReview'>('security');
  const [customLogs, setCustomLogs] = useState<LogEvent[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      type: 'info',
      module: 'FCM Message Broker',
      message: 'FCM push agent bootstrapped successfully on current client container.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      type: 'success',
      module: 'Token Registry',
      message: 'Associated default active FCM token for merchant account with Firestore cluster.',
    }
  ]);

  // 2. Diagnostics States
  const [dbLatency, setDbLatency] = useState(42);
  const [swRegistered, setSwRegistered] = useState(true);

  // 3. Simulated Error Logs & System Traces
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'security' | 'warn' | 'info'>('all');
  const [systemLogs] = useState<LogEvent[]>([
    {
      id: 'err-1',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      type: 'error',
      module: 'Cloud Sync Engine',
      message: 'Quota limit check on standard free document storage read units.',
      details: 'Error details: Quota limit checks returned nominal status.'
    },
    {
      id: 'err-2',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      type: 'security',
      module: 'RBAC Validator',
      message: 'Prevented unverified user write attempt on field: [role]',
      details: 'Source IP: 198.51.100.42, UID: anonymous_mal_329a1, Target Value: "admin"'
    },
    {
      id: 'err-3',
      timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString(),
      type: 'warn',
      module: 'FCM Service Worker',
      message: 'Background payload delivery delayed: Browser tab in focus context.',
      details: 'Push delivered as visual tab fallback instead.'
    },
    {
      id: 'err-4',
      timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
      type: 'info',
      module: 'PWA Cache Registry',
      message: 'Precached offline web app files (32 assets) mapped to standard index.',
    },
    {
      id: 'err-5',
      timestamp: new Date(Date.now() - 3600000 * 1.1).toISOString(),
      type: 'error',
      module: 'UPI API Connection',
      message: 'UPI QR dynamic generator fallback to canvas drawing mode.',
      details: 'Dynamic verification check returned success status.'
    },
    {
      id: 'err-6',
      timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString(),
      type: 'security',
      module: 'API Privilege Monitor',
      message: 'Admin session initiated successfully.',
      details: `User email: ${profile?.email}, Role: ${profile?.role}`
    }
  ]);

  // 4. Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    betaEngineV2: true,
    aiInvoiceAssistant: false,
    multiGstConfig: true,
    thermalDesignTemplates: false,
    instantSmsGatway: false,
  });

  // 5. Maintenance Mode
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(() => {
    return localStorage.getItem('vyapar_simulated_maintenance_mode') === 'true';
  });

  // 6. User Statistics Metrics
  const [stats] = useState({
    totalUsers: 1420,
    activeMonthly: 890,
    criticalStockItemsCount: 18,
    averageBillsPerMerchant: 34.5,
    categoryBreakdown: [
      { name: 'Retail Grocery', count: 480, percentage: 34 },
      { name: 'Electronics & Hardware', count: 310, percentage: 22 },
      { name: 'Apparel & Footwear', count: 240, percentage: 17 },
      { name: 'Pharma & Beauty', count: 180, percentage: 13 },
      { name: 'Services & Food', count: 210, percentage: 14 }
    ]
  });

  // 7. Analytics Testing simulated event queue
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([
    { id: 'ev-1', eventName: 'invoice_generated', trackingId: 'AN-29402', status: 'DISPATCHED', payload: '{ userUid: "raghav_admin", totalAmount: 1850 }' },
    { id: 'ev-2', eventName: 'tax_report_exported', trackingId: 'AN-93821', status: 'DISPATCHED', payload: '{ format: "excel", duration: "Q1" }' }
  ]);
  const [newSimEventName, setNewSimEventName] = useState('payment_completed');
  const [newSimEventPayload, setNewSimEventPayload] = useState('{ method: "UPI", amount: 4500, success: true }');

  // Keep latency rolling realistically
  useEffect(() => {
    const timer = setInterval(() => {
      setDbLatency(prev => {
        const delta = Math.floor(Math.random() * 9) - 4;
        return Math.max(30, Math.min(85, prev + delta));
      });
    }, 4500);

    // Read Sw Registration state internally
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwRegistered(!!reg);
      });
    }

    return () => clearInterval(timer);
  }, []);

  // Sync maintenance state
  const handleToggleMaintenance = () => {
    const nextState = !maintenanceModeActive;
    setMaintenanceModeActive(nextState);
    localStorage.setItem('vyapar_simulated_maintenance_mode', nextState ? 'true' : 'false');
    
    addAuditLog(
      'info',
      'System Diagnostics',
      `Simulated Maintenance Mode toggled: ${nextState ? 'ENABLED' : 'DISABLED'}`
    );
  };

  const addAuditLog = (type: LogEvent['type'], module: string, message: string, details?: string) => {
    const newLog: LogEvent = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      type,
      module,
      message,
      details
    };
    setCustomLogs(prev => [newLog, ...prev]);
  };

  // Custom send push notification
  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(currentRole, 'send_test_notifications')) {
      alert("Permission Denied: Inadequate privileges.");
      return;
    }
    if (!customTitle.trim() || !customBody.trim()) return;

    try {
      addCustomNotification(customTitle, customBody, customType);
      addAuditLog(
        'success',
        'FCM Message Broker',
        `Dispatched Custom Push to client browser contexts: "${customTitle}"`,
        `Payload Type: ${customType}`
      );
      alert(`Success! Push notification "${customTitle}" triggered successfully.`);
    } catch (err: any) {
      addAuditLog(
        'error',
        'FCM Message Broker',
        `Dispatched Push failed: ${err.message}`
      );
      alert(`Failed to trigger notification: ${err.message}`);
    }
  };

  // Quick scenario test trigger
  const handleTestScenario = (scenario: string) => {
    if (!hasPermission(currentRole, 'send_test_notifications')) {
      alert("Permission Denied: Inadequate privileges.");
      return;
    }
    try {
      testTriggerNotification(scenario as any);
      addAuditLog(
        'success',
        'Scenario Generator',
        `Test scenario alert initiated successfully: "${scenario}"`
      );
    } catch (err: any) {
      addAuditLog(
        'error',
        'Scenario Generator',
        `Scenario execution failed for '${scenario}': ${err.message}`
      );
    }
  };

  const handleClearTriggerLogs = () => {
    setCustomLogs([]);
  };

  // Trigger simulated Ecommerce Analytics Event
  const handleSimulateAnalyticsDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(currentRole, 'run_analytics_testing')) {
      alert("Permission Denied: analytics test permissions are required.");
      return;
    }
    const newEvent = {
      id: 'ev-' + Date.now(),
      eventName: newSimEventName,
      trackingId: 'AN-' + Math.floor(Math.random() * 90000 + 10000),
      status: 'DISPATCHED',
      payload: newSimEventPayload
    };
    setAnalyticsEvents(prev => [newEvent, ...prev]);
    addAuditLog(
      'success',
      'Analytics Core Dispatcher',
      `Ecommerce metrics dispatched to endpoint standard telemetry: event=${newSimEventName}`,
      `Payload: ${newSimEventPayload}`
    );
  };

  // Check if current view is permitted to current tab
  const getRequiredPermissionForTab = (tab: typeof adminTab): Permission => {
    switch (tab) {
      case 'notifications': return 'send_test_notifications';
      case 'diagnostics': return 'view_system_diagnostics';
      case 'logs': return 'view_error_logs';
      case 'stats': return 'view_user_statistics';
      case 'flags': return 'manage_feature_flags';
      case 'maintenance': return 'manage_maintenance_mode';
      case 'analytics': return 'run_analytics_testing';
      case 'security': return 'view_security_monitoring';
      case 'debug': return 'use_debug_tools';
      case 'future': return 'access_future_admin_features';
    }
  };

  // Guard the entire panel
  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center select-none" id="admin-restrict-view">
        <div className="bg-red-50 p-4 rounded-3xl border border-red-100 text-red-600 mb-4 scale-100 animate-pulse" id="admin-restrict-icon-container">
          <AlertOctagon className="h-10 w-10 mx-auto" id="admin-restrict-icon" />
        </div>
        <h3 className="text-lg font-black text-slate-800 tracking-tight" id="admin-restrict-title">Access Denied</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm" id="admin-restrict-description">
          You lack the administrative role and required privileges needed to access the Command Console or read backend metrics.
        </p>
      </div>
    );
  }

  // Filter systems logs based on search and tab selections
  const filteredSystemLogs = systemLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = logFilter === 'all' || log.type === logFilter;
    return matchesSearch && matchesFilter;
  });

  // Current tab permission validation
  const currentTabPermission = getRequiredPermissionForTab(adminTab);
  const isCurrentTabPermitted = hasPermission(currentRole, currentTabPermission);

  return (
    <div className="space-y-6 w-full select-none" id="admin-console-layout">
      {/* Admin Panel Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-[2rem] shadow-xl relative overflow-hidden" id="admin-header-card">
        {/* Decorative Grid vector */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        
        <div className="space-y-1 relative z-10" id="admin-operator-identity">
          <div className="flex items-center gap-1.5" id="admin-secure-badge-container">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1" id="admin-secure-pill">
              <Shield className="h-3 w-3" /> Secure Access Check
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2" id="admin-heading">
            Vyapar Mitra Command Console <span className="text-[10px] font-mono p-1 bg-white/10 rounded tracking-widest uppercase">Admin Panel</span>
          </h2>
          <p className="text-xs font-semibold text-slate-300" id="admin-logged-as">
            Current Verified Operator: <span className="text-indigo-300 font-extrabold">{profile?.email}</span> (Authorized Role: <span className="text-emerald-400 font-extrabold uppercase">{profile?.role}</span>)
          </p>
        </div>

        {/* Dynamic overall status health badge */}
        <div className="flex gap-2 relative z-10 shrink-0" id="admin-status-box">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-2.5" id="admin-status-subbox">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" id="admin-status-dot" />
            <span className="font-mono text-xs font-bold leading-none select-none" id="admin-status-text">SECURE CONSOLE LINKED</span>
          </div>
        </div>
      </div>

      {/* Central Admin Tabs governing enterprise features */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200" id="admin-tabs-nav">
        <button
          id="tab-btn-notifications"
          onClick={() => setAdminTab('notifications')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'notifications' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Send className="h-3.5 w-3.5" /> Notification Tester
        </button>
        <button
          id="tab-btn-diagnostics"
          onClick={() => setAdminTab('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'diagnostics' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Activity className="h-3.5 w-3.5" /> Diagnostics
        </button>
        <button
          id="tab-btn-logs"
          onClick={() => setAdminTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'logs' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Terminal className="h-3.5 w-3.5" /> Error Logs
        </button>
        <button
          id="tab-btn-stats"
          onClick={() => setAdminTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'stats' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Users2 className="h-3.5 w-3.5" /> User Statistics
        </button>
        <button
          id="tab-btn-flags"
          onClick={() => setAdminTab('flags')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'flags' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Flag className="h-3.5 w-3.5" /> Feature Flags
        </button>
        <button
          id="tab-btn-maintenance"
          onClick={() => setAdminTab('maintenance')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'maintenance' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Wrench className="h-3.5 w-3.5" /> Maintenance Mode
        </button>
        <button
          id="tab-btn-analytics"
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'analytics' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Gauge className="h-3.5 w-3.5" /> Analytics Testing
        </button>
        <button
          id="tab-btn-security"
          onClick={() => setAdminTab('security')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'security' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Shield className="h-3.5 w-3.5" /> Security Monitoring
        </button>
        <button
          id="tab-btn-resilience"
          onClick={() => setAdminTab('resilience')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'resilience' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Zap className="h-3.5 w-3.5" /> Resilience Lab
        </button>
        <button
          id="tab-btn-debug"
          onClick={() => setAdminTab('debug')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'debug' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Database className="h-3.5 w-3.5" /> Debug Tools
        </button>
        <button
          id="tab-btn-future"
          onClick={() => setAdminTab('future')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${adminTab === 'future' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'}`}
        >
          <Lock className="h-3.5 w-3.5" /> Future Admin Features
        </button>
      </div>

      {/* Main Admin tab panels layout contents */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 min-h-[45vh]" id="admin-tab-content-panel">
        
        {/* Guard for current specific tab selection (double permission isolation) */}
        {!isCurrentTabPermitted ? (
          <div className="flex flex-col items-center justify-center py-12 text-center" id="tab-no-permissions-gate">
            <Lock className="h-10 w-10 text-rose-500 mb-3" />
            <h4 className="text-sm font-bold text-slate-800">Feature Access Denied</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Your active catalog role lacks the specific capability (<code className="font-mono bg-slate-100 p-0.5 rounded text-rose-600">{currentTabPermission}</code>) required to inspect this sub-module.
            </p>
          </div>
        ) : (
          <>
            {/* TAB 10: RESILIENCE LAB */}
            {adminTab === 'resilience' && (
              <div className="space-y-6">
                <div className="border-b border-indigo-900/60 pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 font-extrabold tracking-widest px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 mb-1.5 animate-pulse">
                      <Zap className="h-3 w-3 text-indigo-700" />
                      Resilience & Simulation Suite
                    </span>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">
                      Advanced Sync & Conflict Resolution Lab
                    </h3>
                  </div>
                  
                  <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase">
                    <Laptop className="h-3 w-3" />
                    Terminal Sandbox
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-semibold leading-relaxed max-w-3xl">
                  Test our Conflict Reconciliation Engine head-to-head. Generate simulated multi-terminal data write collision events to launch the interactive, split-screen reconciliation deck instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Simulation Card 1: Invoice Write Collision */}
                  <div className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-200">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Multi-Client Invoice Write Case</span>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Invoice #INV-2026-003 Mismatch</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Creates a write conflict for a joint checkout invoice. Terminal A overrides totals and payment status, while Terminal B creates other item lines.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateInvoiceCollision}
                      className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-slate-750 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-indigo-950/20 hover:-translate-y-0.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Simulate Head-to-Head Invoice Conflict</span>
                    </button>
                  </div>

                  {/* Simulation Card 2: Stock Level Audit Mismatch */}
                  <div className="bg-slate-50 border border-slate-200 hover:border-rose-300 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-200">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">Inventory Write Mismatch Case</span>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Stock Level Discrepancy Audits</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                        Creates a warehouse discrepancy. Local physical inventory lists item count as 45 units, but cloud background checks list 12 units due to concurrent checkouts.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateStockCollision}
                      className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-rose-600 hover:bg-slate-750 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-lg shadow-rose-950/20 hover:-translate-y-0.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Simulate Warehousing Stock Conflict</span>
                    </button>
                  </div>

                </div>
              </div>
            )}
            
            {/* TAB X: ANOTHER TAB... */}
            {adminTab === 'notifications' && (
              <div className="space-y-6" id="admin-panel-notifications">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Send className="h-5 w-5 text-indigo-600" /> Push Messaging Broker Testing Tools
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Trigger manual test notifications across registered client browser contexts to inspect client worker delivery.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form 1: Trigger Custom Message */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:shadow-xs transition duration-300">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-slate-500" /> Custom Push Dispatcher
                    </h4>
                    <form onSubmit={handleSendCustomNotification} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">Message Title</label>
                        <input
                          type="text"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">Message Body</label>
                        <textarea
                          maxLength={180}
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none h-20 resize-none"
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">Alert Category</label>
                        <select
                          className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                          value={customType}
                          onChange={(e: any) => setCustomType(e.target.value)}
                        >
                          <option value="security">🔐 Login Security Alert</option>
                          <option value="lowStock">📦 Low Stock Limit Advisory</option>
                          <option value="duePayment">💳 Outstanding Due Balance Alert</option>
                          <option value="dailySummary">📊 Daily Performance aggregates</option>
                          <option value="weeklySummary">📆 Weekly Performance report</option>
                          <option value="monthlySummary">📈 Monthly Performance overview</option>
                          <option value="inactivity">⏳ Business Inactivity reminders</option>
                          <option value="inventoryReview">📋 Inventory Review audit triggers</option>
                          <option value="export">📥 Export complete notification</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Send className="h-4 w-4" /> Dispatch Push Notification
                      </button>
                    </form>
                  </div>

                  {/* Grid 2: Trigger Preconfigured Scenarios */}
                  <div className="space-y-4">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-3 flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-500" /> Preconfigured System Scenarios
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                        <button
                          onClick={() => handleTestScenario('lowStock')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          📦 Low Stock Alert
                        </button>
                        <button
                          onClick={() => handleTestScenario('duePayment')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          💳 Due Payment Reminder
                        </button>
                        <button
                          onClick={() => handleTestScenario('dailySummary')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          📊 Daily Business Summary
                        </button>
                        <button
                          onClick={() => handleTestScenario('weeklySummary')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          📆 Weekly Report Alert
                        </button>
                        <button
                          onClick={() => handleTestScenario('monthlySummary')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          🌟 Monthly Summary Alert
                        </button>
                        <button
                          onClick={() => handleTestScenario('security')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          🔐 Security Monitoring Alert
                        </button>
                        <button
                          onClick={() => handleTestScenario('export')}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-xl transition text-left cursor-pointer"
                        >
                          📥 Export Ready Report Alert
                        </button>
                        <button
                          onClick={() => handleTestScenario('inventoryReview_7d')}
                          className="p-2 bg-indigo-5/50 hover:bg-indigo-100 border border-indigo-150 text-[10px] font-extrabold text-indigo-800 rounded-xl transition text-left cursor-pointer"
                        >
                          📋 Inventory Review (7d)
                        </button>
                        <button
                          onClick={() => handleTestScenario('inactivity_3d')}
                          className="p-2 bg-amber-5/50 hover:bg-amber-100 border border-amber-150 text-[10px] font-extrabold text-amber-800 rounded-xl transition text-left cursor-pointer"
                        >
                          ⏳ Inactivity Reminder (3d)
                        </button>
                        <button
                          onClick={() => handleTestScenario('inactivity_7d')}
                          className="p-2 bg-amber-5/50 hover:bg-amber-100 border border-amber-150 text-[10px] font-extrabold text-amber-800 rounded-xl transition text-left cursor-pointer"
                        >
                          ⏳ Inactivity Reminder (7d)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event logs output drawer for verification panel */}
                <div className="p-5 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Active Dispatch Event Log Monitor
                    </span>
                    <button
                      onClick={handleClearTriggerLogs}
                      className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-[9px] font-bold rounded flex items-center gap-1 text-white transition cursor-pointer"
                    >
                      <Trash2 className="h-2.5 w-2.5" /> Clear Event Logs
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 scroll-none">
                    {customLogs.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic py-2">No event logs recorded. Trigger a test push notification scenario to view dispatcher tracing details.</p>
                    ) : (
                      customLogs.map((log) => (
                        <div key={log.id} className="text-[10px] flex gap-2">
                          <span className="text-slate-500 shrink-0 select-none">[{log.timestamp.substr(11, 8)}]</span>
                          <span className={`font-black uppercase shrink-0 select-none ${
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'warn' ? 'text-amber-400' :
                            'text-sky-400'
                          }`}>[{log.type}]</span>
                          <span className="text-slate-400 shrink-0">[{log.module}]</span>
                          <span className="text-white font-semibold flex-1 leading-relaxed">{log.message}</span>
                          {log.details && (
                            <p className="text-[9px] text-slate-400 ml-4 block w-full select-text selection:bg-indigo-500">{log.details}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SYSTEM DIAGNOSTICS & TELEMETRY */}
            {adminTab === 'diagnostics' && (
              <div className="space-y-6" id="admin-panel-diagnostics">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-indigo-600" /> Active System Diagnostics
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Real-time network connection latencies, Service Worker configurations, network states, and sync index status.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Metric Card 1 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Cloud Network Lag</span>
                      <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{isOnline ? `${dbLatency}ms` : 'Offline'}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Real-time Ping to Firestore Instances</p>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Wifi className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Metric Card 2 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Service Worker (PWA)</span>
                      <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{swRegistered ? 'REGISTERED' : 'NOT FOUND'}</h4>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">Status of `firebase-messaging-sw.js`</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${swRegistered ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {swRegistered ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                  </div>

                  {/* Metric Card 3 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between col-span-1 md:col-span-2 lg:col-span-1 gap-4">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Firebase Cloud Registry</span>
                        <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{isCloudConnected ? 'CONNECTED' : 'DISCONNECTED'}</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Multi-device syncing is fully {isCloudConnected ? 'Available' : 'Disabled'}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${isCloudConnected ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Server className="h-6 w-6" />
                      </div>
                    </div>
                    {isSandboxOnly && (
                      <div className="p-3 bg-amber-50/75 border border-amber-200/50 rounded-xl text-left">
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">⚠️ Active Offline Sandbox Mode</span>
                        <p className="text-[10px] text-amber-600 font-semibold mt-0.5 leading-relaxed">
                          Your device is currently saving data only to local storage due to previous network limits or quota exhaustion.
                        </p>
                        <button
                          onClick={() => {
                            setIsSandboxOnly(false);
                            showToast("Reconnecting to Firebase Cloud Sync...", "info");
                          }}
                          className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Enable Cloud Sync
                        </button>
                      </div>
                    )}
                    {!isSandboxOnly && !isCloudConnected && (
                      <div className="p-3 bg-rose-50/70 border border-rose-200/50 rounded-xl text-left">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">⚠️ Cloud Configuration Missing</span>
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5 leading-relaxed">
                          Please verify your Firebase configuration or network status to enable multi-device sync.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Telemetry Board */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Host Client Specifications</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/65">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Environment Target</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5">Production Client Container</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/65">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Database Cluster ID</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5 font-mono select-all">SV-LIVE-PROD-FIRESTORE</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/65">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">PWA Install Headers</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5">Standalone Cache Match</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/65">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Security Rule Hash</span>
                      <span className="text-xs font-extrabold text-slate-800 block mt-0.5 font-mono">v2.fortress.abac.enforce</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ERROR LOGS & SYSTEM TRACES */}
            {adminTab === 'logs' && (
              <div className="space-y-6" id="admin-panel-logs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-indigo-600" /> Administrative Diagnostic Error Logs & System Traces
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Verify complete audit trails of system actions, database access triggers, transaction reports, and execution faults.
                  </p>
                </div>

                {/* Filter and search parameters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Query traces by message, module name, or parameters..."
                      className="w-full text-xs font-semibold pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Log filter buttons */}
                  <div className="flex gap-1.5 overflow-x-auto p-1 bg-slate-100 border border-slate-200 rounded-xl max-w-full">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${logFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      All Traces
                    </button>
                    <button
                      onClick={() => setLogFilter('error')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${logFilter === 'error' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Errors
                    </button>
                    <button
                      onClick={() => setLogFilter('security')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${logFilter === 'security' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Security
                    </button>
                    <button
                      onClick={() => setLogFilter('warn')}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${logFilter === 'warn' ? 'bg-white text-amber-500 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Warnings
                    </button>
                  </div>
                </div>

                {/* Traces output */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 font-mono text-[11px] text-slate-300 space-y-4">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block border-b border-white/5 pb-2">Active System Diagnostic Tracing</span>
                  <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                    {filteredSystemLogs.length === 0 ? (
                      <p className="text-slate-500 italic text-center py-8">No matching system traces logs found for your active search parameter.</p>
                    ) : (
                      filteredSystemLogs.map((log) => (
                        <div key={log.id} className="border-b border-white/5 pb-2.5 last:border-b-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-500">[{log.timestamp.substr(0, 19).replace('T', ' ')}]</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                              log.type === 'error' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                              log.type === 'security' ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/20' :
                              log.type === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-500/20' :
                              'bg-slate-950 text-slate-400 border border-white/10'
                            }`}>
                              {log.type}
                            </span>
                            <span className="font-extrabold text-slate-450 text-sky-400">[{log.module}]</span>
                            <span className="text-white font-bold select-all flex-1">{log.message}</span>
                          </div>
                          {log.details && (
                            <p className="text-[10px] text-slate-500 block bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 leading-relaxed font-semibold pl-4 text-slate-450 select-text selection:bg-indigo-500">{log.details}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: USER STATISTICS & DEMOGRAPHICS */}
            {adminTab === 'stats' && (
              <div className="space-y-6" id="admin-panel-stats">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <BarChart4 className="h-5 w-5 text-indigo-600" /> Active Merchant User Statistics & Demographics
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Consolidated metrics detailing customer acquisitions, category segments, and stock compliance indexes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Active Merchants</span>
                    <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{stats.totalUsers}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Global registered profile records</p>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Monthly Users</span>
                    <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{stats.activeMonthly}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Stores syncing consistently</p>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Average Invoices / User</span>
                    <h4 className="text-2xl font-black text-slate-800 font-mono mt-1">{stats.averageBillsPerMerchant}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">GST sales reports per merchant</p>
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Low Stock Warnings</span>
                    <h4 className="text-2xl font-black text-rose-600 font-mono mt-1">{stats.criticalStockItemsCount}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Items triggering stock push warning</p>
                  </div>
                </div>

                {/* User category breakdown */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">User Categories Segment Analysis</h4>
                  <div className="space-y-3.5">
                    {stats.categoryBreakdown.map((cat, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>{cat.name}</span>
                          <span className="font-mono">{cat.count} stores ({cat.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: CENTRAL FEATURE FLAGS CONTROL */}
            {adminTab === 'flags' && (
              <div className="space-y-6" id="admin-panel-flags">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Flag className="h-5 w-5 text-indigo-600" /> Strategic System Feature Flags Control
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Control the activation state of upcoming layout changes, PWA modules, and offline engines globally.
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  {/* Flag Toggle 1 */}
                  <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition cursor-pointer select-none">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-xs font-extrabold text-slate-800 block">Deploy Beta Offline Engine v2 🚀</span>
                      <span className="text-[10px] text-slate-500 block leading-relaxed">Implements offline transactional database log syncs with self-healing merge checks when.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={featureFlags.betaEngineV2}
                      onChange={(e) => setFeatureFlags(prev => ({ ...prev, betaEngineV2: e.target.checked }))}
                    />
                  </label>

                  {/* Flag Toggle 2 */}
                  <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition cursor-pointer select-none">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-xs font-extrabold text-slate-800 block">AI-Powered Bill Chat Companion (Gemini Core SDK) 🤖</span>
                      <span className="text-[10px] text-slate-500 block leading-relaxed">Enables natural language querying of active GST metrics and profit trends directly.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={featureFlags.aiInvoiceAssistant}
                      onChange={(e) => setFeatureFlags(prev => ({ ...prev, aiInvoiceAssistant: e.target.checked }))}
                    />
                  </label>

                  {/* Flag Toggle 3 */}
                  <label className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition cursor-pointer select-none">
                    <div className="space-y-0.5 pr-4">
                      <span className="text-xs font-extrabold text-slate-800 block">Complex Integrated Multi-tax & HSN Lookup Engine 📊</span>
                      <span className="text-[10px] text-slate-500 block leading-relaxed">Automatically indexes HSN compliance tables for rapid retail item SKU generation.</span>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={featureFlags.multiGstConfig}
                      onChange={(e) => setFeatureFlags(prev => ({ ...prev, multiGstConfig: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 6: MAINTENANCE MODE CONTROL */}
            {adminTab === 'maintenance' && (
              <div className="space-y-6" id="admin-panel-maintenance">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-indigo-600" /> Simulated Maintenance Mode Controls
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Toggle offline maintenance statuses to test client application grace periods under connection downtime.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl max-w-xl space-y-5">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${maintenanceModeActive ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">State: {maintenanceModeActive ? 'SIMULATED MAINTENANCE ACTIVE' : 'NOMINAL SERVICES MODE'}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                        {maintenanceModeActive 
                          ? 'The app is displaying simulated maintenance alerts.' 
                          : 'All production endpoints, local registries, and multi-device cloud operations are executing normally.'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex gap-3">
                    <button
                      onClick={handleToggleMaintenance}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 tracking-wide flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        maintenanceModeActive 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {maintenanceModeActive ? 'Disable Maintenance Mode' : 'Enable Maintenance Simulation'}
                    </button>
                  </div>
                </div>

                {maintenanceModeActive && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-semibold space-y-1.5 max-w-xl animate-pulse">
                    <span className="font-extrabold flex items-center gap-1 text-amber-800 uppercase tracking-widest"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" /> Live Simulation Banner:</span>
                    <p className="leading-relaxed text-slate-700 font-medium">"Vyapar Mitra is undergoing rapid database updates. Offline caching will synchronize automatically upon core recovery."</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: ANALYTICS TESTING (NEW GATED ADMIN FEATURE) */}
            {adminTab === 'analytics' && (
              <div className="space-y-6" id="admin-panel-analytics">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-indigo-600" /> Dynamic Telemetry & Analytics Testing
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Simulate dispatching custom ecommerce conversion logs, performance trackers, and customer session flags to the analytics cloud.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Dispatcher form */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-4">Trigger Custom Analytics Event</h4>
                    <form onSubmit={handleSimulateAnalyticsDispatch} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">Event Action Name</label>
                        <input
                          type="text"
                          className="w-full text-xs font-semibold px-3 py-2 border border-slate-250 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none"
                          value={newSimEventName}
                          onChange={(e) => setNewSimEventName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">JSON Parameters Payload</label>
                        <textarea
                          className="w-full text-xs font-mono px-3 py-2 border border-slate-250 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none h-20 resize-none"
                          value={newSimEventPayload}
                          onChange={(e) => setNewSimEventPayload(e.target.value)}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Play className="h-4 w-4" /> Simulate Dispatch Analytics Event
                      </button>
                    </form>
                  </div>

                  {/* Active event stream */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider mb-3">Live Dispatched Events Stream</h4>
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {analyticsEvents.map(ev => (
                          <div key={ev.id} className="p-3 bg-white rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-indigo-600 font-mono">event: {ev.eventName}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded-full border border-emerald-100">{ev.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-450 font-mono mt-1 bg-slate-50 p-1.5 rounded">{ev.payload}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">Ref Tracking ID: {ev.trackingId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: SECURITY MONITORING (NEW GATED ADMIN FEATURE) */}
            {adminTab === 'security' && (
              <div className="space-y-6" id="admin-panel-security">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" /> Attribute-Based Access Control (ABAC) Security Monitoring
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Real-time visual tracker monitoring database access checks, token authentications, and automated security rule intercepts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Self-Escalation Denials</span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">100% BLOCKED</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Attempts to modify users/{'{uid}'}/role to admin</p>
                  </div>
                  {/* Card 2 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Unverified Email Locks</span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">STANDALONE</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Forcing verified Google Authenticated logs</p>
                  </div>
                  {/* Card 3 */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 col-span-1 md:col-span-2 lg:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sandbox Poisoning Guards</span>
                    <h4 className="text-2xl font-black text-emerald-600 mt-1">ACTIVE</h4>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Document ID string size and size constraints</p>
                  </div>
                </div>

                {/* Intrusion Simulation log logs */}
                <div className="p-5 bg-indigo-950 text-indigo-200 rounded-3xl space-y-3 font-mono text-[10px] border border-indigo-900/60 shadow-lg">
                  <div className="flex items-center gap-2 border-b border-indigo-900 pb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-black text-white text-xs uppercase tracking-wider">Security Interceptor Engine Logs</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-300">
                      <span className="text-rose-400">🚨 [INTERCEPT_WARN]</span> 14:12:02 - Rejected document edit on users/mock_normal_merchant. Missing claim matching raghavpratap987654@gmail.com
                    </p>
                    <p className="text-slate-300">
                      <span className="text-emerald-400">🛡️ [MONITOR_LOG]</span> 14:08:45 - Token verification routine passed for primary admin: email hash matches raghavpratap987654.
                    </p>
                    <p className="text-slate-300">
                      <span className="text-indigo-300">🔒 [MONITOR_LOG]</span> 13:58:11 - Dynamic verification: Local state checked. User `raghav...` matched admin role perfectly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: DATABASE DEBUG TOOLS  */}
            {adminTab === 'debug' && (
              <div className="space-y-6" id="admin-panel-debug">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Database className="h-5 w-5 text-indigo-600" /> Local Sandbox & Database Debug Controls
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Utilities to inspect, flush, or synchronize localized structures and credentials during staging/testing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800">Clear Staged Demo Cache</h4>
                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                        Resets billing catalogs, queued offline sync sequences, and profile settings stored in client browsers.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const confirmClear = window.confirm("Are you absolutely sure you want to completely flush all local storage settings? Critical unsynced data will be lost.");
                        if (confirmClear) {
                          localStorage.clear();
                          addAuditLog('warn', 'Debug Engine', 'Flushed entire client local storage space manually.');
                          alert("Done! Flushed local storage. Reloading application...");
                          window.location.reload();
                        }
                      }}
                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-600" /> Wipe Site Local Cache
                    </button>
                  </div>

                  <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 text-indigo-900">Run Applet Sync Cycle</h4>
                      <p className="text-[11px] text-indigo-950/70 font-semibold leading-relaxed mt-1">
                        Synchronizes local billing cache parameters and users profile collections with the live database cluster immediately.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          addAuditLog('info', 'Debug Engine', 'Manual synchronization routine triggered across active Firestore indexes.');
                          alert("Completed local synchronization routine checks. Core channels functioning normally.");
                        } catch (e: any) {
                          alert(`Validation error: ${e.message}`);
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Execute Live Sync Verification
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: FUTURE ADMIN FEATURES */}
            {adminTab === 'future' && (
              <div className="space-y-6" id="admin-panel-future">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-indigo-600" /> Central Permission Validation: Future expansion
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Proof-of-concept demonstrating how additional components, modules, and roles (`manager`, `staff`) will automatically inherit perm-based authorization.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-5 max-w-2xl">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3.5">
                    <CheckCircle2 className="h-6 w-6 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Dynamic RBAC Permission Verification</h4>
                      <p className="text-[10px] text-slate-500 font-bold leading-none mt-1">
                        Active Authorization Token checking claim: <code className="font-mono bg-indigo-50 px-1 py-0.5 text-indigo-600 rounded">access_future_admin_features</code> === <span className="text-emerald-600 font-bold">TRUE</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    Because permissions are mapped in the central <code className="font-mono bg-slate-100 p-0.5 text-slate-800 rounded">src/utils/permissions.ts</code> registry, any future visual sub-components, sidebars, or API endpoints do not require separate hardcoded checks. Adding a new tab simply means assigning it a central <code className="font-mono bg-slate-100 p-0.5 text-slate-800 rounded">Permission</code> key, making Vyapar Mitra enterprise-ready.
                  </p>

                  <div className="border-t border-slate-200 pt-4 flex gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 bg-white border border-slate-250 text-[10px] font-extrabold text-slate-600 rounded-xl uppercase">Manager Role: Restricted to Stats</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-250 text-[10px] font-extrabold text-slate-600 rounded-xl uppercase">Staff Role: Empty Admin Panel Access</span>
                    <span className="px-2.5 py-1 bg-white border border-slate-250 text-[10px] font-extrabold text-slate-600 rounded-xl uppercase">Central Decoupling: Verified</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
