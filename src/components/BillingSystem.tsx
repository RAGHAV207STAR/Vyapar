/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  ArrowRight,
  RefreshCw,
  Search,
  User,
  CheckCircle2,
  Copy,
  Receipt,
  XCircle,
  Package,
  Pencil,
  Barcode,
  Keyboard,
  Volume2,
  VolumeX,
  Zap,
  AlertCircle,
  Check,
  Terminal,
  Settings,
  Camera,
  Sparkles
} from "lucide-react";
import { useBilling } from "../context/BillingContext";
import { useInventory } from "../context/InventoryContext";
import { useFinancial } from "../context/FinancialContext";
const BarcodeScannerModal = React.lazy(() => import('./BarcodeScannerModal'));
import { 
  formatOwnerName, 
  formatShopName, 
  formatMobileNumber, 
  validateMobileNumber, 
  formatGSTNumber, 
  validateGSTNumber, 
  formatAddress, 
  handleEnterToNext 
} from '../utils/validation';
import {
  ProductItem,
  CustomerDetails,
  Bill,
  PaymentMode,
  InventoryItem,
} from "../types";

const formatStockDisplay = (qty: number, category: string) => {
  if (!qty) return '0';
  const c = (category || '').toLowerCase();
  const isPrecious = c.includes('gold') || c.includes('silver') || c.includes('diamond') || c.includes('platinum') || c.includes('jewelry') || c.includes('gem');
  
  if (isPrecious) {
    return Number(Number(qty).toFixed(4)).toString();
  }
  return Number(Number(qty).toFixed(2)).toString();
};

function ProductAutocomplete({
  value,
  inventoryId,
  inventory,
  onChange,
  onSelect,
  placeholder = "e.g. Wireless Mouse",
}: {
  value: string;
  inventoryId?: string;
  inventory: InventoryItem[];
  onChange: (val: string) => void;
  onSelect: (item: InventoryItem | null) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sq = value.toLowerCase();
  const suggestions = inventory.filter((item) => 
    item.name.toLowerCase().includes(sq) || 
    (item.sku && item.sku.toLowerCase().includes(sq)) ||
    (item.barcode && item.barcode.toLowerCase().includes(sq))
  );

  const selectedItem = inventory.find(i => i.id === inventoryId);

  return (
    <div className="relative flex flex-col" ref={wrapperRef}>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleEnterToNext}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-colors"
      />
      {selectedItem && (
        <span className="text-[10px] font-bold text-slate-500 mt-1 pl-1">
          {selectedItem.sku && <span className="mr-1">SKU: {selectedItem.sku} |</span>} Current Stock: {formatStockDisplay(selectedItem.stock, selectedItem.category)} {selectedItem.unit} | Price: ₹{selectedItem.sellingPrice.toFixed(2)}
        </span>
      )}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl"
          >
            {suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center transition"
              >
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {item.sku && <span className="font-mono text-blue-600 mr-2">{item.sku}</span>}
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Stock: {formatStockDisplay(item.stock, item.category)} {item.unit} | Rate: ₹{item.sellingPrice.toFixed(2)}
                  </div>
                </div>
                <Package className="w-4 h-4 text-slate-300" />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const UNIT_OPTIONS = [
  "Pcs",
  "Kg",
  "Gm",
  "Ltr",
  "Mtr",
  "Box",
  "Pkts",
  "Dozen",
];

const PAYMENT_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI / QR" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit (Unpaid)" },
];

interface BillingSystemProps {
  onBillGenerated: (bill: Bill) => void;
  initialBillToEdit?: Bill | null;
  initialCustomerDetails?: CustomerDetails | null;
  onCancelEdit?: () => void;
  billFormat?: 'A4' | 'A5' | '80mm' | '58mm';
  setBillFormat?: (format: 'A4' | 'A5' | '80mm' | '58mm') => void;
}

export default function BillingSystem({ 
  onBillGenerated, 
  initialBillToEdit, 
  initialCustomerDetails,
  onCancelEdit,
  billFormat = 'A4',
  setBillFormat
}: BillingSystemProps) {
  const { createBill, updateBill, bills, customers, saveCustomer, showToast, showConfirm, profile, saveProfile } = useBilling();
  const { inventory, reduceStockForInvoice } = useInventory();
  const { addTransaction } = useFinancial();
  const listStartRef = useRef<HTMLDivElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");

  // SpeedPOS Barcode & Keys States & Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const discountInputRef = useRef<HTMLInputElement>(null);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const [barcodeText, setBarcodeText] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScannerFocused, setIsScannerFocused] = useState(false);
  const [scannerSelectedIndex, setScannerSelectedIndex] = useState(0);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerDropdownIndex, setCustomerDropdownIndex] = useState(0);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Customer Details states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGst, setCustomerGst] = useState("");

  const customerSuggestions = useMemo(() => {
    if (!customerName.trim()) return [];
    const query = customerName.toLowerCase().trim();
    // Do not show dropdown if the name is an exact match already
    const exactMatch = customers.find(c => c.name.toLowerCase() === query);
    if (exactMatch && exactMatch.name === customerName) return [];
    
    return customers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query)).slice(0, 5);
  }, [customerName, customers]);

  const scannerSuggestions = useMemo(() => {
    if (!barcodeText.trim()) return [];
    const query = barcodeText.toLowerCase().trim();
    return inventory.filter(item => 
      (item.barcode && item.barcode.toLowerCase().includes(query)) ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      item.name.toLowerCase().includes(query)
    ).slice(0, 5); // limit to 5 suggestions
  }, [barcodeText, inventory]);

  // Reset index when search changes
  useEffect(() => {
    setScannerSelectedIndex(0);
  }, [barcodeText]);

  // Audio Synthesizer Beeps for tactility
  const playBeep = (type: 'success' | 'alert') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'success') {
        // High-pitched sweet confirmation tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1250, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        // Low-frequency warning buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Audio feedback blocked:", e);
    }
  };

  const handleUnknownBarcode = (query: string) => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newProduct = {
      id: newId,
      name: query, 
      sku: query,
      hsn: "",
      quantity: 1,
      unit: "Pcs",
      price: 0,
      total: 0,
    };
    
    setProducts((prev) => {
      if (prev.length === 1 && !prev[0].name.trim() && prev[0].quantity === 0) {
        return [newProduct];
      }
      return [...prev, newProduct];
    });

    setScanFeedback({ text: `Added custom product "${query}". Please edit details.`, type: 'warning' });
    playBeep('alert');
    setBarcodeText("");
    
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 10);
  };

  // Helper to add from inventory
  const handleCameraScan = (decodedText: string) => {
    // Exact barcode match, then SKU match, or exact name match
    const foundItem = inventory.find(
      (item) =>
        (item.barcode && item.barcode.toLowerCase() === decodedText.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase() === decodedText.toLowerCase()) ||
        item.name.toLowerCase() === decodedText.toLowerCase()
    );

    if (foundItem) {
      setShowScannerModal(false);
      playBeep('success');
      addInventoryItemToBill(foundItem);
      showToast(`Scanned: ${foundItem.name}`, 'success');
    } else {
      setShowScannerModal(false);
      handleUnknownBarcode(decodedText);
      showToast(`Added custom product from barcode: ${decodedText}`, 'info');
    }
  };

  const addInventoryItemToBill = (foundItem: any) => {
    // Check if product is already in the current invoice row items
    const existingProduct = products.find((p) => p.inventoryId === foundItem.id);
    if (existingProduct) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === existingProduct.id) {
            const newQty = p.quantity + 1;
            return {
              ...p,
              quantity: newQty,
              total: p.price * newQty,
            };
          }
          return p;
        })
      );
      showToast(`Incremented "${foundItem.name}" quantity to ${existingProduct.quantity + 1}`, "success");
      setScanFeedback({ text: `Matched sku: ${foundItem.sku || 'N/A'} - Quants Incremented (+1)`, type: 'success' });
    } else {
      // Add as a brand new item row
      const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newProduct = {
        id: newId,
        inventoryId: foundItem.id,
        name: foundItem.name,
        hsn: foundItem.hsn || "",
        sku: foundItem.sku,
        quantity: 1,
        unit: foundItem.unit || "Pcs",
        price: foundItem.sellingPrice,
        total: foundItem.sellingPrice,
      };

      setProducts((prev) => {
        // Replace structural line if empty first item is present is blank
        if (prev.length === 1 && !prev[0].name.trim() && prev[0].quantity === 0) {
          return [newProduct];
        }
        return [...prev, newProduct];
      });
      showToast(`Added "${foundItem.name}" to invoice.`, "success");
      setScanFeedback({ text: `Added "${foundItem.name}" (₹${foundItem.sellingPrice})`, type: 'success' });
    }
    playBeep('success');
    setBarcodeText("");
    
    // Retain focus on barcode input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 10);
  };

  // Continuous Scanner Engine
  const handleBarcodeSubmit = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const query = barcodeText.trim();
    if (!query) return;

    let foundItem = null;
    
    if (isScannerFocused && scannerSuggestions.length > 0) {
      foundItem = scannerSuggestions[scannerSelectedIndex];
    } else {
      // Search items with exact case-insensitive barcode, sku match, or case-insensitive name match
      foundItem = inventory.find(
        (item) =>
          (item.barcode && item.barcode.toLowerCase() === query.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase() === query.toLowerCase()) ||
          item.name.toLowerCase() === query.toLowerCase()
      );
    }

    if (foundItem) {
      addInventoryItemToBill(foundItem);
    } else {
      handleUnknownBarcode(query);
    }
  };

  // Full payment toggle
  const [isFullPayment, setIsFullPayment] = useState<boolean>(true);

  // Other Details states
  const [transport, setTransport] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [gstin, setGstin] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState("");

  // Settings
  const [enableHsn, setEnableHsn] = useState(false);
  const [enableOtherDetails, setEnableOtherDetails] = useState(false);
  const [showSKU, setShowSKU] = useState(false);

  // Products listing states
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "p_initial_1",
      name: "",
      hsn: "",
      quantity: 0,
      unit: "Pcs",
      price: 0,
      total: 0,
    },
  ]);

  // Financial States
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [transportCost, setTransportCost] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(0); // adjustable GST rate: 0, 5, 12, 18, 28
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [notes, setNotes] = useState<string>(initialBillToEdit ? initialBillToEdit.notes || "" : profile?.terms || "");

  useEffect(() => {
    if (initialBillToEdit) {
      setCustomerName(initialBillToEdit.customerDetails.name || "");
      setCustomerPhone(initialBillToEdit.customerDetails.phone || "");
      setCustomerAddress(initialBillToEdit.customerDetails.address || "");
      setCustomerGst(initialBillToEdit.customerDetails.gstNumber || "");
      setNotes(initialBillToEdit.notes ?? profile?.terms ?? "");
      
      const details = initialBillToEdit.otherDetails;
      if (details) {
        setEnableOtherDetails(true);
        setTransport(details.transport || "");
        setTransportCost(details.transportCost || 0);
        setVehicleNumber(details.vehicleNumber || "");
        setPlaceOfSupply(details.placeOfSupply || "");
        setGstin(details.gstin || "");
        setDeliveryDetails(details.deliveryDetails || "");
        setShowSKU(details.showSKU || false);
      } else {
        setEnableOtherDetails(false);
        setTransport("");
        setTransportCost(0);
        setVehicleNumber("");
        setPlaceOfSupply("");
        setGstin("");
        setDeliveryDetails("");
        setShowSKU(false);
      }
      
      if (initialBillToEdit.products && initialBillToEdit.products.length > 0) {
        setProducts(initialBillToEdit.products.map(p => ({ ...p })));
        const hasSomeHsn = initialBillToEdit.products.some(p => p.hsn);
        setEnableHsn(hasSomeHsn);
      } else {
        setProducts([
          {
            id: "p_initial_1",
            name: "",
            hsn: "",
            quantity: 0,
            unit: "Pcs",
            price: 0,
            total: 0,
          },
        ]);
        setEnableHsn(false);
      }
      
      setDiscountPercent(initialBillToEdit.discountPercent || 0);
      setGstRate(initialBillToEdit.gstPercent || 0);
      setPaidAmount(initialBillToEdit.paidAmount || 0);
      setPaymentMode(initialBillToEdit.paymentMode || "CASH");
      setIsFullPayment(initialBillToEdit.balanceAmount === 0);
    } else {
      setCustomerName(initialCustomerDetails?.name || "");
      setCustomerPhone(initialCustomerDetails?.phone || "");
      setCustomerAddress(initialCustomerDetails?.address || "");
      setCustomerGst(initialCustomerDetails?.gstNumber || "");
      setEnableOtherDetails(false);
      setTransport("");
      setVehicleNumber("");
      setPlaceOfSupply("");
      setGstin("");
      setDeliveryDetails("");
      setShowSKU(false);
      setProducts([
        {
          id: "p_initial_1",
          name: "",
          hsn: "",
          quantity: 0,
          unit: "Pcs",
          price: 0,
          total: 0,
        },
      ]);
      setEnableHsn(false);
      setDiscountPercent(0);
      setGstRate(0);
      setPaidAmount(0);
      setPaymentMode("CASH");
      setIsFullPayment(true);
      setNotes(profile?.terms || "");
    }
  }, [initialBillToEdit, initialCustomerDetails, profile?.terms]);

  // Auto-switch document format based on number of products (A5 for 1-2 items, A4 for 3+)
  useEffect(() => {
    // Count active custom products (excluding incomplete placeholder rows)
    const activeProducts = products.filter(p => p.name.trim() !== "" && p.quantity > 0);
    const count = activeProducts.length;
    
    const cleanCustName = customerName.trim();
    const hasCustomer = cleanCustName !== "" && cleanCustName !== "Cash / Walk-in" && cleanCustName !== "Cash";
    
    if (count >= 1 && count <= 2) {
      if (billFormat === 'A4' && setBillFormat) {
        setBillFormat('A5');
        showToast("Auto-changed output to A5 format for 1-2 items", "info");
      }
    } else if (count >= 3 && hasCustomer) {
      if (billFormat === 'A5' && setBillFormat) {
        setBillFormat('A4');
        showToast("Auto-changed output to A4 format for 3+ items", "info");
      }
    }
  }, [products, billFormat, customerName, setBillFormat, showToast]);

  // Highly restricted rule: without customer details, cannot make or show bill in A4 sheet under any condition
  useEffect(() => {
    const cleanCustName = customerName.trim();
    const hasCustomer = cleanCustName !== "" && cleanCustName !== "Cash / Walk-in" && cleanCustName !== "Cash";
    if (!hasCustomer && billFormat === 'A4') {
      if (setBillFormat) {
        setBillFormat('80mm');
        
        // Only show this notification once per session
        if (!sessionStorage.getItem("hasShownA4FormatToast")) {
          showToast("Switched from A4 to Thermal format. Customer details are required for A4.", "info");
          sessionStorage.setItem("hasShownA4FormatToast", "true");
        }
      }
    }
  }, [customerName, billFormat, setBillFormat, showToast]);

  // Ergonomic Global Keyboard Action Trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. F2 to focus laser barcode scan terminal
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        showToast("⌨️ Barcode / SKU scan zone is now focused and active!", "info");
      }

      // 2. F4 to trigger existing customer search modal
      if (e.key === 'F4') {
        e.preventDefault();
        setShowCustModal(true);
        setCustSearch("");
        showToast("⌨️ Search customers active!", "info");
      }

      // 3. F8 to trigger fast bill processing validation
      if (e.key === 'F8') {
        e.preventDefault();
        const mode = initialBillToEdit ? 'update' : 'create';
        runFormValidationAndTrigger(mode);
      }

      // 4. Alt + N to append dynamic line item
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        handleAddProduct();
      }

      // 5. Alt + P to loop POS payment modes
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        const currentIndex = PAYMENT_OPTIONS.findIndex(o => o.value === paymentMode);
        const nextIndex = (currentIndex + 1) % PAYMENT_OPTIONS.length;
        setPaymentMode(PAYMENT_OPTIONS[nextIndex].value);
        showToast(`⌨️ Switched Payment Mode: ${PAYMENT_OPTIONS[nextIndex].label}`, "info");
      }

      // 6. Alt + D to jump to discount entry
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        discountInputRef.current?.focus();
        showToast("⌨️ Discount selector focused!", "info");
      }

      // 7. Alt + G to rotate GST brackets
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        const rates = [0, 5, 12, 18, 28];
        const currentIdx = rates.indexOf(gstRate);
        const nextIdx = (currentIdx + 1) % rates.length;
        setGstRate(rates[nextIdx]);
        showToast(`⌨️ GST Rate set to ${rates[nextIdx]}%`, "info");
      }

      // 8. Alt + A to focus Amount Paid input
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsFullPayment(false);
        setTimeout(() => {
          paidAmountInputRef.current?.focus();
          showToast("⌨️ Paid amount input focused!", "info");
        }, 50);
      }

      // 9. ESC to back out
      if (e.key === 'Escape') {
        setScanFeedback(null);
        setShowCustModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, inventory, paymentMode, gstRate, customerName, paidAmount, initialBillToEdit, soundEnabled]);

  // Auto-focus barcode scanner on mount for instant speed POS scanning
  useEffect(() => {
    if (profile?.barcodeScannerEnabled) {
      const timer = setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [profile?.barcodeScannerEnabled]);

  // Customer selection list popups
  const [showCustModal, setShowCustModal] = useState(false);
  const [custSearch, setCustSearch] = useState("");

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [isBarcodeConfigOpen, setIsBarcodeConfigOpen] = useState(false);

  // Check if any of the three layout features are active/enabled in profile
  const isAnyFeatureEnabled = !!(profile?.barcodeScannerEnabled || profile?.documentFormatEnabled || profile?.customerDetailsEnabled);
  
  // Decide whether to show the guidance prompt
  const [hasDismissedGuide, setHasDismissedGuide] = useState(() => {
    return localStorage.getItem('vyapar_billing_setup_guided') === 'true';
  });

  const shouldShowGuide = !isAnyFeatureEnabled && !hasDismissedGuide;

  // Extract past distinct clients for auto-completion shortcuts, combined with saved customers directory entries
  const previousCustomers = React.useMemo(() => {
    const list: {
      name: string;
      phone: string;
      address: string;
      gstNumber?: string;
      otherDetails?: any;
    }[] = [];
    const absoluteKeys = new Set<string>();

    // First, add all saved customers from directory
    customers.forEach((c) => {
      const name = c.name?.trim();
      const phone = c.phone?.trim() || "";
      const key = `${name.toLowerCase()}_${phone.toLowerCase()}`;
      if (name && !absoluteKeys.has(key)) {
        absoluteKeys.add(key);
        list.push({
          name: c.name,
          phone: c.phone || "",
          address: c.address || "",
          gstNumber: c.gstNumber,
        });
      }
    });

    // Then, add other historical customers from bills
    bills.forEach((b) => {
      const name = b.customerDetails.name?.trim();
      const phone = b.customerDetails.phone?.trim() || "";
      const key = `${name.toLowerCase()}_${phone.toLowerCase()}`;
      if (name && !absoluteKeys.has(key)) {
        absoluteKeys.add(key);
        list.push({
          name: b.customerDetails.name,
          phone: b.customerDetails.phone || "",
          address: b.customerDetails.address || "",
          gstNumber: b.customerDetails.gstNumber,
          otherDetails: b.otherDetails,
        });
      }
    });
    return list;
  }, [bills, customers]);

  // Calculations including dynamic GST
  const subTotal = products.reduce((sum, p) => sum + (p.total || 0), 0);
  const discountAmount = Number(
    ((subTotal * discountPercent) / 100).toFixed(2),
  );
  const taxableAmount = subTotal - discountAmount;
  const gstAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  const cgstAmount = Number((gstAmount / 2).toFixed(2));
  const sgstAmount = Number((gstAmount / 2).toFixed(2));

  const finalBillTotal = taxableAmount + gstAmount + transportCost;
  const balance = finalBillTotal - paidAmount;

  const paymentStatus = balance > 0 ? "PENDING" : "PAID";

  // Current Date default
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Calculate next sequence exactly as BillingContext does
  const getNextSequence = () => {
    let nextSeq = 1;
    if (bills && bills.length > 0) {
      const seqs = bills.map(b => {
        const parts = b.invoiceNumber.split('-');
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          const parsed = parseInt(lastPart, 10);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      });
      const maxSeq = Math.max(...seqs, 0);
      nextSeq = maxSeq + 1;
    }
    return nextSeq;
  };

  const nextSeqNum = getNextSequence();
  const timestamp = new Date();
  const dd = String(timestamp.getDate()).padStart(2, '0');
  const mm = String(timestamp.getMonth() + 1).padStart(2, '0');
  const yyyy = String(timestamp.getFullYear());
  const dateStr = `${dd}${mm}${yyyy}`;
  const userPrefix = profile?.invoicePrefix?.trim() ? `${profile.invoicePrefix.trim()}-` : '';
  
  const calculatedInvoiceNum = `VM-${userPrefix}${dateStr}-${String(nextSeqNum).padStart(4, '0')}`;
  const displayInvoiceNum = initialBillToEdit ? initialBillToEdit.invoiceNumber : calculatedInvoiceNum;

  useEffect(() => {
    // If the customer pays in full by default (toggle active)
    if (isFullPayment && paymentMode !== "CREDIT") {
      setPaidAmount(finalBillTotal);
    }
  }, [finalBillTotal, isFullPayment, paymentMode]);

  useEffect(() => {
    if ((paymentMode as string) === "CREDIT") {
      setPaidAmount(0);
      setIsFullPayment(false);
    } else if (
      paidAmount === finalBillTotal &&
      finalBillTotal > 0
    ) {
      setIsFullPayment(true);
    }
  }, [paymentMode]);

  // Product Actions
  const handleAddProduct = () => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setProducts((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        hsn: "",
        quantity: 0,
        unit: "Pcs",
        price: 0,
        total: 0,
      },
    ]);
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleDuplicateProduct = (product: ProductItem) => {
    const newId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setProducts((prev) => [...prev, { ...product, id: newId }]);
    setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length === 1) {
      setProducts([
        {
          id: products[0].id,
          name: "",
          hsn: "",
          quantity: 0,
          unit: "Pcs",
          price: 0,
          total: 0,
        },
      ]);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProductChange = (
    id: string,
    field: keyof Omit<ProductItem, "id" | "total">,
    value: any,
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let val = value;
          if (field === "price" || field === "quantity") {
            val = parseFloat(value) || 0;
            if (val < 0) val = 0;
          }

          const updatedProduct: ProductItem = {
            ...p,
            [field]:
              field === "name" ||
              field === "unit" ||
              field === "hsn" ||
              field === "inventoryId"
                ? value
                : val,
          };

          updatedProduct.total = updatedProduct.price * updatedProduct.quantity;
          return updatedProduct;
        }
        return p;
      }),
    );
  };

  const handleInventorySelect = (lineId: string, invId: string) => {
    if (invId === "custom") {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === lineId) {
            return {
              ...p,
              inventoryId: undefined,
              name: "",
              sku: undefined,
            };
          }
          return p;
        }),
      );
      return;
    }
    const invItem = inventory.find((i) => i.id === invId);
    if (invItem) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === lineId) {
            const qty = p.quantity || 1;
            return {
              ...p,
              inventoryId: invItem.id,
              name: invItem.name,
              sku: invItem.sku,
              hsn: invItem.hsn || "",
              unit: invItem.unit,
              price: invItem.sellingPrice,
              total: invItem.sellingPrice * qty,
            };
          }
          return p;
        }),
      );
    }
  };

  // Submit validation and save flow
  const runFormValidationAndTrigger = async (mode: 'create' | 'update') => {
    const isCustomerRequired = profile?.customerDetailsEnabled === true;
    let finalCustomerName = customerName.trim();
    
    if (isCustomerRequired && !finalCustomerName) {
      showToast("Please enter a customer name.", "warning");
      return;
    } else if (!isCustomerRequired && !finalCustomerName) {
      finalCustomerName = "Cash / Walk-in";
    }

    const hasCustomer = finalCustomerName !== "" && finalCustomerName !== "Cash / Walk-in" && finalCustomerName !== "Cash";
    if (billFormat === 'A4' && !hasCustomer) {
      showToast("A4 sheet billing is restricted without customer details. Please fill in customer details.", "error");
      return;
    }

    // Force thermal format for Walk-in customer to prevent A4 printing
    if (finalCustomerName === "Cash / Walk-in" && billFormat === 'A4') {
      if (setBillFormat) setBillFormat('80mm');
      showToast("Defaulting to Thermal Bill format as no customer details provided.", "info");
    }

    const validProducts = products.filter(
      (p) => p.name.trim() && p.quantity > 0 && p.price > 0,
    );
    if (validProducts.length === 0) {
      showToast("Please enter at least one valid product with name and price.", "warning");
      return;
    }

    if (paidAmount > finalBillTotal) {
      showToast("Paid amount cannot exceed grand total.", "warning");
      return;
    }

    // Stock Validation
    let hasInsufficientStock = false;
    let insufficientItemInfo = "";

    for (const prod of validProducts) {
      if (prod.inventoryId) {
        const invItem = inventory.find((i) => i.id === prod.inventoryId);
        if (invItem && invItem.stock < prod.quantity) {
          hasInsufficientStock = true;
          insufficientItemInfo = `Insufficient stock for "${invItem.name}" (Available: ${invItem.stock}, Requested: ${prod.quantity}).`;
          break;
        }
      }
    }

    const proceedWithSave = async (m: 'create' | 'update') => {
      setIsGenerating(true);
      setGenerationStep(m === 'update' ? "Updating Invoice..." : "Preparing Invoice...");

      try {
        const customerInfo: CustomerDetails = {
          name: finalCustomerName,
          phone: customerPhone,
          address: customerAddress,
          gstNumber: customerGst,
        };

        const otherDetails = enableOtherDetails
          ? {
              transport,
              transportCost,
              vehicleNumber,
              placeOfSupply,
              gstin,
              deliveryDetails,
              showSKU
            }
          : { showSKU, transportCost };

        setGenerationStep(m === 'update' ? "Saving Changes..." : "Validating Invoice...");

        let billResult: Bill;
        if (m === 'update' && initialBillToEdit) {
          billResult = await updateBill(
            initialBillToEdit.billId,
            customerInfo,
            validProducts,
            paymentMode,
            paymentStatus,
            discountPercent,
            discountAmount,
            paidAmount,
            otherDetails,
            gstRate,
            gstAmount,
            cgstAmount,
            sgstAmount,
            undefined,
            notes
          );

          const stockDeductionItems = validProducts
            .filter((p) => p.inventoryId)
            .map((p) => ({ productId: p.inventoryId!, quantity: p.quantity }));

          if (stockDeductionItems.length > 0) {
            // Non-blocking asynchronous stock update for instant invoice response
            reduceStockForInvoice(stockDeductionItems, billResult.billId).catch((err) => {
              console.error("Error setting up stock updates in background", err);
            });
          }

          setGenerationStep("Invoice Updated");
          await new Promise((resolve) => setTimeout(resolve, 50));
          showToast("Invoice updated successfully!", "success");
        } else {
          billResult = await createBill(
            customerInfo,
            validProducts,
            paymentMode,
            paymentStatus,
            discountPercent,
            discountAmount,
            paidAmount,
            otherDetails,
            gstRate,
            gstAmount,
            cgstAmount,
            sgstAmount,
            undefined,
            notes
          );

          const stockDeductionItems = validProducts
            .filter((p) => p.inventoryId)
            .map((p) => ({ productId: p.inventoryId!, quantity: p.quantity }));

          if (stockDeductionItems.length > 0) {
            // Non-blocking asynchronous stock update for instant invoice response
            reduceStockForInvoice(stockDeductionItems, billResult.billId).catch((err) => {
              console.error("Error setting up stock updates in background", err);
            });
          }

          try {
            await addTransaction({
              transactionType: 'business_income',
              category: 'Sales Invoice',
              amount: billResult.totalAmount,
              source: 'Invoice',
              referenceId: billResult.invoiceNumber,
              notes: `Customer: ${customerInfo.name}`,
              transactionDate: new Date().toISOString().split('T')[0]
            });
          } catch (e) {
            console.error("Failed adding to transaction ledger", e);
          }

          setGenerationStep("Invoice Ready");
          await new Promise((resolve) => setTimeout(resolve, 50));
          showToast("Invoice generated successfully!", "success");
        }

        if (profile && notes !== profile.terms) {
          try {
             // Sync terms to profile asynchronously to prevent latency
             saveProfile({ ...profile, terms: notes }).catch(e => {
               console.error("Could not sync terms to profile", e);
             });
          } catch(e) {
             console.error("Could not sync terms to profile", e);
          }
        }

        // Auto-save/update customer in custom customer directory
        if (customerName.trim() && customerName.trim() !== "Cash / Walk-in" && customerName.trim() !== "Cash") {
          try {
            const cleanPhone = customerPhone.trim();
            // Find if customer with same name or phone already exists
            const existingCust = customers.find(c => 
              c.name.trim().toLowerCase() === customerName.trim().toLowerCase() ||
              (cleanPhone && c.phone.trim() === cleanPhone)
            );
            
            saveCustomer({
              id: existingCust?.id,
              name: customerName.trim(),
              phone: cleanPhone,
              address: customerAddress.trim(),
              gstNumber: customerGst.trim() || undefined
            }).catch((err) => {
              console.warn("Could not auto-save customer to directory:", err);
            });
          } catch (custErr) {
            console.warn("Error triggering auto-save customer:", custErr);
          }
        }

        onBillGenerated(billResult);
      } catch (err: any) {
        console.error(err);
        showToast(`Could not process receipt creation. Error: ${err.message || "Unknown error"}`, "error");
      } finally {
        setIsGenerating(false);
        setGenerationStep("");
      }
    };

    if (hasInsufficientStock) {
      showConfirm({
        title: "Proceed with Negative Stock?",
        message: `${insufficientItemInfo} Proceed and record this transaction anyway? This will result in negative inventory balance.`,
        confirmText: "Proceed",
        cancelText: "Cancel",
        type: "warning",
        onConfirm: async () => {
          await proceedWithSave(mode);
        }
      });
      return;
    }

    await proceedWithSave(mode);
  };

  // Submit Handler for Form Enter
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const mode = initialBillToEdit ? 'update' : 'create';
    await runFormValidationAndTrigger(mode);
  };

  return (
    <div className="w-full mx-auto space-y-6 lg:space-y-8 font-sans animate-fade-in pb-20">
      {/* Premium Integrated Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-5 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-blue-500/30 mb-8 group hover:shadow-[0_15px_50px_rgb(0,0,0,0.3)] transition-all duration-500 text-left">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-blue-400/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-[10px] sm:text-xs font-bold text-blue-200 border border-white/10 backdrop-blur-sm uppercase tracking-widest">
               <Receipt className="w-3.5 h-3.5" /> Point of Sale
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Issue Invoice
              </h2>
              <div className="relative">
                {shouldShowGuide && (
                  <span className="absolute -inset-1 rounded-full bg-amber-400/60 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={() => setIsBarcodeConfigOpen(!isBarcodeConfigOpen)}
                  className={`p-2 sm:p-2.5 rounded-full transition-all border flex items-center justify-center cursor-pointer active:scale-95 shrink-0 relative ${
                    shouldShowGuide 
                      ? 'bg-amber-500 border-amber-400 text-slate-900 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                      : isBarcodeConfigOpen 
                        ? 'bg-white/30 border-white/20 text-white shadow-inner' 
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                  title="Configure Billing Settings"
                  id="barcode-config-btn"
                >
                  <Settings className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${shouldShowGuide ? 'animate-spin text-slate-900' : 'animate-spin-hover'}`} />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-blue-100/80 max-w-lg leading-relaxed">
              Draft and issue professional high-quality receipts seamlessly.
            </p>
          </div>
          
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-4 shrink-0 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Invoice No.</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono bg-black/25 px-4 py-1.5 rounded-xl shadow-inner border border-white/5">{displayInvoiceNum}</span>
          </div>
        </div>
      </div>

      {shouldShowGuide && (
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start justify-between gap-6 shadow-sm text-left relative overflow-hidden"
          id="billing-first-time-setup-guide"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="flex items-start gap-4 z-10 w-full">
            <div className="bg-amber-100 p-3.5 rounded-2xl text-amber-700 shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-3 w-full">
              <h4 className="text-lg font-black text-amber-950 flex items-center gap-1.5 leading-none">
                POS Setup Assistance Needed!
              </h4>
              <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-2xl leading-relaxed">
                By default, advanced options are closed to keep your Workspace clean. 
                Firstly, click on the flashing <strong className="text-slate-900 underline decoration-amber-500 decoration-2">Settings Icon (⚙️)</strong> next to the <strong>Issue Invoice</strong> title to configure and design your ideal billing layout:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 w-full max-w-3xl">
                <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-amber-200">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <Barcode className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Barcode Scanner</span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-amber-200">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Print Formats</span>
                </div>
                
                <div className="flex items-center gap-2 bg-white/60 p-2.5 rounded-xl border border-amber-200">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Customer Entry</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2.5 mt-2 md:mt-0 lg:self-center z-10 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsBarcodeConfigOpen(true)}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-amber-400"
            >
              <Settings className="w-4 h-4" />
              Open Settings
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('vyapar_billing_setup_guided', 'true');
                setHasDismissedGuide(true);
                showToast("PoS Helper guide dismissed! Access settings anytime from the gear icon.", "info");
              }}
              className="px-4 py-3 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-amber-200 font-extrabold text-xs rounded-xl shadow-2xs transition cursor-pointer flex items-center justify-center"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmitBill}
        className="space-y-6 lg:space-y-8 w-full"
      >
        {initialBillToEdit && (
          <div className="w-full bg-indigo-50 border border-indigo-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm text-left">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-indigo-950">You are Editing Invoice #{initialBillToEdit.invoiceNumber}</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  You can update client information, modify items/payments, or add other transport details.
                  Choose to update this invoice in-place or save as a new transaction and delete/keep the old one.
                </p>
              </div>
            </div>
            {onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl shadow-xs transition shrink-0 cursor-pointer"
              >
                Cancel & Exit
              </button>
            )}
          </div>
        )}

        {/* Inputs & Form Sections Container */}
        <div className="space-y-6 lg:space-y-8">
          {/* COMPACT RECEIPT OUTPUT FORMAT TOGGLE BAR */}
          {profile?.documentFormatEnabled === true && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm text-left">
            <div className="flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">Receipt / Invoice Print Format:</span>
            </div>
            <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
              {(['A4', '80mm', '58mm'] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    if (fmt === 'A4') {
                      const cleanName = customerName.trim();
                      const hasCustomer = cleanName !== "" && cleanName !== "Cash / Walk-in" && cleanName !== "Cash";
                      if (!hasCustomer) {
                        showToast("Please fill customer details first to switch to A4 format!", "warning");
                        return;
                      }
                    }
                    setBillFormat?.(fmt);
                  }}
                  className={`flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    billFormat === fmt
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {fmt === 'A4' ? 'A4 Document' : `${fmt} Thermal`}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* CUSTOMER DETAILS CONTAINER */}
          {profile?.customerDetailsEnabled === true && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-400" />
                Customer Details
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCustModal(true);
                  setCustSearch("");
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 mr-1" />
                Search Existing
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 w-full relative">
                <label className="text-xs font-bold text-slate-700">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  ref={customerInputRef}
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(formatShopName(e.target.value).replace(/\b\w/g, c => c.toUpperCase()));
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (showCustomerDropdown && customerSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setCustomerDropdownIndex((prev) => (prev < customerSuggestions.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setCustomerDropdownIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selected = customerSuggestions[customerDropdownIndex];
                        if (selected) {
                          setCustomerName(selected.name);
                          setCustomerPhone(selected.phone || "");
                          setCustomerAddress(selected.address || "");
                          setCustomerGst(selected.gstNumber || "");
                          setShowCustomerDropdown(false);
                        }
                      }
                    } else {
                      handleEnterToNext(e);
                    }
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
                
                {/* Customer Autocomplete Dropdown */}
                {showCustomerDropdown && customerSuggestions.length > 0 && (
                  <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {customerSuggestions.map((cust, idx) => (
                      <div
                        key={cust.id}
                        className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${idx === customerDropdownIndex ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                        onMouseEnter={() => setCustomerDropdownIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          setCustomerName(cust.name);
                          setCustomerPhone(cust.phone || "");
                          setCustomerAddress(cust.address || "");
                          setCustomerGst(cust.gstNumber || "");
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div>
                          <p className={`text-sm font-bold ${idx === customerDropdownIndex ? 'text-indigo-900' : 'text-slate-800'}`}>{cust.name}</p>
                          {(cust.phone || cust.address) && (
                            <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                              {cust.phone} {cust.phone && cust.address ? '•' : ''} {cust.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatMobileNumber(e.target.value))}
                  onKeyDown={handleEnterToNext}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-4 py-3 bg-slate-50 border ${customerPhone && !validateMobileNumber(customerPhone) ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-200' : 'border-slate-200 focus:border-blue-500'} hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none`}
                />
                {customerPhone && !validateMobileNumber(customerPhone) && (
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">Please enter a valid 10-digit Indian mobile number</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(formatAddress(e.target.value))}
                  onKeyDown={handleEnterToNext}
                  placeholder="e.g. Flat 402, Sai Residency, Sector 15, Navi Mumbai"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">
                  Customer GSTIN{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customerGst}
                  onChange={(e) => setCustomerGst(formatGSTNumber(e.target.value))}
                  onKeyDown={handleEnterToNext}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className={`w-full px-4 py-3 bg-slate-50 border ${customerGst && !validateGSTNumber(customerGst) ? 'border-amber-400 focus:border-amber-500' : 'border-slate-200 focus:border-blue-500'} hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-mono uppercase`}
                />
                {customerGst && !validateGSTNumber(customerGst) && (
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5 font-sans">Format doesn't match standard GSTIN (e.g. 27AAAAA1234A1Z5)</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2 w-full mt-2">
                <label className="text-xs font-bold text-slate-700">
                  Notes / Terms & Conditions{" "}
                  <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Goods once sold will not be taken back..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none h-20"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enableOtherDetails}
                  onChange={(e) => setEnableOtherDetails(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 outline-none cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  Add Despatch & E-Way Details
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showSKU}
                  onChange={(e) => setShowSKU(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 outline-none cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  Show SKU on Invoice
                </span>
              </label>
            </div>

            {enableOtherDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-slate-200 p-4 bg-slate-50 rounded-2xl"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Transport Mode
                  </label>
                  <input
                    type="text"
                    value={transport}
                    onChange={(e) => setTransport(formatShopName(e.target.value))}
                    onKeyDown={handleEnterToNext}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-colors"
                    placeholder="e.g. Overland Cargo / Self Pick-up"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase())}
                    onKeyDown={handleEnterToNext}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-colors uppercase"
                    placeholder="e.g. MH-12-PQ-9876"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(formatShopName(e.target.value))}
                    onKeyDown={handleEnterToNext}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-colors"
                    placeholder="e.g. Maharashtra (State Code 27)"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Delivery Details
                  </label>
                  <input
                    type="text"
                    value={deliveryDetails}
                    onChange={(e) => setDeliveryDetails(formatShopName(e.target.value))}
                    onKeyDown={handleEnterToNext}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-400 transition-colors"
                    placeholder="e.g. Delivery terms - Door delivery within 3 working days"
                  />
                </div>
              </motion.div>
            )}
          </div>
          )}

          {/* COMPACT BARCODE SCANNER */}
          {profile?.barcodeScannerEnabled && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 text-left relative z-10 transition-all">
              <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
                    <Barcode className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Fast Scan</h3>
                    <div className="text-[10px] text-slate-500 font-medium">Add items directly</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative group flex items-center gap-2">
                <div className="relative w-full">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeText}
                    onChange={(e) => setBarcodeText(e.target.value)}
                    onFocus={() => setIsScannerFocused(true)}
                    onBlur={() => {
                        setTimeout(() => setIsScannerFocused(false), 200);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeSubmit(e);
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setScannerSelectedIndex(prev => Math.min(prev + 1, scannerSuggestions.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setScannerSelectedIndex(prev => Math.max(prev - 1, 0));
                        } else if (e.key === 'Escape') {
                          setBarcodeText('');
                          setIsScannerFocused(false);
                        }
                    }}
                    placeholder="Scan Barcode / SKU / Name..."
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 transition-all outline-none"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowScannerModal(true)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Use Camera Scanner"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleBarcodeSubmit}
                    disabled={!barcodeText.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>

                <AnimatePresence>
                  {isScannerFocused && barcodeText.trim().length > 0 && scannerSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                    >
                      <div className="max-h-[250px] overflow-y-auto p-1">
                        {scannerSuggestions.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setScannerSelectedIndex(idx);
                              setTimeout(() => handleBarcodeSubmit(), 0);
                            }}
                            onMouseEnter={() => setScannerSelectedIndex(idx)}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                              scannerSelectedIndex === idx ? 'bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${scannerSelectedIndex === idx ? 'text-blue-700' : 'text-slate-800'}`}>
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.sku && `SKU: ${item.sku} | `}Stock: {item.stock}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-700">₹{item.sellingPrice.toLocaleString('en-IN')}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          <AnimatePresence mode="popLayout">
            {scanFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-3 transition-all ${
                  scanFeedback.type === 'success'
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : scanFeedback.type === 'warning'
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                <div className="p-1">
                  {scanFeedback.type === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : scanFeedback.type === 'warning' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <span>{scanFeedback.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

        {/* DYNAMIC PRODUCT ENTRY SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 pb-4 border-b border-slate-100 flex items-center justify-between bg-white text-left">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center">
                <Receipt className="w-4 h-4 mr-2 text-slate-400" />
                Products & Services
              </h3>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enableHsn}
                  onChange={(e) => setEnableHsn(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 outline-none cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                  Show HSN/SAC
                </span>
              </label>
            </div>

            <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 flex flex-col" style={{ scrollBehavior: 'smooth' }}>
              {/* Product header legend */}
              <div className="hidden lg:grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-3 text-left relative">
                <div ref={listStartRef} className="absolute -top-10" />
                <div className={enableHsn ? "col-span-3" : "col-span-4"}>
                  Item Name
                </div>
                {enableHsn && <div className="col-span-2">HSN</div>}
                <div
                  className={
                    enableHsn
                      ? "col-span-2 text-right"
                      : "col-span-2 text-right"
                  }
                >
                  Quantity
                </div>
                <div className={enableHsn ? "col-span-1" : "col-span-2"}>
                  Unit
                </div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right pr-12 flex items-center justify-end gap-2">
                  Amount
                  {products.length > 3 && (
                    <button type="button" title="Jump to bottom" onClick={() => listEndRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'})} className="cursor-pointer text-slate-400 hover:text-blue-500">
                      ↓
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {products.map((p, index) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="group/row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-5 items-start bg-white p-5 md:p-6 border border-slate-200/60 rounded-[1.5rem] relative shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-200/80 transition-all focus-within:ring-4 focus-within:ring-blue-50/50 focus-within:border-blue-300 text-left"
                    >
                      {/* Product Name */}
                      <div
                        className={`col-span-1 sm:col-span-2 ${enableHsn ? "lg:col-span-3" : "lg:col-span-4"} space-y-2`}
                      >
                        <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                          Item Name
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <ProductAutocomplete
                              value={p.name}
                              inventoryId={p.inventoryId}
                              inventory={inventory}
                              onChange={(val) => {
                                if (p.inventoryId) {
                                    handleProductChange(p.id, "inventoryId", undefined);
                                    handleProductChange(p.id, "sku", undefined);
                                }
                                handleProductChange(p.id, "name", val);
                              }}
                              onSelect={(item) => {
                                if (item) {
                                  handleInventorySelect(p.id, item.id);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* HSN */}
                      {enableHsn && (
                        <div className="col-span-1 lg:col-span-2 space-y-2">
                          <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                            HSN/SAC
                          </label>
                          <input
                            type="text"
                            value={p.hsn || ""}
                            onChange={(e) =>
                              handleProductChange(p.id, "hsn", e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
                            }
                            onKeyDown={handleEnterToNext}
                            placeholder="e.g. 8471"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                          />
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="col-span-1 lg:col-span-2 space-y-2">
                        <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                          Quantity
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0.01"
                            required
                            value={p.quantity || ""}
                            onChange={(e) => {
                              let valStr = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = valStr.split('.');
                              if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                              handleProductChange(p.id, "quantity", valStr);
                            }}
                            onKeyDown={(e) => {
                              if (['-', 'e', '+'].includes(e.key)) {
                                e.preventDefault();
                              }
                              handleEnterToNext(e);
                            }}
                            onBlur={() => {
                              if (Number(p.quantity) <= 0) {
                                handleProductChange(p.id, "quantity", "1");
                                showToast("ℹ️ Quantity reset to 1", "info");
                              }
                            }}
                            placeholder="e.g. 1"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all lg:text-right shadow-sm"
                          />
                          {!!p.quantity && Number(p.quantity) > 0 && (
                            <span className="absolute right-2 -bottom-2.5 text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 z-10 pointer-events-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                              Qty: {Number(p.quantity).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unit */}
                      <div className={`col-span-1 ${enableHsn ? "lg:col-span-1" : "lg:col-span-2"} space-y-2`}>
                        <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                          Unit
                        </label>
                        <div className="relative">
                          <select
                            value={p.unit}
                            onChange={(e) =>
                              handleProductChange(p.id, "unit", e.target.value)
                            }
                            onKeyDown={handleEnterToNext}
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-4 pr-8 py-3 text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer shadow-sm"
                          >
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="col-span-1 lg:col-span-2 space-y-2">
                        <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                          Rate
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            required
                            value={p.price || ""}
                            onChange={(e) => {
                              let valStr = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = valStr.split('.');
                              if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                              handleProductChange(p.id, "price", valStr);
                            }}
                            onKeyDown={(e) => {
                              if (['-', 'e', '+'].includes(e.key)) {
                                e.preventDefault();
                              }
                              handleEnterToNext(e);
                            }}
                            onBlur={() => {
                              if (Number(p.price) < 0) {
                                handleProductChange(p.id, "price", "0");
                              }
                            }}
                            placeholder="e.g. 450.00"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all lg:text-right shadow-sm"
                          />
                          {!!p.price && Number(p.price) > 0 && (
                            <span className="absolute right-2 -bottom-2.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 z-10 pointer-events-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                              ₹{Number(p.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount / Total */}
                      <div className="col-span-1 sm:col-span-2 lg:col-span-2 space-y-2 h-full flex flex-col justify-end mt-2 lg:mt-0">
                        <label className="lg:hidden text-[11px] uppercase font-bold tracking-wider text-slate-500">
                          Amount
                        </label>
                        <div className="py-3 px-4 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-sm font-mono font-bold text-indigo-900 lg:text-right truncate flex items-center justify-between lg:justify-end shadow-sm">
                          <span className="lg:hidden text-indigo-400/80 font-sans text-xs">
                            Total:
                          </span>
                          <span>
                            ₹
                            {p.total.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute -top-3 -right-3 lg:top-1/2 lg:-right-4 lg:-translate-y-1/2 flex lg:flex-col gap-1.5 items-center bg-white p-1.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-slate-200/80 lg:opacity-0 focus-within:opacity-100 group-hover/row:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer bg-white"
                          title="Duplicate Item"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer bg-white"
                          title="Remove Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="text-sm font-bold text-blue-600 bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all py-3 px-6 rounded-xl flex items-center space-x-2 shadow-sm"
                >
                  <Plus className="h-4.5 w-4.5" />{" "}
                  <span>Add New Item</span>
                </button>
                {products.length > 3 && (
                  <button type="button" onClick={() => listStartRef.current?.scrollIntoView({behavior: 'smooth', block: 'center'})} className="text-xs font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 cursor-pointer">
                    ↑ Top
                  </button>
                )}
                <div ref={listEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Summary Panel */}
        <div className="space-y-6">
          <div className="bg-white border text-slate-800 border-slate-200/80 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
             
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center border-b border-slate-100 pb-4 relative z-10">
              Payment Summary
            </h3>

            <div className="space-y-4 relative z-10">
              {/* Sub Total */}
              <div className="flex justify-between items-center text-sm px-1">
                <span className="font-semibold text-slate-500">Sub Total</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹
                  {subTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Discount */}
              <div className="flex justify-between items-center text-sm p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                <span className="font-semibold text-slate-600">Discount (%)</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-emerald-600 font-bold">
                    -₹{discountAmount}
                  </span>
                    <input
                      ref={discountInputRef}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercent || ""}
                      onChange={(e) => {
                        let val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                        if (val > 100) val = 100;
                        setDiscountPercent(val);
                      }}
                      onKeyDown={handleEnterToNext}
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* GST Rate */}
                <div className="flex justify-between items-center text-sm p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                  <span className="font-semibold text-slate-600">GST / Taxes</span>
                  <div className="flex items-center space-x-2">
                    {gstAmount > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 font-medium mr-1 flex flex-col text-right">
                        <span>CGST ({(gstRate/2)}%): ₹{cgstAmount}</span>
                        <span>SGST ({(gstRate/2)}%): ₹{sgstAmount}</span>
                      </span>
                    )}
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      onKeyDown={handleEnterToNext}
                      className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                    >
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}% GST
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Transport Cost */}
                <div className="flex justify-between items-center text-sm p-4 bg-slate-50/80 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50">
                  <span className="font-semibold text-slate-600">Transport Cost (₹)</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={transportCost || ""}
                      onChange={(e) => {
                        let val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                        setTransportCost(val);
                      }}
                      onKeyDown={handleEnterToNext}
                      className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 text-right font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

              {/* Grand Total Highlight */}
              <div className="flex flex-col items-center py-8 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  <span className="text-2xl text-slate-400 font-medium mr-1">
                    ₹
                  </span>
                  {finalBillTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-3 pt-6 pb-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMode(opt.value)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col justify-center items-center h-12 shadow-sm relative overflow-hidden ${
                        paymentMode === opt.value
                          ? "bg-blue-600 border-blue-600 text-white shadow-[0_2px_15px_-3px_rgba(37,99,235,0.4)]"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {paymentMode === opt.value && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></span>}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              {paymentMode !== "CREDIT" && (
                <div className="flex flex-col space-y-3 p-4 md:p-5 bg-slate-50/80 rounded-2xl border border-slate-100 mt-4 transition-colors">
                  <div className="flex justify-between items-center text-sm w-full">
                    <span className="font-semibold text-slate-700">
                      Amount Paid
                    </span>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <span className={`text-[11px] font-bold uppercase tracking-wide transition-colors flex items-center ${isFullPayment ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`}>
                        Full Payment
                      </span>
                      <div
                        className={`w-10 h-5 rounded-full transition-colors relative shadow-inner ${isFullPayment ? "bg-blue-500" : "bg-slate-300"}`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform shadow-[0_1px_3px_rgba(0,0,0,0.1)] ${isFullPayment ? "translate-x-5" : ""}`}
                        ></div>
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={isFullPayment}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsFullPayment(checked);
                          if (checked) {
                            setPaidAmount(finalBillTotal);
                          } else {
                            setPaidAmount(0);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="relative w-full">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm transition-colors ${isFullPayment ? 'text-slate-400 opacity-50' : 'text-slate-400 font-bold'}`}>
                      ₹
                    </span>
                    <input
                      ref={paidAmountInputRef}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={finalBillTotal}
                      value={paidAmount === 0 ? "" : paidAmount}
                      onChange={(e) => {
                        if (!isFullPayment) {
                          let valStr = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = valStr.split('.');
                          if (parts.length > 2) valStr = parts[0] + '.' + parts.slice(1).join('');
                          let numVal = Number(valStr) || 0;
                          
                          // Strict guard: cannot pay greater than final invoice total
                          if (numVal > finalBillTotal) {
                            numVal = finalBillTotal;
                            valStr = finalBillTotal.toString();
                            playBeep('alert');
                            showToast(`⚠️ Capped at invoice total (₹${finalBillTotal.toLocaleString('en-IN')})`, "warning");
                          }
                          setPaidAmount(numVal);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (['-', 'e', '+'].includes(e.key)) {
                          e.preventDefault();
                        }
                        handleEnterToNext(e);
                      }}
                      onBlur={() => {
                        if (paidAmount < 0) {
                          setPaidAmount(0);
                        }
                      }}
                      disabled={isFullPayment}
                      className={`w-full rounded-xl pl-8 pr-4 py-3 text-right font-mono font-bold text-lg focus:outline-none transition-all ${
                        isFullPayment
                          ? "bg-slate-100 border border-slate-200 text-emerald-600/70 select-none shadow-inner"
                          : "bg-white border border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 shadow-sm"
                      }`}
                    />
                  </div>
                  
                  {/* Paid Amount Live Mask Helper */}
                  {!isFullPayment && paidAmount > 0 && (
                    <div className="text-right mt-1.5 text-[10px] font-black text-emerald-600 font-mono animate-fade-in">
                      Live Format: {paidAmount.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                    </div>
                  )}
                  
                  {/* Quick Cash / Exact / Rounded flow buttons */}
                  {!isFullPayment && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaidAmount(finalBillTotal);
                          setIsFullPayment(true);
                          playBeep('success');
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        Exact Total
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rounded = Math.round(finalBillTotal);
                          setPaidAmount(rounded);
                          setIsFullPayment(rounded === finalBillTotal);
                          playBeep('success');
                          showToast(`Draft rounded to ₹${rounded}`, "info");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        Round Off
                      </button>
                      {/* Generative Denominations based on what is closest to the total */}
                      {[10, 50, 100, 500, 1000].map(denom => {
                        // Only show options useful for the scale of this total
                        if (denom > finalBillTotal * 4 && denom > 10) return null;
                        return (
                          <button
                            key={denom}
                            type="button"
                            onClick={() => {
                              const newVal = Math.min(finalBillTotal, paidAmount + denom);
                              setPaidAmount(newVal);
                              setIsFullPayment(newVal === finalBillTotal);
                              playBeep('success');
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          >
                            +₹{denom}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setPaidAmount(0);
                          setIsFullPayment(false);
                        }}
                        className="px-3 py-1.5 ml-auto bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Balance Due warning */}
              {balance > 0 && paymentMode !== "CREDIT" && (
                <div className="flex justify-between items-center text-sm p-4 bg-amber-50 rounded-2xl border border-amber-200/60 shadow-sm relative z-10 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-2xl"></div>
                   <span className="font-bold text-amber-700 pl-2">Balance Due</span>
                  <span className="font-mono font-black text-amber-600 text-lg">
                    ₹
                    {balance.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              {paymentMode === "CREDIT" && finalBillTotal > 0 && (
                <div className="flex justify-between items-center text-sm p-4 bg-amber-50 rounded-2xl border border-amber-200/60 shadow-sm relative z-10 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-2xl"></div>
                  <span className="font-bold text-amber-700 pl-2">
                    Full Amount Due
                  </span>
                  <span className="font-mono font-black text-amber-600 text-lg">
                    ₹
                    {finalBillTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
            </div>

            {initialBillToEdit ? (
              <div className="flex flex-col gap-3 mt-8">
                {/* 1. Overwrite Existing Invoice */}
                <button
                  type="button"
                  disabled={isGenerating || finalBillTotal === 0}
                  onClick={() => runFormValidationAndTrigger('update')}
                  className={`w-full inline-flex items-center justify-center py-4 px-4 rounded-2xl text-white font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden ${
                    isGenerating
                      ? "bg-emerald-800 shadow-none pointer-events-none"
                      : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-900/50"
                  }`}
                >
                  {isGenerating && (
                    <div className="absolute inset-0 bg-emerald-500/20">
                      <div className="h-full w-1/3 bg-white/20 skew-x-12 -ml-20 animate-[slide_1.5s_infinite]"></div>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-2 relative z-10 w-full">
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin opacity-80" />
                        <span className="text-sm font-black">{generationStep || "Updating..."}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm tracking-wide">
                          Overwrite & Replace Invoice #{initialBillToEdit.invoiceNumber}
                        </span>
                        <ArrowRight className="h-4.5 w-4.5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                      </>
                    )}
                  </div>
                </button>

                {/* 2. Save as brand new Invoice (and keep original) */}
                <button
                  type="button"
                  disabled={isGenerating || finalBillTotal === 0}
                  onClick={() => runFormValidationAndTrigger('create')}
                  className={`w-full inline-flex items-center justify-center py-3 px-4 rounded-2xl font-bold transition-all border shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden ${
                    isGenerating
                      ? "bg-slate-200 text-slate-400 border-slate-200 pointer-events-none"
                      : "bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 shadow-indigo-900/10"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2 relative z-10 w-full">
                    <span className="text-sm tracking-wide">
                      Save as Brand New Invoice (Keep Both)
                    </span>
                    <Plus className="h-4.5 w-4.5 opacity-70" />
                  </div>
                </button>

                {/* 3. Cancel */}
                {onCancelEdit && (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={onCancelEdit}
                    className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-2xl font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs cursor-pointer shadow-inner"
                  >
                    Cancel Edit & Go Back to History
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-8">
                <button
                  type="submit"
                disabled={isGenerating || finalBillTotal === 0}
                className={`w-full inline-flex flex-col items-center justify-center py-4 px-4 rounded-2xl text-white font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-8 relative overflow-hidden ${
                  isGenerating
                    ? "bg-blue-800 shadow-none pointer-events-none"
                    : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-900/50"
                }`}
              >
                {isGenerating && (
                  <div className="absolute inset-0 bg-blue-500/20">
                    <div className="h-full w-1/3 bg-white/20 skew-x-12 -ml-20 animate-[slide_1.5s_infinite]"></div>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-2 relative z-10 w-full">
                  {isGenerating ? (
                    <>
                       <RefreshCw className="h-5 w-5 animate-spin opacity-80" />
                       <div className="flex flex-col items-start leading-tight">
                         <span className="text-sm font-black">
                           {generationStep || "Processing..."}
                         </span>
                         <span className="text-[10px] font-medium text-blue-200 capitalize">
                           Please wait do not close
                         </span>
                       </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm tracking-wide">
                        Generate Final Invoice
                      </span>
                      <ArrowRight className="h-4.5 w-4.5 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
                    </>
                  )}
                </div>
              </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Customer Picker Modal */}
      {showCustModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden text-left flex flex-col max-h-[85vh] text-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Select Existing Customer</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Quickly autofill billing contacts from your past invoices</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCustModal(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full cursor-pointer shadow-sm"
              >
                <XCircle className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name or mobile number..."
                  value={custSearch}
                  onChange={e => setCustSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[50vh]">
              {previousCustomers
                .filter(c => 
                  c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                  c.phone.includes(custSearch)
                )
                .map((cust, idx) => (
                  <button
                    key={`${cust.phone}_${idx}`}
                    type="button"
                    onClick={() => {
                      setCustomerName(cust.name);
                      setCustomerPhone(cust.phone);
                      setCustomerAddress(cust.address);
                      setCustomerGst(cust.gstNumber || '');
                      if (cust.otherDetails) {
                        setTransport(cust.otherDetails.transport || '');
                        setVehicleNumber(cust.otherDetails.vehicleNumber || '');
                        setPlaceOfSupply(cust.otherDetails.placeOfSupply || '');
                        setGstin(cust.otherDetails.gstin || '');
                        setDeliveryDetails(cust.otherDetails.deliveryDetails || '');
                        setEnableOtherDetails(true);
                      }
                      setShowCustModal(false);
                    }}
                    className="w-full p-4 flex flex-col text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-800">{cust.name}</span>
                    <span className="text-[11px] font-medium text-slate-500 mt-1 flex items-center">
                      <span className="mr-3">📱 {cust.phone || 'No phone'}</span>
                      {cust.gstNumber && <span>🏢 GSTIN: {cust.gstNumber}</span>}
                    </span>
                    {cust.address && (
                      <span className="text-[10px] text-slate-400 truncate mt-1">📍 {cust.address}</span>
                    )}
                  </button>
                ))
              }
              {previousCustomers.filter(c => 
                c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                c.phone.includes(custSearch)
              ).length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  No matching customers found.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Settings / Config popup modal */}
      {createPortal(
        <AnimatePresence>
          {isBarcodeConfigOpen && (
            <motion.div 
              key="settings-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-slate-900" 
              onClick={() => setIsBarcodeConfigOpen(false)}
            >
              <motion.div 
                key="settings-modal"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
                className="bg-white rounded-[2rem] shadow-[0_24px_70px_rgba(0,0,0,0.25)] border-2 border-slate-400 p-6 sm:p-7 w-full max-w-[360px] text-left relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col mb-6 relative">
                  <div className="absolute top-0 right-0">
                    <button
                      type="button"
                      onClick={() => setIsBarcodeConfigOpen(false)}
                      className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer transition shadow-sm"
                    >
                      <XCircle className="w-5 h-5"/>
                    </button>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Billing Settings</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">Customize your POS experience and workflow.</p>
                </div>

                <div className="space-y-3">
                  {/* Barcode Option */}
                  <div 
                    onClick={async () => {
                      const currentEnabled = !!profile?.barcodeScannerEnabled;
                      try {
                        await saveProfile({
                          ...profile,
                          barcodeScannerEnabled: !currentEnabled
                        });
                        showToast(`Barcode scanner ${!currentEnabled ? "enabled" : "disabled"}`, "success");
                      } catch (e) {
                        showToast("Failed to save barcode scanner state.", "error");
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-xs group relative overflow-hidden text-left cursor-pointer select-none active:scale-[0.98] ${
                      profile?.barcodeScannerEnabled 
                        ? 'bg-blue-50/20 border-blue-500 hover:bg-blue-50/40' 
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-500 rounded-l-2xl"></div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        profile?.barcodeScannerEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Barcode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Barcode Scanner</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enable real-time item scanning</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        profile?.barcodeScannerEnabled ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                      id="barcode-scanner-toggle-switch"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger identical action Click
                        const currentEnabled = !!profile?.barcodeScannerEnabled;
                        saveProfile({ ...profile, barcodeScannerEnabled: !currentEnabled });
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          profile?.barcodeScannerEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Format Option */}
                  <div 
                    onClick={async () => {
                      const currentEnabled = profile?.documentFormatEnabled === true;
                      try {
                        await saveProfile({
                          ...profile,
                          documentFormatEnabled: !currentEnabled
                        });
                        showToast(`Print format selector ${!currentEnabled ? "enabled" : "disabled"}`, "success");
                      } catch (e) {
                        showToast("Failed to save settings.", "error");
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-xs group relative overflow-hidden text-left cursor-pointer select-none active:scale-[0.98] ${
                      profile?.documentFormatEnabled === true
                        ? 'bg-indigo-50/20 border-indigo-500 hover:bg-indigo-50/40' 
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-indigo-500 rounded-l-2xl"></div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        profile?.documentFormatEnabled === true ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Print Formats</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enable format selector bar</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        profile?.documentFormatEnabled === true ? 'bg-indigo-600' : 'bg-slate-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentEnabled = profile?.documentFormatEnabled === true;
                        saveProfile({ ...profile, documentFormatEnabled: !currentEnabled });
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          profile?.documentFormatEnabled === true ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Customer Option */}
                  <div 
                    onClick={async () => {
                      const currentEnabled = profile?.customerDetailsEnabled === true;
                      try {
                        await saveProfile({
                          ...profile,
                          customerDetailsEnabled: !currentEnabled
                        });
                        showToast(`Customer details form ${!currentEnabled ? "enabled" : "disabled"}`, "success");
                      } catch (e) {
                        showToast("Failed to save settings.", "error");
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all shadow-xs group relative overflow-hidden text-left cursor-pointer select-none active:scale-[0.98] ${
                      profile?.customerDetailsEnabled === true
                        ? 'bg-purple-50/20 border-purple-500 hover:bg-purple-50/40' 
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-purple-500 rounded-l-2xl"></div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        profile?.customerDetailsEnabled === true ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Customer Details</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enable client entry section</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                        profile?.customerDetailsEnabled === true ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentEnabled = profile?.customerDetailsEnabled === true;
                        saveProfile({ ...profile, customerDetailsEnabled: !currentEnabled });
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                          profile?.customerDetailsEnabled === true ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}


      {/* Barcode Scanner Modal Component */}
      {showScannerModal && profile?.barcodeScannerEnabled && createPortal(
        <React.Suspense fallback={<div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm" />}>
          <BarcodeScannerModal 
            onClose={() => setShowScannerModal(false)}
            onScan={handleCameraScan}
          />
        </React.Suspense>,
        document.body
      )}
    </div>
  );
}
