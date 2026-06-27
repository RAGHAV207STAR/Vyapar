/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, isFirebasePlaceholder, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { UserProfile, Bill, ProductItem, CustomerDetails, Toast, ConfirmConfig, DataCollisionSession, Customer } from '../types';

interface BillingContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  profile: UserProfile | null;
  bills: Bill[];
  customers: Customer[];
  isLoading: boolean;
  isOnline: boolean;
  isCloudConnected: boolean; // True if real Firebase is working
  isSandboxOnly: boolean; // Force local storage mock environment
  setIsSandboxOnly: (sandbox: boolean) => void;
  syncPendingCount: number;
  login: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string, isSignUp: boolean, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profileData: Omit<UserProfile, 'uid' | 'email' | 'createdAt'>) => Promise<void>;
  createBill: (
    customerDetails: CustomerDetails, 
    products: ProductItem[], 
    paymentMode: any, 
    paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE', 
    discountPercent?: number, 
    discountAmount?: number, 
    paidAmount?: number, 
    otherDetails?: any,
    gstPercent?: number,
    gstAmount?: number,
    cgstAmount?: number,
    sgstAmount?: number,
    igstAmount?: number,
    notes?: string
  ) => Promise<Bill>;
  updateBill: (
    billId: string,
    customerDetails: CustomerDetails, 
    products: ProductItem[], 
    paymentMode: any, 
    paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE', 
    discountPercent?: number, 
    discountAmount?: number, 
    paidAmount?: number, 
    otherDetails?: any,
    gstPercent?: number,
    gstAmount?: number,
    cgstAmount?: number,
    sgstAmount?: number,
    igstAmount?: number,
    notes?: string
  ) => Promise<Bill>;
  deleteBill: (billId: string) => Promise<void>;
  saveCustomer: (customerData: Omit<Customer, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateBillPayment: (
    billId: string, 
    paidAmount: number, 
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE'
  ) => Promise<void>;
  syncDataOfflineFirst: () => Promise<void>;
  clearLocalHistory: () => void;
  initiateSoftDelete: (verificationMethod: 'password' | 'google') => Promise<void>;
  recoverAccount: () => Promise<void>;
  permanentPurgeAccount: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  syncError: string | null;
  setSyncError: (error: string | null) => void;
  authStatusText: string | null;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmConfig | null;
  showConfirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
  activeCollision: DataCollisionSession | null;
  setActiveCollision: (session: DataCollisionSession | null) => void;
  resolveCollision: (strategy: 'local' | 'cloud' | 'merge', mergedPayload: any) => Promise<void>;
  isIntelligentContinuityActive: boolean;
  lastSyncTimestamp: string | null;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSandboxOnly, setIsSandboxOnlyState] = useState(() => {
    return localStorage.getItem('vyapar_sandbox_only') === 'true';
  });
  
  const [authStatusText, setAuthStatusText] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmConfig | null>(null);
  const [activeCollision, setActiveCollision] = useState<DataCollisionSession | null>(null);
  const unsubListenersRef = React.useRef<(() => void)[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    // Sanitization layer to avoid leaking technical details
    const sanitizedVal = (() => {
      if (!message) return "";
      const lower = message.toLowerCase();
      const hasTechnicalTerm = 
        lower.includes('firebase') || 
        lower.includes('firestore') || 
        lower.includes('quota') || 
        lower.includes('exhausted') || 
        lower.includes('resource-exhausted') || 
        lower.includes('unavailable') || 
        lower.includes('deadline') || 
        lower.includes('permission') || 
        lower.includes('internal error') || 
        lower.includes('network') ||
        lower.includes('stack trace') ||
        lower.includes('limit exceeded') ||
        lower.includes('backoff') ||
        lower.includes('code=') ||
        lower.includes('fstore') ||
        lower.includes('auth/');

      if (hasTechnicalTerm) {
        return "Your work is safely saved. Some updates will sync automatically when cloud services become available.";
      }
      return message;
    })();

    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message: sanitizedVal, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmDialog(config);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const setIsSandboxOnly = (val: boolean) => {
    setIsSandboxOnlyState(val);
    localStorage.setItem('vyapar_sandbox_only', String(val));
  };

  const isCloudConnected = !isSandboxOnly && !isFirebasePlaceholder && auth && db;

  const [user, setUser] = useState<BillingContextType['user']>(() => {
    try {
      const cached = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Could not read vyapar cached user", e);
    }
    return null;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cachedUser = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        const cachedProfile = localStorage.getItem(`sb_profile_${parsedUser.uid}`);
        if (cachedProfile) {
          return JSON.parse(cachedProfile);
        }
      }
    } catch (e) {
      console.warn("Could not read vyapar cached profile", e);
    }
    return null;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const cachedUser = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        const cachedBills = localStorage.getItem(`sb_bills_${parsedUser.uid}`);
        if (cachedBills) {
          return JSON.parse(cachedBills);
        }
      }
    } catch (e) {
      console.warn("Could not read vyapar cached bills", e);
    }
    return [];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const cachedUser = localStorage.getItem('vyapar_cached_user') || localStorage.getItem('sb_session_user');
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser);
        const cachedCustomers = localStorage.getItem(`sb_customers_${parsedUser.uid}`);
        if (cachedCustomers) {
          return JSON.parse(cachedCustomers);
        }
      }
    } catch (e) {
      console.warn("Could not read vyapar cached customers", e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [isIntelligentContinuityActive, setIsIntelligentContinuityActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vyapar_intelligent_continuity_active') === 'true' || (window as any).__intelligentContinuityActive === true;
    } catch (_) {
      return false;
    }
  });

  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vyapar_last_successful_sync');
    } catch (_) {
      return null;
    }
  });

  const markSyncSuccess = useCallback(() => {
    try {
      const nowStr = new Date().toISOString();
      localStorage.setItem('vyapar_last_successful_sync', nowStr);
      setLastSyncTimestamp(nowStr);
      localStorage.removeItem('vyapar_intelligent_continuity_active');
      setIsIntelligentContinuityActive(false);
      (window as any).__intelligentContinuityActive = false;
    } catch (_) {}
  }, []);

  useEffect(() => {
    // Legacy sandbox cleanup on load
    localStorage.removeItem('vyapar_intelligent_continuity_active');
    localStorage.removeItem('vyapar_sandbox_only');
    setIsSandboxOnlyState(false);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Pre-seed offline user simulation credentials
    // Removed dummy data for production


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate pending unsynced bills
  useEffect(() => {
    const unsynced = bills.filter(b => !b.isSynced).length;
    setSyncPendingCount(unsynced);
  }, [bills]);

  // Load local storage fallback on startup
  const loadLocalData = useCallback((uid: string) => {
    // Load local Profile
    const cachedProfile = localStorage.getItem(`sb_profile_${uid}`);
    if (cachedProfile) {
      try {
        setProfile(JSON.parse(cachedProfile));
      } catch (e) {
        console.error("Error parsing cached profile", e);
      }
    } else {
      setProfile(null);
    }

    // Load local Bills
    const cachedBills = localStorage.getItem(`sb_bills_${uid}`);
    if (cachedBills) {
      try {
        setBills(JSON.parse(cachedBills));
      } catch (e) {
        console.error("Error parsing cached bills", e);
      }
    } else {
      setBills([]);
    }
  }, []);

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

  const migrateSandboxDataToCloudUser = (firebaseUid: string) => {
    try {
      const mockUids = [
        'mock_user_merchant_smartvyapar_com',
        'mock_user_merchant_vyaparmitra_com'
      ];
      for (const mockUid of mockUids) {
        console.log(`[DATA MIGRATION] Scanning sandbox/mock data under UID ${mockUid} for migration to real UID ${firebaseUid}...`);
        
        // 1. Migrate Profile
        const mockProfileStr = localStorage.getItem(`sb_profile_${mockUid}`);
        const cloudProfileStr = localStorage.getItem(`sb_profile_${firebaseUid}`);
        if (mockProfileStr && !cloudProfileStr) {
          try {
            const parsedProfile = JSON.parse(mockProfileStr);
            if (parsedProfile) {
              parsedProfile.uid = firebaseUid;
              localStorage.setItem(`sb_profile_${firebaseUid}`, JSON.stringify(parsedProfile));
              setProfile(parsedProfile);
              console.log(`[DATA MIGRATION] Migrated profile successfully.`);
            }
          } catch (pe) {
            console.error("Failed parsing mock profile during migration:", pe);
          }
        }

        // 2. Migrate Bills
        const mockBillsStr = localStorage.getItem(`sb_bills_${mockUid}`);
        const cloudBillsStr = localStorage.getItem(`sb_bills_${firebaseUid}`);
        if (mockBillsStr && (!cloudBillsStr || JSON.parse(cloudBillsStr).length === 0)) {
          try {
            const parsedBills = JSON.parse(mockBillsStr) as Bill[];
            if (Array.isArray(parsedBills) && parsedBills.length > 0) {
              const migratedBills = parsedBills.map(b => ({
                ...b,
                userId: firebaseUid,
                userUid: firebaseUid,
                isSynced: false // Force sync to the cloud
              }));
              localStorage.setItem(`sb_bills_${firebaseUid}`, JSON.stringify(migratedBills));
              setBills(migratedBills);
              console.log(`[DATA MIGRATION] Migrated ${migratedBills.length} bills successfully and marked for sync.`);
            }
          } catch (be) {
            console.error("Failed parsing mock bills during migration:", be);
          }
        }

        // 3. Migrate Inventory
        const mockInvStr = localStorage.getItem(`sb_inventory_${mockUid}`);
        const cloudInvStr = localStorage.getItem(`sb_inventory_${firebaseUid}`);
        if (mockInvStr && (!cloudInvStr || JSON.parse(cloudInvStr).length === 0)) {
          try {
            const parsedInv = JSON.parse(mockInvStr);
            if (Array.isArray(parsedInv) && parsedInv.length > 0) {
              const migratedInv = parsedInv.map(item => ({
                ...item,
                userId: firebaseUid
              }));
              localStorage.setItem(`sb_inventory_${firebaseUid}`, JSON.stringify(migratedInv));
              console.log(`[DATA MIGRATION] Migrated ${migratedInv.length} inventory products successfully.`);
            }
          } catch (ie) {
            console.error("Failed parsing mock inventory during migration:", ie);
          }
        }

        // 4. Migrate Stock Movements
        const mockMovStr = localStorage.getItem(`sb_movements_${mockUid}`);
        const cloudMovStr = localStorage.getItem(`sb_movements_${firebaseUid}`);
        if (mockMovStr && (!cloudMovStr || JSON.parse(cloudMovStr).length === 0)) {
          try {
            const parsedMov = JSON.parse(mockMovStr);
            if (Array.isArray(parsedMov) && parsedMov.length > 0) {
              const migratedMov = parsedMov.map(m => ({
                ...m,
                userId: firebaseUid
              }));
              localStorage.setItem(`sb_movements_${firebaseUid}`, JSON.stringify(migratedMov));
              console.log(`[DATA MIGRATION] Migrated ${migratedMov.length} stock movements successfully.`);
            }
          } catch (me) {
            console.error("Failed parsing mock movements during migration:", me);
          }
        }
      }
    } catch (err) {
      console.warn("Error running sandbox-to-cloud migration:", err);
    }
  };

  // Fetch from firestore if possible
  const fetchCloudData = useCallback(async (uid: string, skipProfileFetch = false) => {
    if (!isCloudConnected) return;

    try {
      let profilePromise: Promise<void> | null = null;
      let billsPromise: Promise<void> | null = null;

      // 1. Fetch Profile
      if (!skipProfileFetch) {
        profilePromise = (async () => {
          const profileRef = doc(db, 'users', uid);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const cloudProfile = profileSnap.data() as UserProfile;
            const normalizedProfile = {
              ...cloudProfile,
              createdAt: ensureISOString(cloudProfile.createdAt)
            };
            setProfile(normalizedProfile);
            localStorage.setItem(`sb_profile_${uid}`, JSON.stringify(normalizedProfile));
            localStorage.setItem(`sb_profile_exists_${uid}`, 'true');
          }
        })();
      }

      // 2. Fetch Bills in parallel
      billsPromise = (async () => {
        const billsRef = collection(db, 'bills');
        const q = query(billsRef, where('userId', '==', uid));
        const billsSnap = await getDocs(q);
        const cloudBills: Bill[] = [];
        
        billsSnap.forEach((docSnap) => {
          const data = docSnap.data() as Bill;
          const normalizedBill = {
            ...data,
            createdAt: ensureISOString(data.createdAt),
            isSynced: true
          };
          cloudBills.push(normalizedBill);
        });

        // Sort by creation date descending
        cloudBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // If we are online and have cloud bills, we reconcile.
        setBills((prevBills) => {
          const unsyncedLocal = prevBills.filter(b => !b.isSynced);
          const merged = [...unsyncedLocal];
          
          // Add cloud bills that aren't already in unsynced
          cloudBills.forEach(cb => {
            if (!merged.some(mb => mb.billId === cb.billId)) {
              merged.push(cb);
            }
          });

          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem(`sb_bills_${uid}`, JSON.stringify(merged));
          return merged;
        });
      })();

      if (profilePromise) {
        await profilePromise.catch(err => handleFirestoreError(err, OperationType.GET, `users/${uid}`));
      }
      if (billsPromise) {
        await billsPromise.catch(err => handleFirestoreError(err, OperationType.GET, 'bills'));
      }
      markSyncSuccess();
    } catch (error) {
      console.warn("Could not retrieve cloud data. Relying on local offline cache. Error:", error);
    }
  }, [isCloudConnected, markSyncSuccess]);

  // Handle Auth changes (Firebase or Mock)
  const mergeDuplicateProfiles = useCallback(async (uid: string, localBusinessId: string, canonicalBusinessId: string) => {
    try {
      console.log(`[MIGRATION LOGIC] Merging duplicate profiles for user ${uid}: from local '${localBusinessId}' to canonical '${canonicalBusinessId}'`);
      
      // 1. Update local storage bills
      const localBillsStr = localStorage.getItem(`sb_bills_${uid}`);
      if (localBillsStr) {
        try {
          const localBills = JSON.parse(localBillsStr) as Bill[];
          let mutated = false;
          const updatedBills = localBills.map(b => {
            if (b.businessId === localBusinessId || !b.businessId) {
              mutated = true;
              return { ...b, businessId: canonicalBusinessId, isSynced: false };
            }
            return b;
          });
          if (mutated) {
            localStorage.setItem(`sb_bills_${uid}`, JSON.stringify(updatedBills));
            setBills(updatedBills);
            console.log(`[MIGRATION LOGIC] Updated local bills to use canonical business ID: ${canonicalBusinessId}`);
          }
        } catch (e) {
          console.error("Failed to migrate local bills:", e);
        }
      }

      // 2. If online and cloud is connected, update Firestore bills as well
      if (isCloudConnected && isOnline) {
        const billsRef = collection(db, 'bills');
        const q = query(billsRef, where('userId', '==', uid));
        const snapshot = await getDocs(q);
        
        for (const docSnap of snapshot.docs) {
          const billData = docSnap.data() as Bill;
          if (billData.businessId === localBusinessId || !billData.businessId) {
            console.log(`[MIGRATION LOGIC] Migrating Firestore bill ${docSnap.id} from business ID '${billData.businessId}' to '${canonicalBusinessId}'`);
            await setDoc(doc(db, 'bills', docSnap.id), {
              businessId: canonicalBusinessId
            }, { merge: true });
          }
        }
      }
      console.log(`[MIGRATION LOGIC] Merged duplicate profiles successfully into canonical business ID: ${canonicalBusinessId}`);
    } catch (err) {
      console.error("[MIGRATION LOGIC] Error during account merge migration:", err);
    }
  }, [isCloudConnected, isOnline]);

  useEffect(() => {
    let unsubscribe = () => {};

    if (isCloudConnected) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setIsLoading(true); // Maintain loading status blocking during account mapping
          setAuthStatusText("Mapping account...");

          const userState = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || 'merchant@smartvyapar.com',
            displayName: firebaseUser.displayName || 'Smart Vyapar Merchant',
            photoURL: firebaseUser.photoURL || undefined
          };
          
          setUser(userState);
          migrateSandboxDataToCloudUser(firebaseUser.uid);
          localStorage.setItem('vyapar_cached_user', JSON.stringify(userState));
          setAuthError(null);
          
          console.log(`[AUTH VERIFICATION] UID MATCH CONFIRMATION across devices: Google Account ALWAYS produces UID=${firebaseUser.uid} across all platforms.`);
          console.log(`[AUTH LOGIN STATE] Firebase UID Verified: ${firebaseUser.uid}`);
          console.log(`[AUTH LOGIN STATE] Email Verified: ${firebaseUser.email || 'N/A'}`);

          // 1. FAST LOCAL CACHE LOAD (to unblock UI immediately)
          let localProfileLoaded = false;
          const cachedProfile = localStorage.getItem(`sb_profile_${firebaseUser.uid}`);
          if (cachedProfile) {
            try {
              const parsedLocalProfile = JSON.parse(cachedProfile);
              const email = firebaseUser.email || '';
              const expectedRole = (email === 'raghavpratap987654@gmail.com') ? 'admin' : (parsedLocalProfile.role === 'admin' ? 'user' : (parsedLocalProfile.role || 'user'));
              if (parsedLocalProfile.role !== expectedRole) {
                parsedLocalProfile.role = expectedRole;
                localStorage.setItem(`sb_profile_${firebaseUser.uid}`, JSON.stringify(parsedLocalProfile));
              }
              setProfile(parsedLocalProfile);
              localProfileLoaded = true;
            } catch (_) {}
          } else {
            setProfile(null);
          }

          const cachedBills = localStorage.getItem(`sb_bills_${firebaseUser.uid}`);
          if (cachedBills) {
            try {
              setBills(JSON.parse(cachedBills));
            } catch (e) {}
          } else {
            setBills([]);
          }

          if (localProfileLoaded) {
            setIsLoading(false); // Unblock UI immediately using local cache!
          }

          // 2. BACKGROUND CLOUD SYNC
          let exists = false;
          let cloudProfileLoaded = false;
          let canonicalProfile: UserProfile | null = null;
          
          try {
            if (isCloudConnected && isOnline) {
              const profileRef = doc(db, 'users', firebaseUser.uid);
              const snapshot = await getDoc(profileRef);
              exists = snapshot.exists();
              localStorage.setItem(`sb_profile_exists_${firebaseUser.uid}`, exists ? 'true' : 'false');
              if (exists) {
                canonicalProfile = snapshot.data() as UserProfile;
                const email = firebaseUser.email || '';
                const expectedRole = (email === 'raghavpratap987654@gmail.com') ? 'admin' : (canonicalProfile.role === 'admin' ? 'user' : (canonicalProfile.role || 'user'));
                if (canonicalProfile.role !== expectedRole) {
                  canonicalProfile.role = expectedRole;
                  try {
                    await setDoc(profileRef, { role: expectedRole }, { merge: true });
                  } catch (roleErr) {}
                }
                setProfile(canonicalProfile);
                localStorage.setItem(`sb_profile_${firebaseUser.uid}`, JSON.stringify(canonicalProfile));
                cloudProfileLoaded = true;
              }
            }
          } catch (e) {}
          
          setAuthStatusText(null);
          
          // Merge duplicates if needed
          if (cloudProfileLoaded || localProfileLoaded) {
            const currentProfile = canonicalProfile || JSON.parse(localStorage.getItem(`sb_profile_${firebaseUser.uid}`) || 'null');
            if (currentProfile && currentProfile.businessId) {
              const localProfileStr = localStorage.getItem(`sb_profile_${firebaseUser.uid}`);
              if (localProfileStr) {
                try {
                  const localProfileObj = JSON.parse(localProfileStr);
                  if (localProfileObj.businessId && localProfileObj.businessId !== currentProfile.businessId) {
                    await mergeDuplicateProfiles(firebaseUser.uid, localProfileObj.businessId, currentProfile.businessId);
                  }
                } catch (_) {}
              }
            }
          }

          // Trigger the general cloud sync
          await fetchCloudData(firebaseUser.uid, cloudProfileLoaded || localProfileLoaded);
          
          if (!localProfileLoaded) {
            setIsLoading(false); // Unblock if it wasn't unblocked earlier
          }

          // Google Analytics Auth tracking
          if (typeof window !== "undefined" && (window as any).gtag) {
            const intent = localStorage.getItem('vyapar_auth_intent');
            if (intent === 'signup') {
              (window as any).gtag("event", "sign_up", {
                method: "email_or_google",
                user_id: firebaseUser.uid,
                email: firebaseUser.email || "Unknown"
              });
            } else if (intent === 'login') {
              (window as any).gtag("event", "login", {
                method: "email_or_google",
                user_id: firebaseUser.uid
              });
            }
            localStorage.removeItem('vyapar_auth_intent');
          }
        } else {
          localStorage.removeItem('vyapar_cached_user');
          localStorage.removeItem('sb_session_user');
          setUser(null);
          setProfile(null);
          setBills([]);
          setIsLoading(false);
        }
      });
    } else {
      // Local Auth Fallback checking
      const localUser = localStorage.getItem('sb_session_user');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          setUser(parsed);
          loadLocalData(parsed.uid);

          const cachedProfile = localStorage.getItem(`sb_profile_${parsed.uid}`);
          let loadedLocalProfile: UserProfile | null = null;
          if (cachedProfile) {
            try {
              loadedLocalProfile = JSON.parse(cachedProfile);
              if (loadedLocalProfile) {
                const email = parsed.email || '';
                const expectedRole = (email === 'raghavpratap987654@gmail.com') ? 'admin' : (loadedLocalProfile.role === 'admin' ? 'user' : (loadedLocalProfile.role || 'user'));
                if (loadedLocalProfile.role !== expectedRole) {
                  loadedLocalProfile.role = expectedRole;
                  localStorage.setItem(`sb_profile_${parsed.uid}`, JSON.stringify(loadedLocalProfile));
                }
              }
            } catch (_) {}
          }
          setProfile(loadedLocalProfile);

          const bId = loadedLocalProfile ? loadedLocalProfile.businessId : 'N/A';
          console.log(`[ONLINE MOCK AUTH] Local sandbox login: UID=${parsed.uid}, Email=${parsed.email}, Business ID=${bId}, Role=${loadedLocalProfile?.role}`);
        } catch (e) {
          console.error("Error reading mock session", e);
        }
      }
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [isCloudConnected, loadLocalData, fetchCloudData, mergeDuplicateProfiles]);

  const checkAccountExists = async (uid: string, email: string): Promise<boolean> => {
    if (isCloudConnected && isOnline) {
      try {
        const profileRef = doc(db, 'users', uid);
        const snapshot = await getDoc(profileRef);
        const exists = snapshot.exists();
        localStorage.setItem(`sb_profile_exists_${uid}`, exists ? 'true' : 'false');
        return exists;
      } catch (e) {
        console.warn("Could not check Firestore profile existence:", e);
      }
    }
    return !!localStorage.getItem(`sb_profile_${uid}`);
  };

  const triggerMockLogin = (email?: string, name?: string) => {
    const defaultEmail = email || 'merchant@smartvyapar.com';
    const defaultName = name || defaultEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    const normalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    const safeUid = 'mock_user_' + defaultEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    const mockUser = {
      uid: safeUid,
      email: defaultEmail,
      displayName: normalizedName,
    };
    setUser(mockUser);
    localStorage.setItem('vyapar_cached_user', JSON.stringify(mockUser));
    localStorage.setItem('sb_session_user', JSON.stringify(mockUser));
    loadLocalData(mockUser.uid);
    setIsLoading(false);

    // Google Analytics mock auth tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      const intent = localStorage.getItem('vyapar_auth_intent') || 'login';
      if (intent === 'signup') {
        (window as any).gtag("event", "sign_up", {
          method: "sandbox_email",
          user_id: mockUser.uid,
          email: mockUser.email
        });
      } else {
        (window as any).gtag("event", "login", {
          method: "sandbox_email",
          user_id: mockUser.uid
        });
      }
      localStorage.removeItem('vyapar_auth_intent');
    }
  };

  // Auth: Login function
  const login = async () => {
    setIsLoading(true);
    setAuthError(null);
    const intent = localStorage.getItem('vyapar_auth_intent') || 'login';
    sessionStorage.setItem('active_login_action_taken', 'true');
    if (isCloudConnected) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // We let the central onAuthStateChanged handle DB exists check and sign out,
        // avoiding concurrent duplicate queries and race conditions entirely!
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    } else {
      // Offline fallback login process
      const defaultEmail = 'merchant@smartvyapar.com';
      const safeUid = 'mock_user_' + defaultEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      if (intent === 'login') {
        const exists = await checkAccountExists(safeUid, defaultEmail);
        if (!exists) {
          setIsLoading(false);
          const err = new Error("No registered account found on SMART VYAPAR APP with this Gmail ID or Google account.");
          setAuthError(err.message);
          throw err;
        }
      }
      triggerMockLogin();
    }
  };

  // Auth: Email & Password Login / Signup function
  const loginWithEmailPassword = async (email: string, password: string, isSignUp: boolean, displayName?: string) => {
    setIsLoading(true);
    setAuthError(null);
    localStorage.setItem('vyapar_auth_intent', isSignUp ? 'signup' : 'login');
    sessionStorage.setItem('active_login_action_taken', 'true');
    if (isCloudConnected) {
      try {
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
          }
        } else {
          await signInWithEmailAndPassword(auth, email, password);
          // Let onAuthStateChanged handle DB exist validation and dynamic sign out with clear error states
        }
      } catch (error: any) {
        setIsLoading(false);
        throw error;
      }
    } else {
      // Offline simulation for Sandbox environments
      try {
        const offlineUsersJson = localStorage.getItem('sb_offline_users') || '{}';
        const offlineUsers = JSON.parse(offlineUsersJson);
        const safeUid = 'mock_user_' + email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

        if (isSignUp) {
          if (offlineUsers[email]) {
            throw new Error("This email is already registered locally!");
          }
          const newUser = {
            email,
            password,
            displayName: displayName || email.split('@')[0],
            uid: safeUid
          };
          offlineUsers[email] = newUser;
          localStorage.setItem('sb_offline_users', JSON.stringify(offlineUsers));
          triggerMockLogin(email, displayName);
        } else {
          const matched = offlineUsers[email];
          if (!matched) {
            const err = new Error("No registered account found on SMART VYAPAR APP with this Gmail ID or Google account.");
            setAuthError(err.message);
            throw err;
          }
          if (matched.password !== password) {
            throw new Error("Incorrect password for offline user!");
          }
          const exists = await checkAccountExists(safeUid, email);
          if (!exists) {
            const err = new Error("No registered account found on SMART VYAPAR APP with this Gmail ID or Google account.");
            setAuthError(err.message);
            throw err;
          }
          triggerMockLogin(email, matched.displayName);
        }
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    }
  };

  // Auth: Logout function
  const logout = async () => {
    setIsLoading(true);
    
    // Cleanup listeners
    unsubListenersRef.current.forEach(unsub => unsub());
    unsubListenersRef.current = [];

    if (isCloudConnected) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Firebase sign out error", error);
      }
    }
    
    // Clear Session cache
    localStorage.removeItem('vyapar_cached_user');
    localStorage.removeItem('sb_session_user');
    setUser(null);
    setProfile(null);
    setBills([]);
    setIsLoading(false);
  };

  // Sync state from Local to Cloud
  const syncDataOfflineFirst = useCallback(async () => {
    if (!user || !isCloudConnected || !isOnline) return;

    const uid = user.uid;

    // 1. Sync Profile if unsynced (if it exists locally but maybe not fully synced)
    const cachedProfileObj = localStorage.getItem(`sb_profile_${uid}`);
    if (cachedProfileObj) {
      try {
        const localProfile = JSON.parse(cachedProfileObj) as UserProfile;
        const profileRef = doc(db, 'users', uid);
        const safeProfile = JSON.parse(JSON.stringify(localProfile));
        await setDoc(profileRef, safeProfile);
      } catch (e) {
        console.warn("Could not sync profile to cloud:", e);
      }
    }

    // 2. Sync Unsynced Bills
    const unsyncedBills = bills.filter(b => !b.isSynced);
    if (unsyncedBills.length === 0) return;

    for (const bill of unsyncedBills) {
      try {
        const billRef = doc(db, 'bills', bill.billId);
        // Clean out specific runtime clientside helper fields before cloud save
        const { isSynced, ...saveBill } = bill;
        const safeData = JSON.parse(JSON.stringify(saveBill));
        await setDoc(billRef, {
          ...safeData,
          createdAt: serverTimestamp()
        });

        // Mark as synced locally
        setBills(prev => {
          const updated = prev.map(pb => pb.billId === bill.billId ? { ...pb, isSynced: true } : pb);
          localStorage.setItem(`sb_bills_${uid}`, JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        console.warn(`Failed to sync bill ${bill.billId}:`, e);
      }
    }
    
    // Notify the user that syncing has completed
    if (unsyncedBills.length > 0) {
      showToast(`${unsyncedBills.length} offline invoice(s) have been permanently saved to the cloud.`, "success");
    }
  }, [user, bills, isCloudConnected, isOnline, showToast]);

  const resolveCollision = useCallback(async (strategy: 'local' | 'cloud' | 'merge', mergedPayload: any) => {
    if (!user || !activeCollision) return;
    const uid = user.uid;

    try {
      if (activeCollision.type === 'INVOICE') {
        let finalBill: Bill;
        if (strategy === 'local') {
          finalBill = { ...activeCollision.localData, isSynced: true };
        } else if (strategy === 'cloud') {
          finalBill = { ...activeCollision.cloudData, isSynced: true };
        } else {
          finalBill = { ...mergedPayload, isSynced: true };
        }

        // 1. Update bills state
        setBills(prev => {
          const removed = prev.filter(b => b.billId !== finalBill.billId);
          const updated = [finalBill, ...removed];
          updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          localStorage.setItem(`sb_bills_${uid}`, JSON.stringify(updated));
          return updated;
        });

        // 2. Commit to cloud Firestore if online
        if (isCloudConnected && isOnline && auth?.currentUser?.uid === uid) {
          const { isSynced, ...saveData } = finalBill;
          try {
            await setDoc(doc(db, 'bills', finalBill.billId), cleanUndefined(saveData));
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `bills/${finalBill.billId}`);
          }
        }

        showToast(`🟢 Invoice Conflict Reconciled: Successfully committed via ${strategy === 'merge' ? 'Manual Merge' : strategy === 'local' ? 'Last-Write-Wins' : 'Cloud Override'}`, "success");

      } else if (activeCollision.type === 'STOCK') {
        let finalProduct: any;
        if (strategy === 'local') {
          finalProduct = activeCollision.localData;
        } else if (strategy === 'cloud') {
          finalProduct = activeCollision.cloudData;
        } else {
          finalProduct = mergedPayload;
        }

        // Update local storage & state for product info
        const cachedInventoryStr = localStorage.getItem(`sb_inventory_${uid}`);
        if (cachedInventoryStr) {
          try {
            const currentInventory = JSON.parse(cachedInventoryStr) as any[];
            const updatedInv = currentInventory.map(item => item.id === finalProduct.id ? finalProduct : item);
            localStorage.setItem(`sb_inventory_${uid}`, JSON.stringify(updatedInv));
            
            // Dispatch a local reload notification
            window.dispatchEvent(new CustomEvent('inventory_local_reconciled', { detail: { id: finalProduct.id, updatedItem: finalProduct } }));
          } catch (_) {}
        }

        if (isCloudConnected && isOnline && auth?.currentUser?.uid === uid) {
          try {
            await setDoc(doc(db, 'inventory', finalProduct.id), cleanUndefined(finalProduct), { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `inventory/${finalProduct.id}`);
          }
        }

        showToast(`🟢 Stock Mismatch Resolved: Stock level committed as ${finalProduct.stock} units.`, "success");
      }

      setActiveCollision(null);
    } catch (e: any) {
      showToast(`❌ Reconciliation Failed: ${e.message}`, "error");
    }
  }, [user, activeCollision, isCloudConnected, isOnline, showToast]);

  // Listen for real-time profile and bills updates across multiple devices
  useEffect(() => {
    if (!isCloudConnected || !isOnline || !user) {
      return;
    }

    const uid = user.uid;

    // 1. Real-time changes to the user's Profile Document
    const profileRef = doc(db, 'users', uid);
    const unsubProfile = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const cloudProfile = snapshot.data() as UserProfile;
        const normalizedProfile = {
          ...cloudProfile,
          createdAt: ensureISOString(cloudProfile.createdAt)
        };
        
        setProfile(prev => {
          const strPrev = JSON.stringify(prev);
          const strNext = JSON.stringify(normalizedProfile);
          if (strPrev !== strNext) {
            localStorage.setItem(`sb_profile_${uid}`, strNext);
            localStorage.setItem(`sb_profile_exists_${uid}`, 'true');
            return normalizedProfile;
          }
          return prev;
        });
      }
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      } catch (err) {
        console.warn("Real-time profile listener error handled:", err);
      }
    });

    // 2. Real-time changes to the user's Bills Collection
    const billsRef = collection(db, 'bills');
    const q = query(billsRef, where('userId', '==', uid));
    const unsubBills = onSnapshot(q, (snapshot) => {
      const cloudBills: Bill[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Bill;
        const normalizedBill = {
          ...data,
          createdAt: ensureISOString(data.createdAt),
          isSynced: true
        };
        cloudBills.push(normalizedBill);
      });

      cloudBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBills((prevBills) => {
        const unsyncedLocal = prevBills.filter(b => !b.isSynced);
        const merged = [...unsyncedLocal];
        
        cloudBills.forEach(cb => {
          if (!merged.some(mb => mb.billId === cb.billId)) {
            merged.push(cb);
          } else {
            // Replace existing matches to keep payment state, status edits, dates in sync across screens/tabs/devices
            const idx = merged.findIndex(mb => mb.billId === cb.billId);
            if (idx !== -1 && merged[idx].isSynced) {
              merged[idx] = cb;
            }
          }
        });

        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const mergedStr = JSON.stringify(merged);
        const didChange = mergedStr !== JSON.stringify(prevBills);
        if (didChange) {
          localStorage.setItem(`sb_bills_${uid}`, mergedStr);
          return merged;
        }
        return prevBills;
      });
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'bills');
      } catch (err) {
        console.warn("Real-time bills listener error handled:", err);
      }
    });

    // 3. Real-time changes to the user's Customers Collection
    const customersRef = collection(db, 'customers');
    const qCustomers = query(customersRef, where('userId', '==', uid));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const cloudCustomers: Customer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Customer;
        const normalizedCustomer = {
          ...data,
          createdAt: ensureISOString(data.createdAt),
          updatedAt: ensureISOString(data.updatedAt),
          isSynced: true
        };
        cloudCustomers.push(normalizedCustomer);
      });

      cloudCustomers.sort((a, b) => a.name.localeCompare(b.name));

      setCustomers((prevCustomers) => {
        const unsyncedLocal = prevCustomers.filter(c => !c.isSynced);
        const merged = [...unsyncedLocal];
        
        cloudCustomers.forEach(cc => {
          if (!merged.some(mc => mc.id === cc.id)) {
            merged.push(cc);
          } else {
            const idx = merged.findIndex(mc => mc.id === cc.id);
            if (idx !== -1 && merged[idx].isSynced) {
              merged[idx] = cc;
            }
          }
        });

        merged.sort((a, b) => a.name.localeCompare(b.name));
        
        const mergedStr = JSON.stringify(merged);
        const didChange = mergedStr !== JSON.stringify(prevCustomers);
        if (didChange) {
          localStorage.setItem(`sb_customers_${uid}`, mergedStr);
          return merged;
        }
        return prevCustomers;
      });
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'customers');
      } catch (err) {
        console.warn("Real-time customers listener error handled:", err);
      }
    });

    unsubListenersRef.current.push(unsubProfile, unsubBills, unsubCustomers);

    return () => {
      unsubProfile();
      unsubBills();
      unsubCustomers();
    };
  }, [isCloudConnected, isOnline, user]);

  // Sync automatically when transitioning from offline to online
  useEffect(() => {
    if (isOnline && user) {
      syncDataOfflineFirst();
    }
  }, [isOnline, user, syncDataOfflineFirst]);

  // Helper function to generate an 8-character uppercase alphanumeric business ID
  const generateBusinessId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let blockedIds: string[] = [];
    try {
      blockedIds = JSON.parse(localStorage.getItem('vyapar_blocked_business_ids') || '[]');
    } catch (_) {}
    
    let result = '';
    while (true) {
      result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const fullId = `SV-${result}`;
      if (!blockedIds.includes(fullId)) {
        return fullId;
      }
    }
  };

  // Save/Update Shop Profile
  const saveProfile = async (profileData: Omit<UserProfile, 'uid' | 'email' | 'createdAt'>) => {
    if (!user) throw new Error("User must be logged in to save profile");

    // Remove undefined values
    const cleanProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, v]) => v !== undefined)
    );

    let businessId = profile?.businessId || (cleanProfileData as any).businessId;
    if (!businessId) {
      // check if cached businessId exists in localStorage first
      const cachedProfileObj = localStorage.getItem(`sb_profile_${user.uid}`);
      if (cachedProfileObj) {
        try {
          const cachedProfile = JSON.parse(cachedProfileObj);
          if (cachedProfile.businessId) {
            businessId = cachedProfile.businessId;
          }
        } catch (_) {}
      }
    }
    if (!businessId) {
      businessId = generateBusinessId();
    }

    const email = user.email || '';
    const expectedRole = (email === 'raghavpratap987654@gmail.com') ? 'admin' : (profile?.role === 'admin' ? 'user' : (profile?.role || 'user'));

    const finishedProfile: UserProfile = {
      ...profile,
      ...cleanProfileData,
      uid: user.uid,
      firebaseUid: user.uid, // permanently linked to Firebase UID
      businessId,
      email: email,
      role: expectedRole,
      createdAt: profile?.createdAt || new Date().toISOString()
    } as UserProfile;

    // 1. Save Locally
    setProfile(finishedProfile);
    localStorage.setItem(`sb_profile_${user.uid}`, JSON.stringify(finishedProfile));
    localStorage.setItem(`sb_profile_exists_${user.uid}`, 'true');

    // 2. Try Firestore
    if (isCloudConnected && isOnline) {
      const pathForWrite = `users/${user.uid}`;
      try {
        const safeProfile = JSON.parse(JSON.stringify(finishedProfile));
        await setDoc(doc(db, 'users', user.uid), safeProfile);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, pathForWrite);
      }
    }
  };

  // Create Bill
  const createBill = async (
    customerDetails: CustomerDetails, 
    products: ProductItem[], 
    paymentMode: any, 
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID', 
    discountPercent: number = 0, 
    discountAmount: number = 0, 
    paidAmount: number = 0,
    otherDetails?: { transport?: string; vehicleNumber?: string; placeOfSupply?: string; gstin?: string; deliveryDetails?: string; },
    gstPercent?: number,
    gstAmount?: number,
    cgstAmount?: number,
    sgstAmount?: number,
    igstAmount?: number,
    notes?: string
  ): Promise<Bill> => {
    if (!user) throw new Error("User must be logged in to generate bills");

    const timestamp = new Date();
    
    // Each business must have its own invoice sequence
    const businessId = profile?.businessId || 'SV-TEMP';
    
    // Format DDMMYYYY
    const dd = String(timestamp.getDate()).padStart(2, '0');
    const mm = String(timestamp.getMonth() + 1).padStart(2, '0');
    const yyyy = String(timestamp.getFullYear());
    const dateStr = `${dd}${mm}${yyyy}`;
    
    // Find the next sequence number by parsing existing bills
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
    
    // Target format: VM-[PREFIX]-[DDMMYYYY]-[0001]
    const userPrefix = profile?.invoicePrefix?.trim() ? `${profile.invoicePrefix.trim()}-` : '';
    const invoiceNumber = `VM-${userPrefix}${dateStr}-${String(nextSeq).padStart(4, '0')}`;

    const subTotal = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const transportCost = (otherDetails as any)?.transportCost || 0;
    const totalAmount = subTotal - discountAmount + (gstAmount || 0) + transportCost;
    const balanceAmount = totalAmount - paidAmount;

    // Clean undefined values from otherDetails
    const cleanOtherDetails = otherDetails ? Object.fromEntries(Object.entries(otherDetails).filter(([_, v]) => v !== undefined)) : undefined;

    // Automatically save or update customer details
    autoSaveCustomerFromBill(customerDetails);

    const newBill: Bill = {
      billId: `bill_${timestamp.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
      businessId,
      userId: user.uid,
      userUid: user.uid, // internally link to Firebase UID for internal tracking
      invoiceNumber,
      invoiceDate: timestamp.toISOString().split('T')[0],
      customerDetails,
      ...(Object.keys(cleanOtherDetails || {}).length > 0 && { otherDetails: cleanOtherDetails }),
      products,
      subTotal,
      discountPercent,
      discountAmount,
      gstPercent,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      paidAmount,
      balanceAmount,
      paymentMode,
      paymentStatus,
      notes,
      createdAt: timestamp.toISOString(),
      isSynced: false
    };

    // 1. Update bills list & local cache immediately
    let finalBill = { ...newBill };
    
    setBills(prev => {
      const updated = [finalBill, ...prev];
      localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // Google Analytics invoice generation tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "create_invoice", {
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        gst_amount: gstAmount || 0,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        customer_name: customerDetails?.name || "Unknown",
        items_count: products.length
      });
    }
    
    // 2. Try to sync to clouds asynchronously so we don't block the UI
    if (isCloudConnected && isOnline) {
      const pathForWrite = `bills/${newBill.billId}`;
      try {
        const safeData = JSON.parse(JSON.stringify(newBill));
        
        setDoc(doc(db, 'bills', newBill.billId), cleanUndefined({
          ...safeData,
          createdAt: serverTimestamp() // atomic Firestore timestamp
        })).then(() => {
          setBills((currentBills) => {
            const updated = currentBills.map(pb => pb.billId === newBill.billId ? { ...pb, isSynced: true } : pb);
            localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
            return updated;
          });
          setSyncError(null);
        }).catch(error => {
          setSyncError(`Background Sync Failed for Invoice ${invoiceNumber}.`);
          console.warn("Background sync error during bill creation:", error);
        });
      } catch (err) {
        setSyncError(`Background Sync Failed for Invoice ${invoiceNumber}.`);
        console.warn("Exception during background bill creation payload setup:", err);
      }
    }

    return finalBill;
  };

  // Update Bill
  const updateBill = async (
    billId: string,
    customerDetails: CustomerDetails, 
    products: ProductItem[], 
    paymentMode: any, 
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PAID', 
    discountPercent: number = 0, 
    discountAmount: number = 0, 
    paidAmount: number = 0,
    otherDetails?: { transport?: string; vehicleNumber?: string; placeOfSupply?: string; gstin?: string; deliveryDetails?: string; },
    gstPercent?: number,
    gstAmount?: number,
    cgstAmount?: number,
    sgstAmount?: number,
    igstAmount?: number,
    notes?: string
  ): Promise<Bill> => {
    if (!user) throw new Error("User must be logged in to update bills");

    const existingBill = bills.find(b => b.billId === billId);
    if (!existingBill) throw new Error("Invoice not found in records");

    const subTotal = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
    const transportCost = (otherDetails as any)?.transportCost || 0;
    const totalAmount = subTotal - discountAmount + (gstAmount || 0) + transportCost;
    const balanceAmount = totalAmount - paidAmount;

    // Clean undefined values from otherDetails
    const cleanOtherDetails = otherDetails ? Object.fromEntries(Object.entries(otherDetails).filter(([_, v]) => v !== undefined)) : undefined;

    // Automatically save or update customer details
    autoSaveCustomerFromBill(customerDetails);

    const updatedBill: Bill = {
      ...existingBill,
      customerDetails,
      ...(cleanOtherDetails && Object.keys(cleanOtherDetails).length > 0 ? { otherDetails: cleanOtherDetails } : { otherDetails: undefined }),
      products,
      subTotal,
      discountPercent,
      discountAmount,
      gstPercent,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      paidAmount,
      balanceAmount,
      paymentMode,
      paymentStatus,
      notes,
      isSynced: false
    };

    // 1. Update bills list & local cache immediately
    let finalBill = { ...updatedBill };
    
    setBills(prev => {
      const updated = prev.map(b => b.billId === billId ? finalBill : b);
      localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // Google Analytics invoice update tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "update_invoice", {
        invoice_id: billId,
        invoice_number: existingBill?.invoiceNumber || "Unknown",
        total_amount: totalAmount,
        payment_mode: paymentMode,
        payment_status: paymentStatus,
        customer_name: customerDetails?.name || "Unknown"
      });
    }
    
    // 2. Try to sync to clouds asynchronously
    if (isCloudConnected && isOnline) {
      try {
        const safeData = JSON.parse(JSON.stringify(updatedBill));
        
        setDoc(doc(db, 'bills', billId), cleanUndefined({
          ...safeData,
          updatedAt: serverTimestamp() // atomic Firestore timestamp
        })).then(() => {
          setBills((currentBills) => {
            const updated = currentBills.map(pb => pb.billId === billId ? { ...pb, isSynced: true } : pb);
            localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
            return updated;
          });
          setSyncError(null);
        }).catch(error => {
          setSyncError(`Background Sync Failed for Invoice ${existingBill.invoiceNumber}.`);
          console.warn("Background sync error during bill update:", error);
        });
      } catch (error) {
        setSyncError(`Background Sync Failed for Invoice ${existingBill.invoiceNumber}.`);
        console.warn("Exception setup for background bill update:", error);
      }
    }

    return finalBill;
  };

  // Delete Bill
  const deleteBill = async (billId: string) => {
    if (!user) throw new Error("User must be logged in to delete bills");

    // 1. Remove Locally
    setBills(prev => {
      const updated = prev.filter(b => b.billId !== billId);
      localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // Google Analytics invoice deletion tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "delete_invoice", {
        invoice_id: billId
      });
    }

    // 2. Remove Cloud
    if (isCloudConnected && isOnline) {
      const pathForDelete = `bills/${billId}`;
      deleteDoc(doc(db, 'bills', billId)).then(() => {
        setSyncError(null);
      }).catch(error => {
        setSyncError(`Background Delete Failed for Invoice ID ${billId}.`);
        console.warn("Background deletion sync error:", error);
      });
    }
  };

  // Save/Update Customer
  const saveCustomer = async (customerData: Omit<Customer, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error("User must be logged in to save customer");

    const id = customerData.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const existingCustomer = customers.find(c => c.id === id);

    const newCustomer: Customer = {
      ...customerData,
      id,
      userId: user.uid,
      createdAt: existingCustomer?.createdAt || now,
      updatedAt: now,
      isSynced: false
    };

    // 1. Update Locally
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      updated.push(newCustomer);
      updated.sort((a, b) => a.name.localeCompare(b.name));
      localStorage.setItem(`sb_customers_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // 2. Sync to Cloud
    if (isCloudConnected && isOnline) {
      const custRef = doc(db, 'customers', id);
      setDoc(custRef, cleanUndefined({
        ...newCustomer,
        isSynced: true
      })).then(() => {
        setCustomers(prev => {
          const updated = prev.map(c => c.id === id ? { ...c, isSynced: true } : c);
          localStorage.setItem(`sb_customers_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      }).catch(error => {
        console.warn("Exception writing customer to cloud:", error);
      });
    }
  };

  // Delete Customer
  const deleteCustomer = async (id: string) => {
    if (!user) throw new Error("User must be logged in to delete customer");

    // 1. Remove Locally
    setCustomers(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem(`sb_customers_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // 2. Remove Cloud
    if (isCloudConnected && isOnline) {
      deleteDoc(doc(db, 'customers', id)).catch(error => {
        console.warn("Background customer deletion error:", error);
      });
    }
  };

  // Helper to auto-save customer during bill creation/update
  const autoSaveCustomerFromBill = async (details: CustomerDetails) => {
    if (!details.name || details.name.trim() === '') return;

    const nameTrimmed = details.name.trim();
    const nameLower = nameTrimmed.toLowerCase();
    
    // Ignore cash/walk-in generic profiles
    if (
      nameLower === 'cash' || 
      nameLower === 'cash / walk-in' || 
      nameLower === 'walk-in' ||
      nameLower === 'guest'
    ) {
      return;
    }
    
    const cleanPhone = details.phone ? details.phone.trim() : '';
    const cleanAddress = details.address ? details.address.trim() : '';
    const cleanGst = details.gstNumber ? details.gstNumber.trim().toUpperCase() : '';
    
    // Find existing customer by exact Name (case insensitive) AND Mobile Number match
    const existing = customers.find(c => 
      c.name.trim().toLowerCase() === nameLower &&
      (c.phone ? c.phone.trim() : '') === cleanPhone
    );
    
    if (existing) {
      // If every detail (name, phone, address, gst) is identical, do not save or update (already saved)
      const existingAddress = existing.address ? existing.address.trim() : '';
      const existingGst = existing.gstNumber ? existing.gstNumber.trim().toUpperCase() : '';
      
      const isExactlySame = 
        existing.name.trim().toLowerCase() === nameLower &&
        (existing.phone ? existing.phone.trim() : '') === cleanPhone &&
        existingAddress.toLowerCase() === cleanAddress.toLowerCase() &&
        existingGst === cleanGst;

      if (isExactlySame) {
        // Absolutely identical, do not trigger any update
        return;
      }

      let needsUpdate = false;
      const updatedData = { ...existing };
      
      if (cleanAddress && existingAddress.toLowerCase() !== cleanAddress.toLowerCase()) {
        updatedData.address = cleanAddress;
        needsUpdate = true;
      }
      if (cleanGst && existingGst !== cleanGst) {
        updatedData.gstNumber = cleanGst;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        try {
          await saveCustomer(updatedData);
        } catch (err) {
          console.warn("Auto update customer failed", err);
        }
      }
    } else {
      try {
        await saveCustomer({
          id: '',
          name: nameTrimmed,
          phone: cleanPhone,
          address: cleanAddress,
          gstNumber: cleanGst || undefined
        });
      } catch (err) {
        console.warn("Auto save customer failed", err);
      }
    }
  };

  // Update Bill Payment (Clear dues / register payments)
  const updateBillPayment = async (
    billId: string, 
    paidAmount: number, 
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE'
  ) => {
    if (!user) throw new Error("User must be logged in to update transaction ledger");

    setBills(prev => {
      const updated = prev.map(bill => {
        if (bill.billId === billId) {
          const balanceAmount = Math.max(0, bill.totalAmount - paidAmount);
          return {
            ...bill,
            paidAmount,
            balanceAmount,
            paymentStatus,
            isSynced: false
          };
        }
        return bill;
      });
      localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
      return updated;
    });

    // Update Firestore if online
    if (isCloudConnected && isOnline) {
      try {
        const billRef = doc(db, 'bills', billId);
        const balanceAmount = Math.max(0, bills.find(b => b.billId === billId)?.totalAmount || 0) - paidAmount;
        await setDoc(billRef, cleanUndefined({
          paidAmount,
          balanceAmount: Math.max(0, balanceAmount),
          paymentStatus
        }), { merge: true });

        // Mark as synced locally
        setBills(prev => {
          const updated = prev.map(pb => pb.billId === billId ? { ...pb, isSynced: true } : pb);
          localStorage.setItem(`sb_bills_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `bills/${billId}`);
      }
    }
  };

  // Clear Local session
  const clearLocalHistory = () => {
    if (!user) return;
    localStorage.removeItem(`sb_profile_${user.uid}`);
    localStorage.removeItem(`sb_bills_${user.uid}`);
    localStorage.removeItem(`sb_customers_${user.uid}`);
    setProfile(null);
    setBills([]);
    setCustomers([]);
  };

  // Initiate soft delete of the business account
  const initiateSoftDelete = async (verificationMethod: 'password' | 'google') => {
    if (!user || !profile) throw new Error("No active authenticated user session found");

    const deletedAt = new Date().toISOString();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    const recoveryDeadline = deadline.toISOString();

    const updatedProfile: UserProfile = {
      ...profile,
      status: 'deleted',
      deletedAt,
      recoveryDeadline
    };

    // 1. Update locally
    setProfile(updatedProfile);
    localStorage.setItem(`sb_profile_${user.uid}`, JSON.stringify(updatedProfile));

    // 2. Try to update Firestore
    if (isCloudConnected && isOnline) {
      try {
        await setDoc(doc(db, 'users', user.uid), cleanUndefined(updatedProfile));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }

    // 3. Write Deletion Audit Log
    const auditId = `audit_${user.uid}_${Date.now()}`;
    const auditLog = {
      id: auditId,
      businessId: profile.businessId || 'N/A',
      firebaseUid: user.uid,
      deletionDate: deletedAt,
      recoveryDeadline,
      deletionMethod: 'soft_delete_scheduled',
      verificationMethod
    };

    // Store log locally
    try {
      const existingLogs = JSON.parse(localStorage.getItem('vyapar_delete_audit_logs') || '[]');
      existingLogs.push(auditLog);
      localStorage.setItem('vyapar_delete_audit_logs', JSON.stringify(existingLogs));
    } catch (_) {}

    // Store log in Cloud (collection: deletionAuditLogs)
    if (isCloudConnected && isOnline) {
      try {
        await setDoc(doc(db, 'deletionAuditLogs', auditId), cleanUndefined(auditLog));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `deletionAuditLogs/${auditId}`);
      }
    }

    showToast("⚠️ Account deletion scheduled. 30-day recovery window is active.", "warning");
  };

  // Recover softdeleted account
  const recoverAccount = async () => {
    if (!user || !profile) throw new Error("No user profile to recover");

    // Remove deletion fields
    const { status, deletedAt, recoveryDeadline, ...activeProfile } = profile;

    // 1. Update locally
    setProfile(activeProfile as UserProfile);
    localStorage.setItem(`sb_profile_${user.uid}`, JSON.stringify(activeProfile));

    // 2. Try Firestore
    if (isCloudConnected && isOnline) {
      try {
        await setDoc(doc(db, 'users', user.uid), cleanUndefined(activeProfile));
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
      }
    }

    showToast("✅ Welcome back! Your business account has been recovered successfully.", "success");
  };

  // Permanent Delete of all user records (Phase 9)
  const permanentPurgeAccount = async () => {
    if (!user) return;
    const uid = user.uid;
    const busId = profile?.businessId || 'N/A';

    // 1. Clear locally
    localStorage.removeItem(`sb_profile_${uid}`);
    localStorage.removeItem(`sb_bills_${uid}`);
    localStorage.removeItem(`sb_inventory_${uid}`);
    localStorage.removeItem(`sb_movements_${uid}`);
    localStorage.removeItem(`sb_profile_exists_${uid}`);

    // Create final purge audit log
    const auditId = `audit_purge_${uid}_${Date.now()}`;
    const auditLog = {
      id: auditId,
      businessId: busId,
      firebaseUid: uid,
      deletionDate: new Date().toISOString(),
      recoveryDeadline: 'EXPIRED_PERMANENTLY_PURGED',
      deletionMethod: 'permanent_purge_expired',
      verificationMethod: 'system_auto_expiry'
    };

    try {
      const existingLogs = JSON.parse(localStorage.getItem('vyapar_delete_audit_logs') || '[]');
      existingLogs.push(auditLog);
      localStorage.setItem('vyapar_delete_audit_logs', JSON.stringify(existingLogs));
    } catch (_) {}

    // 2. Clear cloud documents in parallel
    if (isCloudConnected && isOnline) {
      try {
        // Log deep audit entry before wipe
        await setDoc(doc(db, 'deletionAuditLogs', auditId), auditLog);

        // Delete user doc
        await deleteDoc(doc(db, 'users', uid));

        // Delete other records from sub/root collections
        const billsRef = collection(db, 'bills');
        const qBills = query(billsRef, where('userId', '==', uid));
        const billsSnap = await getDocs(qBills);
        billsSnap.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'bills', docSnap.id));
        });

        const invRef = collection(db, 'inventory');
        const qInv = query(invRef, where('userId', '==', uid));
        const invSnap = await getDocs(qInv);
        invSnap.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'inventory', docSnap.id));
        });

        const movRef = collection(db, 'stockMovements');
        const qMov = query(movRef, where('userId', '==', uid));
        const movSnap = await getDocs(qMov);
        movSnap.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'stockMovements', docSnap.id));
        });

      } catch (e) {
        console.warn("Could not wipe all Firestore collections during permanent delete", e);
      }
    }

    // 3. Keep Business ID locked
    try {
      const blockedIds = JSON.parse(localStorage.getItem('vyapar_blocked_business_ids') || '[]');
      if (!blockedIds.includes(busId)) {
        blockedIds.push(busId);
        localStorage.setItem('vyapar_blocked_business_ids', JSON.stringify(blockedIds));
      }
    } catch (_) {}

    // Trigger local session logout / reset
    localStorage.removeItem('vyapar_cached_user');
    localStorage.removeItem('sb_session_user');
    setUser(null);
    setProfile(null);
    setBills([]);
    setCustomers([]);
    showToast("🗑️ All business data permanently purged. Account deleted.", "error");
  };

  return (
    <BillingContext.Provider value={{
      user,
      profile,
      bills,
      customers,
      isLoading,
      isOnline,
      isCloudConnected,
      isSandboxOnly,
      setIsSandboxOnly,
      syncPendingCount,
      login,
      loginWithEmailPassword,
      logout,
      saveProfile,
      createBill,
      updateBill,
      deleteBill,
      saveCustomer,
      deleteCustomer,
      updateBillPayment,
      syncDataOfflineFirst,
      clearLocalHistory,
      initiateSoftDelete,
      recoverAccount,
      permanentPurgeAccount,
      authError,
      clearAuthError,
      syncError,
      setSyncError,
      authStatusText,
      toasts,
      showToast,
      dismissToast,
      confirmDialog,
      showConfirm,
      closeConfirm,
      activeCollision,
      setActiveCollision,
      resolveCollision,
      isIntelligentContinuityActive,
      lastSyncTimestamp
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
