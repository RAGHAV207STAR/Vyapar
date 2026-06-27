/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth, isFirebasePlaceholder, handleFirestoreError, OperationType, cleanUndefined } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { useBilling } from './BillingContext';
import { useInventory } from './InventoryContext';
import { useAnalytics } from './AnalyticsContext';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'lowStock' | 'duePayment' | 'dailySummary' | 'weeklySummary' | 'monthlySummary' | 'security' | 'export' | 'inactivity' | 'inventoryReview';
  read: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  lowStockAlerts: boolean;
  duePaymentReminders: boolean;
  dailyBusinessSummary: boolean;
  weeklyBusinessReport: boolean;
  monthlyPerformanceReport: boolean;
  businessInactivityReminders: boolean;
  inventoryReviewReminders: boolean;
  securityAlerts: boolean;
  exportCompletionNotifications: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  lowStockAlerts: true,
  duePaymentReminders: true,
  dailyBusinessSummary: true,
  weeklyBusinessReport: true,
  monthlyPerformanceReport: true,
  businessInactivityReminders: true,
  inventoryReviewReminders: true,
  securityAlerts: true,
  exportCompletionNotifications: true,
};

const ensureISOString = (val: any): string => {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val && val.seconds !== undefined) {
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

const activeAlertLocks = new Map<string, number>();

function acquireNotificationLock(title: string, body: string, ttlMs = 5000): boolean {
  const hash = `${title}::${body}`;
  const now = Date.now();
  const lastTime = activeAlertLocks.get(hash);
  if (lastTime && (now - lastTime) < ttlMs) {
    return false; // Suppress duplicate
  }
  activeAlertLocks.set(hash, now);
  // Housekeep memory leaks
  if (activeAlertLocks.size > 200) {
    for (const [key, val] of activeAlertLocks.entries()) {
      if (now - val > 60000) {
        activeAlertLocks.delete(key);
      }
    }
  }
  return true;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  permissionGranted: boolean | null;
  fcmToken: string | null;
  settings: NotificationSettings;
  requestPermission: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  triggerNotification: (
    title: string, 
    body: string, 
    type: NotificationItem['type']
  ) => Promise<void>;
  testTriggerNotification: (type: NotificationItem['type']) => Promise<void>;
  addCustomNotification: (title: string, body: string, type: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, saveProfile, isLoading: isBillingLoading, isCloudConnected, isOnline, bills } = useBilling();
  const { inventory, isLoading: isInventoryLoading } = useInventory();
  const { getCacheForRange } = useAnalytics();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Store the FCM foreground push reception observer unsubscribe reference
  const unsubscribeFCMRef = React.useRef<(() => void) | null>(null);

  // Unmount cleanup to completely purge active active system listeners
  useEffect(() => {
    return () => {
      if (unsubscribeFCMRef.current) {
        unsubscribeFCMRef.current();
        unsubscribeFCMRef.current = null;
      }
    };
  }, []);

  // Load permission state on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission === 'denied') {
        setPermissionGranted(false);
      } else {
        setPermissionGranted(null);
      }
    }
  }, []);

  // Update nested settings when profile loads
  useEffect(() => {
    if (profile?.notificationSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...profile.notificationSettings
      });
    }
  }, [profile]);

  // Sync real-time notifications from Firestore
  useEffect(() => {
    if (isFirebasePlaceholder || !user || !isCloudConnected || !isOnline) {
      // Local fallback for offline/placeholder mode
      const cached = localStorage.getItem(`sb_notifications_${user?.uid || 'offline'}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          
          // Deduplication
          const deduplicated: NotificationItem[] = [];
          const seen = new Map<string, number>();
          parsed.forEach((n: any) => {
            const hash = `${n.title}::${n.body}`;
            const time = new Date(n.createdAt).getTime();
            const lastTime = seen.get(hash);
            if (!lastTime || Math.abs(time - lastTime) > 3600000) {
              deduplicated.push(n);
              seen.set(hash, time);
            }
          });
          
          setNotifications(deduplicated);
          setUnreadCount(deduplicated.filter((n: any) => !n.read).length);
        } catch (_) {}
      }
      return;
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        list.push({
          ...docData,
          createdAt: ensureISOString(docData.createdAt)
        } as NotificationItem);
      });
      // Sort chronologically newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Deduplicate notifications with same title and body within 1 hour
      const deduplicated: NotificationItem[] = [];
      const seen = new Map<string, number>();
      
      list.forEach((n) => {
        const hash = `${n.title}::${n.body}`;
        const time = new Date(n.createdAt).getTime();
        const lastTime = seen.get(hash);
        
        if (!lastTime || Math.abs(time - lastTime) > 3600000) {
          deduplicated.push(n);
          seen.set(hash, time);
        }
      });
      
      setNotifications(deduplicated);
      setUnreadCount(deduplicated.filter(n => !n.read).length);
      localStorage.setItem(`sb_notifications_${user.uid}`, JSON.stringify(deduplicated));
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      } catch (err) {
        console.warn("Real-time notifications listener error:", err);
      }
    });

    return unsub;
  }, [user, isCloudConnected, isOnline]);

  // Register device FCM Token in Firestore profile
  const registerDeviceToken = useCallback(async (token: string) => {
    if (!user || isFirebasePlaceholder) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredTokens: arrayUnion(token)
      });
    } catch (e) {
      console.warn("FCM Token save skipped or restricted in rules:", e);
    }
  }, [user]);

  // Initialize Firebase Messaging SDK client
  const initializeFCM = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (isFirebasePlaceholder) {
      // Offline mock FCM Token for seamless sandboxed simulation testing
      const mockToken = `fcm_sandbox_device_${user?.uid || 'guest'}_${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
      setFcmToken(mockToken);
      return;
    }

    try {
      // Lazy load Firebase Messaging
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      const messaging = getMessaging();

      // Register the service worker path explicitly to guarantee PWA background capabilities
      const reg = await navigator.serviceWorker.ready;
      
      const token = await getToken(messaging, {
        vapidKey: 'BF17J8u7bZms98q2sST3qQAnu95o-mY5nS1D-fT8KAn7I8Lp-ZlY6S_gX0Mh0p_3EaD', // Global Vapid Key matching project Sender ID sandbox
        serviceWorkerRegistration: reg
      });

      if (token) {
        setFcmToken(token);
        await registerDeviceToken(token);

        // Clean up any previously active FCM foreground observers to prevent duplicate notifications
        if (unsubscribeFCMRef.current) {
          unsubscribeFCMRef.current();
          unsubscribeFCMRef.current = null;
        }

        // Foreground messaging reception observer
        const unsub = onMessage(messaging, (payload) => {
          console.log('Foreground Push Message Received: ', payload);
          // Show foreground notification popups nicely
          if (payload.notification) {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(payload.notification!.title || 'Smart Vyapar SDK', {
                  body: payload.notification!.body,
                  icon: '/android-chrome-192x192.png'
                });
              });
            } else {
              new Notification(payload.notification.title || 'Smart Vyapar SDK', {
                body: payload.notification.body,
                icon: '/android-chrome-192x192.png'
              });
            }
          }
        });
        unsubscribeFCMRef.current = unsub;
      }
    } catch (error) {
      console.warn('Real browser FCM tokens restricted inside sandboxed environments:', error);
      // Fall back to mock dev tokens so UI flows never fail or block
      const mockToken = `fcm_fallback_sandbox_${user?.uid || 'guest'}`;
      setFcmToken(mockToken);
    }
  }, [user, registerDeviceToken]);

  // Handle requesting permissions
  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionGranted(true);
      await initializeFCM();
      return true;
    }

    try {
      let permission: NotificationPermission = 'default';
      const isInIframe = window !== window.top;
      
      if (!isInIframe) {
         permission = await Notification.requestPermission();
      } else {
         permission = 'granted'; // Mock permission in AI studio iframe
      }

      if (permission === 'granted') {
        setPermissionGranted(true);
        await initializeFCM();
        return true;
      } else {
        setPermissionGranted(false);
        return false;
      }
    } catch (e) {
      console.warn("Permission request failed gracefully (sandbox):", e);
      setPermissionGranted(true);
      await initializeFCM();
      return true;
    }
  };

  // Automated trigger logic
  const triggerNotification = async (
    title: string, 
    body: string, 
    type: NotificationItem['type'],
    forceTesting: boolean = false
  ) => {
    const activeUserId = user?.uid || 'guest';
    const isEnabled = 
      (type === 'lowStock' && settings.lowStockAlerts) ||
      (type === 'duePayment' && settings.duePaymentReminders) ||
      (type === 'dailySummary' && settings.dailyBusinessSummary) ||
      (type === 'weeklySummary' && settings.weeklyBusinessReport) ||
      (type === 'monthlySummary' && settings.monthlyPerformanceReport) ||
      (type === 'inactivity' && (settings.businessInactivityReminders ?? true)) ||
      (type === 'inventoryReview' && (settings.inventoryReviewReminders ?? true)) ||
      (type === 'security' && settings.securityAlerts) ||
      (type === 'export' && settings.exportCompletionNotifications);

    if (!isEnabled && !forceTesting) {
      console.log(`Notification of type "${type}" skipped: Disabled in settings.`);
      return;
    }

    // Suppress simultaneous or duplicate notification triggers instantly via high-stability lock
    if (!acquireNotificationLock(title, body)) {
      console.log(`Notification duplicate suppressed: "${title}" - "${body}"`);
      return;
    }

    // Guard: Prevent creating a duplicate notification if one with same title and body exists within 1 hour
    const nowTime = Date.now();
    const hasRecentDuplicate = notifications.some(n => {
      const diffMs = Math.abs(nowTime - new Date(n.createdAt).getTime());
      return n.title === title && n.body === body && diffMs < 3600000;
    });

    if (hasRecentDuplicate) {
      console.log(`Notification duplicate check suppressed: "${title}" - "${body}" already exists in historical feed.`);
      return;
    }

    const newNotification: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: activeUserId,
      title,
      body,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };

    // 1. Show UI browser alert foreground if permitted
    if (Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: '/android-chrome-192x192.png'
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: '/android-chrome-192x192.png'
          });
        }
      } catch (_) {}
    }

    // 2. Persist to Firestore or local fallback
    if (isFirebasePlaceholder || !user) {
      setNotifications(prev => {
        const updated = [newNotification, ...prev];
        localStorage.setItem(`sb_notifications_${activeUserId}`, JSON.stringify(updated));
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } else {
      try {
        const notifRef = doc(db, 'notifications', newNotification.id);
        await setDoc(notifRef, cleanUndefined({
          ...newNotification,
          createdAt: serverTimestamp()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `notifications/${newNotification.id}`);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (profile && saveProfile) {
      await saveProfile({
        ...profile,
        notificationSettings: updated
      });
    }
  };

  const markAsRead = async (id: string) => {
    if (isFirebasePlaceholder || !user) {
      setNotifications(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(`sb_notifications_${user?.uid || 'offline'}`, JSON.stringify(updated));
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } else {
      try {
        const notifRef = doc(db, 'notifications', id);
        await updateDoc(notifRef, { read: true });
      } catch (e) {
        console.error("Failed to update read status:", e);
      }
    }
  };

  const markAllAsRead = async () => {
    if (isFirebasePlaceholder || !user) {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem(`sb_notifications_${user?.uid || 'offline'}`, JSON.stringify(updated));
        setUnreadCount(0);
        return updated;
      });
    } else {
      try {
        const promises = notifications
          .filter(n => !n.read)
          .map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
        await Promise.all(promises);
      } catch (e) {
        console.error("Failed to mark all as read:", e);
      }
    }
  };

  const clearAll = async () => {
    if (isFirebasePlaceholder || !user) {
      setNotifications([]);
      localStorage.removeItem(`sb_notifications_${user?.uid || 'offline'}`);
      setUnreadCount(0);
    } else {
      try {
        const promises = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
        await Promise.all(promises);
        setNotifications([]);
        setUnreadCount(0);
      } catch (e) {
        console.error("Failed to delete notifications:", e);
      }
    }
  };

  // Mock Notification content templates matching exact required alerts
  const testTriggerNotification = async (type: string) => {
    switch(type) {
      case 'lowStock':
        await triggerNotification(
          "📉 Low Stock Alert", 
          "Heads up! You're running low on UltraTech Cement (Only 2 units left).",
          "lowStock",
          true
        );
        break;
      case 'duePayment':
        await triggerNotification(
          "⏳ Payment Pending", 
          "Action required: You have an outstanding balance of ₹12,500 from ABC Builders.",
          "duePayment",
          true
        );
         break;
      case 'dailySummary':
        await triggerNotification(
          "📊 Daily Snapshot", 
          "Great day! You generated 12 invoices today, bringing in ₹18,450 with an estimated profit of ₹3,200.",
          "dailySummary",
          true
        );
        break;
      case 'weeklySummary':
        await triggerNotification(
          "📈 Weekly Performance Insights", 
          "Incredible week! You processed 45 invoices for a total revenue of ₹1,45,000 (Estimated profit: ₹25,000). Keep the momentum going!",
          "weeklySummary",
          true
        );
        break;
      case 'monthlySummary':
        await triggerNotification(
          "🏆 Monthly Milestone Reached", 
          "Outstanding month! You achieved a total revenue of ₹4,50,000 across 150 invoices (Estimated profit: ₹80,000). Fantastic work!",
          "monthlySummary",
          true
        );
        break;
      case 'inactivity_3d':
        await triggerNotification(
          "👋 We miss you!",
          "It's been a few days since your last update. Check back in to keep your records up to date.",
          "inactivity",
          true
        );
        break;
      case 'inactivity_7d':
        await triggerNotification(
          "💡 Business Tip",
          "A quick review of your inventory and invoices can help you stay on top of your business.",
          "inactivity",
          true
        );
        break;
      case 'inactivity_15d':
        await triggerNotification(
          "🔍 Need a quick check-in?",
          "Your business performance report is ready. Take a moment to review your progress.",
          "inactivity",
          true
        );
        break;
      case 'inactivity_30d':
        await triggerNotification(
          "⚡ Keep your momentum!",
          "It's important to keep your inventory, pending dues, and sales records up to date. Let's get back on track!",
          "inactivity",
          true
        );
        break;
      case 'inventoryReview_7d':
        await triggerNotification(
          "📦 Inventory Checkup",
          "It's a good time for a quick inventory review. Ensure your stock levels are accurate.",
          "inventoryReview",
          true
        );
        break;
      case 'security':
        await triggerNotification(
          "🔒 Login Successful", 
          "Welcome to Smart Vyapar! We've verified a new login for your account. Enjoy your seamless billing experience!",
          "security",
          true
        );
        break;
      case 'export':
        await triggerNotification(
          "Export Completion", 
          "Your report is ready for download.",
          "export",
          true
        );
        break;
    }
  };

  // Tracks user activity on keyboard, mouse, or touch, and throttles updates to once per minute
  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    
    const now = Date.now();
    const lastActiveStr = localStorage.getItem(`sb_last_active_at_${userId}`);
    if (!lastActiveStr) {
      localStorage.setItem(`sb_last_active_at_${userId}`, now.toString());
    }

    let lastLogged = Date.now();
    const updateActivity = () => {
      const current = Date.now();
      if (current - lastLogged > 60000) { // Throttle updates to once per minute
        localStorage.setItem(`sb_last_active_at_${userId}`, current.toString());
        lastLogged = current;
        
        // Remove active inactivity flags when they become active
        [3, 7, 15, 30].forEach(days => {
          localStorage.removeItem(`sb_inactivity_alert_${days}d_${userId}`);
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('scroll', updateActivity);
      window.addEventListener('touchstart', updateActivity);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('scroll', updateActivity);
        window.removeEventListener('touchstart', updateActivity);
      }
    };
  }, [user]);

  // Automated inactive and inventory review checks
  useEffect(() => {
    if (!user || isBillingLoading || isInventoryLoading) return;
    const userId = user.uid;
    const now = Date.now();
    
    // 1. Business Inactivity Check
    const lastActiveStr = localStorage.getItem(`sb_last_active_at_${userId}`);
    if (!lastActiveStr) {
      localStorage.setItem(`sb_last_active_at_${userId}`, now.toString());
    } else {
      const lastActive = parseInt(lastActiveStr, 10);
      const elapsedDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      
      const checkAndTriggerInactivity = async (days: number, title: string, body: string) => {
        const key = `sb_inactivity_alert_${days}d_${userId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, 'true');
          await triggerNotification(title, body, 'inactivity');
        }
      };

      if (elapsedDays >= 30) {
        checkAndTriggerInactivity(30, "Business Inactivity Reminder", "Important reminder: Review inventory levels, pending dues and sales records.");
      } else if (elapsedDays >= 15) {
        checkAndTriggerInactivity(15, "Business Inactivity Reminder", "Your business performance report is waiting for review.");
      } else if (elapsedDays >= 7) {
        checkAndTriggerInactivity(7, "Business Inactivity Reminder", "Review your inventory, invoices and customer records.");
      } else if (elapsedDays >= 3) {
        checkAndTriggerInactivity(3, "Business Inactivity Reminder", "Your business records have not been updated recently.");
      }
    }

    // 2. Inventory Review Check (no inventory update for 7 days)
    const lastInventoryStr = localStorage.getItem(`sb_last_inventory_update_${userId}`);
    if (!lastInventoryStr) {
      localStorage.setItem(`sb_last_inventory_update_${userId}`, now.toString());
    } else {
      const lastInventory = parseInt(lastInventoryStr, 10);
      const elapsedDays = Math.floor((now - lastInventory) / (1000 * 60 * 60 * 24));
      
      if (elapsedDays >= 7) {
        const key = `sb_inventory_review_alert_7d_${userId}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, 'true');
          triggerNotification("Inventory Review Recommended", "Inventory review recommended. Some products may require stock verification.", "inventoryReview");
        }
      }
    }
  }, [user, settings, isBillingLoading, isInventoryLoading]);

  // Track inventory change timestamps dynamically
  const prevInventoryChecksumRef = React.useRef<string>('');
  useEffect(() => {
    if (!user || isBillingLoading || isInventoryLoading || inventory.length === 0) return;
    const userId = user.uid;
    const currentChecksum = inventory.map(i => `${i.id}:${i.stock}`).join(',');
    
    if (!prevInventoryChecksumRef.current) {
      prevInventoryChecksumRef.current = currentChecksum;
      if (!localStorage.getItem(`sb_last_inventory_update_${userId}`)) {
        localStorage.setItem(`sb_last_inventory_update_${userId}`, Date.now().toString());
      }
      return;
    }

    if (prevInventoryChecksumRef.current !== currentChecksum) {
      const now = Date.now();
      localStorage.setItem(`sb_last_inventory_update_${userId}`, now.toString());
      localStorage.removeItem(`sb_inventory_review_alert_7d_${userId}`);
      prevInventoryChecksumRef.current = currentChecksum;
      console.log(`Inventory modification detected. Touch stamp updated.`);
    }
  }, [user, inventory, isBillingLoading, isInventoryLoading]);

  // Automated checks for low stock and out-of-stock, including intelligent auto-clearing
  useEffect(() => {
    if (!user || isBillingLoading || isInventoryLoading) return;
    const userId = user.uid;

    // Self-correcting auto-clearing logic for restocked or deleted assets
    const activeUnreadLowStockAlerts = notifications.filter(n => n.type === 'lowStock' && !n.read);
    
    if (activeUnreadLowStockAlerts.length > 0) {
      activeUnreadLowStockAlerts.forEach(notif => {
        // Try to find the product in the current active inventory
        const product = inventory.find(p => notif.body.includes(`"${p.name}"`) || notif.title.includes(p.name));
        
        if (!product) {
          // 1. Product no longer exists (it was deleted by the user) -> clear stale unread warning
          markAsRead(notif.id);
          console.log(`Auto-cleared stale stock warning for deleted product reference: ${notif.title}`);
        } else {
          // 2. Product exists, check if its stock was refilled to a high level, or if status misaligned
          const stockVal = Number(product.stock ?? 0);
          const limitVal = Number(product.minStockAlert !== undefined && product.minStockAlert !== null ? product.minStockAlert : 5);
          const isValidNumber = product.stock !== undefined && product.stock !== null && !isNaN(stockVal);
          
          if (isValidNumber) {
            if (stockVal > limitVal) {
              markAsRead(notif.id);
              console.log(`Auto-cleared stale stock warning for replenished product: "${product.name}"`);
            } else if (stockVal <= 0 && notif.title === "Low Stock Alert") {
              // It's out of stock now, so the generic low stock alert is stale
              markAsRead(notif.id);
              console.log(`Auto-cleared generic low stock alert for out of stock product: "${product.name}"`);
            } else if (stockVal > 0 && notif.title === "Out of Stock Alert") {
              // It has stock now (even if low), so the out of stock alert is stale
              markAsRead(notif.id);
              console.log(`Auto-cleared stale out-of-stock alert for partially replenished product: "${product.name}"`);
            }
          }
        }
      });
    }

    if (inventory.length > 0) {
      const lowStockItems = inventory.filter(item => {
        const stockVal = Number(item.stock ?? 0);
        const limitVal = Number(item.minStockAlert !== undefined && item.minStockAlert !== null ? item.minStockAlert : 5);
        return stockVal <= limitVal;
      });

      // Sort low stock items so that completely out-of-stock (stock <= 0) items come first
      const sortedLowStockItems = [...lowStockItems].sort((a, b) => {
        const aStock = Number(a.stock ?? 0);
        const bStock = Number(b.stock ?? 0);
        if (aStock <= 0 && bStock > 0) return -1;
        if (bStock <= 0 && aStock > 0) return 1;
        return aStock - bStock;
      });

      let alertsTriggered = 0;
      const now = Date.now();

      for (const item of sortedLowStockItems) {
        if (alertsTriggered >= 3) break; // anti-spam brake limit

        const stockVal = Number(item.stock ?? 0);
        const isOut = stockVal <= 0;
        const expectedTitle = isOut ? "🚨 Inventory Empty" : "📉 Low Stock Alert";
        
        // Double check if we already have an active unread stock alert of THIS Specific severity for this identical product name
        // This prevents redundant/spam notifications, and avoids showing both at once.
        const alreadyNotified = notifications.some(
          n => n.type === 'lowStock' && !n.read && n.title === expectedTitle && n.body.includes(`"${item.name}"`)
        );

        if (!alreadyNotified) {
          const throttleKey = isOut ? `alert_outofstock_${item.id}` : `alert_lowstock_${item.id}`;
          const lastAlertTime = localStorage.getItem(throttleKey);
          
          // Alert frequency throttle: once per 12 hours (43200000ms) to maintain sanity
          if (!lastAlertTime || (now - parseInt(lastAlertTime, 10)) > 43200000) {
            localStorage.setItem(throttleKey, now.toString());
            
            triggerNotification(
              expectedTitle, 
              isOut
                ? `Attention needed: "${item.name}" is completely out of stock. Time to restock!`
                : `Heads up! You're running low on "${item.name}" (Only ${stockVal} ${item.unit || 'units'} left).`, 
              "lowStock"
            );
            alertsTriggered++;
          }
        }
      }
    }
  }, [user, inventory, notifications, triggerNotification, markAsRead, isBillingLoading, isInventoryLoading]);

  // Automated checks for pending payments (duePayment), including intelligent auto-clearing
  useEffect(() => {
    if (!user || isBillingLoading || !bills) return;
    const userId = user.uid;

    // 1. Self-correcting auto-clearing logic for paid or deleted invoices
    const activeUnreadDueAlerts = notifications.filter(n => n.type === 'duePayment' && !n.read);
    
    if (activeUnreadDueAlerts.length > 0) {
      activeUnreadDueAlerts.forEach(notif => {
        // Try to find the bill in current active bills list
        const bill = bills.find(b => notif.body.includes(b.invoiceNumber) || notif.title.includes(b.invoiceNumber));
        
        if (!bill) {
          // Bill no longer exists (deleted by user) -> clear stale unread alert
          markAsRead(notif.id);
          console.log(`Auto-cleared stale due payment warning for deleted invoice reference: ${notif.title}`);
        } else {
          // Bill exists, check if balance is cleared
          const balance = Number(bill.balanceAmount ?? 0);
          if (balance <= 0 || bill.paymentStatus === 'PAID') {
            markAsRead(notif.id);
            console.log(`Auto-cleared stale due payment warning for paid invoice: Invoice #${bill.invoiceNumber}`);
          }
        }
      });
    }

    // 2. Trigger due payment notifications for active pending / overdue invoices with balance > 0 (Only in the evening after 6 PM)
    const currentHour = new Date().getHours();
    if (bills.length > 0 && currentHour >= 18) {
      const pendingBills = bills.filter(b => {
        const balance = Number(b.balanceAmount ?? 0);
        return balance > 0 && (b.paymentStatus === 'PENDING' || b.paymentStatus === 'OVERDUE');
      });

      // Sort pending bills newest first
      const sortedPendingBills = [...pendingBills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      let alertsTriggered = 0;
      const now = Date.now();

      for (const bill of sortedPendingBills) {
        if (alertsTriggered >= 2) break; // anti-spam brake limit: max 2 dues alerts at once

        const balance = Number(bill.balanceAmount ?? 0);
        const expectedTitle = bill.paymentStatus === 'OVERDUE' ? "⚠️ Payment Overdue" : "⏳ Payment Pending";
        
        // Double check if we already have an active unread due alert of THIS specific severity for this bill
        const alreadyNotified = notifications.some(
          n => n.type === 'duePayment' && !n.read && n.title === expectedTitle && n.body.includes(bill.invoiceNumber)
        );

        if (!alreadyNotified) {
          const throttleKey = `alert_duepayment_${bill.billId}`;
          const lastAlertTime = localStorage.getItem(throttleKey);
          
          // Alert frequency throttle: once per 24 hours (86400000ms) to maintain sanity
          if (!lastAlertTime || (now - parseInt(lastAlertTime, 10)) > 86400000) {
            localStorage.setItem(throttleKey, now.toString());
            
            triggerNotification(
              expectedTitle, 
              `Action required: You have an outstanding balance of ₹${balance.toLocaleString('en-IN')} from "${bill.customerDetails.name}" for Invoice #${bill.invoiceNumber}.`,
              "duePayment"
            );
            alertsTriggered++;
          }
        }
      }
    }
  }, [user, bills, notifications, triggerNotification, markAsRead, isBillingLoading]);

  // Automated Authorized Login Alerts (security) on active login
  useEffect(() => {
    if (user && sessionStorage.getItem('active_login_action_taken') === 'true') {
      sessionStorage.removeItem('active_login_action_taken');
      
      const deviceKey = `known_device_${user.uid}`;
      const isKnownDevice = localStorage.getItem(deviceKey);
      
      if (!isKnownDevice) {
        localStorage.setItem(deviceKey, 'true');
        triggerNotification(
          "🔒 Login Successful", 
          `Welcome to Smart Vyapar! We've verified a new login for ${user.email || 'Admin'}. Enjoy your seamless billing experience!`, 
          "security"
        );
      }
    }
  }, [user, triggerNotification]);

  // Automated Daily/Weekly/Monthly business summary notifications based on real data
  useEffect(() => {
    if (!user || isBillingLoading || !bills || bills.length === 0) return;
    const userId = user.uid;
    const now = new Date();
    
    // 1. Daily Operations Digest (EOD)
    if (settings.dailyBusinessSummary) {
      const currentHour = now.getHours();
      // Only send daily digest in the evening (after 6 PM)
      if (currentHour >= 18) {
        const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `sb_eod_digest_alert_${todayStr}_${userId}`;
        if (!localStorage.getItem(key)) {
          try {
            const todayCache = getCacheForRange("TODAY");
            const metrics = todayCache?.metrics;
            
            if (metrics && metrics.totalInvoices > 0) {
              localStorage.setItem(key, 'true');
              triggerNotification(
                "📊 Daily Snapshot", 
                `Great day! You generated ${metrics.totalInvoices} invoices today, bringing in ₹${metrics.totalRevenue.toLocaleString('en-IN')} with an estimated profit of ₹${metrics.totalProfit.toLocaleString('en-IN')}.`,
                "dailySummary"
              );
            }
          } catch (e) {
            console.warn("Could not generate daily digest notification dynamically:", e);
          }
        }
      }
    }

    // 2. Weekly Analytics Report
    if (settings.weeklyBusinessReport) {
      const currentDayOfWeek = now.getDay(); // 0 is Sunday
      const currentHour = now.getHours();
      
      // Only send weekly report on Sunday evening (after 6 PM)
      if (currentDayOfWeek === 0 && currentHour >= 18) {
        const getWeekKey = (d: Date) => {
          const oneJan = new Date(d.getFullYear(), 0, 1);
          const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
          const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
          return `${d.getFullYear()}_W${weekNum}`;
        };
        
        const weekStr = getWeekKey(now);
        const key = `sb_weekly_report_alert_${weekStr}_${userId}`;
        if (!localStorage.getItem(key)) {
          try {
            const weeklyCache = getCacheForRange("THIS_WEEK");
            const metrics = weeklyCache?.metrics;
            
            if (metrics && metrics.totalInvoices > 0) {
              localStorage.setItem(key, 'true');
              triggerNotification(
                "📈 Weekly Performance Insights", 
                `Incredible week! You processed ${metrics.totalInvoices} invoices for a total revenue of ₹${metrics.totalRevenue.toLocaleString('en-IN')} (Estimated profit: ₹${metrics.totalProfit.toLocaleString('en-IN')}). Keep the momentum going!`,
                "weeklySummary"
              );
            }
          } catch (e) {
            console.warn("Could not generate weekly report notification dynamically:", e);
          }
        }
      }
    }

    // 3. Monthly Performance Report
    if (settings.monthlyPerformanceReport) {
      const todayDate = now.getDate();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentHour = now.getHours();
      
      // Only send monthly report on the last day of the month, after 6 PM
      if (todayDate === lastDayOfMonth && currentHour >= 18) {
        const monthStr = `${now.getFullYear()}_M${now.getMonth() + 1}`;
        const key = `sb_monthly_report_alert_${monthStr}_${userId}`;
        if (!localStorage.getItem(key)) {
          try {
            const monthlyCache = getCacheForRange("THIS_MONTH");
            const metrics = monthlyCache?.metrics;
            
            if (metrics && metrics.totalInvoices > 0) {
              localStorage.setItem(key, 'true');
              triggerNotification(
                "🏆 Monthly Milestone Reached", 
                `Outstanding month! You achieved a total revenue of ₹${metrics.totalRevenue.toLocaleString('en-IN')} across ${metrics.totalInvoices} invoices (Estimated profit: ₹${metrics.totalProfit.toLocaleString('en-IN')}). Fantastic work!`,
                "monthlySummary"
              );
            }
          } catch (e) {
            console.warn("Could not generate monthly summary notification dynamically:", e);
          }
        }
      }
    }
  }, [user, bills, settings, getCacheForRange, isBillingLoading, triggerNotification]);

  // Request trigger permission after login automatically
  useEffect(() => {
    if (user && permissionGranted === null) {
      // Small timeout so user is fully signed in and landing on page has finished
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    } else if (user && permissionGranted === true) {
      initializeFCM();
    }
  }, [user, permissionGranted, initializeFCM]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      permissionGranted,
      fcmToken,
      settings,
      requestPermission,
      updateSettings,
      markAsRead,
      markAllAsRead,
      clearAll,
      triggerNotification,
      testTriggerNotification,
      addCustomNotification: async (title: string, body: string, type: string) => {
        await triggerNotification(title, body, type as any, true);
      }
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
