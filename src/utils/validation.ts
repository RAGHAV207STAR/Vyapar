import React from 'react';

/**
 * Vyapar Mitra - Enterprise Input Validation & Formatting Utility
 */

/**
 * Format Owner Name: Keep only alphabets, spaces, dots, hyphens
 * and automatically capitalize the first letter of each word.
 */
export function formatOwnerName(value: string): string {
  // Allow letters, spaces, dots, to allow names like Amit Kumar, Raghav Pratap, J. P. Singh
  const cleaned = value.replace(/[^a-zA-Z\s.\-]/g, '');
  // Auto uppercase first letter of each word
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Format Shop Name: Keep letters, numbers, spaces, and basic business symbols
 */
export function formatShopName(value: string): string {
  // Allow letters, numbers, spaces, and standard business punctuation like Balaji Traders, Sharma Cement Store, ABC Co.
  return value.replace(/[^a-zA-Z0-9\s.&'\-\/()]/g, '');
}

/**
 * Format Mobile Phone: Numeric only, max 10 digits
 */
export function formatMobileNumber(value: string): string {
  // Only digits
  const cleaned = value.replace(/[^0-9]/g, '');
  // Cap at 10 digits
  return cleaned.slice(0, 10);
}

/**
 * Validates whether a mobile number matches 10 digits pattern
 */
export function validateMobileNumber(value: string): boolean {
  if (!value) return true; // optional fields
  return /^[6-9]\d{9}$/.test(value); // Standard Indian mobile starts with 6-9 and is 10 digits
}

/**
 * Format GST Number: Max 15 alphanumeric characters automatically converted to uppercase
 */
export function formatGSTNumber(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
}

/**
 * Validate GST Number pattern: 15-character alphanumeric (Standard GSTIN format)
 */
export function validateGSTNumber(value: string): boolean {
  if (!value) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.toUpperCase());
}

/**
 * Format UPI ID: alphanumeric, dots, hyphens, and '@' symbol
 */
export function formatUpiId(value: string): string {
  return value.replace(/[^a-zA-Z0-9.\-@]/g, '').toLowerCase();
}

/**
 * Validate UPI ID format: e.g. owner@paytm, name@okhdfcbank
 */
export function validateUpiId(value: string): boolean {
  if (!value) return true;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value);
}

/**
 * Validate Email address
 */
export function validateEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Format Address: Alphanumeric and common address symbols
 */
export function formatAddress(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s.,#\-\/()'"&_]/g, '');
}

/**
 * Standard automatic next input selector handler
 */
export function handleEnterToNext(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) {
  if (e.key === 'Enter') {
    // If it's a textarea, let Enter work for multiline if shift is not pressed,
    // otherwise if shift is pressed, or if it's a normal input, auto-advance focus.
    if (e.currentTarget.tagName === 'TEXTAREA' && !e.shiftKey) {
      // Allow regular new lines in multi-line address textareas
      return;
    }
    
    e.preventDefault();
    const form = e.currentTarget.form;
    if (form) {
      const elements = Array.from(form.elements) as HTMLElement[];
      const index = elements.indexOf(e.currentTarget);
      
      for (let i = index + 1; i < elements.length; i++) {
        const nextElement = elements[i];
        
        // Checks that next element is focusable and is not a submit/reset button or general non-input button
        const isButton = nextElement.tagName === 'BUTTON' || 
                         (nextElement.tagName === 'INPUT' && (nextElement as HTMLInputElement).type === 'submit' || (nextElement as HTMLInputElement).type === 'button');
        const isDisabled = nextElement.hasAttribute('disabled') || (nextElement as any).disabled === true;
        const isHidden = nextElement.hasAttribute('hidden') || (nextElement as any).type === 'hidden' || nextElement.classList.contains('hidden');
        const isReadOnly = nextElement.hasAttribute('readonly');

        if (nextElement && !isButton && !isDisabled && !isHidden && !isReadOnly) {
          nextElement.focus();
          // Select all content if it's an input for convenient typing
          if (nextElement instanceof HTMLInputElement && (nextElement.type === 'text' || nextElement.type === 'number' || nextElement.type === 'tel')) {
            nextElement.select();
          }
          break;
        }
      }
    }
  }
}
