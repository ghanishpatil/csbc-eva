import { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore - html5-qrcode doesn't have TypeScript definitions
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X, AlertCircle, Camera } from 'lucide-react';
import { CyberCard } from './ui/CyberCard';
import { NeonButton } from './ui/NeonButton';
import { sanitizeQRData, validateQRFormat } from '@/utils/qrValidation';

interface QRScannerProps {
  onScanSuccess: (qrData: string) => void;
  onClose?: () => void;
  disabled?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onClose,
  disabled = false,
}) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [lastScanTime, setLastScanTime] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUnmountingRef = useRef(false);
  
  // Rate limiting: Prevent rapid multiple scans (min 2 seconds between scans)
  const SCAN_COOLDOWN_MS = 2000;

  // Auto-start camera when component mounts
  useEffect(() => {
    if (disabled || isUnmountingRef.current) return;
    
    // Auto-start scanning after a delay to ensure DOM is ready
    const timer = setTimeout(async () => {
      if (!scanning && !scannerRef.current && !isUnmountingRef.current && !disabled) {
        await startScanning();
      }
    }, 500); // Increased delay for DOM stability

    return () => {
      clearTimeout(timer);
      isUnmountingRef.current = true;
      
      // Cleanup on unmount - ensure scanner is stopped
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        
        // Helper function to handle cleanup errors silently
        const handleCleanupError = (err: any) => {
          // Silently ignore all DOM-related errors during unmount
          const errorMsg = err?.message || '';
          const isDOMError = 
            errorMsg.includes('removeChild') ||
            errorMsg.includes('not a child') ||
            errorMsg.includes('Node was not found') ||
            errorMsg.includes('already stopped');
          
          if (!isDOMError) {
            console.warn('Scanner unmount cleanup:', err);
          }
        };
        
        // Stop scanner asynchronously
        scanner.stop().catch(handleCleanupError);
      }
      
      // Force clear DOM container
      try {
        const element = document.getElementById('qr-reader');
        if (element) {
          element.innerHTML = '';
        }
      } catch (e) {
        // Ignore all errors during unmount
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const startScanning = async () => {
    if (disabled || scanning || isUnmountingRef.current) return;

    // If already scanning, don't start again
    if (scannerRef.current) {
      return;
    }

    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if the DOM element exists
    const element = document.getElementById('qr-reader');
    if (!element) {
      setError('Scanner container not found. Please try again.');
      return;
    }

    // CRITICAL: Completely clear the container before initializing
    // This prevents DOM errors from leftover elements
    try {
      // Remove all children safely
      while (element.firstChild) {
        try {
          if (element.firstChild.parentNode === element) {
            element.removeChild(element.firstChild);
          } else {
            break;
          }
        } catch (e) {
          // If removal fails, force clear by setting innerHTML
          element.innerHTML = '';
          break;
        }
      }
      // Ensure container is empty
      if (element.children.length > 0) {
        element.innerHTML = '';
      }
    } catch (e) {
      // If manual cleanup fails, force clear
      try {
        element.innerHTML = '';
      } catch (e2) {
        console.warn('Could not clear scanner container:', e2);
      }
    }

    try {
      setError(null);
      setScanning(true);

      // Create new scanner instance with clean container
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      // Try to get available cameras first
      let cameraId: string | null = null;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          // Prefer back camera (environment facing)
          const backCamera = cameras.find(cam => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('rear'));
          cameraId = backCamera ? backCamera.id : cameras[0].id;
        }
      } catch (err) {
        console.warn('Could not enumerate cameras, using default:', err);
      }

      // Start scanner with camera
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false, // Allow QR code to be scanned in any orientation
        };

        // Wrap callback to prevent multiple rapid calls
        let scanProcessed = false;
        const scanCallback = (decodedText: string) => {
          if (!scanProcessed && scanning) {
            scanProcessed = true;
            handleScanSuccess(decodedText);
            // Reset after cooldown
            setTimeout(() => {
              scanProcessed = false;
            }, SCAN_COOLDOWN_MS);
          }
        };

        if (cameraId) {
          await scanner.start(
            cameraId,
            config,
            scanCallback,
            () => {
              // Error callback (ignore, this fires continuously when no QR is detected)
            }
          );
        } else {
          // Fallback to facingMode if camera enumeration failed
          await scanner.start(
            { facingMode: 'environment' },
            config,
            scanCallback,
            () => {
              // Error callback (ignore)
            }
          );
        }
        
      } catch (err: any) {
        console.error('Camera error:', err);
        // SECURITY: Don't expose detailed error messages to prevent information disclosure
        const errorMessage = err?.message || '';
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
          setError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('No camera found')) {
          setError('No camera found. Please connect a camera device.');
        } else {
          // Generic error message (don't leak internal details)
          setError('Failed to start camera. Please check your camera settings and try again.');
        }
        setScanning(false);
        if (scannerRef.current) {
          scannerRef.current = null;
        }
      }
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      // SECURITY: Generic error message
      setError('Failed to initialize QR scanner. Please try again.');
      setScanning(false);
    }
  };

  const stopScanning = useCallback(async () => {
    if (isUnmountingRef.current) {
      return;
    }

    const scanner = scannerRef.current;
    if (!scanner) {
      setScanning(false);
      return;
    }

    // Clear reference immediately to prevent re-entry
    scannerRef.current = null;

    try {
      // Stop the scanner first (this handles internal cleanup)
      await scanner.stop();
    } catch (err: any) {
      // Handle errors gracefully - DOM errors are expected during cleanup
      const errorMsg = err?.message || '';
      if (
        !errorMsg.includes('removeChild') &&
        !errorMsg.includes('not a child') &&
        !errorMsg.includes('Node was not found') &&
        !errorMsg.includes('already stopped')
      ) {
        console.warn('Scanner stop warning:', err);
      }
    }

    // Then manually clear the DOM container
    try {
      const element = document.getElementById('qr-reader');
      if (element) {
        // Use innerHTML for safe, complete cleanup
        element.innerHTML = '';
      }
    } catch (e) {
      // Ignore DOM errors during cleanup
    }

    if (!isUnmountingRef.current) {
      setScanning(false);
      setError(null);
    }
  }, []);

  const handleScanSuccess = useCallback((qrData: string) => {
    if (disabled) return;

    // Rate limiting: Prevent rapid scans
    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN_MS) {
      console.warn('Scan rate limit: Too many scans in short time');
      return;
    }

    // Sanitize and validate QR data (SECURITY: Prevent XSS and injection)
    const sanitized = sanitizeQRData(qrData);
    if (!sanitized) {
      setError('Invalid QR code format. Please scan a valid mission QR code.');
      return;
    }

    // Validate format
    if (!validateQRFormat(sanitized)) {
      setError('Invalid QR code format. Please scan a valid mission QR code.');
      return;
    }

    // Update last scan time
    setLastScanTime(now);
    
    // Stop scanning immediately to prevent multiple scans
    stopScanning();

    // Call success callback with validated and sanitized data
    onScanSuccess(sanitized);
  }, [disabled, lastScanTime, onScanSuccess]);

  const handleManualInputSubmit = () => {
    if (!manualInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    // Sanitize and validate (SECURITY: Same validation as scanned QR)
    const sanitized = sanitizeQRData(manualInput);
    if (!sanitized) {
      setError('Invalid QR code format. Please enter a valid mission QR code.');
      return;
    }

    if (!validateQRFormat(sanitized)) {
      setError('Invalid QR code format. Please enter a valid mission QR code.');
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN_MS) {
      setError('Please wait before submitting another QR code.');
      return;
    }

    setLastScanTime(now);
    setShowManualInput(false);
    setManualInput('');
    onScanSuccess(sanitized);
  };

  return (
    <CyberCard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-cyber-neon-blue/20 border border-cyber-neon-blue/50 flex items-center justify-center">
              <QrCode className="h-6 w-6 text-cyber-neon-blue" />
            </div>
            <div>
              <div className="text-cyber-text-secondary text-sm">QR CODE SCANNER</div>
              <div className="text-cyber-text-primary font-medium text-lg">
                Scan Mission QR Code
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={async () => {
                // Stop scanner first before closing to prevent DOM errors
                await stopScanning();
                // Small delay to ensure cleanup completes
                setTimeout(() => {
                  onClose();
                }, 100);
              }}
              className="p-2 rounded-lg hover:bg-cyber-bg-darker transition-colors"
              disabled={scanning}
            >
              <X className="h-5 w-5 text-cyber-text-secondary" />
            </button>
          )}
        </div>

        {/* Scanner Container */}
        <div className="relative">
          <div
            id="qr-reader"
            ref={containerRef}
            key="qr-reader-container"
            className={`w-full rounded-xl overflow-hidden bg-cyber-bg-darker border-2 border-cyber-border ${
              scanning ? 'min-h-[400px]' : 'min-h-[300px] flex items-center justify-center'
            }`}
          >
            {!scanning && !error && (
              <div className="text-center p-8">
                <Camera className="h-16 w-16 text-cyber-text-secondary mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="text-cyber-text-secondary">
                  {disabled 
                    ? 'Scanner disabled'
                    : 'Starting camera...'}
                </p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-cyber-neon-green rounded-lg w-64 h-64 animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-cyber-neon-red/10 border border-cyber-neon-red/50 rounded-xl p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-cyber-neon-red mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-cyber-neon-red font-medium mb-1">Scanner Error</div>
                {/* SECURITY: React automatically escapes HTML in text content */}
                <div className="text-cyber-text-secondary text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {scanning && (
            <div className="mt-4 bg-cyber-neon-blue/10 border border-cyber-neon-blue/50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-cyber-neon-blue text-sm">
                <QrCode className="h-4 w-4" />
                <span>Position the QR code within the frame</span>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Form */}
        {showManualInput && (
          <div className="bg-cyber-bg-darker border border-cyber-border rounded-xl p-4 space-y-3">
            <label className="block text-cyber-text-secondary text-sm mb-2">
              Enter QR Code Data
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => {
                // SECURITY: Limit input length and validate in real-time
                const value = e.target.value;
                if (value.length <= 500) {
                  setManualInput(value);
                  setError(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleManualInputSubmit();
                }
              }}
              placeholder="Enter QR code (e.g., mission:csbc:grp1:level1)"
              className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text-primary focus:outline-none focus:ring-2 focus:ring-cyber-neon-blue placeholder:text-cyber-text-secondary font-mono"
              maxLength={500}
            />
            <div className="flex gap-2">
              <NeonButton
                onClick={handleManualInputSubmit}
                disabled={disabled || !manualInput.trim()}
                className="flex-1"
                color="blue"
              >
                Submit
              </NeonButton>
              <NeonButton
                onClick={() => {
                  setShowManualInput(false);
                  setManualInput('');
                  setError(null);
                }}
                className="flex-1"
                color="gray"
                icon={X}
              >
                Cancel
              </NeonButton>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {scanning ? (
            <NeonButton
              onClick={stopScanning}
              className="flex-1"
              color="red"
              icon={X}
            >
              Stop Scanner
            </NeonButton>
          ) : (
            <>
              <NeonButton
                onClick={startScanning}
                disabled={disabled}
                className="flex-1"
                color="blue"
                icon={Camera}
              >
                {error ? 'Retry Scanner' : 'Start Scanner'}
              </NeonButton>
              {!showManualInput && (
                <NeonButton
                  onClick={() => setShowManualInput(true)}
                  disabled={disabled}
                  className="flex-1"
                  color="gray"
                  icon={QrCode}
                >
                  Enter Manually
                </NeonButton>
              )}
            </>
          )}
        </div>
      </div>
    </CyberCard>
  );
};

