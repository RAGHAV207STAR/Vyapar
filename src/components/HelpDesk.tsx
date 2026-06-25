import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  Mail, 
  Sparkles,
  Printer,
  QrCode,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useBilling } from '../context/BillingContext';

export default function HelpDesk() {
  const { user, profile, showToast } = useBilling();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const defaultFaqs = [
    {
      q: "Does Vyapar Mitra work completely offline?",
      a: "Yes! If local internet goes down, the offline-first registry shell works flawlessly. Invoices draft at millisecond speed, stock deducts correctly, and updates back up to the browser database instantly. Once internet returns, you sync to Firestore with one tap.",
      category: "sync"
    },
    {
      q: "Can I use it on multiple devices?",
      a: "Absolutely. When you register a secure cloud synchronized profile, all your store receipts, materials, and analytics dashboard feed are securely mirrored in Firestore. Access from desktop, tablet, or mobile anytime.",
      category: "general"
    },
    {
      q: "Is my business data secure?",
      a: "Security is our highest benchmark. Vyapar Mitra maintains rigid sandbox and cloud network boundaries. Your local cache remains isolated, and backups are encrypted via industry-grade SSL rules.",
      category: "security"
    },
    {
      q: "How do I print a bill? What printers are supported?",
      a: "We support both executive A4 printers and standard 58mm/80mm Bluetooth or thermal printer layouts. Go to 'Settings' to select your preferred print format. When generating an invoice, click 'Download' or 'Print' to send it to your configured thermal receiver.",
      category: "billing"
    },
    {
      q: "How is GST and CGST/SGST calculated?",
      a: "GST is computed automatically based on the items you select. You can set customized tax tiers (such as 5%, 12%, 18%, or 28%) during billing. If you are doing intra-state operations, the system splits the rate equally into CGST and SGST on tax receipts.",
      category: "billing"
    },
    {
      q: "How do I configure my customized UPI address for QR payments?",
      a: "Go to the 'Profile' section from the sidebar. Under 'UPI Address for QR Payments', enter your business UPI handle (e.g., merchant@paytm or store@icici). Vyapar Mitra will instantly generate a scan-to-pay QR code on every customer bill!",
      category: "setup"
    }
  ];

  // Filtered FAQs based on search
  const filteredFaqs = defaultFaqs.filter(faq => 
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in text-left w-full pb-12">
      
      {/* Banner / Header */}
      <div className="relative bg-gradient-to-tr from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 md:p-10 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-350 border border-indigo-500/20 rounded-full font-mono text-[10px] uppercase tracking-wider font-extrabold">Online Support Gateway</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Vyapar Mitra Help Desk</h1>
          <p className="text-sm text-slate-300 leading-relaxed font-semibold">
            Resolve thermal printer settings, query GST calculations, setup UPI QR handles, or submit direct optimization feedback to principal developer Raghav Pratap.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Left Columns - FAQ Search & Accordion */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-black text-slate-905 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Frequently Asked Questions</span>
            </h3>
            
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search queries, printer setup, GST math..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5 pt-2">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-50/50 border border-slate-200/60 rounded-xl overflow-hidden hover:border-indigo-100 transition-colors duration-200"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-slate-800 hover:text-indigo-600 transition"
                    >
                      <span className="text-xs font-semibold leading-relaxed pr-4">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transform transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                    
                    {activeFaq === idx && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200/20 text-xs text-slate-500 font-semibold leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 font-bold text-xs">
                  No matching support records found. Try other keywords.
                </div>
              )}
            </div>
          </div>

          {/* Quick Setup Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-start gap-2.5">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Printer className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Printer Settings</h5>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Configure compact 80mm/58mm thermal output variables from the core system settings.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-start gap-2.5">
              <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
                <QrCode className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">UPI QR Codes</h5>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Add your UPI merchant handle in Profile settings to render payments dynamically.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-start gap-2.5">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Lock className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">Cloud Encryption</h5>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                Every backup is fortified using secure SSL boundaries and isolated Google servers.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Priority Support & Feature Request Banner */}
      <div className="mt-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl border border-indigo-400/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20 group relative overflow-hidden text-white w-full">
        <div className="absolute top-0 right-0 -mx-8 -my-8 w-48 h-48 bg-white/10 rounded-full blur-3xl filter group-hover:bg-white/20 transition-all duration-500" />
        <div className="absolute bottom-0 left-0 -mx-8 -my-8 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl filter group-hover:bg-purple-400/30 transition-all duration-500" />
        
        <div className="space-y-2 flex-1 min-w-0 text-left relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-white/10">
              <MessageSquare className="w-4 h-4 text-white" />
            </span>
            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest block">24/7 Priority Support Desk</span>
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight leading-snug">
            Need Help, Training, or a Custom Feature?
          </h3>
          
          <p className="text-xs text-indigo-100 font-medium leading-relaxed max-w-[90%]">
            Our expert team is live. Email us directly with any questions or feature requests—we typically respond with customized updates within <strong className="text-white font-bold bg-white/20 px-1 py-0.5 rounded">24 hours</strong>.
          </p>
        </div>

        <div className="shrink-0 relative z-10">
          <a href="mailto:support.vyaparmitra@gmail.com?subject=Priority%20Support%20%2F%20Feature%20Request&body=Hello%20VyaparMitra%20Team%2C%0A%0AI%20am%20using%20the%20VyaparMitra%20billing%20and%20ERP%20applet.%20I'd%20love%20get%20assistance%20on%3A%0A%0A%5BDescribe%20your%20need%20or%20feature%20here%5D" className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-indigo-700 hover:bg-slate-50 text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            <Mail className="w-4 h-4 text-indigo-750 stroke-[2.5]" /> Contact support.vyaparmitra@gmail.com
          </a>
        </div>
      </div>

    </div>
  );
}
