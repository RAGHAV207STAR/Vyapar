import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Receipt, 
  Users, 
  Settings as SettingsIcon,
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Package, 
  TrendingUp,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lock,
  User,
  AlertCircle,
  Database,
  Check,
  Star,
  Activity,
  Award,
  Wallet,
  Smartphone,
  Server,
  CloudLightning,
  LayoutDashboard,
  BarChart3,
  Loader2,
  Search,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import dashboardMockup from '../assets/images/dashboard_mockup_v2_1782398903805.jpg';
import analyticsMockup from '../assets/images/analytics_mockup_v2_1782398953187.jpg';
import inventoryMockup from '../assets/images/inventory_mockup_v2_1782398937956.jpg';
import billingMockup from '../assets/images/billing_mockup_v2_1782398920772.jpg';
import aiBoyAvatar from '../assets/images/ai_boy_avatar_1780470481408.png';

interface PublicPagesProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isLoggedIn: boolean;
  onAuthTrigger?: () => void;
}

// Compact and high-value SEO Articles data
const BLOG_POSTS = [
  {
    slug: 'how-to-manage-inventory',
    title: 'How to Manage Inventory for Growing Retail Shops',
    excerpt: 'Discover the ultimate guidelines and reorder safety rules to keep your shelves stocked without overcommitting your storage cash.',
    date: 'June 1, 2026',
    readTime: '5 min read',
    category: 'Inventory Tracking',
    content: `
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">1. The Core Principles of Stock Optimization</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Effective retail management hinges on keeping your warehouse volumes synchronized with customer demand curves. Too much stock traps your cash flow, while too little stock leads to lost sales.</p>
      
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">2. Setting Reorder Safety Thresholds</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Define clear minimum levels for every catalog group. A standard reorder point formula is: <br/><strong class="font-bold text-slate-800">Reorder Point (ROP) = (Average Daily Sales × Lead Time) + Safety Stock</strong>.</p>
      
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">3. Leveraging Real-Time Records</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Smart Vyapar automatically deducts items on checkout billing, visible instantly across multiple devices.</p>
    `
  },
  {
    slug: 'how-to-create-professional-invoices',
    title: 'How to Create Professional Invoices to Elevate Your Brand',
    excerpt: 'Learn how customized tax invoices, clear payment terms, and interactive payment QR codes accelerate billing collections.',
    date: 'May 28, 2025',
    readTime: '4 min read',
    category: 'Business Billing',
    content: `
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">1. The Anatomy of a High-Converting Tax Receipt</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Your invoice is a crucial brand touchpoint. A professional invoice must include high-contrast design layouts, clearly labeled GST tax bands, and sequential bill numbers.</p>
      
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">2. Integrate Scan-to-Pay UPI QR Codes</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Displaying dynamically generated Paytm, PhonePe, or Google Pay UPI QR codes accelerates payments by over 48% and minimizes clerical checkout delays.</p>
    `
  },
  {
    slug: 'small-business-billing-guide',
    title: 'Small Business Billing Guide: Compliance & Speed',
    excerpt: 'A comprehensive, step-by-step masterclass covering tax compliance standards and modern billing best practices.',
    date: 'May 15, 2025',
    readTime: '7 min read',
    category: 'SaaS Billing',
    content: `
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">1. Understanding Tax Guidelines for Modern Merchants</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Matching state tax levels is vital. Ensure your system auto-calculates SGST and CGST dynamically during transaction checkouts to prevent manual filing errors.</p>
      
      <h2 class="text-sm font-bold text-slate-900 mt-4 uppercase">2. Offline Cash Register Resilience</h2>
      <p class="text-xs text-slate-600 mt-1 leading-relaxed">Smart billing applications store registers locally in browser localStorage, automatically syncing them to Firestore cloud partitions when the web is restored.</p>
    `
  }
];

export default function PublicPages({ currentPath, onNavigate, isLoggedIn, onAuthTrigger }: PublicPagesProps) {
  // Contact Form States
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [showAiAvatar, setShowAiAvatar] = useState(true);

  // Accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  // Blog states
  const [blogCategory, setBlogCategory] = useState('All');

  // Interactive GST Calculator States
  const [gstAmount, setGstAmount] = useState('1000');
  const [gstRate, setGstRate] = useState(18);
  const [gstType, setGstType] = useState<'exclusive' | 'inclusive'>('exclusive');

  // Interactive Stock Management States
  const [mockStocks, setMockStocks] = useState([
    { id: 1, name: "Premium Basmati Rice", stock: 8, minThreshold: 15, unit: "kg", price: 95 },
    { id: 2, name: "Fortune Soya Oil", stock: 24, minThreshold: 10, unit: "Ltr", price: 145 },
    { id: 3, name: "Ashirvaad Shudh Atta", stock: 3, minThreshold: 12, unit: "kg", price: 420 },
    { id: 4, name: "Tata Iodized Salt", stock: 15, minThreshold: 5, unit: "pkt", price: 28 },
  ]);

  // Interactive Invoice Preview States
  const [invoiceFormat, setInvoiceFormat] = useState<'A4' | 'thermal'>('A4');
  const [logoSize, setLogoSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [mockShopName, setMockShopName] = useState('Smart Retail Vyapar');

  // Interactive Billing Calculator States
  const [billingItems, setBillingItems] = useState([
    { id: 1, name: "Haldiram Bhujia 400g", price: 110, qty: 2, gst: 12 },
    { id: 2, name: "Organic Brown Sugar 1kg", price: 85, qty: 1, gst: 5 },
    { id: 3, name: "Cadbury Silk Chocolate", price: 150, qty: 3, gst: 18 },
  ]);

  // Interactive Analytics Slider States
  const [volumeFactor, setVolumeFactor] = useState(1.0);

  // Changelog active section
  const [activeVersion, setActiveVersion] = useState<string>('v1.0');

  // Privacy Storage Auditor state
  const [localStoreCount, setLocalStoreCount] = useState<number | null>(null);

  // Shared Billing & Firebase logic
  const { 
    login, 
    loginWithEmailPassword, 
    authError,
    clearAuthError,
    authStatusText,
    showToast,
    showConfirm
  } = useBilling();

  // Local PWA installation states
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  const [installStatus, setInstallStatus] = useState("");

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

  // Sandbox states & inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorLocal, setAuthErrorLocal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordReg, setShowPasswordReg] = useState(false);

  const translateAuthError = (err: any): string => {
    if (!err) return '';
    const message = typeof err === 'string' ? err : (err.message || String(err));
    const code = err.code || err.message || '';

    const lowerMsg = message.toLowerCase();
    const lowerCode = String(code).toLowerCase();

    if (lowerCode === 'auth/email-already-in-use' || lowerMsg.includes('email-already-in-use') || lowerMsg.includes('already-in-use')) {
      return "This business email is already registered. Please sign in to your workspace instead or use a different email.";
    }
    if (lowerCode === 'auth/invalid-email' || lowerMsg.includes('invalid-email') || lowerMsg.includes('invalid email')) {
      return "Please enter a valid business email address.";
    }
    if (lowerCode === 'auth/weak-password' || lowerMsg.includes('weak-password') || lowerMsg.includes('weak password')) {
      return "Your password is too weak. Please use a stronger password with at least 6 characters.";
    }
    if (lowerCode === 'auth/user-not-found' || lowerMsg.includes('user-not-found') || lowerMsg.includes('user not found')) {
      return "No registered workspace found with this email. Please check your spelling or sign up below.";
    }
    if (lowerCode === 'auth/wrong-password' || lowerMsg.includes('wrong-password') || lowerMsg.includes('wrong password') || lowerMsg.includes('invalid-credential') || lowerMsg.includes('invalid credential')) {
      return "Invalid email or password. Please verify your credentials and try again.";
    }
    if (lowerCode === 'auth/too-many-requests' || lowerMsg.includes('too-many-requests') || lowerMsg.includes('too many requests')) {
      return "Too many failed login attempts. This account has been temporarily locked for security. Please try again in a few minutes.";
    }
    if (lowerCode === 'auth/user-disabled' || lowerMsg.includes('user-disabled') || lowerMsg.includes('user disabled')) {
      return "This merchant workspace has been disabled. Please contact support.";
    }
    if (lowerCode === 'auth/operation-not-allowed' || lowerMsg.includes('operation-not-allowed')) {
      return "Email and password authentication is not enabled. Please contact support.";
    }
    if (lowerCode === 'auth/popup-closed-by-user' || lowerMsg.includes('popup-closed-by-user') || lowerMsg.includes('popup closed') || lowerMsg.includes('closed by user')) {
      return "Google login popup was closed. Please try again or use direct email registration.";
    }

    if (message.startsWith('Firebase:')) {
      return message
        .replace(/^Firebase:\s*(Error\s*)?\(auth\//, '')
        .replace(/\)\.?$/, '')
        .replace(/-/g, ' ');
    }

    return message;
  };

  useEffect(() => {
    if (authError) {
      const isCancellation = 
        String(authError).toLowerCase().includes('popup-closed') ||
        String(authError).toLowerCase().includes('closed-by-user') ||
        String(authError).toLowerCase().includes('cancelled') ||
        String(authError).toLowerCase().includes('cancel') ||
        String(authError).toLowerCase().includes('popup closed') ||
        String(authError).toLowerCase().includes('closed by user');
      
      if (!isCancellation) {
        setAuthErrorLocal(translateAuthError(authError));
      }
      clearAuthError();
    }
  }, [authError, clearAuthError]);

  // Clear auth input fields and errors when switching between /login and /signup
  useEffect(() => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setAuthErrorLocal('');
    setShowPassword(false);
    setShowPasswordReg(false);
  }, [currentPath]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4500);
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    window.history.pushState(null, '', path);
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthErrorLocal('Please enter email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthErrorLocal('');
    try {
      localStorage.setItem('vyapar_auth_intent', 'login');
      await loginWithEmailPassword(authEmail, authPassword, false, '');
    } catch (err: any) {
      setAuthErrorLocal(translateAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLocalSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName) {
      setAuthErrorLocal('Please fill in owner name, email address and secure password.');
      return;
    }
    setAuthLoading(true);
    setAuthErrorLocal('');
    try {
      localStorage.setItem('vyapar_auth_intent', 'signup');
      await loginWithEmailPassword(authEmail, authPassword, true, authName);
    } catch (err: any) {
      setAuthErrorLocal(translateAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLocalGoogleAuth = async (isSignUpFlow: boolean) => {
    setAuthLoading(true);
    setAuthErrorLocal('');
    try {
      localStorage.setItem('vyapar_auth_intent', isSignUpFlow ? 'signup' : 'login');
      await login();
    } catch (err: any) {
      const isCancellation = 
        String(err.code || '').includes('popup-closed-by-user') ||
        String(err.message || '').toLowerCase().includes('popup-closed') ||
        String(err.message || '').toLowerCase().includes('closed-by-user') ||
        String(err.message || '').toLowerCase().includes('cancelled') ||
        String(err.message || '').toLowerCase().includes('cancel') ||
        String(err.message || '').toLowerCase().includes('popup closed') ||
        String(err.message || '').toLowerCase().includes('closed by user');

      if (!isCancellation) {
        let errorMsgText = translateAuthError(err);
        if (String(err.message || '').toLowerCase().includes('popup')) {
          errorMsgText = "Pop-up was closed. For secure Google auth, consider using a New Tab, or standard email registration.";
        }
        setAuthErrorLocal(errorMsgText);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const faqs = [
    {
      q: "Is Smart Vyapar free?",
      a: "Yes! The local Sandbox Mode is 100% free with absolutely no restrictions or monthly quotas. You can manage stocks, record invoices, and print custom thermal receipts or standard A4 PDFs without paying any subscription fee."
    },
    {
      q: "Can I use it on multiple devices?",
      a: "Absolutely. When you register a secure cloud synchronized profile, all your store receipts, materials, and analytics dashboard feed are securely mirrored in Firestore. Access from desktop, tablet or mobile anytime."
    },
    {
      q: "Is my business data secure?",
      a: "Security is our highest benchmark. Smart Vyapar maintains rigid sandbox and cloud network boundaries. Your local cache remains isolated, and backups are encrypted via industry-grade SSL rules."
    },
    {
      q: "Does Smart Vyapar work completely offline?",
      a: "Yes! If local internet goes down, the offline-first registry shell works flawlessly. Invoices draft at millisecond speed, stock deducts correctly, and updates back up to the browser database instantly. Once internet returns, you sync to Firestore with one tap."
    }
  ];

  const matchedBlog = currentPath.startsWith('/blog/') 
    ? BLOG_POSTS.find(p => `/blog/${p.slug}` === currentPath) 
    : null;

  return (
    <div className="min-h-screen bg-[#020205] flex flex-col font-sans text-slate-800 relative z-10 select-none">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {(authLoading || authStatusText) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
          >
            <div className="h-10 w-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="bg-slate-900 border border-slate-800 text-white font-mono text-[10px] uppercase tracking-wider px-3 py-2 rounded-lg text-center shadow-lg">
              {authStatusText || 'Establishing secure gate...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Content Wrapper for Premium Edge Curve */}
      <div className="flex-grow flex flex-col bg-slate-50 rounded-b-[2.5rem] md:rounded-b-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] z-20 relative pb-16">
        
      {/* Elegant minimalist header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-40 transition-all shrink-0">
        <div className="max-w-7xl w-full mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a 
            href="/" 
            onClick={(e) => handleLinkClick(e, '/')}
            className="flex items-center space-x-2 group hover:opacity-90 transition-opacity"
          >
            <img 
              src="/apple-touch-icon.png" 
              alt="Logo" 
              className="h-7 w-7 rounded-lg object-contain border border-slate-100 bg-white" 
              referrerPolicy="no-referrer" 
            />
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Smart <span className="text-blue-600 font-extrabold ml-0.5 font-sans">Vyapar</span>
            </span>
          </a>

          {/* CTAs */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isLoggedIn ? (
              <button
                onClick={(e) => handleLinkClick(e, '/dashboard')}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-slate-900/10 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <a 
                  href="/login" 
                  onClick={(e) => handleLinkClick(e, '/login')} 
                  className={`hidden sm:inline-block px-4 py-2 text-sm font-bold hover:text-slate-900 transition ${currentPath === '/login' ? 'text-blue-600' : 'text-slate-500'}`}
                >
                  Log In
                </a>
                <button
                  onClick={(e) => handleLinkClick(e, '/signup')}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2 border border-blue-500/30"
                >
                  <span>Start Free</span>
                  <ArrowRight className="hidden sm:block h-4 w-4 opacity-70" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content-area" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-0 md:py-2">
                {/* ==================== HOME PAGE (/) ==================== */}
        {currentPath === '/' && (
          <div className="space-y-8 md:space-y-16">
            
            {/* ULTRA-PREMIUM CLEAN HERO SECTION */}
            <div className="relative pt-6 pb-6 md:pt-10 md:pb-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-8 select-none">
              {/* Subtle Ambient Glow Spots */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/10 to-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Left Content */}
              <div className="flex-1 space-y-6 text-center lg:text-left relative z-10 w-full">
                <span className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-700 tracking-widest uppercase font-sans shadow-sm">
                  <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                  <span>The Next-Gen Merchant OS</span>
                </span>
                
                <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-slate-900 tracking-tight leading-[1.05] relative">
                  Secure Store <br className="hidden lg:block" />
                  Billing & <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                    Stock Ledgers
                  </span>
                </h1>
                
                <p className="text-base md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  Lightning-fast GST/CGST invoicing with live mobile camera barcode scanning, AI inventory forecasting, and real-time Cloud Firestore synchronization, entirely within your browser.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <button 
                    onClick={(e) => handleLinkClick(e, '/signup')}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5"
                  >
                    <span>Launch Free Workspace</span>
                    <ArrowRight className="h-4 w-4 relative" />
                  </button>
                  <button 
                    onClick={(e) => handleLinkClick(e, '/features')}
                    className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Package className="h-4 w-4 text-indigo-600" />
                    <span>View Interactive Demo</span>
                  </button>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>No installation needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>Camera Scan enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span>Cloud Sync</span>
                  </div>
                </div>
              </div>

              {/* Right Content / Dashboard Visual */}
              <div className="flex-1 relative w-full lg:max-w-none mx-auto mt-6 lg:mt-0 lg:pl-10">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-blue-500/20 to-purple-500/20 rounded-[3rem] blur-3xl transform rotate-2 scale-105" />
                 <div className="relative rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-indigo-500/25 p-2 shadow-[0_30px_100px_rgba(99,102,241,0.18)] overflow-hidden transform md:-rotate-2 hover:rotate-0 hover:scale-[1.02] hover:border-indigo-500/40 transition-all duration-500">
                   <div className="absolute top-0 inset-x-0 h-10 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center px-5 gap-2">
                     <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                     <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                     <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                   </div>
                   <div className="mt-10 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/50 aspect-video lg:aspect-video">
                     <img src={dashboardMockup} alt="Platform Preview" className="w-full h-full object-cover object-top opacity-95 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                   </div>
                 </div>
                 
                 {/* Floating Badges */}
                 <div className="absolute -left-4 sm:-left-8 top-16 md:top-24 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className="bg-indigo-100 p-2 rounded-lg md:rounded-xl text-indigo-600">
                       <Smartphone className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <div className="text-left hidden sm:block">
                       <p className="text-xs font-bold text-slate-900">Camera Barcode</p>
                       <p className="text-[10px] font-semibold text-emerald-600">Scanned successfully</p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="absolute -right-4 sm:-right-8 bottom-16 md:bottom-28 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100">
                   <div className="flex items-center gap-3">
                     <div className="bg-blue-100 p-2 rounded-lg md:rounded-xl text-blue-600">
                       <CloudLightning className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                     <div className="text-left hidden sm:block">
                       <p className="text-xs font-bold text-slate-900">Firestore Sync</p>
                       <p className="text-[10px] font-semibold text-blue-600">Real-time backup live</p>
                     </div>
                   </div>
                 </div>
              </div>
            </div>

            {/* HIGH-FIDELITY PLATFORM TOUR - MOCKUPS GRID */}
            <div className="max-w-6xl mx-auto space-y-10 py-4 border-t border-b border-slate-100/80">
              <div className="text-center space-y-2 max-w-xl mx-auto mb-4">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">Interactive Retail Modules</h2>
                <p className="text-xs text-slate-500 font-medium">Explore the high-speed interfaces built directly into Smart Vyapar</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                
                {/* Image 1: Dashboard */}
                <div className="flex flex-col space-y-3">
                  <div className="text-left px-1 space-y-1">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none">Command Center</h3>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">Real-time Turnovers & Margins</h4>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                      Track active warehouse stock numbers, aggregate digital vs cash receipts distribution, overall profit margins, and peak billing checkout windows.
                    </p>
                  </div>
                  
                  <div className="group relative rounded-2xl overflow-hidden shadow-md border border-slate-200/50 bg-white p-1.5 transition-all hover:shadow-indigo-500/15 hover:-translate-y-1.5 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-indigo-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-350 ease-out z-10 flex flex-col justify-end p-6 border border-transparent group-hover:border-indigo-500/20 rounded-xl">
                      <h3 className="text-white font-extrabold text-base translate-y-4 group-hover:translate-y-0 transition-transform">Real-time Dashboard</h3>
                      <p className="text-slate-300 text-[11px] mt-1 translate-y-4 group-hover:translate-y-0 transition-transform delay-75">Full control over shop turnover and stock counts.</p>
                    </div>
                    <img src={dashboardMockup} alt="Dashboard mockup" className="w-full h-auto rounded-xl object-cover relative z-0 transition-transform duration-700 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                  </div>
                </div>
                
                {/* Image 2: Billing */}
                <div className="flex flex-col space-y-3">
                  <div className="text-left px-1 space-y-1">
                    <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest leading-none">Sales Checkout</h3>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">GST Dividends & Inbound Cash qr</h4>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                      Prepare GST invoices instantly. Add products quickly using direct physical laser scans or our smart camera scan modal, watermarking instant Paytm/UPI QR payment codes on receipt footers.
                    </p>
                  </div>

                  <div className="group relative rounded-2xl overflow-hidden shadow-md border border-slate-200/50 bg-white p-1.5 transition-all hover:shadow-rose-500/15 hover:-translate-y-1.5 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-rose-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-350 ease-out z-10 flex flex-col justify-end p-6 border border-transparent group-hover:border-rose-500/20 rounded-xl">
                      <h3 className="text-white font-extrabold text-base translate-y-4 group-hover:translate-y-0 transition-transform">Lightning Fast Invoicing</h3>
                      <p className="text-slate-300 text-[11px] mt-1 translate-y-4 group-hover:translate-y-0 transition-transform delay-75">Fractions of a second checkouts matching thermal or standard margins.</p>
                    </div>
                    <img src={billingMockup} alt="Billing mockup" className="w-full h-auto rounded-xl object-cover relative z-0 transition-transform duration-700 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                  </div>
                </div>

                {/* Image 3: Inventory */}
                <div className="flex flex-col space-y-3">
                  <div className="text-left px-1 space-y-1">
                    <h3 className="text-xs font-black text-emerald-650 uppercase tracking-widest leading-none">Stock Control</h3>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">Active Warning Levels & SKU Catalogs</h4>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                      Log sales prices, item acquisition costs, tax segments and reorder buffers. When stock drops below safety limits, live visual warning badges light up immediately.
                    </p>
                  </div>

                  <div className="group relative rounded-2xl overflow-hidden shadow-md border border-slate-200/50 bg-white p-1.5 transition-all hover:shadow-emerald-500/15 hover:-translate-y-1.5 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-emerald-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-350 ease-out z-10 flex flex-col justify-end p-6 border border-transparent group-hover:border-emerald-500/20 rounded-xl">
                      <h3 className="text-white font-extrabold text-base translate-y-4 group-hover:translate-y-0 transition-transform">Smart Catalog Monitors</h3>
                      <p className="text-slate-300 text-[11px] mt-1 translate-y-4 group-hover:translate-y-0 transition-transform delay-75">Upload catalog data in bulk with custom files.</p>
                    </div>
                    <img src={inventoryMockup} alt="Inventory mockup" className="w-full h-auto rounded-xl object-cover relative z-0 transition-transform duration-700 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                  </div>
                </div>

                {/* Image 4: Analytics */}
                <div className="flex flex-col space-y-3">
                  <div className="text-left px-1 space-y-1">
                    <h3 className="text-xs font-black text-violet-600 uppercase tracking-widest leading-none">Financial Intelligence</h3>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">Peak Checkout Analysis & Gross Profit Tracker</h4>
                    <p className="text-[11.5px] text-slate-500 font-medium leading-relaxed">
                      Visualize shop momentum using Recharts graphics. Split CGST & SGST taxes separate from profit channels, logging operational expenses to calculate high-accuracy net margins.
                    </p>
                  </div>

                  <div className="group relative rounded-2xl overflow-hidden shadow-md border border-slate-200/50 bg-white p-1.5 transition-all hover:shadow-violet-500/15 hover:-translate-y-1.5 duration-300">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-violet-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-350 ease-out z-10 flex flex-col justify-end p-6 border border-transparent group-hover:border-violet-500/20 rounded-xl">
                      <h3 className="text-white font-extrabold text-base translate-y-4 group-hover:translate-y-0 transition-transform">Deep Analytics Portals</h3>
                      <p className="text-slate-300 text-[11px] mt-1 translate-y-4 group-hover:translate-y-0 transition-transform delay-75">Track exact tax margins and growth rates.</p>
                    </div>
                    <img src={analyticsMockup} alt="Analytics mockup" className="w-full h-auto rounded-xl object-cover relative z-0 transition-transform duration-700 group-hover:scale-[1.01]" referrerPolicy="no-referrer" />
                  </div>
                </div>

              </div>
            </div>

            {/* HIGH-CONVERSION CTA FOOTER LINE */}
            <div id="cta-notification-banner" className="bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/90 backdrop-blur-xl border border-indigo-500/20 text-white rounded-[2rem] p-8 md:p-12 text-left relative overflow-hidden shadow-[0_20px_50px_rgba(30,41,59,0.5)] max-w-5xl mx-auto select-none group hover:border-indigo-500/40 hover:shadow-indigo-500/20 transition-all duration-700">
              {/* Dynamic Ambient Neon Radial Shines */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/20 via-blue-500/10 to-transparent rounded-full blur-[100px] pointer-events-none group-hover:scale-110 group-hover:translate-x-10 group-hover:-translate-y-10 transition-transform duration-1000 ease-out" />
              <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-1000 ease-out" />
              
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 text-[10px] text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full font-mono font-bold tracking-widest uppercase border border-indigo-500/20 leading-none shadow-inner shadow-indigo-500/10 backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Active Registration Open</span>
                </div>
                
                <h3 className="text-2xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-tight font-sans drop-shadow-sm">
                  Onboard Your Shop Ledgers onto the <br className="hidden md:inline" />
                  Most Trusted Ecosystem
                </h3>
                
                <p className="text-[13px] md:text-sm text-slate-400 leading-relaxed font-medium max-w-xl">
                  Stop looking up manual ledger lists. Implement Smart Vyapar on your browser or home computer now to gain advanced inventory forecasting, unified customer payment ledger tracking, and secure Firebase synchronization.
                </p>
                
                <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    onClick={(e) => handleLinkClick(e, '/signup')}
                    className="group/btn px-6 py-3 bg-white text-slate-900 font-black text-xs rounded-xl shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 inline-flex items-center justify-center space-x-2 uppercase tracking-wide cursor-pointer text-center relative overflow-hidden"
                  >
                    <span className="relative z-10">Create Free Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  <button
                    onClick={(e) => handleLinkClick(e, '/features')}
                    className="px-6 py-3 bg-transparent hover:bg-slate-800/50 border-2 border-slate-700 hover:border-slate-600 text-white font-bold text-xs rounded-xl transition-all duration-300 inline-flex items-center justify-center space-x-1.5 uppercase tracking-wide cursor-pointer text-center backdrop-blur-sm"
                  >
                    <span>View System Capabilities</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== FEATURES PAGE (/features) ==================== */}
        {currentPath === '/features' && (
          <div className="space-y-16 animate-fade-in text-left">
            <div className="max-w-4xl space-y-4">
              <span className="px-3.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-black uppercase tracking-wider">Enterprise OS Capabilities</span>
              <h1 className="text-4xl md:text-5.5xl font-black text-slate-900 tracking-tight leading-none">
                An Advanced Architectural Suite Built for Private Shop Floors
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-2xl font-medium leading-relaxed">
                Smart Vyapar provides dual local offline-first database caches, automated SGST / CGST split ledgers, active buffer notification alarms, and instant Google Cloud synchronization with zero quota restrictions.
              </p>
            </div>

            {/* Bento Card Grid mapping to real components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Receipt, title: "GST/Tax Invoice Generation", desc: "Instantly divides CGST and SGST ratios, records unique buyer ledger files, supports itemized discount percentages, and builds standard 80mm compact thermal or A4 printable formats." },
                { icon: Package, title: "Active Inventory Alerts & Buffers", desc: "Input minimum threshold safety quantities per SKU. The system lights up warning badges the millisecond transactions finalize, keeping your stock lines perfectly populated." },
                { icon: Zap, title: "Hybrid Cache & Offline Resiliency", desc: "No local network delays. The application's offline ledger holds invoicing and catalog data locally in browser cache structures, allowing cashiers to checkout without interruption." },
                { icon: TrendingUp, title: "Dynamic Revenue Tracking", desc: "Review real-time calculations detailing gross turnover, average basket sizes, net profit lines, custom tax obligations, and peak sales distribution schedules." },
                { icon: Sparkles, title: "AI Velocity-Based Replenishment", desc: "Our forecasting tool evaluates recent transaction items to calculate velocity rates. Instantly generate recommended reorder numbers to stock up intelligently." },
                { icon: Database, title: "Supplier Purchase Order Workspace", desc: "Compile complete PO lists matching parts to Supplier Vendor structures. Create drafts, track shipment items, handle receiving status logs, and configure supplier accounting histories." },
                { icon: Users, title: "Credit Customer Outstandings", desc: "Keep track of credit clients and client ledgers. Update partial payments, record payment modes (Cash / UPI / Cards), and trace chronological balance reports." },
                { icon: Lock, title: "Secure Google Accounts Sync", desc: "Authenticate with certified OAuth gates to sync configurations and sales histories seamlessly over encrypted Firebase document streams." },
                { icon: Smartphone, title: "PWA Mobile App Integration", desc: "Install the dashboard directly. Supports offline mobile operations with manual sku typing or direct device-camera barcode scan tracking." }
              ].map((comp, idx) => (
                <div key={idx} className="group p-8 bg-white border border-slate-200/80 rounded-3xl text-left flex flex-col justify-between shadow-3xs hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-55/10 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/30 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <comp.icon className="h-5.5 w-5.5 stroke-[1.8]" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{comp.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{comp.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* INTERACTIVE WORKSPACE CONFIGURATION MATRIC SIMULATOR */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px]" />
              <div className="max-w-xl space-y-3 mb-8">
                <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Interactive Deployment Guide</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select Your Merchant Capacity Scale</h3>
                <p className="text-xs text-slate-500 font-semibold">Simulate the deployment specifications of Smart Vyapar under different micro-enterprise architectures:</p>
              </div>

              {/* Slider / Segment select */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Independent Shop", scale: "Micro Retailer", volume: "Up to ₹5L/mo", size: "3-5MB local", db: "IndexedDB Sandbox", speed: "1.2ms checkout" },
                  { label: "Multi-Counter", scale: "Medium Store", volume: "₹5L - ₹25L/mo", size: "12-15MB local + Cloud", db: "Firestore Synchronizer", speed: "0.8ms checkout" },
                  { label: "Supermarket & Depot", scale: "Enterprise Hub", volume: "₹25L+ /mo", size: "30MB+ + Dual Cloud Sync", db: "Dual Firestore Clusters", speed: "0.5ms checkout" }
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      if (idx === 0) setVolumeFactor(0.8);
                      else if (idx === 1) setVolumeFactor(1.3);
                      else setVolumeFactor(2.2);
                      showToast(`Simulated specification profile loaded: ${item.scale}`);
                    }}
                    className={`p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                      (idx === 0 && volumeFactor < 1.0) || (idx === 1 && volumeFactor >= 1.0 && volumeFactor <= 1.5) || (idx === 2 && volumeFactor > 1.5)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-wide opacity-80">{item.label}</span>
                    <span className="block text-base font-black mt-1">{item.scale}</span>
                    <div className="mt-4 pt-4 border-t border-current/10 space-y-1.5 text-[11px] font-semibold opacity-90">
                      <div className="flex justify-between"><span>Transactions:</span> <span>{item.volume}</span></div>
                      <div className="flex justify-between"><span>Memory footprint:</span> <span>{item.size}</span></div>
                      <div className="flex justify-between"><span>Ledger Node:</span> <span>{item.db}</span></div>
                      <div className="flex justify-between"><span>Latency:</span> <span className="font-mono text-emerald-500 font-bold">{item.speed}</span></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR dynamic watermark block */}
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border border-slate-800 shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="inline-block text-[10px] text-indigo-300 bg-indigo-500/25 px-3 py-1.5 rounded-full font-mono font-bold tracking-widest uppercase border border-indigo-500/20 leading-none">Unified Scan to Pay</span>
                <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-white leading-tight">Instant UPI QR Receipt Watermarks</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Smart Vyapar watermarks digital Paytm, PhonePe, or Google Pay UPI QR paycodes dynamically on the bottom margins of standard bills. This skips payment-link queries at the cash desk, speeding up checkout counters.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABOUT US PAGE (/about) ==================== */}
        {currentPath === '/about' && (
          <div className="space-y-16 max-w-4xl mx-auto animate-fade-in text-left">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Independent Craft & Vision</span>
              <h1 className="text-4xl md:text-5.5xl font-black text-slate-900 tracking-tight leading-none">
                Empowering Local Merchants with Private Digital Ledger Frameworks
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold max-w-2xl">
                Smart Vyapar was born from a fundamental objective: small business owners, local utility stores, and retail boutiques shouldn't have to suffer bloated, expensive billing systems just to track their products and tax filings. We engineered Smart Vyapar to be fast, private, compliant, and exceptionally reliable.
              </p>
            </div>

            {/* The Timeline of Engineering */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight border-b border-slate-200 pb-3">Development Milestones</h3>
              <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                {[
                  { year: "2026 Q2", title: "Smart Vyapar V1.0 Launch", desc: "Deployed standard Google Cloud authentication sync with private storage clusters, dynamic multi-tier invoice layouts, and active reorder alerts." },
                  { year: "2026 Q1", title: "PWA Mobile Integration & Scanners", desc: "Designed native smartphone camera tracking alongside USB/Bluetooth laser hardware barcode focus windows." },
                  { year: "2025 Q4", title: "Offline-First Ledgers", desc: "Engineered high-speed client memory storage engines ensuring 1.2ms operational latency during continuous local blackouts." }
                ].map((item, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                    <span className="text-[10px] font-black text-indigo-600 font-mono tracking-wider">{item.year}</span>
                    <h4 className="text-sm font-bold text-slate-905 mt-0.5">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="p-8 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs hover:border-indigo-200 transition-colors">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Mitigating Inventory & Tax Leakages</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  We designed this platform around a 0% entry barrier. Providing a 100% free offline-resilient sandbox that handles GST-divided invoices, stock counters, customer payments, profit margins, and peak analytics saves retail owners hundreds of calculation hours.
                </p>
              </div>

              <div className="p-8 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs hover:border-indigo-200 transition-colors">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Pristine Merchant Data Sovereignty</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Unlike corporate platforms that scrap stock records, catalog prices, or client directories to monetize them inside third-party advertising grids, Smart Vyapar maintains rigid boundaries. Your ledger remains on your local browser database, syncing exclusively to your authorized secure Firestore clusters.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={() => setShowAiAvatar(!showAiAvatar)}
                    className="relative h-16 w-16 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 focus:outline-none shrink-0"
                    title="Click here to instantly toggle profile representations"
                  >
                    <AnimatePresence mode="wait">
                      {showAiAvatar ? (
                        <motion.img
                           key="ai-avatar-about"
                           initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                           animate={{ opacity: 1, scale: 1, rotate: 0 }}
                           exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                           transition={{ duration: 0.2 }}
                           src={aiBoyAvatar}
                           alt="Raghav Pratap AI representation"
                           className="h-full w-full object-cover rounded-xl"
                           referrerPolicy="no-referrer"
                        />
                      ) : (
                        <motion.div
                           key="monogram-about"
                           initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                           animate={{ opacity: 1, scale: 1, rotate: 0 }}
                           exit={{ opacity: 0, scale: 0.9, rotate: -5 }}
                           transition={{ duration: 0.2 }}
                           className="h-full w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-black flex items-center justify-center text-xl shadow-inner font-sans"
                        >
                           RP
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white tracking-tight leading-none">RAGHAV PRATAP</h3>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mt-1.5">Owner & Principal Architect</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Smart Vyapar in its entirety is formulated, customized, and owned wholly by developer Raghav Pratap. Focused on streamlining retail ledger logic, Raghav compiled this offline caching workspace with direct Firestore cloud adapters and 100% compliant receipt layouts so you can manage your shop floors with speed and certainty.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FAQ ACCORDION (/faq) ==================== */}
        {currentPath === '/faq' && (
          <div className="space-y-12 max-w-3xl mx-auto text-left animate-fade-in">
            <div className="text-center space-y-4">
              <span className="px-3.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Merchant Helpdesk</span>
              <h1 className="text-3xl md:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-none">
                Frequently Asked Inquiries
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-semibold max-w-lg mx-auto leading-relaxed">
                Review answers regarding GST divided calculations, A4 / compact thermal receipt outputs, custom barcode scanners, and Firestore live data synchronization.
              </p>

              {/* SEARCH INPUT */}
              <div className="relative max-w-md mx-auto pt-4">
                <Search className="absolute left-4 top-7 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search inquiries (e.g., offline, thermal, GST)..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white outline-none rounded-2xl text-xs font-semibold shadow-3xs transition"
                />
                {faqSearch && (
                  <button 
                    onClick={() => setFaqSearch('')}
                    className="absolute right-4 top-7 text-xs text-slate-400 hover:text-slate-600 font-bold font-sans"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Offline', 'GST', 'Thermal Printer', 'Barcode', 'Backup'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFaqSearch(tag)}
                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 transition cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "What features are offered in Smart Vyapar's free Sandbox Mode?",
                  a: "Smart Vyapar is completely unrestricted in local Sandbox Mode! You can record products, manage safe stock buffers, create GST-compliant bills, apply line-item cash discounts, calculate net earnings, track credit ledger clients, print standard A4 or 80mm thermal receipts, and view detailed Recharts profit telemetry with zero monthly subscription fees."
                },
                {
                  q: "How does the offline-first ledger cache operate during internet power loss?",
                  a: "If local internet connections fail, our local caching shell ensures seamless operation. Sales checkouts compile at high speed, inventories deduct correctly in natural time, and invoices are held safely inside browser cookies/storage. The moment network is restored, you can back up and sync your logs back to Firestore on-demand."
                },
                {
                  q: "Does the app support AI-powered Purchase Orders and Procurement?",
                  a: "Yes! Smart Vyapar features an advanced AI Procurement & Purchase Order Manager that scans stock velocities, predicts run-out dates, and automatically generates replenishment drafts. Furthermore, our AI-powered bill reader lets you upload supplier invoices/bills to instantly extract prices and update received stock counts."
                },
                {
                  q: "Can I export operational Excel spreadsheets or PDF reports?",
                  a: "Absolutely! Smart Vyapar enables one-click exporting of your complete Operational Ledger into pristine Excel format (.xlsx) and generates publication-quality Enterprise Business Intelligence (BI) reports in PDF format with custom filters, charts, and metrics."
                },
                {
                  q: "Does the app support standard 80mm/58mm thermal receipt printers?",
                  a: "Yes! The system is highly optimized for retail counters and supports both executive standard A4 tax invoice printouts and fast 80mm or 58mm compact thermal receipts. You can configure and save your layout preferences in core Settings."
                },
                {
                  q: "Can I connect barcode scanner laser guns or use mobile camera tracking?",
                  a: "Absolutely! The billing screen includes a laser terminal focus window (F2 hotkey enabled) to scan EAN/UPC barcodes using standard USB/Bluetooth hardware. Additionally, cash counters can open our upgraded smart camera scan modal to snap codes instantly using native mobile cameras without initial startup background permissions."
                },
                {
                  q: "Does the invoice software calculate divided CGST, SGST, and margins?",
                  a: "Yes! Every single item added to catalogs maintains an explicit GST tax rate along with individual purchase acquisition and selling prices. When added to bills, Smart Vyapar computes CGST and SGST taxes separate from operational gross margins, which automatically populate your quarterly tax summaries on the Financial page."
                },
                {
                  q: "How do I secure multi-device syncing over Firestore Cloud?",
                  a: "Simply complete the owner profile registration. Authenticating through secure Google OAuth, your shop inventories, credit clients, billing archives, and replenishment drafts will instantly and safely synchronize with certified Firestore collections."
                }
              ].filter(faq => {
                if (!faqSearch) return true;
                const kw = faqSearch.toLowerCase();
                return faq.q.toLowerCase().includes(kw) || faq.a.toLowerCase().includes(kw);
              }).map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-colors duration-200 shadow-3xs"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 hover:text-indigo-650 transition cursor-pointer"
                  >
                    <span className="text-xs font-black text-slate-800 tracking-tight">{faq.q}</span>
                    <ChevronDown className={`w-4.5 h-4.5 text-slate-400 shrink-0 transform transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>
                  
                  {activeFaq === idx && (
                    <div className="px-6 pb-5 pt-1.5 border-t border-slate-100 text-xs text-slate-500 font-semibold leading-relaxed animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-700 text-white p-8 rounded-[2rem] text-center space-y-4 shadow-xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-[40px] pointer-events-none" />
              <span className="relative inline-block text-[10px] text-cyan-200 bg-white/10 px-3.5 py-1.5 rounded-full font-mono tracking-widest font-black uppercase border border-white/10">HAVE EXPLICIT SYSTEM INQUIRIES?</span>
              <p className="relative z-10 text-xs font-semibold leading-relaxed max-w-md mx-auto text-blue-50">
                Need details regarding physical receipt layouts or custom item import configurations? Connect directly with Raghav Pratap via our email desk.
              </p>
              <button 
                onClick={(e) => handleLinkClick(e, '/contact')}
                className="relative z-10 px-6 py-3 bg-white hover:bg-slate-50 text-indigo-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all duration-200 hover:translate-y-[-1px] cursor-pointer border-none"
              >
                Connect With Developer Lead
              </button>
            </div>
          </div>
        )}

        {/* ==================== BLOG DIRECTORY (/blog) ==================== */}
        {currentPath === '/blog' && (
          <div className="space-y-12 animate-fade-in text-left">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-full font-sans text-xs font-bold uppercase tracking-widest border border-indigo-100">Merchant Digest</span>
              <h1 className="text-4xl md:text-5.5xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
                Smart Vyapar Journal
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
                Stay updated with professional merchant advice covering catalog velocity tracking, GST CGST/SGST tax compliance, and cash-flow leakages.
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['All', 'Inventory', 'Business Billing', 'Compliance'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBlogCategory(cat)}
                    className={`px-4.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      blogCategory === cat
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-600'
                    }`}
                  >
                    {cat === 'All' ? 'All Articles' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row items-center gap-6 max-w-3xl mx-auto text-left shadow-lg shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none" />
              <button
                onClick={() => setShowAiAvatar(!showAiAvatar)}
                className="relative h-16 w-16 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-4 hover:ring-indigo-100 hover:shadow-xl active:scale-95 focus:outline-none shrink-0"
                title="Click here to instantly toggle profile representations"
              >
                <AnimatePresence mode="wait">
                  {showAiAvatar ? (
                    <motion.img
                      key="ai-avatar-blog"
                      initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                      transition={{ duration: 0.15 }}
                      src={aiBoyAvatar}
                      alt="Raghav Pratap AI representation"
                      className="h-full w-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <motion.div
                      key="monogram-blog"
                      initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.9, rotate: -5 }}
                      transition={{ duration: 0.15 }}
                      className="h-full w-full rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black flex items-center justify-center text-xl tracking-wider shadow-sm font-sans"
                    >
                      RP
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <div className="space-y-1.5 flex-1 relative z-10">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest font-sans leading-none">About the Developer & Owner</h4>
                <p className="text-xl font-black text-slate-900 leading-none">RAGHAV PRATAP</p>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Raghav Pratap is the lead architect, developer, and owner of Smart Vyapar. He created this high-efficiency workspace to provide micro-merchants with structured, offline-resilient invoicing operations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  slug: 'how-to-manage-inventory',
                  title: 'How to Manage Inventory for Growing Retail Shops',
                  excerpt: 'Discover reorder point guidelines and safety stock limits to keep your shelves stocked without overcommitting cash.',
                  date: 'June 1, 2026',
                  category: 'Inventory',
                  time: '5 min read'
                },
                {
                  slug: 'how-to-create-professional-invoices',
                  title: 'How to Create Professional Invoices to Elevate Your Brand',
                  excerpt: 'Learn how customized segmented GST details, structured terms, and interactive payment QR codes accelerate collections.',
                  date: 'May 28, 2026',
                  category: 'Business Billing',
                  time: '4 min read'
                },
                {
                  slug: 'small-business-billing-guide',
                  title: 'Small Business Billing Guide: Compliance & Speed',
                  excerpt: 'A comprehensive guide on managing local cache ledger balances and quarterly state CGST/SGST audit requirements.',
                  date: 'May 15, 2026',
                  category: 'Compliance',
                  time: '7 min read'
                }
              ].filter(post => blogCategory === 'All' || post.category === blogCategory).map((post) => (
                <div 
                  key={post.slug}
                  className="group bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl flex flex-col justify-between space-y-6 hover:shadow-xl hover:shadow-indigo-900/5 hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-sans tracking-wide">
                      <span className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-full uppercase tracking-widest font-extrabold border border-indigo-100/50">
                        {post.category}
                      </span>
                      <span>{post.date}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-normal">
                      {post.excerpt}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 relative z-10">
                    <a 
                      href={`/blog/${post.slug}`}
                      onClick={(e) => handleLinkClick(e, `/blog/${post.slug}`)}
                      className="inline-flex items-center space-x-1.5 font-bold text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== BLOG POST DETAIL (/blog/:slug) ==================== */}
        {matchedBlog && (
          <article className="max-w-3xl mx-auto text-left space-y-10 font-sans animate-fade-in py-4">
            <button 
              onClick={(e) => handleLinkClick(e, '/blog')}
              className="inline-flex items-center space-x-2 border border-slate-200/80 bg-white px-4 py-2.5 rounded-full text-xs text-slate-500 hover:text-slate-900 hover:shadow-md transition-all font-bold tracking-wide"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </button>
            
            <div className="space-y-6 border-b border-slate-100 pb-8">
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-full font-bold text-xs tracking-wider uppercase border border-indigo-100/50">
                {matchedBlog.category}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {matchedBlog.title}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-500 font-medium gap-3">
                <span className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">RP</span>
                  <span>By <span className="text-indigo-600 font-bold">RAGHAV PRATAP</span></span>
                </span>
                <span className="flex items-center gap-1.5 opacity-80">
                  <span>{matchedBlog.date}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{matchedBlog.readTime}</span>
                </span>
              </div>
            </div>

            <div 
              className="prose prose-slate prose-lg max-w-none text-slate-700 leading-[1.8] space-y-6"
              dangerouslySetInnerHTML={{ __html: matchedBlog.content }}
            />

            <div className="p-8 md:p-10 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-8 border border-slate-800 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="space-y-3 text-left relative z-10 max-w-lg">
                <span className="text-xs text-blue-400 font-bold tracking-widest uppercase">Launch Your System</span>
                <h4 className="text-2xl font-black text-white tracking-tight leading-snug">Eliminate manual counting leakages</h4>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                  Draft transaction bills at lightning speeds and backup files securely inside browser cache limits instantly.
                </p>
              </div>
              <button 
                onClick={(e) => handleLinkClick(e, '/signup')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition shrink-0 cursor-pointer text-center border-none outline-none"
              >
                Register Workspace Free
              </button>
            </div>
          </article>
        )}

        {/* ==================== CONTACT US PAGE (/contact) ==================== */}
        {currentPath === '/contact' && (
          <div className="max-w-2.5xl mx-auto text-center py-6 md:py-10">
            <div className="relative p-8 md:p-12 bg-white border border-slate-200 rounded-[2rem] shadow-sm space-y-8 overflow-hidden text-left">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-70 pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-70 pointer-events-none" />

              <div className="relative space-y-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-805 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-200/40">
                  <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                  Developer Direct Desk
                </span>
                
                <h1 className="text-3xl md:text-4.5xl font-sans font-black tracking-tight text-slate-905 leading-none">
                  Get in Touch with our <span className="text-indigo-600">Architect Lead</span>
                </h1>
                
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-lg mx-auto font-semibold">
                  Have explicit questions regarding tax CGST division ratios, need professional custom-margin receipts configurations, or seek support importing inventory sheets? Talk directly with owner Raghav Pratap.
                </p>
              </div>

              {/* Decorative envelope */}
              <div className="flex justify-center py-2">
                <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                  <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-650 to-indigo-800 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-indigo-600">
                      <Mail className="h-9 w-9 stroke-[1.8]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="space-y-4 max-w-md mx-auto text-center">
                <a 
                  href="mailto:support.smartvyapar@gmail.com"
                  className="group flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 hover:bg-indigo-705 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-300 transform active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded-md bg-white/10 text-white shrink-0">
                    <Mail className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <span>Email: support.smartvyapar@gmail.com</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </a>

                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-semibold">
                  Clicking dynamically triggers your secure default mail client.
                </p>
              </div>

              {/* Footer Trust Indicator */}
              <div className="border-t border-slate-100 pt-6 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure Encryption
                </span>
                <span className="h-1 w-1 bg-slate-200 rounded-full" />
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600" /> Owner Response Under 24h
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRIVACY POLICY (/privacy-policy) ==================== */}
        {currentPath === '/privacy-policy' && (
          <div className="space-y-10 max-w-4xl mx-auto text-left animate-fade-in">
            <div className="border-b border-slate-200 pb-6">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-150">Merchant Trust Pact</span>
              <h1 className="text-3xl md:text-4.5xl font-black text-slate-900 tracking-tight leading-none mt-2">Privacy Policy & Sovereign Storage</h1>
              <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-1.5 uppercase">Last Revised: June 20, 2026</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Local Sandbox Boundaries</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Your catalogs, pricing indexes, client directory ledger cards, and tax rates remain wholly on your local browser database. Smart Vyapar does not transmit data to external brokers.
                </p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">OAuth Identity Relay</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Google Workspace and Firebase synchronization procedures operate over high-security encrypted tokens. We isolate your trade records from any third-party indexing engines.
                </p>
              </div>

              <div className="bg-white p-6 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">On-Demand Erasure</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  You retain absolute data sovereignty. You can delete your synchronized cloud collections or wipe local cache structures with one-click directly inside Settings.
                </p>
              </div>
            </div>

            {/* INTERACTIVE STORAGE AUDITOR CARD */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 text-left max-w-lg">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">Live Sandbox Diagnostics</span>
                  <h3 className="text-xl font-black">Verify Your Device Storage Sandbox</h3>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Check the current storage state of your browser. Smart Vyapar operates completely within your secure local browser cache.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Quick state lookup
                    try {
                      const keys = Object.keys(localStorage);
                      setLocalStoreCount(keys.length);
                      showToast(`Diagnostic Complete: Detected ${keys.length} local key clusters.`);
                    } catch (e) {
                      setLocalStoreCount(0);
                    }
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-none shrink-0"
                >
                  Audit Local Storage
                </button>
              </div>

              {localStoreCount !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-300 font-sans"
                >
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Device Storage Mode</span>
                    <span className="text-sm font-black text-emerald-400 mt-0.5 block">Isolated Client Sandbox</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Active Memory Clusters</span>
                    <span className="text-sm font-black text-white mt-0.5 block">{localStoreCount} key-value slots</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase font-mono tracking-wider">Storage Security Integrity</span>
                    <span className="text-sm font-black text-blue-400 mt-0.5 block">100% Encrypted & Local</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TERMS & CONDITIONS (/terms) ==================== */}
        {currentPath === '/terms' && (
          <div className="space-y-10 max-w-4xl mx-auto text-left animate-fade-in">
            <div className="border-b border-slate-200 pb-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-150">Covenant & Guarantees</span>
              <h1 className="text-3xl md:text-4.5xl font-black text-slate-900 tracking-tight leading-none mt-2">Terms of Service & Operational Bounds</h1>
              <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-1.5 uppercase">Last Revised: June 20, 2026</p>
            </div>

            <div className="space-y-6">
              {[
                { title: "1. Fair Sandbox Operation", desc: "Our offline-first sandboxed invoicing, cash register counters, stock lists, and printer adapters are provided free of monthly operational dues. We do not restrict or throttle local merchant operations under standard usage schemas." },
                { title: "2. Compliance & Local Tax Auditing", desc: "While Smart Vyapar compiles state CGST & SGST divided ratios dynamically on transaction receipts, the store owner holds the ultimate legal liability to review and cross-check receipts against regional tax filings. We provide calculation tools; we are not certified fiscal advisers." },
                { title: "3. Workspace Sync Credentials", desc: "When you activate Firestore Cloud Sync, you agree to keep your Google Account logins private. Smart Vyapar will sync ledgers automatically matching your authenticated profile node, and we hold no liability for device loss leakage." }
              ].map((term, idx) => (
                <div key={idx} className="bg-white p-8 border border-slate-200 rounded-2xl shadow-3xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">{term.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{term.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-8 bg-gradient-to-tr from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-left">
                <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest font-mono">Immediate Agreement Confirmation</span>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  By utilizing Smart Vyapar's local billing and inventory ledger systems, you implicitly accept our private, compliant merchant boundaries.
                </p>
              </div>
              <button 
                onClick={() => {
                  showToast("Terms of service agreement recorded successfully on your local terminal.");
                }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border-none shrink-0"
              >
                Acknowledge and Accept Terms
              </button>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: BILLING SOFTWARE (/billing-software) ==================== */}
        {currentPath === '/billing-software' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Premium Invoicing Engine</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                GST Compliant Invoice Maker & Receipt Generator
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Issue perfect tax billing copies in seconds. Smart Vyapar maps invoices dynamically matching both 80mm compact retail thermal units and standard Executive A4 compliance sheets.
              </p>
            </div>

            {/* INTERACTIVE BILLING ITEM SIMULATOR */}
            <div className="bg-white border border-slate-205 rounded-[2rem] p-6 md:p-8 shadow-3xs space-y-6">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wide">Interactive Cashier Register Simulator</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">ADJUST ITEMS AND SEE CGST/SGST DIVISIONS AUTO-CALCULATE IN REAL TIME</p>
                </div>
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[9px] font-bold border border-indigo-100">Live Formula Engine</span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {billingItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold text-slate-700">
                    <span className="font-bold text-slate-900 flex-1">{item.name}</span>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Price:</span>
                        <span>₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Tax GST:</span>
                        <span>{item.gst}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (item.qty > 1) {
                              setBillingItems(billingItems.map(bi => bi.id === item.id ? { ...bi, qty: bi.qty - 1 } : bi));
                            }
                          }}
                          className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded flex items-center justify-center font-bold text-slate-600 cursor-pointer text-xs leading-none"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold">{item.qty}</span>
                        <button
                          onClick={() => {
                            setBillingItems(billingItems.map(bi => bi.id === item.id ? { ...bi, qty: bi.qty + 1 } : bi));
                          }}
                          className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded flex items-center justify-center font-bold text-slate-600 cursor-pointer text-xs leading-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations layout */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 font-mono text-[11px] font-bold text-slate-500">
                <div className="space-y-1 text-left flex-1 sm:border-r border-slate-100 pr-4">
                  <div className="flex justify-between"><span>Gross Total:</span> <span className="text-slate-800">₹{billingItems.reduce((acc, bi) => acc + (bi.price * bi.qty), 0).toFixed(2)}</span></div>
                  <div className="flex justify-between">
                    <span>Computed CGST (divided):</span> 
                    <span className="text-indigo-600">₹{billingItems.reduce((acc, bi) => acc + (((bi.price * bi.qty) * (bi.gst / 100)) / 2), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Computed SGST (divided):</span> 
                    <span className="text-indigo-600">₹{billingItems.reduce((acc, bi) => acc + (((bi.price * bi.qty) * (bi.gst / 100)) / 2), 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="sm:pl-6 text-left shrink-0 min-w-[160px] flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Total Net Bill Amount</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 font-sans">
                    ₹{billingItems.reduce((acc, bi) => acc + ((bi.price * bi.qty) * (1 + bi.gst/100)), 0).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-500 mt-1 block">✔ Invoiced perfectly.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-black text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">01. Dynamic CGST/SGST Division</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Configure distinct GST tax brackets for matching items. The invoice calculator processes CGST & SGST taxes separate from operational discount bounds automatically as cashiers checkout.</p>
              </div>
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-black text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">02. Scan-to-Pay QR Embedder</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Embed Paytm/UPI payment addresses on invoice templates. Smart Vyapar generates clean scan-to-pay QR graphics on receipt footers for instant bank settlements.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: INVENTORY MANAGEMENT (/inventory-management) ==================== */}
        {currentPath === '/inventory-management' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Storeroom Logistics</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                SKU Inventories & Live Stock Buffer Metrics
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Gain seamless warehouse control. Deduct listed product margins dynamically as cashiers print, defining critical safe thresholds to stay stocked.
              </p>
            </div>

            {/* INTERACTIVE STOCK MANAGEMENT BOARD */}
            <div className="bg-white border border-slate-205 rounded-[2rem] p-6 md:p-8 shadow-3xs space-y-6">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wide">Live Warehouse Stock Buffer Monitor</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">SIMULATE TRADING OPERATIONS TO OBSERVE AUTOMATED SAFE-REORDER ALARMS</p>
                </div>
                <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md font-mono text-[9px] font-bold border border-red-100">Buffer Watcher</span>
              </div>

              {/* Stock item list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockStocks.map(item => {
                  const isLow = item.stock < item.minThreshold;
                  return (
                    <div key={item.id} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 ${
                      isLow ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-150'
                    }`}>
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-1 font-mono uppercase">SAFETY LIMIT: {item.minThreshold} {item.unit}</span>
                        </div>
                        {isLow ? (
                          <span className="px-2.5 py-1 bg-rose-100 border border-rose-200 text-rose-700 rounded-full font-bold text-[9px] tracking-wide uppercase font-mono animate-pulse">Low stock warning</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full font-bold text-[9px] tracking-wide uppercase font-mono">Optimal</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-left font-sans">
                          <span className="text-[10px] text-slate-400 block font-mono">STOCK QUANTITY</span>
                          <span className={`text-2xl font-black ${isLow ? 'text-rose-600' : 'text-slate-805'}`}>
                            {item.stock} <span className="text-xs font-bold text-slate-400">{item.unit}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              if (item.stock > 0) {
                                setMockStocks(mockStocks.map(ms => ms.id === item.id ? { ...ms, stock: ms.stock - 2 } : ms));
                                if (item.stock - 2 < item.minThreshold) {
                                  showToast(`Stock Alert: ${item.name} dropped below safe threshold!`);
                                }
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg font-bold text-[10px] uppercase transition cursor-pointer active:scale-95 shrink-0 border-none outline-none"
                          >
                            Simulate Sale (-2)
                          </button>
                          <button
                            onClick={() => {
                              setMockStocks(mockStocks.map(ms => ms.id === item.id ? { ...ms, stock: ms.stock + 10 } : ms));
                              showToast(`Restocked ${item.name} with 10 units.`);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[10px] uppercase transition cursor-pointer active:scale-95 shrink-0 border-none outline-none"
                          >
                            Restock (+10)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Automated Item Deduction</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">No manual duplicate ledger adjustments. Quantity logs decrement instantly as checkouts finalize, eliminating inventory gaps and manual labor at night.</p>
              </div>
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Sleek SKU Catalogs</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Map search items easily. Input selling rates, initial acquisition prices, tax percentages, reorder buffer counts, and category divisions dynamically.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: INVOICE GENERATOR (/invoice-generator) ==================== */}
        {currentPath === '/invoice-generator' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Perfect PDF/Print Formats</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                Online Invoice Generator & Retail Receipt Maker
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Compile beautiful billing receipts in seconds. Smart Vyapar renders high-contrast, structured drafts optimized to satisfy local trade and tax audits.
              </p>
            </div>

            {/* INTERACTIVE INVOICE LAYOUT TOGGLER */}
            <div className="bg-white border border-slate-205 rounded-[2rem] p-6 md:p-8 shadow-3xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wide">Tactile Receipt Format Configurator</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">TOGGLE PREFERENCES TO SEE PAPER SHEETS ADAPT IMMEDIATELY</p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => { setInvoiceFormat('A4'); showToast("Swapped layout to Executive A4 standard."); }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border-none outline-none ${invoiceFormat === 'A4' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Executive A4 Form
                  </button>
                  <button 
                    onClick={() => { setInvoiceFormat('thermal'); showToast("Swapped layout to Compact 80mm thermal receipt."); }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer border-none outline-none ${invoiceFormat === 'thermal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Thermal 80mm Cut
                  </button>
                </div>
              </div>

              {/* Watermark shop text input */}
              <div className="space-y-1 text-left text-xs font-semibold max-w-sm">
                <label className="text-[9px] text-slate-400 font-mono uppercase block">Customize Store Title Watermark</label>
                <input 
                  type="text" 
                  value={mockShopName}
                  onChange={(e) => setMockShopName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 rounded-lg outline-none font-bold"
                  placeholder="Enter Store Name"
                />
              </div>

              {/* Mock Receipt visual viewport */}
              <div className="flex justify-center bg-slate-100/55 rounded-2xl p-4 sm:p-6 overflow-hidden">
                <div className={`bg-white border border-slate-200/80 shadow-md p-6 text-left text-slate-800 transition-all duration-300 font-sans ${
                  invoiceFormat === 'thermal' ? 'max-w-[280px] w-full text-[10px]' : 'max-w-[420px] w-full text-xs'
                }`}>
                  <div className="border-b border-dashed border-slate-300 pb-3 text-center space-y-1">
                    <span className="font-black text-slate-900 text-sm tracking-tight uppercase block leading-none">{mockShopName || "My Retail Store"}</span>
                    <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">Tax CGST/SGST Register Ledger Receipt</p>
                    <p className="text-[8px] text-slate-400 font-mono tracking-wider">DATE: 2026-06-25 | BILL NO: SV-9482</p>
                  </div>

                  <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 font-mono">
                    <div className="flex justify-between"><span>Basmati Rice (3kg)</span> <span>₹285.00</span></div>
                    <div className="flex justify-between"><span>Fortune Oil (2Ltr)</span> <span>₹290.00</span></div>
                    <div className="flex justify-between text-indigo-600 font-bold"><span>CGST Split (9% / 2.5%)</span> <span>₹24.50</span></div>
                    <div className="flex justify-between text-indigo-600 font-bold"><span>SGST Split (9% / 2.5%)</span> <span>₹24.50</span></div>
                  </div>

                  <div className="pt-3 flex justify-between font-black text-slate-900 text-sm font-sans leading-none">
                    <span>NET TOTAL:</span>
                    <span>₹624.00</span>
                  </div>

                  {/* Payment QR watermark */}
                  <div className="mt-4 pt-4 border-t border-slate-150 flex flex-col items-center text-center space-y-1 font-sans">
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest font-bold">Unified UPI QR Pay</span>
                    <div className="h-14 w-14 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center p-1 relative">
                      <div className="w-full h-full bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-200 flex items-center justify-center rounded">
                        <QrCode className="h-7 w-7 text-indigo-600 stroke-[1.5]" />
                      </div>
                    </div>
                    <p className="text-[8px] text-slate-400 font-semibold">Scan with Paytm, GPay, or PhonePe</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Custom Header Monograms</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Solder your specialized company logo onto the document templates. Layouts dynamically scale to preserve strict grid borders without cluttering margins.</p>
              </div>
              <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Credit Buyer Balance Cards</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Direct balance ledger logs. Log unpaid accounts separate from cash collections, updating values, transaction histories, and printing summaries easily.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: BUSINESS ANALYTICS (/business-analytics) ==================== */}
        {currentPath === '/business-analytics' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Sales Intelligence</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                Retail Analytics, Profit Centers & Tax Auditing
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Visualize checkout velocity inside gorgeous Recharts bars. Divide CGST & SGST taxes, calculate cash inflows versus digital receipts, and subtract costs.
              </p>
            </div>

            {/* INTERACTIVE REVENUE BAR CHARTS AND SCALE DIAGRAM */}
            <div className="bg-white border border-slate-205 rounded-[2rem] p-6 md:p-8 shadow-3xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="space-y-0.5 text-left">
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wide">Interactive Store Scale Simulator</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">SLIDE VOLUME AND SEE KPI ESTIMATIONS ADJUST ACCORDINGLY</p>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px] font-bold">
                  Scale Factor: {volumeFactor.toFixed(1)}x
                </div>
              </div>

              {/* Slider Input */}
              <div className="space-y-2 text-left max-w-sm">
                <label className="text-[10px] text-slate-400 font-mono uppercase block">Scale Transaction Flow Volume</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.1"
                  value={volumeFactor}
                  onChange={(e) => setVolumeFactor(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Visual custom bar graphs */}
              <div className="space-y-4">
                <span className="text-[9px] text-slate-400 font-mono uppercase block text-left">Estimated Monthly Revenue Performance (Recharts Mock)</span>
                <div className="h-44 bg-slate-50 rounded-2xl border border-slate-150 p-4 flex items-end gap-3 sm:gap-6 justify-between relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[9px] text-slate-400 font-mono">Gross Volume: ₹{(125000 * volumeFactor).toFixed(0)}</div>
                  {[
                    { day: "Mon", height: 45 },
                    { day: "Tue", height: 60 },
                    { day: "Wed", height: 50 },
                    { day: "Thu", height: 75 },
                    { day: "Fri", height: 95 },
                    { day: "Sat", height: 120 },
                    { day: "Sun", height: 110 },
                  ].map((item, idx) => {
                    const scaledHeight = Math.min(100, item.height * (volumeFactor * 0.8));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center space-y-2 group">
                        <div className="w-full bg-slate-200 hover:bg-slate-300 rounded-lg h-32 flex items-end relative overflow-hidden transition-all duration-300">
                          <motion.div 
                            style={{ height: `${scaledHeight}%` }}
                            className="w-full bg-gradient-to-t from-indigo-600 to-blue-500 rounded-lg shadow-inner"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scaled KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-left">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Gross Margin (65%)</span>
                  <span className="text-lg font-black text-slate-905 block mt-0.5">₹{(81250 * volumeFactor).toFixed(0)}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">CGST Collected</span>
                  <span className="text-lg font-black text-indigo-600 block mt-0.5">₹{(11250 * volumeFactor).toFixed(0)}</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block uppercase">Average Basket Size</span>
                  <span className="text-lg font-black text-slate-905 block mt-0.5">₹{(845 * (1 + volumeFactor * 0.05)).toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-slate-205 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Peak Checkout Distributions</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Map hourly transaction counts easily. Highlight high-traffic windows to allocate staff resources efficiently, protecting cash registers during rushes.</p>
              </div>
              <div className="p-8 bg-white border border-slate-205 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Quarterly Tax Accounting</span>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">Trace total CGST & SGST liability segments separate from net profits. Save time preparing financial books for tax filing periods.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PRODUCT RoadMap & CHANGELOG UPDATES (/updates) ==================== */}
        {currentPath === '/updates' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Product History</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                Product RoadMap & Platform Changelogs
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Trace our roadmap logs, EAN/UPC hardware integration cycles, receipt formatting patches, and live sync optimization milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Selector Nodes */}
              <div className="md:col-span-4 space-y-2">
                {[
                  { version: "v1.0", title: "Commercial Sync Launch", tag: "Production" },
                  { version: "v0.9", title: "PO & Supplier Management", tag: "Major Feature" },
                  { version: "v0.8", title: "Unified UPI QR Codes", tag: "Optimization" },
                ].map((item) => (
                  <button
                    key={item.version}
                    onClick={() => { setActiveVersion(item.version); showToast(`Viewing roadmap release details: ${item.version}`); }}
                    className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      activeVersion === item.version
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[9px] font-bold uppercase font-mono opacity-80">
                      <span>{item.version}</span>
                      <span className={`px-1.5 py-0.5 rounded ${activeVersion === item.version ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.tag}</span>
                    </div>
                    <h4 className="text-xs font-black mt-1.5">{item.title}</h4>
                  </button>
                ))}
              </div>

              {/* Right Detail Panel */}
              <div className="md:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 text-left space-y-4 shadow-3xs">
                {activeVersion === 'v1.0' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-widest font-black block">Release Milestone: Version 1.0 (Live)</span>
                    <h3 className="text-xl font-black text-slate-905">Google Firestore Sync & Cloud Auth Relay</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Officially connected Google Accounts OAuth credential gateway with private Firestore cluster backup schemas. Allows independent retailers to sync, backup, and restore inventory ledger nodes on-demand.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 font-sans pt-2 border-t border-slate-100">
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Google accounts workspace profile backup adapters</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Dual client offline cache recovery structures</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">80mm thermal receipt coupon alignments in Settings</span></li>
                    </ul>
                  </motion.div>
                )}
                {activeVersion === 'v0.9' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-widest font-black block">Release Milestone: Version 0.9 (Pre-launch)</span>
                    <h3 className="text-xl font-black text-slate-905">AI Procurement & Purchase Orders</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Introduced our velocity-based catalog stocking assistant. Instantly predict stock run-out schedules, generate PDF reorders for vendors, and export pristine merchant logs into Excel formats.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 font-sans pt-2 border-t border-slate-100">
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Excel format operational sheet exporters</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">AI velocity forecasting reorder calculations</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Supplier procurement vendor profiles manager</span></li>
                    </ul>
                  </motion.div>
                )}
                {activeVersion === 'v0.8' && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <span className="text-[10px] text-indigo-600 font-mono uppercase tracking-widest font-black block">Release Milestone: Version 0.8 (Alpha)</span>
                    <h3 className="text-xl font-black text-slate-905">Unified Scan-to-Pay QR Codes</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Automated bottom receipt watermark codes. Embed PhonePe, Paytm or Google Pay paycodes on compact print receipts to eliminate calculation query steps at cash desks.
                    </p>
                    <ul className="space-y-2 text-xs font-semibold text-slate-700 font-sans pt-2 border-t border-slate-100">
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Dynamic paycode generation watermarking</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Divided tax CGST and SGST receipt margins</span></li>
                      <li className="flex items-start gap-2">✔ <span className="text-slate-500">Laser hotkey F2 hardware focus window</span></li>
                    </ul>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== COMPLIANCE & GST SUPPORT (/gst-support) ==================== */}
        {currentPath === '/gst-support' && (
          <div className="space-y-12 max-w-4xl mx-auto text-left font-sans animate-fade-in">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Regional Compliance Masterclass</span>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mt-2">
                GST Support, CGST/SGST Division & Calculator
              </h1>
              <p className="text-sm text-slate-550 leading-relaxed font-semibold max-w-2xl">
                Smart Vyapar supports 100% compliant Indian GST invoicing standards. Instantly split CGST, SGST, IGST tax bounds, configure tax slabs, and preview tax reports.
              </p>
            </div>

            {/* INTERACTIVE GST CALCULATOR */}
            <div className="bg-white border border-slate-205 rounded-[2rem] p-6 md:p-8 shadow-3xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3 text-left">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-905 uppercase tracking-wide">Interactive CGST & SGST Split Auditing Tool</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">ENTER A BASE RATE AND TAX SLAB TO INSTANTLY PROCESS EXCISE RATIOS</p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[9px] font-bold">GST Standard: 2026 Code</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input base amount */}
                <div className="space-y-1.5 text-left text-xs font-semibold">
                  <label className="text-[10px] text-slate-400 font-mono uppercase block">Base Amount (₹)</label>
                  <input 
                    type="number"
                    value={gstAmount}
                    onChange={(e) => setGstAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 rounded-lg outline-none font-bold text-slate-800"
                    placeholder="1000"
                  />
                </div>

                {/* Select tax rate */}
                <div className="space-y-1.5 text-left text-xs font-semibold">
                  <label className="text-[10px] text-slate-400 font-mono uppercase block">Select GST Slab Percentage</label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 rounded-lg outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={5}>5% (Essential Goods)</option>
                    <option value={12}>12% (Standard Consumables)</option>
                    <option value={18}>18% (Standard Services / Spares)</option>
                    <option value={28}>28% (Luxury Items)</option>
                  </select>
                </div>

                {/* Exclusive vs Inclusive */}
                <div className="space-y-1.5 text-left text-xs font-semibold">
                  <label className="text-[10px] text-slate-400 font-mono uppercase block">Tax Treatment Method</label>
                  <div className="flex bg-slate-55 p-1 rounded-lg">
                    <button
                      onClick={() => setGstType('exclusive')}
                      className={`flex-1 py-1.5 font-bold text-[10px] rounded transition-all cursor-pointer border-none outline-none ${gstType === 'exclusive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      GST Exclusive
                    </button>
                    <button
                      onClick={() => setGstType('inclusive')}
                      className={`flex-1 py-1.5 font-bold text-[10px] rounded transition-all cursor-pointer border-none outline-none ${gstType === 'inclusive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                      GST Inclusive
                    </button>
                  </div>
                </div>
              </div>

              {/* Live GST split calculations layout */}
              <div className="pt-6 border-t border-slate-100 bg-slate-50/55 rounded-2xl p-5 text-left font-mono text-[11px] font-bold text-slate-500 grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const amt = parseFloat(gstAmount) || 0;
                  const rate = gstRate;
                  let taxable = 0;
                  let totalGst = 0;
                  let finalTotal = 0;

                  if (gstType === 'exclusive') {
                    taxable = amt;
                    totalGst = amt * (rate / 100);
                    finalTotal = amt + totalGst;
                  } else {
                    taxable = amt / (1 + (rate / 100));
                    totalGst = amt - taxable;
                    finalTotal = amt;
                  }

                  const cgstSplit = totalGst / 2;
                  const sgstSplit = totalGst / 2;

                  return (
                    <>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase font-mono tracking-wider">Taxable value</span>
                        <span className="text-base font-black text-slate-905 block mt-0.5 font-sans">₹{taxable.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-indigo-600 uppercase font-mono tracking-wider">CGST Share (50%)</span>
                        <span className="text-base font-black text-indigo-600 block mt-0.5 font-sans">₹{cgstSplit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-indigo-600 uppercase font-mono tracking-wider">SGST Share (50%)</span>
                        <span className="text-base font-black text-indigo-600 block mt-0.5 font-sans">₹{sgstSplit.toFixed(2)}</span>
                      </div>
                      <div className="md:border-l border-slate-200 md:pl-6">
                        <span className="block text-[9px] text-emerald-500 uppercase font-mono tracking-wider">Gross Payable Total</span>
                        <span className="text-base font-black text-emerald-700 block mt-0.5 font-sans">₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Structured Compliance Comparison table */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Understanding Composition vs Regular Schemes</h3>
              <p className="text-xs text-slate-500 font-semibold">Review how different fiscal registration classes manage tax invoices under local rules:</p>
              
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs font-semibold text-slate-600">
                <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-1 md:grid-cols-3 font-black text-slate-900">
                  <div>Operational Metric</div>
                  <div>Composition Scheme (Micro)</div>
                  <div>Regular Scheme (Standard)</div>
                </div>
                <div className="border-b border-slate-100 p-4 grid grid-cols-1 md:grid-cols-3 leading-relaxed">
                  <div className="font-bold text-slate-900">Annual turnover cap</div>
                  <div>Up to ₹1.5 Crores</div>
                  <div>No upper threshold limits</div>
                </div>
                <div className="border-b border-slate-100 p-4 grid grid-cols-1 md:grid-cols-3 leading-relaxed">
                  <div className="font-bold text-slate-900">Tax Invoice rights</div>
                  <div>Trigger generic "Bill of Supply" coupon</div>
                  <div>Can generate standard divided GST invoices</div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 leading-relaxed">
                  <div className="font-bold text-slate-900">Tax rate obligations</div>
                  <div>Flat 1% to 6% (cannot claim tax inputs)</div>
                  <div>Standard slabs: 5%, 12%, 18%, 28% (claimable inputs)</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ==================== BRANDED SECURE LOGIN PAGE (/login) ==================== */}
        {currentPath === '/login' && (
          <div className="w-full max-w-md mx-auto pt-6 sm:pt-8 pb-12 animate-fade-in text-center px-4 sm:px-0">
            
            {/* Center Container Card */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between space-y-6 text-left">
              
              <div className="space-y-5">
                <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Sign In to <span className="text-blue-600 break-words">Smart Vyapar</span>
                    </h1>
                  </div>
                  <button
                    onClick={(e) => handleLinkClick(e, '/')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-650 hover:text-slate-905 text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer outline-none active:scale-95 shrink-0"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </div>

                {authErrorLocal && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-rose-50/40 border-l-[4px] border-l-rose-500 border border-rose-200/60 rounded-2xl p-4 flex items-start gap-3.5 shadow-3xs"
                  >
                    <div className="bg-rose-100/60 p-2 rounded-xl text-rose-600">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-rose-950">Authentication Issue</h4>
                      <p className="text-[11px] font-semibold text-rose-800 leading-relaxed">{authErrorLocal}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleLocalLoginSubmit} className="space-y-4 font-semibold text-xs text-slate-700">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Gmail Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. rajesh.store@gmail.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Gmail Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        placeholder="Enter Gmail password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 cursor-pointer outline-none border-none p-0 bg-transparent flex items-center justify-center"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex justify-center items-center gap-2 cursor-pointer border-none"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Account...</span>
                      </>
                    ) : (
                      <span>Secure login</span>
                    )}
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-150"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[8px] font-mono font-extrabold uppercase tracking-widest">or sign in with google</span>
                  <div className="flex-grow border-t border-slate-150"></div>
                </div>

                <button
                  onClick={() => handleLocalGoogleAuth(false)}
                  disabled={authLoading}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2.5 transition duration-200 cursor-pointer shadow-3xs"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.242-3.123C18.28 1.09 15.5 0 12.24 0 5.523 0 0 5.373 0 12s5.523 12 12.24 12c7.03 0 11.7-4.82 11.7-11.7 0-.79-.08-1.393-.19-2.015H12.24z" />
                    </svg>
                  )}
                  <span>Google Workspace Sign In</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-150 text-center text-xs text-slate-500 font-semibold">
                <span>Want a new store record? </span>
                <a 
                  href="/signup" 
                  onClick={(e) => handleLinkClick(e, '/signup')} 
                  className="text-indigo-600 hover:text-indigo-700 hover:underline inline font-bold transition"
                >
                  Register Workspace Here
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BRANDED SECURE SIGN UP PAGE (/signup) ==================== */}
        {currentPath === '/signup' && (
          <div className="w-full max-w-md mx-auto pt-6 sm:pt-8 pb-12 animate-fade-in text-center px-4 sm:px-0">
            
            {/* Center Container Card */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between space-y-6 text-left">
              
              <div className="space-y-5">
                <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      Register with <span className="text-blue-600 break-words">Smart Vyapar</span>
                    </h1>
                  </div>
                  <button
                    onClick={(e) => handleLinkClick(e, '/')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 text-slate-650 hover:text-slate-905 text-[10px] font-black uppercase tracking-wider rounded-xl transition duration-200 flex items-center space-x-1.5 cursor-pointer outline-none active:scale-95 shrink-0"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </div>

                {authErrorLocal && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-rose-50/40 border-l-[4px] border-l-rose-500 border border-rose-200/60 rounded-2xl p-4 flex items-start gap-3.5 shadow-3xs"
                  >
                    <div className="bg-rose-100/60 p-2 rounded-xl text-rose-600">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-rose-950">Registration Failed</h4>
                      <p className="text-[11px] font-semibold text-rose-800 leading-relaxed">{authErrorLocal}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleLocalSignupSubmit} className="space-y-4 font-semibold text-xs text-slate-700">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Owner Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Rajesh Kumar"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Gmail Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. rajesh.store@gmail.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Gmail Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type={showPasswordReg ? "text" : "password"} 
                        required
                        placeholder="Enter Gmail password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordReg(!showPasswordReg)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 cursor-pointer outline-none border-none p-0 bg-transparent flex items-center justify-center"
                      >
                        {showPasswordReg ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-2 flex justify-center items-center gap-2 cursor-pointer border-none"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Initializing Workspace...</span>
                      </>
                    ) : (
                      <span>Create & Launch Workspace</span>
                    )}
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-150"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-[8px] font-mono font-extrabold uppercase tracking-widest">or register with google</span>
                  <div className="flex-grow border-t border-slate-150"></div>
                </div>

                <button
                  onClick={() => handleLocalGoogleAuth(true)}
                  disabled={authLoading}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2.5 transition duration-200 cursor-pointer shadow-3xs"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" width="16" height="16">
                      <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.242-3.123C18.28 1.09 15.5 0 12.24 0 5.523 0 0 5.373 0 12s5.523 12 12.24 12c7.03 0 11.7-4.82 11.7-11.7 0-.79-.08-1.393-.19-2.015H12.24z" />
                    </svg>
                  )}
                  <span>Register Workspace with Google</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-150 text-center text-xs text-slate-500 font-semibold">
                <span>Already registered with us? </span>
                <a 
                  href="/login" 
                  onClick={(e) => handleLinkClick(e, '/login')} 
                  className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold transition"
                >
                  Sign In to Workspace
                </a>
              </div>
            </div>
          </div>
        )}

      </main>
      </div>

      {/* Global Footer */}
      <footer className="relative bg-[#020205] text-slate-300 pt-32 pb-12 px-8 text-left shrink-0 overflow-hidden select-none -mt-10 z-10">
        {/* Subtle Decorative Ambient Lighting */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[10000ms]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[7000ms] delay-1000" />

        <div className="max-w-7xl mx-auto space-y-16 relative z-10">
          
          {/* TOP SECTION: Name of app + logo, description, and status badges (First section of footer as requested) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 border-b border-slate-800/50 pb-12">
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-md opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <img 
                    src="/apple-touch-icon.png" 
                    alt="Smart Vyapar Logo" 
                    className="relative h-16 w-16 rounded-2xl object-contain border border-slate-700/50 bg-slate-900 p-2 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="leading-tight">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight block font-sans">Smart Vyapar</span>
                  <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono mt-1 block opacity-80">Workspace OS v1.0</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium max-w-md">
                Sleek offline-first billing & inventory ecosystem for micro-merchants. Design invoices, monitor stocks, and synchronize securely with Cloud FireStore.
              </p>
            </div>
            
            {/* Premium Verification Badges and Quick Stats */}
            <div className="flex flex-wrap gap-4 shrink-0">
              <span className="inline-flex items-center space-x-2 bg-slate-900/50 backdrop-blur-sm border border-emerald-500/20 text-xs font-bold text-emerald-400 px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/5 hover:border-emerald-500/40 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Firestore Sync Live</span>
              </span>
              <span className="inline-flex items-center space-x-2 bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 text-xs font-bold text-blue-400 px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/5 hover:border-blue-500/40 transition-colors cursor-default">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>99.9% Uptime SLA</span>
              </span>
            </div>
          </div>

          {/* GRID OF LINKS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Col 1: Main Directory Links */}
            <div className="space-y-4 text-sm font-semibold">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider font-sans border-l-2 border-blue-500 pl-2.5">Quick Links</h5>
              <ul className="space-y-2 font-bold text-slate-400">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Features', path: '/features' },
                  { label: 'About Us', path: '/about' },
                  { label: 'FAQ', path: '/faq' },
                  { label: 'Blog', path: '/blog' },
                  { label: 'Contact', path: '/contact' }
                ].map(link => (
                  <li key={link.path}>
                    <a 
                      href={link.path} 
                      onClick={(e) => handleLinkClick(e, link.path)}
                      className={`hover:text-blue-400 hover:pl-1 transition-all duration-150 block ${
                        currentPath === link.path || (link.path === '/blog' && currentPath.startsWith('/blog/'))
                          ? 'text-blue-400 font-extrabold' 
                          : 'text-slate-400'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2: Product Features */}
            <div className="space-y-4 text-sm font-semibold">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider font-sans border-l-2 border-blue-500 pl-2.5">Features</h5>
              <ul className="space-y-2 font-bold text-slate-400">
                <li>
                  <a href="/" onClick={(e) => handleLinkClick(e, '/')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Dashboard</a>
                </li>
                <li>
                  <a href="/features" onClick={(e) => handleLinkClick(e, '/features')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Try Sandbox</a>
                </li>
                <li>
                  <a href="/faq" onClick={(e) => handleLinkClick(e, '/faq')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">GST Support</a>
                </li>
                <li>
                  <a href="/blog" onClick={(e) => handleLinkClick(e, '/blog')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Updates</a>
                </li>
              </ul>
            </div>

            {/* Col 3: Capabilities */}
            <div className="space-y-4 text-sm font-semibold">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider font-sans border-l-2 border-blue-500 pl-2.5">Solutions</h5>
              <ul className="space-y-2 font-bold text-slate-400">
                <li>
                  <a href="/billing-software" onClick={(e) => handleLinkClick(e, '/billing-software')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Invoicing</a>
                </li>
                <li>
                  <a href="/inventory-management" onClick={(e) => handleLinkClick(e, '/inventory-management')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Inventory</a>
                </li>
                <li>
                  <a href="/invoice-generator" onClick={(e) => handleLinkClick(e, '/invoice-generator')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Receipts</a>
                </li>
                <li>
                  <a href="/business-analytics" onClick={(e) => handleLinkClick(e, '/business-analytics')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Analytics</a>
                </li>
              </ul>
            </div>

            {/* Col 4: Store Operations */}
            <div className="space-y-4 text-sm font-semibold">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider font-sans border-l-2 border-blue-500 pl-2.5">Legal & Support</h5>
              <ul className="space-y-3 font-bold text-slate-400">
                <li>
                  <a href="/privacy-policy" onClick={(e) => handleLinkClick(e, '/privacy-policy')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms" onClick={(e) => handleLinkClick(e, '/terms')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Terms of Service</a>
                </li>
                <li>
                  <a href="/contact" onClick={(e) => handleLinkClick(e, '/contact')} className="hover:text-blue-400 hover:pl-1 transition-all duration-150 block text-slate-400">Support</a>
                </li>
              </ul>
            </div>

            {/* Col 5: App Download & Offline Access */}
            <div className="space-y-4 text-sm font-semibold">
              <h5 className="font-extrabold text-white text-xs uppercase tracking-wider font-sans border-l-2 border-emerald-500 pl-2.5">Offline App Access</h5>
              <div className="space-y-3 text-slate-400">
                <p className="text-xs leading-relaxed font-semibold">
                  Install Smart Vyapar directly on your phone or home PC for lightning-speed checkouts and zero latency.
                </p>
                <button
                  onClick={async () => {
                    if (installProgress !== null) return;
                    runInstallProcess(async () => {
                      try {
                        const promptEvent = (window as any).deferredInstallPrompt;
                        if (promptEvent) {
                          await promptEvent.prompt();
                          const { outcome } = await promptEvent.userChoice;
                          if (outcome === 'accepted') {
                            (window as any).deferredInstallPrompt = null;
                            showToast("Smart Vyapar is launching and preparing local layout databases!", "success");
                          }
                        } else {
                          showConfirm({
                            title: "App Installation Guide",
                            message: "To install Smart Vyapar: Open the application in a new browser tab/window, then select 'Add to Home screen' or 'Install page as app' from your browser's menu. This works in Chrome, Edge, and Safari.",
                            confirmText: "Got it",
                            type: "info",
                            onConfirm: () => {}
                          });
                        }
                      } catch (e) {
                        console.warn("PWA prompt error", e);
                        showConfirm({
                          title: "App Installation",
                          message: "Your browser might restrict direct installation. Please use your browser menu options (e.g., 'Add to Home Screen' or 'Install App') instead.",
                          confirmText: "Okay",
                          type: "info",
                          onConfirm: () => {}
                        });
                      }
                    });
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-indigo-500/20 active:translate-y-0.5 cursor-pointer transition"
                >
                  <Smartphone className="w-4 h-4 text-cyan-200" />
                  <span>Install Web App</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sleek & Premium Copyright Row */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-800/60 relative">
          
          {/* Copyright & Brand */}
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 shadow-sm">
              <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <p>
              © {new Date().getFullYear()} <span className="text-slate-200 font-semibold">Smart Vyapar</span>. All rights reserved.
            </p>
          </div>

          {/* Minimal Developer Tag */}
          <div className="flex items-center gap-4 bg-slate-900/40 hover:bg-slate-900/80 transition-colors duration-300 rounded-full pl-2 pr-5 py-2 border border-slate-800/80 group">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-600/50 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Crafted By</span>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors duration-300">RAGHAV PRATAP</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Premium Install Progress Overlay/Modal */}
      {installProgress !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none text-slate-900">
          <div
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
                <div 
                  style={{ width: `${installProgress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-inner transition-all duration-150 ease-out"
                />
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase animate-pulse">
              Please do not close this window
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
