import { useEffect, useRef } from 'react';

/**
 * Hook to detect USB/Bluetooth barcode scanner inputs globally.
 * Barcode scanners act like keyboards but type characters very rapidly, 
 * typically followed by an Enter key.
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const buffer = useRef('');
  const lastKeyTime = useRef(Date.now());

  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently focused on an input element
      const activeElement = document.activeElement;
      // ... rest is same
      if (
        activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement || 
        activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // If more than 50ms has passed since the last key, it's probably human typing
      // Reset the buffer
      if (timeDiff > 50) {
        buffer.current = '';
      }

      if (e.key === 'Enter') {
        if (buffer.current.length >= 3) { // Arbitrary minimum length for a barcode
          onScanRef.current(buffer.current);
          buffer.current = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Collect single characters
        buffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
