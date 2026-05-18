import { BrowserQRCodeReader } from "@zxing/browser";

type NativeBarcodeDetector = {
  detect: (
    source: ImageBitmapSource,
  ) => Promise<Array<{ rawValue?: string | null }>>;
};

type NativeBarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => NativeBarcodeDetector;

const QR_FORMATS = ["qr_code"];

function describeCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "Camera permission was denied. Allow camera access in the browser and try again.";
      case "NotFoundError":
      case "DevicesNotFoundError":
        return "No camera was found on this device.";
      case "NotReadableError":
      case "TrackStartError":
        return "The camera is already in use by another app or tab.";
      case "OverconstrainedError":
      case "ConstraintNotSatisfiedError":
        return "The preferred camera could not be started on this device.";
      case "AbortError":
        return "Camera startup was interrupted. Please try again.";
      case "SecurityError":
        return "Camera access is blocked in this browser context.";
      default:
        return error.message || "Camera scan failed.";
    }
  }

  if (error instanceof Error) {
    return error.message || "Camera scan failed.";
  }

  return "Camera scan failed.";
}

function getNativeBarcodeDetectorCtor(): NativeBarcodeDetectorCtor | null {
  const detector = globalThis as typeof globalThis & {
    BarcodeDetector?: NativeBarcodeDetectorCtor;
  };

  return detector.BarcodeDetector ?? null;
}

export function normalizeDecodedId(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (/\s/.test(normalized)) return null;
  return normalized.toUpperCase();
}

function extractDecodedId(
  values: Array<{ rawValue?: string | null }>,
): string | null {
  for (const entry of values) {
    const normalized = normalizeDecodedId(entry.rawValue ?? null);
    if (normalized) return normalized;
  }
  return null;
}

async function decodeFromNativeImage(
  source: ImageBitmapSource,
): Promise<string | null> {
  const Detector = getNativeBarcodeDetectorCtor();
  if (!Detector) return null;

  try {
    const detector = new Detector({ formats: QR_FORMATS });
    const barcodes = await detector.detect(source);
    return extractDecodedId(barcodes);
  } catch {
    return null;
  }
}

async function decodeFromZxingImage(file: Blob): Promise<string | null> {
  const reader = new BrowserQRCodeReader();
  const objectUrl = URL.createObjectURL(file);

  try {
    const result = await reader.decodeFromImageUrl(objectUrl);
    return normalizeDecodedId(result.getText());
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function decodeBarcodeFromImage(
  file: File,
): Promise<string | null> {
  const native = await decodeFromNativeImage(file);
  if (native) return native;
  return decodeFromZxingImage(file);
}

export async function startBarcodeCameraScan(
  video: HTMLVideoElement,
  onDecoded: (value: string) => void,
  onError: (message: string) => void,
): Promise<() => void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not supported in this browser.");
  }

  const nativeDetector = getNativeBarcodeDetectorCtor();

  if (nativeDetector) {
    let stream: MediaStream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (error) {
      throw new Error(describeCameraError(error));
    }

    let active = true;
    let frameId = 0;
    let detector: NativeBarcodeDetector | null = null;

    try {
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();
          return;
        }

        const handleLoadedMetadata = () => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          resolve();
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
      });
      await video.play();

      detector = new nativeDetector({ formats: QR_FORMATS });

      const tick = async () => {
        if (!active) return;
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            const barcodes = await detector!.detect(video);
            const decoded = extractDecodedId(barcodes);
            if (decoded) {
              active = false;
              onDecoded(decoded);
              return;
            }
          } catch {
            // Keep scanning until the user stops or a readable frame appears.
          }
        }
        frameId = window.setTimeout(() => {
          void tick();
        }, 200);
      };

      void tick();
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error(describeCameraError(error));
    }

    return () => {
      active = false;
      if (frameId) {
        window.clearTimeout(frameId);
      }
      video.pause();
      video.srcObject = null;
      stream.getTracks().forEach((track) => track.stop());
    };
  }

  const reader = new BrowserQRCodeReader();
  let controls;

  try {
    controls = await reader.decodeFromConstraints(
      {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      },
      video,
      (result, _error) => {
        if (!result) return;
        const decoded = normalizeDecodedId(result.getText());
        if (decoded) {
          onDecoded(decoded);
        } else {
          onError("Decoded value was empty or invalid.");
        }
      },
    );
  } catch (error) {
    throw new Error(describeCameraError(error));
  }

  return () => {
    controls.stop();
    video.pause();
    video.srcObject = null;
  };
}
