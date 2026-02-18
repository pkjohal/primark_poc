// Barcode scanner component using html5-qrcode

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [zoomLevel, setZoomLevel] = useState(1.5);
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

      const config = {
          fps: 30,
          qrbox: function(viewfinderWidth: number, _viewfinderHeight: number) {
            // Large scan area for distance scanning
            const width = Math.floor(viewfinderWidth * 0.85);
            const height = Math.floor(width * 0.3);
            return { width, height };
          },
          aspectRatio: 2.0,
          videoConstraints: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
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

      // Check zoom support and apply default zoom after camera starts
      setTimeout(() => {
        checkAndApplyZoom(1.5);
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
