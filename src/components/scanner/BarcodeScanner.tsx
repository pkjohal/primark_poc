// Barcode scanner component using html5-qrcode

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff, ZoomIn, ZoomOut } from 'lucide-react';
import Button from '../ui/Button';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export default function BarcodeScanner({ onScan, onError, isActive = true }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2.0);
  const [zoomSupported, setZoomSupported] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

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

      // Try to get specific back camera ID for Chrome compatibility
      let backCameraId: string | undefined;
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices.map(d => d.label));

        // Look for back/rear camera
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        if (backCamera) {
          backCameraId = backCamera.id;
          console.log('Using back camera:', backCamera.label);
        } else if (devices.length > 1) {
          // Use last camera (usually back camera on mobile)
          backCameraId = devices[devices.length - 1].id;
          console.log('Using last camera:', devices[devices.length - 1].label);
        }
      } catch (err) {
        console.log('Could not enumerate cameras, will use facingMode');
      }

      const config = {
          fps: 60, // Maximum FPS for fastest detection
          qrbox: function(viewfinderWidth: number, _viewfinderHeight: number) {
            // Very large scan area - 70% of screen for maximum coverage
            const width = Math.floor(viewfinderWidth * 0.7);
            const height = Math.floor(width * 0.35);
            return { width, height };
          },
          aspectRatio: 2.0,
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          formatsToSupport: [
            // Enable all 1D barcode formats for better detection
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ]
        };

      // Use camera ID if found (better for Chrome), otherwise use facingMode
      if (backCameraId) {
        console.log('Starting scanner with camera ID');
        await scanner.start(
          backCameraId,
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.debug('Scan error:', errorMessage);
          }
        );
      } else {
        console.log('Starting scanner with facingMode');
        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.debug('Scan error:', errorMessage);
          }
        );
      }

      setIsScanning(true);
      setError(null);

      // Check zoom support and apply 2x zoom for better distance detection
      setTimeout(() => {
        checkAndApplyZoom(2.0);
      }, 500);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start camera';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      console.error('Camera initialization error:', err);
    }
  };

  const checkAndApplyZoom = async (zoom: number) => {
    try {
      const videoElement = document.querySelector('#barcode-scanner video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];
        videoTrackRef.current = videoTrack;

        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities && capabilities.zoom) {
          setZoomSupported(true);
          await applyZoom(zoom);
          console.log('Zoom supported and applied:', zoom);
        } else {
          setZoomSupported(false);
          console.log('Zoom not supported on this device');
        }
      }
    } catch (err) {
      console.error('Error checking zoom support:', err);
    }
  };

  const applyZoom = async (zoom: number) => {
    if (!videoTrackRef.current) return;

    try {
      const capabilities = videoTrackRef.current.getCapabilities() as any;
      if (capabilities && capabilities.zoom) {
        const { min, max } = capabilities.zoom;
        const clampedZoom = Math.min(Math.max(zoom, min), max);

        await videoTrackRef.current.applyConstraints({
          // @ts-ignore
          advanced: [{ zoom: clampedZoom }]
        });
        setZoomLevel(clampedZoom);
        console.log(`Zoom applied: ${clampedZoom}x`);
      }
    } catch (err) {
      console.error('Error applying zoom:', err);
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.5, 3);
    applyZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.5, 1);
    applyZoom(newZoom);
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

        {isScanning && (
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <p className="text-white text-xs bg-black/60 inline-block px-3 py-1 rounded-full">
              Keep barcode inside the box • 20-40cm away
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2">
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

        {isScanning && zoomSupported && (
          <>
            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
              disabled={zoomLevel <= 1}
              className='inline-flex text-center items-center gap-2'
            >
              <ZoomOut size={20}/>
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
              disabled={zoomLevel >= 3}
              className='inline-flex text-center items-center gap-2'
            >
              <ZoomIn size={20}/>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
