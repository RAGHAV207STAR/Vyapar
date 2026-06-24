/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 
  | 'business_income'
  | 'business_expense'
  | 'customer_payment'
  | 'supplier_payment'
  | 'personal_income'
  | 'personal_expense'
  | 'owner_withdrawal'
  | 'owner_deposit';

export interface FinancialTransaction {
  id: string;
  businessId: string;
  transactionType: TransactionType;
  category: string;
  amount: number;
  source: string;
  referenceId?: string;
  notes?: string;
  attachmentUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transactionDate: string;
  isSynced?: boolean;
}

export interface UserProfile {
  uid: string;
  firebaseUid?: string; // Permanently linked to Firebase UID
  businessId?: string; // Auto-generated permanent unique ID
  email: string;
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  emailAddress?: string; // Business email explicitly
  address: string;
  logo?: string; // base64 data URL
  category: string;
  gstNumber?: string;
  upiId?: string;
  showUpiIdOnBill?: boolean;
  qrCode?: string; // base64 data URL
  website?: string;
  terms?: string;
  bankDetails?: string;
  businessDescription?: string;
  socialLinks?: string;
  invoicePrefix?: string;
  barcodeScannerEnabled?: boolean;
  documentFormatEnabled?: boolean;
  customerDetailsEnabled?: boolean;
  createdAt: string;
  status?: 'active' | 'deleted'; // Account status (soft delete)
  deletedAt?: string; // Soft deletion timestamp
  recoveryDeadline?: string; // 30-day recovery end timestamp
  role?: 'admin' | 'user' | 'manager' | 'staff';
  notificationSettings?: any;
}

export interface InventoryItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
  hsn?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  description?: string;
  createdAt: string;
  imageUrl?: string;
  supplierName?: string;
}

export interface StockMovement {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  date: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string;
  referenceId?: string; // e.g. Bill ID
  sku?: string;
  previousStock?: number;
  newStock?: number;
  actionType?: string; // e.g., 'Product Created', 'Stock Added', 'Stock Reduced', 'Invoice Generated', 'Stock Adjustment', 'Product Return', 'Manual Correction'
}

export interface ProductItem {
  id: string; // React list rendering key
  name: string;
  inventoryId?: string;
  sku?: string;
  barcode?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  gstPercent?: number; // GST Rate for this item specifically
  gstAmount?: number;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  gstNumber?: string;
  customerId?: string;
}

export interface OtherDetails {
  transport?: string;
  vehicleNumber?: string;
  placeOfSupply?: string;
  gstin?: string;
  deliveryDetails?: string;
  showSKU?: boolean;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT';

export interface Bill {
  billId: string;
  businessId?: string;
  userId: string;
  userUid?: string; // Internally map to firebaseUid
  invoiceNumber: string;
  invoiceDate: string;
  customerDetails: CustomerDetails;
  otherDetails?: OtherDetails;
  products: ProductItem[];
  subTotal: number;
  discountPercent: number;
  discountAmount: number;
  gstPercent?: number; // GST profile if flat
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number; // Grand Total
  paidAmount: number;
  balanceAmount: number;
  paymentMode: PaymentMode;
  notes?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'OVERDUE';
  createdAt: string;
  isSynced?: boolean; // Offline-first status tracker
}

export interface OfflineSyncQueueItem {
  id: string;
  type: 'PROFILE_UPDATE' | 'CREATE_BILL' | 'DELETE_BILL';
  payload: any;
  timestamp: string;
}

export interface DataCollisionSession {
  id: string;
  type: 'INVOICE' | 'STOCK';
  title: string;
  subtitle: string;
  recordId: string;
  localTimestamp: string;
  cloudTimestamp: string;
  localData: any;
  cloudData: any;
  fields: {
    key: string;
    label: string;
    localValue: any;
    cloudValue: any;
    differs: boolean;
    type: 'string' | 'number' | 'array' | 'object' | 'status' | 'currency';
  }[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

