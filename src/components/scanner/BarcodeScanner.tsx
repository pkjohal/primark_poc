// Barcode scanner component using html5-qrcode

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, Flashlight, FlashlightOff } from 'lucide-react';
import Button from '../ui/Button';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export default function BarcodeScanner({ onScan, onError, isActive = true }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const scannerIdRef = useRef(`barcode-scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    if (isActive && !scannerRef.current && scannerElementRef.current) {
      initScanner();
    }

    return () => {
      isMountedRef.current = false;
      // Stop scanner immediately on unmount
      const scanner = scannerRef.current;
      if (scanner) {
        scannerRef.current = null;

        // Stop scanner synchronously if possible
        try {
          const state = scanner.getState();
          console.log('Scanner state on unmount:', state);

          if (state === 2) { // SCANNING state
            // Stop the scanner (this is async but we trigger it)
            scanner.stop()
              .then(() => {
                console.log('Scanner stopped successfully');
                scanner.clear();
                // Force stop all media tracks
                stopAllMediaTracks();
              })
              .catch((err) => {
                console.error('Error stopping scanner:', err);
                scanner.clear();
                stopAllMediaTracks();
              });
          } else {
            scanner.clear();
            stopAllMediaTracks();
          }
        } catch (err) {
          console.error('Error in cleanup:', err);
          try {
            scanner.clear();
          } catch (e) {
            console.error('Error clearing scanner:', e);
          }
          stopAllMediaTracks();
        }
      }
    };
  }, [isActive]);

  // Helper function to force stop all media tracks
  const stopAllMediaTracks = () => {
    try {
      // Get all video elements and stop their streams
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
            console.log('Force stopped media track:', track.kind);
          });
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.error('Error stopping media tracks:', err);
    }
  };

  const initScanner = async () => {
    if (!scannerElementRef.current) return;

    // Prevent double initialization
    if (scannerRef.current) {
      console.log('Scanner already initialized');
      return;
    }

    try {
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      // Optimized config for barcode scanning at various distances
      const config = {
        fps: 10, // Standard frame rate for better compatibility
        qrbox: { width: 300, height: 150 }, // Fixed size for better performance
        aspectRatio: 1.777, // 16:9 aspect ratio
        disableFlip: false,
      };

      // Force back camera (environment-facing)
      const cameraConstraints = {
        facingMode: { exact: 'environment' }, // Force back camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      await scanner.start(
        cameraConstraints as any,
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

      if (isMountedRef.current) {
        setIsScanning(true);
        setError(null);
      }
    } catch (err: any) {
      console.error('Camera initialization error with advanced constraints:', err);

      // Try again with basic constraints if advanced features failed
      try {
        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        const basicConfig = {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.777,
        };

        await scanner.start(
          { facingMode: { exact: 'environment' } }, // Force back camera
          basicConfig,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.debug('Scan error:', errorMessage);
          }
        );

        if (isMountedRef.current) {
          setIsScanning(true);
          setError(null);
        }

        // Check torch support after successful camera start
        checkTorchSupport();
      } catch (fallbackErr: any) {
        const errorMsg = fallbackErr?.message || 'Failed to start camera';
        if (isMountedRef.current) {
          setError(errorMsg);
          if (onError) onError(errorMsg);
        }
        console.error('Camera initialization failed with fallback:', fallbackErr);
        scannerRef.current = null;
      }
    }

    // Check torch support after successful camera start
    checkTorchSupport();
  };

  // Check if torch/flashlight is supported
  const checkTorchSupport = async () => {
    try {
      const videoElement = document.querySelector(`#${scannerIdRef.current} video`) as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];
        videoTrackRef.current = videoTrack;

        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities && capabilities.torch) {
          setTorchSupported(true);
          console.log('Torch is supported');
        } else {
          setTorchSupported(false);
          console.log('Torch is not supported');
        }
      }
    } catch (err) {
      console.error('Error checking torch support:', err);
      setTorchSupported(false);
    }
  };

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!videoTrackRef.current || !torchSupported) return;

    try {
      const newTorchState = !torchEnabled;
      await videoTrackRef.current.applyConstraints({
        // @ts-ignore - torch is not in TypeScript definitions but supported by browsers
        advanced: [{ torch: newTorchState }]
      });
      setTorchEnabled(newTorchState);
      console.log('Torch toggled:', newTorchState);
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null; // Clear ref immediately to prevent double cleanup

      // Turn off torch if enabled
      if (torchEnabled && videoTrackRef.current) {
        try {
          await videoTrackRef.current.applyConstraints({
            // @ts-ignore
            advanced: [{ torch: false }]
          });
        } catch (err) {
          console.error('Error turning off torch:', err);
        }
      }

      try {
        const state = scanner.getState();
        if (state === 2) { // 2 = SCANNING state
          await scanner.stop();
        }
        scanner.clear();
        if (isMountedRef.current) {
          setIsScanning(false);
          setTorchEnabled(false);
          setTorchSupported(false);
        }
        videoTrackRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Still try to clear
        try {
          scanner.clear();
        } catch (e) {
          console.error('Force cleanup error:', e);
        }
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
        <div id={scannerIdRef.current} ref={scannerElementRef} />

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

        {isScanning && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <p className="text-white text-xs bg-black/50 inline-block px-3 py-1 rounded-full">
              Hold barcode 15-30cm from camera
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <Button
          onClick={toggleScanner}
          variant={isScanning ? 'danger' : 'primary'}
          size="sm"
          className='inline-flex text-center items-center gap-2'
        >
          {isScanning ? (
            <>
              <CameraOff size={20}/>
              Stop Camera
            </>
          ) : (
            <>
              <Camera size={20}/>
              Start Camera
            </>
          )}
        </Button>

        {isScanning && torchSupported && (
          <Button
            onClick={toggleTorch}
            variant={torchEnabled ? 'secondary' : 'outline'}
            size="sm"
            className='inline-flex text-center items-center gap-2'
          >
            {torchEnabled ? (
              <>
                <FlashlightOff size={20}/>
                Torch Off
              </>
            ) : (
              <>
                <Flashlight size={20}/>
                Torch On
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
