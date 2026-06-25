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
  Loader2
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import dashboardMockup from '../assets/images/dashboard_mockup_new_1782007870837.jpg';
import analyticsMockup from '../assets/images/analytics_mockup_new_1782007915906.jpg';
import inventoryMockup from '../assets/images/inventory_mockup_new_1782007902629.jpg';
import billingMockup from '../assets/images/billing_mockup_new_1782007887113.jpg';
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

  // Sandbox states & inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorLocal, setAuthErrorLocal] = useState('');

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
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 relative z-10 select-none">
      
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
              Vyapar<span className="text-blue-600 font-extrabold ml-0.5 font-sans">Mitra</span>
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
      <main id="main-content-area" className="flex-grow max-w-7xl w-full mx-auto px-6 py-0 md:py-2">
                {/* ==================== HOME PAGE (/) ==================== */}
        {currentPath === '/' && (
          <div className="space-y-12 md:space-y-24">
            
            {/* ULTRA-PREMIUM CLEAN HERO SECTION */}
            <div className="relative pt-12 pb-16 md:pt-16 md:pb-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8 select-none">
              {/* Subtle Ambient Glow Spots */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500/10 to-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Left Content */}
              <div className="flex-1 space-y-8 text-center lg:text-left relative z-10 w-full">
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

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
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

                <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-sm font-semibold text-slate-500">
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
              <div className="flex-1 relative w-full lg:max-w-none mx-auto mt-8 lg:mt-0 lg:pl-10">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-blue-500/20 to-purple-500/20 rounded-[3rem] blur-3xl transform rotate-2 scale-105" />
                 <div className="relative rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-indigo-500/25 p-2 shadow-[0_30px_100px_rgba(99,102,241,0.18)] overflow-hidden transform md:-rotate-2 hover:rotate-0 hover:scale-[1.02] hover:border-indigo-500/40 transition-all duration-500">
                   <div className="absolute top-0 inset-x-0 h-10 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center px-5 gap-2">
                     <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                     <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                     <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                   </div>
                   <div className="mt-10 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/50 aspect-video lg:aspect-auto">
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
            <div id="cta-notification-banner" className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/20 text-white rounded-[2.5rem] p-8 md:p-14 text-left relative overflow-hidden shadow-[0_30px_90px_rgba(30,41,59,0.7)] max-w-5xl mx-auto select-none group hover:border-indigo-500/40 transition-colors duration-500">
              {/* Dynamic Ambient Neon Radial Shines */}
              <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-500/10 to-blue-500/15 rounded-full blur-[100px] pointer-events-none group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute -bottom-10 -left-10 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl space-y-5">
                <span className="inline-flex items-center space-x-2 text-[10px] text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full font-mono font-bold tracking-widest uppercase border border-indigo-500/20 leading-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Active Registration Open</span>
                </span>
                
                <h3 className="text-2xl md:text-3.5xl font-black tracking-tight text-white leading-snug font-sans">
                  Onboard Your Shop Ledgers onto the <br className="hidden md:inline" />
                  Most Trusted Smart Vyapar Ecosystem
                </h3>
                
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-semibold">
                  Stop looking up manual ledger lists. Implement Smart Vyapar on your browser or home computer now to gain advanced inventory forecasting, unified customer payment ledger tracking, and secure Firebase synchronization.
                </p>
                
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <button
                    onClick={(e) => handleLinkClick(e, '/signup')}
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.01] transition-all duration-200 inline-flex items-center justify-center space-x-1.5 uppercase tracking-wide cursor-pointer text-center"
                  >
                    <span>Create Free Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleLinkClick(e, '/features')}
                    className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all duration-200 inline-flex items-center justify-center space-x-1.5 uppercase tracking-wide cursor-pointer text-center"
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
          <div className="space-y-12 animate-fade-in">
            <div className="max-w-3xl text-left space-y-3">
              <span className="px-3.5 py-1 bg-indigo-55 text-indigo-700 bg-indigo-50 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Capabilities Layout</span>
              <h1 className="text-3xl md:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                An Executive Feature Set Built to Mitigate Store Leakages
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-xl font-semibold">
                Designed with zero operational latency. Access critical billing records and inventories during local blackouts and sync safely once the connection re-establishes.
              </p>
            </div>

            {/* Bento Card Grid mapping to real components */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Receipt, title: "GST/Tax Invoice Generation", desc: "Ditch manual calculation. Divide CGST & SGST taxes instantly, configure customized buyer records, apply discount rates inside individual line items, and compile 80mm thermal/A4 templates." },
                { icon: Package, title: "Active Inventory Alerts & Buffers", desc: "Input minimum threshold safety quantities per SKU. The system lights up warning badges the millisecond transactions finalize, keeping your stock lines perfectly populated." },
                { icon: Zap, title: "Hybrid Cache & Offline Resiliency", desc: "No local network delays. The application's offline ledger holds invoicing and catalog data locally in browser cache structures, allowing cashiers to checkout without interruption." },
                { icon: TrendingUp, title: "Dynamic Revenue Tracking", desc: "Review real-time calculations detailing gross turnover, average basket sizes, net profit lines, custom tax obligations, and peak sales distribution schedules." },
                { icon: Sparkles, title: "AI Velocity-Based Replenishment", desc: "Our forecasting tool evaluates recent transaction items to calculate velocity rates. Instantly generate recommended reorder numbers to stock up intelligently." },
                { icon: Database, title: "Supplier Purchase Order Workspace", desc: "Compile complete PO lists matching parts to Supplier Vendor structures. Create drafts, track shipment items, handle receiving status logs, and configure supplier accounting histories." },
                { icon: Users, title: "Credit Customer Outstandings", desc: "Keep track of credit clients and client ledgers. Update partial payments, record payment modes (Cash / UPI / Cards), and trace chronological balance reports." },
                { icon: Lock, title: "Secure Google Accounts Sync", desc: "Authenticate with certified OAuth gates to sync configurations and sales histories seamlessly over encrypted Firebase document streams." },
                { icon: Smartphone, title: "PWA Mobile App Integration", desc: "Install the dashboard directly. Supports offline mobile operations with manual sku typing or direct device-camera barcode scan tracking." }
              ].map((comp, idx) => (
                <div key={idx} className="p-6 bg-white border border-slate-200/80 rounded-2xl text-left flex flex-col justify-between shadow-3xs hover:border-indigo-200 transition-all duration-300">
                  <div className="space-y-4">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100/40">
                      <comp.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">{comp.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{comp.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* QR dynamic watermark block */}
            <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden text-left border border-slate-800 shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10 max-w-xl space-y-4">
                <span className="inline-block text-[10px] text-indigo-300 bg-indigo-500/25 px-3 py-1 rounded-full font-mono font-bold tracking-widest uppercase border border-indigo-500/20 leading-none">Unified Scan to Pay</span>
                <h2 className="text-2xl md:text-3.5xl font-black tracking-tight text-white leading-tight">Instant UPI QR Receipt Watermarks</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Smart Vyapar watermarks digital Paytm, PhonePe, or Google Pay UPI QR paycodes dynamically on the bottom margins of standard bills. This skips payment-link queries at the cache desk, speeding up cashier lines.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ABOUT US PAGE (/about) ==================== */}
        {currentPath === '/about' && (
          <div className="space-y-12 max-w-4xl mx-auto animate-fade-in text-left">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">Our Core Vision</span>
              <h1 className="text-3xl md:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Empowering Local Merchants with Advanced Digital Ledger Frameworks
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold max-w-2xl">
                Smart Vyapar was born from a fundamental objective: small business owners, local utility stores, and retail boutiques shouldn't have to suffer bloated, expensive billing systems just to track their products and tax filings. We engineered Smart Vyapar to be fast, private, compliant, and exceptionally reliable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs hover:border-indigo-200 transition-colors">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Mitigating Inventory & Tax Leakages</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  We designed this platform around a 0% entry barrier. Providing a 100% free offline-resilient sandbox that handles GST-divided invoices, stock counters, customer payments, profit margins, and peak analytics saves retail owners hundreds of calculation hours.
                </p>
              </div>

              <div className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-3xs hover:border-indigo-200 transition-colors">
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Pristine Merchant Data Sovereignty</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Unlike corporate platforms that scrap stock records, catalog prices, or client directories to monetize them inside third-party advertising grids, Smart Vyapar maintains rigid boundaries. Your ledger remains on your local browser database, syncing exclusively to your authorized secure Firestore clusters.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-tr from-slate-905 to-indigo-950 text-white p-6 md:p-10 rounded-3xl border border-slate-800 shadow-xl space-y-6 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    onClick={() => setShowAiAvatar(!showAiAvatar)}
                    className="relative h-14 w-14 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:ring-2 hover:ring-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 focus:outline-none shrink-0"
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
                           className="h-full w-full rounded-xl bg-gradient-to-tr from-indigo-650 to-indigo-850 text-white font-black flex items-center justify-center text-lg shadow-inner font-sans"
                        >
                           RP
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-[8px] text-white font-extrabold tracking-wider uppercase">
                      <span>Toggle</span>
                      <span className="text-[7px] text-indigo-300 font-mono">RP</span>
                    </div>
                  </button>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-white tracking-tight leading-none">RAGHAV PRATAP</h3>
                    <p className="text-[10px] text-indigo-350 font-bold uppercase tracking-wider mt-1.5">Owner & Principal Architect</p>
                  </div>
                </div>
                <p className="text-xs text-slate-355 leading-relaxed font-semibold">
                  Smart Vyapar in its entirety is formulated, customized, and owned wholly by developer Raghav Pratap. Focused on streamlining retail ledger logic, Raghav compiled this offline caching workspace with direct Firestore cloud adapters and 100% compliant receipt layouts so you can manage your shop floors with speed and certainty.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FAQ ACCORDION (/faq) ==================== */}
        {currentPath === '/faq' && (
          <div className="space-y-12 max-w-3xl mx-auto text-left animate-fade-in">
            <div className="text-center space-y-3">
              <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">Merchant Helpdesk</span>
              <h1 className="text-3xl md:text-4.5xl font-extrabold text-slate-900 tracking-tight leading-none">
                Frequently Asked Inquiries
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-semibold max-w-lg mx-auto leading-relaxed">
                Review answers regarding GST divided calculations, A4 / compact thermal receipt outputs, custom barcode scanners, and Firestore live data synchronization.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  q: "What features are offered in Smart Vyapar's free Sandbox Mode?",
                  a: "Smart Vyapar is completely unrestricted in local Sandbox Mode! You can record products, manage safe stock buffers, create GST-compliant bills apply line-item cash discounts, calculate net earnings, track credit ledger clients, print standard A4 or 80mm thermal receipts, and view detailed Recharts profit telemetry with zero monthly subscription fees."
                },
                {
                  q: "How does the offline-first ledger cache operate during internet power loss?",
                  a: "If local internet connections fail, our local caching shell ensures seamless operation. Sales checkouts compile at high speed, inventories deduct correctly in natural time, and invoices are held safely inside browser cookies/storage. The moment network is restored, you can back up and sync your logs back to Firestore on-demand."
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
              ].map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 transition-colors duration-200 shadow-3xs"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 hover:text-indigo-650 transition cursor-pointer"
                  >
                    <span className="text-xs font-black text-slate-800 tracking-tight">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>
                  
                  {activeFaq === idx && (
                    <div className="px-6 pb-5 pt-1.5 border-t border-slate-100 text-xs text-slate-500 font-semibold leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-700 text-white p-8 rounded-3xl text-center space-y-4 shadow-xl border border-white/10 relative overflow-hidden">
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
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 rounded-full font-sans text-xs font-bold uppercase tracking-widest border border-indigo-100">Merchant Digest</span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none animate-fade-in">
                Smart Vyapar Journal
              </h1>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
                Stay updated with professional merchant advice covering catalog velocity tracking, GST CGST/SGST tax compliance, and cash-flow leakages.
              </p>
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
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-[9px] text-white font-bold tracking-wider uppercase">
                  <span>Toggle</span>
                </div>
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
              ].map((post) => (
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

            <div className="p-8 md:p-10 bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-8 border border-slate-800 shadow-xl overflow-hidden relative">
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
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow transition shrink-0 cursor-pointer text-center"
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
                  href="mailto:support.vyaparmitra@gmail.com"
                  className="group flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 hover:bg-indigo-705 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-300 transform active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center h-6 w-6 rounded-md bg-white/10 text-white shrink-0">
                    <Mail className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <span>Email: support.vyaparmitra@gmail.com</span>
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
          <div className="space-y-8 max-w-3xl mx-auto text-left animate-fade-in">
            <div className="border-b border-slate-150 pb-4">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Privacy Policy</h1>
              <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-1.5 uppercase">Last Revised: June 20, 2026</p>
            </div>
            <div className="space-y-4 text-xs text-slate-650 font-semibold leading-relaxed">
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-3xs">
                <span className="font-extrabold text-slate-900 block mb-1 text-sm tracking-tight">1. Local Device Boundary Isolations</span>
                <p>Smart Vyapar operates on an offline-first caching framework. Your catalogs, lists, pricing indexes, reorder thresholds, and active customer ledger cards remain 100% localized within your browser storage structure until you choose to configure a secure Google document mirrored backup via Firebase.</p>
              </div>
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-3xs">
                <span className="font-extrabold text-slate-900 block mb-1 text-sm tracking-tight">2. Secure Google Authentication Procedure</span>
                <p>Establishing synchronizations directs ledger traffic cleanly over certified system Google OAuth tokens, completely isolating commercial profiles from secondary advertising brokers or data mining grids.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TERMS & CONDITIONS (/terms) ==================== */}
        {currentPath === '/terms' && (
          <div className="space-y-8 max-w-3xl mx-auto text-left animate-fade-in">
            <div className="border-b border-slate-150 pb-4">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Terms & Conditions</h1>
              <p className="text-[10px] text-slate-400 font-bold font-mono tracking-wider mt-1.5 uppercase">Last Revised: June 20, 2026</p>
            </div>
            <div className="space-y-4 text-xs text-slate-650 font-semibold leading-relaxed font-sans">
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-3xs">
                <span className="font-extrabold text-slate-900 block mb-2 text-sm tracking-tight">1. Sandbox Operations</span>
                <p>Merchants operate the local device cache layers and local thermal print components at zero cost. Sandbox utilities are entirely free of monthly quota bounds or platform billing codes.</p>
              </div>
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-3xs">
                <span className="font-extrabold text-slate-900 block mb-2 text-sm tracking-tight">2. Local Compliance Responsibility</span>
                <p>While the internal billing matrix computes state CGST & SGST divisions dynamically during transaction checkouts, store owners hold the sole responsibility to trace and audit downloaded slips ahead of quarterly fiscal trade filings.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: BILLING SOFTWARE (/billing-software) ==================== */}
        {currentPath === '/billing-software' && (
          <div className="space-y-10 max-w-3xl text-left font-sans animate-fade-in">
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">Premium Invoicing Engine</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none animate-fade-in">
              GST compliant Invoice Maker & Receipt Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-505 leading-relaxed font-semibold">
              Issue perfect tax billing copies in seconds. Smart Vyapar maps invoices dynamically matching both 80mm compact retail thermal units and standard Executive A4 compliance sheets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-black text-indigo-650 block mb-1.5 uppercase font-mono tracking-wider">01. Dynamic CGST/SGST Division</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Configure distinct GST tax brackets for matching items. The invoice calculator processes CGST & SGST taxes separate from operational discount bounds automatically as cashiers checkout.</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-black text-indigo-655 block mb-1.5 uppercase font-mono tracking-wider">02. Scan-to-Pay QR Embedder</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Embed Paytm/UPI payment addresses on invoice templates. Smart Vyapar generates clean scan-to-pay QR graphics on receipt footers for instant bank settlements.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: INVENTORY MANAGEMENT (/inventory-management) ==================== */}
        {currentPath === '/inventory-management' && (
          <div className="space-y-10 max-w-3xl text-left font-sans animate-fade-in">
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">Storeroom Logistics</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              SKU Inventories & Live Stock Buffer Metrics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              Gain seamless warehouse control. Deduct listed product margins dynamically as cashiers print, defining critical safe thresholds to stay stocked.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Automated Item Deduction</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">No manual duplicate ledger adjustments. Quantity logs decrement instantly as checkouts finalize, eliminating inventory gaps and manual labor at night.</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-650 block mb-1.5 uppercase font-mono tracking-wider">Sleek SKU Catalogs</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Map search items easily. Input selling rates, initial acquisition prices, tax percentages, reorder buffer counts, and category divisions dynamically.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: INVOICE GENERATOR (/invoice-generator) ==================== */}
        {currentPath === '/invoice-generator' && (
          <div className="space-y-10 max-w-3xl text-left font-sans animate-fade-in">
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">Perfect PDF/Print Formats</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Online Invoice Generator & Retail Receipt Maker
            </h1>
            <p className="text-xs sm:text-sm text-slate-505 leading-relaxed font-semibold">
              Compile beautiful billing receipts in seconds. Smart Vyapar renders high-contrast, structured drafts optimized to satisfy local trade and tax audits.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Custom Header Monograms</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Solder your specialized company logo onto the document templates. Layouts dynamically scale to preserve strict grid borders without cluttering margins.</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-650 block mb-1.5 uppercase font-mono tracking-wider">Credit Buyer Balance Cards</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Direct balance ledger logs. Log unpaid accounts separate from cash collections, updating values, transaction histories, and printing summaries easily.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SEO HUB: BUSINESS ANALYTICS (/business-analytics) ==================== */}
        {currentPath === '/business-analytics' && (
          <div className="space-y-10 max-w-3xl text-left font-sans animate-fade-in">
            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-100">Sales Intelligence</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              Retail Analytics, Profit Centers & Tax Auditing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              Visualize checkout velocity inside gorgeous Recharts bars. Divide CGST & SGST taxes, calculate cash inflows versus digital receipts, and subtract costs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-600 block mb-1.5 uppercase font-mono tracking-wider">Peak Checkout Distributions</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Map hourly transaction counts easily. Highlight high-traffic windows to allocate staff resources efficiently, protecting cash registers during rushes.</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:border-indigo-200 transition-colors">
                <span className="text-xs font-bold text-indigo-650 block mb-1.5 uppercase font-mono tracking-wider">Quarterly Tax Accounting</span>
                <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">Trace total CGST & SGST liability segments separate from net profits. Save time preparing financial books for tax filing periods.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BRANDED SECURE LOGIN PAGE (/login) ==================== */}
        {currentPath === '/login' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center pt-2 animate-fade-in text-left">
            
            {/* Column A: Features Benefits Details */}
            <div className="md:col-span-6 space-y-6">
              <span className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-105 px-3 py-1 rounded-full text-[10px] text-blue-700 font-bold uppercase font-mono tracking-wider">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified SSL Portal</span>
              </span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                Access your Smart Vyapar workspace ledgers
              </h1>
              
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Log in to synchronize standard invoicing receipts, review product reorders, manage buyer databases, and trace transaction records from any browser terminal.
              </p>

              {/* Checklist */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                {[
                  { title: "Continuous cloud synchronization", desc: "Background mirrors transaction updates to secure partitioned storage." },
                  { title: "Dual local resilience cache", desc: "Draf bills, configure tax and generate PDFs during power loss." },
                  { title: "Universal PWA support", desc: "Operate shop floors seamlessly from mobile, tablet, or backup desktops." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs font-semibold text-slate-700">
                    <div className="h-5.5 w-5.5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight text-xs">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-normal block mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: Login Card inputs */}
            <div className="md:col-span-6 bg-white border border-slate-205 p-6 md:p-8 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900">Sign In to Dashboard</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wide">ACCESS MERCHANT PROFILE</p>
                </div>
                <button
                  onClick={(e) => handleLinkClick(e, '/')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-650 hover:text-slate-905 text-[10px] font-bold rounded-lg transition-all duration-200 flex items-center space-x-1 cursor-pointer outline-none active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Entrance Page</span>
                </button>
              </div>

              {authErrorLocal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white border-l-[3px] border-l-rose-500 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-[0_2px_10px_rgba(225,29,72,0.06)]"
                >
                  <div className="bg-rose-50 p-1.5 rounded-full">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-800">Authentication Issue</h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">{authErrorLocal}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleLocalLoginSubmit} className="space-y-3 font-semibold text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Store Email Address / Gmail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder=""
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-lg text-xs transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Profile Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      placeholder=""
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-lg text-xs transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition mt-1 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Secure login</span>
                  )}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[8px] font-mono font-bold uppercase tracking-widest">or oauth gateway</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                onClick={() => handleLocalGoogleAuth(false)}
                disabled={authLoading}
                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.242-3.123C18.28 1.09 15.5 0 12.24 0 5.523 0 0 5.373 0 12s5.523 12 12.24 12c7.03 0 11.7-4.82 11.7-11.7 0-.79-.08-1.393-.19-2.015H12.24z" />
                  </svg>
                )}
                <span>Google Workspace Sign In</span>
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-bold">
                <span>Want a new store record? </span>
                <a 
                  href="/signup" 
                  onClick={(e) => handleLinkClick(e, '/signup')} 
                  className="text-blue-600 hover:underline inline font-bold"
                >
                  Register Portal Workspace Here
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BRANDED SECURE SIGN UP PAGE (/signup) ==================== */}
        {currentPath === '/signup' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center pt-2 animate-fade-in text-left">
            
            {/* Column A: Marketing Highlights */}
            <div className="md:col-span-6 space-y-6">
              <span className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[10px] text-emerald-700 font-bold font-mono tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Immediate Setup</span>
              </span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                Create a secure free business repository
              </h1>
              
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Setup is complete under 60 seconds. Claim infinite offline billing caches and local receipt prints with absolutely no ongoing quota caps files.
              </p>

              {/* Highlights */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                {[
                  { title: "Unlimited tax GST Billing receipts", desc: "No manual calculations. Processes CGST, SGST & item discounts instantly." },
                  { title: "Instant low-stock notification alerts", desc: "Define warnings per item so cash counters never go dry." },
                  { title: "Dynamically crafted UPI QR codes", desc: "Watermarks Paytm / GPay parameters onto receipts for payments speed." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs font-semibold text-slate-700">
                    <div className="h-5.5 w-5.5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight text-xs">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium block leading-normal mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column B: Registrations form */}
            <div className="md:col-span-6 bg-white border border-slate-205 p-6 md:p-8 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-900">Owner Registration</h3>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wide">SET UP FREE ACCESS</p>
                </div>
                <button
                  onClick={(e) => handleLinkClick(e, '/')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-205 text-slate-650 hover:text-slate-905 text-[10px] font-bold rounded-lg transition-all duration-200 flex items-center space-x-1 cursor-pointer outline-none active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Entrance Page</span>
                </button>
              </div>

              {authErrorLocal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white border-l-[3px] border-l-rose-500 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-[0_2px_10px_rgba(225,29,72,0.06)]"
                >
                  <div className="bg-rose-50 p-1.5 rounded-full">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-800">Registration Issue</h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">{authErrorLocal}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleLocalSignupSubmit} className="space-y-3 font-semibold text-xs text-slate-705">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Owner Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      placeholder=""
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-lg text-xs transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Store Email ID / Gmail Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      required
                      placeholder=""
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-lg text-xs transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block font-mono">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      required
                      placeholder=""
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-lg text-xs transition"
                    />
                  </div>
                  {authPassword && authPassword.length < 6 && (
                    <span className="text-[10px] text-rose-500 font-bold block mt-1 font-mono">⚠️ Password must be at least 6 characters.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[11px] uppercase tracking-wider rounded-lg shadow-sm transition mt-2 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Launch Workspace</span>
                  )}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[8px] font-mono font-bold uppercase tracking-widest">or fast sync</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                onClick={() => handleLocalGoogleAuth(true)}
                disabled={authLoading}
                className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.242-3.123C18.28 1.09 15.5 0 12.24 0 5.523 0 0 5.373 0 12s5.523 12 12.24 12c7.03 0 11.7-4.82 11.7-11.7 0-.79-.08-1.393-.19-2.015H12.24z" />
                  </svg>
                )}
                <span>Register Workspace with Google</span>
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-450 font-bold">
                <span>Already registered with us? </span>
                <a 
                  href="/login" 
                  onClick={(e) => handleLinkClick(e, '/login')} 
                  className="text-blue-600 hover:underline font-bold"
                >
                  Sign In to Workspace
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="relative bg-gradient-to-b from-slate-950 via-slate-950 to-[#020205] text-slate-300 py-20 px-8 border-t border-slate-800/80 text-left shrink-0 overflow-hidden select-none shadow-[rgba(0,0,0,0.5)_0px_-30px_60px_-15px]">
        {/* Subtle Decorative Ambient Lighting */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-12 relative z-10">
          
          {/* TOP SECTION: Name of app + logo, description, and status badges (First section of footer as requested) */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-slate-800/55 pb-10">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center space-x-3">
                <img 
                  src="/apple-touch-icon.png" 
                  alt="Smart Vyapar Logo" 
                  className="h-14 w-14 rounded-2xl object-contain border border-slate-700 bg-white p-1.5 shadow-xl shadow-indigo-500/20 ring-4 ring-indigo-500/10 animate-pulse" 
                  referrerPolicy="no-referrer"
                />
                <div className="leading-tight">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight block font-sans">Smart Vyapar</span>
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest font-mono">Workspace OS v1.0</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                Sleek offline-first billing & inventory ecosystem for micro-merchants. Design invoices, monitor stocks, and synchronize securely with Cloud FireStore.
              </p>
            </div>
            
            {/* Premium Verification Badges and Quick Stats */}
            <div className="flex flex-wrap gap-3 shrink-0">
              <span className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-450 px-3.5 py-2 rounded-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Firestore Sync Live</span>
              </span>
              <span className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 text-xs font-bold text-blue-400 px-3.5 py-2 rounded-xl">
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
    </div>
  );
}
