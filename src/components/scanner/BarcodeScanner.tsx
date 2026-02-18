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

      // Get list of cameras and try to find back camera
      let cameraId: string | undefined;
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices);

        // Look for back camera (environment facing)
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        if (backCamera) {
          cameraId = backCamera.id;
          console.log('Found back camera:', backCamera.label);
        } else if (devices.length > 0) {
          // If no back camera found by label, try the last camera (usually back on mobile)
          cameraId = devices[devices.length - 1].id;
          console.log('Using last camera (likely back):', devices[devices.length - 1].label);
        }
      } catch (err) {
        console.log('Could not get camera list, will use facingMode instead');
      }

      // High quality config for distance barcode scanning
      const config = {
        fps: 30,
        qrbox: function(viewfinderWidth: number, _viewfinderHeight: number) {
          // Very large scan area - 90% of width for maximum coverage
          const width = Math.floor(viewfinderWidth * 0.9);
          const height = Math.floor(width * 0.35); // Wide and short for barcode format
          return {
            width: width,
            height: height
          };
        },
        aspectRatio: 1.777, // 16:9 aspect ratio
        disableFlip: false,
        videoConstraints: {
          width: { ideal: 1920 }, // Higher resolution for distance scanning
          height: { ideal: 1080 },
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Native barcode detector for better distance detection
        }
      };

      // Use specific camera ID if found, otherwise use facingMode
      if (cameraId) {
        // Start with specific camera ID (most reliable for selecting back camera)
        console.log('Starting scanner with camera ID:', cameraId);
        await scanner.start(
          cameraId,
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.debug('Scan error:', errorMessage);
          }
        );
      } else {
        // Fallback to facingMode if no camera ID found
        console.log('Starting scanner with facingMode');
        const cameraConstraints = {
          facingMode: { exact: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };

        await scanner.start(
          cameraConstraints as any,
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.debug('Scan error:', errorMessage);
          }
        );
      }

      if (isMountedRef.current) {
        setIsScanning(true);
        setError(null);
      }

      // Apply zoom after a short delay to ensure camera is fully initialized
      setTimeout(() => {
        applyZoom(1.5);
      }, 500);
    } catch (err: any) {
      console.error('Camera initialization error with advanced constraints:', err);

      // Try again with basic constraints if advanced features failed
      try {
        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        const basicConfig = {
          fps: 30,
           qrbox: function(viewfinderWidth: number, _viewfinderHeight: number) {
            // Very large scan area for distance scanning
            const width = Math.floor(viewfinderWidth * 0.9);
            const height = Math.floor(width * 0.35);
            return { width, height };
          },
          aspectRatio: 1.777,
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await scanner.start(
          {
            facingMode: { exact: 'environment' }, // Force back camera in fallback too
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
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
        // Apply zoom after a short delay
        setTimeout(() => {
          applyZoom(1.5);
        }, 500);
      } catch (fallbackErr: any) {
        console.error('Camera initialization failed with fallback:', fallbackErr);

        // Final attempt: Try without forcing back camera (for laptops with only front camera)
        try {
          const scanner = new Html5Qrcode(scannerIdRef.current);
          scannerRef.current = scanner;

          const finalConfig = {
            fps: 30,
            qrbox: function(viewfinderWidth: number, _viewfinderHeight: number) {
              const width = Math.floor(viewfinderWidth * 0.9);
              const height = Math.floor(width * 0.35);
              return { width, height };
            },
            aspectRatio: 1.777,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          };

          await scanner.start(
            { facingMode: 'environment' }, // Allow front camera as last resort
            finalConfig,
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

          checkTorchSupport();
          setTimeout(() => {
            applyZoom(1.5);
          }, 500);
        } catch (finalErr: any) {
          const errorMsg = finalErr?.message || 'Failed to start camera';
          if (isMountedRef.current) {
            setError(errorMsg);
            if (onError) onError(errorMsg);
          }
          console.error('All camera initialization attempts failed:', finalErr);
          scannerRef.current = null;
        }
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

  // Apply zoom to camera
  const applyZoom = async (zoomLevel: number) => {
    try {
      const videoElement = document.querySelector(`#${scannerIdRef.current} video`) as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];

        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities && capabilities.zoom) {
          const { min, max } = capabilities.zoom;
          // Clamp zoom level between min and max
          const clampedZoom = Math.min(Math.max(zoomLevel, min), max);

          await videoTrack.applyConstraints({
            // @ts-ignore - zoom is not in TypeScript definitions
            advanced: [{ zoom: clampedZoom }]
          });
          console.log(`Zoom applied: ${clampedZoom}x`);
        } else {
          console.log('Zoom is not supported on this device');
        }
      }
    } catch (err) {
      console.error('Error applying zoom:', err);
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
