// Barcode scanner component using html5-qrcode

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';
import Button from '../ui/Button';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export default function BarcodeScanner({ onScan, onError, isActive = true }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && !scannerRef.current && scannerElementRef.current) {
      initScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  const initScanner = async () => {
    if (!scannerElementRef.current) return;

    try {
      const scanner = new Html5Qrcode('barcode-scanner');
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          // Scanning errors are expected when no barcode is in view
          // We only log them, not display them
          console.debug('Scan error:', errorMessage);
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start camera';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      console.error('Camera initialization error:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const toggleScanner = async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      await initScanner();
    }
  };

  return (
    <div className="w-full">
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
        <div id="barcode-scanner" ref={scannerElementRef} />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-primark-navy/90 p-6">
            <div className="text-center text-white">
              <CameraOff size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-semibold mb-2">Camera Access Required</p>
              <p className="text-sm opacity-80 mb-4">{error}</p>
              <Button onClick={initScanner} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!isScanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-primark-navy/90">
            <div className="text-center text-white">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Camera Inactive</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          onClick={toggleScanner}
          variant={isScanning ? 'danger' : 'primary'}
          size="sm"
        >
          {isScanning ? (
            <>
              <CameraOff size={20} className="mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera size={20} className="mr-2" />
              Start Camera
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
