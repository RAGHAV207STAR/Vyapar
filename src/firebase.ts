/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Check if Firebase is fully initialized with non-placeholder configurations
export const isFirebasePlaceholder = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === 'placeholder-api-key' ||
  firebaseConfig.projectId === 'placeholder-project';

// Global console interceptors to capture and recover gracefully from Quota Exceeded / Resource Exhausted errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    const msg = args.join(' ').toLowerCase();
    if (
      msg.includes('could not reach cloud firestore backend') ||
      msg.includes('code=unavailable') ||
      msg.includes('connection failed')
    ) {
      if (typeof console.debug === 'function') {
        console.debug('[Firestore Offline Notice Handled]:', ...args);
      }
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.join(' ').toLowerCase();
    if (
      msg.includes('could not reach cloud firestore backend') ||
      msg.includes('code=unavailable') ||
      msg.includes('connection failed')
    ) {
      if (typeof console.debug === 'function') {
        console.debug('[Firestore Offline Notice Handled]:', ...args);
      }
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

let firebaseApp: any;
let firebaseDb: any = null;
let firebaseAuth: any = null;

if (!isFirebasePlaceholder) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    firebaseDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);
  } catch (error) {
    console.warn("Failed to initialize active Firebase. Falling back to local offline storage mode.", error);
  }
}

export const db = firebaseDb;
export const auth = firebaseAuth;

export const cleanUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  // Do not traverse custom classes (like Date, Firestore FieldValue/Timestamp, etc.)
  if (obj.constructor && obj.constructor !== Object && obj.constructor !== Array) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = cleanUndefined(obj[key]);
    }
  }
  return result;
};

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = error?.code || 'unknown';

  const errInfo = {
    collectionPath: path ? path.split('/')[0] : 'unknown',
    documentId: path ? path.split('/').slice(1).join('/') : 'unknown',
    firebaseErrorCode: errCode,
    firebaseErrorMessage: errMessage,
    operationType,
    transactionStatus: 'failed_rolled_back',
    fullPath: path,
    timestamp: new Date().toISOString(),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null
    }
  };

  // Log complete Firebase details internally for diagnostics/monitoring
  console.error('[INTERNAL FIREBASE ERROR DIAGNOSTIC LOG]:', JSON.stringify(errInfo, null, 2));

  // Propagate the actual error so the UI can notify the user and act accordingly
  throw new Error(`Firebase operation failed [${errCode}]: ${errMessage}`);
}
