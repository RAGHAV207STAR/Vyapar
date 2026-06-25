import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Info,
  QrCode,
  LogOut,
  Shield,
  CreditCard,
  Building,
  Settings,
  Share2,
  Scale,
  Star,
  ShieldCheck,
  Sparkles,
  Database,
  Smartphone
} from 'lucide-react';
import appLogo from '../assets/images/app_logo_1780216474773.png';
import { useBilling } from '../context/BillingContext';
import { compressAndResizeImage } from '../utils/imageCompressor';
import { 
  formatOwnerName, 
  formatShopName, 
  formatMobileNumber, 
  validateMobileNumber, 
  formatGSTNumber, 
  validateGSTNumber, 
  formatAddress, 
  formatUpiId,
  validateUpiId,
  validateEmail,
  handleEnterToNext 
} from '../utils/validation';

const CATEGORIES = [
  { value: 'kirana', label: 'Kirana & Grocery Store', emoji: '🏪' },
  { value: 'clothing', label: 'Clothing & Apparel Boutique', emoji: '👕' },
  { value: 'electronics', label: 'Electronics & Home Appliances', emoji: '⚡' },
  { value: 'mobile_shop', label: 'Mobile Shop & Accessories', emoji: '📱' },
  { value: 'pharmacy', label: 'Pharmacy & Medical Store', emoji: '💊' },
  { value: 'hardware', label: 'Hardware & Tools Store', emoji: '🔧' },
  { value: 'dairy', label: 'Dairy & Sweet Shop', emoji: '🥛' },
  { value: 'restaurant', label: 'Restaurant & Café bistro', emoji: '🍔' },
  { value: 'footwear', label: 'Footwear & Shoes', emoji: '👟' },
  { value: 'stationery', label: 'Stationery & Books', emoji: '📚' },
  { value: 'auto_parts', label: 'Auto Parts & Repairs', emoji: '🚗' },
  { value: 'bakery', label: 'Bakery & Cake Shop', emoji: '🍰' },
  { value: 'cosmetics', label: 'Cosmetics & Beauty', emoji: '💄' },
  { value: 'furniture', label: 'Furniture & Home Decor', emoji: '🛋️' },
  { value: 'jewelry', label: 'Jewelry & Watches', emoji: '💍' },
  { value: 'toys', label: 'Toys & Gifts', emoji: '🧸' },
  { value: 'opticals', label: 'Opticals & Eyewear', emoji: '👓' },
  { value: 'sports', label: 'Sports & Fitness', emoji: '🏀' },
  { value: 'pet_store', label: 'Pet Store & Supplies', emoji: '🐕' },
  { value: 'tailoring', label: 'Tailoring & Boutique', emoji: '✂️' },
  { value: 'fruits_veg', label: 'Fruits & Vegetables', emoji: '🍎' },
  { value: 'plumbing', label: 'Plumbing & Sanitary', emoji: '🚰' },
  { value: 'electrical_fittings', label: 'Electrical Fittings', emoji: '💡' },
  { value: 'construction', label: 'Construction Materials', emoji: '🧱' },
  { value: 'agriculture', label: 'Agriculture & Fertilizers', emoji: '🌱' },
  { value: 'local_business', label: 'Local Business & General Services', emoji: '💼' }
];

export default function ShopSetupForm() {
  const { user, saveProfile, showToast, logout } = useBilling();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // SECTION A: REQUIRED INFORMATION
  const [logo, setLogo] = useState<string>('');
  const [hideLogo, setHideLogo] = useState(false);
  const [logoName, setLogoName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // SECTION B: OPTIONAL INFORMATION
  const [emailAddress, setEmailAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [terms, setTerms] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [qrName, setQrName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  
  // Custom states split for Bank Details block
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Branding & Invoice Preferences - Starting Number state
  const [startingNumber, setStartingNumber] = useState('');

  // Accordion state for Step 2 of 2
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Dropdown UI states for Shop Category
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // auto compile bankDetails string
  const compileBankDetails = () => {
    if (bankName || bankAccount || bankIfsc) {
      return `${bankName ? 'Bank: ' + bankName : ''}${bankAccount ? ', A/C: ' + bankAccount : ''}${bankIfsc ? ', IFSC: ' + bankIfsc : ''}`.replace(/^, /, '');
    }
    return '';
  };

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const container = document.getElementById('setup-category-dropdown-wrap');
      if (container && !container.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isQr = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isQr) {
        setQrName(file.name);
      } else {
        setLogoName(file.name);
      }
      try {
        const compressedUrl = await compressAndResizeImage(file, 200, 200, 0.85);
        if (isQr) {
          setQrCode(compressedUrl);
        } else {
          setLogo(compressedUrl);
        }
      } catch (err) {
        showToast("Failed to process image. Try a different image format.", "error");
      }
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showToast("Business / Shop Name is required.", "warning");
      return;
    }
    if (!ownerName.trim()) {
      showToast("Owner Full Name is required.", "warning");
      return;
    }
    if (!phone.trim() || !validateMobileNumber(phone)) {
      showToast("A valid 10-digit primary mobile contact number is required.", "warning");
      return;
    }
    if (!category) {
      showToast("Please select a Shop Category.", "warning");
      return;
    }
    if (category === 'other' && !otherCategory.trim()) {
      showToast("Please specify your custom Shop Category.", "warning");
      return;
    }
    if (!address.trim()) {
      showToast("Shop Address is required.", "warning");
      return;
    }
    setStep(2);
    setActiveSection('business');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveComplete = async (isSkipping = false) => {
    setIsSaving(true);
    
    let finalLogo = logo;
    if (!finalLogo && !hideLogo) {
       finalLogo = appLogo;
    }

    // Secondary validations on optional parameters (only if not skipping completely)
    if (!isSkipping) {
      if (emailAddress.trim() && !validateEmail(emailAddress)) {
        showToast("Please enter a valid business email address.", "warning");
        setIsSaving(false);
        return;
      }
      if (gstNumber.trim() && !validateGSTNumber(gstNumber)) {
        showToast("GSTIN format is incorrect. Please check or edit.", "warning");
        setIsSaving(false);
        return;
      }
      if (upiId.trim() && !validateUpiId(upiId)) {
        showToast("Please enter a valid UPI address (e.g. merchant@paytm).", "warning");
        setIsSaving(false);
        return;
      }
      if (alternatePhone.trim() && !validateMobileNumber(alternatePhone)) {
        showToast("Please enter a valid 10-digit alternate contact phone.", "warning");
        setIsSaving(false);
        return;
      }
    }

    const bankDetailsCompiled = compileBankDetails();

    let finalCategory = category === 'other' ? otherCategory.trim() || 'Other' : CATEGORIES.find(c => c.value === category)?.label || category;
    
    // Automatically set default barcode scanner status based on category conventions
    const lowercaseCategory = finalCategory.toLowerCase();
    const barcodeEnabledByDefault = 
      lowercaseCategory.includes('grocery') || 
      lowercaseCategory.includes('supermarket') || 
      lowercaseCategory.includes('pharmacy') || 
      lowercaseCategory.includes('medical') || 
      lowercaseCategory.includes('electronics') || 
      lowercaseCategory.includes('mobile') || 
      lowercaseCategory.includes('retail') || 
      lowercaseCategory.includes('departmental') ||
      lowercaseCategory.includes('kirana') ||
      lowercaseCategory.includes('garments') ||
      lowercaseCategory.includes('footwear');

    try {
      await saveProfile({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        category: finalCategory,
        barcodeScannerEnabled: barcodeEnabledByDefault,
        logo: finalLogo,
        emailAddress: isSkipping ? undefined : (emailAddress.trim() || undefined),
        website: isSkipping ? undefined : (website.trim() || undefined),
        gstNumber: isSkipping ? undefined : (gstNumber.trim() || undefined),
        upiId: isSkipping ? undefined : (upiId.trim() || undefined),
        qrCode: isSkipping ? undefined : (qrCode || undefined),
        bankDetails: isSkipping ? undefined : (bankDetailsCompiled.trim() || undefined),
        alternatePhone: isSkipping ? undefined : (alternatePhone.trim() || undefined),
        terms: isSkipping ? undefined : (terms.trim() || undefined),
        businessDescription: isSkipping ? undefined : (businessDescription.trim() || undefined),
        socialLinks: isSkipping ? undefined : (socialLinks.trim() || undefined),
        invoicePrefix: isSkipping ? undefined : (invoicePrefix.trim().toUpperCase() || undefined)
      });
      
      // Save starting invoice index in localStorage for direct hook up with BillingSystem starting index logic
      if (!isSkipping && startingNumber) {
        localStorage.setItem(`vyapar_starting_invoice_no_${user?.uid || 'guest'}`, startingNumber.trim());
      }
      
      showToast("Workspace setup completed successfully! Welcome to Smart Vyapar.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Encountered cloud synchronization errors.", "warning");
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCategoryLabel = () => {
    if (!category) return 'Search or select category';
    if (category === 'other') {
      return otherCategory ? `Other: ${otherCategory}` : 'Other (Please specify)';
    }
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? `${cat.emoji} ${cat.label}` : 'Search or select category';
  };

  // Section status checklists for Step 2 Accordions
  const isBusinessDetailsFilled = !!(emailAddress.trim() || website.trim() || businessDescription.trim());
  const isTaxFilled = !!gstNumber.trim();
  const isPaymentFilled = !!(upiId.trim() || qrCode);
  const isBankFilled = !!(bankName.trim() || bankAccount.trim() || bankIfsc.trim());
  const isContactFilled = !!alternatePhone.trim();
  const isBrandingFilled = !!(invoicePrefix.trim() || startingNumber !== '1');
  const isSocialFilled = !!socialLinks.trim();
  const isTermsFilled = !!terms.trim();

  return (
    <div className="min-h-screen bg-slate-55 text-slate-800 flex flex-col items-center justify-center py-6 sm:py-12 px-4 sm:px-6 w-full font-sans select-none">
      <div id="setup-form-master-container" className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch transition-all duration-300 text-left">
        
        {/* Column A: Premium Onboarding Console / Sidebar */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            {/* Header / Brand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-800 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                  <img src={appLogo} alt="Smart Vyapar Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <span className="font-sans text-lg font-bold tracking-tight text-white">
                  Smart <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-350 to-emerald-400">Vyapar</span>
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-full uppercase font-mono tracking-wider">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure Setup</span>
              </div>
            </div>

            {/* Step progress details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] text-teal-400 font-extrabold uppercase font-mono tracking-widest">Workspace Initialization</span>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  Set Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-teal-350 to-indigo-400">Vyapar Engine</span>
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  You are one step away from launching your billing workspace. Establish your shop settings below to configure custom invoicing formats, live stock counts, and dynamic PDF receipt templates.
                </p>
              </div>

              {/* Steps Progress Indicator */}
              <div className="space-y-2.5 pt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                  <span>Progress Stage</span>
                  <span className="text-teal-400">{step === 1 ? '50% Complete' : '100% Complete'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]' : 'bg-slate-800'}`} />
                  <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-emerald-400 to-indigo-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-slate-800'}`} />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span className={step === 1 ? 'text-teal-400' : 'text-slate-500'}>1. Required Profile</span>
                  <span className={`text-right ${step === 2 ? 'text-emerald-400' : 'text-slate-500'}`}>2. Optional Parameters</span>
                </div>
              </div>
            </div>

            {/* checklist depending on step */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
              {step === 1 ? (
                <>
                  <p className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-450 mb-2">Required Guideline Checklist</p>
                  {[
                    { title: "Personalized Billing Identity", desc: "Your custom logo and owner name is stamped on official customer receipts.", icon: Store, color: "text-teal-400 bg-teal-500/10" },
                    { title: "Smart Classification", desc: "Choosing your store category pre-tunes tax slabs and reorder alerts.", icon: Building2, color: "text-emerald-400 bg-emerald-500/10" },
                    { title: "Primary Contact Registry", desc: "Sets up your default invoice helpline number and local shop address.", icon: Phone, color: "text-indigo-400 bg-indigo-500/10" }
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={idx} className="flex items-start space-x-3.5 group">
                        <div className={`h-8 w-8 rounded-xl ${item.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100 block text-xs leading-tight">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block leading-normal mt-0.5">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  <p className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-450 mb-2">Optional Parameters Checklist</p>
                  {[
                    { title: "Instant Scan-to-Pay UPI", desc: "Add your VPA handle to embed customer UPI QR codes directly inside digital bills.", icon: QrCode, color: "text-emerald-400 bg-emerald-500/10" },
                    { title: "Government GST Slots", desc: "Pre-set tax levels to support legal cgst/sgst computing instantly.", icon: FileText, color: "text-teal-400 bg-teal-500/10" },
                    { title: "Prefix Alphanumeric Serials", desc: "Customize invoice prefixes, disclaimer settings, and starting indices.", icon: Settings, color: "text-indigo-400 bg-indigo-500/10" }
                  ].map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <div key={idx} className="flex items-start space-x-3.5 group">
                        <div className={`h-8 w-8 rounded-xl ${item.color} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-100 block text-xs leading-tight">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block leading-normal mt-0.5">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Secure sub-footer */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-455 relative z-10">
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-slate-500 text-[8px]">Encryption protocol</span>
              <span className="font-bold text-slate-300">TLS 1.3 Secure Session</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="block uppercase tracking-wider text-slate-500 text-[8px]">Sandbox Isolation</span>
              <span className="font-bold text-emerald-400 flex items-center justify-end gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Sandbox
              </span>
            </div>
          </div>
        </div>

        {/* Column B: Onboarding Form Inputs Card */}
        <div className="lg:col-span-7 bg-white/85 backdrop-blur-md border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Required Workspace Setup</h3>
                      <p className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-widest">Section A: Core Profile Details</p>
                    </div>
                  </div>

                  {/* FORM SYSTEM - STEP 1 INPUTS */}
                  <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    
                    {/* SHOP LOGO */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Shop Logo</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={hideLogo} 
                            onChange={(e) => {
                              setHideLogo(e.target.checked);
                              if(e.target.checked) setLogo('');
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-600 cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DO NOT SHOW LOGO</span>
                        </label>
                      </div>
                      
                      {!hideLogo && (
                        <>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="setup-logo-upload-input" 
                            onChange={(e) => handleLogoUpload(e, false)} 
                            className="hidden" 
                          />
                          
                          {logo ? (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                              <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                                <img src={logo} alt="Branding logo preview" className="h-full w-full object-cover" />
                              </div>
                              <div className="text-left space-y-1">
                                <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{logoName || 'shop_logo.png'}</p>
                                <p className="text-[10px] text-emerald-650 font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> logo uploaded successfully
                                </p>
                                <div className="flex gap-2.5 pt-0.5">
                                  <label htmlFor="setup-logo-upload-input" className="text-[10px] text-teal-600 hover:text-teal-800 font-bold cursor-pointer uppercase tracking-wider">Replace</label>
                                  <button type="button" onClick={() => { setLogo(''); setLogoName(''); }} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer border-none bg-transparent">Remove</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <label 
                              htmlFor="setup-logo-upload-input" 
                              className="border-2 border-dashed border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-50/10 rounded-2xl p-5 cursor-pointer text-center transition flex flex-col items-center justify-center space-y-2 group"
                            >
                              <div className="h-11 w-11 rounded-full bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center text-teal-600 transition">
                                <Upload className="h-5.5 w-5.5" />
                              </div>
                              <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-slate-700">Upload Shop Logo</span>
                                <span className="block text-[10px] text-slate-400 font-semibold font-sans">JPG, PNG up to 2MB</span>
                              </div>
                            </label>
                          )}
                        </>
                      )}
                    </div>

                    {/* OWNER FULL NAME */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Owner Full Name <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Kumar"
                          value={ownerName}
                          onChange={(e) => setOwnerName(formatOwnerName(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                        />
                      </div>
                    </div>

                    {/* BUSINESS / SHOP NAME */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Business / Shop Name <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Building2 className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Kumar General Store"
                          value={shopName}
                          onChange={(e) => setShopName(formatShopName(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition duration-200"
                        />
                      </div>
                    </div>

                    {/* SHOP CATEGORY - SEARCHABLE DROPDOWN CHANGER */}
                    <div className="space-y-1.5 relative md:col-span-1" id="setup-category-dropdown-wrap">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Shop Category <span className="text-red-500">*</span></label>
                      <div className="relative group">
                        <Store className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full text-left pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 outline-none rounded-xl text-xs font-semibold text-slate-850 transition cursor-pointer flex items-center justify-between"
                        >
                          <span className="truncate">{getSelectedCategoryLabel()}</span>
                          <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-[99] overflow-hidden divide-y divide-slate-100 flex flex-col max-h-60 animate-none">
                          <div className="p-2 bg-slate-50 flex items-center gap-2">
                            <Search className="w-4.5 h-4.5 text-slate-400 shrink-0 ml-1 pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-xs text-slate-800 font-bold py-1.5 placeholder:text-slate-400 cursor-text"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {categorySearch && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCategorySearch(''); }}
                                className="text-slate-400 hover:text-slate-600 text-[10px] px-1 font-bold cursor-pointer border-none bg-transparent"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          <div className="overflow-y-auto max-h-40 text-xs font-bold divide-y divide-slate-50 select-none">
                            {(() => {
                              const popularLabel = categorySearch ? "Matches" : "Popular Categories";
                              const filtered = CATEGORIES.filter(c => 
                                c.label.toLowerCase().includes(categorySearch.toLowerCase())
                              );
                              
                              return (
                                <>
                                  <div className="px-3.5 py-2 text-[9px] text-teal-600 font-black uppercase tracking-widest bg-slate-100/50">
                                    {popularLabel}
                                  </div>
                                  {filtered.length === 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCategory('other');
                                        setIsDropdownOpen(false);
                                        setCategorySearch('');
                                      }}
                                      className="w-full text-left px-4 py-3 text-slate-500 italic hover:bg-slate-50 bg-white cursor-pointer border-none"
                                    >
                                      No exact match. Select custom "Other" option.
                                    </button>
                                  ) : (
                                    filtered.map(c => (
                                      <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => {
                                          setCategory(c.value);
                                          setIsDropdownOpen(false);
                                          setCategorySearch('');
                                        }}
                                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer border-none ${category === c.value ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700 hover:bg-slate-50 bg-white'}`}
                                      >
                                        <span className="font-semibold text-xs">{c.emoji} &nbsp;{c.label}</span>
                                        {category === c.value && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                                      </button>
                                    ))
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategory('other');
                                      setIsDropdownOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer border-none ${category === 'other' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700 hover:bg-slate-50 bg-white'}`}
                                  >
                                    <span className="font-semibold text-xs">📦 &nbsp;Other (Please specify)</span>
                                    {category === 'other' && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {category === 'other' && (
                        <div className="mt-2 text-left animate-none">
                          <input
                            type="text"
                            required
                            placeholder="Specify custom category"
                            value={otherCategory}
                            onChange={(e) => setOtherCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600"
                          />
                        </div>
                      )}
                    </div>

                    {/* CONTACT NUMBER */}
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Contact Number <span className="text-red-500">*</span></label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:ring-4 focus-within:ring-teal-100/50 focus-within:border-teal-600 focus-within:bg-white transition duration-200">
                        <div className="px-3.5 py-3 bg-slate-100 flex items-center gap-1 text-xs font-bold text-slate-650 border-r border-slate-200 select-none">
                          <span>🇮🇳</span>
                          <span>+91</span>
                          <ChevronDown className="h-3 w-3 text-slate-400 stroke-[2.2]" />
                        </div>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Enter 10 digit number"
                          value={phone}
                          onChange={(e) => setPhone(formatMobileNumber(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full px-4 py-3 bg-transparent outline-none text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    {/* SHOP ADDRESS */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase block font-mono tracking-wider">Shop Address <span className="text-red-500">*</span></label>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{address.length}/250</span>
                      </div>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-teal-600 transition-colors pointer-events-none" />
                        <textarea
                          required
                          rows={3}
                          maxLength={250}
                          placeholder="e.g. Shop No. 12, Ground Floor, Central Plaza, Main Market, New Delhi, 110001"
                          value={address}
                          onChange={(e) => setAddress(formatAddress(e.target.value))}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-100/50 outline-none rounded-xl text-xs font-semibold text-slate-800 transition resize-none"
                        />
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-4 md:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-4 bg-slate-900 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-teal-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border-none"
                      >
                        <span>Save & Continue</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      
                      {/* Skip and logout link */}
                      <div className="flex flex-col items-center gap-4 mt-5">
                        {user && (
                          <button
                            id="choose-other-account-btn"
                            type="button"
                            onClick={() => {
                              logout();
                              window.location.href = '/';
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 hover:border-teal-600 bg-slate-50 hover:bg-slate-100/30 text-slate-500 hover:text-teal-600 font-black text-[10px] uppercase tracking-wider rounded-xl select-none transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-3xs cursor-pointer bg-transparent"
                          >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            <span>choose other account</span>
                            <span className="text-[9px] bg-slate-150 px-2 py-0.5 rounded text-slate-400 font-mono font-medium max-w-[140px] truncate normal-case tracking-normal">
                              ({user.email})
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 flex-1 flex flex-col justify-between text-left"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Optional Workspace Parameters</h3>
                      <p className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-widest">Section B: Tailor Your Setup</p>
                    </div>
                  </div>

                  {/* INFO CALLOUT BANNER GORGEOUS BLUE */}
                  <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
                    <Info className="h-4.5 w-4.5 shrink-0 text-sky-600 mt-0.5" />
                    <p className="text-xs text-sky-850 font-semibold leading-normal">
                      Optional parameters enhance invoice styling, direct collections and receipts. You can skip any of these sections and fill them later from Profile Settings.
                    </p>
                  </div>

                  {/* ACCORDION CATEGORIES SYSTEM - 8 SECTION B CATEGORIES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. BUSINESS DETAILS */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'business' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'business' ? null : 'business')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'business' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Mail className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Business Details</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Email, Website, Description</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBusinessDetailsFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'business' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'business' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Business Email</label>
                            <input
                              type="email"
                              placeholder="e.g. billing@yourshop.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Website URL</label>
                            <input
                              type="text"
                              placeholder="e.g. www.yourshop.com"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Business Description</label>
                            <textarea
                              rows={2}
                              placeholder="Describe your retail business..."
                              value={businessDescription}
                              onChange={(e) => setBusinessDescription(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. TAX & COMPLIANCE */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'tax' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'tax' ? null : 'tax')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'tax' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Tax & Compliance</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">GST / Tax Number</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTaxFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'tax' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'tax' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">GSTIN / Tax Number</label>
                            <input
                              type="text"
                              maxLength={15}
                              placeholder="e.g. 07AAAAA1111A1Z1"
                              value={gstNumber}
                              onChange={(e) => setGstNumber(formatGSTNumber(e.target.value))}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold uppercase text-slate-800 tracking-widest focus:bg-white focus:border-teal-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. PAYMENT COLLECTION */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'payments' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'payments' ? null : 'payments')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'payments' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <CreditCard className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Payment Collection</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">UPI ID, QR Code</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPaymentFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'payments' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'payments' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">UPI ID Address</label>
                            <input
                              type="text"
                              placeholder="e.g. merchant@paytm"
                              value={upiId}
                              onChange={(e) => setUpiId(formatUpiId(e.target.value))}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 block uppercase">Payment QR Details</label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              id="setup-qr-upload-input" 
                              onChange={(e) => handleLogoUpload(e, true)} 
                              className="hidden" 
                            />
                            {qrCode ? (
                              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="h-12 w-12 bg-white border border-slate-200 overflow-hidden shrink-0 rounded-lg">
                                  <img src={qrCode} alt="Uploaded QR" className="h-full w-full object-cover" />
                                </div>
                                <div className="text-left space-y-0.5">
                                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{qrName || 'payment_qr.png'}</p>
                                  <button type="button" onClick={() => { setQrCode(''); setQrName(''); }} className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer border-none bg-transparent">Remove QR</button>
                                </div>
                              </div>
                            ) : (
                              <label htmlFor="setup-qr-upload-input" className="p-4 bg-slate-50 border border-slate-150 rounded-xl hover:border-teal-500 transition cursor-pointer flex items-center gap-3">
                                <QrCode className="h-5 w-5 text-slate-450" />
                                <div>
                                  <span className="block text-xs font-bold text-slate-700">Upload Pay QR Image</span>
                                  <span className="block text-[10px] text-slate-450 leading-none mt-0.5">Displays scanning code on PDF invoices</span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. BANK DETAILS */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'bank' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'bank' ? null : 'bank')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'bank' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Building className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Bank Details</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Account, IFSC, Bank Name</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBankFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'bank' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'bank' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</label>
                              <input
                                type="text"
                                placeholder="e.g. State Bank of India"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">IFSC Code</label>
                              <input
                                type="text"
                                placeholder="e.g. SBIN0001234"
                                maxLength={11}
                                value={bankIfsc}
                                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold uppercase text-slate-800 tracking-widest focus:bg-white focus:border-teal-600"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Account Number</label>
                            <input
                              type="text"
                              placeholder="e.g. 123456789012"
                              value={bankAccount}
                              onChange={(e) => setBankAccount(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. ADDITIONAL CONTACT */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'contacts' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'contacts' ? null : 'contacts')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'contacts' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Phone className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Additional Contact</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Alternate Phone, Landline</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isContactFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'contacts' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'contacts' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Alternate Phone</label>
                            <input
                              type="tel"
                              placeholder="e.g. 9876543210"
                              value={alternatePhone}
                              onChange={(e) => setAlternatePhone(formatMobileNumber(e.target.value))}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 6. BRANDING & INVOICE PREFERENCES */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'branding' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'branding' ? null : 'branding')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'branding' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Settings className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Branding & Invoice Preferences</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Invoice Prefix, Starting Number</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isBrandingFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'branding' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'branding' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice Prefix Priority</label>
                              <input
                                type="text"
                                placeholder="e.g. INV"
                                value={invoicePrefix}
                                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold text-slate-800 uppercase tracking-widest focus:bg-white focus:border-teal-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Starting Number</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={startingNumber}
                                onChange={(e) => setStartingNumber(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 7. SOCIAL MEDIA LINKS */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'social' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'social' ? null : 'social')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'social' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Share2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Social Media Links</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Facebook, Instagram, WhatsApp etc.</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSocialFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'social' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'social' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Connect Social Channels</label>
                            <input
                              type="text"
                              placeholder="e.g. facebook.com/shopname"
                              value={socialLinks}
                              onChange={(e) => setSocialLinks(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 8. TERMS & CONDITIONS */}
                    <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'terms' ? 'border-teal-500 shadow-xs bg-slate-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveSection(activeSection === 'terms' ? null : 'terms')}
                        className="w-full p-4 flex items-center justify-between text-left cursor-pointer border-none bg-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition ${activeSection === 'terms' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-slate-100 text-slate-500 border-slate-150'}`}>
                            <Scale className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-none">Terms & Conditions</h4>
                            <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Your business terms and policies</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTermsFilled && (
                            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">✓</div>
                          )}
                          {activeSection === 'terms' ? (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </button>

                      {activeSection === 'terms' && (
                        <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-fade-in">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice Disclaimer Settings</label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Items once sold cannot be returned."
                              value={terms}
                              onChange={(e) => setTerms(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-teal-600 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* BOTTOM CALLOUT BOX  */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
                    <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Star className="h-3.5 w-3.5 fill-current text-white stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 leading-none font-sans">Good to know!</h4>
                      <p className="text-[10px] sm:text-xs text-amber-800 font-semibold mt-1 leading-normal">
                        You can start using Smart Vyapar immediately. All of these details can be completed later at any time inside settings.
                      </p>
                    </div>
                  </div>

                  {/* STEP 2 BOTTOM NAVIGATION TRIGGERS */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => handleSaveComplete(false)}
                      disabled={isSaving}
                      className="w-full py-4 bg-slate-900 hover:bg-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-teal-500/10 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 border-none"
                    >
                      {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      <span>{isSaving ? 'Launching Vyapar Workspace...' : 'Save & Launch Workspace'}</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveComplete(true)} // Skips Section B but commits Required Section A!
                        className="text-xs font-extrabold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Complete Later
                      </button>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
