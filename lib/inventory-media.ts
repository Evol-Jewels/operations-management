import type { InventoryMedia, InventoryProduct } from "@/types/inventory-api";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export function isGoogleDriveStorageKey(value: string) {
  return value.startsWith("https://drive.google.com/uc?");
}

export function getInventoryMediaUrl(
  image: Pick<InventoryMedia, "id" | "storageKey">,
) {
  if (isGoogleDriveStorageKey(image.storageKey)) {
    if (!apiBaseUrl) return image.storageKey;
    return `${apiBaseUrl}/api/v1/products/media/${image.id}`;
  }

  return image.storageKey;
}

export function getInventoryMediaUrls(product: InventoryProduct) {
  return product.media
    .filter((item) => item.mediaType === "IMAGE")
    .map(getInventoryMediaUrl);
}
