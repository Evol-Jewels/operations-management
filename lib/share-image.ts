export type ShareImageResult =
  | "shared"
  | "whatsapp-clipboard"
  | "whatsapp-download";

let whatsappWindow: Window | null = null;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openWhatsAppWeb() {
  if (whatsappWindow && !whatsappWindow.closed) {
    whatsappWindow.focus();
    return;
  }

  whatsappWindow = window.open(
    "https://web.whatsapp.com/",
    "evol-whatsapp-share",
  );
  whatsappWindow?.focus();
}

async function copyPngToClipboard(blob: Blob) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function sharePngToWhatsApp({
  blob,
  filename,
  title,
}: {
  blob: Blob;
  filename: string;
  title: string;
}): Promise<ShareImageResult> {
  const file = new File([blob], filename, { type: "image/png" });
  const shareData: ShareData = {
    files: [file],
    title,
    text: title,
  };
  const canShareFile =
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" || navigator.canShare(shareData));

  if (canShareFile) {
    await navigator.share(shareData);
    return "shared";
  }

  const copied = await copyPngToClipboard(blob);
  if (!copied) downloadBlob(blob, filename);
  openWhatsAppWeb();
  return copied ? "whatsapp-clipboard" : "whatsapp-download";
}
