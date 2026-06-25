import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FilePlus, 
  ScrollText, 
  Package, 
  PieChart, 
  UserCircle, 
  Settings, 
  HelpCircle,
  Receipt,
  Sparkles,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function CommandMenu({ isOpen, onClose, onNavigate }: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const items = [
    { name: 'Dashboard', icon: LayoutDashboard, keywords: ['home', 'start', 'overview'] },
    { name: 'Create Bill', icon: FilePlus, keywords: ['invoice', 'new', 'bill', 'receipt'] },
    { name: 'Bill History', icon: ScrollText, keywords: ['past', 'invoices', 'history'] },
    { name: 'Bill Payment Status', icon: Receipt, keywords: ['status', 'unpaid', 'due', 'payment'] },
    { name: 'Inventory', icon: Package, keywords: ['stock', 'items', 'products', 'add product'] },
    { name: 'AI Replenishment', icon: Sparkles, keywords: ['ai', 'purchase order', 'reorder', 'smart'] },
    { name: 'Financial Center', icon: TrendingUp, keywords: ['finance', 'profit', 'loss', 'money'] },
    { name: 'Analytics', icon: PieChart, keywords: ['stats', 'graphs', 'reports', 'analytics'] },
    { name: 'Profile', icon: UserCircle, keywords: ['account', 'user', 'shop'] },
    { name: 'Settings', icon: Settings, keywords: ['preferences', 'config'] },
    { name: 'Help Desk', icon: HelpCircle, keywords: ['support', 'help', 'faq'] }
  ];

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden pointer-events-auto border border-slate-200/60"
            >
              <div className="flex items-center px-4 py-3 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-800 text-sm font-medium placeholder-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && filteredItems.length > 0) {
                      onNavigate(filteredItems[0].name);
                      onClose();
                    }
                  }}
                />
                <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                  ESC
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">
                    No results found for "{query}"
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          onNavigate(item.name);
                          onClose();
                        }}
                        className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 text-left transition-colors group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center mr-4 transition-colors">
                          <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">
                          {item.name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
