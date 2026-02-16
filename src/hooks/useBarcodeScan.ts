// Hook for barcode scanning logic with beep

import { useState, useCallback } from 'react';
import { playBeep } from '@/lib/utils';

export function useBarcodeScan(onScan: (barcode: string) => void) {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  // Debounce duplicate scans within 2 seconds
  const DEBOUNCE_TIME = 2000;

  const handleScan = useCallback(
    (barcode: string) => {
      const now = Date.now();

      // Check if this is a duplicate scan
      if (barcode === lastScannedBarcode && now - lastScanTime < DEBOUNCE_TIME) {
        console.log('Duplicate scan ignored:', barcode);
        return;
      }

      // Play beep sound
      try {
        playBeep();
      } catch (err) {
        console.error('Failed to play beep:', err);
      }

      // Update tracking
      setLastScannedBarcode(barcode);
      setLastScanTime(now);

      // Call the callback
      onScan(barcode);
    },
    [lastScannedBarcode, lastScanTime, onScan]
  );

  const reset = useCallback(() => {
    setLastScannedBarcode(null);
    setLastScanTime(0);
  }, []);

  return {
    handleScan,
    reset,
  };
}
