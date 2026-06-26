/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  Download,
  Printer,
  ArrowLeft,
  Share2,
  RefreshCw,
  Phone,
  MapPin,
  Check,
  Copy,
  Mail,
  Palette,
  Contrast,
  Edit,
} from "lucide-react";
import { useBilling } from "../context/BillingContext";
import { Bill } from "../types";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import appLogo from '../assets/images/app_logo_1780216474773.png';
import { createFastComputedStyleProxy } from "../utils/stylePatch";

interface InvoiceTemplateProps {
  bill: Bill;
  onBack: () => void;
  billFormat?: 'A4' | 'A5' | '80mm' | '58mm';
  setBillFormat?: (format: 'A4' | 'A5' | '80mm' | '58mm') => void;
  onEdit?: () => void;
}

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numToString = (n: number): string => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + a[n % 10] : " ");
  };

  const convertGroup = (n: number): string => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    str += numToString(n);
    return str;
  };

  let str = "";
  let n = Math.floor(num); // only convert whole number part

  if (n > 9999999) {
    // Crore
    str += convertGroup(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (n > 99999) {
    // Lakh
    str += convertGroup(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (n > 999) {
    // Thousand
    str += convertGroup(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    str += convertGroup(n);
  }

  return str.trim() + " Rupees Only";
};

// Helper function to convert a single oklch color string to standard rgb/rgba (imported from utils/stylePatch)

const getAppHostname = (): string => {
  return "smartvyapar.vercel.app";
};

const getAppUrl = (): string => {
  return "https://smartvyapar.vercel.app/";
};


// Dynamically scales down font sizes for long text strings to keep sections responsive
const getDynamicFontSize = (text: string, baseSize: number, maxLength: number, minSize: number = 7): string => {
  const charCount = (text || "").length;
  if (charCount <= maxLength) return `${baseSize}px`;
  const scaleFactor = maxLength / charCount;
  const scaledSize = Math.max(minSize, baseSize * scaleFactor);
  return `${scaledSize.toFixed(1)}px`;
};

export default function InvoiceTemplate({
  bill,
  onBack,
  billFormat = 'A4',
  setBillFormat,
  onEdit,
}: InvoiceTemplateProps) {
  const { user, profile, showToast } = useBilling();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const getInvoiceQRData = (): { type: 'upi' | 'image' | 'none', data: string } => {
    if (profile?.upiId) {
      const cleanUpi = profile.upiId.trim();
      const cleanShopName = profile.shopName ? profile.shopName.trim() : 'Smart Vyapar';
      const payableAmount = (bill.balanceAmount !== undefined && bill.balanceAmount > 0) ? bill.balanceAmount : bill.totalAmount;
      const cleanAmount = payableAmount ? Number(payableAmount).toFixed(2) : '0.00';
      const upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanShopName)}&am=${encodeURIComponent(cleanAmount)}&cu=INR`;
      return { type: 'upi', data: upiUri };
    }
    if (profile?.qrCode) {
      return { type: 'image', data: profile.qrCode };
    }
    return { type: 'none', data: '' };
  };
  const zoomContainerRef = useRef<HTMLDivElement>(null);
  const exportInvoiceRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isBW, setIsBW] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePdfBlobUrl, setSharePdfBlobUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // States to track share copying
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [printImages, setPrintImages] = useState<string[]>([]);
  const [isPrintingPrecompile, setIsPrintingPrecompile] = useState(false);

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    if (sharePdfBlobUrl) {
      URL.revokeObjectURL(sharePdfBlobUrl);
      setSharePdfBlobUrl(null);
    }
  };

  // Auto-fit A4 sheet into responsive width cleanly
  React.useEffect(() => {
    const updateScale = () => {
      if (!zoomContainerRef.current) return;
      
      const isLg = window.innerWidth >= 1024;
      const sidebarWidth = isLg ? 256 : 0;
      const mainPadding = isLg ? 64 : (window.innerWidth >= 768 ? 48 : 32);
      const containerPadding = 32; // px-4 padding as 16x2 on zoom container
      
      const availableWidth = window.innerWidth - sidebarWidth - mainPadding - containerPadding - 16;
      const targetWidth = 794;
      
      if (availableWidth < targetWidth) {
        setScale(Math.max(0.2, availableWidth / targetWidth));
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 150);

    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, []);

  // Highly restricted rule: without customer details, cannot make or show bill in A4 sheet under any condition
  React.useEffect(() => {
    const custName = bill.customerDetails?.name?.trim();
    const hasCustomer = !!(custName && custName !== "" && custName !== "Cash / Walk-in" && custName !== "Cash");
    if (!hasCustomer && billFormat === 'A4') {
      if (setBillFormat) {
        setBillFormat('80mm');
        showToast("A4 sheets are restricted without customer details. Automatically fell back to Thermal format.", "warning");
      }
    }
  }, [bill.customerDetails, billFormat, setBillFormat, showToast]);

  const generateCanvases = async (exportRef: React.RefObject<HTMLDivElement | null>, bwMode = false): Promise<HTMLCanvasElement[] | null> => {
    if (!exportRef.current) return null;
    
    setIsBW(bwMode);

    try {
      // Wait for all custom fonts to be fully loaded with a timeout to prevent hanging
      if (typeof document !== "undefined" && document.fonts) {
        await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
      }
      
      const parentElement = exportRef.current;
      const pageElements = Array.from(parentElement.querySelectorAll(".print-page-ct"));
      if (pageElements.length === 0) return null;

      // Render canvases of all pages sequentially to avoid freezing the browser main thread
      const canvases: HTMLCanvasElement[] = [];
      for (const pageEl of pageElements) {
        const canvas = await html2canvas(pageEl as HTMLElement, {
          scale: 2, // Standard scale for good quality/performance ratio
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          allowTaint: false,
          imageTimeout: 1500,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            if (clonedDoc.defaultView) {
              const originalGetComputedStyleClone = clonedDoc.defaultView.getComputedStyle;
              clonedDoc.defaultView.getComputedStyle = (elt, pseudoElt) => {
                const styles = originalGetComputedStyleClone(elt, pseudoElt);
                return createFastComputedStyleProxy(styles);
              };
            }
          }
        });
        canvases.push(canvas);
      }

      return canvases;
    } catch (error) {
      console.error("Canvas compilation failed:", error);
      return null;
    } finally {
      setIsBW(false);
    }
  };

  const generatePDFBlob = async (exportRef: React.RefObject<HTMLDivElement | null>, bwMode = false): Promise<Blob | null> => {
    try {
      const canvases = await generateCanvases(exportRef, bwMode);
      if (!canvases || canvases.length === 0) return null;

      let pdf: jsPDF;
      let imgWidth: number;
      let imgHeightFn: (canvas: HTMLCanvasElement) => number;

      if (billFormat === 'A4') {
        pdf = new jsPDF("p", "mm", "a4");
        imgWidth = 210;
        imgHeightFn = (canvas) => (canvas.height * imgWidth) / canvas.width;
      } else if (billFormat === 'A5') {
        pdf = new jsPDF("p", "mm", "a5");
        imgWidth = 148;
        imgHeightFn = (canvas) => (canvas.height * imgWidth) / canvas.width;
      } else {
        const canvas = canvases[0];
        const pixelWidth = canvas.width;
        const pixelHeight = canvas.height;
        imgWidth = billFormat === '80mm' ? 80 : 58;
        const calcHeight = (pixelHeight * imgWidth) / pixelWidth;
        pdf = new jsPDF("p", "mm", [imgWidth, calcHeight]);
        imgHeightFn = () => calcHeight;
      }

      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        // PNG is lossless and produces extremely sharp text lines without JPEG compression noise
        const imgData = canvas.toDataURL("image/png");
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeightFn(canvas), undefined, "FAST");
      }

      return pdf.output("blob");
    } catch (error) {
      console.error("PDF compiling failed:", error);
      return null;
    }
  };

  const handleDownloadPDF = async (bwMode = false) => {
    const custName = bill.customerDetails?.name?.trim();
    const hasCustomer = !!(custName && custName !== "" && custName !== "Cash / Walk-in" && custName !== "Cash");
    if (!hasCustomer && billFormat === 'A4') {
      showToast("Cannot download A4 bill without customer details. Standard Thermal format is permitted.", "error");
      return;
    }
    setIsDownloading(true);
    const blob = await generatePDFBlob(exportInvoiceRef, bwMode);
    setIsDownloading(false);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${bill.invoiceNumber}${bwMode ? "_BW" : ""}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Invoice PDF downloaded successfully!", "success");
    } else {
      showToast("Failed to render and download PDF.", "error");
    }
  };

  const handlePrint = async () => {
    const custName = bill.customerDetails?.name?.trim();
    const hasCustomer = !!(custName && custName !== "" && custName !== "Cash / Walk-in" && custName !== "Cash");
    if (!hasCustomer && billFormat === 'A4') {
      showToast("Cannot print A4 bill without customer details. Standard Thermal format is permitted.", "error");
      return;
    }
    
    if (!exportInvoiceRef.current) {
      showToast("Invoice markup not ready.", "error");
      return;
    }

    try {
      setIsPrintingPrecompile(true);
      showToast("Preparing pixel-perfect print layout...", "info");
      
      // Let React yield to ensure UI is ready
      await new Promise((r) => setTimeout(r, 100));

      const canvases = await generateCanvases(exportInvoiceRef, isBW);
      if (!canvases || canvases.length === 0) {
        showToast("Failed to compile print layout.", "error");
        setIsPrintingPrecompile(false);
        return;
      }

      // Convert canvases to base64 images
      const images = canvases.map(canvas => canvas.toDataURL("image/png"));
      setPrintImages(images);

      // Wait a tiny bit for React state to update and mount high-resolution images in DOM
      await new Promise((r) => setTimeout(r, 200));

      window.print();
    } catch (err) {
      console.error("Print pre-compilation error:", err);
      showToast("Print failed to initiate.", "error");
    } finally {
      setIsPrintingPrecompile(false);
      // Clean up print images after the spooler starts (blocking in most browsers, safe after window.print() finishes)
      setPrintImages([]);
    }
  };

  const formattedTotal = (bill.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // Generate detailed itemized description for text share
  const itemsText = (bill.products || [])
    .map((p, idx) => `  ${idx + 1}. *${p.name}* (x${p.quantity}) - ₹${(p.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`)
    .join("\n");

  const cgstAmount = bill.cgstAmount || (bill.gstAmount || 0) / 2;
  const sgstAmount = bill.sgstAmount || (bill.gstAmount || 0) / 2;

  const shareText = `🧾 *INVOICE BILL SUMMARY*
---------------------------------------
📄 *Invoice No:* ${bill.invoiceNumber}
📅 *Date:* ${new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
🏢 *Business:* ${profile?.shopName || "Our Store"}
👤 *Customer:* ${bill.customerDetails?.name || "Walk-in"}
---------------------------------------
🛍️ *Items Purchased:*
${itemsText || "  No items listed"}
---------------------------------------
💵 *Subtotal:* ₹${(bill.subTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
📊 *CGST:* ₹${cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
📊 *SGST:* ₹${sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
💰 *Grand Total:* ₹${formattedTotal}

Thank you for your business!`;

  const handleShare = async () => {
    setIsSharing(true);
    showToast("Opening WhatsApp...", "info");
    
    try {
      const cleanPhone = bill.customerDetails?.phone ? bill.customerDetails.phone.replace(/\D/g, '') : '';
      const phoneWithCountry = cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : '';

      const encodedText = encodeURIComponent(shareText);

      // App URLs
      const appUrl = phoneWithCountry 
        ? `whatsapp://send?phone=${phoneWithCountry}&text=${encodedText}`
        : `whatsapp://send?text=${encodedText}`;

      // Web WhatsApp link
      const webUrl = phoneWithCountry
        ? `https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`
        : `https://web.whatsapp.com/send?text=${encodedText}`;

      // Universal wa.me URL
      const waMeUrl = phoneWithCountry
        ? `https://wa.me/${phoneWithCountry}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        typeof navigator !== "undefined" ? navigator.userAgent : ""
      );

      if (isMobile) {
        // Try opening appUrl first, fallback to waMeUrl if needed
        const start = Date.now();
        window.location.href = appUrl;
        
        setTimeout(() => {
          if (Date.now() - start < 1500) {
            window.open(waMeUrl, "_blank", "noopener,noreferrer");
          }
        }, 800);
      } else {
        // Desktop blur checks
        let appOpened = false;
        const onBlur = () => {
          appOpened = true;
        };
        window.addEventListener("blur", onBlur);
        window.location.href = appUrl;

        setTimeout(() => {
          window.removeEventListener("blur", onBlur);
          if (!appOpened && !document.hidden) {
            window.open(webUrl, "_blank", "noopener,noreferrer");
          }
        }, 1200);
      }
      showToast("WhatsApp launched!", "success");
    } catch (err: any) {
      console.warn("WhatsApp share flow issue:", err);
      showToast("Could not launch WhatsApp sharing.", "error");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    showToast("Invoice description copied!", "success");
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    showToast("Application link copied!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInvoicePages = () => {
    const items = bill.products;
    const totalItems = items.length;

    // 1. Single-page layout (safe limit for A4 with details)
    if (totalItems <= 7) {
      return [{
        pageNumber: 1,
        items,
        isFirstPage: true,
        isLastPage: true,
        emptyRows: 0
      }];
    }

    // 2. Multi-page layout partitioning
    const pages = [];
    let remaining = [...items];
    let pageNum = 1;

    // Page 1 capacity is 7 items to leave room for shop branding and customer records
    const page1Count = Math.min(remaining.length, 7);
    const page1Items = remaining.splice(0, page1Count);
    pages.push({
      pageNumber: pageNum,
      items: page1Items,
      isFirstPage: true,
      isLastPage: false,
      emptyRows: 0
    });

    // Subsequent pages
    while (remaining.length > 0) {
      pageNum++;

      if (remaining.length <= 12) {
        // Last page: capacity is 12 items
        const count = remaining.length;
        pages.push({
          pageNumber: pageNum,
          items: remaining.splice(0, count),
          isFirstPage: false,
          isLastPage: true,
          emptyRows: 0
        });
      } else {
        // Intermediate page: capacity is 12 items
        const intermediateItems = remaining.splice(0, 12);
        pages.push({
          pageNumber: pageNum,
          items: intermediateItems,
          isFirstPage: false,
          isLastPage: false,
          emptyRows: 0
        });
      }
    }

    return pages;
  };

  const pages = getInvoicePages();
  const totalPages = pages.length;

  const hasHsn = bill.products.some((p) => p.hsn);

  const hasOtherDetails =
    bill.otherDetails &&
    (bill.otherDetails.deliveryDetails ||
      bill.otherDetails.gstin ||
      bill.otherDetails.placeOfSupply ||
      bill.otherDetails.transport ||
      bill.otherDetails.vehicleNumber);

  const renderThermalInvoice = (isExportingMode: boolean, width: number) => {
    const subtotal = bill.subTotal || bill.products.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const is80mm = billFormat === '80mm';

    const cgst = bill.cgstAmount || (bill.gstAmount || 0) / 2;
    const sgst = bill.sgstAmount || (bill.gstAmount || 0) / 2;
    
    // Rounded Off calculation matches the target
    const roundedValue = Math.round(bill.totalAmount) - bill.totalAmount;
    const roundedValueStr = roundedValue !== 0 ? (roundedValue > 0 ? "+" : "") + roundedValue.toFixed(2) : "0.00";

    return (
      <div
        className={`print-page-ct bg-white text-black p-4 font-sans text-[11px] leading-relaxed mx-auto text-left relative ${isBW ? "grayscale" : ""}`}
        style={{
          width: `${width}px`,
          boxShadow: isExportingMode ? "none" : "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)",
          border: isExportingMode ? "none" : "1px solid #cbd5e1",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        }}
      >
        {/* Jagged top border look in non-export preview mode */}
        {!isExportingMode && (
          <div className="absolute top-0 inset-x-0 h-1.5 overflow-hidden select-none opacity-80 pointer-events-none" style={{ transform: 'rotate(180deg)' }}>
            <svg className="w-full h-full text-slate-100 fill-slate-100" viewBox="0 0 100 10" preserveAspectRatio="none">
              <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0 100,10 0,10" />
            </svg>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mt-2 mb-3">
          {/* Custom Representative Logo */}
          <img src={appLogo} alt="Smart Vyapar Logo" className="w-12 h-12 object-contain rounded-lg mb-2 grayscale" />
          <div className="text-center font-black tracking-tight text-[18px] uppercase leading-none text-black">
            SMART VYAPAR
          </div>
          <div className="text-center text-[8.5px] font-black uppercase text-slate-500 tracking-widest mt-1">
            Manage. Grow. Succeed.
          </div>
        </div>

        {/* Dash separator */}
        <div className="border-b border-dashed border-black/40 my-2.5"></div>

        {/* Business details */}
        <div className="text-center mb-2">
          <div className="font-extrabold text-[12px] text-black uppercase leading-tight font-sans">
            {profile?.shopName || "SHREE BALAJI GENERAL STORE"}
          </div>
          {profile?.address && (
            <div className="text-[9px] font-bold text-slate-800 whitespace-pre-line leading-relaxed max-w-[90%] mx-auto mt-0.5 font-sans">
              {profile.address}
            </div>
          )}
          {profile?.phone && (
            <div className="text-[9.5px] font-extrabold text-black mt-0.5 font-sans">
              Phone: +91 {profile.phone}
            </div>
          )}
          {profile?.gstNumber && (
            <div className="text-[9px] font-extrabold text-slate-700 font-mono mt-0.5">
              GSTIN: {profile.gstNumber}
            </div>
          )}
        </div>

        {/* Dash separator */}
        <div className="border-b border-dashed border-black/40 my-2.5"></div>

        {/* Customer & Invoice Meta Details Grid */}
        {is80mm ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[9.5px] text-black font-sans my-1.5">
            <div className="flex col-span-2">
              <span className="w-16 shrink-0 text-slate-500 font-bold">Invoice No</span>
              <span className="mr-1.5 text-slate-400 shrink-0">:</span>
              <span className="font-black flex-1 break-all">{bill.invoiceNumber}</span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 text-slate-500 font-bold">Date</span>
              <span className="mr-1.5 text-slate-400 shrink-0">:</span>
              <span className="font-bold flex-1">
                {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString("en-IN") : new Date(bill.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="flex justify-end text-right">
              <span className="text-slate-500 font-bold shrink-0">Time :</span>
              <span className="font-bold shrink-0 ml-1.5">
                {new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            </div>
            <div className="flex">
              <span className="w-16 shrink-0 text-slate-500 font-bold">Pay Mode</span>
              <span className="mr-1.5 text-slate-400 shrink-0">:</span>
              <span className="font-black text-slate-900 flex-1 uppercase">{bill.paymentMode || "Cash"}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-[9px] text-black font-sans my-1.5 leading-snug">
            <div className="flex justify-between gap-1">
              <span className="text-slate-500 font-bold shrink-0">Invoice No:</span>
              <span className="font-black text-right break-all">{bill.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Date:</span>
              <span className="font-bold">
                {bill.invoiceDate ? new Date(bill.invoiceDate).toLocaleDateString("en-IN") : new Date(bill.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Time:</span>
              <span className="font-bold">
                {new Date(bill.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Pay Mode:</span>
              <span className="font-black uppercase">{bill.paymentMode || "Cash"}</span>
            </div>
          </div>
        )}

        {/* Customer section */}
        {bill.customerDetails.name && 
         bill.customerDetails.name.trim() !== "Walk-in Customer" && 
         bill.customerDetails.name.trim() !== "Cash" && 
         bill.customerDetails.name.trim() !== "Cash / Walk-in" && 
         bill.customerDetails.name.trim() !== "" && (
          <div className="border-t border-b border-dotted border-black/40 py-1.5 my-1.5 text-[9.5px] leading-relaxed">
            <div className="font-bold text-slate-550 uppercase text-[8px] tracking-wider mb-0.5">Billed To:</div>
            <div className="font-bold text-black text-[10.5px]">Name: {bill.customerDetails.name}</div>
            {bill.customerDetails.phone && <div>Phone: <span className="font-semibold">+91 {bill.customerDetails.phone}</span></div>}
            {bill.customerDetails.address && <div className="text-slate-600 break-words min-w-0">Address: {bill.customerDetails.address}</div>}
          </div>
        )}

        {/* Double dashed line */}
        <div className="border-b-2 border-dashed border-black/40 mb-2"></div>

        {/* ITEMS SECTION */}
        {is80mm ? (
          <>
            {/* 80mm Custom high-visibility solid black table header */}
            <div className="bg-black text-white px-2 py-1 font-bold text-[9px] flex justify-between rounded-xs font-sans tracking-wide uppercase">
              <span className="w-[10%] text-left">S.No</span>
              <span className="w-[45%] text-left break-words min-w-0">Item Name</span>
              <span className="w-[10%] text-center">Qty</span>
              <span className="w-[15%] text-right">Rate</span>
              <span className="w-[20%] text-right">Amount</span>
            </div>
            <div className="space-y-1.5 my-2">
              {bill.products.map((p, index) => (
                <div key={index} className="flex justify-between items-center text-[10px] text-black font-sans leading-tight border-b border-dotted border-slate-200 pb-1.5">
                  <span className="w-[10%] text-left text-slate-500 font-bold">{index + 1}</span>
                  <span className="w-[45%] text-left font-extrabold text-slate-800 break-words min-w-0 pr-1">
                    {p.name} {p.hsn ? `(${p.hsn})` : ''}
                  </span>
                  <span className="w-[10%] text-center font-bold">{p.quantity}</span>
                  <span className="w-[15%] text-right font-medium">{(p.price || 0).toFixed(2)}</span>
                  <span className="w-[20%] text-right font-black">{(p.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 58mm Multi-row responsive format to avoid clipping */}
            <div className="bg-black text-white px-1.5 py-0.5 font-bold text-[8.5px] flex justify-between rounded-xs font-sans tracking-tight uppercase">
              <span className="w-[60%] text-left">Item Name</span>
              <span className="w-[15%] text-center">Qty</span>
              <span className="w-[25%] text-right">Amount</span>
            </div>
            <div className="space-y-2.5 my-2">
              {bill.products.map((p, index) => (
                <div key={index} className="flex flex-col text-[10px] text-black font-sans leading-tight border-b border-dotted border-slate-200 pb-1.5">
                  <div className="flex justify-between font-extrabold text-slate-800">
                    <span className="break-words min-w-0 pr-1 flex-1">{index + 1}. {p.name}</span>
                    <span className="w-8 text-center shrink-0 font-bold">{p.quantity}</span>
                    <span className="w-16 text-right shrink-0 font-black">{(p.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-[8.5px] text-slate-400 pl-3.5 font-medium mt-0.5">
                    ₹{(p.price || 0).toFixed(2)} × {p.quantity} {p.hsn ? `| HSN: ${p.hsn}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Dash separator */}
        <div className="border-b border-dashed border-black/40 my-2"></div>

        {/* Calculations Block */}
        <div className="space-y-1.5 text-[10px] font-sans text-slate-800">
          <div className="flex justify-between">
            <span className="font-bold text-slate-500">Sub Total</span>
            <span className="font-bold">₹{subtotal.toFixed(2)}</span>
          </div>

          {bill.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="font-bold text-orange-600">Discount ({bill.discountPercent || 0}%)</span>
              <span className="font-extrabold text-orange-600">-₹{bill.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {bill.otherDetails?.transportCost && bill.otherDetails.transportCost > 0 ? (
            <div className="flex justify-between">
              <span className="font-bold text-slate-500">Transport Cost</span>
              <span className="font-bold">₹{bill.otherDetails.transportCost.toFixed(2)}</span>
            </div>
          ) : null}

          {bill.gstPercent && bill.gstPercent > 0 ? (
            <>
              <div className="flex justify-between">
                <span>CGST ({(bill.gstPercent / 2)}%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({(bill.gstPercent / 2)}%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
            </>
          ) : null}
          
          {roundedValue !== 0 && (
            <div className="flex justify-between text-slate-500 font-semibold text-[9.5px]">
              <span>Rounded Off</span>
              <span>₹{roundedValueStr}</span>
            </div>
          )}
        </div>

        {/* Grand Total high visual impact dashed box block */}
        <div className="border-t border-b border-dashed border-black/70 py-1.5 px-0.5 flex justify-between font-black text-[13px] my-2 font-sans text-black">
          <span className="uppercase tracking-wider">Grand Total</span>
          <span>₹{bill.totalAmount.toFixed(2)}</span>
        </div>

        {/* Amount Payable High Visibility Solid Black Banner */}
        <div className="bg-black text-white px-2.5 py-1.5 font-extrabold text-[12.5px] flex justify-between rounded-sm font-sans tracking-wide uppercase my-2.5">
          <span>Amount Payable</span>
          <span>₹{Math.round(bill.totalAmount).toFixed(2)}</span>
        </div>

        {/* Amount in words */}
        <div className="text-left text-[9.5px] text-black font-sans my-2.5 leading-snug">
          <span className="font-black uppercase tracking-wider text-[8px] text-slate-550 block mb-0.5">Amount In Words:</span>
          <span className="italic font-bold text-slate-900 leading-normal">{numberToWords(Math.round(bill.totalAmount))}</span>
        </div>

        {/* Dash separator */}
        <div className="border-b border-dashed border-black/40 my-3"></div>

        {/* Footer info & QR Code */}
        <div className="flex flex-col items-center justify-center text-center mt-3 mb-2 font-sans text-black">
          <div className="font-extrabold text-[11px] uppercase tracking-wide">
            ★ THANK YOU! VISIT AGAIN! ★
          </div>
          <div className="text-[8.5px] text-slate-600 font-semibold mt-1">
            All items are inclusive of GST
          </div>
          <div className="text-[8px] text-slate-500 italic">E.&O.E</div>

          {/* CRITICAL UPI & QR CODE INTERACTION */}
          {(profile?.qrCode || profile?.upiId) && (
            <div className="flex flex-col items-center justify-center mt-3 p-2 bg-slate-50 border border-slate-300 border-dashed rounded-xl max-w-[140px] mx-auto select-none relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-800"></div>
              <div className="text-[8.5px] font-black uppercase text-slate-600 tracking-widest mt-1 mb-0.5">Scan to Pay</div>
              <div className="text-[13px] font-black tracking-tight text-slate-900 mb-1.5">₹{Math.round(bill.totalAmount).toFixed(2)}</div>
              
              <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex justify-center items-center">
                {(() => {
                  const qr = getInvoiceQRData();
                  if (qr.type === 'upi') {
                    return (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr.data)}`}
                        alt="UPI QR Code"
                        className="w-[64px] h-[64px] object-contain"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        style={{ imageRendering: '-webkit-optimize-contrast' }}
                      />
                    );
                  } else if (qr.type === 'image') {
                    return (
                      <img
                        src={qr.data}
                        alt="QR Code"
                        className="w-[64px] h-[64px] object-contain"
                        referrerPolicy="no-referrer"
                        style={{ imageRendering: '-webkit-optimize-contrast' }}
                      />
                    );
                  } else {
                    return (
                      <div className="w-[64px] h-[64px] border border-dashed border-gray-400 rounded flex items-center justify-center text-[7px] text-gray-500 text-center bg-slate-100">
                        No QR
                      </div>
                    );
                  }
                })()}
              </div>

              {profile?.upiId && profile?.showUpiIdOnBill && (
                <div className="text-[7.5px] mt-1.5 font-bold break-all text-center text-slate-500 tracking-tight leading-tight px-1 font-mono">
                  UPI: {profile.upiId}
                </div>
              )}
            </div>
          )}

          <div className="text-[8.5px] text-slate-500 font-bold mt-3 leading-normal">
            <div>Invoice No: {bill.invoiceNumber}</div>
            <div className="text-[8px] font-medium tracking-tight mt-0.5">Software Powered by Smart Vyapar</div>
          </div>
        </div>

        {/* Jagged bottom border look in non-export preview mode */}
        {!isExportingMode && (
          <div className="absolute -bottom-1.5 inset-x-0 h-1.5 overflow-hidden select-none opacity-80 pointer-events-none">
            <svg className="w-full h-full text-slate-100 fill-slate-100" viewBox="0 0 100 10" preserveAspectRatio="none">
              <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0 100,10 0,10" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderInvoicePage = (page: any, pIdx: number, isExportingMode: boolean) => {
    const startIdx = pages.slice(0, pIdx).reduce((acc, curr) => acc + curr.items.length, 0);
    const itemsUpToThisPage = pages.slice(0, pIdx + 1).reduce((acc, curr) => acc.concat(curr.items), [] as typeof bill.products);
    const runningSubtotal = itemsUpToThisPage.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const emptyRowsCount = page.emptyRows || 0;

    const renderBrandLogo = () => {
      if (profile?.logo) {
        return (
          <img
            src={profile.logo}
            alt="Logo"
            className="max-h-full max-w-full object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        );
      }
      return (
        <img
          src={appLogo}
          alt="Smart Vyapar Logo"
          className="max-h-full max-w-full object-contain"
        />
      );
    };

    const renderShopNameAndSub = () => {
      const rawName = profile?.shopName || "YOUR BUSINESS";
      const words = rawName.trim().split(" ");
      
      let part1 = "YOUR";
      let part2 = "BUSINESS";
      
      if (words.length > 1) {
        part1 = words.slice(0, words.length - 1).join(" ");
        part2 = words[words.length - 1];
      } else if (words.length === 1) {
        part1 = words[0];
        part2 = "";
      }

      return (
        <div className="text-left flex flex-col justify-center min-w-0 pl-1">
          <h1 className={`${billFormat === 'A5' ? 'text-sm' : 'text-3xl'} font-black uppercase tracking-tight leading-none font-sans mt-1 ${isBW ? 'text-black' : 'text-[#0B2C56]'}`}>
            {part1}
          </h1>
          {part2 && (
            <h1 className={`${billFormat === 'A5' ? 'text-lg' : 'text-4xl'} font-black uppercase tracking-wider leading-tight font-sans mt-0.5 ${isBW ? 'text-black' : 'text-[#F17E13]'}`}>
              {part2}
            </h1>
          )}
          
          <div className="flex items-center gap-1.5 mt-2 w-full">
            {!isBW && <div className="h-[2px] bg-[#F17E13] w-4 shrink-0 rounded"></div>}
            <span className={`font-black uppercase tracking-widest whitespace-nowrap ${billFormat === 'A5' ? 'text-[7px]' : 'text-[9px]'} ${isBW ? 'text-black' : 'text-[#0B2C56]'}`}>
              {profile?.category ? profile.category.replace(/_/g, " ") : "BUILDING MATERIAL SUPPLIER"}
            </span>
            {!isBW && <div className="h-[2px] bg-[#F17E13] w-4 shrink-0 rounded"></div>}
          </div>
        </div>
      );
    };

    return (
      <div
        key={page.pageNumber}
        className={`bg-white text-black p-6 font-sans flex flex-col justify-between print-page-ct relative ${isBW ? "grayscale" : ""}`}
        style={{
          width: billFormat === 'A5' ? "561px" : "794px",
          height: billFormat === 'A5' ? "794px" : "1123px",
          boxShadow: isExportingMode ? "none" : "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)",
          border: isExportingMode ? "none" : "1px solid #e2e8f0",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        }}
      >
        {/* Modern decorative corner ribbon in top-left */}
        {!isBW && page.isFirstPage && (
          <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none rounded-tl-2xl z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="0,0 60,0 0,60" fill="#F17E13" />
              <polygon points="0,0 42,0 0,42" fill="#0B2C56" />
            </svg>
          </div>
        )}

        {/* TOP CONTAINER (Everything excluding footer) */}
        <div className="flex flex-col flex-1 z-10 relative">
          {/* PAGE 1 CONTENT */}
          {page.isFirstPage ? (
            <>
              {/* HEADER */}
              <div className="flex justify-between items-start mb-3 text-left w-full min-w-0">
                <div className="flex gap-3 sm:gap-5 items-center min-w-0 flex-1 mr-3 pl-2">
                  <div className={`${billFormat === 'A5' ? 'w-14 h-18' : 'w-20 h-24'} flex items-center justify-center shrink-0`}>
                    {renderBrandLogo()}
                  </div>
                  {renderShopNameAndSub()}
                </div>
 
                <div className={`${billFormat === 'A5' ? 'w-48' : 'w-64'} border rounded-2xl overflow-hidden flex flex-col shrink-0 bg-[#F4F6F9] shadow-xs ${isBW ? 'border-black' : 'border-[#0B2C56]'}`}>
                  <div className={`text-white ${billFormat === 'A5' ? 'py-0.5 text-[9px]' : 'py-1 text-[11px]'} text-center font-black tracking-widest uppercase ${isBW ? 'bg-black' : 'bg-[#0B2C56]'}`}>
                    TAX INVOICE
                  </div>
                  <div className={`${billFormat === 'A5' ? 'p-2 text-[9px] space-y-1' : 'p-3 text-[10px] space-y-1.5'} bg-[#F4F6F9] flex-1 text-[#0B2C56] font-bold`}>
                    <div className="flex justify-between bg-[#F4F6F9] items-start">
                      <span className={`${billFormat === 'A5' ? 'w-16' : 'w-20'} shrink-0 text-slate-500`}>Invoice No.</span>
                      <span className="shrink-0 mr-1">:</span>
                      <span className="break-all flex-1 text-right text-[#0B2C56] font-black">{bill.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between bg-[#F4F6F9]">
                      <span className={`${billFormat === 'A5' ? 'w-16' : 'w-20'} shrink-0 text-slate-500`}>Date</span>
                      <span className="shrink-0 mr-1">:</span>
                      <span className="flex-1 text-right text-[#0B2C56]">{formatDate(bill.createdAt)}</span>
                    </div>
                    <div className="flex justify-between bg-[#F4F6F9]">
                      <span className={`${billFormat === 'A5' ? 'w-16' : 'w-20'} shrink-0 text-slate-500`}>Time</span>
                      <span className="shrink-0 mr-1">:</span>
                      <span className="flex-1 text-right text-[#0B2C56]">{formatTime(bill.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Address and Phone strip resembling high-fidelity layout */}
              {(profile?.address || profile?.phone) && (
                <div className={`flex flex-wrap sm:flex-nowrap gap-4 justify-between mt-1 pb-3 pt-3 border-t border-b ${isBW ? 'border-black' : 'border-slate-300'} w-full text-black items-center leading-normal ${billFormat === 'A5' ? 'mb-2' : 'mb-3'}`}>
                  {profile?.address && (
                    <div className="flex items-start gap-1.5 text-left flex-1 min-w-0">
                      <MapPin size={billFormat === 'A5' ? 9 : 12} className={`mt-0.5 shrink-0 ${isBW ? 'text-black' : 'text-[#0B2C56]'}`} />
                      <span className={`${billFormat === 'A5' ? 'text-[7.5px]' : 'text-[9.5px]'} font-semibold text-slate-800 whitespace-pre-line leading-normal`}>
                        {profile.address}
                      </span>
                    </div>
                  )}
                  {profile?.address && profile?.phone && (
                    <div className={`hidden sm:block h-5 w-px ${isBW ? 'bg-black' : 'bg-slate-300'} shrink-0`}></div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-1.5 justify-start shrink-0">
                      <Phone size={billFormat === 'A5' ? 9 : 12} className={`shrink-0 ${isBW ? 'text-black' : 'text-[#0B2C56]'}`} />
                      <span className={`${billFormat === 'A5' ? 'text-[8px]' : 'text-[10px]'} font-bold text-slate-900 font-sans`}>
                        +91 {profile.phone}
                      </span>
                    </div>
                  )}
                </div>
              )}
 
              {/* MIDDLE DETAILS */}
              <div className={`flex ${billFormat === 'A5' ? 'gap-1.5 mb-2.5' : 'gap-2 mb-3'} items-stretch`}>
                {/* CUSTOMER DETAILS Box */}
                <div 
                  className={`flex-1 ${billFormat === 'A5' ? 'min-w-[130px]' : 'min-w-[200px]'} border-[1.5px] rounded-2xl overflow-hidden flex flex-col bg-white shadow-xs ${isBW ? 'border-black' : 'border-slate-300'}`}
                  style={{ height: billFormat === 'A5' ? '108px' : '132px' }}
                >
                  <div className={`font-black py-1 px-2.5 uppercase text-left flex items-center gap-1.5 border-b ${isBW ? 'bg-slate-100 text-black border-black text-[10px]' : 'bg-[#FFFAF3] text-[#F17E13] border-orange-100 text-[10.5px]'}`}>
                    <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#F17E13]" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                    <span>CUSTOMER DETAILS</span>
                  </div>
                  <div className={`${billFormat === 'A5' ? 'p-1.5 text-[8.5px] space-y-1' : 'p-2.5 text-[10px] space-y-1.5'} flex flex-col flex-1 text-left bg-white text-slate-700`}>
                    <div className="flex bg-white">
                      <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>
                        Customer Name
                      </span>
                      <span className="shrink-0 mr-1">:</span>
                      <span 
                        className={`font-black break-words min-w-0 flex-1 font-sans ${isBW ? 'text-black' : 'text-[#0B2C56]'}`}
                        style={{ fontSize: getDynamicFontSize(bill.customerDetails.name || "", billFormat === 'A5' ? 9.5 : 12, 18, 7.5) }}
                      >
                        {bill.customerDetails.name || "-"}
                      </span>
                    </div>
                    <div className="flex bg-white">
                      <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>
                        Mobile Number
                      </span>
                      <span className="shrink-0 mr-1">:</span>
                      <span className="break-words min-w-0 flex-1 font-bold">{bill.customerDetails.phone || "-"}</span>
                    </div>
                    <div className="flex bg-white flex-1 leading-tight">
                      <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>Address</span>
                      <span className="shrink-0 mr-1">:</span>
                      <span className="whitespace-pre-line break-words min-w-0 leading-tight flex-1 font-semibold text-slate-600">
                        {bill.customerDetails.address || "-"}
                      </span>
                    </div>
                  </div>
                </div>
 
                {/* OTHER DETAILS Box */}
                {hasOtherDetails && (
                  <div 
                    className={`flex-1 ${billFormat === 'A5' ? 'min-w-[130px]' : 'min-w-[200px]'} border-[1.5px] rounded-2xl overflow-hidden flex flex-col bg-white shadow-xs ${isBW ? 'border-black' : 'border-slate-300'}`}
                    style={{ height: billFormat === 'A5' ? '108px' : '132px' }}
                  >
                    <div className={`font-black py-1 px-2.5 uppercase text-left flex items-center gap-1.5 border-b ${isBW ? 'bg-slate-100 text-black border-black text-[10px]' : 'bg-[#F4F9FF] text-[#0A5BC1] border-blue-100 text-[10.5px]'}`}>
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-[#0A5BC1]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      </div>
                      <span>OTHER DETAILS</span>
                    </div>
                    <div className={`${billFormat === 'A5' ? 'p-1.5 text-[8.5px] space-y-1' : 'p-2.5 text-[10px] space-y-1.5'} flex flex-col flex-1 text-left bg-white text-slate-700`}>
                      <div className="flex bg-white">
                        <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>Transport</span>
                        <span className="shrink-0 mr-1">:</span>
                        <span className="break-words min-w-0 flex-1 font-semibold text-slate-600">{bill.otherDetails?.transport || "-"}</span>
                      </div>
                      <div className="flex bg-white">
                        <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>
                          Vehicle No.
                        </span>
                        <span className="shrink-0 mr-1">:</span>
                        <span className={`uppercase break-words min-w-0 flex-1 font-extrabold ${isBW ? 'text-black' : 'text-[#0B2C56]'}`}>
                          {bill.otherDetails?.vehicleNumber || "-"}
                        </span>
                      </div>
                      <div className="flex bg-white">
                        <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>
                          Place of Supply
                        </span>
                        <span className="shrink-0 mr-1">:</span>
                        <span className="break-words min-w-0 flex-1 font-semibold text-slate-600">{bill.otherDetails?.placeOfSupply || "-"}</span>
                      </div>
                      <div className="flex bg-white">
                        <span className={`${billFormat === 'A5' ? 'w-18' : 'w-24'} shrink-0 font-bold text-slate-400`}>
                          GSTIN (Customer)
                        </span>
                        <span className="shrink-0 mr-1">:</span>
                        <span className={`uppercase font-sans font-black break-words min-w-0 flex-1 ${isBW ? 'text-black' : 'text-[#0B2C56]'}`}>
                          {bill.customerDetails.gstNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
 
                {/* SCAN & PAY Box */}
                {(profile?.qrCode || profile?.upiId) && (
                  <div 
                    className={`border-[1.5px] rounded-2xl flex flex-col items-center justify-between p-2 pb-1.5 relative shrink-0 bg-white shadow-xs overflow-hidden ${billFormat === 'A5' ? 'w-28' : 'w-36'} ${isBW ? 'border-black' : 'border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white'}`}
                  >
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${isBW ? 'bg-black' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>
                    
                    <div className="flex flex-col items-center justify-center w-full mt-1.5 mb-1.5">
                       <span className={`font-black uppercase tracking-widest leading-none ${billFormat === 'A5' ? 'text-[7.5px]' : 'text-[9.5px]'} ${isBW ? 'text-black' : 'text-indigo-600'}`}>Scan To Pay</span>
                       <span className={`font-extrabold tracking-tight whitespace-nowrap mt-0.5 ${billFormat === 'A5' ? 'text-[10px]' : 'text-[13px]'} ${isBW ? 'text-black' : 'text-slate-800'}`}>₹{Math.round(bill.totalAmount).toFixed(2)}</span>
                    </div>

                    <div className={`p-1 bg-white rounded-xl shadow-sm border ${isBW ? 'border-black/20' : 'border-indigo-100/60'} mb-1 flex justify-center items-center`}>
                      {(() => {
                        const qr = getInvoiceQRData();
                        if (qr.type === 'upi') {
                          return (
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr.data)}`}
                              alt="UPI QR Code"
                              className={`${billFormat === 'A5' ? 'w-[42px] h-[42px]' : 'w-14 h-14'} object-contain`}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                          );
                        } else if (qr.type === 'image') {
                          return (
                            <img
                              src={qr.data}
                              alt="QR Code"
                              className={`${billFormat === 'A5' ? 'w-[42px] h-[42px]' : 'w-14 h-14'} object-contain`}
                              referrerPolicy="no-referrer"
                              style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                          );
                        } else {
                          return (
                            <div className={`${billFormat === 'A5' ? 'w-[42px] h-[42px]' : 'w-14 h-14'} border border-dashed border-gray-400 rounded-xl flex items-center justify-center text-[8px] text-gray-500 text-center bg-slate-50 mb-1`}>
                              No QR
                            </div>
                          );
                        }
                      })()}
                    </div>
                    {profile?.upiId && profile?.showUpiIdOnBill && (
                      <div className="text-center w-full min-w-0 bg-slate-50 py-0.5 rounded-md px-1 mt-auto">
                        <div className={`${billFormat === 'A5' ? 'text-[6.5px]' : 'text-[8px]'} font-bold break-words min-w-0 max-w-full text-slate-500 font-mono text-center tracking-tighter`}>
                          UPI: {profile.upiId}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* PAGES 2+ HEADER */
            <div className="flex justify-between items-start border-b border-black pb-2 mb-3 text-left">
              <div className="flex gap-2.5 items-center">
                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                  {profile?.logo ? (
                    <img src={profile.logo} alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <img src={appLogo} alt="Smart Vyapar Logo" className="w-10 h-10 object-contain" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-black uppercase text-red-600 tracking-wide leading-none font-sans">
                    {profile?.shopName || "YOUR BUSINESS"}
                  </h1>
                  <p className="text-[8px] font-semibold text-slate-500 mt-1">{profile?.address}</p>
                </div>
              </div>
              
              <div className="text-[10px] font-bold text-right text-black">
                <div className="bg-black text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded mb-1 inline-block">
                  TAX INVOICE CONTINUATION
                </div>
                <div>Invoice No: <span className="font-extrabold">{bill.invoiceNumber}</span></div>
                <div className="text-[9px] font-medium text-slate-600 mt-0.5">Date: {formatDate(bill.createdAt)}</div>
              </div>
            </div>
          )}

          {/* ITEMS TABLE */}
          <div className={`border rounded-2xl overflow-hidden flex flex-col mb-3 shadow-xs ${isBW ? 'border-black' : 'border-[#0B2C56]'}`}>
            <table className="w-full text-xs text-left border-collapse">
              <thead className={`${!isBW ? 'bg-[#0B2C56]' : 'bg-black'} text-white text-[10px] uppercase font-sans`}>
                <tr>
                  <th className={`py-2 px-1.5 text-center ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-650'} w-10 font-black uppercase tracking-wider`}>
                    Sr. No.
                  </th>
                  {bill.otherDetails?.showSKU && (
                    <th className={`py-2 px-1.5 text-center ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-650'} w-20 font-black uppercase tracking-wider`}>
                      SKU
                    </th>
                  )}
                  <th className={`py-2 px-2.5 ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-655'} text-left font-black uppercase tracking-wider`}>
                    Item Name / Description
                  </th>
                  {hasHsn && (
                    <th className={`py-2 px-1.5 text-center ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-655'} w-16 font-black uppercase tracking-wider`}>
                      HSN/SAC
                    </th>
                  )}
                  <th className={`py-2 px-1.5 text-center ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-655'} w-14 font-black uppercase tracking-wider`}>
                    UOM
                  </th>
                  <th className={`py-2 px-1.5 text-center ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-655'} w-14 font-black uppercase tracking-wider`}>
                    Qty
                  </th>
                  <th className={`py-2 px-2 text-right ${!isBW ? 'border-r border-slate-200/20' : 'border-r border-gray-655'} w-20 font-black uppercase tracking-wider`}>
                    Rate (₹)
                  </th>
                  <th className="py-2 px-2.5 text-right font-black uppercase tracking-wider w-26">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-black text-[11px] font-medium font-sans">
                {page.items.map((item: any, localIdx: number) => {
                  const globalIdx = startIdx + localIdx + 1;
                  return (
                    <tr
                      key={localIdx}
                      className={`border-b ${!isBW ? 'border-slate-305 bg-white' : 'border-dotted border-gray-400'} h-8 ${localIdx % 2 === 1 ? 'bg-slate-50/20' : ''}`}
                    >
                      <td className="py-1 px-1.5 text-center border-r border-slate-300 font-extrabold text-[#0B2C56] font-sans">
                        {globalIdx}
                      </td>
                      {bill.otherDetails?.showSKU && (
                        <td className="py-1 px-1.5 text-center font-sans font-medium border-r border-slate-300">
                          {item.sku || "-"}
                        </td>
                      )}
                      <td className="py-1 px-2.5 border-r border-slate-300 text-left">
                        <div 
                          className="font-extrabold text-slate-800 break-words whitespace-normal leading-tight font-sans" 
                          title={item.name}
                          style={{ fontSize: getDynamicFontSize(item.name || "", 11, 28, 8.5) }}
                        >
                          {item.name}
                        </div>
                      </td>
                      {hasHsn && (
                        <td className="py-1 px-1.5 text-center border-r border-slate-300 font-mono text-[9px] font-bold text-slate-500">
                          {item.hsn || "-"}
                        </td>
                      )}
                      <td className="py-1 px-1.5 text-center border-r border-slate-300 font-extrabold text-slate-500">
                        {item.unit}
                      </td>
                      <td className="py-1 px-1.5 text-center border-r border-slate-300 font-extrabold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="py-1 px-2 text-right border-r border-slate-300 font-sans font-bold text-slate-700">
                        {(item.price || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-1 px-2.5 text-right font-black font-sans text-slate-900">
                        {(item.total || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  );
                })}

                {/* High-fidelity uniform Empty filler cells with precise vertical division lines as requested */}
                {Array.from({ length: emptyRowsCount }).map((_, i) => (
                  <tr
                    key={`empty-${i}`}
                    className={`border-b ${!isBW ? 'border-slate-300' : 'border-dotted border-gray-400'} h-8 ${i % 2 === 1 ? 'bg-slate-55/10' : ''}`}
                  >
                    <td className="border-r border-slate-300"></td>
                    {bill.otherDetails?.showSKU && (
                      <td className="border-r border-slate-300"></td>
                    )}
                    <td className="border-r border-slate-300"></td>
                    {hasHsn && (
                      <td className="border-r border-slate-300"></td>
                    )}
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    <td className="border-r border-slate-300"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Display subtotal of the current page with premium styling details */}
            {!page.isLastPage ? (
              <div className={`border-t ${!isBW ? 'border-[#0B2C56]' : 'border-black'} flex justify-end text-[10px] font-bold font-sans h-9 items-stretch`}>
                <div className={`py-2 px-4 text-right flex items-center justify-end flex-1 uppercase tracking-wider text-slate-500 font-extrabold ${!isBW ? 'bg-[#F4F6F9]' : ''}`}>
                  RUNNING SUBTOTAL
                </div>
                <div className={`w-28 py-2 px-3 text-right border-l ${!isBW ? 'border-[#0B2C56] bg-slate-50 text-slate-800' : 'border-black bg-slate-50'} font-sans font-extrabold flex items-center justify-end`}>
                  ₹
                  {runningSubtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            ) : (
              <div className={`border-t ${!isBW ? 'border-[#0B2C56]' : 'border-black'} flex justify-end text-[11px] font-bold font-sans h-9 items-stretch`}>
                <div className={`py-2 px-4 text-right flex items-center justify-end flex-1 uppercase tracking-wider text-[#0B2C56] font-extrabold ${!isBW ? 'bg-slate-50' : ''}`}>
                  SUB TOTAL
                </div>
                <div className={`w-28 py-2 px-3 text-right border-l ${!isBW ? 'border-[#0B2C56] bg-[#F4F9FF] text-[#0B2C56]' : 'border-black bg-slate-50'} font-sans font-black flex items-center justify-end`}>
                  ₹
                  {(bill.subTotal || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM SUMMARY BLOCKS (Only rendered on the last page) */}
          {page.isLastPage && (
            <div className="grid grid-cols-3 gap-3 mt-1 items-stretch">
              {/* AMOUNT SUMMARY CARD (ORANGE THEME) */}
              <div className={`border-[1.5px] ${!isBW ? 'border-slate-300 shadow-sm' : 'border-slate-400'} rounded-2xl overflow-hidden flex flex-col text-[10.5px] text-left bg-white`}>
                <div className={`font-black py-1.5 px-3 uppercase text-left flex items-center gap-1.5 ${!isBW ? 'bg-[#FFFAF3] text-[#F17E13] border-b border-orange-100' : 'bg-slate-100 text-[#000] border-b border-slate-350'}`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm0-4H7v-2h5v2zm0-4H7V7h5v2zm5 8h-3v-2h3v2zm0-4h-3v-2h3v2zm0-4h-3V7h3v2z"/></svg>
                  <span>AMOUNT SUMMARY</span>
                </div>
                <div className="p-3 space-y-1.5 flex-1 font-bold text-slate-500 leading-snug font-sans bg-white">
                  <div className="flex justify-between items-center bg-white">
                    <span>Sub Total</span>
                    <span className="font-extrabold text-[#0B2C56] font-sans">
                      ₹
                      {(bill.subTotal || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white">
                    <span>Discount ({bill.discountPercent || 0}%)</span>
                    <span className="font-bold text-[#F17E13] font-sans">
                      - ₹
                      {(bill.discountAmount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {bill.otherDetails?.transportCost && bill.otherDetails.transportCost > 0 ? (
                    <div className="flex justify-between items-center bg-white">
                      <span>Transport Cost</span>
                      <span className="font-semibold text-slate-700 font-sans">
                        ₹
                        {bill.otherDetails.transportCost.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ) : null}

                  {bill.gstPercent && bill.gstPercent > 0 ? (
                    <>
                      <div className="flex justify-between items-center bg-white">
                        <span>CGST ({(bill.gstPercent / 2)}%)</span>
                        <span className="font-semibold text-slate-700 font-sans">
                          ₹
                          {(bill.cgstAmount || (bill.gstAmount || 0) / 2).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white">
                        <span>SGST ({(bill.gstPercent / 2)}%)</span>
                        <span className="font-semibold text-slate-700 font-sans">
                          ₹
                          {(bill.sgstAmount || (bill.gstAmount || 0) / 2).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
                
                {/* GRAND TOTAL HIGH VISIBILITY ROW */}
                <div className={`font-black px-3.5 py-2 flex justify-between text-xs rounded-xl mx-2 mb-2 shadow-sm uppercase tracking-wider ${!isBW ? 'bg-[#F17E13] text-white' : 'bg-black text-white'}`}>
                  <span>GRAND TOTAL</span>
                  <span className="font-black text-sm">
                    ₹
                    {(bill.totalAmount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                
                {/* AMOUNT IN WORDS SECTION */}
                <div className={`p-2.5 border-t ${!isBW ? 'border-orange-100 bg-[#FFFDFB]' : 'border-slate-350'} leading-tight`}>
                  <div className="font-bold text-[8.5px] uppercase tracking-wider text-slate-400">Amount in Words:</div>
                  <div 
                    className="italic font-bold text-slate-850 break-words mt-0.5"
                    style={{ fontSize: getDynamicFontSize(numberToWords(bill.totalAmount) || "", 9.5, 30, 7.5) }}
                  >
                    {numberToWords(bill.totalAmount)}
                  </div>
                </div>
              </div>

              {/* PAYMENT SUMMARY CARD (BLUE THEME) */}
              <div className={`border-[1.5px] ${!isBW ? 'border-slate-300 shadow-sm' : 'border-slate-400'} rounded-2xl overflow-hidden flex flex-col text-[10.5px] text-left bg-white`}>
                <div className={`font-black py-1.5 px-3 uppercase text-left flex items-center gap-1.5 ${!isBW ? 'bg-[#F4F9FF] text-[#0A5BC1] border-b border-blue-100' : 'bg-slate-100 text-[#000] border-b border-dashed border-slate-350'}`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <span>PAYMENT SUMMARY</span>
                </div>
                <div className="p-3.5 space-y-3.5 flex-1 flex flex-col justify-between font-bold text-slate-500 font-sans">
                  {/* Amount Paid Row */}
                  <div className="flex justify-between items-center bg-white">
                    <span>Amount Paid</span>
                    <div className="flex items-center gap-1.5 mr-1">
                      <span className="font-extrabold text-[#0B2C56] text-[12px] font-sans">
                        ₹
                        {(bill.paidAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Balance Due Row */}
                  <div className="flex justify-between items-center bg-white">
                    <span>Balance Due</span>
                    <div className="flex items-center gap-1.5 font-sans mr-1">
                      <span className={`font-black text-xs ${bill.balanceAmount > 0 ? 'text-red-599' : 'text-emerald-700'}`}>
                        ₹
                        {(bill.balanceAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {!isBW && bill.balanceAmount === 0 ? (
                        <span className="text-[7.5px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded font-black uppercase tracking-wider border border-emerald-100">Settled</span>
                      ) : !isBW && bill.balanceAmount > 0 ? (
                        <span className="text-[7.5px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-black uppercase tracking-wider border border-rose-100">Pending</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`border-t ${!isBW ? 'border-slate-200' : 'border-dashed border-slate-350'} my-1`}></div>

                  {/* Payment Mode Row */}
                  <div className="flex justify-between items-center bg-white">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Payment Mode</span>
                    <span className={`text-[9px] uppercase font-black ${!isBW ? 'text-indigo-700 bg-indigo-50 border border-indigo-100' : 'text-slate-900 bg-slate-50 border border-slate-300'} px-2 py-0.5 rounded-lg`}>
                      {bill.paymentMode || "UPI"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AUTHORIZED SIGNED CARD (PURPLE/STAMP DESIGN) */}
              <div className={`border-[1.5px] ${!isBW ? 'border-slate-300 shadow-sm' : 'border-slate-400'} rounded-2xl overflow-hidden flex flex-col text-[10.5px] text-center bg-white relative`}>
                <div className={`font-black py-1.5 px-3 uppercase text-center flex items-center justify-center gap-1.5 ${!isBW ? 'bg-[#FCF5FC] text-[#742A92] border-b border-purple-100 font-bold' : 'bg-slate-100 text-[#000] border-b border-slate-350'}`}>
                  <span>For {profile?.shopName || "YOUR BUSINESS"}</span>
                </div>
                
                {/* Center watermark logo inside stamp container */}
                <div className="absolute inset-x-0 bottom-6 top-8 flex items-center justify-center opacity-[0.06] pointer-events-none">
                  {renderBrandLogo()}
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-end pb-4 font-sans relative z-10 p-3">
                  <div className="w-36 border-t border-slate-300 mb-1 opacity-70"></div>
                  <div className="font-extrabold text-black uppercase tracking-wider text-[8px]">Authorized Signature</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTES & Signature Panel resembling high-fidelity bottom bar */}
        <div className={`mt-2 p-3 border rounded-2xl flex flex-col gap-3 font-sans relative z-10 ${!isBW ? 'bg-[#FCFBF7] border-orange-100/50' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex justify-between items-start gap-4">
            {/* NOTES and message */}
            <div className="flex items-start gap-2 text-left text-[10px] flex-1">
              <div className="w-4 h-4 bg-[#742A92] text-white rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-black uppercase tracking-wider text-[8px] text-[#742A92]">NOTES</span>
                <span className="text-slate-600 font-bold mt-0.5 leading-relaxed">
                  {bill.notes || profile?.terms || "Thank you for your business."}
                </span>
              </div>
            </div>

            {/* Date Blank Row */}
            <div className="flex items-center gap-1.5 shrink-0 text-[#0B2C56] font-bold text-[10.5px] self-center">
              <span>Date:</span>
              <span className="tracking-widest text-slate-400">______/______/____________</span>
            </div>
          </div>

          <div className="flex justify-between items-end pt-2">
            {/* Customer Signature Block */}
            <div className="flex flex-col items-center">
              <div className="w-40 border-t border-slate-400 mb-1 opacity-80"></div>
              <span className="font-sans font-black text-slate-800 uppercase tracking-widest text-[8px]">Customer Signature</span>
            </div>
          </div>
        </div>

        {/* Decorative Sign-off and Bottom Footer */}
        <div className="flex flex-col mt-2.5 z-10 relative">
          {totalPages > 1 && (
            <div className="flex justify-end text-[9px] font-black tracking-widest text-[#0B2C56] uppercase pr-2 mb-1">
              {page.isLastPage ? `Page ${page.pageNumber} of ${totalPages}` : `Page ${page.pageNumber} of ${totalPages} — Continued...`}
            </div>
          )}

          {/* Elegant Thank You banner */}
          <div className="flex items-center justify-center py-1.5 text-[10px] font-sans font-bold text-slate-800 border-t border-slate-100 mt-1">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-400"></span>
              <span className="font-serif italic font-black text-sm text-[#F17E13]">Thank You!</span>
              <span className="font-extrabold uppercase tracking-widest text-[8px] text-slate-450 mx-1">Visit Again</span>
              <span className="w-1 h-1 rounded-full bg-[#0B2C56]"></span>
            </div>
          </div>

          {/* Brand Footer Strip with clip-path angled orange ribbon decoration */}
          <div className={`rounded-xl overflow-hidden text-white py-2 px-6 flex justify-between items-center text-[9px] font-bold ${!isBW ? 'bg-[#0B2C56]' : 'bg-black'} relative h-7`}>
            {/* Left orange slanted ribbon */}
            {!isBW && (
              <div className="absolute left-0 bottom-0 top-0 w-8 bg-[#F17E13] select-none" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%, 0 100%)' }}></div>
            )}
            
            <div className="flex-1 text-center font-sans">
              <span className="normal-case text-slate-200">Generated by </span>
              <span className="uppercase text-orange-400 tracking-wider font-extrabold">Smart Vyapar</span>
              <span className="text-slate-300 font-extrabold"> | {getAppHostname()}</span>
            </div>

            {/* Right orange slanted ribbon */}
            {!isBW && (
              <div className="absolute right-0 bottom-0 top-0 w-8 bg-[#F17E13] select-none" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
            )}
          </div>

          <div className="bg-slate-50 text-center py-1 border border-slate-200/60 rounded-b-xl mt-1 select-all">
            <a 
              href={getAppUrl()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 font-extrabold hover:underline text-[9px] leading-tight block"
            >
              {getAppUrl()}
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer border border-slate-200 shadow-sm transition active:scale-95"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              Invoice Generated
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">#{bill.invoiceNumber}</p>
          </div>
        </div>

        {/* Dynamic theme preview bar & format switcher */}
        <div className="flex flex-wrap items-center gap-3.5">
          {setBillFormat && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 font-bold text-xs shrink-0 select-none">
              {(['A4', '80mm', '58mm'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    if (fmt === 'A4') {
                       const hasCustomer = bill.customerDetails?.name && bill.customerDetails.name.trim() !== '' && !['Cash', 'Cash / Walk-in'].includes(bill.customerDetails.name);
                       if (!hasCustomer) {
                         showToast("Please fill customer detail to get A4 bill", "warning");
                         return; // Don't allow changing format
                       }
                    }
                    setBillFormat?.(fmt);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    billFormat === fmt 
                      ? "bg-indigo-600 text-white shadow-sm font-extrabold" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Edit Button */}
            {onEdit && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-2.5 bg-amber-500 border border-amber-600 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                >
                  <Edit className="w-4.5 h-4.5" />
                </button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                  Edit Invoice
                </span>
              </div>
            )}

            {/* Colourful and B&W button only for A4 sheet bill */}
            {billFormat === 'A4' && (
              <>
                {/* Colorful Theme Button */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setIsBW(false)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      !isBW 
                        ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Palette className="w-4.5 h-4.5" />
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                    Colorful Theme
                  </span>
                </div>

                {/* B&W Theme Button */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setIsBW(true)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      isBW 
                        ? "bg-slate-950 border-slate-950 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Contrast className="w-4.5 h-4.5" />
                  </button>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                    B&W Mode
                  </span>
                </div>
              </>
            )}

            {/* Print Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrintingPrecompile || isDownloading || isSharing}
                className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 shadow-sm hover:bg-slate-50 transition-all cursor-pointer active:scale-95 flex items-center justify-center disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isPrintingPrecompile ? (
                  <RefreshCw className="w-4.5 h-4.5 text-slate-500 animate-spin" />
                ) : (
                  <Printer className="w-4.5 h-4.5 text-slate-500" />
                )}
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                {isPrintingPrecompile ? "Compiling..." : "Print Invoice"}
              </span>
            </div>

            {/* WhatsApp Share Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleShare}
                disabled={isSharing || isDownloading || isPrintingPrecompile}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
              >
                {isSharing ? (
                  <RefreshCw className="w-4.5 h-4.5 text-white animate-spin" />
                ) : (
                  <svg 
                    className="w-4.5 h-4.5 text-white" 
                    viewBox="0 0 16 16" 
                    fill="currentColor"
                  >
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 8 0a7.854 7.854 0 0 0-7.852 7.854c0 1.515.395 2.99 1.147 4.3l-1.217 4.45 4.545-1.192a7.86 7.86 0 0 0 3.758.958h.001c4.337 0 7.862-3.525 7.862-7.856a7.848 7.848 0 0 0-2.311-5.539zM8 14.394h-.001c-1.312-.001-2.602-.352-3.733-1.018l-.268-.159-2.774.727.741-2.71-.174-.277a6.52 6.52 0 0 1-1.002-3.413c0-3.6 2.932-6.531 6.535-6.531 1.744 0 3.385.68 4.618 1.913a6.516 6.516 0 0 1 1.914 4.62c-.002 3.601-2.935 6.532-6.536 6.532zM11.5 9.4c-.19-.094-1.129-.556-1.304-.619-.175-.064-.303-.095-.43.095-.127.19-.492.619-.603.746-.111.127-.222.143-.413.048-.19-.094-.8-.294-1.524-.94-.564-.503-.944-1.126-1.055-1.317-.111-.19-.012-.293.083-.387.086-.085.19-.222.285-.333.095-.11.127-.186.19-.31.064-.128.032-.24-.015-.334-.048-.095-.43-1.034-.59-1.42-.154-.374-.31-.323-.43-.323h-.368c-.19 0-.498.07-.76.355-.26.285-1 .978-1.001 2.387-.001 1.408 1.026 2.77 1.168 2.96 1.42 1.888 2.5 2.5 3.9 2.5h.1c.1 0 .3-.1.4-.2.1-.1.3-.3.4-.4.1-.1.2-.2.2-.3s.1-.2 0-.3z"/>
                  </svg>
                )}
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                Share on WhatsApp
              </span>
            </div>

            {/* Download PDF Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => handleDownloadPDF(isBW)}
                disabled={isDownloading || isSharing || isPrintingPrecompile}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
              >
               {isDownloading ? (
                  <RefreshCw className="w-4.5 h-4.5 text-white animate-spin" />
                ) : (
                  <Download className="w-4.5 h-4.5 text-white" />
                )}
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                Download PDF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Business & Invoice Info Badge */}
      {billFormat === 'A4' && (
        <div className="bg-slate-50/80 border border-slate-200/60 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm font-semibold max-w-full">
          <div className="flex flex-col gap-1 items-start text-left">
            <span className="text-[10px] text-blue-600 uppercase font-black tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Smart Vyapar Secured Document
            </span>
            <span className="text-slate-800 font-extrabold flex items-center gap-1.5 mt-0.5">
              Verified B2B Billing Export
            </span>
          </div>
          <div className="hidden sm:block h-10 w-px bg-slate-200" />
          <div className="flex flex-col gap-1 items-start sm:items-end text-left sm:text-right font-bold">
            <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Official Invoice Sequence
            </span>
            <span className="text-slate-800 font-extrabold flex items-center gap-1.5">
              Invoice No: <code className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-110 text-xs font-mono font-bold">{bill.invoiceNumber}</code>
            </span>
          </div>
        </div>
      )}

      {/* 1. Visible, scaled responsive preview with borders and shadows */}
      <div 
        ref={zoomContainerRef}
        className="w-full max-w-full flex justify-center bg-slate-100 py-8 px-4 rounded-3xl border border-slate-250/90 overflow-auto"
      >
        {billFormat === 'A4' || billFormat === 'A5' ? (
          <div
            style={{
              width: `${(billFormat === 'A4' ? 794 : 561) * scale}px`,
              height: `${((billFormat === 'A4' ? 1123 : 794) * totalPages + (totalPages - 1) * 32) * scale}px`,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.1s ease-out",
            }}
            className="flex justify-center items-start shrink-0"
          >
            <div
              ref={invoiceRef}
              className="flex flex-col space-y-8 pb-8"
              style={{
                width: billFormat === 'A4' ? "794px" : "561px",
                transform: `scale(${scale * (billFormat === 'A5' ? 0.707 : 1)}) translateZ(0)`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                textRendering: "optimizeLegibility",
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            >
              {pages.map((page, pIdx) => renderInvoicePage(page, pIdx, false))}
            </div>
          </div>
        ) : (
          <div ref={invoiceRef} className="flex justify-center items-start shrink-0">
            {renderThermalInvoice(false, billFormat === '80mm' ? 300 : 220)}
          </div>
        )}
      </div>

      {/* 2. Hidden off-screen compilation sheet for PDF export and Print (Rendered inside visible layout bounds for pixel-perfect font rasterization) */}
      {typeof window !== 'undefined' && createPortal(
        <div 
          id="printable-invoice"
          className="absolute top-0 pointer-events-none -z-[9999] print:h-auto print:opacity-100 print:overflow-visible print:z-50 print:left-0 print:w-full"
          style={{
            left: "-9999px",
            width: (billFormat === 'A4' || billFormat === 'A5') ? (billFormat === 'A5' ? "561px" : "794px") : (billFormat === '80mm' ? "300px" : "220px"),
          }}
        >
          {/* Active Canvas Print Images (Only visible during print, perfectly sized) */}
          {printImages.length > 0 && (
            <div className="hidden print:flex print:flex-col print:space-y-0 print:w-full">
              {printImages.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Page ${idx + 1}`}
                  className="w-full object-contain block"
                  style={{
                    width: '100%',
                    height: 'auto',
                    pageBreakAfter: idx < printImages.length - 1 ? 'always' : 'auto',
                    breakAfter: idx < printImages.length - 1 ? 'page' : 'auto',
                  }}
                />
              ))}
            </div>
          )}

          {/* Raw HTML markup (Hidden during print if high-res print images are compiled) */}
          <div
            ref={exportInvoiceRef}
            className={`flex flex-col space-y-0 ${printImages.length > 0 ? "print:hidden" : ""}`}
            style={{
              width: (billFormat === 'A4' || billFormat === 'A5') ? (billFormat === 'A5' ? "561px" : "794px") : (billFormat === '80mm' ? "300px" : "220px"),
            }}
          >
            {billFormat === 'A4' || billFormat === 'A5'
              ? pages.map((page, pIdx) => renderInvoicePage(page, pIdx, true))
              : renderThermalInvoice(true, billFormat === '80mm' ? 300 : 220)
            }
          </div>
        </div>,
        document.body
      )}

      {/* Dynamic Print Styles for correct page sizes */}
      <style>{`
        @media print {
          @page {
            size: ${billFormat === 'A4' ? 'A4' : (billFormat === 'A5' ? 'A5' : (billFormat === '80mm' ? '80mm auto' : '58mm auto'))};
            margin: 0 !important;
          }
          html, body {
            width: ${billFormat === 'A4' ? '210mm' : (billFormat === 'A5' ? '148mm' : (billFormat === '80mm' ? '80mm' : '58mm'))};
          }
        }
      `}</style>

    {/* SHARE POPUP MODAL */}
    {isShareModalOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all"
        onClick={handleCloseShareModal}
      >
        <div 
          className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleCloseShareModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-50 hover:bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center transition cursor-pointer"
          >
            &times;
          </button>
          
          <h3 className="text-lg font-black text-slate-900 mb-1">Share Invoice</h3>
          <p className="text-xs font-semibold text-slate-500 mb-4">Select a method below to share this invoice.</p>
          
          {sharePdfBlobUrl && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 mb-4 text-[11px] font-semibold text-slate-600 text-left space-y-1.5 leading-relaxed bg-blue-50/50 border-blue-100">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 text-xs">
                <Check className="w-3.5 h-3.5" /> PDF Generated Successfully!
              </div>
              <p>We pre-compiled and downloaded the PDF. Use any option below or click to download again.</p>
              <a
                href={sharePdfBlobUrl}
                download={`Invoice_${bill.invoiceNumber}${isBW ? "_BW" : ""}.pdf`}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[10px] font-black text-slate-800 transition cursor-pointer mt-1"
              >
                <Download className="w-3 h-3 text-slate-650" /> Download PDF Again
              </a>
            </div>
          )}

          <div className="space-y-3">
            {/* WhatsApp */}
            {/* WhatsApp */}
            <button
              onClick={() => {
                handleCloseShareModal();
                handleShare();
              }}
              className="flex items-center gap-3.5 p-3.5 bg-emerald-50 hover:bg-emerald-100/90 active:scale-98 text-emerald-800 rounded-2xl transition border border-emerald-100 font-bold text-sm w-full cursor-pointer"
            >
              <div className="bg-emerald-500 text-white rounded-xl p-2 shrink-0 flex items-center justify-center">
                <svg 
                  className="w-4 h-4 text-white" 
                  viewBox="0 0 16 16" 
                  fill="currentColor"
                >
                  <path d="M13.601 2.326A7.854 7.854 0 0 0 8 0a7.854 7.854 0 0 0-7.852 7.854c0 1.515.395 2.99 1.147 4.3l-1.217 4.45 4.545-1.192a7.86 7.86 0 0 0 3.758.958h.001c4.337 0 7.862-3.525 7.862-7.856a7.848 7.848 0 0 0-2.311-5.539zM8 14.394h-.001c-1.312-.001-2.602-.352-3.733-1.018l-.268-.159-2.774.727.741-2.71-.174-.277a6.52 6.52 0 0 1-1.002-3.413c0-3.6 2.932-6.531 6.535-6.531 1.744 0 3.385.68 4.618 1.913a6.516 6.516 0 0 1 1.914 4.62c-.002 3.601-2.935 6.532-6.536 6.532zM11.5 9.4c-.19-.094-1.129-.556-1.304-.619-.175-.064-.303-.095-.43.095-.127.19-.492.619-.603.746-.111.127-.222.143-.413.048-.19-.094-.8-.294-1.524-.94-.564-.503-.944-1.126-1.055-1.317-.111-.19-.012-.293.083-.387.086-.085.19-.222.285-.333.095-.11.127-.186.19-.31.064-.128.032-.24-.015-.334-.048-.095-.43-1.034-.59-1.42-.154-.374-.31-.323-.43-.323h-.368c-.19 0-.498.07-.76.355-.26.285-1 .978-1.001 2.387-.001 1.408 1.026 2.77 1.168 2.96 1.42 1.888 2.5 2.5 3.9 2.5h.1c.1 0 .3-.1.4-.2.1-.1.3-.3.4-.4.1-.1.2-.2.2-.3s.1-.2 0-.3z"/>
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-extrabold text-emerald-950 leading-none">Share to WhatsApp</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1">Compose message directly in web or mobile app</p>
              </div>
            </button>

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent(`Invoice ${bill.invoiceNumber} from ${profile?.shopName || "Smart Vyapar"}`)}&body=${encodeURIComponent(shareText)}`}
              className="flex items-center gap-3.5 p-3.5 bg-blue-50 hover:bg-blue-100/90 active:scale-98 text-blue-800 rounded-2xl transition border border-blue-100 font-bold text-sm w-full cursor-pointer"
            >
              <div className="bg-blue-600 text-white rounded-xl p-2 shrink-0 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-extrabold text-blue-950 leading-none">Send with Email</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-1">Open mail client with prefilled details</p>
              </div>
            </a>

            {/* Copy Details */}
            <button
              onClick={handleCopyText}
              className="w-full flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-800 rounded-2xl transition border border-slate-200/80 font-bold text-sm cursor-pointer"
            >
              <div className="bg-slate-700 text-white rounded-xl p-2 shrink-0 flex items-center justify-center">
                {copiedText ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left flex-1">
                <p className="font-extrabold text-slate-900 leading-none">{copiedText ? "Copied Summary!" : "Copy Bill Details"}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">Save copy of outline elements to clipboard</p>
              </div>
            </button>

            {/* Copy Base App Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3.5 p-3.5 bg-slate-100 hover:bg-slate-150 active:scale-98 text-slate-800 rounded-2xl transition border border-slate-200/50 font-bold text-sm cursor-pointer"
            >
              <div className="bg-slate-800 text-white rounded-xl p-2 shrink-0 flex items-center justify-center">
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left flex-1">
                <p className="font-extrabold text-slate-900 leading-none">{copiedLink ? "Link Copied!" : "Copy App Link"}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1 font-mono">{window.location.origin}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
