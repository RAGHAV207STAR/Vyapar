import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc, serverTimestamp, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { InventoryItem, StockMovement } from '../types';
import { useBilling } from './BillingContext';

interface InventoryContextType {
  inventory: InventoryItem[];
  movements: StockMovement[];
  isLoading: boolean;
  addProduct: (product: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, quantityChange: number, reason: string, type: 'IN' | 'OUT', referenceId?: string, actionType?: string) => Promise<void>;
  reduceStockForInvoice: (items: { productId: string; quantity: number }[], billId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isCloudConnected, isOnline, setSyncError } = useBilling();
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const cachedAuth = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cachedAuth) {
        const parsedUser = JSON.parse(cachedAuth);
        const cached = localStorage.getItem(`sb_inventory_${parsedUser.uid}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });
  
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const cachedAuth = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cachedAuth) {
        const parsedUser = JSON.parse(cachedAuth);
        const cached = localStorage.getItem(`sb_movements_${parsedUser.uid}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setMovements([]);
      setIsLoading(false);
      return;
    }

    // Helper function to safely fetch/serialize database date strings (handles Timestamps safely)
    const ensureISOString = (val: any): string => {
      if (!val) return new Date().toISOString();
      if (typeof val === 'string') return val;
      if (val.seconds !== undefined) {
        return new Date(val.seconds * 1000).toISOString();
      }
      if (val && typeof val.toDate === 'function') {
        return val.toDate().toISOString();
      }
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      } catch (_) {}
      return new Date().toISOString();
    };

    try {
      if (isCloudConnected && isOnline) {
        // Guard checking that actual Firebase Authentication has completed and matches the local user
        if (!user || !user.uid) {
          setIsLoading(false);
          return;
        }

        // Fetch inventory real-time
        const invRef = collection(db, 'inventory');
        const qInv = query(invRef, where('userId', '==', user.uid));
        
        const unsubInv = onSnapshot(qInv, (invSnap) => {
          const fetchedInventory: InventoryItem[] = [];
          invSnap.forEach(docSnap => {
            const docData = docSnap.data() as InventoryItem;
            fetchedInventory.push({
              ...docData,
              createdAt: ensureISOString(docData.createdAt)
            });
          });
          setInventory(fetchedInventory);
          localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(fetchedInventory));
          setIsLoading(false);
        }, (error) => {
          console.warn("Could not fetch inventory from cloud, using local cache. Error:", error);
          setIsLoading(false);
        });

        // Fetch movements real-time
        const movRef = collection(db, 'stockMovements');
        const qMov = query(movRef, where('userId', '==', user.uid));
        const unsubMov = onSnapshot(qMov, (movSnap) => {
          const fetchedMovements: StockMovement[] = [];
          movSnap.forEach(docSnap => {
            const docData = docSnap.data() as StockMovement;
            fetchedMovements.push({
              ...docData,
              date: ensureISOString(docData.date)
            });
          });
          fetchedMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setMovements(fetchedMovements);
          localStorage.setItem(`sb_movements_${user.uid}`, JSON.stringify(fetchedMovements));
        }, (error) => {
           console.warn("Could not fetch movements from cloud. Error:", error);
        });

        return () => {
          unsubInv();
          unsubMov();
        };
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.warn("Could not fetch inventory from cloud, using local cache. Error:", e);
      setIsLoading(false);
    }
  }, [user, isCloudConnected, isOnline]);

  useEffect(() => {
    let cleanup = () => {};
    fetchInventoryData().then((res: any) => {
      if (typeof res === 'function') {
        cleanup = res;
      }
    });
    return () => cleanup();
  }, [fetchInventoryData]);

  useEffect(() => {
    const handleReconcile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.updatedItem) {
        const item = customEvent.detail.updatedItem;
        setInventory(prev => prev.map(inv => inv.id === item.id ? item : inv));
      }
    };
    window.addEventListener('inventory_local_reconciled', handleReconcile);
    return () => window.removeEventListener('inventory_local_reconciled', handleReconcile);
  }, []);

  const generateSKU = (name: string, currentInventory: InventoryItem[]) => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    let prefix = cleanName.substring(0, 3).toUpperCase();
    if (prefix.length < 3) {
      prefix = prefix.padEnd(3, 'X');
    }
    
    const matchingSKUs = currentInventory
      .filter(i => i.sku && i.sku.startsWith(`${prefix}-`))
      .map(i => i.sku as string);
      
    let maxNum = 0;
    matchingSKUs.forEach(sku => {
      const parts = sku.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `${prefix}-${nextNum}`;
  };

  const addProduct = async (productInfo: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error("Must be logged in");

    const exists = inventory.some(p => p.name.toLowerCase() === productInfo.name.toLowerCase() || (productInfo.sku && p.sku === productInfo.sku));
    if (exists) {
        throw new Error("This product already exists in your inventory.");
    }

    const id = `item_${Date.now()}`;
    const newProduct: InventoryItem = {
      ...productInfo,
      sku: productInfo.sku || generateSKU(productInfo.name, inventory),
      id,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    const updatedInventory = [...inventory, newProduct];
    setInventory(updatedInventory);
    localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(updatedInventory));

    if (isCloudConnected && isOnline) {
      try {
        setDoc(doc(db, 'inventory', id), cleanUndefined(newProduct)).then(() => {
          setSyncError(null);
        }).catch(err => {
          setSyncError(`Background Stock Sync Failed for SKU: ${newProduct.sku}`);
          console.warn('Sync error adding product inventory document:', err);
        });
      } catch (err) {
        setSyncError(`Background Stock Sync Failed for SKU: ${newProduct.sku}`);
        console.warn('Exception preparing inventory cloud doc write:', err);
      }
    }

    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
      productId: id,
      productName: newProduct.name,
      date: new Date().toISOString(),
      type: 'IN',
      quantity: newProduct.stock,
      reason: 'Opening Stock',
      sku: newProduct.sku,
      previousStock: 0,
      newStock: newProduct.stock,
      actionType: 'Product Created'
    };

    const updatedMovements = [movement, ...movements];
    setMovements(updatedMovements);
    localStorage.setItem(`sb_movements_${user.uid}`, JSON.stringify(updatedMovements));

    if (isCloudConnected && isOnline) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'stockMovements', movement.id), cleanUndefined(movement));
        batch.commit().then(() => {
          setSyncError(null);
        }).catch(err => {
          setSyncError(`Background Stock Sync Failed for opening stock movement.`);
          console.warn('Sync error adding product movement document:', err);
        });
      } catch (e) {
        setSyncError(`Background Stock Sync Failed for opening stock movement.`);
        console.warn('Sync setup error for opening stock movement:', e);
      }
    }
  };

  const updateProduct = async (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>>) => {
    if (!user) throw new Error("Must be logged in");
    
    if (updates.name || updates.sku) {
      const exists = inventory.some(p => p.id !== id && (
          (updates.name && p.name.toLowerCase() === updates.name.toLowerCase()) || 
          (updates.sku && p.sku === updates.sku)
      ));
      if (exists) {
        throw new Error("This product name or SKU already exists in your inventory.");
      }
    }

    // Allow updating 'stock' only via adjustStock usually, but in case edit specifies it
    const updatedInventory = inventory.map(item => {
      if (item.id === id) {
        const merged = { ...item, ...updates };
        if (!merged.sku) {
          merged.sku = generateSKU(merged.name, inventory.filter(i => i.id !== id));
        }
        return merged;
      }
      return item;
    });
    setInventory(updatedInventory);
    localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(updatedInventory));

    if (isCloudConnected && isOnline) {
      const dbItem = updatedInventory.find(i => i.id === id);
      if (dbItem) {
        try {
          setDoc(doc(db, 'inventory', id), cleanUndefined(dbItem), { merge: true }).then(() => {
            setSyncError(null);
          }).catch(err => {
            setSyncError(`Background Stock Sync Failed for updated item: ${dbItem.sku || dbItem.name}`);
            console.warn('Sync error updating product doc in background:', err);
          });
        } catch (err) {
          setSyncError(`Background Stock Sync Failed for updated item: ${updates.sku || id}`);
          console.warn('Exception preparing product update cloud doc write:', err);
        }
      }
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    const targetItem = inventory.find(i => i.id === id);
    const updatedInventory = inventory.filter(item => item.id !== id);
    setInventory(updatedInventory);
    localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(updatedInventory));

    if (isCloudConnected && isOnline) {
      try {
        deleteDoc(doc(db, 'inventory', id)).then(() => {
          setSyncError(null);
        }).catch(err => {
          setSyncError(`Background Stock Sync Failed: Could not delete product ${targetItem?.sku || id}`);
          console.warn('Sync error deleting product doc in background:', err);
        });
      } catch (err) {
        setSyncError(`Background Stock Sync Failed: Could not delete product ${id}`);
        console.warn('Exception preparing product deletion cloud doc write:', err);
      }
    }
  };

  const adjustStock = async (productId: string, quantityChange: number, reason: string, type: 'IN' | 'OUT', referenceId?: string, actionType?: string) => {
    if (!user) throw new Error("Must be logged in");
    if (quantityChange < 0) return;

    const product = inventory.find(i => i.id === productId);
    if (!product) throw new Error("Product not found");

    const previousStock = product.stock;
    const newStock = type === 'IN' ? previousStock + quantityChange : previousStock - quantityChange;
    const resolvedActionType = actionType || (type === 'IN' ? 'Stock Added' : 'Stock Reduced');
    
    // Create movement
    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.uid,
      productId,
      productName: product.name,
      date: new Date().toISOString(),
      type,
      quantity: quantityChange,
      reason,
      referenceId,
      sku: product.sku,
      previousStock,
      newStock,
      actionType: resolvedActionType
    };

    // Update state
    const updatedInventory = inventory.map(item => item.id === productId ? { ...item, stock: newStock } : item);
    const updatedMovements = [movement, ...movements];
    
    setInventory(updatedInventory);
    setMovements(updatedMovements);
    localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(updatedInventory));
    localStorage.setItem(`sb_movements_${user.uid}`, JSON.stringify(updatedMovements));

    if (isCloudConnected && isOnline) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'stockMovements', movement.id), cleanUndefined(movement));
        batch.set(doc(db, 'inventory', product.id), { stock: newStock }, { merge: true });
        batch.commit().then(() => {
          setSyncError(null);
        }).catch(err => {
          setSyncError(`Background Stock Sync Failed for updated SKU: ${product.sku || product.name}`);
          console.warn('Asynchronous cloud sync error for stock movement:', err);
        });
      } catch (e) {
        setSyncError(`Background Stock Sync Failed for updated SKU: ${product.sku || product.name}`);
        console.warn('Cloud sync setup error for stock movement:', e);
      }
    }
  };

  const reduceStockForInvoice = async (items: { productId: string; quantity: number }[], billId: string) => {
    if (!user) return;
    
    // Filter valid mapped items
    const validItems = items.filter(i => inventory.some(inv => inv.id === i.productId));
    if (validItems.length === 0) return;

    let localInv = [...inventory];
    let localMov = [...movements];
    let writes = [];

    const date = new Date().toISOString();

    for (const item of validItems) {
      if (item.quantity <= 0) continue;
      const product = localInv.find(i => i.id === item.productId);
      if (!product) continue;

      const previousStock = product.stock;
      const newStock = previousStock - item.quantity;
      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: user.uid,
        productId: item.productId,
        productName: product.name,
        date,
        type: 'OUT',
        quantity: item.quantity,
        reason: `Invoice ${billId}`,
        referenceId: billId,
        sku: product.sku,
        previousStock,
        newStock,
        actionType: 'Invoice Generated'
      };

      localInv = localInv.map(inv => inv.id === item.productId ? { ...inv, stock: newStock } : inv);
      localMov = [movement, ...localMov];
      
      writes.push({ movement, product: { id: product.id, newStock } });
    }

    setInventory(localInv);
    setMovements(localMov);
    localStorage.setItem(`sb_inventory_${user.uid}`, JSON.stringify(localInv));
    localStorage.setItem(`sb_movements_${user.uid}`, JSON.stringify(localMov));

    if (isCloudConnected && isOnline && writes.length > 0) {
      try {
        const batch = writeBatch(db);
        for (const w of writes) {
          batch.set(doc(db, 'stockMovements', w.movement.id), cleanUndefined(w.movement));
          batch.set(doc(db, 'inventory', w.product.id), { stock: w.product.newStock }, { merge: true });
        }
        // Execute Firebase synchronization in the background to ensure instantaneous local UI response
        batch.commit().catch(e => {
          console.warn('Failed cloud batch write for invoice stock deduction', e);
        });
      } catch (e) {
        console.warn('Error setting up batch write for invoice stock deduction', e);
      }
    }
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      movements,
      isLoading,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      reduceStockForInvoice
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};
