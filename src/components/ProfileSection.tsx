import React, { useState, useEffect } from 'react';
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
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Edit2,
  X,
  Search,
  ChevronDown,
  Check,
  Globe,
  Info,
  HelpCircle,
  Hash,
  Link as LinkIcon,
  QrCode,
  Share2,
  Barcode
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';
import { compressAndResizeImage } from '../utils/imageCompressor';
import { UserProfile } from '../types';
import appLogo from '../assets/images/app_logo_1780216474773.png';
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

export default function ProfileSection() {
  const { user, profile, saveProfile, showToast } = useBilling();
  
  // Edit mode vs Read mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form tab selection (A vs B)
  const [editTab, setEditTab] = useState<'A' | 'B'>('A');

  // Validate categories
  const isCated = CATEGORIES.some(c => c.value === profile?.category);

  // States
  const [shopName, setShopName] = useState(profile?.shopName || '');
  const [ownerName, setOwnerName] = useState(profile?.ownerName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(profile?.alternatePhone || '');
  const [emailAddress, setEmailAddress] = useState(profile?.emailAddress || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [gstNumber, setGstNumber] = useState(profile?.gstNumber || '');
  const [upiId, setUpiId] = useState(profile?.upiId || '');
  const [showUpiIdOnBill, setShowUpiIdOnBill] = useState(profile?.showUpiIdOnBill || false);
  const [website, setWebsite] = useState(profile?.website || '');
  const [bankDetails, setBankDetails] = useState(profile?.bankDetails || '');
  const [terms, setTerms] = useState(profile?.terms || '');
  const [category, setCategory] = useState(isCated ? (profile?.category || 'grocery') : 'other');
  const [otherCategory, setOtherCategory] = useState(isCated ? '' : (profile?.category || ''));
  
  // Additional Recommended Optional Fields
  const [businessDescription, setBusinessDescription] = useState(profile?.businessDescription || '');
  const [socialLinks, setSocialLinks] = useState(profile?.socialLinks || '');
  const [invoicePrefix, setInvoicePrefix] = useState(profile?.invoicePrefix || '');
  const [barcodeScannerEnabled, setBarcodeScannerEnabled] = useState(profile?.barcodeScannerEnabled ?? false);

  const [logo, setLogo] = useState<string>(profile?.logo || '');
  const [qrCode, setQrCode] = useState<string>(profile?.qrCode || '');
  const [logoName, setLogoName] = useState('');
  const [qrName, setQrName] = useState('');

  // Dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Handle outside clicks for Category Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const container = document.getElementById('profile-category-dropdown-wrap');
      if (container && !container.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle category emoji and labels
  const getCategoryEmoji = (val: string) => {
    return CATEGORIES.find(c => c.value === val)?.emoji || '🏪';
  };

  const getCategoryLabel = (val: string) => {
    if (val === 'other' && otherCategory) return `Other: ${otherCategory}`;
    const found = CATEGORIES.find(c => c.value === val);
    return found ? found.label : (val ? `Other: ${val}` : 'Other');
  };

  // Scan Bank Details
  const [isScanningBank, setIsScanningBank] = useState(false);

  const handleBankScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningBank(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;

        try {
          const response = await fetch('/api/gemini/extract-bank-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              mimeType: file.type
            })
          });

          if (!response.ok) {
            throw new Error('Failed to analyze bank details');
          }

          const data = await response.json();
          if (data.bankDetails) {
            setBankDetails((prev) => (prev ? prev + '\n' + data.bankDetails : data.bankDetails));
            showToast('Bank details extracted successfully!', 'success');
          } else {
            showToast('Could not detect bank details from this image.', 'error');
          }
        } catch (err) {
          console.error('Scan Error:', err);
          showToast('Failed to scan bank details.', 'error');
        } finally {
          setIsScanningBank(false);
          e.target.value = ''; // Reset input
        }
      };
    } catch (err) {
      console.error(err);
      setIsScanningBank(false);
    }
  };

  // Upload handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
      try {
        const compressedUrl = await compressAndResizeImage(file, 200, 200, 0.85);
        setLogo(compressedUrl);
      } catch (err) {
        showToast("Failed to process logo. Try a different format.", 'error');
      }
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrName(file.name);
      try {
        const compressedUrl = await compressAndResizeImage(file, 200, 200, 0.85);
        setQrCode(compressedUrl);
      } catch (err) {
        showToast("Failed to process QR code. Try a different format.", 'error');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !ownerName.trim() || !phone.trim() || !address.trim()) {
      showToast("Please fill in all required (*) profile fields.", 'warning');
      return;
    }

    if (!validateMobileNumber(phone)) {
      showToast("Please enter a valid 10-digit primary contact number.", 'warning');
      return;
    }

    if (alternatePhone.trim() && !validateMobileNumber(alternatePhone)) {
      showToast("Please enter a valid 10-digit alternate contact number.", 'warning');
      return;
    }

    if (emailAddress.trim() && !validateEmail(emailAddress)) {
      showToast("Please enter a valid business email address.", 'warning');
      return;
    }

    if (gstNumber.trim() && !validateGSTNumber(gstNumber)) {
      showToast("GSTIN format is incorrect. Please correct or clear it.", 'warning');
      return;
    }

    if (upiId.trim() && !validateUpiId(upiId)) {
      showToast("Please enter a valid UPI ID (e.g. merchant@paytm).", 'warning');
      return;
    }
    
    setIsSaving(true);
    let finalLogo = logo;

    try {
      await saveProfile({
        shopName,
        ownerName,
        phone,
        alternatePhone: alternatePhone.trim() || undefined,
        emailAddress: emailAddress.trim() || undefined,
        address,
        gstNumber: gstNumber.trim() || undefined,
        upiId: upiId.trim() || undefined,
        showUpiIdOnBill,
        website: website.trim() || undefined,
        bankDetails: bankDetails.trim() || undefined,
        terms: terms.trim() || undefined,
        businessDescription: businessDescription.trim() || undefined,
        socialLinks: socialLinks.trim() || undefined,
        invoicePrefix: invoicePrefix.trim().toUpperCase() || undefined,
        category: category === 'other' ? otherCategory.trim() || 'Other' : category,
        barcodeScannerEnabled,
        logo: finalLogo,
        qrCode: qrCode || undefined
      });
      showToast("Business profile upgraded successfully!", "success");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showToast("Error updating database workspace profile.", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in font-sans pb-20">
      
      {/* Premium Header Row */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-500/20 mb-8 group hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)] transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700" />
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -translate-y-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-left">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] sm:text-xs font-bold text-blue-200 border border-white/10 backdrop-blur-sm mb-1 uppercase tracking-widest">
               <Building2 className="w-3.5 h-3.5" /> Workspace Profile
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-3">
               Business Settings
             </h2>
             <p className="text-sm text-blue-100/80 font-medium max-w-md leading-relaxed">
               Manage workspace brand identity, contact structures, billing configurations, and tax identities.
             </p>
          </div>

          <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md self-start sm:self-auto">
             {!isEditing ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShopName(profile?.shopName || '');
                  setOwnerName(profile?.ownerName || '');
                  setPhone(profile?.phone || '');
                  setAlternatePhone(profile?.alternatePhone || '');
                  setEmailAddress(profile?.emailAddress || '');
                  setAddress(profile?.address || '');
                  setGstNumber(profile?.gstNumber || '');
                  setUpiId(profile?.upiId || '');
                  setShowUpiIdOnBill(profile?.showUpiIdOnBill || false);
                  setWebsite(profile?.website || '');
                  setBankDetails(profile?.bankDetails || '');
                  setTerms(profile?.terms || '');
                  setCategory(CATEGORIES.some(c => c.value === profile?.category) ? (profile?.category || 'grocery') : 'other');
                  setOtherCategory(CATEGORIES.some(c => c.value === profile?.category) ? '' : (profile?.category || ''));
                  setBusinessDescription(profile?.businessDescription || '');
                  setSocialLinks(profile?.socialLinks || '');
                  setInvoicePrefix(profile?.invoicePrefix || '');
                  setBarcodeScannerEnabled(profile?.barcodeScannerEnabled ?? false);
                  setLogo(profile?.logo || '');
                  setQrCode(profile?.qrCode || '');
                  setEditTab('A');
                  setIsEditing(true);
                }}
                className="flex items-center justify-center whitespace-nowrap bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 transition-all outline-none focus:ring-4 focus:ring-blue-500/30 gap-2 shrink-0"
              >
                <Edit2 className="w-5 h-5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  type="button"
                  className="flex items-center justify-center whitespace-nowrap bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl text-sm font-bold border border-white/10 transition-all outline-none focus:ring-4 focus:ring-blue-500/30 gap-2 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  type="button"
                  className="flex items-center justify-center whitespace-nowrap bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl text-sm font-black shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95 transition-all outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-50 disabled:cursor-wait gap-2"
                >
                  {isSaving ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-5 h-5" strokeWidth={3} /> Save Profile</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        /* EDIT PROFILE LAYOUT FORM */
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl text-left">
          
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                Profile Setup Console
              </h3>
              <p className="text-xs text-slate-500 font-medium">Configure Section A and Section B details</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration sub-tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setEditTab('A')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all ${editTab === 'A' ? 'border-blue-600 text-blue-600 bg-white font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              SECTION A: REQUIRED INFORMATION
            </button>
            <button
              type="button"
              onClick={() => setEditTab('B')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider border-b-2 transition-all ${editTab === 'B' ? 'border-blue-600 text-blue-600 bg-white font-black' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              SECTION B: OPTIONAL DETAILS
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Note displays on top of Section B */}
            {editTab === 'B' && (
              <div className="bg-blue-50 border border-blue-105 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-800 leading-none">Optional Parameter Sync</p>
                  <p className="text-[11px] font-semibold mt-1 text-blue-600 leading-relaxed">
                    Optional details can be added or updated later from Profile Settings.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION A: REQUIRED INFORMATION */}
            {editTab === 'A' && (
              <div className="space-y-8 animate-in fade-in-50">
                
                {/* Logo Section */}
                <div className="relative group overflow-hidden bg-gradient-to-r from-slate-50 to-white border border-slate-200/80 p-6 rounded-3xl w-full shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                    <div className="relative inline-block">
                      <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[28px] blur-sm group-hover:blur-md transition-all" />
                      <div className="h-24 w-24 bg-white rounded-3xl border border-white flex items-center justify-center overflow-hidden shrink-0 relative shadow-md">
                        {logo ? (
                          <img src={logo} alt="Shop Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <img src={appLogo} alt="Default App Logo" className="h-full w-full object-cover" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-center sm:text-left w-full mt-2 sm:mt-0">
                      <div>
                        <label className="block text-sm font-black tracking-tight text-slate-800">Business Brand Logo</label>
                        <span className="block text-xs text-slate-500 font-medium">PNG or JPG, up to 2MB. Your logo builds trust on all invoices formatting.</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="profile-logo-upload" 
                          onChange={handleLogoUpload} 
                          className="hidden" 
                        />
                        <label 
                          htmlFor="profile-logo-upload" 
                          className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 font-black py-2 px-4 rounded-xl text-xs cursor-pointer border border-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-slate-200 active:scale-95"
                        >
                          <Upload className="h-4 w-4 text-slate-500" />
                          <span>{logo ? 'Update Shop Logo' : 'Upload Your Logo'}</span>
                        </label>
                        {logo && (
                          <button
                            type="button"
                            onClick={() => { setLogo(''); setLogoName(''); }}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95"
                          >
                            Remove Custom Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Attributes */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-1.5 focus-within:relative z-20">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block pl-1">Owner Full Name *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Anand R. Shah"
                          value={ownerName}
                          onChange={(e) => setOwnerName(formatOwnerName(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 focus-within:relative z-20">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block pl-1">Business / Shop Name *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Shah Trading Enterprise"
                          value={shopName}
                          onChange={(e) => setShopName(formatShopName(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-1.5 focus-within:relative z-20">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block pl-1">Contact Number *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="tel"
                          required
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="e.g. 9823456789"
                          value={phone}
                          onChange={(e) => setPhone(formatMobileNumber(e.target.value))}
                          onKeyDown={handleEnterToNext}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm"
                        />
                      </div>
                      {phone && !validateMobileNumber(phone) && (
                        <p className="text-[10px] text-amber-600 font-bold pl-1">Please enter a valid 10-digit Indian Mobile number.</p>
                      )}
                    </div>

                    <div className="space-y-1.5 focus-within:relative z-20" id="profile-category-dropdown-wrap">
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block pl-1">Shop Category *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Store className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full text-left pl-12 pr-10 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm cursor-pointer flex items-center justify-between"
                        >
                        <span>
                          {category === 'other' ? (
                            <span>📦 Other ({otherCategory || 'Specify Custom'})</span>
                          ) : (
                            <span>
                              {getCategoryEmoji(category)}{' '}
                              {CATEGORIES.find(c => c.value === category)?.label || 'Select Category'}
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`h-4.5 w-4.5 text-slate-450 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[99] overflow-hidden divide-y divide-slate-100 max-h-60 flex flex-col">
                        <div className="p-2 bg-slate-50 flex items-center gap-2">
                          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            placeholder="Type to search category..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-xs text-slate-705 font-semibold placeholder:text-slate-400 py-1 cursor-text"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {categorySearch && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setCategorySearch(''); }}
                              className="text-slate-400 hover:text-slate-600 text-xs px-1"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="overflow-y-auto flex-grow max-h-40 text-xs font-bold divide-y divide-slate-50">
                          {(() => {
                            const filtered = CATEGORIES.filter(c =>
                              c.label.toLowerCase().includes(categorySearch.toLowerCase())
                            );
                            return (
                              <>
                                {filtered.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCategory('other');
                                      setIsDropdownOpen(false);
                                      setCategorySearch('');
                                    }}
                                    className="w-full text-left p-3 text-slate-450 italic hover:bg-slate-50"
                                  >
                                    No matches. Select custom "Other" option
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
                                      className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center justify-between ${category === c.value ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-705 hover:text-slate-905 bg-white'}`}
                                    >
                                      <span>{c.emoji} {c.label}</span>
                                      {category === c.value && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
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
                                  className={`w-full text-left px-4 py-2.5 transition-colors flex items-center justify-between cursor-pointer ${category === 'other' ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-705 hover:bg-slate-50 bg-white'}`}
                                >
                                  <span className="font-semibold text-xs">📦 &nbsp;Other (Please specify)</span>
                                  {category === 'other' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                      {category === 'other' && (
                        <div className="mt-3 text-left animate-in slide-in-from-top-1">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Handloom Textiles & Furnishing"
                            value={otherCategory}
                            onChange={(e) => setOtherCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-xl text-sm font-semibold text-slate-900 transition-all shadow-inner"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 focus-within:relative z-20">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block pl-1">Shop Address *</label>
                    <div className="relative group">
                      <div className="absolute top-4 left-4 flex items-start pointer-events-none">
                        <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. Ground Floor, Building No. 24, Gandhi Market Road, Fort Area, Mumbai"
                        value={address}
                        onChange={(e) => setAddress(formatAddress(e.target.value))}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none rounded-2xl text-sm font-semibold text-slate-900 transition-all shadow-sm resize-none"
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SECTION B: OPTIONAL INFORMATION */}
            {editTab === 'B' && (
              <div className="space-y-5 animate-in fade-in-50">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Business Email</label>
                    <input
                      type="email"
                      placeholder="e.g. contact@shahtraders.co.in"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Website URL</label>
                    <input
                      type="text"
                      placeholder="e.g. www.shahtraders.co.in"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">GST / Tax Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(formatGSTNumber(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-mono font-semibold text-slate-800 uppercase tracking-wide transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. shah@axisbank"
                      value={upiId}
                      onChange={(e) => setUpiId(formatUpiId(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50/80 border border-slate-205 rounded-2xl md:col-span-2">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-700">Display UPI ID Text on Bill</span>
                      <span className="text-[10px] text-slate-450 font-medium">Show raw UPI ID text along with the QR code</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showUpiIdOnBill}
                        onChange={(e) => setShowUpiIdOnBill(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Alternate Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9112233445"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(formatMobileNumber(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition"
                    />
                  </div>

                  {/* Invoice Prefix Preference */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Invoice Prefix Preference</label>
                    <input
                      type="text"
                      placeholder="e.g. ST"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-mono font-bold text-slate-800 uppercase transition"
                    />
                  </div>
                </div>

                {/* QR Code section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl w-full">
                  <div className="h-16 w-16 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {qrCode ? (
                      <img src={qrCode} alt="Payment QR" className="h-full w-full object-cover" />
                    ) : (
                      <QrCode className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left w-full">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment QR Details</label>
                    <span className="block text-xs text-slate-450 font-medium leading-none">Upload your scan-to-pay QR image to embed in receipt PDFs. Under 2MB.</span>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="profile-qr-upload" 
                        onChange={handleQrUpload} 
                        className="hidden" 
                      />
                      <label 
                        htmlFor="profile-qr-upload" 
                        className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-750 font-bold py-1.5 px-3.5 rounded-lg text-xs cursor-pointer border border-slate-200 transition shadow-xs"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span>{qrCode ? 'Change QR Image' : 'Upload QR Image'}</span>
                      </label>
                      {qrCode && (
                        <button
                          type="button"
                          onClick={() => { setQrCode(''); setQrName(''); }}
                          className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Fields */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Bank Details</label>
                     <div className="relative">
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                         onChange={handleBankScan}
                         disabled={isScanningBank}
                       />
                       <button type="button" className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors py-1.5 px-3 relative ${isScanningBank ? 'text-blue-400 bg-blue-50/50 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'}`}>
                         {isScanningBank ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                         <span>{isScanningBank ? 'Scanning...' : 'Scan Passbook/Cheque'}</span>
                       </button>
                     </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="e.g. Bank: State Bank of India, A/C: 12345678901, IFSC: SBIN0000123"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none rounded-xl text-sm font-medium text-slate-800 transition-all resize-none shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Terms & Conditions Ledger</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 1. Goods once sold will not be taken back. 2. Subject to Mumbai Jurisdiction."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition resize-none"
                  />
                </div>

                {/* Additional Recommended Optional Fields */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Business Description</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Leading wholesale distributor of quality consumer goods and building supplies since 1995."
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Social Media Links</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Facebook: fb.com/shahtraders, Instagram: @shahtraders_official"
                    value={socialLinks}
                    onChange={(e) => setSocialLinks(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-600 outline-none rounded-xl text-xs font-semibold text-slate-800 transition resize-none"
                  />
                </div>

              </div>
            )}

          </div>

          {/* Action buttons footer */}
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/55">
            <div>
              {editTab === 'B' ? (
                <button
                  type="button"
                  onClick={() => setEditTab('A')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  &larr; Section A (Required)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditTab('B')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  Configure Section B (Optional) &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="py-2.5 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-black text-slate-600 hover:text-slate-850 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      ) : (
        /* READ PREVIEW COMPREHENSIVE VIEWPORT */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Main profile content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Identity Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/10 blur-xl pointer-events-none rounded-full" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="h-24 w-24 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                  {profile?.logo ? (
                    <img src={profile.logo} alt="Shop logo" className="h-full w-full object-cover font-sans" referrerPolicy="no-referrer" />
                  ) : (
                    <img src={appLogo} alt="Default App Logo" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {profile?.shopName || 'Apex Store'}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 font-extrabold bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                    <span>{getCategoryEmoji(profile?.category || 'grocery')}</span>
                    <span className="uppercase tracking-wide">{getCategoryLabel(profile?.category || 'grocery')}</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-500 pt-1">
                    Corporate Director: <span className="text-slate-800">{profile?.ownerName || 'Merchant'}</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex sm:flex-col gap-2">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-black tracking-widest uppercase border border-emerald-200/50 rounded-md px-2.5 py-1.5 flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  Workspace Active
                </span>
              </div>
            </div>

            {/* SECTION A: REQUIRED INFORMATION */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm text-left">
              <div className="flex items-center space-x-1.5 pb-3 border-b border-slate-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">SECTION A: REQUIRED BUSINESS INFORMATION</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Primary Owner Name</span>
                  <p className="font-extrabold text-slate-800 text-sm">{profile?.ownerName || 'Not Set'}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Business Category</span>
                  <p className="font-extrabold text-slate-805 text-sm capitalize">{getCategoryLabel(profile?.category || 'grocery')}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Contact Phone</span>
                  <p className="font-extrabold text-slate-800 text-sm">{profile?.phone || 'Not Set'}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Corporate Domain Email</span>
                  <p className="font-extrabold text-slate-808 text-sm truncate">{user?.email || 'Not Set'}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Shop Address</span>
                  <p className="font-bold text-slate-700 whitespace-pre-line leading-relaxed text-xs">{profile?.address || 'Not Set'}</p>
                </div>
              </div>
            </div>

            {/* SECTION B: OPTIONAL INFORMATION */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">SECTION B: OPTIONAL BUSINESS DETAILS</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SECURE LEDGER</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Business Email Address</span>
                  <p className={`font-bold text-xs ${profile?.emailAddress ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                    {profile?.emailAddress || 'No Business Email Registered'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Website URL</span>
                  <p className={`font-bold text-xs ${profile?.website ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                    {profile?.website || 'No Website Registered'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">GSTIN / TAX NO</span>
                  <p className={`font-mono font-bold text-xs uppercase tracking-wide ${profile?.gstNumber ? 'text-slate-800 font-extrabold' : 'text-slate-400 italic'}`}>
                    {profile?.gstNumber || 'Not Registered'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">UPI ID</span>
                  <p className={`font-bold text-xs ${profile?.upiId ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                    {profile?.upiId || 'No UPI ID Connected'}
                  </p>
                  {profile?.upiId && (
                    <span className="text-[10px] font-bold text-slate-450 block mt-1 uppercase tracking-wider">
                      Bill Text Display: {profile?.showUpiIdOnBill ? '✅ Enabled' : '❌ Disabled'}
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Alternate Phone</span>
                  <p className={`font-bold text-xs ${profile?.alternatePhone ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                    {profile?.alternatePhone || 'No alternate phone registered'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Invoice Prefix Preference</span>
                  <p className={`font-mono font-bold text-xs ${profile?.invoicePrefix ? 'text-slate-800 font-black' : 'text-slate-405 italic'}`}>
                    {profile?.invoicePrefix || 'Default (e.g. INV-)'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Business Description</span>
                  <p className={`font-bold text-xs leading-relaxed ${profile?.businessDescription ? 'text-slate-700' : 'text-slate-405 italic'}`}>
                    {profile?.businessDescription || 'No description added. Edit profile to write a short brief about your specialties.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Social Media Links</span>
                  <p className={`font-bold text-xs leading-relaxed ${profile?.socialLinks ? 'text-slate-700' : 'text-slate-405 italic'}`}>
                    {profile?.socialLinks || 'No social media profiles currently connected.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Terms & Conditions Default</span>
                  <p className={`font-bold text-xs leading-relaxed ${profile?.terms ? 'text-slate-700' : 'text-slate-405 italic'}`}>
                    {profile?.terms || 'Not Set. Will use standard default system terms (Click edit to specify terms printed at invoice bottoms).'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Bank Details</span>
                  <p className={`font-mono font-bold text-xs leading-relaxed whitespace-pre-line ${profile?.bankDetails ? 'text-slate-705' : 'text-slate-405 italic'}`}>
                    {profile?.bankDetails || 'No bank routing details specified.'}
                  </p>
                </div>

                {/* Embedded payment qr code container */}
                {profile?.qrCode && (
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl space-y-3 sm:col-span-2 flex items-center gap-5">
                    <div className="h-20 w-20 bg-white border border-indigo-150 p-1 rounded-xl shrink-0">
                      <img src={profile.qrCode} alt="Payment QR" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-900 leading-none">Registered Digital Payment QR</h4>
                      <p className="text-[11px] font-semibold text-indigo-600 mt-1.5 leading-relaxed">
                        This digital invoice QR is fully embedded into client PDFs. Customers can easily scan this graphics file to settle their outstanding balances instantaneously.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Display clear note exactly as requested */}
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-3.5 rounded-xl mt-4">
                <Info className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                <p className="text-[11px] text-slate-600 font-bold leading-normal">
                  "Optional details can be added or updated later from Profile Settings."
                </p>
              </div>

            </div>

          </div>

          {/* Account Details Box */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-4 text-left">
              Safe Security Ledger
            </h3>
            
            <div className="space-y-5 text-sm text-left font-sans">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Workspace ID</span>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-base font-bold text-slate-900 truncate bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {profile?.businessId || 'SV-8F4K2M91'}
                  </p>
                </div>
                <div className="flex gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      if (profile?.businessId) {
                        navigator.clipboard.writeText(profile.businessId);
                        showToast("Business workspace ID copied.", "success");
                      } else {
                        navigator.clipboard.writeText('SV-8F4K2M91');
                        showToast("ID copied successfully.", "success");
                      }
                    }}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                  >
                    <span>📋 Copy Workspace ID</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Registered Operator Email</span>
                <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <p className="font-mono text-xs font-bold text-slate-650 truncate">{user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Account Creation Date</span>
                <p className="font-mono text-xs font-bold text-slate-600 truncate">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A'}
                </p>
              </div>
              
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider">Workspace Secure Status</span>
                <p className="font-mono text-xs font-bold text-emerald-600 truncate">Active & Synced Offline-First</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-1">Account Recovery Information</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  Your Business ID is the unique identity of your business database on VYAPAR MITRA. Keep this safe for secure diagnostics, customer settlement backups, and multi-device access logs.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
