const MAX_DIMENSION = 2000;
const MAX_SOURCE_IMAGE_BYTES = 25_000_000;
const TARGET_UPLOAD_BYTES = 3_500_000;
const SMALL_PASSTHROUGH_BYTES = 1_000_000;
const UPLOAD_TOO_LARGE_ERROR =
  "This image is too large to upload. Choose an image under 3.5 MB.";
const SOURCE_IMAGE_TOO_LARGE_ERROR =
  "This image is too large to process. Choose an image under 25 MB.";

function isHeicLike(file: File) {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function canUploadUnchanged(file: File) {
  return (
    !isHeicLike(file) &&
    /^(?:image\/(?:jpeg|jpg|png|webp))$/i.test(file.type) &&
    file.size <= SMALL_PASSTHROUGH_BYTES
  );
}

function replaceExtension(name: string, extension: string) {
  const baseName = name.replace(/\.[^.]+$/, "");
  return `${baseName || "image"}${extension}`;
}

export function isSupportedImageFile(file: File) {
  return (
    file.type.startsWith("image/") ||
    /\.(?:heic|heif|jpe?g|png|webp)$/i.test(file.name)
  );
}

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob) {
    throw new Error("Could not compress this image. Try a JPG or PNG photo.");
  }
  return blob;
}

async function decodeImage(file: File) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Some iPhone HEIC files fail in createImageBitmap; the image element is a fallback.
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error("Could not read this image. Try a JPG or PNG photo instead."),
      );
    };
    image.src = url;
  });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  const looksLikeImage = isSupportedImageFile(file);
  if (!looksLikeImage && file.size > TARGET_UPLOAD_BYTES) {
    throw new Error(UPLOAD_TOO_LARGE_ERROR);
  }
  if (!looksLikeImage) return file;
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error(SOURCE_IMAGE_TOO_LARGE_ERROR);
  }

  if (canUploadUnchanged(file)) {
    return file;
  }

  const source = await decodeImage(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(source.width, source.height),
  );
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    if ("close" in source) source.close();
    if (file.size > TARGET_UPLOAD_BYTES) {
      throw new Error(UPLOAD_TOO_LARGE_ERROR);
    }
    return file;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  if ("close" in source) source.close();

  let quality = 0.82;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > TARGET_UPLOAD_BYTES && quality > 0.55) {
    quality -= 0.1;
    blob = await canvasToJpeg(canvas, quality);
  }

  if (blob.size > TARGET_UPLOAD_BYTES) {
    throw new Error(UPLOAD_TOO_LARGE_ERROR);
  }

  return new File([blob], replaceExtension(file.name, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
