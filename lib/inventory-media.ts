import type { InventoryMedia, InventoryProduct } from "@/types/inventory-api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
const productMediaProxyUrl = apiBaseUrl
  ? `${apiBaseUrl}/api/v1/products/media/`
  : null;

export function isGoogleDriveStorageKey(value: string) {
  return value.startsWith("https://drive.google.com/uc?");
}

export function isInventoryMediaProxyUrl(value: string) {
  return productMediaProxyUrl ? value.startsWith(productMediaProxyUrl) : false;
}

export function getInventoryMediaUrl(
  image: Pick<InventoryMedia, "id" | "storageKey">,
) {
  if (isGoogleDriveStorageKey(image.storageKey)) {
    if (!apiBaseUrl) return image.storageKey;
    return `${productMediaProxyUrl}${image.id}`;
  }

  return image.storageKey;
}

export function getInventoryMediaUrls(product: InventoryProduct) {
  return getInventoryImages(product).map(getInventoryMediaUrl);
}

export function getInventoryImages(product: InventoryProduct) {
  return product.media.filter((item) => item.mediaType === "IMAGE");
}
