import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Package, Trash2, Check, Download, ArrowRight, Search, FileText, Loader2, 
  ListRestart, Plus, Printer, TrendingUp, Sparkles, Building2, AlertTriangle, 
  ShieldCheck, Clock, Filter, ChevronLeft, ChevronRight, Share2, Barcode,
  Mail, Calendar, ChevronDown, RefreshCw, X, Copy, Save, FilePlus, XCircle, Upload, CheckCircle2, Info,
  MoreVertical, Pencil, Eye, ArrowLeft, Maximize2, Minimize2
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useBilling } from '../context/BillingContext';
import { useFinancial } from '../context/FinancialContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { db, cleanUndefined } from '../firebase';
import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp, runTransaction } from 'firebase/firestore';
import POCreatorWorkspace from './POCreatorWorkspace';
import FulfillmentPipeline from './FulfillmentPipeline';
import SupplierLedgerHub from './SupplierLedgerHub';
import { generatePO_PDF } from '../utils/poPdfGenerator';
import { PurchaseOrderA4Preview } from './PurchaseOrderA4Preview';

export default function AIPurchaseOrderManager() {
  const { inventory, adjustStock, addProduct, updateProduct } = useInventory();
  const { showToast, profile, bills = [], isOnline, isCloudConnected, user } = useBilling();
  const { addTransaction } = useFinancial();

  // Root workspaces: 'dashboard', 'new_order', 'drafts', 'receiving', 'suppliers'
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'new_order' | 'drafts' | 'receiving' | 'suppliers'>('dashboard');

  // Search & Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [poSortBy, setPoSortBy] = useState('date-desc');
  const [showArchivedPOs, setShowArchivedPOs] = useState(false);

  // Supplier assign and price fine-tune states (localStorage sync)
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('vmitra_supplier_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('vmitra_qty_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [costOverrides, setCostOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('vmitra_cost_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist overrides helpers
  useEffect(() => {
    localStorage.setItem('vmitra_supplier_overrides', JSON.stringify(supplierOverrides));
  }, [supplierOverrides]);

  useEffect(() => {
    localStorage.setItem('vmitra_qty_overrides', JSON.stringify(qtyOverrides));
  }, [qtyOverrides]);

  useEffect(() => {
    localStorage.setItem('vmitra_cost_overrides', JSON.stringify(costOverrides));
  }, [costOverrides]);

  // PO lines state for MANUAL drafted orders or customizing selected suggestions
  const [poDraftItems, setPoDraftItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('vmitra_po_draft_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vmitra_po_draft_items', JSON.stringify(poDraftItems));
  }, [poDraftItems]);

  const [draftSupplier, setDraftSupplier] = useState('');
  const [customSearchTerm, setCustomSearchTerm] = useState('');
  const [customQtyInput, setCustomQtyInput] = useState<number | "">("");
  const [customCostInput, setCustomCostInput] = useState<number>(0);
  const [customUnitInput, setCustomUnitInput] = useState<string>('units');

  // --- AI DIGITAL BILL SCANNING WORKFLOW CLIENT STATES ---
  const [isExtractingBill, setIsExtractingBill] = useState(false);
  const [extractedInvoiceDetails, setExtractedInvoiceDetails] = useState<any>(null);
  const [billFileName, setBillFileName] = useState("");
  const [isDragOverBill, setIsDragOverBill] = useState(false);

  // --- WORKFLOW PRODUCTIVITY STATES (Feature 1, 3, 5, 6) ---
  const [draftSubTab, setDraftSubTab] = useState<'editor' | 'drafts'>('editor');
  const [poDrafts, setPoDrafts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('vmitra_po_drafts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // Filter out completely empty or invalid drafts, repair and sanitize properties
      return parsed
        .filter((d: any) => {
          if (!d || typeof d !== 'object') return false;
          if (typeof d.id !== 'string' || d.id.trim() === '') return false;
          
          // An empty draft created by automatic loops has no items and no supplier name
          const hasItems = Array.isArray(d.items) && d.items.length > 0;
          const hasSupplier = typeof d.supplier === 'string' && d.supplier.trim() !== '';
          const hasAnyNotes = typeof d.purchaseNotes === 'string' && d.purchaseNotes.trim() !== '';

          // Only keep if there's actually some content
          return hasItems || hasSupplier || hasAnyNotes;
        })
        .map((d: any) => {
          return {
            id: d.id,
            name: typeof d.name === 'string' ? d.name : `Draft: ${d.supplier || d.id}`,
            supplier: typeof d.supplier === 'string' ? d.supplier : '',
            items: Array.isArray(d.items) ? d.items.filter((item: any) => item && typeof item === 'object') : [],
            purchaseNotes: typeof d.purchaseNotes === 'string' ? d.purchaseNotes : '',
            deliveryInstructions: typeof d.deliveryInstructions === 'string' ? d.deliveryInstructions : '',
            supplierInstructions: typeof d.supplierInstructions === 'string' ? d.supplierInstructions : '',
            updatedAt: typeof d.updatedAt === 'string' && !isNaN(Date.parse(d.updatedAt)) ? d.updatedAt : new Date().toISOString(),
            createdAt: typeof d.createdAt === 'string' && !isNaN(Date.parse(d.createdAt)) ? d.createdAt : new Date().toISOString(),
            showItemCost: typeof d.showItemCost === 'boolean' ? d.showItemCost : true,
            showTotalCost: typeof d.showTotalCost === 'boolean' ? d.showTotalCost : true,
            showGst: typeof d.showGst === 'boolean' ? d.showGst : true,
            showLogisticPrice: typeof d.showLogisticPrice === 'boolean' ? d.showLogisticPrice : true,
            savedByUser: d.savedByUser === true || d.savedByUser === 'true'
          };
        });
    } catch {
      return [];
    }
  });
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Three detailed notes fields for the active custom builder (Feature 3)
  const [purchaseNotes, setPurchaseNotes] = useState('Please ensure all items meet standard quality checks before dispatch.');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [supplierInstructions, setSupplierInstructions] = useState('Any discrepancies in the invoice must be notified before shipping.');

  useEffect(() => {
    if (profile?.address) {
      setDeliveryInstructions(prev => !prev || prev === 'Shop #112, Main Business Market, Central Av.' ? profile.address : prev);
    } else {
       setDeliveryInstructions(prev => !prev ? 'Shop #112, Main Business Market, Central Av.' : prev);
    }
  }, [profile?.address]);

  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  
  // Duplicate PO Protection State (Feature 4 & 5)
  const [duplicateWarningData, setDuplicateWarningData] = useState<{
    poId?: string;
    date?: string;
    supplier?: string;
    status?: string;
    payload?: any;
    mode: 'manual' | 'draft';
  } | null>(null);

  const [isDuplicateReviewing, setIsDuplicateReviewing] = useState(false);

  // Draft search logic
  // Helper functions for Smart Draft Management & Health (Feature 1 & 2)
  const getDraftStatus = (updatedAt: string | undefined | null) => {
    if (!updatedAt) return 'Active';
    const timestamp = new Date(updatedAt).getTime();
    if (isNaN(timestamp)) return 'Active';
    const days = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    if (days >= 90) return 'Expired';
    if (days >= 30) return 'Archived';
    if (days >= 7) return 'Recent';
    return 'Active';
  };

  const getDraftHealth = (draft: any) => {
    if (!draft) return { hasSupplier: false, hasItems: false, hasValidQty: false, hasNotes: false, percentage: 0, status: 'Incomplete' };
    const items = Array.isArray(draft.items) ? draft.items : [];
    
    const checks = {
      hasSupplier: typeof draft.supplier === 'string' && draft.supplier.trim() !== '',
      hasItems: items.length > 0,
      hasValidQty: items.length > 0 && items.every((i: any) => i && typeof i.qty === 'number' && i.qty > 0),
      hasNotes: !!(
        (typeof draft.purchaseNotes === 'string' && draft.purchaseNotes.trim() !== '') || 
        (typeof draft.deliveryInstructions === 'string' && draft.deliveryInstructions.trim() !== '') || 
        (typeof draft.supplierInstructions === 'string' && draft.supplierInstructions.trim() !== '')
      )
    };
    const total = 4;
    const passed = Object.values(checks).filter(Boolean).length;
    const percentage = Math.round((passed / total) * 100);
    
    let status = 'Incomplete';
    if (percentage === 100) status = 'Complete';
    else if (!checks.hasSupplier) status = 'Missing Supplier';
    else if (!checks.hasItems) status = 'Missing Products';
    else if (!checks.hasValidQty) status = 'Missing Quantities';
    else if (!checks.hasNotes) status = 'Missing Notes';

    return { ...checks, percentage, status };
  };

  // Helper to generate a unique short PO ID like invoice number
  const generateUniquePoId = (): string => {
    let attempt = 0;
    while (attempt < 100) {
      const candidate = `PO-${Math.floor(100000 + Math.random() * 900000)}`;
      if (!pendingOrders || !pendingOrders.some(p => p.id === candidate)) {
        return candidate;
      }
      attempt++;
    }
    return `PO-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  // Save in Draft action
  const saveInDraftAction = (draft: any) => {
    setPoDrafts(prev => prev.map(d => {
      if (d.id === draft.id) {
        return {
          ...d,
          savedByUser: true,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    }));
    showToast(`Saved "${draft.supplier || 'Draft PO'}" to your Drafts Folder successfully!`, "success");
  };

  // Helper for Duplicate Checking
  const checkDuplicatePo = (supplier: string, items: any[]) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const similar = pendingOrders.find(po => {
      if (new Date(po.date) < thirtyDaysAgo) return false;
      if (po.supplier?.toLowerCase() !== supplier?.toLowerCase()) return false;
      
      const ourItems = items.map(i => i.productName.toLowerCase()).sort().join('|');
      const checkingItems = (po.items || []).map((i: any) => i.productName.toLowerCase()).sort().join('|');
      return ourItems === checkingItems && ourItems !== '';
    });
    
    return similar;
  };

  const [draftSearch, setDraftSearch] = useState('');
  const [showArchivedDrafts, setShowArchivedDrafts] = useState(false);
  const [draftSortPolicy, setDraftSortPolicy] = useState<'recent' | 'old'>('recent');
  const [draftSearchFilter, setDraftSearchFilter] = useState<'all' | 'date' | 'supplier'>('all');

  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [openDropdownDraftId, setOpenDropdownDraftId] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<any | null>(null);

  // Filter out archived/expired unless explicitly viewing them or searching
  const filteredDrafts = poDrafts.filter(d => {
    if (!d) return false;

    // Strict user instruction check: Show ONLY manually saved drafts (where savedByUser is true)
    if (d.savedByUser !== true) return false;

    const status = getDraftStatus(d.updatedAt);
    const isHidden = (status === 'Archived' || status === 'Expired') && !draftSearch && !showArchivedDrafts;
    if (isHidden) return false;

    const searchLower = draftSearch.toLowerCase();
    let dateStr = "";
    if (d.updatedAt) {
      dateStr = new Date(d.updatedAt).toLocaleDateString().toLowerCase();
    }

    if (draftSearchFilter === 'supplier') {
      return (d.supplier || '').toLowerCase().includes(searchLower);
    } else if (draftSearchFilter === 'date') {
       return dateStr.includes(searchLower) || (d.date || '').toLowerCase().includes(searchLower);
    } else {
       return (d.name || '').toLowerCase().includes(searchLower) || 
              (d.supplier || '').toLowerCase().includes(searchLower) ||
              dateStr.includes(searchLower);
    }
  }).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return draftSortPolicy === 'old' ? timeA - timeB : timeB - timeA;
  });

  // Recent Auto-backups/Recovery Sessions (where savedByUser is false/undefined)
  const recentDrafts = poDrafts.filter(d => {
    if (!d) return false;

    // Show ONLY autosaved backups (where savedByUser is NOT true)
    if (d.savedByUser === true) return false;

    const status = getDraftStatus(d.updatedAt);
    const isHidden = (status === 'Archived' || status === 'Expired') && !draftSearch && !showArchivedDrafts;
    if (isHidden) return false;

    const searchLower = draftSearch.toLowerCase();
    let dateStr = "";
    if (d.updatedAt) {
      dateStr = new Date(d.updatedAt).toLocaleDateString().toLowerCase();
    }

    if (draftSearchFilter === 'supplier') {
      return (d.supplier || '').toLowerCase().includes(searchLower);
    } else if (draftSearchFilter === 'date') {
       return dateStr.includes(searchLower) || (d.date || '').toLowerCase().includes(searchLower);
    } else {
       return (d.name || '').toLowerCase().includes(searchLower) || 
              (d.supplier || '').toLowerCase().includes(searchLower) ||
              dateStr.includes(searchLower);
    }
  }).sort((a, b) => {
    const timeA = new Date(a.updatedAt || 0).getTime();
    const timeB = new Date(b.updatedAt || 0).getTime();
    return draftSortPolicy === 'old' ? timeA - timeB : timeB - timeA;
  });

  // Auto-save sync status tracking state (Feature 1)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Multi-Notes editing state for pending orders in active lifecycles
  const [editingNotesPoId, setEditingNotesPoId] = useState<string | null>(null);
  const [editingPurchaseNotes, setEditingPurchaseNotes] = useState('');
  const [editingDeliveryInstructions, setEditingDeliveryInstructions] = useState('');
  const [editingSupplierInstructions, setEditingSupplierInstructions] = useState('');

  // Detailed Modal PO View state
  const [viewingPoDetail, setViewingPoDetail] = useState<any | null>(null);

  // Expanded Draft state for secondary actions (Duplicate, Delete)
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vmitra_po_drafts', JSON.stringify(poDrafts));
    
    // Feature 6 & Feature 1: Automatic offline queue-friendly Firebase background synchronization
    if (isCloudConnected && isOnline && user && poDrafts.length > 0) {
      poDrafts.forEach(async (draft) => {
        try {
          await setDoc(doc(db, 'purchaseOrderDrafts', draft.id), cleanUndefined({
            ...draft,
            userId: user.uid
          }), { merge: true });
        } catch (e) {
          // graceful background fallback when intermittent offline
        }
      });
    }
  }, [poDrafts, isCloudConnected, isOnline, user]);

  // Synchronize poDrafts with Firebase real-time on snapshot
  useEffect(() => {
    if (!isCloudConnected || !isOnline || !user) return;

    try {
      const q = query(collection(db, 'purchaseOrderDrafts'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dbDrafts = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as any[];
        
        dbDrafts.sort((a, b) => new Date(b.updatedAt || b.date || 0).getTime() - new Date(a.updatedAt || a.date || 0).getTime());
        setPoDrafts(dbDrafts);
      }, (error) => {
        console.error("Error listening to purchaseOrderDrafts real-time synchronization", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not setup purchaseOrderDrafts real-time sync", err);
    }
  }, [isCloudConnected, isOnline, user]);

  // Core Purchase order history lifecycle logs (Durable Storage)
  const [pendingOrders, setPendingOrders] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('logistics_pending_pos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('logistics_pending_pos', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  // Synchronize pendingOrders with Firebase real-time on snapshot
  useEffect(() => {
    if (!isCloudConnected || !isOnline || !user) return;

    try {
      const q = query(collection(db, 'purchaseOrders'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dbPOs = snapshot.docs.map(doc => {
          const data = doc.data();
          let status = data.status;
          
          // Backward compatibility: default missing status to "pending", normalize to lowercase
          if (!status) {
            status = 'pending';
          } else {
            status = status.toLowerCase();
            if (status === 'generated' || status === 'sent' || status === 'confirmed') {
              status = 'pending';
            } else if (status === 'fully_received') {
              status = 'received';
            } else if (status === 'cancelled') {
              status = 'closed';
            }
          }

          // Clean up conflicting fields
          const cleanData = { ...data };
          delete cleanData.closed;
          delete cleanData.isClosed;
          delete cleanData.received;
          delete cleanData.isReceived;

          return {
            ...cleanData,
            id: doc.id,
            status
          };
        }) as any[];

        dbPOs.sort((a, b) => new Date(b.date || b.updatedAt || 0).getTime() - new Date(a.date || a.updatedAt || 0).getTime());
        setPendingOrders(dbPOs);
      }, (error) => {
        console.error("Error listening to purchaseOrders real-time synchronization", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not setup purchaseOrders real-time sync", err);
    }
  }, [isCloudConnected, isOnline, user]);

  // Listen for AI Replenishment Handoff recommendations
  useEffect(() => {
    const handleHandoff = () => {
      try {
        const handoffStr = localStorage.getItem('vmitra_ai_recommendation_handoff');
        if (handoffStr) {
          const items = JSON.parse(handoffStr);
          if (items && items.length > 0) {
            // Load them into the draft builder UI
            setPoDraftItems(prev => {
              const newItems = [...prev];
              items.forEach((newItem: any) => {
                if (!newItems.find(x => x.productId === newItem.productId)) {
                  newItems.push({
                    productId: newItem.productId,
                    productName: newItem.productName,
                    category: newItem.category,
                    qty: newItem.qty,
                    cost: newItem.cost,
                    total: newItem.qty * newItem.cost,
                    supplier: newItem.supplier || ''
                  });
                }
              });
              return newItems;
            });
            // Clear handoff flag
            localStorage.removeItem('vmitra_ai_recommendation_handoff');
            // Navigate to custom builder view immediately
            setActiveTab('new_order');
            showToast("Replenishment recommendations loaded into Draft Builder.", "success");
          }
        }
      } catch (e) {
        console.warn("Handoff parse error", e);
      }
    };
    
    // Check on mount
    handleHandoff();
    
    // Check on storage event
    window.addEventListener('storage', handleHandoff);
    return () => window.removeEventListener('storage', handleHandoff);
  }, []);

  // Priority matrix sorting state
  const [prioritySortBy, setPrioritySortBy] = useState<'RISK' | 'STOCKOUT' | 'REVENUE'>('RISK');

  // Supplier assign picker popup state
  const [assigningSupplierPid, setAssigningSupplierPid] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState('');

  // Receiving state logs for Modal
  const [receivingPo, setReceivingPo] = useState<any | null>(null);
  const [partialReceipts, setPartialReceipts] = useState<Record<string, number>>({});
  const [closedLines, setClosedLines] = useState<Record<string, boolean>>({});
  const [receivedCosts, setReceivedCosts] = useState<Record<string, number>>({});
  const [isPaymentChecked, setIsPaymentChecked] = useState(true);
  // States for proper inline product registration wizard
  const [registeringProductIndex, setRegisteringProductIndex] = useState<string | number | null>(null);
  const [registeringProductForm, setRegisteringProductForm] = useState<any>(null);

  // Loading States
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReceivingProgress, setIsReceivingProgress] = useState(false);

  // Supplier History Ledger & Purchases Tracker to prevent duplicate entries
  const [supplierHistory, setSupplierHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('vmitra_supplier_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('vmitra_supplier_history', JSON.stringify(supplierHistory));
  }, [supplierHistory]);

  // Real-time listener for Supplier History
  useEffect(() => {
    if (!isCloudConnected || !isOnline || !user) return;

    try {
      const shRef = collection(db, 'supplierHistory');
      const q = query(shRef, where('userId', '==', user.uid));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dbHistory = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as any[];
        
        dbHistory.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setSupplierHistory(dbHistory);
      }, (error) => {
        console.error("Error listening to supplierHistory real-time synchronization", error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not setup supplierHistory real-time sync", err);
    }
  }, [isCloudConnected, isOnline, user]);

  const [productPurchaseRecords, setProductPurchaseRecords] = useState<Record<string, any[]>>(() => {
    try {
      const saved = localStorage.getItem('vmitra_product_purchase_records');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('vmitra_product_purchase_records', JSON.stringify(productPurchaseRecords));
  }, [productPurchaseRecords]);

  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState('');
  const [isIntakePageMode, setIsIntakePageMode] = useState(false);
  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [activePopoverPoId, setActivePopoverPoId] = useState<string | null>(null);
  const [previewingPo, setPreviewingPo] = useState<any | null>(null);
  const [categoryFilterQuery, setCategoryFilterQuery] = useState('ALL');
  const [reEditingPoId, setReEditingPoId] = useState<string | null>(null);

  // Missing product / discrepancy action state
  const [supplierDiscrepancyAction, setSupplierDiscrepancyAction] = useState<'keep_pending' | 'cancel_remaining' | 'supplier_follow_up'>('keep_pending');

  // Intake Quick Product Create Dialog and Summary Dialog
  const [quickProductFormItem, setQuickProductFormItem] = useState<any | null>(null);
  const [quickProductForm, setQuickProductForm] = useState({ name: '', category: 'General', sku: '', purchasePrice: 0, sellingPrice: 0, stock: 0, unit: 'units' });
  const [summaryDataPopup, setSummaryDataPopup] = useState<{
    poId: string;
    productsOrderedCount: number;
    productsReceivedCount: number;
    partiallyCount: number;
    notReceivedCount: number;
    inventoryUpdatedItems: number;
    discrepancyAction: string;
  } | null>(null);

  const [historySubTab, setHistorySubTab] = useState<'suppliers' | 'products'>('suppliers');

  const printRef = useRef<HTMLDivElement>(null);

  // 1. ADVANCED ALGORITHMIC STATS ENGINE FOR ENTIRE SYSTEM
  const smartAnalysis = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesVolumeMap: Record<string, number> = {};
    bills.forEach(bill => {
      if (!bill.invoiceDate) return;
      const isWithin30 = new Date(bill.invoiceDate) >= thirtyDaysAgo;
      bill.products.forEach(item => {
        if (item.inventoryId && isWithin30) {
          salesVolumeMap[item.inventoryId] = (salesVolumeMap[item.inventoryId] || 0) + (item.quantity || 0);
        }
      });
    });

    const recommendations: any[] = [];
    let totalRevenueAtRisk = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let estimatedCost = 0;
    let deadStockCapital = 0;
    let deadStockCount = 0;

    inventory.forEach(product => {
      const soldInLast30 = salesVolumeMap[product.id] || 0;
      const dailyVelocity = soldInLast30 / 30;
      const stockVal = Number(product.stock ?? 0);
      const isOutOfStock = stockVal <= 0;

      let longevity = Infinity;
      if (dailyVelocity > 0) {
        longevity = Math.floor(stockVal / dailyVelocity);
      }

      const leadTime = 3;
      const safetyBuffer = 5;

      let suggestedQty = 0;
      let revenueRisk = 0;
      let isCritical = false;
      let isWarning = false;

      // Classify
      if (isOutOfStock) {
        isCritical = true;
        criticalCount++;
        const multiplier = leadTime + safetyBuffer;
        suggestedQty = qtyOverrides[product.id] ?? Math.max(
          Math.ceil((dailyVelocity || 0.5) * multiplier),
          (product.minStockAlert || 5) * 2
        );
        revenueRisk = (dailyVelocity || 0.8) * 14 * (product.sellingPrice || 50);
      } else if (product.minStockAlert && stockVal <= Number(product.minStockAlert)) {
        isCritical = true;
        criticalCount++;
        const multiplier = leadTime + safetyBuffer;
        suggestedQty = qtyOverrides[product.id] ?? Math.max(
          Math.ceil((dailyVelocity || 0.5) * multiplier) - stockVal,
          (Number(product.minStockAlert) - stockVal) * 2
        );
        revenueRisk = (Number(product.minStockAlert) - stockVal) * (product.sellingPrice || 40);
      } else if (longevity <= 10 && dailyVelocity > 0) {
        isWarning = true;
        warningCount++;
        const multiplier = leadTime + safetyBuffer;
        suggestedQty = qtyOverrides[product.id] ?? Math.max(0, Math.ceil(dailyVelocity * multiplier) - stockVal);
        revenueRisk = Math.max(0, (14 - longevity) * dailyVelocity * (product.sellingPrice || 35));
      } else if (longevity <= 30 && dailyVelocity > 0) {
        isWarning = true;
        warningCount++;
        const multiplier = leadTime + safetyBuffer;
        suggestedQty = qtyOverrides[product.id] ?? Math.max(0, Math.ceil(dailyVelocity * multiplier) - stockVal);
      } else if (soldInLast30 === 0 && stockVal > 0) {
        deadStockCount++;
        deadStockCapital += stockVal * (product.purchasePrice || 0);
      }

      if (suggestedQty > 0 || isCritical || isWarning) {
        const costPerUnit = costOverrides[product.id] ?? (product.purchasePrice || 0);
        const itemEstTotal = suggestedQty * costPerUnit;

        estimatedCost += itemEstTotal;
        totalRevenueAtRisk += revenueRisk;

        recommendations.push({
          product,
          soldInLast30,
          dailyVelocity,
          longevity: longevity === Infinity ? '∞' : longevity,
          suggestedQty,
          unitCost: costPerUnit,
          estimatedTotal: itemEstTotal,
          revenueRisk,
          isCritical,
          isWarning,
          preferredSupplier: supplierOverrides[product.id] || product.supplierName || 'No supplier assigned',
          leadTime,
          safetyBuffer,
          dailyConsumption: dailyVelocity,
          riskLevel: isCritical ? 'HIGH' : isWarning ? 'MEDIUM' : 'LOW'
        });
      }
    });

    // Smart Inventory Health Score Calculations (0-100)
    const totalCatalogCount = inventory.length;
    let score = 100;
    if (totalCatalogCount > 0) {
      const stockoutPenalty = (inventory.filter(i => i.stock <= 0).length / totalCatalogCount) * 60;
      const safetyBreachPenalty = (inventory.filter(i => i.minStockAlert && i.stock > 0 && i.stock <= i.minStockAlert).length / totalCatalogCount) * 25;
      const deadStockPenalty = (deadStockCount / totalCatalogCount) * 15;
      score = Math.max(0, Math.min(100, Math.round(100 - stockoutPenalty - safetyBreachPenalty - deadStockPenalty)));
    }

    // Projected Health Score after restocking critical items
    const potentialScore = Math.min(100, score + Math.round((criticalCount / (totalCatalogCount || 1)) * 40));

    return {
      recommendations,
      totalRevenueAtRisk,
      criticalCount,
      warningCount,
      estimatedCost,
      inventoryScore: score,
      potentialScore,
      deadStockCount,
      deadStockCapital,
      totalCatalogCount
    };
  }, [inventory, bills, supplierOverrides, qtyOverrides, costOverrides]);

  // Selected recommendations for quick PO draft builder
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });


  // Auto-populate selections with critical items on metrics load
  useEffect(() => {
    const criticalPids = smartAnalysis.recommendations
      .filter(r => r.isCritical)
      .map(r => r.product.id);
    setSelectedRecommendations(criticalPids);
  }, [smartAnalysis.recommendations.length]);

  // Distinct suppliers identified
  const liveSuppliersCount = useMemo(() => {
    const suppliers = new Set<string>();
    inventory.forEach(i => { if (i.supplierName) suppliers.add(i.supplierName); });
    Object.values(supplierOverrides).forEach(name => { if (name) suppliers.add(name); });
    pendingOrders.forEach(po => { if (po.supplier) suppliers.add(po.supplier); });
    return suppliers.size;
  }, [inventory, supplierOverrides, pendingOrders]);

  // Handle recommendation checkbox toggle
  const toggleRecSelection = (pid: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  // Reusable format helper
  const formatNum = (v: number) => {
    return Math.round(v).toLocaleString('en-IN');
  };

  // ---------------------------------------------------------------------------
  // SECTION 3: AUTO DRAFT & MULTI-SUPPLIER SPLIT ORDER GENERATOR
  // ---------------------------------------------------------------------------
  const selectedRecSummary = useMemo(() => {
    const selectedItems = smartAnalysis.recommendations.filter(r => selectedRecommendations.includes(r.product.id));
    const distinctSuppliers = new Set<string>();
    let totalQty = 0;
    let totalCost = 0;

    selectedItems.forEach(item => {
      distinctSuppliers.add(item.preferredSupplier);
      totalQty += item.suggestedQty;
      totalCost += item.suggestedQty * item.unitCost;
    });

    return {
      items: selectedItems,
      totalQty,
      subtotal: totalCost,
      supplierCount: distinctSuppliers.size,
      suppliers: Array.from(distinctSuppliers)
    };
  }, [selectedRecommendations, smartAnalysis.recommendations]);

  // Generate Smart split orders or load customizing list
  const handleGenerateSmartPO = () => {
    if (selectedRecommendations.length === 0) {
      showToast("Please select at least one recommended product.", "warning");
      return;
    }

    // Split selected items by supplier
    const supplierGroups: Record<string, any[]> = {};
    selectedRecSummary.items.forEach(rec => {
      const sup = rec.preferredSupplier || 'No supplier assigned';
      if (!supplierGroups[sup]) supplierGroups[sup] = [];
      supplierGroups[sup].push({
        productId: rec.product.id,
        productName: rec.product.name,
        category: rec.product.category || 'General',
        qty: rec.suggestedQty,
        cost: rec.unitCost,
        total: rec.suggestedQty * rec.unitCost,
        receivedQty: 0
      });
    });

    let countCreated = 0;
    const newPOs: any[] = [];

    Object.entries(supplierGroups).forEach(([supplier, lines]) => {
      const poId = generateUniquePoId();
      const sub = lines.reduce((acc, l) => acc + l.total, 0);
      const taxAmount = Math.round(sub * 0.18); // default 18% GST (9% CGST + 9% SGST)
      const logisticFee = 250; // flat logistics charges

      const poObj = {
        id: poId,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        supplier: supplier === 'No supplier assigned' ? '' : supplier,
        items: lines,
        status: 'pending',
        receivedAt: null,
        receivedBy: null,
        receivedQuantity: 0,
        notes: 'AI-generated replenishment PO via Control Center.',
        subTotal: sub,
        gstPercent: 18,
        gstAmount: taxAmount,
        cgstAmount: Math.round(taxAmount / 2),
        sgstAmount: Math.round(taxAmount / 2),
        otherCharges: logisticFee,
        totalAmount: sub + taxAmount + logisticFee,
      };

      newPOs.push(poObj);
      countCreated++;

      if (isCloudConnected && isOnline && user) {
        setDoc(doc(db, 'purchaseOrders', poId), cleanUndefined({
          ...poObj,
          userId: user.uid
        }), { merge: true }).catch((e) => console.error(e));
      }
    });

    setPendingOrders(prev => [...newPOs, ...prev]);
    setSelectedRecommendations([]);
    showToast(`Successfully draft-generated ${countCreated} Supplier Purchase Orders!`, "success");
    setActiveTab('receiving');
  };

  const handleCustomizeDraft = () => {
    if (selectedRecommendations.length === 0) {
      showToast("Select recommended products to load into draft builder.", "warning");
      return;
    }

    const lines = selectedRecSummary.items.map(rec => ({
      productId: rec.product.id,
      productName: rec.product.name,
      category: rec.product.category || 'General',
      qty: rec.suggestedQty,
      cost: rec.unitCost,
      total: rec.suggestedQty * rec.unitCost,
      receivedQty: 0
    }));

    setPoDraftItems(lines);
    if (selectedRecSummary.suppliers.length > 0 && selectedRecSummary.suppliers[0] !== 'No supplier assigned') {
      setDraftSupplier(selectedRecSummary.suppliers[0]);
    }
    setActiveTab('new_order');
    showToast("Loaded selected suggestions into the Custom Builder workspace.", "info");
  };

  // ---------------------------------------------------------------------------
  // MANUAL PO STUFF
  // ---------------------------------------------------------------------------
  const handleAddManualLine = (name: string, pid: string | null, qty: number, cost: number, category = 'General', unit = 'units') => {
    if (!name.trim()) {
      showToast("Please enter or select a product.", "warning");
      return;
    }
    if (qty <= 0) {
      showToast("Quantity must be positive.", "warning");
      return;
    }

    setPoDraftItems(prev => {
      const existing = prev.find(i => i.productName.toLowerCase() === name.toLowerCase());
      if (existing) {
        return prev.map(i => i.productName.toLowerCase() === name.toLowerCase() 
          ? { ...i, qty: i.qty + qty, total: (i.qty + qty) * cost, cost, unit: unit || i.unit || 'units' } 
          : i);
      }
      return [...prev, { productId: pid, productName: name, category, qty, cost, total: qty * cost, unit }];
    });

    setCustomSearchTerm('');
    setCustomQtyInput("");
    setCustomCostInput(0);
    setCustomUnitInput('units');
  };

  // --- DEBOUNCED AUTOMATIC DRAFT AUTO-SAVE (Feature 1, Feature 6) ---
  const triggerDraftAutoSave = (
    items: any[],
    supplier: string,
    pNotes: string,
    dInstructions: string,
    sInstructions: string,
    existingId: string | null,
    isManualSaved = false
  ) => {
    if (items.length === 0 && !supplier.trim() && !pNotes.trim() && !dInstructions.trim() && !sInstructions.trim()) {
      return;
    }

    setAutoSaveStatus('saving');
    const targetId = existingId || `DRAFT-MAN-${Date.now().toString().substring(7)}`;

    const sub = items.reduce((acc, i) => acc + (i.qty * i.cost), 0);
    const tax = Math.round(sub * 0.18);
    const logisticFee = items.length > 0 ? 250 : 0;
    const estTotal = sub + tax + logisticFee;

    const draftObj = {
      id: targetId,
      name: supplier.trim() ? `Draft: ${supplier.trim()}` : `Draft (No Supplier)`,
      supplier: supplier.trim() || '',
      items: items.map(it => ({ ...it, receivedQty: it.receivedQty || 0, isClosed: it.isClosed || false })),
      purchaseNotes: pNotes,
      deliveryInstructions: dInstructions,
      supplierInstructions: sInstructions,
      subTotal: sub,
      gstAmount: tax,
      otherCharges: logisticFee,
      totalAmount: estTotal,
      status: 'Draft',
      savedByUser: isManualSaved,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPoDrafts(prev => {
      const idx = prev.findIndex(d => d.id === targetId);
      if (idx > -1) {
        const existing = prev[idx];
        const updatedList = [...prev];
        updatedList[idx] = {
          ...existing,
          ...draftObj,
          savedByUser: isManualSaved || existing.savedByUser || false,
          createdAt: existing.createdAt || draftObj.createdAt
        };
        return updatedList;
      } else {
        return [{ ...draftObj, savedByUser: isManualSaved }, ...prev];
      }
    });

    // Automatically set active draft id if empty so they continue editing the exact same record
    if (!existingId) {
      setActiveDraftId(targetId);
    }

    setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 600);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      triggerDraftAutoSave(
        poDraftItems,
        draftSupplier,
        purchaseNotes,
        deliveryInstructions,
        supplierInstructions,
        activeDraftId
      );
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [poDraftItems, draftSupplier, purchaseNotes, deliveryInstructions, supplierInstructions, activeDraftId]);

  // Save manual draft trigger action
  const handleSaveDraftManual = (shouldRedirect = true) => {
    if (poDraftItems.length === 0 && !draftSupplier.trim()) {
      showToast("Please add items or supply merchant name to save draft.", "warning");
      return;
    }
    triggerDraftAutoSave(
      poDraftItems,
      draftSupplier,
      purchaseNotes,
      deliveryInstructions,
      supplierInstructions,
      activeDraftId,
      true // Mark as manually saved by user
    );
    showToast("Draft Saved successfully.", "success");
    setDraftSubTab('drafts');
    if (shouldRedirect) {
      setActiveTab('drafts');
    }
  };

  // Resume Draft action (Feature 1, Feature 5)
  const resumeDraftAction = (draft: any) => {
    setPoDraftItems(draft.items || []);
    setDraftSupplier(draft.supplier || '');
    setPurchaseNotes(draft.purchaseNotes || '');
    setDeliveryInstructions(draft.deliveryInstructions || '');
    setSupplierInstructions(draft.supplierInstructions || '');
    setActiveDraftId(draft.id);
    setActiveTab('new_order');
    showToast(`Resumed "${draft.name || draft.id}" draft.`, "success");
  };

  // Delete Draft action
  const clearAllRecentDraftsAction = () => {
    setConfirmDialog({
      isOpen: true,
      message: "WARNING: Are you sure you want to permanently delete ALL recent auto-backups?",
      onConfirm: () => {
        setPoDrafts(prev => prev.filter(d => d.savedByUser === true));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteDraftAction = (draftId: string) => {
    setPoDrafts(prev => prev.filter(d => d.id !== draftId));
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
      setPoDraftItems([]);
      setDraftSupplier('');
      setPurchaseNotes('Please ensure all items meet standard quality checks before dispatch.');
      setDeliveryInstructions(profile?.address || 'Shop #112, Main Business Market, Central Av.');
      setSupplierInstructions('Any discrepancies in the invoice must be notified before shipping.');
    }
    showToast("Procurement draft deleted successfully.", "info");

    // Clean Firestore Doc if online (Feature 6)
    if (isCloudConnected && isOnline && user) {
      try {
        deleteDoc(doc(db, 'purchaseOrderDrafts', draftId));
      } catch (e) {
        console.warn("Could not clean cloud draft:", e);
      }
    }
  };

  // Archive Draft action
  const archiveDraftAction = (draftId: string) => {
    setPoDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        // Manipulate updatedAt to make it >= 30 days old directly
        const date = new Date();
        date.setDate(date.getDate() - 31);
        return { ...d, updatedAt: date.toISOString() };
      }
      return d;
    }));
    showToast("Draft archived.", "info");
  };

  // Restore Draft action
  const restoreDraftAction = (draftId: string) => {
    setPoDrafts(prev => prev.map(d => {
      if (d.id === draftId) {
        return { ...d, updatedAt: new Date().toISOString() };
      }
      return d;
    }));
    showToast("Draft restored.", "success");
  };

  // Duplicate PO and Draft Action operations (Feature 2 & 5)
  const duplicatePurchaseOrderAction = (poOrDraft: any) => {
    const itemsToCopy = (poOrDraft.items || []).map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      category: it.category || 'General',
      qty: it.qty,
      cost: it.cost,
      total: it.total,
      receivedQty: 0,
      isClosed: false
    }));

    const supplier = poOrDraft.supplier || '';
    const pNotes = poOrDraft.purchaseNotes || poOrDraft.notes || '';
    const dInstructions = poOrDraft.deliveryInstructions || '';
    const sInstructions = poOrDraft.supplierInstructions || '';

    // Smart Duplication Workflow -> Always load into Draft Editor
    setPoDraftItems(itemsToCopy);
    setDraftSupplier(supplier);
    setPurchaseNotes(pNotes);
    setDeliveryInstructions(dInstructions);
    setSupplierInstructions(sInstructions);
    setActiveDraftId(null); 
    setActiveTab('new_order');
    setIsDuplicateReviewing(true); // Highlights copies
    showToast("Duplicated. Please review copied quantities before saving draft or generating PO.", "success");
  };

  // Generate real dispatch order from a saved draft (Feature 5)
  const generatePoFromDraftAction = (draft: any, forceCheck = false) => {
    // Validation checks
    if (!draft.items?.length) {
      showToast("Cannot generate empty purchase order.", "warning");
      return;
    }

    if (!forceCheck) {
      const duplicate = checkDuplicatePo(draft.supplier || '', draft.items);
      if (duplicate) {
        setDuplicateWarningData({
          poId: duplicate.id, date: duplicate.date, supplier: duplicate.supplier, status: duplicate.status,
          mode: 'draft', payload: draft
        });
        return;
      }
    }

    const poId = generateUniquePoId();
    const newPO = {
      id: poId,
      userId: user?.uid || null,
      date: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplier: draft.supplier || '',
      items: (draft.items || []).map((it: any) => {
        const { isClosed, closed, ...rest } = it;
        return { ...rest, receivedQty: 0 };
      }),
      status: 'pending',
      receivedAt: null,
      receivedBy: null,
      receivedQuantity: 0,
      notes: draft.purchaseNotes || 'Custom finalized procurement draft PO.',
      purchaseNotes: draft.purchaseNotes || '',
      deliveryInstructions: draft.deliveryInstructions || '',
      supplierInstructions: draft.supplierInstructions || '',
      subTotal: draft.subTotal || 0,
      gstPercent: 18,
      gstAmount: draft.gstAmount || 0,
      cgstAmount: Math.round((draft.gstAmount || 0) / 2),
      sgstAmount: Math.round((draft.gstAmount || 0) / 2),
      otherCharges: draft.otherCharges || 250,
      totalAmount: draft.totalAmount || 0,
    };

    if (isCloudConnected && isOnline && user) {
      setDoc(doc(db, 'purchaseOrders', poId), cleanUndefined(newPO), { merge: true }).then(() => {
        console.log("Created PO in firestore successfully");
        showToast(`Successfully created purchase order ${poId}!`, "success");
      }).catch((e) => {
        console.error("Firebase setDoc error:", e);
        showToast("Failed to save to cloud: " + e.message, "error");
      });
    } else {
      setPendingOrders(prev => [newPO, ...prev]);
      showToast(`Successfully created purchase order ${poId} (Local)!`, "success");
    }

    // Erase draft
    deleteDraftAction(draft.id);
    setActiveTab('receiving');
    setDuplicateWarningData(null);
  };

  // Action function to edit notes for an already created active PO (Feature 3)
  const triggerNotesEditPopup = (po: any) => {
    setEditingNotesPoId(po.id);
    setEditingPurchaseNotes(po.purchaseNotes || po.notes || '');
    setEditingDeliveryInstructions(po.deliveryInstructions || '');
    setEditingSupplierInstructions(po.supplierInstructions || '');
  };

  const saveEditedPoNotes = () => {
    if (!editingNotesPoId) return;

    let targetUpdatedPo: any = null;
    const updatedPending = pendingOrders.map(p => {
      if (p.id === editingNotesPoId) {
        const updatedPo = {
          ...p,
          notes: editingPurchaseNotes || p.notes,
          purchaseNotes: editingPurchaseNotes,
          deliveryInstructions: editingDeliveryInstructions,
          supplierInstructions: editingSupplierInstructions,
          updatedAt: new Date().toISOString()
        };
        targetUpdatedPo = updatedPo;
        return updatedPo;
      }
      return p;
    });

    if (targetUpdatedPo && isCloudConnected && isOnline && user) {
      setDoc(doc(db, 'purchaseOrders', targetUpdatedPo.id), cleanUndefined(targetUpdatedPo), { merge: true }).then(() => {
        showToast("Purchase instructions updated successfully.", "success");
      }).catch((e) => {
        console.error("Firebase setDoc error:", e);
        showToast("Failed to update: " + e.message, "error");
      });
    } else if (targetUpdatedPo) {
      setPendingOrders(updatedPending);
      showToast("Purchase instructions updated successfully (Local).", "success");
    }

    setEditingNotesPoId(null);
  };

  // --- STANDARD CUSTOM BUILDER DISPATCH WORKFLOW ---
  const handleFinalizeCustomDraftFile = (forceCheck = false, saveAsNew = false) => {
    if (poDraftItems.length === 0) {
      showToast("Your draft list is empty. Add elements first.", "warning");
      return;
    }
    
    // Validate empty rows (Feature 10: Merchant Safety Checks)
    const invalidItem = poDraftItems.find(i => i.qty <= 0);
    if (invalidItem) {
      showToast(`Invalid quantity for ${invalidItem.productName}. Cannot be 0.`, "warning");
      return;
    }

    if (!forceCheck && (!reEditingPoId || saveAsNew)) {
      const duplicate = checkDuplicatePo(draftSupplier.trim(), poDraftItems);
      if (duplicate) {
        setDuplicateWarningData({
          poId: duplicate.id, date: duplicate.date, supplier: duplicate.supplier, status: duplicate.status,
          mode: 'manual'
        });
        return;
      }
    }

    const sub = poDraftItems.reduce((acc, i) => acc + (i.qty * i.cost), 0);
    const tax = Math.round(sub * 0.18);
    const logisticFee = 250;

    if (reEditingPoId && !saveAsNew) {
      let targetUpdatedPo: any = null;
      const updatedPending = pendingOrders.map(p => {
        if (p.id === reEditingPoId) {
          const updatedPo = {
            ...p,
            supplier: draftSupplier.trim() || '',
            items: [...poDraftItems],
            subTotal: sub,
            gstPercent: 18,
            gstAmount: tax,
            cgstAmount: Math.round(tax / 2),
            sgstAmount: Math.round(tax / 2),
            otherCharges: logisticFee,
            totalAmount: sub + tax + logisticFee,
            purchaseNotes,
            deliveryInstructions,
            supplierInstructions,
            notes: purchaseNotes || 'Custom finalized procurement PO.',
            lastEditedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          targetUpdatedPo = updatedPo;
          return updatedPo;
        }
        return p;
      });

      if (targetUpdatedPo && isCloudConnected && isOnline && user) {
        setDoc(doc(db, 'purchaseOrders', targetUpdatedPo.id), cleanUndefined(targetUpdatedPo), { merge: true }).then(() => {
          showToast(`Successfully updated purchase order ${reEditingPoId}!`, "success");
        }).catch((e) => {
          console.error("Firebase setDoc error:", e);
          showToast("Failed to update: " + e.message, "error");
        });
      } else if (targetUpdatedPo) {
        setPendingOrders(updatedPending);
        showToast(`Successfully updated purchase order ${reEditingPoId} (Local)!`, "success");
      }

      setReEditingPoId(null);
      setActiveTab('receiving');
    } else {
      const poId = generateUniquePoId();
      const newPO = {
        id: poId,
        userId: user?.uid || null,
        date: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        supplier: draftSupplier.trim() || '',
        items: [...poDraftItems].map(it => {
          const { isClosed, closed, ...rest } = it;
          return { ...rest, receivedQty: 0 };
        }),
        status: 'pending',
        receivedAt: null,
        receivedBy: null,
        receivedQuantity: 0,
        notes: purchaseNotes || 'Custom finalized procurement draft PO.',
        purchaseNotes,
        deliveryInstructions,
        supplierInstructions,
        subTotal: sub,
        gstPercent: 18,
        gstAmount: tax,
        cgstAmount: Math.round(tax / 2),
        sgstAmount: Math.round(tax / 2),
        otherCharges: logisticFee,
        totalAmount: sub + tax + logisticFee,
      };

      if (isCloudConnected && isOnline && user) {
        setDoc(doc(db, 'purchaseOrders', poId), cleanUndefined(newPO), { merge: true }).then(() => {
          console.log("Created PO in firestore successfully");
          showToast(`Successfully created purchase order ${poId}!`, "success");
        }).catch((e) => {
          console.error("Firebase setDoc error:", e);
          showToast("Failed to save to cloud: " + e.message, "error");
        });
      } else {
        setPendingOrders(prev => [newPO, ...prev]);
        showToast(`Successfully created purchase order ${poId} (Local)!`, "success");
      }

      // If there was an active draft being finalized, clear it from draft lists
      if (activeDraftId) {
        setPoDrafts(prev => prev.filter(d => d.id !== activeDraftId));
        // Also clean Firebase doc
        if (isCloudConnected && isOnline && user) {
          deleteDoc(doc(db, 'purchaseOrderDrafts', activeDraftId)).catch((e) => console.error(e));
        }
      }
    }

    setPoDraftItems([]);
    setDraftSupplier('');
    setPurchaseNotes('Please ensure all items meet standard quality checks before dispatch.');
    setDeliveryInstructions(profile?.address || 'Shop #112, Main Business Market, Central Av.');
    setSupplierInstructions('Any discrepancies in the invoice must be notified before shipping.');
    setActiveDraftId(null);
    setIsDuplicateReviewing(false);
    setActiveTab('receiving');
    setDuplicateWarningData(null);
  };

  // Dedicated email voucher router (Feature 3)
  const triggerEmailDispatch = (po: any) => {
    const itemsText = po.items.map((i: any) => `- ${i.productName}: ${i.qty - (i.receivedQty || 0)} Units x Rs.${i.cost}`).join('%0D%0A');
    const notesStr = po.purchaseNotes ? `%0D%0A%0D%0APurchase Notes: ${po.purchaseNotes}` : '';
    const deliveryStr = po.deliveryInstructions ? `%0D%0A%0D%0ADelivery Instructions: ${po.deliveryInstructions}` : '';
    const supplierStr = po.supplierInstructions ? `%0D%0A%0D%0ASupplier Instructions: ${po.supplierInstructions}` : '';
    const subject = `Purchase Order ${po.id} - Vyapar Mitra`;
    const body = `Dear Supplier,%0D%0A%0D%0APlease find our Purchase Order Details:%0D%0A%0D%0APO Number: ${po.id}%0D%0ASupplier: ${po.supplier}%0D%0ADate: ${new Date(po.date).toLocaleDateString()}%0D%0A%0D%0APending Lines to Fulfil:%0D%0A${itemsText}${notesStr}${deliveryStr}${supplierStr}%0D%0A%0D%0AEstimated Invoice Total: Rs.${formatNum(po.totalAmount || 0)}%0D%0A%0D%0APlease arrange immediate dispatch and confirm dispatch date.%0D%0A%0D%0AThank you,%0D%0ABy Vyapar Mitra Admin`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // Quick Supplier Assignment
  const saveQuickSupplierAssign = () => {
    if (!assigningSupplierPid) return;
    setSupplierOverrides(prev => ({
      ...prev,
      [assigningSupplierPid]: newSupplierName.trim()
    }));
    setAssigningSupplierPid(null);
    setNewSupplierName('');
    showToast("Preferred supplier updated.", "success");
  };

  // ---------------------------------------------------------------------------
  // SECTION 10: SMART RECEIVING WORKFLOW (WIZARD OVERRIDES)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // SECTION 10: SMART RECEIVING WORKFLOW (WIZARD OVERRIDES)
  // ---------------------------------------------------------------------------
  const openReceivingManager = (po: any) => {
    setReceivingPo(po);
    const initialReceipts: Record<string, number> = {};
    const initialCloses: Record<string, boolean> = {};
    const initialCosts: Record<string, number> = {};
    po.items.forEach((item: any, idx: number) => {
      const rem = item.qty - (item.receivedQty || 0);
      initialReceipts[`${idx}`] = rem > 0 ? rem : 0;
      initialCloses[`${idx}`] = false;
      initialCosts[`${idx}`] = item.cost || 0;
    });
    setPartialReceipts(initialReceipts);
    setClosedLines(initialCloses);
    setReceivedCosts(initialCosts);
    setIsPaymentChecked(true);
    setRegisteringProductIndex(null);
    setRegisteringProductForm(null);
    setSupplierDiscrepancyAction('keep_pending');
    
    // Reset smart AI bill analyzer states
    setExtractedInvoiceDetails(null);
    setBillFileName("");
    setIsExtractingBill(false);
  };

  useEffect(() => {
    const returnDataStr = sessionStorage.getItem('returnToPurchasesAfterAdd');
    if (returnDataStr && pendingOrders.length > 0) {
      try {
        const returnData = JSON.parse(returnDataStr);
        if (returnData.poId) {
          const po = pendingOrders.find(p => p.id === returnData.poId);
          if (po) {
            openReceivingManager(po);
            setActiveTab('receiving');
            sessionStorage.removeItem('returnToPurchasesAfterAdd');
          }
        }
      } catch (err) {}
    }
  }, [pendingOrders]);

  const handleSupplierBillUpload = async (file: File) => {
    if (!receivingPo) return;
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      showToast("File is too large (limit 12MB). Please select a compressed digital invoice.", "warning");
      return;
    }

    setBillFileName(file.name);
    setIsExtractingBill(true);
    setExtractedInvoiceDetails(null);
    showToast(`Extracting: Reading "${file.name}"...`, "info");

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          const mimeType = file.type || "image/png";

          const response = await fetch("/api/receive/analyze-bill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              billImage: base64Data,
              mimeType: mimeType,
              poItems: receivingPo.items.map((item: any) => ({
                productName: item.productName,
                qty: item.qty,
                cost: item.cost || 0
              }))
            })
          });

          if (response.status === 429) {
            showToast("Your physical bill quality is bad, so upload digital bill instead of it.", "error");
            setIsExtractingBill(false);
            return;
          }

          if (!response.ok) {
            throw new Error(`Server API status error: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.isNotABill) {
            showToast("This is not a bill, so you can kindly upload genuine bill.", "error");
            setIsExtractingBill(false);
            return;
          }

          if (result.isIllegible) {
            showToast(`Scan failed: ${result.illegibleReason || 'The bill is blurry or illegible.'} Please enter quantities manually.`, "error");
            setIsExtractingBill(false);
            return;
          }

          if (result && Array.isArray(result.extractedItems)) {
            const newReceipts = { ...partialReceipts };
            const newCosts = { ...receivedCosts };
            let matchedCount = 0;

            result.extractedItems.forEach((extracted: any) => {
              const foundIdx = receivingPo.items.findIndex(
                (item: any) => item.productName.toLowerCase() === extracted.productNameMatched.toLowerCase()
              );

              if (foundIdx !== -1) {
                const orderItem = receivingPo.items[foundIdx];
                const remToRec = orderItem.qty - (orderItem.receivedQty || 0);

                const parsedQty = Math.min(remToRec, Math.max(0, Number(extracted.receivedQuantity)));
                newReceipts[`${foundIdx}`] = parsedQty;
                newCosts[`${foundIdx}`] = Number(extracted.purchasePrice || 0);
                matchedCount++;
              }
            });

            setPartialReceipts(newReceipts);
            setReceivedCosts(newCosts);
            setExtractedInvoiceDetails(result);

            if (result.isTransientFailure) {
              showToast("AI Bill Scanner is busy under high demand, but your automated backup has successfully auto-filled your item lists!", "success");
            } else if (result.isOfflineDemo) {
              showToast("Demonstration Mode: Automatically parsed mock supplier bill items and pricing!", "success");
            } else {
              showToast(`AI extraction success: Matched ${matchedCount} lines from supplier digital bill!`, "success");
            }
          } else {
            showToast("Failed to parse matching lines. Please enter values manually.", "warning");
          }
        } catch (err: any) {
          console.error("Scan processing error:", err);
          showToast(`Digital Bill Error: ${err.message}`, "error");
        } finally {
          setIsExtractingBill(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Reader failed:", err);
      showToast("Failed to read file.", "error");
      setIsExtractingBill(false);
    }
  };

  const getMissingProductsInbound = () => {
    if (!receivingPo) return [];
    const list: any[] = [];
    receivingPo.items.forEach((item: any, idx: number) => {
      const inboundQty = Number(partialReceipts[`${idx}`] || 0);
      const prevRec = item.receivedQty || 0;
      const totalRec = prevRec + inboundQty;
      const rem = item.qty - totalRec;
      if (rem > 0 && !closedLines[`${idx}`]) {
        list.push({
          productName: item.productName,
          qty: item.qty,
          received: totalRec,
          remaining: rem,
          currentInbound: inboundQty
        });
      }
    });
    return list;
  };

  const getNonExistentProductsInbound = () => {
    if (!receivingPo) return [];
    const list: any[] = [];
    receivingPo.items.forEach((item: any, idx: number) => {
      const inboundQty = Number(partialReceipts[`${idx}`] || 0);
      if (inboundQty > 0) {
        // Only verify those items physically incoming
        const exists = inventory.some(i => 
          (item.productId && i.id === item.productId) || 
          (item.sku && i.sku?.toLowerCase() === item.sku?.toLowerCase()) || 
          (i.name.toLowerCase() === item.productName.toLowerCase())
        );
        if (!exists) {
          list.push({ ...item, idx });
        }
      }
    });
    return list;
  };

  const submitPartialReceiving = async () => {
    if (!receivingPo) return;

    // F. Duplicate Receive Protection (Pre-transaction check)
    const currentStatus = (receivingPo.status || 'pending').toLowerCase();
    if (currentStatus === 'received' || currentStatus === 'closed') {
      showToast("PO already received", "error");
      return;
    }

    // H. Validation: 
    // - PO exists: implicit since receivingPo is not null
    // - Supplier exists:
    if (!receivingPo.supplier || !receivingPo.supplier.trim()) {
      showToast("Supplier must exist on the Purchase Order.", "error");
      return;
    }

    // - Received quantity > 0:
    let inventoryUpdatedTotal = 0;
    receivingPo.items.forEach((item: any, idx: number) => {
      const inboundQty = Number(partialReceipts[`${idx}`] || 0);
      if (inboundQty > 0) {
        inventoryUpdatedTotal += inboundQty;
      }
    });

    if (inventoryUpdatedTotal <= 0) {
      showToast("Received quantity must be greater than 0.", "error");
      return;
    }

    // - Product exists & Inventory document exists:
    const nonExistent = getNonExistentProductsInbound();
    if (nonExistent.length > 0) {
      showToast(`Missing product inventory. Please add all products being received to your inventory first.`, "error");
      return;
    }

    setIsReceivingProgress(true);
    try {
      let atLeastOneInStock = false;
      let spentCapital = 0;
      let productsOrderedCount = receivingPo.items.length;
      let partiallyCount = 0;
      let notReceivedCount = 0;

      const missingList = getMissingProductsInbound();
      const hasDiscrepancy = missingList.length > 0;

      // Identify which items have inbound quantity > 0 and mapping to existing inventory
      const itemsToStockIn: {
        item: any;
        idx: number;
        inboundQty: number;
        verifiedCost: number;
        targetProd: any;
      }[] = [];

      const updatedLines = receivingPo.items.map((item: any, idx: number) => {
        const inboundQty = Number(partialReceipts[`${idx}`] || 0);
        let previousRec = item.receivedQty || 0;
        let newReceivedTotal = previousRec + inboundQty;
        const verifiedCost = Number(receivedCosts[`${idx}`] ?? item.cost);

        // Stock-in logic using actual received quantity only (Feature 6)
        if (inboundQty > 0) {
          atLeastOneInStock = true;
          const targetProd = inventory.find(i => 
            (item.productId && i.id === item.productId) || 
            (item.sku && i.sku?.toLowerCase() === item.sku?.toLowerCase()) || 
            (i.name.toLowerCase() === item.productName.toLowerCase())
          );
          if (targetProd) {
            itemsToStockIn.push({
              item,
              idx,
              inboundQty,
              verifiedCost,
              targetProd
            });
          }
          spentCapital += inboundQty * verifiedCost;
        }

        // Handle discrepancy closing options (Feature 8)
        let isLineClosed = newReceivedTotal >= item.qty;
        let currentQty = item.qty;
        if (hasDiscrepancy) {
          if (supplierDiscrepancyAction === 'cancel_remaining') {
            currentQty = newReceivedTotal; // Forcibly adjust qty to cancel remaining
            isLineClosed = true;
          }
        }

        if (newReceivedTotal === 0) {
          notReceivedCount++;
        } else if (newReceivedTotal < currentQty && !isLineClosed) {
          partiallyCount++;
        }

        return {
          ...item,
          qty: currentQty,
          cost: verifiedCost, // Persist verified purchase price in PO history
          receivedQty: newReceivedTotal
        };
      });

      if (spentCapital > 0 && isPaymentChecked) {
        await addTransaction({
          transactionType: 'business_expense',
          category: 'Purchase Order',
          amount: valueAfterInvoiceTax(spentCapital),
          source: 'Purchase Order',
          referenceId: receivingPo.id,
          notes: `Batch receiving for PO: ${receivingPo.id}`,
          transactionDate: new Date().toISOString().split('T')[0]
        });
      }

      // Sync and calculate new PO status
      const allLinesClosed = updatedLines.every((l: any) => (l.receivedQty || 0) >= l.qty);
      let newStatus = allLinesClosed ? 'received' : 'partially_received';
      
      const supplierFollowUpRequired = hasDiscrepancy && supplierDiscrepancyAction === 'supplier_follow_up';

      const finalPoUpdated = {
        ...receivingPo,
        items: updatedLines,
        status: newStatus,
        lastReceiptDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        supplierFollowUpRequired,
        supplierFollowUpReason: supplierFollowUpRequired ? `Products Missing From Delivery (${missingList.length} items missing)` : undefined
      };

      // Append code for Supplier History (Feature 10)
      const newSupplierHistoryEntry = {
        id: `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user ? user.uid : 'local_user',
        poId: receivingPo.id,
        date: new Date().toISOString(),
        supplier: receivingPo.supplier,
        productsCount: productsOrderedCount,
        receivedCount: inventoryUpdatedTotal,
        amount: spentCapital,
        taxAmount: Math.round(spentCapital * 0.18),
        totalOutflow: valueAfterInvoiceTax(spentCapital),
        status: newStatus,
        discrepancyAction: hasDiscrepancy ? supplierDiscrepancyAction : 'none'
      };

      // Append code for Product Purchase Records (Feature 10)
      const updatedPurchaseRecords = { ...productPurchaseRecords };
      receivingPo.items.forEach((item: any, idx: number) => {
        const inboundQty = Number(partialReceipts[`${idx}`] || 0);
        if (inboundQty > 0) {
          const key = item.productId || item.productName;
          if (!updatedPurchaseRecords[key]) {
            updatedPurchaseRecords[key] = [];
          }
          updatedPurchaseRecords[key].push({
            poId: receivingPo.id,
            date: new Date().toISOString(),
            supplier: receivingPo.supplier,
            quantity: inboundQty,
            cost: item.cost,
            total: inboundQty * item.cost
          });
        }
      });

      // Firestore Single Source of Truth Write via atomic transaction
      if (isCloudConnected && isOnline && user) {
        const poRef = doc(db, 'purchaseOrders', receivingPo.id);
        const shRef = doc(db, 'supplierHistory', newSupplierHistoryEntry.id);

        try {
          await runTransaction(db, async (transaction) => {
            // 1. Read current PO document directly from Firestore
            const poSnap = await transaction.get(poRef);
            if (!poSnap.exists()) {
              throw new Error("Purchase Order document does not exist in database");
            }
            const poData = poSnap.data();

            // 2. Duplicate receive protection (Inside-transaction check)
            const dbStatus = (poData.status || 'pending').toLowerCase();
            if (dbStatus === 'received' || dbStatus === 'closed') {
              throw new Error("PO already received");
            }

            // 3. Validation: Supplier exists
            if (!poData.supplier || !poData.supplier.trim()) {
              throw new Error("Supplier must exist on the Purchase Order");
            }

            // A. Fetch current inventory stock directly from Firestore to prevent stale local states
            const resolvedItems = [];
            for (const stockItem of itemsToStockIn) {
              const prodRef = doc(db, 'inventory', stockItem.targetProd.id);
              const prodSnap = await transaction.get(prodRef);

              // Validation: Inventory document exists / Product exists
              if (!prodSnap.exists()) {
                throw new Error(`Inventory document for product '${stockItem.item.productName}' (ID: ${stockItem.targetProd.id}) does not exist in database`);
              }

              resolvedItems.push({
                ...stockItem,
                prodRef,
                prodSnap
              });
            }

            // B. Perform atomic updates for stock documents
            for (const ri of resolvedItems) {
              const currentData = ri.prodSnap.data();
              const oldStock = currentData ? Number(currentData.stock || 0) : 0;
              const newStock = oldStock + ri.inboundQty;

              // Logging: Old stock, Received quantity, New stock, Firestore update result
              console.log(`[PO Receive Sync] Updating product ${ri.targetProd.id} (${ri.targetProd.name}) in transaction:
  - Old stock (from Firestore): ${oldStock}
  - Received quantity: ${ri.inboundQty}
  - New stock: ${newStock}`);

              transaction.update(ri.prodRef, {
                stock: newStock,
                purchasePrice: ri.verifiedCost,
                lastUpdatedBy: user.uid,
                lastUpdatedAt: serverTimestamp()
              });

              // D. Create movement record atomically inside transaction
              const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const movementRef = doc(db, 'stockMovements', movementId);
              const movementObj = {
                id: movementId,
                userId: user.uid,
                productId: ri.targetProd.id,
                productName: currentData?.name || ri.targetProd.name,
                date: new Date().toISOString(),
                type: 'purchase_receive', // exact requested "type" for requirement D
                poId: receivingPo.id,     // exact requested poId
                quantity: ri.inboundQty,  // exact received quantity
                previousStock: oldStock,  // exact previous stock
                newStock,                 // exact new stock
                createdAt: serverTimestamp(), // exact serverTimestamp
                
                // Existing fields for backward compatibility
                reason: `Received PO: ${receivingPo.id} Delivery`,
                referenceId: receivingPo.id,
                sku: currentData?.sku || ri.targetProd.sku || '',
                actionType: 'Stock Adjustment'
              };
              transaction.set(movementRef, cleanUndefined(movementObj));
            }

            // C. Update the PO document in transaction with audit fields
            const finalPoUpdatedCloud = {
              ...finalPoUpdated,
              status: newStatus,
              receivedAt: serverTimestamp(),
              receivedBy: user.uid,
              receivedQuantity: updatedLines.reduce((acc: number, l: any) => acc + (l.receivedQty || 0), 0),
              lastUpdatedBy: user.uid,
              lastUpdatedAt: serverTimestamp()
            };

            // Remove duplicate fields to keep only one single source of truth status field
            delete (finalPoUpdatedCloud as any).closed;
            delete (finalPoUpdatedCloud as any).isClosed;
            delete (finalPoUpdatedCloud as any).received;
            delete (finalPoUpdatedCloud as any).isReceived;
            delete (finalPoUpdatedCloud as any).completed;

            transaction.set(poRef, cleanUndefined(finalPoUpdatedCloud), { merge: true });

            // D. Set supplierHistory entry
            transaction.set(shRef, cleanUndefined(newSupplierHistoryEntry));
          });

          // Logging: Firestore update result
          console.log(`[PO Receive Sync Result] Successfully committed PO ${receivingPo.id} and inventory updates atomically to Firestore with status ${newStatus}.`);
        } catch (error: any) {
          const errorCode = error?.code || 'unknown';
          const errorMessage = error?.message || String(error);

          console.error(`[PO Receive Sync Failed] Detailed Firebase Transaction Error Log:
  - Collection Path: purchaseOrders, supplierHistory, stockMovements, inventory
  - Document IDs involved:
      * PO: ${receivingPo.id}
      * Supplier History: ${newSupplierHistoryEntry.id}
      * Stock items updated: ${itemsToStockIn.map(ri => ri.targetProd.id).join(', ')}
  - Firebase Error Code: ${errorCode}
  - Firebase Error Message: ${errorMessage}
  - Transaction Status: failed_rolled_back`);

          throw new Error(`Atomic write failed: [${errorCode}] ${errorMessage}`);
        }
      } else {
        // Local-only offline fallback
        itemsToStockIn.forEach(ri => {
          adjustStock(
            ri.targetProd.id,
            ri.inboundQty,
            `Received PO: ${receivingPo.id} Delivery`,
            'IN',
            receivingPo.id,
            'Stock Adjustment'
          );
          updateProduct(ri.targetProd.id, { purchasePrice: ri.verifiedCost });
        });

        const finalPoUpdatedLocal = {
          ...finalPoUpdated,
          status: newStatus,
          receivedAt: new Date().toISOString(),
          receivedBy: 'local_user',
          receivedQuantity: updatedLines.reduce((acc: number, l: any) => acc + (l.receivedQty || 0), 0)
        };

        // Remove duplicate fields to keep only one single source of truth status field
        delete (finalPoUpdatedLocal as any).closed;
        delete (finalPoUpdatedLocal as any).isClosed;
        delete (finalPoUpdatedLocal as any).received;
        delete (finalPoUpdatedLocal as any).isReceived;
        delete (finalPoUpdatedLocal as any).completed;

        console.log(`[PO Status Update (Local)] Successfully received PO ${finalPoUpdated.id} locally with status ${finalPoUpdated.status}.`);
        setPendingOrders(prev => prev.map(p => p.id === receivingPo.id ? finalPoUpdatedLocal : p));
      }

      // Update remaining transient UI states ONLY after Firestore success
      setSupplierHistory(prev => [newSupplierHistoryEntry, ...prev]);
      setProductPurchaseRecords(updatedPurchaseRecords);

      // Calculate and save metrics to show the Delivery Summary dialog (Feature 9)
      setSummaryDataPopup({
        poId: receivingPo.id,
        productsOrderedCount,
        productsReceivedCount: updatedLines.filter((l: any) => l.receivedQty > 0).length,
        partiallyCount,
        notReceivedCount,
        inventoryUpdatedItems: inventoryUpdatedTotal,
        discrepancyAction: hasDiscrepancy ? supplierDiscrepancyAction : 'none'
      });

      // Clear receiving target
      setReceivingPo(null);
      showToast(atLeastOneInStock 
        ? `Receiving complete! Stock adjusted and ledger logs documented.` 
        : `Lifecycle state updated.`, "success");

    } catch (e: any) {
      console.error("Conflict or save error during receiving:", e);
      showToast(`Conflict occurred: ${e.message}`, "error");
    } finally {
      setIsReceivingProgress(false);
    }
  };

  const inboxQtyIsFull = (item: any, currentInput: number) => {
    return (item.receivedQty || 0) + currentInput >= item.qty;
  };

  const valueAfterInvoiceTax = (spentSum: number) => {
    return Math.round(spentSum * 1.18) + 250; // Add standard tax and logistical ratio
  };

  const advancePOStatus = async (poId: string, nextStatus: string) => {
    const normalizedStatus = nextStatus.toLowerCase();
    const po = pendingOrders.find(p => p.id === poId);
    if (!po) return;

    const updatedPo = {
      ...po,
      status: normalizedStatus,
      updatedAt: new Date().toISOString()
    };

    if (isCloudConnected && isOnline && user) {
      try {
        await setDoc(doc(db, 'purchaseOrders', poId), cleanUndefined(updatedPo), { merge: true });
        console.log(`[PO Status Update] Successfully advanced PO ${poId} status to ${normalizedStatus} in Firestore.`);
        showToast(`Order status updated to ${normalizedStatus}.`, "success");
      } catch (error: any) {
        console.error("Firestore PO Status Update Error:", error);
        showToast(`Failed to update status in cloud: ${error.message || error}`, "error");
      }
    } else {
      setPendingOrders(prev => prev.map(p => p.id === poId ? updatedPo : p));
      console.log(`[PO Status Update (Local)] Advanced PO ${poId} status to ${normalizedStatus} locally.`);
      showToast(`Order status updated to ${normalizedStatus} (Local).`, "success");
    }
  };

  // WhatsApp message build link
  const triggerWhatsAppDispatch = (po: any) => {
    const itemsText = po.items.map((i: any) => `- *${i.productName}*: ${i.qty - (i.receivedQty || 0)} Units x ₹${i.cost}`).join('%0A');
    let msg = `*VYAPAR MITRA PROCUREMENT ORDER*%0A%0A*PO Number*: ${po.id}%0A*Supplier*: ${po.supplier}%0A*Date*: ${new Date(po.date || po.createdDate || Date.now()).toLocaleDateString()}%0A%0A*Pending Lines to Fulfil*:%0A${itemsText}%0A%0A*Estimated Invoice Total*: ₹${formatNum(po.totalAmount || 0)}`;

    if (po.purchaseNotes) msg += `%0A%0A*Purchase Notes*: ${po.purchaseNotes}`;
    if (po.deliveryInstructions) msg += `%0A*Delivery Instructions*: ${po.deliveryInstructions}`;
    if (po.supplierInstructions) msg += `%0A*Supplier Instructions*: ${po.supplierInstructions}`;

    msg += `%0A%0APlease arrange immediate dispatch and confirm dispatch date.`;
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const localGeneratePO_PDF = (po: any) => {
    generatePO_PDF({
      po,
      inventory,
      formatNum,
      showToast,
      profile
    });
  };

  const deletePOAction = (poId: string) => {
    setConfirmDialog({
      isOpen: true,
      message: "WARNING: This Purchase Order (PO) will be permanently deleted and cannot be recovered back. Do you want to proceed and delete it completely?",
      onConfirm: () => {
        if (isCloudConnected && isOnline && user) {
          deleteDoc(doc(db, 'purchaseOrders', poId)).then(() => {
            console.log("Deleted PO from firestore successfully");
            setSelectedPoIds(prev => prev.filter(id => id !== poId));
            showToast("Purchase Order permanently deleted completely from app.", "success");
          }).catch((e) => {
            console.error("Firebase delete error:", e);
            showToast("Failed to delete from cloud: " + e.message, "error");
          });
        } else {
          setPendingOrders(prev => prev.filter(p => p.id !== poId));
          setSelectedPoIds(prev => prev.filter(id => id !== poId));
          showToast("Purchase Order permanently deleted completely from app (Local).", "success");
        }
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteSelectedPOsAction = () => {
    if (selectedPoIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      message: `WARNING: The ${selectedPoIds.length} selected Purchase Order (PO)s will be permanently deleted and cannot be recovered back. Do you want to proceed and completely delete them?`,
      onConfirm: () => {
        if (isCloudConnected && isOnline && user) {
          Promise.all(selectedPoIds.map(id => deleteDoc(doc(db, 'purchaseOrders', id)))).then(() => {
            showToast(`${selectedPoIds.length} PO(s) permanently deleted completely from app.`, "success");
            setSelectedPoIds([]);
          }).catch(e => {
             console.error("Firebase bulk delete error:", e);
             showToast("Failed to delete from cloud: " + e.message, "error");
          });
        } else {
          setPendingOrders(prev => prev.filter(p => !selectedPoIds.includes(p.id)));
          showToast(`${selectedPoIds.length} PO(s) permanently deleted completely from app (Local).`, "success");
          setSelectedPoIds([]);
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditPO = (po: any) => {
    setPoDraftItems(po.items || []);
    setDraftSupplier(po.supplier || '');
    setPurchaseNotes(po.purchaseNotes || '');
    setDeliveryInstructions(po.deliveryInstructions || '');
    setSupplierInstructions(po.supplierInstructions || '');
    setReEditingPoId(po.id);
    setIsDuplicateReviewing(false);
    setActiveTab('new_order');
    showToast(`Draft populated for editing Purchase Order ${po.id}. Change terms and complete updates to apply.`, "info");
  };

  const onUpdatePONote = (poId: string, noteText: string) => {
    let targetPo: any = null;
    const updatedPending = pendingOrders.map(p => {
      if (p.id === poId) {
        const u = { ...p, purchaseNotes: noteText, updatedAt: new Date().toISOString() };
        targetPo = u;
        return u;
      }
      return p;
    });

    if (targetPo && isCloudConnected && isOnline && user) {
      setDoc(doc(db, 'purchaseOrders', poId), cleanUndefined(targetPo), { merge: true }).then(() => {
        console.log(`Updated PO note for ${poId} in cloud`);
        showToast("PO guidelines updated successfully.", "success");
      }).catch((e) => {
        console.error("Firebase update note error:", e);
        showToast("Failed to update note in cloud: " + e.message, "error");
      });
    } else if (targetPo) {
      setPendingOrders(updatedPending);
      showToast("PO guidelines updated successfully (Local).", "success");
    }
  };

  // Priority filter lists
  const filteredRecommendations = useMemo(() => {
    let result = [...smartAnalysis.recommendations];

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      result = result.filter(r => 
        r.product.name.toLowerCase().includes(q) || 
        r.preferredSupplier.toLowerCase().includes(q)
      );
    }

    if (filterSupplier !== 'ALL') {
      result = result.filter(r => r.preferredSupplier === filterSupplier);
    }

    if (filterCategory !== 'ALL') {
      result = result.filter(r => r.product.category === filterCategory);
    }

    if (filterPriority !== 'ALL') {
      if (filterPriority === 'HIGH') result = result.filter(r => r.isCritical);
      if (filterPriority === 'MEDIUM') result = result.filter(r => r.isWarning && r.longevity <= 10);
      if (filterPriority === 'LOW') result = result.filter(r => r.isWarning && r.longevity > 10);
    }

    // Sort priority matrix
    return result.sort((a, b) => {
      if (prioritySortBy === 'REVENUE') {
        return (b.revenueRisk || 0) - (a.revenueRisk || 0);
      }
      if (prioritySortBy === 'STOCKOUT') {
        const daysA = a.longevity === '∞' ? 999 : Number(a.longevity);
        const daysB = b.longevity === '∞' ? 999 : Number(b.longevity);
        return daysA - daysB;
      }
      // Risk default
      const weightA = a.isCritical ? 3 : a.longevity <= 10 ? 2 : 1;
      const weightB = b.isCritical ? 3 : b.longevity <= 10 ? 2 : 1;
      return weightB - weightA;
    });
  }, [smartAnalysis.recommendations, globalSearch, filterSupplier, filterCategory, filterPriority, prioritySortBy]);

  // Filter pending PO outputs
  const filteredPendingPOs = useMemo(() => {
    let result = [...pendingOrders];

    // Archive cleanup system (Feature 3 & 9)
    // Archive completed purchase orders after 180 days
    const isPoArchived = (po: any) => {
      const days = (Date.now() - new Date(po.date).getTime()) / (1000 * 60 * 60 * 24);
      const isCompleted = po.status === 'received' || po.status === 'closed';
      // Feature 3: Archive completed POs after 180 days. 
      // Feature 9: Keep Workspace Cleanliness Engine active
      return isCompleted && days > 180;
    };

    if (!showArchivedPOs) {
      result = result.filter(po => !isPoArchived(po));
    }

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      result = result.filter(po => 
        po.id.toLowerCase().includes(q) || 
        po.supplier.toLowerCase().includes(q) ||
        po.items.some((i: any) => i.productName.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== 'ALL') {
      result = result.filter(po => {
        const poS = (po.status || '').toLowerCase().trim();
        const filtS = filterStatus.toLowerCase().trim();
        return poS === filtS;
      });
    }

    if (poSortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (poSortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (poSortBy === 'supplier-asc') {
      result.sort((a, b) => (a.supplier || '').localeCompare(b.supplier || ''));
    } else if (poSortBy === 'supplier-desc') {
      result.sort((a, b) => (b.supplier || '').localeCompare(a.supplier || ''));
    }

    return result;
  }, [pendingOrders, globalSearch, filterStatus, showArchivedPOs, poSortBy]);

  // Categories list options
  const catalogCategories = useMemo(() => {
    const list = new Set<string>();
    inventory.forEach(i => { if (i.category) list.add(i.category); });
    return Array.from(list);
  }, [inventory]);

  // Active supplier tags array
  const catalogSuppliers = useMemo(() => {
    const list = new Set<string>();
    inventory.forEach(i => { if (i.supplierName) list.add(i.supplierName); });
    Object.values(supplierOverrides).forEach(name => { if (name) list.add(name); });
    return Array.from(list);
  }, [inventory, supplierOverrides]);

  if (previewDraft || previewingPo) {
    const isDraft = !!previewDraft;
    const po = previewDraft || previewingPo;
    const safeItems = po?.items || [];
    const estCost = safeItems.reduce((sum: number, it: any) => sum + ((it.qty || 0) * (it.cost || 0)), 0);
    const totalQty = safeItems.reduce((sum: number, it: any) => sum + (it.qty || 0), 0);

    return (
      <div className="space-y-6 w-full font-sans animate-fade-in text-left pb-16">
        {/* Top Header / Back Bar */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl mb-8">
          <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (isDraft) setPreviewDraft(null);
                  else setPreviewingPo(null);
                }}
                className="group flex items-center justify-center w-12 h-12 rounded-xl border border-indigo-400/20 bg-indigo-500/10 hover:bg-white text-indigo-300 hover:text-slate-900 shadow-lg cursor-pointer transition-all duration-300"
                title="Go Back"
              >
                <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
              </button>
              <div>
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider block ${isDraft ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                    {isDraft ? 'Draft Proposal' : 'Official Purchase Order'}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">• {po.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Document Studio Room
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => generatePO_PDF({ po, inventory, formatNum, showToast, profile })}
                className="px-4 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 border border-emerald-400/20"
              >
                <Download className="w-4 h-4" /> Download PDF File
              </button>

              {isDraft && (
                <>
                  <button
                    onClick={() => {
                      resumeDraftAction(po);
                      setPreviewDraft(null);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Pencil className="w-4 h-4" /> Edit Draft
                  </button>

                  <button
                    onClick={() => {
                      generatePoFromDraftAction(po);
                      setPreviewDraft(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-600" /> Receive
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  if (isDraft) setPreviewDraft(null);
                  else setPreviewingPo(null);
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-black uppercase transition-all cursor-pointer active:scale-95"
              >
                Exit Studio
              </button>
            </div>
          </div>
        </div>

        {/* Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Metadata Sidebar Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[20px] pointer-events-none" />
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Document Details</h3>
              <div className="space-y-4 text-sm text-left">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Supplier Partner</span>
                  <span className="font-extrabold text-slate-200 text-base block text-left">{po.supplier || 'General Vendor'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Est Net Cost</span>
                  <span className="font-black text-white text-xl block text-left">₹{formatNum(estCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Line Item Count</span>
                  <span className="font-extrabold text-indigo-300 block text-left">{po.items?.length || 0} unique lines</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Total Qty Order Size</span>
                  <span className="font-extrabold text-emerald-400 block text-left">{totalQty} units</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block text-left">Created / Last Edited</span>
                  <span className="font-mono text-xs text-slate-400 block text-left">
                    {po.updatedAt ? new Date(po.updatedAt).toLocaleString() : po.date ? new Date(po.date).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Sheet Render Area */}
          <div className="lg:col-span-3 bg-slate-50 border border-slate-200/80 rounded-[2rem] p-4 sm:p-8 flex items-start justify-center overflow-x-auto min-h-[700px] shadow-inner relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-t-[2rem]" />
            <PurchaseOrderA4Preview po={po} profile={profile} inventory={inventory} formatNum={formatNum} />
          </div>
        </div>
      </div>
    );
  }

  if (receivingPo !== null) {
    return (
      <div className="space-y-6 lg:space-y-8 animate-fade-in pb-24 text-left w-full min-w-0 font-sans select-none">
        
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setReceivingPo(null)} className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Receive Order</span>
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-3">
                PO: {receivingPo.id}
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  {receivingPo.status || 'GENERATED'}
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPreviewingPo(receivingPo)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold tracking-wider transition-colors cursor-pointer">
              <FileText className="w-4 h-4" /> Preview PO
            </button>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight block">Supplier Name</span>
              <span className="text-xs font-bold text-slate-800 block truncate" title={receivingPo.supplier}>{receivingPo.supplier}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight block">Order Date</span>
              <span className="text-xs font-bold text-slate-800 block">{new Date(receivingPo.date).toLocaleDateString()}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight block">Expected Date</span>
              <span className="text-xs font-bold text-slate-800 block">
                {new Date(new Date(receivingPo.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight block">Total Items</span>
              <span className="text-xs font-bold text-slate-800 block">{receivingPo.items.reduce((s: number, i: any) => s + i.qty, 0)}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight block">Expected Total Amount</span>
              <span className="text-xs font-bold text-slate-800 block">₹{formatNum(receivingPo.items.reduce((s: number, i: any) => s + (i.qty * i.cost), 0))}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-tight block">Amount for Current Receipt</span>
              <span className="text-sm font-black text-indigo-900 block tracking-tight">
                ₹{formatNum(receivingPo.items.reduce((s: number, i: any, idx: number) => {
                  const recQty = partialReceipts[`${idx}`] ?? 0;
                  const price = receivedCosts[`${idx}`] ?? i.cost ?? 0;
                  return s + (recQty * price);
                }, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* AI SUPPLIER BILL ANALYZER */}
        <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/65 border border-indigo-100/90 rounded-3xl p-6 sm:p-8 text-left space-y-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
              </span>
              <div>
                <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">AI Bill Scanner</h4>
                <p className="text-[11px] text-indigo-650 font-bold uppercase tracking-wider lg:pr-24 max-w-2xl mt-1">Scan your supplier's invoice to instantly fill received quantities & calculate prices from the document automatically!</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-900 text-indigo-300 font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-center shrink-0">Automated Intake Match</span>
          </div>

          {isExtractingBill ? (
            <div className="bg-white border border-slate-150 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 shadow-3xs">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <span className="text-sm font-black text-slate-950 uppercase tracking-widest block">Scanning Invoice Document...</span>
                <p className="text-[11px] text-slate-450 font-bold uppercase max-w-sm mx-auto">AI is analyzing items, deciphering item counts and verifying invoice totals...</p>
              </div>
            </div>
          ) : (
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverBill(true);
               }}
              onDragLeave={() => setIsDragOverBill(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverBill(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleSupplierBillUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 transition-all cursor-pointer bg-white group select-none ${
                isDragOverBill 
                  ? 'border-indigo-500 bg-indigo-50/45 scale-[0.99] shadow-inner' 
                  : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/15'
              }`}
              onClick={() => {
                const fileInput = document.getElementById('supplier-bill-picker');
                fileInput?.click();
              }}
            >
              <input 
                type="file" 
                id="supplier-bill-picker" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleSupplierBillUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="bg-slate-50 p-4 rounded-full border border-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-800 block">
                  {billFileName ? `Selected File: ${billFileName}` : "Drag & Drop or Tap to Upload Supplier Invoice / Dispatch Note"}
                </span>
                <p className="text-[11px] text-slate-405 uppercase mt-2 font-bold tracking-wider">
                  Supports JPEGs, PNG receipts, or full PDF document scans. Max 12MB.
                </p>
              </div>
            </div>
          )}

          {/* Extracted invoice metadata badge details */}
          {extractedInvoiceDetails && (
            <div className="bg-emerald-50/60 border border-emerald-500/20 rounded-2xl p-6 space-y-5 mt-4">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 font-extrabold" /> Supplier Bill Processed Successfully
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Scan Inv #</span>
                  <span className="text-sm font-black text-slate-800 block">{extractedInvoiceDetails.invoiceDetails?.invoiceNumber || 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Billing Date</span>
                  <span className="text-sm font-black text-slate-800 block">{extractedInvoiceDetails.invoiceDetails?.invoiceDate || 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Extracted Supplier</span>
                  <span className="text-sm font-black text-slate-900 truncate block">{extractedInvoiceDetails.invoiceDetails?.supplierName || 'N/A'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total Billed Amt</span>
                  <span className="text-base font-extrabold text-indigo-700 block">₹{formatNum(extractedInvoiceDetails.invoiceDetails?.totalAmount || 0)}</span>
                </div>
              </div>

              {extractedInvoiceDetails.generalDiscrepancy && (
                <div className="bg-emerald-100/50 border border-emerald-200 px-4 py-3 rounded-xl text-xs text-emerald-800 font-bold leading-relaxed flex gap-2.5 items-start mt-2">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{extractedInvoiceDetails.generalDiscrepancy}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="p-6 border-b border-slate-200/80 bg-slate-50/50">
             <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest text-left">Products Receiving Check</h4>
          </div>
          <div className="p-6 space-y-4">
            {receivingPo.items.map((item: any, idx: number) => {
              const alreadyCounted = item.receivedQty || 0;
              const remainingToRec = item.qty - alreadyCounted;
              const inboxKey = `${idx}`;
              const newPrice = receivedCosts[inboxKey] ?? item.cost ?? 0;
              const recQty = partialReceipts[inboxKey] ?? 0;
              const isClosed = closedLines[inboxKey] || false;
              const overallStatus = alreadyCounted >= item.qty ? 'RECEIVED' : (alreadyCounted + recQty > 0 || isClosed ? 'PARTIAL/CLOSED' : 'PENDING');
              
              const itemExists = inventory.some(i => 
                (item.productId && i.id === item.productId) || 
                (item.sku && i.sku?.toLowerCase() === item.sku?.toLowerCase()) || 
                (i.name.toLowerCase() === item.productName.toLowerCase())
              );

              return (
                <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-5 text-left shadow-sm">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm truncate" title={item.productName}>{item.productName}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 flex items-center ${overallStatus === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{overallStatus}</span>
                      {!itemExists && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded shrink-0 flex items-center shadow-2xs">Pending Setup</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Ordered Qty: <span className="text-slate-800">{item.qty}</span></span>
                      <span>•</span>
                      <span>Est Price: <span className="text-slate-800">₹{formatNum(item.cost || 0)}</span></span>
                      <span>•</span>
                      <span>Already Received: <span className="text-slate-800">{alreadyCounted}</span></span>
                      <span>•</span>
                      <span className="text-indigo-600">Left to Receive: <span className="text-indigo-800">{remainingToRec}</span></span>
                    </div>
                  </div>

                  {!itemExists ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-rose-50/70 border border-rose-100 p-3 sm:p-4 rounded-2xl shrink-0 w-full xl:w-auto">
                      <div className="text-left flex-1 min-w-[120px]">
                        <span className="block text-[10px] text-rose-800 font-black uppercase tracking-wider">Setup Required</span>
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Product not in master inventory</p>
                      </div>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('pendingNewInboundProduct', JSON.stringify({
                            productName: item.productName || '',
                            category: 'General',
                            qty: item.qty || 0,
                            cost: item.cost || 0,
                            supplierName: receivingPo.supplier || ''
                          }));
                          sessionStorage.setItem('returnToPurchasesAfterAdd', JSON.stringify({ poId: receivingPo.id }));
                          window.dispatchEvent(new CustomEvent('navigate', { detail: '/inventory' }));
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 hover:shadow-md active:scale-95 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Profile
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4 shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-full xl:w-auto">
                      <div className="space-y-1.5 text-right flex-1 min-w-[100px]">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider p-0 m-0">New Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPrice}
                          onChange={(e) => {
                            const costNum = Math.max(0, Number(e.target.value));
                            setReceivedCosts(prev => ({ ...prev, [inboxKey]: costNum }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1.5 text-right flex-1 min-w-[100px]">
                        <label className="block text-[10px] text-indigo-600 font-bold uppercase tracking-wider p-0 m-0">Recv Qty</label>
                        <input
                          type="number"
                          min="0"
                          max={remainingToRec}
                          value={recQty}
                          onChange={(e) => {
                            const n = Math.min(remainingToRec, Math.max(0, Number(e.target.value)));
                            setPartialReceipts(prev => ({ ...prev, [inboxKey]: n }));
                          }}
                          className="w-full px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-black text-indigo-900 text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-5 pl-2">
                        <input
                          type="checkbox"
                          id={`close-${idx}`}
                          checked={isClosed}
                          onChange={(e) => {
                            setClosedLines(prev => ({ ...prev, [inboxKey]: e.target.checked }));
                          }}
                          className="w-6 h-6 rounded text-rose-500 border-slate-300 focus:ring-rose-500 cursor-pointer"
                        />
                        <label htmlFor={`close-${idx}`} className="text-[11px] text-slate-500 font-bold uppercase select-none cursor-pointer">
                          Missing
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Receipt Summary Grid/Bar */}
          <div className="m-6 bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block text-left">Receipt Summary Total</span>
              <span className="text-xl font-black text-indigo-950 text-left block">
                ₹{formatNum(receivingPo.items.reduce((s: number, i: any, idx: number) => {
                  const recQty = partialReceipts[`${idx}`] ?? 0;
                  const price = receivedCosts[`${idx}`] ?? i.cost ?? 0;
                  return s + ((i.receivedQty || 0) * price + recQty * price);
                }, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Missing Inventory Products (In PO but not in Inventory) */}
        {getNonExistentProductsInbound().length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 space-y-5 text-left">
            <div className="flex items-start gap-4">
              <span className="bg-rose-100 p-2.5 rounded-xl border border-rose-200 text-rose-600 shrink-0">
                 <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h4 className="font-extrabold text-rose-900 text-sm">Action Required: Products Not in Inventory</h4>
                <p className="text-xs text-rose-700 leading-relaxed font-semibold mt-1 max-w-2xl">
                  The following ordered items do not exist in your master inventory. You must create profiles for them before you can receive this stock.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {getNonExistentProductsInbound().map((item: any, uIdx: number) => {
                return (
                  <div key={`nonexist-${uIdx}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white rounded-2xl border border-rose-200 shadow-sm">
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-slate-900 truncate block text-left" title={item.productName}>{item.productName}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded shadow-2xs">Pending Setup</span>
                      </div>
                      <div className="text-[11px] block text-slate-500 font-bold uppercase text-left mt-1.5 tracking-wider">
                        Expected Cost: <span className="text-slate-800">₹{item.cost || 0}</span> • Qty: <span className="text-slate-800">{item.qty || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('pendingNewInboundProduct', JSON.stringify({
                          productName: item.productName || '',
                          category: 'General',
                          qty: item.qty || 0,
                          cost: item.cost || 0,
                          supplierName: receivingPo.supplier || ''
                        }));
                        sessionStorage.setItem('returnToPurchasesAfterAdd', JSON.stringify({ poId: receivingPo.id }));
                        window.dispatchEvent(new CustomEvent('navigate', { detail: '/inventory' }));
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold uppercase tracking-wide text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Profile &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra Products on Bill (Not in PO or Inventory) */}
        {extractedInvoiceDetails?.unmatchedProducts?.length > 0 && (
          <div className="bg-sky-50 border border-sky-200 rounded-3xl p-6 sm:p-8 space-y-5 text-left">
            <div className="flex items-start gap-4">
              <span className="bg-sky-100 p-2.5 rounded-xl border border-sky-200 text-sky-600 shrink-0">
                 <Sparkles className="w-6 h-6" />
              </span>
              <div>
                <h4 className="font-extrabold text-sky-900 text-sm">New Products Detected on Bill (Not in Inventory)</h4>
                <p className="text-xs text-sky-700 leading-relaxed font-semibold mt-1 max-w-2xl">
                  These extra products were found on the supplier bill. To check them into stock, you must first register them in the master inventory catalog.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {extractedInvoiceDetails.unmatchedProducts.map((item: any, uIdx: number) => {
                return (
                  <div key={`extra-${uIdx}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white rounded-2xl border border-sky-200 shadow-sm">
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-slate-900 truncate block text-left" title={item.productName}>{item.productName}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded shadow-2xs">New Product</span>
                      </div>
                      <div className="text-[11px] block text-slate-500 font-bold uppercase text-left mt-1.5 tracking-wider">
                        Billed Price: <span className="text-slate-800">₹{item.purchasePrice || 0}</span> • Qty: <span className="text-slate-800">{item.receivedQuantity || 0}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('pendingNewInboundProduct', JSON.stringify({
                          productName: item.productName || '',
                          category: 'General',
                          qty: item.receivedQuantity || 0,
                          cost: item.purchasePrice || 0,
                          supplierName: receivingPo.supplier || ''
                        }));
                        sessionStorage.setItem('returnToPurchasesAfterAdd', JSON.stringify({ poId: receivingPo.id }));
                        window.dispatchEvent(new CustomEvent('navigate', { detail: '/inventory' }));
                      }}
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white font-extrabold uppercase tracking-wide text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4" /> Add Profile &rarr;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Feature 3: Discrepancy Action operations */}
        {getMissingProductsInbound().length > 0 && (
          <div className="bg-amber-50 border border-amber-200/60 rounded-3xl p-6 sm:p-8 space-y-5 text-left">
            <div className="flex items-start gap-4">
              <span className="bg-amber-100 p-2.5 rounded-xl border border-amber-200 text-amber-600 shrink-0">
                 <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h4 className="font-extrabold text-amber-900 text-sm text-left uppercase tracking-wider">Undelivered Items Detected</h4>
                <p className="text-xs text-amber-800 leading-relaxed font-semibold text-left max-w-2xl mt-1">
                  Some products have delivered quantities less than ordered (missing). Manage the outstanding balances:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <label className={`p-5 border rounded-2xl flex items-start gap-4 cursor-pointer select-none transition-all ${supplierDiscrepancyAction === 'keep_pending' ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400/30' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                <input
                  type="radio"
                  name="supplierDiscrepancyActionRadio"
                  value="keep_pending"
                  checked={supplierDiscrepancyAction === 'keep_pending'}
                  onChange={() => setSupplierDiscrepancyAction('keep_pending')}
                  className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer w-5 h-5"
                />
                <span className="space-y-1 block">
                  <span className="font-extrabold text-sm block text-slate-900 pointer-events-none">Keep Pending</span>
                  <span className="text-[11px] text-slate-500 block leading-tight pointer-events-none font-medium">Keep item active for subsequent partial shipments.</span>
                </span>
              </label>

              <label className={`p-5 border rounded-2xl flex items-start gap-4 cursor-pointer select-none transition-all ${supplierDiscrepancyAction === 'cancel_remaining' ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400/30' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                <input
                  type="radio"
                  name="supplierDiscrepancyActionRadio"
                  value="cancel_remaining"
                  checked={supplierDiscrepancyAction === 'cancel_remaining'}
                  onChange={() => setSupplierDiscrepancyAction('cancel_remaining')}
                  className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer w-5 h-5"
                />
                <span className="space-y-1 block">
                  <span className="font-extrabold text-sm block text-slate-900 pointer-events-none">Cancel Remaining</span>
                  <span className="text-[11px] text-slate-500 block leading-tight pointer-events-none font-medium">Close items forcibly and forgive unfulfilled portions.</span>
                </span>
              </label>

              <label className={`p-5 border rounded-2xl flex items-start gap-4 cursor-pointer select-none transition-all ${supplierDiscrepancyAction === 'supplier_follow_up' ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400/30' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                <input
                  type="radio"
                  name="supplierDiscrepancyActionRadio"
                  value="supplier_follow_up"
                  checked={supplierDiscrepancyAction === 'supplier_follow_up'}
                  onChange={() => setSupplierDiscrepancyAction('supplier_follow_up')}
                  className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer w-5 h-5"
                />
                <span className="space-y-1 block">
                  <span className="font-extrabold text-sm block text-slate-900 pointer-events-none">Supplier Follow-Up</span>
                  <span className="text-[11px] text-slate-500 block leading-tight pointer-events-none font-medium">Flag dispute status and coordinate debit memos.</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 md:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-5">
          <label className="flex items-center gap-3 cursor-pointer group select-none self-start sm:self-auto px-2 py-1">
            <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isPaymentChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
              {isPaymentChecked && <Check className="w-4 h-4 text-white stroke-[3]" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={isPaymentChecked}
              onChange={(e) => setIsPaymentChecked(e.target.checked)}
            />
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Mark as Paid</span>
          </label>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setReceivingPo(null)}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer font-extrabold uppercase text-xs tracking-wider"
            >
              Discard Edits
            </button>
            <button
              onClick={submitPartialReceiving}
              disabled={isReceivingProgress || getNonExistentProductsInbound().length > 0}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-slate-900/10 cursor-pointer transition-all flex items-center justify-center gap-2.5 font-extrabold uppercase text-xs tracking-wider"
            >
              {isReceivingProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              <span>Receive Checked Items</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in pb-24 text-left w-full min-w-0 font-sans select-none">
      
      {activeTab === 'dashboard' && (
        <>
          {/* HEADER HERO AREA */}
          <div id="vmitra-procurement-header" className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 rounded-3xl border border-indigo-500/30 shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)] mb-8 animate-fade-in group hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.6)] transition-all duration-500">
            <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-400/30 transition-all duration-700 animate-pulse" />
            <div className="absolute left-1/4 -bottom-20 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-teal-400/20 transition-all duration-700 animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none opacity-50" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10.5px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Supplier Lifecycle Management
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Purchase Orders
                </h1>
                <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                  Draft restock lists, track delivery lifecycles, and coordinate supplier vendor invoices in one unified workspace.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: PROCUREMENT PREMIUM CLICKABLE KPI CARDS */}
          <div id="premium-procurement-kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Card 1: Drafts */}
            <div 
              onClick={() => {
                setActiveTab('drafts');
              }}
              className="group p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-400 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[145px] active:scale-[0.98] select-none"
              title="Click to view Saved Drafts workspace"
            >
              <div className="absolute right-0 top-0 w-20 h-20 bg-slate-50/50 rounded-bl-full pointer-events-none group-hover:bg-indigo-50/30 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Saved Drafts</span>
                  <span className="text-[11px] text-indigo-600 font-bold mt-1">Pending Checklists</span>
                </div>
                <div className="p-2 ml-2 rounded-xl border transition-all bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 shadow-2xs">
                  <FilePlus className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10 flex items-end justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-black text-slate-900 tracking-tight leading-none">
                      {filteredDrafts.length}
                    </span>
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Draft POs</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium mt-1 truncate">
                    Saved checklists in progress.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Card 2: In Transit */}
            <div 
              onClick={() => {
                setActiveTab('receiving');
              }}
              className="group p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-400 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[145px] active:scale-[0.98] select-none"
              title="Click to track transit shipments"
            >
              <div className="absolute right-0 top-0 w-20 h-20 bg-indigo-50/20 rounded-bl-full pointer-events-none group-hover:bg-indigo-50/40 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">In Transit</span>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 max-w-[110px] truncate block" title="Active physical shipments">Active Shipments</span>
                </div>
                <div className="p-2 ml-2 rounded-xl border transition-all bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 shadow-2xs">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10 flex items-end justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-black text-slate-900 tracking-tight leading-none">
                      {filteredPendingPOs.filter(p => {
                        const s = (p.status || 'pending').toLowerCase().trim();
                        return s === 'pending';
                      }).length}
                    </span>
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Active POs</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium mt-1 truncate">
                    Orders awaiting intake delivery.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <span>Track</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Card 3: Action Needed */}
            <div 
              onClick={() => {
                setActiveTab('receiving');
              }}
              className="group p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-400 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[145px] active:scale-[0.98] select-none"
              title="Click to check partial orders"
            >
              <div className="absolute right-0 top-0 w-20 h-20 bg-amber-50/20 rounded-bl-full pointer-events-none group-hover:bg-amber-50/35 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Action Needed</span>
                  <span className="text-[11px] text-amber-600 font-bold mt-1">Incomplete Intakes</span>
                </div>
                <div className="p-2 ml-2 rounded-xl border transition-all bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-700 group-hover:border-amber-200 shadow-2xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10 flex items-end justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-black text-slate-900 tracking-tight leading-none">
                      {filteredPendingPOs.filter(p => {
                        const s = (p.status || '').toLowerCase().trim();
                        return s === 'partially_received';
                      }).length}
                    </span>
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Receiving</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium mt-1 truncate">
                    Pending remaining delivery checks.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Card 4: Network */}
            <div 
              onClick={() => {
                setActiveTab('suppliers');
              }}
              className="group p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-400 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.2)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[145px] active:scale-[0.98] select-none"
              title="Click to view supplier partners"
            >
              <div className="absolute right-0 top-0 w-20 h-20 bg-teal-50/20 rounded-bl-full pointer-events-none group-hover:bg-teal-50/35 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Partners Network</span>
                  <span className="text-[11px] text-teal-600 font-bold mt-1">Directory Size</span>
                </div>
                <div className="p-2 ml-2 rounded-xl border transition-all bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 relative z-10 flex items-end justify-between">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3.5xl font-black text-slate-900 tracking-tight leading-none">{liveSuppliersCount}</span>
                    <span className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Suppliers</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-medium mt-1 truncate">
                    Registered wholesale vendors.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: WORKFLOW NAVIGATION - EXTREMELY PREMIUM TAB SWITCHERS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => {
                // Completely refresh/reset draft states before entering Creator Workspace
                setPoDraftItems([]);
                setDraftSupplier('');
                setPurchaseNotes('Please ensure all items meet standard quality checks before dispatch.');
                setDeliveryInstructions(profile?.address || 'Shop #112, Main Business Market, Central Av.');
                setSupplierInstructions('Any discrepancies in the invoice must be notified before shipping.');
                setActiveDraftId(null);
                setIsDuplicateReviewing(false);
                setDuplicateWarningData(null);
                setActiveTab('new_order');
              }}
              className="group flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50 hover:from-indigo-50/50 hover:to-white border-slate-200 hover:border-indigo-400 hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.15)] transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
            >
              <div className="p-3 bg-white text-indigo-600 border border-slate-200/60 rounded-xl shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-450">Wizard</span>
                <span className="text-sm font-black text-slate-900 font-sans">New Order</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('drafts');
              }}
              className="group flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50 hover:from-indigo-50/50 hover:to-white border-slate-200 hover:border-indigo-400 hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.15)] transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
            >
              <div className="p-3 bg-white text-indigo-600 border border-slate-200/60 rounded-xl shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-450">Saved</span>
                <span className="text-sm font-black text-slate-900 font-sans">Drafts Folder</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('receiving');
              }}
              className="group flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50 hover:from-indigo-50/50 hover:to-white border-slate-200 hover:border-indigo-400 hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.15)] transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
            >
              <div className="p-3 bg-white text-indigo-600 border border-slate-200/60 rounded-xl shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-450">Track & Stock</span>
                <span className="text-sm font-black text-slate-900 font-sans">Receiving</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('suppliers');
              }}
              className="group flex items-center gap-4 p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50 hover:from-indigo-50/50 hover:to-white border-slate-200 hover:border-indigo-400 hover:shadow-[0_8px_25px_-5px_rgba(79,70,229,0.15)] transition-all duration-300 cursor-pointer text-left hover:-translate-y-1"
            >
              <div className="p-3 bg-white text-indigo-600 border border-slate-200/60 rounded-xl shadow-2xs group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-450">Partners</span>
                <span className="text-sm font-black text-slate-900 font-sans">Suppliers</span>
              </div>
            </button>
          </div>

          {/* Recent Recovery & Autosaved Sessions Section */}
          <div className="pt-8 border-t border-slate-200 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-slate-800 font-extrabold text-base tracking-tight flex items-center gap-2">
                  <Clock className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                  <span>Recent Backups</span>
                </h3>
                <p className="text-slate-450 text-xs font-medium mt-0.5">
                  Saved automatically to safeguard your active sessions.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/80 rounded-full text-[9.5px] font-bold tracking-tight">
                  {recentDrafts.length} Temporary Backups
                </span>
                {recentDrafts.length > 0 && (
                  <button 
                    onClick={clearAllRecentDraftsAction}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-sm active:scale-95"
                  >
                    Erase All
                  </button>
                )}
              </div>
            </div>

            {recentDrafts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-150 p-10 text-center shadow-xs">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-slate-800 font-bold text-sm">No recent auto-backups found</h4>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Every time you configure items in the PO Creator, they are saved automatically behind the scenes.
                </p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-2 border border-slate-100 rounded-3xl bg-slate-50/25 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentDrafts.map((draft) => {
                  const estCost = (draft.items || []).reduce((sum: number, it: any) => sum + ((it.qty || 0) * (it.cost || 0)), 0);
                  const totalQty = (draft.items || []).reduce((sum: number, it: any) => sum + (it.qty || 0), 0);
                  const health = getDraftHealth(draft);

                  return (
                    <div 
                      key={draft.id}
                      className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(79,70,229,0.15)] transition-all duration-300 relative select-none flex flex-col justify-between gap-4 min-h-[190px]"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 text-left relative flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[8.5px] font-bold tracking-wide uppercase block w-fit">
                                Auto-Backup
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    message: "Delete this backup?",
                                    onConfirm: () => {
                                      deleteDraftAction(draft.id);
                                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    }
                                  });
                                }}
                                className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 absolute right-0 top-0 cursor-pointer"
                                title="Delete Backup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <h4 className="text-slate-800 font-black text-sm tracking-tight truncate max-w-[180px]" title={draft.supplier || 'No supplier'}>
                              {draft.supplier || 'Unnamed Supplier'}
                            </h4>
                            <p className="text-slate-400 text-[10px] font-medium">
                              Saved {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString() : 'N/A'}
                            </p>
                          </div>

                          {/* 3-Dot Dropdown Trigger */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownDraftId(openDropdownDraftId === draft.id ? null : draft.id);
                              }}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer transition-colors animate-fade-in"
                              title="Backup Action Menu"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openDropdownDraftId === draft.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40 cursor-default" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdownDraftId(null);
                                  }} 
                                />
                                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-150 shadow-lg py-1.5 z-50 text-left">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      resumeDraftAction(draft);
                                      setOpenDropdownDraftId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                    Resume Order
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveInDraftAction(draft);
                                      setOpenDropdownDraftId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
                                    Save in draft
                                  </button>

                                  <div className="border-t border-slate-100 my-1" />

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDialog({
                                        isOpen: true,
                                        message: "WARNING: Are you sure you want to permanently delete this unsaved backup?",
                                        onConfirm: () => {
                                          deleteDraftAction(draft.id);
                                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        }
                                      });
                                      setOpenDropdownDraftId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    Delete Backup
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick Metrics Subpanels */}
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Est Net Cost</span>
                            <span className="text-sm font-extrabold text-slate-800">₹{formatNum(estCost)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Quantity Size</span>
                            <span className="text-sm font-extrabold text-indigo-600">{totalQty} units</span>
                          </div>
                        </div>
                      </div>

                      {/* Content stats */}
                      <div className="flex items-center justify-between text-[10px] text-slate-450 font-semibold uppercase pt-1">
                        <span className="italic block text-[9.5px]">
                          {draft.items?.length || 0} unique items
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[8.5px] font-black tracking-wider uppercase bg-orange-50 text-orange-600 border border-orange-100`}>
                            {health.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* REDESIGNED SIMPLE BACK TOGGLE & ATTRACTIVE PAGE TITLE */}
      {activeTab !== 'dashboard' && (
        <div id="procurement-workspace-pages-backbar" className="relative overflow-hidden bg-gradient-to-r from-indigo-50/90 via-white to-slate-50/50 p-4 sm:p-5 md:p-6 rounded-3xl border border-indigo-100 shadow-xs mb-6 animate-fade-in text-left">
          <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3 md:gap-4">
            <button
              onClick={() => {
                setActiveTab('dashboard');
              }}
              className="group flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl border border-indigo-100 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white shadow-xs cursor-pointer transition-all duration-300 transform active:scale-95 shrink-0"
              title="Back to PO Overview Dashboard"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:-translate-x-1" />
            </button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">
                {activeTab === 'new_order' ? 'Create PO' :
                 activeTab === 'drafts' ? 'Drafts' :
                 activeTab === 'receiving' ? 'Intake Pipeline' :
                 'Suppliers'}
              </h1>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-500 font-bold mt-1.5 truncate max-w-2xl">
                {activeTab === 'new_order' ? 'Formulate, calculate needs, and send to suppliers.' :
                 activeTab === 'drafts' ? 'Refine, edit, and dispatch saved drafts.' :
                 activeTab === 'receiving' ? 'Track transit status, receive inventory, and view records.' :
                 'Manage partner directories, rates, and agreements.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL - Contextual to active deliveries to prevent clutter on creator workspace */}
      {activeTab === 'receiving' && (() => {
        const countAll = pendingOrders.length;
        const countPending = pendingOrders.filter(po => (po.status || 'pending').toLowerCase() === 'pending').length;
        const countPartial = pendingOrders.filter(po => (po.status || '').toLowerCase() === 'partially_received').length;
        const countReceived = pendingOrders.filter(po => (po.status || '').toLowerCase() === 'received').length;
        const countClosed = pendingOrders.filter(po => (po.status || '').toLowerCase() === 'closed').length;

        return (
          <div id="po-intake-filter-panel" className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs mb-6 text-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 animate-fade-in">
            {/* Left Section: Search Input and Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search POs by ID, Supplier, Product..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 shrink-0">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sort:</span>
                <select
                  value={poSortBy}
                  onChange={(e) => setPoSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-700 focus:ring-0 border-none p-0 pr-1"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="supplier-asc">Supplier A-Z</option>
                  <option value="supplier-desc">Supplier Z-A</option>
                </select>
              </div>
            </div>

            {/* Right Section: Filter Pills & Reset Control */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
              <div className="flex items-center bg-slate-50 border border-slate-200/60 p-1 rounded-2xl gap-0.5">
                {[
                  { id: 'ALL', label: 'All', count: countAll, activeClass: 'bg-white text-slate-900 border-slate-200 shadow-xs font-bold', inactiveClass: 'text-slate-550 border-transparent hover:text-slate-800' },
                  { id: 'pending', label: 'Pending', count: countPending, activeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs font-bold', inactiveClass: 'text-slate-550 border-transparent hover:text-slate-850' },
                  { id: 'partially_received', label: 'Partial', count: countPartial, activeClass: 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs font-bold', inactiveClass: 'text-slate-550 border-transparent hover:text-slate-850' },
                  { id: 'received', label: 'Received', count: countReceived, activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs font-bold', inactiveClass: 'text-slate-550 border-transparent hover:text-slate-850' },
                  { id: 'closed', label: 'Closed', count: countClosed, activeClass: 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs font-bold', inactiveClass: 'text-slate-550 border-transparent hover:text-slate-850' }
                ].map((pill) => {
                  const isActive = filterStatus.toLowerCase() === pill.id.toLowerCase();
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setFilterStatus(pill.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${isActive ? pill.activeClass : pill.inactiveClass}`}
                    >
                      <span>{pill.label}</span>
                      <span className={`px-1 py-0.2 rounded-md text-[9px] font-bold ${isActive ? 'bg-current/10' : 'bg-slate-200 text-slate-500'}`}>
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Reset button */}
              {(filterStatus !== 'ALL' || globalSearch) && (
                <button
                  onClick={() => {
                    setFilterStatus('ALL');
                    setGlobalSearch('');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-[10.5px] font-bold tracking-tight transition-all cursor-pointer shrink-0"
                  title="Clear filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* WORKSPACE AREA */}

      {/* TAB 1: SMART GUIDED PO BUILDER WORKSPACE */}
      {activeTab === 'new_order' && (
        <POCreatorWorkspace
          inventory={inventory}
          poDraftItems={poDraftItems}
          setPoDraftItems={setPoDraftItems}
          draftSupplier={draftSupplier}
          setDraftSupplier={setDraftSupplier}
          categoryFilterQuery={categoryFilterQuery}
          setCategoryFilterQuery={setCategoryFilterQuery}
          customSearchTerm={customSearchTerm}
          setCustomSearchTerm={setCustomSearchTerm}
          customQtyInput={customQtyInput}
          setCustomQtyInput={setCustomQtyInput}
          customUnitInput={customUnitInput}
          setCustomUnitInput={setCustomUnitInput}
          quickProductForm={quickProductForm}
          setQuickProductForm={setQuickProductForm}
          isDuplicateReviewing={isDuplicateReviewing}
          setIsDuplicateReviewing={setIsDuplicateReviewing}
          reEditingPoId={reEditingPoId}
          autoSaveStatus={autoSaveStatus}
          purchaseNotes={purchaseNotes}
          setPurchaseNotes={setPurchaseNotes}
          deliveryInstructions={deliveryInstructions}
          setDeliveryInstructions={setDeliveryInstructions}
          supplierInstructions={supplierInstructions}
          setSupplierInstructions={setSupplierInstructions}
          isNotesExpanded={isNotesExpanded}
          setIsNotesExpanded={setIsNotesExpanded}
          activeDraftId={activeDraftId}
          handleAddManualLine={handleAddManualLine}
          handleSaveDraftManual={handleSaveDraftManual}
          generatePO_PDF={localGeneratePO_PDF}
          triggerWhatsAppDispatch={triggerWhatsAppDispatch}
          triggerEmailDispatch={triggerEmailDispatch}
          handleFinalizeCustomDraftFile={handleFinalizeCustomDraftFile}
          showToast={showToast}
          formatNum={formatNum}
          smartAnalysis={smartAnalysis}
        />
      )}

      {/* RENDER OLD BUILDER DEACTIVATED AND COMPILED OUT BY ENGINE */}
      {false && (
        <div className="space-y-6">
          {draftSubTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in text-left">
              
              {/* BUILDER LINES */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Duplicate Review Banner (Feature 5) */}
                {isDuplicateReviewing && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                    <div className="bg-amber-100 p-2 rounded-xl border border-amber-200 text-amber-600 mt-0.5">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-900 border-b border-amber-200/50 pb-1 mb-1">Duplication Review Required</h4>
                      <p className="text-xs text-amber-800 font-semibold mb-2 leading-relaxed">
                        You are duplicating an existing purchase order. Please verify quantities, supplier names, pricing, and instructions below. The original quantities have been copied. Edit as needed and click "Generate Real PO Order Data".
                      </p>
                      <button 
                        onClick={() => setIsDuplicateReviewing(false)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br from-white to-slate-50/40 rounded-3xl border ${isDuplicateReviewing ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-200 shadow-sm'} overflow-hidden transition-all duration-300`}>
                  <div className={`px-6 py-5 border-b ${isDuplicateReviewing ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 bg-linear-to-r from-slate-50/60 to-white'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                    <div className="text-left space-y-1">
                      <h3 className="text-slate-900 font-black text-sm sm:text-base flex flex-wrap items-center gap-2">
                        <span>Draft Order</span>
                        {reEditingPoId && (
                          <span className="text-[9px] bg-indigo-650 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">Editing {reEditingPoId}</span>
                        )}
                        {/* Auto save badge status info inline */}
                        {autoSaveStatus === 'saving' && (
                          <span className="flex items-center gap-1 text-[9px] text-slate-400 font-extrabold italic bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-slate-400" /> Saving...
                          </span>
                        )}
                        {autoSaveStatus === 'saved' && (
                          <span className="flex items-center gap-1 text-[9px] text-emerald-750 font-black bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 shadow-3xs">
                            <Check className="w-2.5 h-2.5 text-emerald-500" /> Saved
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Select a supplier, load items, and adjust quantity.</p>
                    </div>
                    <div className="w-full md:w-64 text-left">
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1 tracking-wider">Supplier</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="Search or select supplier..."
                          value={draftSupplier}
                          onChange={(e) => setDraftSupplier(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-505 shadow-2xs transition-all"
                        />
                      </div>
                    </div>
                  </div>

              {/* Advanced Interactive manual entry controllers */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-4 shadow-inner">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 text-left">
                    <Plus className="w-4 h-4 text-indigo-600 animate-pulse" /> Add Order Items
                  </span>
                  
                  {/* Category Filter */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select
                        value={categoryFilterQuery}
                        onChange={(e) => setCategoryFilterQuery(e.target.value)}
                        className="text-xs bg-white border border-slate-205 py-2 pl-3 pr-8 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 cursor-pointer shadow-3xs appearance-none"
                      >
                        <option value="ALL">All Categories</option>
                        {Array.from(new Set(inventory.map(i => i.category || 'General'))).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 top-3 pointer-events-none text-slate-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manual line entry grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-2 lg:col-span-5 relative text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Search Catalog Product</label>
                    <input
                      type="text"
                      value={customSearchTerm}
                      onChange={(e) => setCustomSearchTerm(e.target.value)}
                      placeholder="Search existing inventory or type custom..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-3xs transition-all"
                    />
                    {/* dropdown matching */}
                    {customSearchTerm.length > 1 && !inventory.find(i => i.name.toLowerCase() === customSearchTerm.toLowerCase()) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-40 overflow-y-auto text-xs z-50 text-left divide-y divide-slate-50">
                        {inventory.filter(i => {
                          const matchesCat = categoryFilterQuery === 'ALL' || i.category === categoryFilterQuery;
                          return matchesCat && i.name.toLowerCase().includes(customSearchTerm.toLowerCase());
                        }).slice(0, 5).map(i => (
                          <div
                            key={i.id}
                            onClick={() => {
                              setCustomSearchTerm(i.name);
                              setCustomCostInput(i.purchasePrice || 0);
                            }}
                            className="px-3.5 py-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center font-bold text-slate-700 transition-colors"
                          >
                            <span className="font-extrabold text-slate-805">{i.name}</span>
                            <span className="text-slate-450 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">₹{formatNum(i.purchasePrice || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 lg:col-span-2 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Order Volume</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={customQtyInput}
                      onChange={(e) => setCustomQtyInput(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-center text-slate-800 focus:none focus:ring-2 focus:ring-indigo-500/10 shadow-3xs"
                    />
                  </div>
                  <div className="col-span-1 lg:col-span-3 text-left">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Packaging Unit</label>
                    <select
                      value={customUnitInput}
                      onChange={(e) => setCustomUnitInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:none focus:ring-2 focus:ring-indigo-500/10 shadow-3xs"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="units">Units (units)</option>
                      <option value="box">Box (box)</option>
                      <option value="pack">Pack (pack)</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="ltr">Liters (ltr)</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="mtr">Meters (mtr)</option>
                      <option value="set">Set (set)</option>
                      <option value="dozen">Dozen (dozen)</option>
                      <option value="carton">Carton (carton)</option>
                      <option value="rolls">Rolls (rolls)</option>
                      <option value="sqft">Sq. Feet (sqft)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const found = inventory.find(i => i.name.toLowerCase() === customSearchTerm.toLowerCase());
                      const qtyVal = customQtyInput === "" ? 10 : Number(customQtyInput);
                      handleAddManualLine(customSearchTerm, found?.id || null, qtyVal, found?.purchasePrice || 0, found?.category || 'General', customUnitInput || found?.unit || 'units');
                    }}
                    className="col-span-1 sm:col-span-2 lg:col-span-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                        {/* Feature 1: Toggle brand-new custom product expansion */}
                <div className="pt-2.5 border-t border-slate-100/70 flex flex-col text-left">
                  <details className="text-xs group">
                    <summary className="font-extrabold text-indigo-650 hover:text-indigo-800 cursor-pointer list-none flex items-center justify-between select-none py-1.5 px-2 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                        <span>Cannot find active product? Register a quick custom item lines</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-4 bg-slate-100/40 border border-slate-205/60 rounded-2xl mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3.5 shadow-sm">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Product Name</label>
                        <input
                          type="text"
                          placeholder="New custom item name..."
                          value={quickProductForm.name}
                          onChange={(e) => setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Category</label>
                        <select
                          value={quickProductForm.category}
                          onChange={(e) => setQuickProductForm({ ...quickProductForm, category: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        >
                          <option value="General">General</option>
                          <option value="Groceries">Groceries</option>
                          <option value="FMCG">FMCG</option>
                          <option value="Beverages">Beverages</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Apparel">Apparel</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">Packaging Unit</label>
                        <select
                          value={quickProductForm.unit}
                          onChange={(e) => setQuickProductForm({ ...quickProductForm, unit: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                        >
                          <option value="units">Units (Pcs)</option>
                          <option value="Kg">Kilograms (Kg)</option>
                          <option value="Ltr">Liters (Ltr)</option>
                          <option value="Packets">Packets</option>
                          <option value="Boxes">Boxes</option>
                          <option value="Bags">Bags</option>
                          <option value="Bottles">Bottles</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (!quickProductForm.name.trim()) {
                              showToast("Please enter a custom product name", "warning");
                              return;
                            }
                            handleAddManualLine(
                              quickProductForm.name,
                              null, // no inventory product ID yet
                              10, // default qty
                              0, // purchase price decided by supplier
                              quickProductForm.category,
                              quickProductForm.unit || 'units'
                            );
                            setQuickProductForm({ name: '', category: 'General', sku: '', purchasePrice: 0, sellingPrice: 0, stock: 0, unit: 'units' });
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] uppercase font-black tracking-wider rounded-xl text-center cursor-pointer transition-colors shadow-xs"
                        >
                          Insert Item Line
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Lines List Table */}
              {poDraftItems.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-semibold text-xs flex flex-col items-center justify-center gap-2">
                  <div className="bg-slate-50 p-3 rounded-full border border-slate-100 text-slate-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">No draft product lines loaded.</span>
                    <p className="text-[10px] text-slate-400 uppercase mt-0.5 tracking-wider font-semibold">Match items above or choose from catalog suggestions below</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto">
                  {poDraftItems.map((item, idx) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/45 transition-colors">
                      <div className="space-y-1 flex-1 text-left min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-extrabold text-slate-800 text-sm truncate">
                            {item.productName}
                          </span>
                          {!item.productId ? (
                            <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">New Custom product</span>
                          ) : (
                            <span className="text-[8px] bg-indigo-50/70 text-indigo-700 border border-indigo-150 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">SKU: {inventory.find(i => i.id === item.productId)?.sku || item.productId.substring(0,8).toUpperCase()}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Recommended Category: {item.category || 'General'}
                        </p>
                      </div>
                      
                      {/* QUANTITY & UNIT TYPE SPECIFIERS */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-5">
                        
                        {/* Packaging Unit Indicator */}
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Unit Type</span>
                          <span className="text-xs bg-slate-100 hover:bg-slate-200/60 px-2 py-1 rounded-lg text-slate-700 font-extrabold capitalize transition-all select-none border border-slate-200/50 mt-0.5">
                            {item.unit || "Units"}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex flex-col text-left">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Qty</span>
                            <div className={`flex items-center border ${isDuplicateReviewing ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-205'} bg-white rounded-xl overflow-hidden h-8 shadow-3xs mt-0.5`}>
                              <button
                                type="button"
                                onClick={() => {
                                  const val = Math.max(1, item.qty - 1);
                                  setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: val * it.cost } : it));
                                }}
                                className="w-8 h-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black flex items-center justify-center text-xs border-r border-slate-200 cursor-pointer select-none"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value));
                                  setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: val * it.cost } : it));
                                }}
                                className="w-10 h-full text-center font-bold text-slate-850 text-xs focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = item.qty + 1;
                                  setPoDraftItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: val, total: val * it.cost } : it));
                                }}
                                className="w-8 h-full bg-slate-50 hover:bg-slate-100 text-slate-500 font-black flex items-center justify-center text-xs border-l border-slate-200 cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPoDraftItems(prev => prev.filter((_, i) => i !== idx));
                            showToast(`Removed line item safely`, "info");
                          }}
                          className="text-slate-350 hover:text-rose-650 p-2 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
                          title="Remove line item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>

            {/* Quick Browse Catalog Pane (Collapsible for a cleaner, de-cluttered workspace!) */}
            <details className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-left group transition-all">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 hover:text-indigo-650 transition-colors">
                      Browse & Quick-Add from Inventory Catalog
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Click to expand and instantly append catalog products to draft lines</p>
                  </div>
                </div>
                <div className="text-xs bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold group-open:bg-slate-200/50 transition-all flex items-center gap-1">
                  <span>{inventory.filter(i => {
                    const matchesCat = categoryFilterQuery === 'ALL' || i.category === categoryFilterQuery;
                    const matchesSearch = !customSearchTerm || i.name.toLowerCase().includes(customSearchTerm.toLowerCase());
                    return matchesCat && matchesSearch;
                  }).length} Matches</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                </div>
              </summary>

              <div className="pt-4 mt-3 border-t border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {inventory.filter(i => {
                  const matchesCat = categoryFilterQuery === 'ALL' || i.category === categoryFilterQuery;
                  const matchesSearch = !customSearchTerm || i.name.toLowerCase().includes(customSearchTerm.toLowerCase());
                  return matchesCat && matchesSearch;
                }).length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                    No matching catalog products found under current filter criteria.
                  </div>
                ) : (
                  inventory.filter(i => {
                    const matchesCat = categoryFilterQuery === 'ALL' || i.category === categoryFilterQuery;
                    const matchesSearch = !customSearchTerm || i.name.toLowerCase().includes(customSearchTerm.toLowerCase());
                    return matchesCat && matchesSearch;
                  }).slice(0, 16).map(prod => (
                    <div key={prod.id} className="p-3 border rounded-xl hover:border-slate-300 flex items-center justify-between gap-3 bg-slate-50/20">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 block truncate">{prod.name}</span>
                        <span className="text-[9px] font-bold text-slate-405 uppercase block">SKU: {prod.sku || 'N/A'} • Cost: ₹{prod.purchasePrice || 0}</span>
                      </div>
                      <button
                        onClick={() => handleAddManualLine(prod.name, prod.id, 10, prod.purchasePrice || 0, prod.category || 'General')}
                        className="bg-indigo-50 hover:bg-slate-900 border border-indigo-100 hover:border-slate-850 text-indigo-700 hover:text-white font-black text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        + Add Line
                      </button>
                    </div>
                  ))
                )}
              </div>
            </details>
          </div>

          {/* RIGHT COLUMN: VOLUME SUMMARY & WORKFLOW CONTROLLERS */}
          <div className="space-y-6">
            
            {/* 1. Procurement Volume Summary Card (Supplier-Decided Price Workflow) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-3xl p-6 shadow-md border border-slate-800 text-left space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="font-extrabold text-xs uppercase tracking-widest text-indigo-200">Procurement Volume Summary</h3>
                <span className="text-[8px] bg-slate-800 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Supplier-Decided Pricing</span>
              </div>
              
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-400">Total Unique Product Lines</span>
                  <span className="font-bold text-white text-sm">
                    {poDraftItems.length} lines
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-400">Total Planned Order Volume</span>
                  <span className="font-bold text-amber-300 text-sm">
                    {poDraftItems.reduce((acc, i) => acc + i.qty, 0)} units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-medium text-slate-400">Primary Product Categories</span>
                  <span className="font-bold text-slate-300 text-xs">
                    {Array.from(new Set(poDraftItems.map(i => i.category || 'General'))).length || 0}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-800/90 flex flex-col gap-2">
                  <div className="bg-indigo-950/45 border border-indigo-500/10 rounded-xl p-3 text-[10.5px] text-indigo-200 leading-relaxed font-sans space-y-1.5 shadow-inner">
                    <span className="font-extrabold block text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Intake Automation:
                    </span>
                    <p className="text-slate-350">
                      Pricing is set by the supplier. Once ordered, open the <strong>Fulfillment Tracker (Tab 3)</strong> to upload the supplier's digital bill. Vyapar Mitra's AI will automatically scan the bill, extract supplier rates directly, and count received stock!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Feature 3, 6, 7: NOTES & LOGISTICS COMPLIANCE INSTRUCTIONS CENTER */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 text-left">
              <div 
                className="flex items-center justify-between cursor-pointer group select-none"
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              >
                <div className="space-y-1">
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-650" /> Notes & Instructions Center
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-bold leading-normal uppercase group-hover:text-slate-600 transition-colors">Warehouse guidelines and logistics constraints</p>
                    { !isNotesExpanded && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        (purchaseNotes || deliveryInstructions || supplierInstructions) 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-slate-50 text-slate-400 border border-slate-150'
                      }`}>
                        {(purchaseNotes || deliveryInstructions || supplierInstructions) ? 'Notes Added' : 'No Notes'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 group-hover:bg-slate-100 transition-all">
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isNotesExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isNotesExpanded && (
                <div className="space-y-4 pt-3.5 border-t border-slate-100 animate-fade-in text-slate-800">
                  {/* Quick Pills */}
                  <div className="space-y-1.5 pt-1 text-left">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Smart Logistics Templates</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Deliver Before 5 PM",
                        "Include GST Invoice",
                        "Urgent Delivery",
                        "Contact Before Dispatch",
                        "Fresh Stock Required",
                        "Secure Packaging Required",
                      ].map((tpl) => (
                        <button
                          key={tpl}
                          onClick={() => {
                            setPurchaseNotes(prev => {
                              const b = prev ? `${prev} | ${tpl}` : tpl;
                              return b.substring(0, 300);
                            });
                            showToast(`Appended: "${tpl}"`, "success");
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[8.5px] rounded-lg font-bold text-slate-650 transition-colors uppercase whitespace-nowrap cursor-pointer select-none"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purchase Notes (limit 300) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Purchase Notes / Quality Specs</label>
                      <span className={`text-[8px] font-bold ${purchaseNotes.length > 300 ? 'text-rose-500 font-extrabold' : 'text-slate-400'}`}>
                        {purchaseNotes.length}/300
                      </span>
                    </div>
                    <textarea
                      placeholder="Special terms, quality compliance directives or lot rules..."
                      maxLength={300}
                      rows={2}
                      value={purchaseNotes}
                      onChange={(e) => setPurchaseNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 transition-all text-slate-800"
                    />
                  </div>

                  {/* Delivery Instructions (limit 180) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Delivery Instructions (Gate, Hours)</label>
                      <span className={`text-[8px] font-bold ${deliveryInstructions.length > 180 ? 'text-rose-500 font-extrabold' : 'text-slate-400'}`}>
                        {deliveryInstructions.length}/180
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="E.g. Deliver to Gate B before 5 PM."
                      maxLength={180}
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 transition-all text-slate-850"
                    />
                  </div>

                  {/* Supplier Instructions (limit 180) */}
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Supplier Instructions (Invoice, Packaging)</label>
                      <span className={`text-[8px] font-bold ${supplierInstructions.length > 180 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {supplierInstructions.length}/180
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="E.g. Attach batch quality lab certificate."
                      maxLength={180}
                      value={supplierInstructions}
                      onChange={(e) => setSupplierInstructions(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder-slate-400 transition-all text-slate-850"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Feature 4: QUICK ACTION TOOLBAR */}
            <div className="space-y-3 bg-slate-900 border border-slate-850 p-6 rounded-3xl text-white text-left shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-350 tracking-wider">Quick Actions Control Toolbar</span>
                <span className="text-[8px] bg-slate-800 text-slate-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase">Realtime Sandbox</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSaveDraftManual(true)}
                  disabled={poDraftItems.length === 0}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-indigo-50 text-slate-900 font-black text-[10.5px] uppercase rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-600" /> Save Draft
                </button>
 
                <button
                  onClick={() => {
                    if (poDraftItems.length === 0) {
                      showToast("Lines list is empty.", "warning");
                      return;
                    }
                    const dummy = {
                      id: activeDraftId || 'PO-PREVIEW',
                      date: new Date().toISOString(),
                      supplier: draftSupplier || '',
                      items: poDraftItems,
                      purchaseNotes,
                      deliveryInstructions,
                      supplierInstructions,
                      subTotal: poDraftItems.reduce((acc, i) => acc + i.total, 0),
                      gstAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 0.18),
                      otherCharges: 250,
                      totalAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 1.18) + 250
                    };
                    generatePO_PDF({ po: dummy, inventory, formatNum, showToast, profile });
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-[10.5px] uppercase rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" /> Download PDF
                </button>
 
                <button
                  onClick={() => {
                    if (poDraftItems.length === 0) {
                      showToast("Lines are empty.", "warning");
                      return;
                    }
                    const dummy = {
                      id: activeDraftId || 'PO-DUMMY',
                      date: new Date().toISOString(),
                      supplier: draftSupplier || '',
                      items: poDraftItems,
                      purchaseNotes,
                      deliveryInstructions,
                      supplierInstructions,
                      subTotal: poDraftItems.reduce((acc, i) => acc + i.total, 0),
                      gstAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 0.18),
                      otherCharges: 250,
                      totalAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 1.18) + 250
                    };
                    triggerWhatsAppDispatch(dummy);
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 bg-emerald-700 hover:bg-emerald-650 text-white text-[10.5px] font-bold rounded-xl cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-white" /> WhatsApp Share
                </button>
 
                <button
                  onClick={() => {
                    if (poDraftItems.length === 0) {
                      showToast("Lines are empty.", "warning");
                      return;
                    }
                    const dummy = {
                      id: activeDraftId || 'PO-DUMMY',
                      date: new Date().toISOString(),
                      supplier: draftSupplier || '',
                      items: poDraftItems,
                      purchaseNotes,
                      deliveryInstructions,
                      supplierInstructions,
                      subTotal: poDraftItems.reduce((acc, i) => acc + i.total, 0),
                      gstAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 0.18),
                      otherCharges: 250,
                      totalAmount: Math.round(poDraftItems.reduce((acc, i) => acc + i.total, 0) * 1.18) + 250
                    };
                    triggerEmailDispatch(dummy);
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 bg-indigo-700 hover:bg-indigo-650 text-white text-[10.5px] font-bold rounded-xl cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-white" /> Email Share
                </button>
              </div>
 
              <div className="pt-2">
                <button
                  onClick={() => handleFinalizeCustomDraftFile(false)}
                  disabled={poDraftItems.length === 0}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-extrabold uppercase rounded-xl tracking-wider text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" /> Confirm & Place Order
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  )}

  {/* SUB-TAB 2.2: STORED DRAFTS HUB (Feature 5) - MOVED TO DASHBOARD AND COMPACT */}
  {activeTab === 'drafts' && (
        <div id="vmitra-saved-drafts" className="space-y-6 text-left animate-fade-in text-slate-800">
          
          {/* SEARCH AND FILTERS HEADER CARD */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-xl shadow-indigo-900/10 border border-slate-800">
            <div className="flex-shrink-0">
              <h3 className="text-white font-black text-xl tracking-tight">Draft Workspace</h3>
              <p className="text-indigo-200 text-xs font-medium mt-1.5 max-w-sm leading-relaxed">
                Manage, edit, and organize your saved procurement drafts efficiently.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={draftSortPolicy}
                  onChange={(e) => setDraftSortPolicy(e.target.value as 'recent' | 'old')}
                  className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold pl-4 pr-10 py-2.5 rounded-xl cursor-pointer outline-none transition-colors shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="recent">Most Recent</option>
                  <option value="old">Oldest First</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>

              {/* Filter Selector */}
              <div className="relative">
                <select
                  value={draftSearchFilter}
                  onChange={(e) => setDraftSearchFilter(e.target.value as 'all' | 'date' | 'supplier')}
                  className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold pl-4 pr-10 py-2.5 rounded-xl cursor-pointer outline-none transition-colors shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="all">Search All</option>
                  <option value="supplier">Supplier</option>
                  <option value="date">Date</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>

              {/* Upgraded Selection Toggle */}
              <button
                onClick={() => {
                  const allIds = filteredDrafts.map(d => d.id);
                  const allSelected = allIds.length > 0 && allIds.every(id => selectedDraftIds.includes(id));
                  if (allSelected) {
                    setSelectedDraftIds([]);
                  } else {
                    setSelectedDraftIds(allIds);
                  }
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 shadow-sm ${
                  filteredDrafts.length > 0 && filteredDrafts.every(d => selectedDraftIds.includes(d.id))
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filteredDrafts.length > 0 && filteredDrafts.every(d => selectedDraftIds.includes(d.id)) ? 'Deselect All' : 'Select All'}
              </button>
              
              {/* Search Bar */}
              <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={draftSearchFilter === 'date' ? "Search dates..." : "Search drafts..."}
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {filteredDrafts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-450 shadow-3xs">
              <h4 className="text-slate-700 font-extrabold text-sm mb-4">No Drafts Found</h4>
              <button 
                onClick={() => {
                  // Completely refresh/reset draft states before entering Creator Workspace
                  setPoDraftItems([]);
                  setDraftSupplier('');
                  setPurchaseNotes('Please ensure all items meet standard quality checks before dispatch.');
                  setDeliveryInstructions(profile?.address || 'Shop #112, Main Business Market, Central Av.');
                  setSupplierInstructions('Any discrepancies in the invoice must be notified before shipping.');
                  setActiveDraftId(null);
                  setIsDuplicateReviewing(false);
                  setDuplicateWarningData(null);
                  setActiveTab('new_order');
                }}
                className="mx-auto px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-3xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create fresh draft
              </button>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto pr-2 border border-slate-100 rounded-3xl bg-slate-50/25 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDrafts.map((draft) => {
                if (!draft) return null;
                const health = getDraftHealth(draft);
                const status = getDraftStatus(draft.updatedAt);
                const isArchived = status === 'Archived' || status === 'Expired';
                
                // Extract items safely and filter out non-object elements
                const safeItems = Array.isArray(draft.items)
                  ? draft.items.filter((i: any) => i && typeof i === 'object')
                  : [];
                
                // Protect reduce operations from undefined, null, or non-numeric values
                const estCost = safeItems.reduce((sum: number, i: any) => {
                  const qty = typeof i.qty === 'number' ? i.qty : Number(i.qty) || 0;
                  const cost = typeof i.cost === 'number' ? i.cost : Number(i.cost) || 0;
                  return sum + (qty * cost);
                }, 0);
                
                const totalQty = safeItems.reduce((sum: number, i: any) => {
                  const qty = typeof i.qty === 'number' ? i.qty : Number(i.qty) || 0;
                  return sum + qty;
                }, 0);

                const isExpanded = expandedDraftId === draft.id;

                const isSelected = selectedDraftIds.includes(draft.id);

                return (
                  <div 
                    key={draft.id} 
                    onClick={() => setPreviewDraft(draft)}
                    className={`bg-white rounded-3xl border transition-all p-5 flex flex-col justify-between text-left space-y-4 shadow-3xs relative cursor-pointer hover:shadow-md hover:scale-[1.01] hover:border-slate-350 ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-150 bg-indigo-50/5' : 'border-slate-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-grow">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()} // Prevents launching preview from checkbox clicking
                          onChange={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedDraftIds(prev => prev.filter(id => id !== draft.id));
                            } else {
                              setSelectedDraftIds(prev => [...prev, draft.id]);
                            }
                          }}
                          className="mt-1 w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                        />
                        <div className="space-y-0.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <h4 className="text-slate-900 font-extrabold text-sm line-clamp-1 truncate">
                            {draft.supplier || 'General Draft Template'}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-semibold block truncate">
                            ID: {draft.id}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[9px] font-semibold text-slate-400 block">
                            {draft.updatedAt && !isNaN(new Date(draft.updatedAt).getTime())
                              ? new Date(draft.updatedAt).toLocaleDateString()
                              : '—'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest block mt-1 ${
                            isArchived ? 'bg-slate-100 text-slate-500 border border-slate-200/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {status}
                          </span>
                        </div>

                        {/* Three-dot dropdown menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownDraftId(openDropdownDraftId === draft.id ? null : draft.id);
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-850"
                            title="Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownDraftId === draft.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownDraftId(null);
                                }}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-20 animate-fade-in text-slate-800">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resumeDraftAction(draft);
                                    setOpenDropdownDraftId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-indigo-500" />
                                  Edit Draft
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generatePoFromDraftAction(draft);
                                    setOpenDropdownDraftId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                                  Receive
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDialog({
                                      isOpen: true,
                                      message: "WARNING: This Purchase Order (PO) draft will be permanently deleted and cannot be recovered back. Do you want to proceed and delete it completely?",
                                      onConfirm: () => {
                                        deleteDraftAction(draft.id);
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                      }
                                    });
                                    setOpenDropdownDraftId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  Delete Draft
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Metrics Subpanels */}
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl grid grid-cols-2 gap-2 text-xs font-bold">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Est Net Cost</span>
                        <span className="text-sm font-black text-[#111111]">₹{formatNum(estCost)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">Quantity Size</span>
                        <span className="text-sm font-black text-indigo-750">{totalQty} units</span>
                      </div>
                    </div>

                    {/* Category details & health indicators */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5 items-center justify-between text-[9px] text-slate-450 font-bold uppercase">
                      <span className="block italic">
                        {draft.items?.length || 0} unique lines configured
                      </span>
                      <span className={`px-2 py-0.5 rounded font-black tracking-widest ${
                        health.percentage >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-55/70 text-indigo-700'
                      }`}>
                        Score: {health.percentage}%
                      </span>
                    </div>

                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* COMPILED-OUT DEACTIVATED LEGACY RENDER */}
          {false && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrafts.map((draft) => {
                  const totalItems = draft.items?.length || 0;
                  const health = getDraftHealth(draft);
                  const status = getDraftStatus(draft.updatedAt);
                  const isArchived = status === 'Archived' || status === 'Expired';
                  
                  return (
                  <div key={draft.id} className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${isArchived ? 'border-slate-200 opacity-80' : 'border-slate-250 hover:border-indigo-400'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-1 flex-col">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase w-fit ${isArchived ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700'}`}>
                            {draft.id}
                          </span>
                          <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded w-fit uppercase ${
                            status === 'Expired' ? 'bg-rose-50 text-rose-600' :
                            status === 'Archived' ? 'bg-amber-50 text-amber-600' :
                            status === 'Recent' ? 'bg-blue-50 text-blue-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            {status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block">
                            {new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-slate-800 font-black text-sm line-clamp-1">{draft.name || 'Draft Procurement'}</h4>
                        <p className="text-xs text-indigo-650 font-bold mt-0.5">Supplier: {draft.supplier || 'Unassigned'}</p>
                      </div>
                      
                      {/* Health Indicator */}
                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black uppercase text-slate-500">Draft Health</span>
                          <span className={`text-[10px] font-extrabold ${health.percentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{health.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
                          <div className={`h-1.5 rounded-full ${health.percentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${health.percentage}%` }}></div>
                        </div>
                        <span className={`text-[9.5px] font-bold ${health.percentage === 100 ? 'text-emerald-700' : 'text-rose-600'} block`}>
                          {health.percentage === 100 ? 'Ready To Generate' : health.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-100 p-2.5 rounded-xl text-slate-650 font-semibold">
                        <div>
                          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Line Items</span>
                          <span className="font-bold text-slate-800">{totalItems} Unique</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider block">Planned Load</span>
                          <span className="font-extrabold text-slate-800">
                            {draft.items?.reduce((acc: number, item: any) => acc + (item.qty || 0), 0) || 0} units
                          </span>
                        </div>
                      </div>
                      {/* Display Notes snippets if they exist */}
                      {(draft.purchaseNotes || draft.deliveryInstructions || draft.supplierInstructions) && (
                        <div className="text-[10px] bg-slate-50/50 p-2 text-slate-500 rounded-lg space-y-0.5 max-h-16 overflow-y-auto">
                          {draft.purchaseNotes && <p className="line-clamp-1"><strong>Notes:</strong> {draft.purchaseNotes}</p>}
                          {draft.deliveryInstructions && <p className="line-clamp-1"><strong>Delivery:</strong> {draft.deliveryInstructions}</p>}
                          {draft.supplierInstructions && <p className="line-clamp-1"><strong>Compliance:</strong> {draft.supplierInstructions}</p>}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className={`grid ${isArchived ? 'grid-cols-2' : 'grid-cols-2'} gap-1.5 pt-2 border-t border-slate-100`}>
                      <button
                        onClick={() => resumeDraftAction(draft)}
                        className="flex items-center justify-center gap-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 font-bold" /> Resume
                      </button>
                      
                      {!isArchived && (
                        <button
                          onClick={() => generatePoFromDraftAction(draft)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3 font-bold" /> Gen PO
                        </button>
                      )}

                      {!isArchived && (
                        <button
                          onClick={() => duplicatePurchaseOrderAction(draft)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3 font-bold" /> Clone
                        </button>
                      )}

                      {isArchived && (
                        <button
                          onClick={() => restoreDraftAction(draft.id)}
                          className="flex items-center justify-center gap-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 font-bold" /> Restore
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (isArchived) {
                            setConfirmDialog({
                              isOpen: true,
                              message: "Permanently delete this archived draft?",
                              onConfirm: () => {
                                deleteDraftAction(draft.id);
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          } else {
                            archiveDraftAction(draft.id);
                          }
                        }}
                        className={`flex items-center justify-center gap-1 py-1.5 ${isArchived ? 'bg-rose-50 border border-rose-250 text-rose-700 hover:bg-rose-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer`}
                      >
                        <Trash2 className="w-3 h-3" /> {isArchived ? 'Perm Delete' : 'Archive'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upgraded Select Feature Multi-Delete Floating Action Bar */}
          {selectedDraftIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 bg-slate-900/95 text-white py-3.5 px-6 rounded-2xl border border-slate-750 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 min-w-[300px] sm:min-w-[480px] backdrop-blur-md animate-slide-up text-left">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-650 rounded-full flex items-center justify-center text-[11px] font-black ring-4 ring-indigo-950/45 shrink-0">
                  {selectedDraftIds.length}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">Draft Purchase Orders Selected</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ready for quick bulk permanent deletion</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDraftIds([]);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      message: `WARNING: The ${selectedDraftIds.length} selected Purchase Order (PO) draft(s) will be permanently deleted and cannot be recovered back. Do you want to proceed and completely delete them?`,
                      onConfirm: () => {
                        setPoDrafts(prev => prev.filter(d => !selectedDraftIds.includes(d.id)));
                        selectedDraftIds.forEach(draftId => {
                          if (isCloudConnected && isOnline && user) {
                            try {
                              deleteDoc(doc(db, 'purchaseOrderDrafts', draftId));
                            } catch (e) {
                              console.warn("Could not clean cloud draft:", e);
                            }
                          }
                        });
                        showToast(`${selectedDraftIds.length} draft PO(s) permanently deleted completely.`, "success");
                        setSelectedDraftIds([]);
                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      }
                    });
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-rose-950/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* GORGEOUS LIVE DOCUMENT PREVIEW MODAL */}
          {previewDraft && (
            <div 
              className="fixed inset-0 z-55 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fade-in"
              onClick={() => setPreviewDraft(null)}
            >
              <div 
                className="w-auto flex flex-col relative my-8 overflow-hidden animate-slide-up shadow-2xl rounded-3xl bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header / Top Ribbon */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-t-3xl z-30">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-800 font-extrabold text-sm sm:text-base tracking-wider uppercase flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-600" />
                        Live Document Preview
                      </h3>
                      <span className="text-[9.5px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        A4 Print Ready
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                      Reviewing Draft: {previewDraft.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Download PDF */}
                    <button
                      onClick={() => generatePO_PDF({ po: previewDraft, inventory, formatNum, showToast, profile })}
                      title="Download PDF"
                      className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 border border-emerald-400/50"
                    >
                      <Download className="w-4 h-4 text-white drop-shadow-sm" />
                    </button>

                    {/* Edit Draft */}
                    <button
                      onClick={() => {
                        resumeDraftAction(previewDraft);
                        setPreviewDraft(null);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95 btn-interactive"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Draft
                    </button>

                    {/* Save in Receiving */}
                    <button
                      onClick={() => {
                        generatePoFromDraftAction(previewDraft);
                        setPreviewDraft(null);
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Receive
                    </button>

                    {/* Close Button */}
                    <button 
                      onClick={() => setPreviewDraft(null)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-205"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100/60 p-4 md:p-8 flex items-start justify-center overflow-x-auto">
                  <PurchaseOrderA4Preview po={previewDraft} profile={profile} inventory={inventory} formatNum={formatNum} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PO LIFE CYCLE fulfillment TRACKER */}
      {activeTab === 'receiving' && (
        <div className="space-y-4 text-left">

          {pendingOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-slate-900 text-sm font-black">No Procurement Records Yet</h4>
              <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed mt-1">
                Establish automatic recommendations or compile a manual draft purchase order list to begin dispatching supplier fulfillment documents.
              </p>
              <button
                onClick={() => {
                  // Completely refresh/reset draft states before entering Creator Workspace
                  setPoDraftItems([]);
                  setDraftSupplier('');
                  setPurchaseNotes('Please ensure all items meet standard quality checks before dispatch.');
                  setDeliveryInstructions(profile?.address || 'Shop #112, Main Business Market, Central Av.');
                  setSupplierInstructions('Any discrepancies in the invoice must be notified before shipping.');
                  setActiveDraftId(null);
                  setIsDuplicateReviewing(false);
                  setDuplicateWarningData(null);
                  setActiveTab('new_order');
                }}
                className="mt-6 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Create New PO Draft
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upgraded Selector 1 Header panel */}
              <div id="vmitra-receiving-header" className="flex justify-between items-center px-4 py-3.5 bg-white text-slate-800 rounded-2xl shadow-xs border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-700">
                    {filteredPendingPOs.length} Active Logistics Contract{filteredPendingPOs.length !== 1 && 's'} Found
                  </span>
                </div>
                <button 
                  onClick={() => setShowArchivedPOs(!showArchivedPOs)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-600 text-slate-600 hover:text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-200 hover:border-indigo-600"
                >
                  {showArchivedPOs ? 'Hide Archived' : 'Show Past 180 Days'}
                </button>
              </div>

              {filteredPendingPOs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold shadow-xs">
                  No orders match your global search criteria or status filter.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredPendingPOs.map((po) => {
                    const currentStatus = (po.status || 'pending').toLowerCase();
                    const isSelected = selectedPoIds.includes(po.id);
                    const isPopoverOpen = activePopoverPoId === po.id;
                    const hasDiscrepancy = po.items.some((it: any) => (it.qty - (it.receivedQty || 0)) > 0);

                    // Determine premium border-l indicator colors
                    const borderIndicatorColor = 
                      currentStatus === 'received' 
                        ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/10 to-white' 
                        : currentStatus === 'closed' 
                        ? 'border-l-rose-500 bg-gradient-to-r from-rose-50/10 to-white' 
                        : currentStatus === 'partially_received' || hasDiscrepancy 
                        ? 'border-l-amber-500 bg-gradient-to-r from-amber-50/10 to-white'
                        : 'border-l-indigo-600 bg-gradient-to-r from-indigo-50/10 to-white';

                    return (
                      <div 
                        key={po.id} 
                        className={`p-4 md:p-5 bg-white border border-slate-200 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex flex-row items-center justify-between gap-4 border-l-4 ${borderIndicatorColor} hover:border-slate-300 group`}
                      >
                        {/* CHECKBOX MULTI-SELECT OPTION */}
                        <div className="flex items-center shrink-0 pr-1 select-none">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPoIds(prev => [...prev, po.id]);
                              } else {
                                setSelectedPoIds(prev => prev.filter(id => id !== po.id));
                              }
                            }}
                            className="w-4.5 h-4.5 text-indigo-600 border-slate-350 rounded-md focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        {/* CLICK CARD SHOWS ONLY PREVIEW OF PO */}
                        <div 
                          onClick={() => setPreviewingPo(po)}
                          className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 text-left cursor-pointer select-none"
                          title="Click to view full Purchase Order Preview"
                        >
                          <div className="space-y-0.5 truncate col-span-2 sm:col-span-1 lg:col-span-1">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Supplier Entity</span>
                            <h4 className="text-xs md:text-sm font-extrabold text-slate-900 truncate" title={po.supplier}>
                              {po.supplier || 'Unknown Supplier'}
                            </h4>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">PO ID</span>
                            <span className="font-mono font-extrabold text-xs text-indigo-600 block truncate">
                              {po.id}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">PO Date</span>
                            <span className="text-xs text-slate-655 font-bold block">
                              {new Date(po.date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Ordered Lines</span>
                            <span className="text-xs text-slate-705 font-bold block">
                              {po.items.length} Product{po.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Sum Worth</span>
                            <span className="text-xs md:text-sm font-black text-slate-905 block">
                              ₹{formatNum(po.totalAmount || po.items.reduce((acc: number, c: any) => acc + (c.qty * (c.cost || 0)), 0))}
                            </span>
                          </div>

                          <div className="space-y-0.5 col-span-2 sm:col-span-1 lg:col-span-1">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Receiving Condition</span>
                            <div className="inline-block pt-0.5">
                              {currentStatus === 'received' ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Fully Received</span>
                                </span>
                              ) : currentStatus === 'closed' ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-lg">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Closed</span>
                                </span>
                              ) : currentStatus === 'partially_received' || hasDiscrepancy ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-lg animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Partial Received</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-lg">
                                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* THREE DOT ACTIONS DROPDOWN MENUS */}
                        <div className="relative shrink-0 flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePopoverPoId(isPopoverOpen ? null : po.id);
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-205 text-slate-700 border border-slate-205 rounded-xl transition-all cursor-pointer"
                            title="PO Options Control"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isPopoverOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden py-1.5 animate-fade-in text-slate-800 text-left">
                              {/* Option 1: Edit */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopoverPoId(null);
                                  handleEditPO(po);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-slate-55 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer text-slate-700"
                              >
                                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Edit PO</span>
                              </button>

                              {/* Option 2: Receive */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopoverPoId(null);
                                  openReceivingManager(po);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-slate-55 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer text-slate-705"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Receive</span>
                              </button>

                              {/* Option 3: Preview */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopoverPoId(null);
                                  setPreviewingPo(po);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-slate-55 transition-colors flex items-center gap-2.5 text-xs font-bold cursor-pointer text-slate-705"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Preview Invoice Sheet</span>
                              </button>

                              <div className="border-t border-slate-100 my-1 pb-1" />

                              {/* Option 4: Delete */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopoverPoId(null);
                                  deletePOAction(po.id);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-rose-50 text-rose-600 font-black transition-colors flex items-center gap-2.5 text-xs cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete PO</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}



              {/* Floating Multi-Delete Action Bar (Upgraded Selection Feature) */}
              {selectedPoIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-6 animate-fade-in font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
                      {selectedPoIds.length} PO{selectedPoIds.length !== 1 && 's'} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={deleteSelectedPOsAction}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Selected completely
                    </button>
                    <button
                      onClick={() => setSelectedPoIds([])}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10.5px] font-black uppercase transition-all cursor-pointer border border-slate-200"
                    >
                      Cancel select
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* (Receiving tab closes here later) */}
        </div>
      )}

      {/* TAB 4: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6 text-left">
          {/* Supplier Intel Section Compact Selector */}
          <div className="flex bg-slate-105 p-1 rounded-2xl border border-slate-200 self-start gap-1 max-w-fit mb-4 animate-fade-in">
            <button
              onClick={() => setHistorySubTab('suppliers')}
              className={`px-4 py-2 text-[10.5px] font-bold uppercase rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${historySubTab === 'suppliers' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Ledger ({supplierHistory.length})
            </button>
            <button
              onClick={() => setHistorySubTab('products')}
              className={`px-4 py-2 text-[10.5px] font-bold uppercase rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${historySubTab === 'products' ? 'bg-white text-indigo-700 shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" /> Purchase Logs ({Object.keys(productPurchaseRecords).length})
            </button>
          </div>

          <SupplierLedgerHub 
            supplierHistory={supplierHistory} 
            productPurchaseRecords={productPurchaseRecords} 
            inventory={inventory} 
            historySubTab={historySubTab as 'suppliers' | 'products'} 
            formatNum={formatNum} 
          />
        </div>
      )}

      {/* SUPPLIER ASSIGN POPUP DIALOG OVERLAY */}
      {assigningSupplierPid !== null && (
        <div className="fixed inset-0 z-55 bg-black/40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full space-y-4 shadow-xl">
            <div>
              <h3 className="text-slate-900 font-extrabold text-sm">Assign Preferred Supplier</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Define supplier linkage for smart splitter engine mapping</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier Name</label>
              <input
                type="text"
                placeholder="E.g., ABC Food Traders Ltd."
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 text-xs font-black">
              <button
                onClick={() => setAssigningSupplierPid(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuickSupplierAssign}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                Confirm Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MULTIPURPOSE ERROR MODALS / CONFIRMATION MODALS */}

      {/* Duplicate PO Generator Warning Modal (Feature 4) */}
      {duplicateWarningData !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl border border-slate-200/80 w-full max-w-sm p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-amber-500" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Warning</span>
                <h3 className="font-extrabold text-sm text-slate-900">Similar purchase order already exists.</h3>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-left">
              <p><strong>PO Number:</strong> {duplicateWarningData.poId}</p>
              <p><strong>Date:</strong> {new Date(duplicateWarningData.date!).toLocaleDateString()}</p>
              <p><strong>Supplier:</strong> {duplicateWarningData.supplier}</p>
              <p><strong>Status:</strong> {duplicateWarningData.status}</p>
            </div>

            <p className="text-[10px] text-slate-500 font-bold leading-tight">
              A very similar order was found within the last 30 days. To prevent duplicates, please review and confirm.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs font-black p-1 text-center">
              <button
                onClick={() => {
                  if (duplicateWarningData.mode === 'draft') {
                    generatePoFromDraftAction(duplicateWarningData.payload, true);
                  } else {
                    handleFinalizeCustomDraftFile(true);
                  }
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all cursor-pointer"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => {
                  setActiveTab('receiving');
                  setDuplicateWarningData(null);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Review Existing PO
              </button>
              <button
                onClick={() => setDuplicateWarningData(null)}
                className="w-full py-2 text-slate-500 hover:text-slate-800 underline uppercase text-[10px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY SUMMARY METRICS POPUP overlay (Feature 9) */}
      {summaryDataPopup !== null && (
        <div className="fixed inset-0 z-55 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl border border-slate-200/80 w-full max-w-lg p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
            {/* Top design accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Logistics Summary Document</span>
                <h3 className="font-extrabold text-sm text-slate-900">Inbound Delivery Complete: {summaryDataPopup.poId}</h3>
              </div>
            </div>

            {/* Metrics Bento Grid layout */}
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Styles Received</span>
                <span className="text-xl font-extrabold text-slate-800 block mt-0.5">
                  {summaryDataPopup.productsReceivedCount} / {summaryDataPopup.productsOrderedCount}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Distinct inventory styles</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Quantities</span>
                <span className="text-xl font-extrabold text-indigo-600 block mt-0.5">
                  +{formatNum(summaryDataPopup.inventoryUpdatedItems)} units
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">Added to stock balances</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Discrepancy Action</span>
                <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded mt-1.5 inline-block uppercase">
                  {summaryDataPopup.discrepancyAction.replace('_', ' ')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status Ledger State</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded mt-1.5 inline-block uppercase">
                  Fulfillment Logged
                </span>
              </div>
            </div>

            {/* Supplier History metrics check */}
            <div className="text-[11px] leading-relaxed bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <span className="font-extrabold text-slate-800 block">Fulfillment Analytics:</span>
              <p className="text-slate-500 font-medium">
                Merchant-approved discrepancy actions have been documented in <span className="font-bold text-slate-800">Supplier Ledger Records</span>. 
                Related business expense ledgers automatically capitalized on stock costs at standard tax and logical ratios.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSummaryDataPopup(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors text-center"
              >
                Close Metrics Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED FULL SCREEN INTAKE CONTROLLER */}
      {isIntakePageMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto text-slate-100 font-sans flex flex-col animate-fade-in text-left">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Package className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-left">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9.5px] font-black uppercase text-emerald-400 tracking-widest block">Live Terminal: Active</span>
                </div>
                <h2 className="text-sm font-extrabold text-white">Vyapar Mitra Dedicated Inbound Ingestion Station</h2>
              </div>
            </div>

            <button
              onClick={() => {
                setIsIntakePageMode(false);
                setSelectedPoIds([]);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all shadow-md active:scale-95"
            >
              <Minimize2 className="w-4 h-4 text-rose-450" /> Exit Terminal View
            </button>
          </div>

          <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
            {/* Terminal Main Board */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Panel: Statistics & Quick Tools */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Terminal Telemetry</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/30">
                      <span className="text-[8px] text-slate-450 uppercase tracking-widest font-extrabold block">TOTAL INBOUNDS</span>
                      <span className="text-base font-extrabold text-slate-100">{pendingOrders.length}</span>
                    </div>
                    <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/30">
                      <span className="text-[8px] text-slate-450 uppercase tracking-widest font-extrabold block">PENDING ITEMS</span>
                      <span className="text-base font-extrabold text-amber-400">
                        {pendingOrders.reduce((acc, p) => acc + p.items.filter((it: any) => !it.isClosed).length, 0)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/30 text-xs">
                    <span className="text-[8.5px] text-indigo-400 font-black uppercase tracking-wider block mb-1">AI Scan Queue Status</span>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-bold uppercase">
                      READY TO INGEST NEW INVOICES USING GEMINI FLASH INTELLIGENCE. DRAG & DROP FOR IMMEDIATE VERIFICATION.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl">
                  <span className="text-[8.5px] font-black text-indigo-450 block tracking-widest uppercase mb-1">Guidelines & Compliance Checklist</span>
                  <ul className="text-[10.5px] text-slate-400 space-y-2 leading-relaxed text-left font-semibold">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">1.</span>
                      <span>Verify box physical packaging integrity upon offloading before checking values.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">2.</span>
                      <span>Scan outer barcode with quick search bar or upload supplier invoices.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">3.</span>
                      <span>Audit arriving stock quantities, edit any changed unit purchase costs, and sign fulfillment state.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Panel: Orders Grid list */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center bg-slate-900/30 p-4 rounded-xl border border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      {filteredPendingPOs.length} Procurement Contracts waiting check-in
                    </span>
                  </div>
                  
                  {selectedPoIds.length > 0 && (
                    <button
                      onClick={deleteSelectedPOsAction}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow"
                    >
                      Delete Selected ({selectedPoIds.length})
                    </button>
                  )}
                </div>

                {filteredPendingPOs.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl text-xs font-semibold">
                    No matching inbound contracts found in repository.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPendingPOs.map(po => {
                      const currentStatus = po.status || 'GENERATED';
                      const isSelected = selectedPoIds.includes(po.id);
                      const hasDiscrepancy = po.items.some((it: any) => (it.qty - (it.receivedQty || 0)) > 0);

                      const statusBadge = 
                        currentStatus === 'RECEIVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : currentStatus === 'CANCELLED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : hasDiscrepancy
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

                      return (
                        <div 
                          key={po.id} 
                          className={`p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-slate-700 hover:bg-slate-800 transition-all ${
                            isSelected ? 'ring-2 ring-indigo-500 border-indigo-500/80 bg-slate-800' : ''
                          }`}
                        >
                          <div className="absolute top-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Top row controls */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPoIds(prev => [...prev, po.id]);
                                  } else {
                                    setSelectedPoIds(prev => prev.filter(id => id !== po.id));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 border-slate-801 rounded-md focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                              />
                              <span className="font-mono text-xs font-black text-indigo-455">{po.id}</span>
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${statusBadge}`}>
                              {currentStatus === 'RECEIVED' ? 'Received' : currentStatus === 'CANCELLED' ? 'Cancelled' : hasDiscrepancy ? 'Partial' : 'Procured'}
                            </span>
                          </div>

                          {/* Meta */}
                          <div className="space-y-2 mt-1 flex-1">
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">Supplier Contract</span>
                              <h4 className="text-xs font-extrabold text-slate-200 truncate" title={po.supplier}>{po.supplier}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                              <div>
                                <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-black block">PO Date</span>
                                <span className="text-slate-350 font-bold">{new Date(po.date).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-black block">Inbound Volume</span>
                                <span className="text-slate-350 font-bold">{po.items.length} Product line(s)</span>
                              </div>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-slate-800/60 my-1" />

                          {/* Pricing & Receives triggers */}
                          <div className="flex items-center justify-between mt-1">
                            <div>
                              <span className="text-[7.5px] text-slate-500 uppercase tracking-widest font-black block">Contract Worth</span>
                              <span className="text-xs font-black text-slate-100">
                                ₹{formatNum(po.totalAmount || po.items.reduce((acc: number, c: any) => acc + (c.qty * (c.cost || 0)), 0))}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Preview trigger */}
                              <button
                                onClick={() => setPreviewingPo(po)}
                                className="p-2 bg-slate-850 hover:bg-slate-700 text-slate-350 rounded-lg text-xs cursor-pointer border border-slate-750"
                                title="Preview PO"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {currentStatus !== 'RECEIVED' && currentStatus !== 'CANCELLED' ? (
                                <button
                                  onClick={() => openReceivingManager(po)}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" /> Ingest
                                </button>
                              ) : (
                                <span className="text-[9.5px] font-extrabold uppercase text-slate-500 px-1">
                                  Logged
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover micro delete action */}
                          <button
                            onClick={() => deletePOAction(po.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:bg-rose-955/40 p-1.5 rounded-lg text-rose-400 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
                            title="Completely Delete PO Contract"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

          {/* EXTREMELY PREMIUM PURCHASE ORDER PREVIEW MODAL */}
          {previewingPo !== null && (
            <div 
              className="fixed inset-0 z-55 bg-slate-950/65 backdrop-blur-3xs flex items-start justify-center p-4 overflow-y-auto animate-fade-in text-slate-900"
              onClick={() => setPreviewingPo(null)}
            >
              <div 
                className="w-auto flex flex-col relative my-8 overflow-hidden animate-slide-up shadow-2xl rounded-3xl bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-650 rounded-t-3xl z-40" />

                {/* Modal Header */}
                <div className="px-6 py-4.5 bg-slate-900 text-white flex justify-between items-center text-left rounded-t-3xl border-b border-white/10 z-30">
              <div>
                <span className="text-[8.5px] font-black uppercase text-indigo-400 tracking-widest block font-sans">Interactive Document Studio</span>
                <h3 className="font-extrabold text-sm text-slate-100 font-sans">Official Purchase Order Preview: {previewingPo.id}</h3>
              </div>
              <button 
                onClick={() => setPreviewingPo(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-800 rounded-xl p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print/Preview area wrapper */}
            <div className="bg-slate-100/60 p-4 md:p-8 flex items-start justify-center overflow-x-auto">
              <PurchaseOrderA4Preview po={previewingPo} profile={profile} inventory={inventory} formatNum={formatNum} />
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3.5 z-10 shrink-0 rounded-b-3xl">
              <button
                onClick={() => generatePO_PDF({ po: previewingPo, inventory, formatNum, showToast, profile })}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Official PDF
              </button>
              <button
                onClick={() => setPreviewingPo(null)}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-black uppercase transition-all cursor-pointer active:scale-95"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-scale-up text-center border border-slate-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-200/50">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Are you sure?</h3>
            <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
