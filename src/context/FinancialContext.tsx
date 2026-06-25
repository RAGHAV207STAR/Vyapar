import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FinancialTransaction } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useBilling } from './BillingContext';

interface FinancialContextType {
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'businessId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  loading: boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { profile, isOnline, isCloudConnected } = useBilling();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    if (profile?.businessId) {
      try {
        const cached = localStorage.getItem(`sb_financial_${profile.businessId}`);
        return cached ? JSON.parse(cached) : [];
      } catch (_) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  // Sync internal local storage when business ID changes
  useEffect(() => {
    if (!profile?.businessId) {
      setTransactions([]);
      return;
    }
    try {
      const cached = localStorage.getItem(`sb_financial_${profile.businessId}`);
      if (cached) {
        setTransactions(JSON.parse(cached));
      } else {
        setTransactions([]);
      }
    } catch (_) {}
  }, [profile?.businessId]);

  // Handle Firebase real-time subscription
  useEffect(() => {
    if (!profile?.businessId || !isCloudConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'financial_transactions'),
      where('businessId', '==', profile.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudTxs: FinancialTransaction[] = [];
      snapshot.forEach((doc) => {
        cloudTxs.push({ id: doc.id, ...doc.data(), isSynced: true } as FinancialTransaction);
      });

      setTransactions((prev) => {
        const localUnsynced = prev.filter(tx => !tx.isSynced);
        const merged = [...localUnsynced];
        
        cloudTxs.forEach((ctx) => {
          if (!merged.some(mtx => mtx.id === ctx.id)) {
            merged.push(ctx);
          }
        });

        // Sort client-side descending by transactionDate or createdAt
        merged.sort((a, b) => new Date(b.transactionDate || b.createdAt).getTime() - new Date(a.transactionDate || a.createdAt).getTime());
        
        try {
          localStorage.setItem(`sb_financial_${profile.businessId}`, JSON.stringify(merged));
        } catch (_) {}

        return merged;
      });
      setLoading(false);
    }, (error) => {
      console.warn("[Financial System] onSnapshot Firestore diagnostic error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.businessId, isOnline, isCloudConnected]);

  // Sync offline-pending financial transactions whenever we are online
  useEffect(() => {
    if (!profile?.businessId || !isOnline || !isCloudConnected || !auth.currentUser) return;

    const unsynced = transactions.filter(tx => !tx.isSynced);
    if (unsynced.length === 0) return;

    unsynced.forEach(async (tx) => {
      try {
        const docRef = doc(db, 'financial_transactions', tx.id);
        const { isSynced, ...cleanTx } = tx;
        await setDoc(docRef, {
          ...cleanTx,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        setTransactions(prev => {
          const updated = prev.map(ptx => ptx.id === tx.id ? { ...ptx, isSynced: true } : ptx);
          try {
            localStorage.setItem(`sb_financial_${profile.businessId}`, JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
      } catch (err) {
        console.warn("[Financial System] Background financial sync error:", err);
      }
    });
  }, [profile?.businessId, isOnline, isCloudConnected, transactions]);

  const addTransaction = async (tx: Omit<FinancialTransaction, 'id' | 'businessId' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!profile?.businessId || !auth.currentUser) {
      throw new Error('Not authenticated');
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTx: FinancialTransaction = {
      ...tx,
      id: txId,
      businessId: profile.businessId,
      createdBy: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false
    };

    // Save locally first immediately
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    try {
      localStorage.setItem(`sb_financial_${profile.businessId}`, JSON.stringify(updated));
    } catch (_) {}

    // Async Cloud sync
    if (isOnline && isCloudConnected) {
      try {
        const docRef = doc(db, 'financial_transactions', txId);
        const { isSynced, ...cleanTx } = newTx;
        setDoc(docRef, {
          ...cleanTx,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).then(() => {
          setTransactions(prev => {
            const updatedList = prev.map(ptx => ptx.id === txId ? { ...ptx, isSynced: true } : ptx);
            try {
              localStorage.setItem(`sb_financial_${profile.businessId}`, JSON.stringify(updatedList));
            } catch (_) {}
            return updatedList;
          });
        }).catch((err) => {
          console.warn("[Financial System] Background sync error setting transaction document async:", err);
        });
      } catch (e) {
        console.warn("[Financial System] Setup error for async transaction upload:", e);
      }
    }
  };

  return (
    <FinancialContext.Provider value={{ transactions, addTransaction, loading }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
