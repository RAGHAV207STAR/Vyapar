/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Receipt,
  Users,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  Grip,
  X,
  Wifi,
  WifiOff,
  CloudOff,
  CloudCheck,
  RefreshCw,
  Building2,
  Database,
  FileSpreadsheet,
  Package,
  TrendingUp,
  LayoutDashboard,
  FilePlus,
  ScrollText,
  PieChart,
  UserCircle,
  Bell,
  AlertCircle,
  Shield,
  Sparkles,
  Smartphone,
  HelpCircle,
  Search,
} from "lucide-react";

import { BillingProvider, useBilling } from "./context/BillingContext";
import { InventoryProvider } from "./context/InventoryContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";
import { NotificationProvider } from "./context/NotificationContext";
import { FinancialProvider } from "./context/FinancialContext";
import ShopSetupForm from "./components/ShopSetupForm";
import DashboardHome from "./components/DashboardHome";
import InvoiceTemplate from "./components/InvoiceTemplate";
import AccountRecoveryPage from "./components/AccountRecoveryPage";
import { Bill, CustomerDetails } from "./types";
import CustomerDirectory from "./components/CustomerDirectory";
import PublicPages from "./components/PublicPages";
import PublicInvoiceViewer from "./components/PublicInvoiceViewer";
import { useNotification } from "./context/NotificationContext";
import NotificationCenter from "./components/NotificationCenter";
import ConflictReconciliationModal from "./components/ConflictReconciliationModal";
import CommandMenu from "./components/CommandMenu";

// Lazy load secondary feature-heavy dashboard modules
import BillingSystem from "./components/BillingSystem";
import BillHistory from "./components/BillHistory";
import BillPaymentStatus from "./components/BillPaymentStatus";
import InventoryDashboard from "./components/InventoryDashboard";
import AIPurchaseOrderManager from "./components/AIPurchaseOrderManager";
import AIReplenishmentDashboard from "./components/AIReplenishmentDashboard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import FinancialCenter from "./components/FinancialCenter";
import HelpDesk from "./components/HelpDesk";
import NotificationsPage from "./components/NotificationsPage";
import ProfileSection from "./components/ProfileSection";
import SettingsSection from "./components/SettingsSection";
import AdminPanel from "./components/AdminPanel";
import appLogo from "./assets/images/app_logo_1780216474773.png";

// High-quality modern skeleton loader fallback for dynamic imports
const PageLoaderFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
    <div className="relative flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-indigo-100 animate-spin border-t-indigo-600" />
      <div className="absolute w-5 h-5 rounded-full bg-indigo-50/50 animate-pulse" />
    </div>
    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
      Loading workspace view...
    </p>
  </div>
);

function AppContent() {
  const {
    user,
    profile,
    isLoading,
    isOnline,
    isCloudConnected,
    syncPendingCount,
    logout,
    syncDataOfflineFirst,
    syncError,
    showToast,
    showConfirm,
  } = useBilling();

  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandMenuOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Install promotion event handler
  const [canInstall, setCanInstall] = useState(false);
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  const [installStatus, setInstallStatus] = useState<string>("");

  useEffect(() => {
    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const runInstallProcess = (onComplete: () => void) => {
    setInstallProgress(0);
    setInstallStatus("Initializing local offline core...");
    
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4; // increment by 4% to 11%
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setInstallProgress(100);
        setInstallStatus("Verifying app integrity... Launching installer!");
        setTimeout(() => {
          setInstallProgress(null);
          setInstallStatus("");
          onComplete();
        }, 800);
      } else {
        setInstallProgress(current);
        if (current < 20) {
          setInstallStatus("Downloading critical UI schemas...");
        } else if (current < 40) {
          setInstallStatus("Caching high-speed asset bundles...");
        } else if (current < 65) {
          setInstallStatus("Compiling indexed offline-first database tables...");
        } else if (current < 85) {
          setInstallStatus("Optimizing barcode camera recognition systems...");
        } else {
          setInstallStatus("Preparing real-time Firebase synchronization relays...");
        }
      }
    }, 120); // Takes ~2.5 seconds total
  };

  const handleSidebarInstall = async () => {
    if (installProgress !== null) return; // already running

    runInstallProcess(async () => {
      try {
        const promptEvent = (window as any).deferredInstallPrompt;
        if (promptEvent) {
          await promptEvent.prompt();
          const { outcome } = await promptEvent.userChoice;
          if (outcome === "accepted") {
            (window as any).deferredInstallPrompt = null;
            setCanInstall(false);
            showToast(
              "Smart Vyapar local client preparing database layers!",
              "success",
            );
          }
        } else {
          showConfirm({
            title: "App Installation Guide",
            message:
              "To install Smart Vyapar: Open the application in a new browser tab/window, then select 'Add to Home screen' or 'Install page as app' from your browser's menu. This works in Chrome, Edge, and Safari.",
            confirmText: "Understood",
            type: "info",
            onConfirm: () => {},
          });
        }
      } catch (e) {
        console.warn("PWA Prompt skipped or rejected", e);
        showConfirm({
          title: "App Installation",
          message:
            "Your browser might restrict direct installation. Please use your browser menu options (e.g., 'Add to Home Screen' or 'Install App') instead.",
          confirmText: "Okay",
          type: "info",
          onConfirm: () => {},
        });
      }
    });
  };

  const { requestPermission, permissionGranted } = useNotification();

  // Route & Navigation State initialization
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSidebarGuide, setShowSidebarGuide] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("vmitra_sidebar_guide");
  });
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<CustomerDetails | null>(null);
  const [billFormat, setBillFormat] = useState<"A4" | "A5" | "80mm" | "58mm">(
    "A4",
  );

  // Sync state with browser popstate buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    const handleNavigateEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        window.history.pushState(null, "", customEvent.detail);
        setCurrentPath(customEvent.detail);
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("navigate", handleNavigateEvent as EventListener);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(
        "navigate",
        handleNavigateEvent as EventListener,
      );
    };
  }, []);

  // Update activeTab based on pathname mapping (enables direct deep-linking on reload)
  useEffect(() => {
    if (user && profile) {
      const path = window.location.pathname;
      if (path === "/dashboard") setActiveTab("Dashboard");
      else if (path === "/create-invoice") setActiveTab("Create Bill");
      else if (path === "/invoices") setActiveTab("Bill History");
      else if (path === "/customers") setActiveTab("Customers");
      else if (path === "/payment-status") setActiveTab("Bill Payment Status");
      else if (path === "/inventory") setActiveTab("Inventory");
      else if (path === "/ai-replenishment") setActiveTab("AI Replenishment");
      else if (path === "/purchase-orders") setActiveTab("Purchase Orders");
      else if (path === "/analytics") setActiveTab("Analytics");
      else if (path === "/financial-center") setActiveTab("Financial Center");
      else if (path === "/help-desk") setActiveTab("Help Desk");
      else if (path === "/notifications") setActiveTab("Notifications");
      else if (path === "/profile") setActiveTab("Profile");
      else if (path === "/settings") setActiveTab("Settings");
      else if (path === "/admin") {
        if (profile.role === "admin") {
          setActiveTab("Admin Panel");
        } else {
          window.history.replaceState(null, "", "/dashboard");
          setCurrentPath("/dashboard");
          setActiveTab("Dashboard");
        }
      }
    }
  }, [user, profile, currentPath]);

  // Logged-in root transition redirect to dashboard
  useEffect(() => {
    if (
      user &&
      profile &&
      (window.location.pathname === "/" ||
        window.location.pathname === "" ||
        window.location.pathname === "/login" ||
        window.location.pathname === "/signup")
    ) {
      window.history.pushState(null, "", "/dashboard");
      setCurrentPath("/dashboard");
      setActiveTab("Dashboard");
    }
  }, [user, profile]);

  // Unified Google Analytics Pageview Tracking for Public pages and Workspace Tab changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      const pagePath = window.location.pathname;
      const pageTitle = user && profile ? `Workspace - ${activeTab}` : document.title;
      (window as any).gtag("config", "G-YVZN77SBD5", {
        page_path: pagePath,
        page_title: pageTitle,
        user_id: user?.uid || "anonymous",
      });
    }
  }, [currentPath, activeTab, user, profile]);

  // Custom unified tab/route mapping switcher
  const handleActiveTabChange = (tab: string) => {
    setActiveTab(tab);
    setPreviewBill(null);
    setMobileMenuOpen(false);
    if (tab !== "Create Bill") {
      setEditingBill(null);
      setPrefilledCustomer(null);
    }
    let targetPath = "/dashboard";
    switch (tab) {
      case "Dashboard":
        targetPath = "/dashboard";
        break;
      case "Create Bill":
        targetPath = "/create-invoice";
        break;
      case "Bill History":
        targetPath = "/invoices";
        break;
      case "Customers":
        targetPath = "/customers";
        break;
      case "Bill Payment Status":
        targetPath = "/payment-status";
        break;
      case "Inventory":
        targetPath = "/inventory";
        break;
      case "AI Replenishment":
        targetPath = "/ai-replenishment";
        break;
      case "Purchase Orders":
        targetPath = "/purchase-orders";
        break;
      case "Analytics":
        targetPath = "/analytics";
        break;
      case "Financial Center":
        targetPath = "/financial-center";
        break;
      case "Help Desk":
        targetPath = "/help-desk";
        break;
      case "Notifications":
        targetPath = "/notifications";
        break;
      case "Profile":
        targetPath = "/profile";
        break;
      case "Settings":
        targetPath = "/settings";
        break;
      case "Admin Panel":
        targetPath = "/admin";
        break;
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
      setCurrentPath(targetPath);
    }
  };

  // Dynamic GSC SEO Meta/Canonical Updater for indexers and social frames
  useEffect(() => {
    let title =
      "Smart Vyapar – Premium GST Billing, Real-Time Inventory & Business Management Suite";
    let desc =
      "Smart Vyapar is a state-of-the-art billing app and real-time stock books tracker. Easily create GST-compliant tax invoices, manage retail inventories across devices, view detailed profit analytics, and get instant digital payments with UPI QR codes.";

    // 1. Is this a public metadata landing page request?
    if (currentPath === "/" || currentPath === "") {
      title =
        "Smart Vyapar – Premium GST Billing, Real-Time Inventory & Business Management Suite";
      desc =
        "Smart Vyapar is a state-of-the-art billing app and real-time stock books tracker. Easily create GST-compliant tax invoices, manage retail inventories across devices, view detailed profit analytics, and get instant digital payments with UPI QR codes.";
    } else if (currentPath === "/features") {
      title = "Inventory Management & Operations | Smart Vyapar";
      desc =
        "Discover the complete suite of dual-mode online/offline bookkeeping, custom invoice layouts, and robust stocking utilities offered by Smart Vyapar.";
    } else if (currentPath === "/about") {
      title = "About Us – Empowering Shop Owners | Smart Vyapar";
      desc =
        "Understand the design philosophy, team guidelines, and secure client-side backup strategies making Smart Vyapar the preferred tool for smart local merchants.";
    } else if (currentPath === "/faq") {
      title = "Frequently Asked Questions & Support | Smart Vyapar";
      desc =
        "Find clear, descriptive answers regarding cloud sync safety, PWA install mechanics, GST calculations, thermal printer layouts, and offline modes in Smart Vyapar.";
    } else if (currentPath === "/contact") {
      title = "Support & Sales Inquiry Gateway | Smart Vyapar";
      desc =
        "Draft secure messages, connect with technical engineering leads, or request specialized merchant features from Smart Vyapar.";
    } else if (currentPath === "/privacy-policy") {
      title = "Data Security & Storage Compliance | Smart Vyapar";
      desc =
        "Read about our local cache isolation and SSL backup rules ensuring your accounting sheets remain strictly private.";
    } else if (currentPath === "/terms") {
      title = "User Policies & Service Conditions | Smart Vyapar";
      desc =
        "Review user agreements, data recovery disclaimers, and local-first compliance standard terms.";
    } else if (currentPath === "/billing-software") {
      title = "Accounting & Shop Invoicing billing-software | Smart Vyapar";
      desc =
        "Accelerate sales and print thermal receipt coupons with the finest local billing software built for retailers.";
    } else if (currentPath === "/inventory-management") {
      title = "Warehouse Stock Tracking & Audits | Smart Vyapar";
      desc =
        "Track purchase prices, set minimum reorder levels, and audit item warehouse statuses in real-time.";
    } else if (currentPath === "/invoice-generator") {
      title = "Digital Tax & Custom Invoice Generator | Smart Vyapar";
      desc =
        "Customize layout formats, bind Google logos, and set tax levels cleanly with our automated invoice generator.";
    } else if (currentPath === "/business-analytics") {
      title = "Revenue Analytics & Sales Insights | Smart Vyapar";
      desc =
        "Review monthly profits, collect net GST outputs, and trace transaction loops with visual Recharts metrics.";
    } else if (currentPath === "/login") {
      title = "Secure Member Log In | Smart Vyapar Support";
      desc =
        "Log in to your Smart Vyapar merchant cloud profile to sync invoices, review store catalog assets, and manage daily bookkeeping records.";
    } else if (currentPath === "/signup") {
      title = "Register Store Account Portal | Smart Vyapar";
      desc =
        "Create a secure merchant workspace record in seconds. Activate dynamic offline-first templates, automatic stock deduction, and real-time ledger back-ups.";
    } else if (currentPath === "/blog") {
      title = "Small Business Billing Guide & Blog | Smart Vyapar";
      desc =
        "Discover deep operational guide posts, inventory cycle count checklists, and billing speed optimization formulas written by retail experts.";
    } else if (currentPath === "/updates") {
      title = "Product Changelog & Updates | Smart Vyapar";
      desc =
        "Track our roadmap, latest features, performance improvements, and local thermal printer optimization updates in real-time.";
    } else if (currentPath === "/gst-support") {
      title = "GST Support, Invoicing Compliance & Calculator | Smart Vyapar";
      desc =
        "Learn CGST, SGST, IGST rules, composition vs regular schemes, and use our interactive real-time tax calculator to audit your billing.";
    } else if (currentPath.startsWith("/blog/")) {
      const slug = currentPath.substring(6);
      if (slug === "how-to-manage-inventory") {
        title =
          "How to Manage Inventory for Growing Retail Shops | Smart Vyapar";
        desc =
          "Discover the ultimate safety reorder buffer rates and inventory optimization formula to maximize store cash savings.";
      } else if (slug === "how-to-create-professional-invoices") {
        title = "How to Create Professional Invoices & Receipts | Smart Vyapar";
        desc =
          "Synthesize billing receipts with custom brand logos, sequential numbers, compliant GST levels, and scan-to-pay QR graphics.";
      } else if (slug === "small-business-billing-guide") {
        title = "Compliance and Billing Speed Guide | Smart Vyapar";
        desc =
          "Learn step-by-step compliant accounting configurations and digital receipt rules to safeguard cash registers.";
      } else if (slug === "inventory-tracking-tips") {
        title = "Top 5 Local Store Inventory Tracking Tips | Smart Vyapar";
        desc =
          "Deploy FIFO warehouse logistics, cycle counts, and item groups to speed up checkouts and shrink cash leakage.";
      } else if (slug === "retail-business-management") {
        title = "Neighborhood Retail Cloud Management Future | Smart Vyapar";
        desc =
          "Scale local boutique and grocery businesses by backing up accounting ledgers to encrypted Cloud vaults.";
      } else {
        title = "Merchant Blog Article | Smart Vyapar Software";
        desc =
          "Read our informative resources, design templates, and compliance guidelines for business managers.";
      }
    }
    // 2. Or is it a workspace deep-link metadata request?
    else if (user && profile) {
      if (previewBill) {
        title = `Invoice #${previewBill.invoiceNumber || previewBill.billId} Detail | Smart Vyapar`;
        desc = `Detailed view of invoice number ${previewBill.invoiceNumber || previewBill.billId} generated for ${previewBill.customerDetails?.name || "Customer"} inside Smart Vyapar Workspace database.`;
      } else {
        switch (activeTab) {
          case "Dashboard":
            title = "Smart Vyapar Dashboard";
            desc =
              "Merchant Home: Complete shop overview, real-time summaries, sales trend records, and critical stock level indicators.";
            break;
          case "Create Bill":
            title = "Invoice Generator | Smart Vyapar";
            desc =
              "Create and print beautiful customized professional tax receipts with UPI QR codes in under 3 seconds.";
            break;
          case "Bill History":
            title = "Invoice History & Archives | Smart Vyapar";
            desc =
              "Browse historical transaction collections, trace outstanding credit dues, and manage client bills.";
            break;
          case "Bill Payment Status":
            title = "Bill Payment & UPI Status Tracker | Smart Vyapar";
            desc =
              "Review active UPI payment transactions, trace GPay, PhonePe, and Paytm statuses, and reconcile pending credits in your digital khata ledger.";
            break;
          case "Inventory":
            title = "Inventory Management | Smart Vyapar";
            desc =
              "Track retail catalog entries, optimize reorder thresholds, and manage live stock levels.";
            break;
          case "AI Replenishment":
            title = "AI Inventory Replenishment & Stock Predictor | Smart Vyapar";
            desc =
              "Leverage high-precision demand forecasting algorithms to track daily velocity and generate smart safety stock buffer reorder triggers.";
            break;
          case "Purchase Orders":
            title = "Purchase Order Generator & Supplier Workspaces | Smart Vyapar";
            desc =
              "Generate professional purchase orders, coordinate directly with wholesale suppliers, and log incoming stock invoices with barcode integrations.";
            break;
          case "Analytics":
            title = "Business Analytics | Smart Vyapar";
            desc =
              "Visualize weekly profit margins, revenue charts, tax collection metrics, and top-volume lines.";
            break;
          case "Financial Center":
            title = "Financial Center & Cash ledger Registers | Smart Vyapar";
            desc =
              "Manage Cash Inflow, log outbound rental/operational expenses, review net income sheets, and monitor detailed GST balances dynamically.";
            break;
          case "Help Desk":
            title = "Customer Support Portal & Help Desk | Smart Vyapar";
            desc =
              "Contact Smart Vyapar engineering, access step-by-step billing hardware guides, and clear local storage synchronization conflicts.";
            break;
          case "Notifications":
            title = "Alert System & System Logs | Smart Vyapar";
            desc =
              "Track real-time stock shortages, low inventory ledger alerts, customer billing notifications, and data synchronizer events.";
            break;
          case "Profile":
            title = "Business Settings – Setup Profile | Smart Vyapar";
            desc =
              "Update brand logos, phone numbers, UPI handles, backup codes, and regional retail addresses.";
            break;
          case "Settings":
            title = "Business Settings | Smart Vyapar";
            desc =
              "Tweak system settings, margin spacing, active printer sizes, data erasure options, and offline sync switches.";
            break;
          case "Admin Panel":
            title = "System Admin Console | Smart Vyapar";
            desc =
              "Manage multi-store profiles, check system health analytics, edit master catalog tax lines, and adjust general system parameters.";
            break;
        }
      }
    }

    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", desc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", desc);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl)
      ogUrl.setAttribute(
         "content",
        `https://smartvyapar.vercel.app${currentPath}`,
      );

    const twTitle = document.querySelector('meta[property="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", title);

    const twDesc = document.querySelector(
      'meta[property="twitter:description"]',
    );
    if (twDesc) twDesc.setAttribute("content", desc);

    const twUrl = document.querySelector('meta[property="twitter:url"]');
    if (twUrl)
      twUrl.setAttribute(
         "content",
        `https://smartvyapar.vercel.app${currentPath}`,
      );

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute(
      "href",
      `https://smartvyapar.vercel.app${currentPath}`,
    );
  }, [currentPath, activeTab, previewBill, user, profile]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileMenuOpen]);

  // Quick Sync handler feedback
  const [isSyncing, setIsSyncing] = useState(false);
  const handleToolbarSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await syncDataOfflineFirst();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const [showSplash, setShowSplash] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Ensure minimal splash screen duration of 150ms for visual branding and smooth layout transition
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Transition away from the splash screen as soon as the initial loading is done and min duration has elapsed
  React.useEffect(() => {
    if (minTimeElapsed && !isLoading) {
      setShowSplash(false);
      setHasCheckedAuth(true);
    }
  }, [minTimeElapsed, isLoading]);

  if (showSplash) {
    return (
      <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center font-sans relative overflow-hidden select-none">
        {/* Geometric shapes glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="text-center space-y-6 z-10 max-w-sm px-4">
          {/* Glowing Receipt Icon Logo inside bounded round box */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.15, 1], opacity: 1 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
            className="mx-auto h-20 w-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-blue-500/30 border border-blue-400/20 p-2"
          >
            <img
              src="/android-chrome-192x192.png"
              alt="Smart Vyapar Logo"
              className="h-full w-full object-contain animate-pulse rounded-xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-2">
            {/* Elegant tracking-widest Display Text name */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65 }}
              className="text-3xl md:text-4xl font-black text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-amber-300 bg-clip-text tracking-widest uppercase font-sans filter drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            >
              Smart Vyapar
            </motion.h1>

            {/* Elegant minimal subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-[11px] font-mono font-extrabold text-blue-400 tracking-widest uppercase"
            >
              SIMPLICITY IN BUSINESS, POWER IN BILLING
            </motion.p>
          </div>

          {/* Minimal modern progress bar animation */}
          <div className="relative w-48 h-1 mx-auto bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
            />
          </div>

          {/* Subtle legal metadata */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.9 }}
            className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest pt-4"
          >
            Global Merchant Platform v1.0.0 Stable
          </motion.p>
        </div>
      </div>
    );
  }

  // Public Shared PDF view interception
  if (currentPath.startsWith("/view-pdf/")) {
    const pdfId = currentPath.replace("/view-pdf/", "");
    return (
      <>
        <PublicInvoiceViewer pdfId={pdfId} />
        <ToastContainer />
        <ConfirmModal />
      </>
    );
  }

  // Only show the full screen loading screen on initial boot or when an authenticated user is fetching profiles/bills
  if (!hasCheckedAuth || (isLoading && user)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"
        />
        <p className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
          Loading Smart Vyapar Workspace...
        </p>
      </div>
    );
  }

  // PUBLIC ROUTE GATEWAY: Intercept and render public marketing paths before auth checkpoints
  const isPublicRoute =
    ([
      "/",
      "/features",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms",
      "/billing-software",
      "/inventory-management",
      "/invoice-generator",
      "/business-analytics",
      "/faq",
      "/blog",
      "/login",
      "/signup",
      "/updates",
      "/gst-support",
    ].includes(currentPath) ||
      currentPath.startsWith("/blog/")) &&
    !(user && !profile);

  if (isPublicRoute) {
    return (
      <>
        <PublicPages
          currentPath={currentPath}
          onNavigate={(path) => {
            setCurrentPath(path);
            if (user && profile) {
              if (path === "/dashboard") setActiveTab("Dashboard");
              else if (path === "/create-invoice") setActiveTab("Create Bill");
              else if (path === "/invoices") setActiveTab("Bill History");
              else if (path === "/customers") setActiveTab("Customers");
              else if (path === "/payment-status")
                setActiveTab("Bill Payment Status");
              else if (path === "/inventory") setActiveTab("Inventory");
              else if (path === "/ai-replenishment")
                setActiveTab("AI Replenishment");
              else if (path === "/analytics") setActiveTab("Analytics");
              else if (path === "/notifications") setActiveTab("Notifications");
              else if (path === "/profile") setActiveTab("Profile");
              else if (path === "/settings") setActiveTab("Settings");
            }
          }}
          isLoggedIn={!!user}
          onAuthTrigger={() => {
            window.history.pushState(null, "", "/");
            setCurrentPath("/");
          }}
        />
        <ToastContainer />
        <ConfirmModal />
      </>
    );
  }

  // 1. Unified authentication & profile setup landing gate
  if (!user) {
    const publicPaths = [
      "/",
      "/features",
      "/about",
      "/contact",
      "/privacy-policy",
      "/terms",
      "/billing-software",
      "/inventory-management",
      "/invoice-generator",
      "/business-analytics",
      "/faq",
      "/blog",
      "/login",
      "/signup",
    ];
    const isKnownPublicPath =
      publicPaths.includes(currentPath) || currentPath.startsWith("/blog/");
    const displayPath = isKnownPublicPath ? currentPath : "/login";

    return (
      <>
        <PublicPages
          currentPath={displayPath}
          onNavigate={(path) => {
            window.history.pushState(null, "", path);
            setCurrentPath(path);
          }}
          isLoggedIn={false}
          onAuthTrigger={() => {
            window.history.pushState(null, "", "/");
            setCurrentPath("/");
          }}
        />
        <ToastContainer />
        <ConfirmModal />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <ShopSetupForm />
        <ToastContainer />
        <ConfirmModal />
      </>
    );
  }

  // 2. Soft-delete recovery gate
  if (profile.status === "deleted") {
    return (
      <>
        <AccountRecoveryPage />
        <ToastContainer />
        <ConfirmModal />
      </>
    );
  }

  // Sidebar Sections Config
  const sidebarSections = [
    {
      title: "Workspace & Core",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, emoji: "📊" },
        { name: "Create Bill", icon: FilePlus, emoji: "🧾" },
        { name: "Bill History", icon: ScrollText, emoji: "📜" },
      ],
    },
    {
      title: "Finance & Accounts",
      items: [
        { name: "Customers", icon: Users, emoji: "👥" },
        { name: "Bill Payment Status", icon: Receipt, emoji: "💳" },
        { name: "Financial Center", icon: TrendingUp, emoji: "💰" },
        { name: "Analytics", icon: PieChart, emoji: "📈" },
      ],
    },
    {
      title: "Operations & Tools",
      items: [
        { name: "Inventory", icon: Package, emoji: "📦" },
        { name: "AI Replenishment", icon: Sparkles, emoji: "🤖" },
        { name: "Purchase Orders", icon: Receipt, emoji: "📑" },
      ],
    },
    {
      title: "System & Profile",
      items: [
        { name: "Profile", icon: UserCircle, emoji: "👤" },
        { name: "Settings", icon: SettingsIcon, emoji: "⚙️" },
        { name: "Help Desk", icon: HelpCircle, emoji: "💬" },
        ...(profile.role === "admin"
          ? [{ name: "Admin Panel", icon: Shield, emoji: "👑" }]
          : []),
      ],
    },
  ];

  const activeTabIcon =
    sidebarSections
      .flatMap((s) => s.items)
      .find((tab) => tab.name === activeTab)?.icon || FileSpreadsheet;
  const renderTabContent = () => {
    if (previewBill) {
      return (
        <InvoiceTemplate
          bill={previewBill}
          onBack={() => setPreviewBill(null)}
          billFormat={billFormat}
          setBillFormat={setBillFormat}
          onEdit={() => {
            setEditingBill(previewBill);
            setPreviewBill(null);
            handleActiveTabChange("Create Bill");
          }}
        />
      );
    }

    switch (activeTab) {
      case "Dashboard":
        return (
          <DashboardHome
            onNavigate={(tab) => handleActiveTabChange(tab)}
            onViewBill={(bill) => setPreviewBill(bill)}
          />
        );
      case "Create Bill":
        return (
          <BillingSystem
            onBillGenerated={(bill) => {
              setPreviewBill(bill);
              setEditingBill(null);
              setPrefilledCustomer(null);
            }}
            initialBillToEdit={editingBill}
            initialCustomerDetails={prefilledCustomer}
            onCancelEdit={() => {
              setEditingBill(null);
              setPrefilledCustomer(null);
              handleActiveTabChange("Bill History");
            }}
            billFormat={billFormat}
            setBillFormat={setBillFormat}
          />
        );
      case "Customers":
        return (
          <CustomerDirectory
            onCreateInvoice={(customer) => {
              setEditingBill(null);
              setPrefilledCustomer(customer);
              handleActiveTabChange("Create Bill");
            }}
          />
        );
      case "Bill History":
        return (
          <BillHistory
            onViewBill={(bill) => setPreviewBill(bill)}
            onEditBill={(bill) => {
              setEditingBill(bill);
              handleActiveTabChange("Create Bill");
            }}
          />
        );
      case "Bill Payment Status":
        return (
          <BillPaymentStatus
            onViewBill={(bill) => setPreviewBill(bill)}
            onNavigate={(tab) => handleActiveTabChange(tab)}
          />
        );
      case "Inventory":
        return <InventoryDashboard />;
      case "AI Replenishment":
        return <AIReplenishmentDashboard />;
      case "Purchase Orders":
        return <AIPurchaseOrderManager />;
      case "Analytics":
        return <AnalyticsDashboard />;
      case "Financial Center":
        return <FinancialCenter />;
      case "Help Desk":
        return <HelpDesk />;
      case "Notifications":
        return <NotificationsPage />;
      case "Profile":
        return <ProfileSection />;
      case "Settings":
        return <SettingsSection />;
      case "Admin Panel":
        return profile.role === "admin" ? (
          <AdminPanel />
        ) : (
          <div className="text-slate-800">Access Denied</div>
        );
      default:
        return <div className="text-white">Workspace View Coming Soon</div>;
    }
  };

  return (
    <div className="flex h-screen w-full text-slate-800 overflow-hidden" style={{ backgroundColor: "#f8fafc", backgroundImage: "radial-gradient(#e2e8f0 1.5px, transparent 1.5px)", backgroundSize: "24px 24px", backgroundPosition: "0 0" }}>
      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[40] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[50] lg:static
        w-72 ${isSidebarCollapsed ? "lg:w-20" : "lg:w-64"} bg-[#fbfbfa] border-r border-slate-200/60 flex flex-col shrink-0 h-full shadow-2xl lg:shadow-none overflow-x-hidden overflow-y-auto
        transition-[width,transform] duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Top Branding Panel */}
        <div className="pt-5 pb-4 relative z-10 flex flex-col flex-1">
          <div
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setIsSidebarCollapsed(!isSidebarCollapsed);
                if (showSidebarGuide) {
                  localStorage.setItem("vmitra_sidebar_guide", "true");
                  setShowSidebarGuide(false);
                }
              }
            }}
            className={`px-5 mb-6 flex items-center ${isSidebarCollapsed ? "justify-center space-x-0 px-0" : "space-x-3"} select-none relative group cursor-pointer lg:hover:opacity-90 transition-opacity`}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-200/80 bg-white shadow-sm flex items-center justify-center p-0.5 shrink-0 relative">
              <img
                src="/favicon-32x32.png"
                alt="Smart Vyapar Logo"
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
              {/* Tooltip guide for first time users on large screen */}
              <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 peer-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                Click to {isSidebarCollapsed ? "expand" : "collapse"}
                <div className="absolute top-1/2 right-full -translate-y-1/2 -mt-[5px] border-r-[6px] border-r-blue-600 border-y-[5px] border-y-transparent"></div>
              </div>
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden flex-1 relative">
                <span className="text-[15px] font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight leading-none block truncate">
                  Smart Vyapar
                </span>
              </div>
            )}

            {/* Guide Badge */}
            {!isSidebarCollapsed && showSidebarGuide && (
              <div className="hidden lg:flex absolute -bottom-6 left-5 text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 items-center animate-pulse whitespace-nowrap pointer-events-none shadow-sm">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Click logo to collapse
              </div>
            )}
          </div>

          {/* Current Shop Profile Card */}
          <div
            onClick={() => handleActiveTabChange("Profile")}
            className={`mx-3 mb-6 p-2 bg-gradient-to-b from-white to-slate-50 border border-slate-200 shadow-sm rounded-[1.25rem] flex items-center ${isSidebarCollapsed ? "justify-center" : "space-x-3"} hover:border-indigo-200 hover:shadow-md transition-all duration-300 cursor-pointer group`}
          >
            <div className="h-10 w-10 bg-white rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 group-hover:scale-105 transition-transform duration-300">
              {profile.logo ? (
                <img
                  src={profile.logo}
                  alt="Shop avatar"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src={appLogo}
                  alt="Smart Vyapar Default"
                  className="h-full w-full object-cover p-0"
                />
              )}
            </div>
            {!isSidebarCollapsed && (
              <>
                <div className="truncate text-left flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-800 leading-tight truncate group-hover:text-indigo-700 transition-colors">
                    {profile.shopName || "Setup Profile"}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 truncate capitalize tracking-wide">
                    {profile.category || "Business Setup"}
                  </p>
                </div>
                <div className="pr-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </>
            )}
          </div>

          {/* Navigation link tags */}
          <nav className="px-3 space-y-5 text-left flex-1 mt-4">
            {sidebarSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <div className="px-2 mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                      {section.title}
                    </span>
                  </div>
                )}
                {section.items.map((tab) => {
                  const isActive = activeTab === tab.name && !previewBill;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => handleActiveTabChange(tab.name)}
                      title={isSidebarCollapsed ? tab.name : undefined}
                      className={`
                        w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "space-x-3 px-3"} py-2 rounded-xl text-[13px] sm:text-sm transition-all duration-300 cursor-pointer border relative overflow-hidden group outline-none focus:ring-2 focus:ring-indigo-500/50
                        ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-50/80 to-transparent text-indigo-700 border-indigo-100 font-black shadow-[inset_2px_0_0_0_rgb(79,70,229)]"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold border-transparent hover:border-slate-200/50"
                        }
                      `}
                    >
                      <div
                        className={`
                        w-8 h-8 flex items-center justify-center text-lg sm:text-xl transition-all duration-300 relative z-10 select-none filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)] shrink-0
                        ${isActive ? "scale-110 rotate-2" : "group-hover:scale-115 group-hover:rotate-6"}
                      `}
                      >
                        {tab.emoji}
                      </div>
                      {!isSidebarCollapsed && (
                        <span className="relative z-10 truncate whitespace-nowrap">
                          {tab.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar details / Logout trigger */}
        <div className="p-4 border-t border-slate-200/60 relative z-10 bg-[#fbfbfa] space-y-2 flex flex-col items-center">
          {/* App Download and Install Button */}
          <button
            onClick={handleSidebarInstall}
            title={isSidebarCollapsed ? "Install App" : undefined}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "space-x-2.5 px-3"} py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[13px] font-black cursor-pointer shadow-sm hover:shadow-md transition active:translate-y-0.5 select-none`}
          >
            <span className="text-lg filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] shrink-0 select-none">
              📲
            </span>
            {!isSidebarCollapsed && <span>Install App</span>}
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.history.pushState(null, "", "/");
              setCurrentPath("/");
              logout();
            }}
            title={isSidebarCollapsed ? "Log out" : undefined}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-0" : "space-x-2.5 px-3"} py-2 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors`}
          >
            <span className="text-lg filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)] shrink-0 select-none">
              🚪
            </span>
            {!isSidebarCollapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50 relative">
        {/* Push Notifications Prompt Banner */}
        {permissionGranted === null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 flex items-center justify-between z-40 relative shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🔔</span>
              <p className="text-xs sm:text-sm font-semibold tracking-wide">
                Enable push notifications to receive real-time low stock alerts & billing updates across devices.
              </p>
            </div>
            <button
              onClick={() => requestPermission()}
              className="bg-white/20 hover:bg-white/30 transition-colors text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer shadow-sm"
            >
              Enable Now
            </button>
          </motion.div>
        )}

        {/* MOBILE HEADER TOOLBAR */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shrink-0 w-full z-30 shadow-sm relative">
          {/* Subtle premium dot grid background matching page */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

          <div className="flex items-center space-x-2.5 relative z-10 select-none">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-blue-500/10">
              <img
                src="/favicon-32x32.png"
                alt="Smart Vyapar Logo"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-widest uppercase">
                Smart Vyapar
              </span>
              <p className="text-[9px] font-mono text-blue-600 font-extrabold tracking-widest leading-none">
                OS CONSOLE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 relative z-10 scroll-none">
            <NotificationCenter
              onNavigate={() => handleActiveTabChange("Notifications")}
            />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 shadow-[0_4px_14px_0_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none hover:from-indigo-400 hover:to-purple-500 rounded-xl border border-indigo-400/30 text-white transition-all cursor-pointer relative z-40 outline-none focus:ring-4 focus:ring-indigo-500/30 flex items-center justify-center transform group"
              aria-label="Toggle Navigation Menu"
            >
              <div className="grid grid-cols-3 gap-0.5 relative z-10 transition-transform duration-300 group-hover:rotate-90">
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-75"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-75"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-150"></span>
                <span className="w-1.5 h-1.5 rounded-sm bg-white group-hover:scale-110 transition-transform delay-200"></span>
              </div>
              <div className="absolute inset-0 bg-white/20 rounded-xl rounded-b-none h-1/2 opacity-30 pointer-events-none mix-blend-overlay" />
            </button>
          </div>
        </div>

        {/* MAIN GLOBAL DASHBOARD TOP STATUS PANEL TOOLBAR */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shrink-0 select-none h-20 shadow-sm z-10 relative">
          {/* Subtle premium dot grid background matching page */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-45 pointer-events-none" />

          {/* Active indicator name */}
          <div className="flex items-center relative z-10 gap-4">
            <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 bg-clip-text text-transparent tracking-tight">
              {previewBill ? "Invoice Builder Preview" : activeTab}
            </h1>
          </div>

          {/* Shop Logo Header - Navigates to Profile on Click */}
          <div className="flex items-center gap-3 relative z-10">
            {syncError ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-black shadow-sm select-none"
                title={syncError}
              >
                <CloudOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="hidden sm:inline">Sync Error</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    syncDataOfflineFirst();
                  }}
                  className="ml-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 p-1 rounded-lg cursor-pointer transition flex items-center justify-center outline-none"
                  title="Retry sync queue"
                >
                  <RefreshCw className="w-3 h-3 text-rose-700" />
                </button>
              </motion.div>
            ) : syncPendingCount > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[11px] font-black shadow-xs select-none"
                title={`${syncPendingCount} operations pending cloud update`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                <span className="hidden sm:inline-block">
                  {syncPendingCount} Sync Pending
                </span>
              </motion.div>
            ) : null}

            <NotificationCenter
              onNavigate={() => handleActiveTabChange("Notifications")}
            />
            <button
              id="header-shop-profile-btn"
              onClick={() => handleActiveTabChange("Profile")}
              className="flex items-center justify-center p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl cursor-pointer transition-all duration-300 shadow-xs hover:shadow-sm select-none group focus:outline-none ring-offset-2 focus:ring-2 focus:ring-blue-500"
              title="View & Edit Shop Profile"
            >
              <div className="h-9 w-9 bg-white rounded-[10px] overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform duration-300">
                {profile.logo ? (
                  <img
                    src={profile.logo}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src={appLogo}
                    alt="Default Profile"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </button>
          </div>
        </header>

        {/* WORKSPACE APP PANELS WRAPPER VIEWPORTS */}
        <section className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50 w-full relative">
          <div className="w-full pb-10">{renderTabContent()}</div>
        </section>
      </main>

      {/* Global Toast Notification and custom Confirm modal overrides */}
      <ToastContainer />
      <ConfirmModal />
      <ConflictReconciliationModal />
      <CommandMenu
        isOpen={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
        onNavigate={handleActiveTabChange}
      />

      {/* Premium Install Progress Overlay/Modal */}
      {installProgress !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_50px_100px_rgba(0,0,0,0.3)] max-w-md w-full text-center space-y-6 overflow-hidden relative"
          >
            {/* Elegant Background Accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
              <span className="text-4xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] animate-bounce">📲</span>
              <div className="absolute -inset-1 border-2 border-indigo-500/30 rounded-3xl animate-ping opacity-25" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Downloading Smart Vyapar App
              </h3>
              <p className="text-xs font-bold text-slate-500 max-w-xs mx-auto">
                Setting up lightning-fast local cache modules & offline databases for a zero-latency merchant experience.
              </p>
            </div>

            {/* Percentage Bar */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold px-1">
                <span className="text-blue-600 transition-colors duration-200">{installStatus}</span>
                <span className="text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded-md">{installProgress}%</span>
              </div>
              <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${installProgress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.15 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-inner"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase animate-pulse">
              Please do not close this window
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ToastContainer() {
  const { toasts, dismissToast } = useBilling();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-[340px] w-full pointer-events-none px-4 select-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let icon = <div className="h-2 w-2 rounded-full bg-blue-400" />;
          let iconBg = "bg-blue-500/10 border-blue-500/20";
          let label = "System Notification";

          if (toast.type === "success") {
            icon = (
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            );
            iconBg = "bg-emerald-500/10 border-emerald-500/20";
            label = "Action Successful";
          } else if (toast.type === "error") {
            icon = (
              <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
            );
            iconBg = "bg-rose-500/10 border-rose-500/20";
            label = "System Error";
          } else if (toast.type === "warning") {
            icon = <div className="h-2 w-2 rounded-full bg-amber-400" />;
            iconBg = "bg-amber-500/10 border-amber-500/20";
            label = "Notice";
          }

          return (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className="flex items-start gap-3 p-3.5 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl shadow-black/40 pointer-events-auto group relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

              <div
                className={`mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center border ${iconBg}`}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <span className="text-[9px] uppercase tracking-widest font-black text-white/50 block">
                  {label}
                </span>
                <p className="text-[13px] font-semibold text-white/95 leading-snug break-words pr-2">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="mt-1 shrink-0 text-white/30 hover:text-white/80 transition-colors rounded-full hover:bg-white/10 p-1"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ConfirmModal() {
  const { confirmDialog, closeConfirm } = useBilling();

  if (!confirmDialog) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-left"
      >
        <div className="space-y-2">
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            {confirmDialog.type === "danger" && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}
            {confirmDialog.title}
          </h3>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            {confirmDialog.message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={() => {
              if (confirmDialog.onCancel) {
                try {
                  confirmDialog.onCancel();
                } catch (e) {
                  console.error("Error in confirmation cancel handler:", e);
                }
              }
              closeConfirm();
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            {confirmDialog.cancelText || "Cancel"}
          </button>

          <button
            onClick={async () => {
              const onConfirmHandler = confirmDialog.onConfirm;
              // Close the confirm dialog immediately
              closeConfirm();
              if (onConfirmHandler) {
                try {
                  await onConfirmHandler();
                } catch (e) {
                  console.error("Error in confirmation save/delete action:", e);
                }
              }
            }}
            className={`px-5 py-2.5 font-bold text-xs rounded-xl text-white shadow-md transition cursor-pointer ${
              confirmDialog.type === "danger"
                ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            {confirmDialog.confirmText || "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center space-y-4 border border-rose-100">
            <div className="mx-auto bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-black text-slate-800">
              Workspace Encountered an Error
            </h1>
            <p className="text-sm text-slate-500 font-semibold mb-6 break-words bg-slate-50 p-4 rounded-xl border border-slate-100">
              {this.state.error?.message ||
                "An unexpected technical error occurred in this view."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md hover:bg-slate-800 cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <BillingProvider>
        <InventoryProvider>
          <AnalyticsProvider>
            <NotificationProvider>
              <FinancialProvider>
                <AppContent />
              </FinancialProvider>
            </NotificationProvider>
          </AnalyticsProvider>
        </InventoryProvider>
      </BillingProvider>
    </GlobalErrorBoundary>
  );
}
