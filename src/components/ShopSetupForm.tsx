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
  Star
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
      
      showToast("Workspace setup completed successfully! Welcome to Vyapar Mitra.", "success");
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
    <div className="min-h-screen bg-slate-50 text-slate-805 flex flex-col items-center justify-start sm:py-8 px-0 sm:px-6 w-full font-sans select-none">
      
      {/* Outer wrapper matching exactly the vertical tablet & mobile panel shown in the desired screenshot */}
      <div id="setup-form-master-container" className="w-full md:w-11/12 max-w-6xl bg-white rounded-none sm:rounded-3xl border-y sm:border border-slate-100 shadow-xl overflow-hidden flex flex-col justify-between p-4 sm:p-8 space-y-6 relative transition-all duration-300">
        
        {/* TOP BRAND GATEWAY HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-slate-55 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-white">
              <img src={appLogo} alt="Vyapar Mitra Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-slate-800">
              Vyapar <span className="font-extrabold text-[#007a78]">Mitra</span>
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#007a78] bg-[#eefcfb] border border-[#d2f3f1] px-3 py-1.5 rounded-full shadow-2xs">
            <Shield className="h-4 w-4 text-[#007a78] stroke-[2.5]" />
            <span className="uppercase tracking-wide text-[10px] font-extrabold">✓ Secure</span>
          </div>
        </div>

        {/* STEP PROGRESS TRACKER */}
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1">
              <span>Step {step} of 2</span>
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)}
                  className="text-[#007a78] hover:underline font-extrabold flex items-center gap-0.5 ml-2 cursor-pointer text-[11px]"
                >
                  <ArrowLeft className="h-3 w-3 inline" /> Back to Step 1
                </button>
              )}
            </div>
            <span className="text-[#007a78] font-black">{step === 1 ? '50%' : '100%'}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#007a78] rounded-full transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

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
              
              {/* WELCOME BANNER WITH BEAUTIFUL STOREFRONT ILLUSTRATION */}
              <div className="bg-[#eefcfb] rounded-2xl p-5 border border-[#d2f3f1] flex items-center justify-between gap-4 relative overflow-hidden text-left shadow-2xs">
                <div className="space-y-1 z-10 max-w-[65%]">
                  <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                    Welcome to <span className="text-[#007a78]">Vyapar Mitra! 👋</span>
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 leading-normal">
                    Let's set up your business profile
                  </p>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-0.5">
                    This helps us personalize your invoices, reports, inventory and more.
                  </p>
                </div>
                
                {/* SVG Storefront icon exactly matching desired visual */}
                <div className="shrink-0 select-none pointer-events-none z-0">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 text-teal-600" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 110 H110" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
                    <rect x="25" y="45" width="70" height="65" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                    <rect x="45" y="70" width="20" height="40" rx="2" fill="#E1F5FE" stroke="#0288D1" strokeWidth="1.5" />
                    <circle cx="50" cy="90" r="1.5" fill="#0288D1" />
                    <rect x="73" y="70" width="16" height="20" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
                    <line x1="81" y1="70" x2="81" y2="90" stroke="#64748B" strokeWidth="1" />
                    <line x1="73" y1="80" x2="89" y2="80" stroke="#64748B" strokeWidth="1" />
                    {/* Awning stripes in Teal brand color */}
                    <path d="M22 45 L27 58 H35 L30 45 Z" fill="#007a78" />
                    <path d="M30 45 L35 58 H43 L38 45 Z" fill="#E2E8F0" />
                    <path d="M38 45 L43 58 H51 L46 45 Z" fill="#007a78" />
                    <path d="M46 45 L51 58 H59 L54 45 Z" fill="#E2E8F0" />
                    <path d="M54 45 L59 58 H67 L62 45 Z" fill="#007a78" />
                    <path d="M62 45 L67 58 H75 L70 45 Z" fill="#E2E8F0" />
                    <path d="M70 45 L75 58 H83 L78 45 Z" fill="#007a78" />
                    <path d="M78 45 L83 58 H91 L86 45 Z" fill="#E2E8F0" />
                    <path d="M86 45 L91 58 H99 L94 45 Z" fill="#007a78" />
                    <path d="M20 45 H100 L95 58 H25 Z" stroke="#005f5e" strokeWidth="2" strokeLinejoin="round" />
                    {/* Pretty storefront pot plant */}
                    <rect x="14" y="94" width="8" height="16" rx="1" fill="#B45309" />
                    <circle cx="18" cy="88" r="5" fill="#10B981" />
                  </svg>
                </div>
              </div>

              {/* SECTION A HEADER */}
              <div className="flex items-center justify-between text-left mt-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#007a78] tracking-widest uppercase">SECTION A: REQUIRED INFORMATION</span>
                    <span className="text-[10px] font-bold bg-[#eefcfb] border border-[#d2f3f1] text-[#007a78] px-2.5 py-0.5 rounded-full uppercase">Required</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Please complete these details to get started</p>
                </div>
              </div>

              {/* FORM SYSTEM - STEP 1 INPUTS */}
              <form onSubmit={handleNext} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                
                {/* SHOP LOGO */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Shop Logo</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={hideLogo} 
                        onChange={(e) => {
                          setHideLogo(e.target.checked);
                          if(e.target.checked) setLogo('');
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#007a78] focus:ring-[#007a78] cursor-pointer"
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
                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <Check className="h-3.5 w-3.5" /> logo uploaded successfully
                            </p>
                            <div className="flex gap-2.5 pt-0.5">
                              <label htmlFor="setup-logo-upload-input" className="text-[10px] text-[#007a78] hover:text-teal-800 font-bold cursor-pointer uppercase tracking-wider">Replace</label>
                              <button type="button" onClick={() => { setLogo(''); setLogoName(''); }} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer">Remove</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label 
                          htmlFor="setup-logo-upload-input" 
                          className="border-2 border-dashed border-slate-200 hover:border-[#007a78] bg-slate-50 hover:bg-[#edf9f8]/25 rounded-2xl p-5 cursor-pointer text-center transition flex flex-col items-center justify-center space-y-2"
                        >
                          <div className="h-11 w-11 rounded-full bg-[#eefcfb] flex items-center justify-center text-[#007a78]">
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
                  <label className="text-xs font-bold text-slate-700 block">Owner Full Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={ownerName}
                      onChange={(e) => setOwnerName(formatOwnerName(e.target.value))}
                      onKeyDown={handleEnterToNext}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#007a78] outline-none rounded-xl text-xs font-bold text-slate-800 transition shadow-2xs focus:ring-1 focus:ring-[#007a78]/20"
                    />
                  </div>
                </div>

                {/* BUSINESS / SHOP NAME */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block">Business / Shop Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={shopName}
                      onChange={(e) => setShopName(formatShopName(e.target.value))}
                      onKeyDown={handleEnterToNext}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#007a78] outline-none rounded-xl text-xs font-bold text-slate-800 transition shadow-2xs focus:ring-1 focus:ring-[#007a78]/20"
                    />
                  </div>
                </div>

                {/* SHOP CATEGORY - SEARCHABLE DROPDOWN CHANGER */}
                <div className="space-y-1.5 relative animate-none md:col-span-1" id="setup-category-dropdown-wrap">
                  <label className="text-xs font-bold text-slate-700 block">Shop Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Store className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full text-left pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#007a78] outline-none rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{getSelectedCategoryLabel()}</span>
                      <ChevronDown className={`h-4.5 w-4.5 text-slate-450 transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[99] overflow-hidden divide-y divide-slate-100 flex flex-col max-h-60 animate-none">
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
                            className="text-slate-450 hover:text-slate-700 text-[10px] px-1 font-bold cursor-pointer"
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
                              <div className="px-3.5 py-2 text-[9px] text-[#007a78]/90 font-black uppercase tracking-widest bg-slate-100/50">
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
                                  className="w-full text-left px-4 py-3 text-slate-455 italic hover:bg-slate-50 bg-white cursor-pointer"
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
                                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer ${category === c.value ? 'bg-teal-50 text-[#007a78] font-bold' : 'text-slate-700 hover:bg-slate-50 bg-white'}`}
                                  >
                                    <span className="font-semibold text-xs">{c.emoji} &nbsp;{c.label}</span>
                                    {category === c.value && <Check className="w-4 h-4 text-[#007a78] shrink-0" />}
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
                                className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer ${category === 'other' ? 'bg-teal-50 text-[#007a78] font-bold' : 'text-slate-700 hover:bg-slate-50 bg-white'}`}
                              >
                                <span className="font-semibold text-xs">📦 &nbsp;Other (Please specify)</span>
                                {category === 'other' && <Check className="w-4 h-4 text-[#007a78] shrink-0" />}
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
                        placeholder=""
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#007a78] outline-none rounded-xl text-xs font-bold text-slate-800 transition"
                      />
                    </div>
                  )}
                </div>

                {/* CONTACT NUMBER */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-bold text-slate-700 block">Contact Number <span className="text-red-500">*</span></label>
                  <div className="flex rounded-xl shadow-2xs overflow-hidden border border-slate-200 bg-slate-50 focus-within:ring-1 focus-within:ring-[#007a78]/20 focus-within:border-[#007a78] focus-within:bg-white transition duration-200">
                    <div className="px-3.5 py-3 bg-slate-100 flex items-center gap-1 text-xs font-bold text-slate-600 border-r border-slate-200 select-none">
                      <span>🇮🇳</span>
                      <span>+91</span>
                      <ChevronDown className="h-3 w-3 text-slate-450 stroke-[2.2]" />
                    </div>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder=""
                      value={phone}
                      onChange={(e) => setPhone(formatMobileNumber(e.target.value))}
                      onKeyDown={handleEnterToNext}
                      className="w-full px-4 py-3 bg-transparent outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-450 font-semibold leading-relaxed">Enter your 10-digit mobile number</p>
                </div>

                {/* SHOP ADDRESS */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Shop Address <span className="text-red-500">*</span></label>
                    <span className="text-[10px] text-slate-450 font-mono font-bold">{address.length}/250</span>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-450 pointer-events-none" />
                    <textarea
                      required
                      rows={3}
                      maxLength={250}
                      placeholder=""
                      value={address}
                      onChange={(e) => setAddress(formatAddress(e.target.value))}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-[#007a78] outline-none rounded-xl text-xs font-bold text-slate-800 transition resize-none shadow-2xs focus:ring-1 focus:ring-[#007a78]/20"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2 md:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#007a78] hover:bg-[#005f5e] text-white font-extrabold text-sm rounded-xl select-none transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2.5 shadow-md shadow-[#007a78]/20 cursor-pointer"
                  >
                    <span>Save & Continue</span>
                    <ArrowRight className="h-4.5 w-4.5" />
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
                        className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:border-[#007a78] bg-slate-50 hover:bg-slate-100/30 text-slate-500 hover:text-[#007a78] font-black text-xs uppercase tracking-wider rounded-xl select-none transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-3xs cursor-pointer hover:shadow-2xs"
                      >
                        <LogOut className="h-3.5 w-3.5 shrink-0" />
                        <span>choose other account</span>
                        <span className="text-[10px] bg-slate-150 px-2 py-0.5 rounded text-slate-400 font-mono font-medium max-w-[140px] truncate normal-case tracking-normal">
                          ({user.email})
                        </span>
                      </button>
                    )}
                  </div>
                </div>

              </form>

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
              
              {/* STATUS INDICATOR HERO CARD FOR STEP 2 */}
              <div className="bg-[#edf6fa] rounded-2xl p-5 border border-[#dcecf5] flex items-center justify-between gap-4 relative overflow-hidden text-left shadow-2xs">
                <div className="space-y-1.5 z-10 max-w-[65%]">
                  <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                    Almost there! 🎉
                  </h1>
                  <p className="text-xs font-semibold text-slate-600 leading-normal">
                    Add optional details to make your business profile complete.
                  </p>
                </div>
                
                {/* SVG Checklist clipboard matching desired design */}
                <div className="shrink-0 select-none pointer-events-none z-0">
                  <svg className="w-20 h-20 sm:w-24 sm:h-24 text-[#007a78]" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="34" y="24" width="56" height="76" rx="8" fill="#F1F5F9" />
                    <rect x="30" y="20" width="56" height="76" rx="8" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
                    <rect x="48" y="12" width="20" height="12" rx="3" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
                    <circle cx="58" cy="18" r="1.5" fill="#FFFFFF" />
                    <line x1="42" y1="40" x2="72" y2="40" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="42" y1="52" x2="65" y2="52" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="42" y1="64" x2="75" y2="64" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="42" y1="76" x2="58" y2="76" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="82" cy="74" r="13" fill="#007a78" />
                    <path d="M76 74 L80 78 L88 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* SECTION B HEADER */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#007a78] tracking-widest uppercase">SECTION B: OPTIONAL INFORMATION</span>
                  <span className="text-[10px] font-bold bg-[#edf6fa] border border-[#dcecf5] text-blue-600 px-2.5 py-0.5 rounded-full uppercase">Optional</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">You can update these details later from Profile Settings.</p>
              </div>

              {/* INFO CALLOUT BANNER GORGEOUS BLUE */}
              <div className="bg-[#e0f2fe] border border-[#bae6fd] p-3.5 rounded-xl flex items-start gap-2.5 shadow-2xs">
                <Info className="h-5 w-5 shrink-0 text-[#0284c7] mt-0.5" />
                <p className="text-xs text-[#0369a1] font-semibold leading-normal">
                  Optional details can be added or updated later from Profile Settings.
                </p>
              </div>

              {/* ACCORDION CATEGORIES SYSTEM - 8 SECTION B CATEGORIES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. BUSINESS DETAILS */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'business' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'business' ? null : 'business')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'business' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Mail className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Business Details</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Email, Website, Description</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBusinessDetailsFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'business' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'business' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Business Email</label>
                        <input
                          type="email"
                          placeholder=""
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL</label>
                        <input
                          type="text"
                          placeholder=""
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Business Description</label>
                        <textarea
                          rows={2}
                          placeholder=""
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78] resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. TAX & COMPLIANCE */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'tax' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'tax' ? null : 'tax')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'tax' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Tax & Compliance</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">GST / Tax Number</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTaxFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'tax' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'tax' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">GSTIN / Tax Number</label>
                        <input
                          type="text"
                          maxLength={15}
                          placeholder=""
                          value={gstNumber}
                          onChange={(e) => setGstNumber(formatGSTNumber(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold uppercase text-slate-800 tracking-widest focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. PAYMENT COLLECTION */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'payments' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'payments' ? null : 'payments')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'payments' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <CreditCard className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Payment Collection</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">UPI ID, QR Code</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPaymentFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'payments' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'payments' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">UPI ID Address</label>
                        <input
                          type="text"
                          placeholder=""
                          value={upiId}
                          onChange={(e) => setUpiId(formatUpiId(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Payment QR Details</label>
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
                              <button type="button" onClick={() => { setQrCode(''); setQrName(''); }} className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer">Remove QR</button>
                            </div>
                          </div>
                        ) : (
                          <label htmlFor="setup-qr-upload-input" className="p-4 bg-slate-50 border border-slate-150 rounded-xl hover:border-[#007a78] transition cursor-pointer flex items-center gap-3">
                            <QrCode className="h-5 w-5 text-slate-400" />
                            <div>
                              <span className="block text-xs font-bold text-slate-700">Upload Pay QR Image</span>
                              <span className="block text-[10px] text-slate-450 leading-none mt-0.5">Display automatic invoice scans</span>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. BANK DETAILS */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'bank' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'bank' ? null : 'bank')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'bank' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Building className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Bank Details</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Account, IFSC, Bank Name</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBankFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'bank' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'bank' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                          <input
                            type="text"
                            placeholder=""
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">IFSC Code</label>
                          <input
                            type="text"
                            placeholder=""
                            maxLength={11}
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold uppercase text-slate-800 tracking-widest focus:bg-white focus:border-[#007a78]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Account Number</label>
                        <input
                          type="text"
                          placeholder=""
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. ADDITIONAL CONTACT */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'contacts' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'contacts' ? null : 'contacts')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'contacts' ? 'bg-teal-50 text-[#007a78] border-teal-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Additional Contact</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Alternate Phone, Landline</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isContactFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'contacts' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'contacts' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Alternate Phone</label>
                        <input
                          type="tel"
                          placeholder=""
                          value={alternatePhone}
                          onChange={(e) => setAlternatePhone(formatMobileNumber(e.target.value))}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. BRANDING & INVOICE PREFERENCES */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'branding' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'branding' ? null : 'branding')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'branding' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Settings className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Branding & Invoice Preferences</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Invoice Prefix, Starting Number</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBrandingFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'branding' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'branding' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Prefix Priority</label>
                          <input
                            type="text"
                            placeholder=""
                            value={invoicePrefix}
                            onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-mono font-bold text-slate-800 uppercase tracking-widest focus:bg-white focus:border-[#007a78]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Starting Number</label>
                          <input
                            type="number"
                            min="1"
                            placeholder=""
                            value={startingNumber}
                            onChange={(e) => setStartingNumber(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. SOCIAL MEDIA LINKS */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'social' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'social' ? null : 'social')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'social' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Share2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Social Media Links</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Facebook, Instagram, WhatsApp etc.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSocialFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'social' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'social' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Connect Social Channels</label>
                        <input
                          type="text"
                          placeholder=""
                          value={socialLinks}
                          onChange={(e) => setSocialLinks(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 8. TERMS & CONDITIONS */}
                <div className={`border rounded-2xl transition-all duration-300 ${activeSection === 'terms' ? 'border-[#007a78] shadow-xs bg-slate-50/10' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(activeSection === 'terms' ? null : 'terms')}
                    className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${activeSection === 'terms' ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-slate-100 text-slate-550 border-slate-150'}`}>
                        <Scale className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-none">Terms & Conditions</h4>
                        <span className="text-[10px] text-slate-450 block mt-1 font-semibold font-sans">Your business terms and policies</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTermsFilled && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</div>
                      )}
                      {activeSection === 'terms' ? (
                        <ChevronDown className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </button>

                  {activeSection === 'terms' && (
                    <div className="px-4 pb-4.5 pt-1 space-y-3.5 border-t border-slate-100 text-left animate-none">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Invoice Disclaimer Settings</label>
                        <textarea
                          rows={2}
                          placeholder=""
                          value={terms}
                          onChange={(e) => setTerms(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 outline-none rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#007a78] resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* BOTTOM CALLOUT BOX  */}
              <div className="bg-[#fffbeb] border border-[#fde68a] p-4 rounded-2xl flex items-start gap-3 shadow-2xs">
                <div className="h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-current text-white stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 leading-none">Good to know!</h4>
                  <p className="text-[10px] sm:text-xs text-amber-800 font-semibold mt-1 leading-normal">
                    You can start using Vyapar Mitra immediately after completing the required information.
                  </p>
                </div>
              </div>

              {/* STEP 2 BOTTOM NAVIGATION TRIGGERS */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleSaveComplete(false)}
                  disabled={isSaving}
                  className="w-full py-4 bg-[#007a78] hover:bg-[#005f5e] text-white font-extrabold text-sm rounded-xl select-none transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 shadow-md shadow-[#007a78]/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
                  <span>{isSaving ? 'Launching Vyapar Workspace...' : 'Save & Continue'}</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveComplete(true)} // Skips Section B but commits Required Section A!
                    className="text-xs font-extrabold text-[#007a78] hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    Complete Later
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* SECURE SUB-FOOTER LEDGER */}
        <div className="text-center font-sans mt-3 border-t border-slate-100 pt-3.5 flex items-center justify-center gap-1.5 text-slate-400 select-none pointer-events-none">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-[10px] font-bold tracking-tight">
            Security Shield Active • Cloud Database Onboarding Isolation Active
          </p>
        </div>

      </div>
    </div>
  );
}
