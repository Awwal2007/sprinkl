import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Camera,
  Upload,
  QrCode,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import jsQR from 'jsqr';

/**
 * Validates whether the decoded QR code is an authentic Sprinkl giveaway.
 * Strictly rejects any third-party URLs, random text, or non-Sprinkl QR codes.
 */
export function parseAndValidateSprinklQr(qrData) {
  if (!qrData || typeof qrData !== 'string') {
    return { valid: false, error: 'Empty or invalid QR code data.' };
  }

  const trimmed = qrData.trim();

  // 1. Full URL matching (e.g. https://sprinkl.biz/g/:slug or http://localhost:3000/g/:slug)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsedUrl = new URL(trimmed);
      const hostname = parsedUrl.hostname.toLowerCase();

      // Allowed domains: official Sprinkl production/staging domains or current local host
      const isOfficialSprinkl =
        hostname === 'sprinkl.biz' ||
        hostname === 'www.sprinkl.biz' ||
        hostname === 'api.sprinkl.biz' ||
        hostname === 'sprinkl.ng' ||
        hostname === 'www.sprinkl.ng';

      const isCurrentHost =
        typeof window !== 'undefined' &&
        (hostname === window.location.hostname || hostname === 'localhost' || hostname === '127.0.0.1');

      if ((isOfficialSprinkl || isCurrentHost) && parsedUrl.pathname.startsWith('/g/')) {
        const parts = parsedUrl.pathname.replace(/^\/g\//, '').split('/');
        const slug = parts[0]?.split('?')[0];

        if (slug && /^[a-zA-Z0-9_-]+$/.test(slug)) {
          return {
            valid: true,
            slug,
            targetUrl: `/g/${slug}${parsedUrl.search || ''}`,
            original: trimmed,
          };
        }
      }

      // Any other website URL is rejected
      return {
        valid: false,
        error: 'This QR code points to an external website. Only authentic Sprinkl giveaway QR codes are supported.',
      };
    } catch {
      return { valid: false, error: 'Invalid URL format in QR code.' };
    }
  }

  // 2. Relative path matching (/g/:slug)
  if (trimmed.startsWith('/g/')) {
    const slug = trimmed.replace(/^\/g\//, '').split('/')[0]?.split('?')[0];
    if (slug && /^[a-zA-Z0-9_-]+$/.test(slug)) {
      return {
        valid: true,
        slug,
        targetUrl: `/g/${slug}`,
        original: trimmed,
      };
    }
  }

  // 3. Custom protocol scheme (sprinkl://g/:slug or sprinkl:g/:slug)
  const customSchemeMatch = trimmed.match(/^sprinkl:\/\/(?:g\/)?([a-zA-Z0-9_-]+)/i);
  if (customSchemeMatch && customSchemeMatch[1]) {
    const slug = customSchemeMatch[1];
    return {
      valid: true,
      slug,
      targetUrl: `/g/${slug}`,
      original: trimmed,
    };
  }

  return {
    valid: false,
    error: 'Unrecognized QR code. Only official Sprinkl giveaway QR codes can be scanned.',
  };
}

export default function ScanQrModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload'
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { valid, slug, targetUrl, error }
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Handle successful detection
  const handleQrDetected = useCallback(
    (rawData) => {
      const validation = parseAndValidateSprinklQr(rawData);

      if (validation.valid) {
        // Haptic feedback if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 60, 40]);
        }

        setScanResult(validation);
        stopCamera();

        // Redirect after brief visual confirmation
        setTimeout(() => {
          onClose();
          navigate(validation.targetUrl);
        }, 1200);
      } else {
        setScanResult(validation);
        // Reset error message after 3.5s to allow re-scanning
        setTimeout(() => {
          setScanResult((prev) => (prev && !prev.valid ? null : prev));
        }, 3500);
      }
    },
    [navigate, onClose, stopCamera]
  );

  // Scan video frame continuously
  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleQrDetected(code.data);
      return; // Stop loop on hit
    }

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleQrDetected]);

  // Start device camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScanResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.warn('[Camera Init Error]:', err.name, err.message);
      let message = 'Unable to access camera. Please check permissions or upload a QR image from your gallery.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser settings, or upload an image.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device. Please upload an image from your gallery.';
      }
      setCameraError(message);
      setActiveTab('upload');
    }
  }, [scanFrame, stopCamera]);

  // Handle image upload from file or gallery
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleQrDetected(code.data);
          } else {
            setScanResult({
              valid: false,
              error: 'No QR code detected in this image. Please upload a clear photo of a Sprinkl QR code.',
            });
          }
        } catch {
          setScanResult({
            valid: false,
            error: 'Failed to process image file. Please try another image.',
          });
        } finally {
          setIsProcessingFile(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setScanResult({
          valid: false,
          error: 'Could not load image file.',
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Manage camera on modal visibility and tab switch
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      if (activeTab === 'camera') {
        startCamera();
      } else {
        stopCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
    >
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 id="scan-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Scan Sprinkl QR Code
            </h2>
            <p className="text-xs text-slate-500 dark:text-dark-muted font-medium">
              Only authentic Sprinkl giveaway QR codes are supported
            </p>
          </div>
        </div>

        {/* Tab Switcher: Camera vs Upload */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4 border border-slate-200/80 dark:border-dark-border/60">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Use Camera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            TAB 1: LIVE CAMERA SCANNER
           ══════════════════════════════════════════════════════ */}
        {activeTab === 'camera' && (
          <div className="relative flex-1 flex flex-col items-center justify-center min-h-[290px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-dark-border">
            {cameraError ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <p className="text-xs text-red-300 leading-relaxed font-medium">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                {/* Dark Vignette Overlay with Center Viewfinder */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none flex items-center justify-center">
                  <div className="relative w-56 h-56 rounded-3xl border-2 border-brand-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                    {/* Viewfinder Corner Accents */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-xl" />

                    {/* Animated Scanning Laser Line */}
                    {isCameraActive && !scanResult?.valid && (
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_12px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
                    )}

                    <div className="text-[11px] font-bold text-white/90 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                      Align Sprinkl QR here
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            TAB 2: UPLOAD IMAGE / GALLERY
           ══════════════════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[290px] p-6 bg-slate-50 dark:bg-dark-bg/60 rounded-2xl border-2 border-dashed border-slate-300 dark:border-dark-border text-center space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-inner">
              {isProcessingFile ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Upload from Gallery or Files
              </h3>
              <p className="text-xs text-slate-500 dark:text-dark-muted max-w-xs mx-auto leading-relaxed">
                Screenshotted a Sprinkl giveaway QR code from Twitter, YouTube, or WhatsApp? Select the image here.
              </p>
            </div>

            <button
              type="button"
              disabled={isProcessingFile}
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>{isProcessingFile ? 'Scanning Image...' : 'Choose QR Image'}</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            FEEDBACK BANNERS (VALID vs INVALID SPRINKL QR)
           ══════════════════════════════════════════════════════ */}
        {scanResult && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border flex items-start gap-2.5 text-left text-xs transition-all ${
              scanResult.valid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 animate-in zoom-in-95'
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 animate-in shake'
            }`}
          >
            {scanResult.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-900 dark:text-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Official Sprinkl Giveaway Verified!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Redirecting you to claim your prize (Slug: <strong>{scanResult.slug}</strong>)...
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <span className="font-bold text-red-900 dark:text-red-200 block">Invalid QR Code</span>
                  <p className="text-[11px] leading-relaxed opacity-90">{scanResult.error}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer Guidance */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-dark-muted">
          <span>Supported: Sprinkl Giveaways (NGN / VTU / USDT)</span>
          <span className="font-semibold text-brand-600 dark:text-brand-400">Instant Claim</span>
        </div>
      </div>
    </div>
  );
}
