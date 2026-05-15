"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Camera, Upload, RefreshCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  decodeBarcodeFromImage,
  normalizeDecodedId,
  startBarcodeCameraScan,
} from "@/lib/barcodeScanner";

interface BarcodeScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecoded: (code: string) => void;
}

export function BarcodeScanDialog({
  open,
  onOpenChange,
  onDecoded,
}: BarcodeScanDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopScanRef = useRef<(() => void) | null>(null);
  const startInFlightRef = useRef(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const stopScan = useCallback(() => {
    stopScanRef.current?.();
    stopScanRef.current = null;
    startInFlightRef.current = false;
    setCameraStarted(false);
    setCameraBusy(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopScan();
      setScanError(null);
      setGalleryBusy(false);
      return;
    }

    return () => {
      stopScan();
    };
  }, [open, stopScan]);

  const handleDecoded = useCallback(
    (code: string) => {
      const normalized = normalizeDecodedId(code);
      if (!normalized) {
        setScanError("Decoded value was empty or invalid.");
        return;
      }

      stopScan();
      onOpenChange(false);
      onDecoded(normalized);
    },
    [onDecoded, onOpenChange, stopScan],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current || stopScanRef.current || startInFlightRef.current)
      return;

    startInFlightRef.current = true;
    setScanError(null);
    setCameraBusy(true);
    setCameraStarted(false);

    try {
      const cleanup = await startBarcodeCameraScan(
        videoRef.current,
        handleDecoded,
        (message) => setScanError(message),
      );
      stopScanRef.current = cleanup;
      setCameraStarted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Camera scan failed.";
      setScanError(message);
      setCameraStarted(false);
    } finally {
      startInFlightRef.current = false;
      setCameraBusy(false);
    }
  }, [handleDecoded]);

  useEffect(() => {
    if (
      !open ||
      cameraStarted ||
      stopScanRef.current ||
      startInFlightRef.current ||
      scanError
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void startCamera();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [cameraStarted, open, scanError, startCamera]);

  const handleFileSelect = async (file: File | null) => {
    if (!file || galleryBusy) return;
    setScanError(null);
    setGalleryBusy(true);

    try {
      const decoded = await decodeBarcodeFromImage(file);
      if (!decoded) {
        setScanError("No QR code could be decoded from that image.");
        return;
      }

      handleDecoded(decoded);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image decode failed.";
      setScanError(message);
    } finally {
      setGalleryBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scan QR or Barcode</DialogTitle>
          <DialogDescription>
            Scan the barcode on the product or upload an image from your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
            <div className="absolute inset-[9%] rounded-[30px] border border-white/20 bg-white/5 backdrop-blur-[1px]" />

            <div className="absolute left-[9%] top-[9%] h-14 w-14 rounded-tl-[28px] border-l-[7px] border-t-[7px] border-[#222]" />
            <div className="absolute right-[9%] top-[9%] h-14 w-14 rounded-tr-[28px] border-r-[7px] border-t-[7px] border-[#222]" />
            <div className="absolute bottom-[9%] left-[9%] h-14 w-14 rounded-bl-[28px] border-b-[7px] border-l-[7px] border-[#222]" />
            <div className="absolute bottom-[9%] right-[9%] h-14 w-14 rounded-br-[28px] border-b-[7px] border-r-[7px] border-[#222]" />

            {!cameraStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 px-6 text-center text-sm text-white/85">
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    {cameraBusy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                    <span>
                      {cameraBusy
                        ? "Opening camera..."
                        : (scanError ?? "Camera preview unavailable")}
                    </span>
                  </div>
                  {scanError && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setScanError(null);
                        void startCamera();
                      }}
                      disabled={cameraBusy}
                      className="mx-auto gap-2 rounded-full"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Retry camera
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 my-4 justify-center items-center">
            <div className="">or</div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={galleryBusy}
              variant="secondary"
              className="min-w-[220px] gap-2 rounded-full p-4 text-base font-semibold shadow-sm"
            >
              {galleryBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload from gallery
            </Button>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Align the code inside the frame, it might take a few seconds.
              Upload image from device if scan doesn&apos;t work.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) =>
                void handleFileSelect(e.target.files?.[0] ?? null)
              }
            />
          </div>
        </div>

        {scanError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {scanError}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
