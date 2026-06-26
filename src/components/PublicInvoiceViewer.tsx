import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Download, Link, QrCode, ShieldCheck, AlertCircle, FileText, ShoppingBag, ArrowRight } from "lucide-react";

interface PublicInvoiceViewerProps {
  pdfId: string;
}

export default function PublicInvoiceViewer({ pdfId }: PublicInvoiceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<{
    invoiceNumber: string;
    shopName: string;
    totalAmount: number;
    pdfBase64: string;
    userId: string;
    createdAt?: string;
  } | null>(null);

  const [merchantUPI, setMerchantUPI] = useState<string | null>(null);
  const [merchantLogo, setMerchantLogo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPdf() {
      setLoading(true);
      setError(null);
      try {
        if (db) {
          const docRef = doc(db, "shared_pdfs", pdfId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setPdfData(data);
            
            // Try fetching merchant profile to get UPI ID or custom logo for payment
            if (data.userId && data.userId !== "anonymous") {
              const userRef = doc(db, "users", data.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.data() as any;
                if (userData.upiId) {
                  setMerchantUPI(userData.upiId);
                }
                if (userData.logo) {
                  setMerchantLogo(userData.logo);
                }
              }
            }
          } else {
            // Check local fallback
            const localData = localStorage.getItem(`shared_pdf_${pdfId}`);
            if (localData) {
              setPdfData({
                invoiceNumber: "Local-Backup",
                shopName: "Our Store",
                totalAmount: 0,
                pdfBase64: localData,
                userId: "anonymous"
              });
            } else {
              setError("The requested invoice link does not exist or has expired.");
            }
          }
        } else {
          // Firebase not initialized local fallback
          const localData = localStorage.getItem(`shared_pdf_${pdfId}`);
          if (localData) {
            setPdfData({
              invoiceNumber: "Offline-Session",
              shopName: "Our Store",
              totalAmount: 0,
              pdfBase64: localData,
              userId: "anonymous"
            });
          } else {
            setError("The application is in offline sandbox mode and this PDF could not be retrieved.");
          }
        }
      } catch (err: any) {
        console.error("Error loading shared PDF:", err);
        setError("Failed to retrieve invoice due to network issue. Please refresh or try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchPdf();
  }, [pdfId]);

  const handleDownload = () => {
    if (!pdfData) return;
    const link = document.createElement("a");
    link.href = pdfData.pdfBase64;
    link.download = `Invoice_${pdfData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 animate-spin border-t-indigo-600" />
          <div className="absolute w-6 h-6 rounded-full bg-indigo-55/50 animate-pulse" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Retrieving Secure Invoice...
        </p>
      </div>
    );
  }

  if (error || !pdfData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Invoice Not Found</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {error || "We couldn't load the requested document. It may have been deleted by the issuer."}
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            Go to Smart Vyapar Home
          </button>
        </div>
      </div>
    );
  }

  // Construct merchant payment link if UPI is available
  const upiUrl = merchantUPI 
    ? `upi://pay?pa=${encodeURIComponent(merchantUPI)}&pn=${encodeURIComponent(pdfData.shopName)}&am=${pdfData.totalAmount}&cu=INR&tn=${encodeURIComponent(`Inv ${pdfData.invoiceNumber}`)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {merchantLogo ? (
              <img src={merchantLogo} alt={pdfData.shopName} className="w-8 h-8 rounded-lg object-contain border border-slate-100" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                SV
              </div>
            )}
            <div>
              <h1 className="font-black text-slate-900 text-sm leading-tight">{pdfData.shopName}</h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-tight uppercase">Public Invoice Portal</p>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left/Middle Content: Invoice Preview */}
        <section className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <FileText className="w-4.5 h-4.5 text-indigo-500" /> Digital Bill Copy
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md uppercase">
              {pdfData.invoiceNumber}
            </span>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative min-h-[500px] sm:min-h-[650px] flex flex-col">
            {/* Embedded PDF iframe */}
            <iframe
              src={`${pdfData.pdfBase64}#toolbar=0&navpanes=0`}
              title={`Invoice ${pdfData.invoiceNumber}`}
              className="w-full flex-1 border-0"
              style={{ minHeight: "550px" }}
            />
            
            {/* Overlay link for some mobile browsers that block PDFs in iframes */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <p className="text-[11px] text-slate-500 font-semibold">
                Cannot see the embedded PDF preview clearly? Use direct link:
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                Open in Full Window <Link className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Summary and Action Panel */}
        <section className="space-y-6">
          
          {/* Quick Details Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 text-left">
            <h3 className="font-black text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5 uppercase">
              <ShoppingBag className="w-4.5 h-4.5 text-slate-650" /> Invoice Details
            </h3>
            
            <div className="space-y-3 font-semibold text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice No.</span>
                <span className="font-extrabold text-slate-900">{pdfData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shop / Issuer</span>
                <span className="text-slate-900">{pdfData.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Generated On</span>
                <span className="text-slate-900">
                  {pdfData.createdAt ? new Date(pdfData.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recently"}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-900 font-black">Amount Payable</span>
                <span className="text-indigo-650 font-black text-base">₹{(pdfData.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Pay Securely UPI Section */}
          {upiUrl && (
            <div className="bg-emerald-50/55 border border-emerald-100 rounded-2xl p-5 shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-1.5 text-emerald-850 font-black text-sm">
                <QrCode className="w-4.5 h-4.5 text-emerald-600" /> Pay Instantly
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed font-semibold">
                Scan the QR code below using any UPI app (GPay, PhonePe, Paytm, BHIM) to settle your payment securely.
              </p>
              
              <div className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-center max-w-[170px] mx-auto shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`}
                  alt="UPI QR Code"
                  className="w-[140px] h-[140px]"
                />
              </div>

              <a
                href={upiUrl}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/10 cursor-pointer"
              >
                Pay via Mobile App <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Security stamp */}
          <div className="bg-slate-100/50 rounded-xl p-3 flex items-start gap-2 border border-slate-200/50">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-800 leading-tight">Secured Invoicing Certificate</p>
              <p className="text-[9px] text-slate-500 leading-normal font-semibold mt-0.5">
                This transaction document is generated via 256-bit secure tokenization and registered safely in cloud partitions.
              </p>
            </div>
          </div>

        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 text-center mt-auto border-t border-slate-800">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Powered by Smart Vyapar</p>
        <p className="text-[10px] font-semibold text-slate-600">
          Professional cloud bill storage & instant checkout utility. © {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  );
}
