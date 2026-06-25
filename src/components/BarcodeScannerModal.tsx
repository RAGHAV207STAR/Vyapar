import React, { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import {
  X,
  Camera,
  AlertCircle,
  RefreshCw,
  Keyboard,
  ArrowRight,
  Smartphone,
  Barcode,
} from "lucide-react";

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function BarcodeScannerModal({
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [errorLine, setErrorLine] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    window.innerWidth < 768 ? "environment" : "user",
  );
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [permissionState, setPermissionState] = useState<
    "pending" | "granted" | "denied"
  >("pending");

  const stopCameraResources = async () => {
    // Check if scannerRef.current exists before accessing its properties
    // The type `any` might be needed if `.isScanning` is not properly typed, but Html5Qrcode has `isScanning` property
    if (scannerRef.current && (scannerRef.current as any).isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop scanner instance", err);
      }
    }
  };

  useEffect(() => {
    if (isManualMode) {
      // If manually typing, make sure camera is stopped immediately
      stopCameraResources();
      return;
    }

    const container = document.getElementById("qr-reader");
    if (container) {
      container.innerHTML = "";
    }

    let isMounted = true;
    let startPromise: Promise<any> | null = null;
    let localScanner: any = null;

    const initAndStartScanner = async () => {
      try {
        setPermissionState("pending");

        // Dynamically import Html5Qrcode to avoid permission prompt on app initialization
        const module = await import("html5-qrcode");
        if (!isMounted) return;

        const Html5QrCodeClass = module.Html5Qrcode;
        const html5QrCode = new Html5QrCodeClass("qr-reader");
        scannerRef.current = html5QrCode;
        localScanner = html5QrCode;

        startPromise = html5QrCode.start(
          { facingMode: facingMode },
          { fps: 10, aspectRatio: 1.0 },
          (decodedText) => {
            if (isMounted) {
              // Successfully scanned! Release camera resources immediately
              stopCameraResources().finally(() => {
                onScan(decodedText);
              });
            }
          },
          () => {
            // Ignored scan failures (noise)
          },
        );

        await startPromise;

        if (isMounted) {
          setErrorLine(null);
          setPermissionState("granted");
        } else {
          // If unmounted during start, clean up immediately
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }
        }
      } catch (err: any) {
        console.warn("Camera start or permission error", err);
        if (isMounted) {
          setPermissionState("denied");
          if (
            err?.name === "NotAllowedError" ||
            err?.message?.includes("Permission denied")
          ) {
            setErrorLine("Camera permission was denied or blocked.");
          } else {
            setErrorLine(
              "Camera scanner is unavailable or requires secure HTTPS context.",
            );
          }
        }
      }
    };

    initAndStartScanner();

    return () => {
      isMounted = false;
      // Release camera tracks immediately on unmount/close
      if (localScanner && (localScanner as any).isScanning) {
        localScanner.stop().catch(() => {});
      } else if (startPromise) {
        // If unmount occurs while start is still resolving
        startPromise
          .then(() => {
            if (localScanner && (localScanner as any).isScanning) {
              localScanner.stop().catch(() => {});
            }
          })
          .catch(() => {});
      }
    };
  }, [facingMode, onScan, isManualMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      // Trigger scan callback with the manually entered code
      onScan(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-md max-h-[95vh] overflow-hidden relative flex flex-col border border-slate-100/50 animate-in zoom-in-95 duration-200 text-left">
        {/* MODAL HEADER */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-400/30">
              {isManualMode ? (
                <Keyboard className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5] sm:stroke-[2]" />
              ) : (
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.5] sm:stroke-[2]" />
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                {isManualMode ? "Manual Barcode Entry" : "Scan Barcode"}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {isManualMode
                  ? "Type code or SKU identifier"
                  : "Auto-captures when aligned"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraResources().finally(() => {
                onClose();
              });
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-200/60 text-slate-400 hover:text-rose-600 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div
          className={`p-0 bg-slate-900 flex-1 relative w-full flex-col justify-center min-h-[250px] sm:min-h-[300px] overflow-hidden ${isManualMode ? "hidden" : "flex"}`}
        >
          {/* ACTIVE CAMERA MODE */}
          <>
            {errorLine ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-10 px-4 sm:px-6 text-center text-slate-200 overflow-y-auto py-6">
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 text-rose-450 rounded-full flex items-center justify-center mb-3 shrink-0">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <h4 className="text-sm font-extrabold text-white mb-2">
                  Camera Access Restricted
                </h4>
                <p className="text-xs text-rose-200 font-semibold max-w-sm mb-3 leading-relaxed bg-rose-500/10 px-4 py-2.5 rounded-xl border border-rose-500/20">
                  {errorLine}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium max-w-sm mb-5 leading-relaxed">
                  Web browsers block direct camera access inside sandboxed
                  preview frames. Open this app in a new window to grant
                  permissions!
                </p>

                <div className="flex flex-col gap-2 w-full max-w-sm mx-auto mt-auto sm:mt-0">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-1.5 cursor-pointer no-underline text-center"
                  >
                    <span>Open App in New Tab ↗</span>
                  </a>

                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorLine(null);
                        setPermissionState("pending");
                        setFacingMode((prev) =>
                          prev === "environment" ? "user" : "environment",
                        );
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-200 py-2.5 sm:py-3 px-2 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Retry Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorLine(null);
                        setIsManualMode(true);
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-200 py-2.5 sm:py-3 px-2 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Enter SKU
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex flex-col justify-center items-center flex-1 min-h-[250px] sm:min-h-[300px]">
              {/* Overlay for loading state */}
              {permissionState === "pending" && !errorLine && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-[15] pointer-events-none bg-slate-950/90">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
                    Requesting camera...
                  </p>
                </div>
              )}

              {/* The target div for Html5Qrcode. Must remain in DOM to avoid React child removal crashes. */}
              <div
                id="qr-reader"
                className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full [&>canvas]:!hidden"
              />
            </div>

            {!errorLine && (
              <button
                onClick={() =>
                  setFacingMode((prev) =>
                    prev === "environment" ? "user" : "environment",
                  )
                }
                className="absolute bottom-4 right-4 bg-slate-800/90 hover:bg-slate-950 text-white backdrop-blur-md rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold border border-slate-700/60 shadow-xl flex items-center gap-1.5 sm:gap-2 transition-all z-20 cursor-pointer hover:border-slate-600"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Flip Camera
              </button>
            )}
          </>
        </div>

        <div
          className={`bg-slate-950 flex-1 relative flex-col justify-center min-h-[350px] sm:min-h-[400px] w-full pb-4 items-center overflow-x-hidden overflow-y-auto ${isManualMode ? "flex" : "hidden"}`}
        >
          {/* MANUAL INPUT MODE */}
          <div className="w-full h-full flex flex-col justify-center px-5 sm:px-8 py-8 sm:py-10">
            <form
              onSubmit={handleManualSubmit}
              className="space-y-6 sm:space-y-8 w-full max-w-sm mx-auto flex flex-col justify-center"
            >
              <div className="text-center mt-auto sm:mt-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-[0_0_30px_-5px_rgba(79,70,229,0.2)]">
                  <Keyboard className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Manual Entry
                </h4>
                {errorLine ? (
                  <p className="text-[11px] sm:text-xs text-rose-400 font-semibold mt-3 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 inline-block">
                    {errorLine}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-2">
                    Type the product barcode or SKU directly.
                  </p>
                )}
              </div>

              <div className="group w-full relative">
                <label className="block text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 sm:mb-3 text-left pl-1 group-focus-within:text-indigo-400 transition-colors">
                  Barcode Number / SKU
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none z-10">
                    <Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-slate-900 text-white border border-slate-800 rounded-xl sm:rounded-2xl py-4 sm:py-5 pl-12 sm:pl-14 pr-4 sm:pr-5 text-sm sm:text-base font-bold tracking-widest placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                    placeholder="Enter barcode..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    autoFocus={isManualMode}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!manualBarcode.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 sm:py-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none mb-auto sm:mb-0"
              >
                Confirm Code
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex flex-col items-center gap-3 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white rounded-lg text-slate-500 font-bold text-[10px] sm:text-xs border border-slate-200/60 w-full shadow-sm max-w-sm">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
            <span className="truncate">
              {isManualMode
                ? "Ready for fast keypad entry"
                : "Scanning auto-releases on finish"}
            </span>
          </div>

          <div className="flex gap-2 sm:gap-3 w-full max-w-sm mx-auto">
            {isManualMode ? (
              /* If in manual mode, offer to switch back to camera if they want to try again */
              <button
                type="button"
                onClick={() => {
                  setErrorLine(null);
                  setIsManualMode(false);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Switch to Camera</span>
              </button>
            ) : (
              /* If in camera mode, offer manual switch */
              <button
                type="button"
                onClick={() => {
                  setErrorLine(null);
                  setIsManualMode(true);
                }}
                className="flex-1 py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Type Manually</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopCameraResources().finally(() => {
                  onClose();
                });
              }}
              className="py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
