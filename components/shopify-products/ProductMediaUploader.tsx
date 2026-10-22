import { FileImage, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilePickerAccept } from "@/hooks/useFilePickerAccept";
import { uploadShopifyImage } from "@/lib/shopifyProductsApi";
import type {
  ShopifyMediaInput,
  ShopifyProductDetail,
} from "@/types/shopify-products";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  media: ShopifyMediaInput[];
  existingMedia?: ShopifyProductDetail["media"]["nodes"];
  onChange: (media: ShopifyMediaInput[]) => void;
}

export function ProductMediaUploader({
  media,
  existingMedia = [],
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = useFilePickerAccept(ACCEPTED_IMAGE_TYPES.join(","));
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: File[]) {
    const images = files.filter((file) =>
      ACCEPTED_IMAGE_TYPES.includes(file.type),
    );
    if (images.length < files.length) {
      toast.error("Choose JPEG, PNG or WebP images.");
    }
    if (!images.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(images.map(uploadShopifyImage));
      onChange([...media, ...uploaded]);
      toast.success(
        `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded to Shopify`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-semibold">Media</h2>
        <p className="text-sm text-muted-foreground">
          Images upload directly to Shopify and attach when you save.
        </p>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed bg-muted/20 p-4 text-center transition-colors hover:bg-muted/50 sm:min-h-32 sm:gap-2 sm:p-5"
      >
        {uploading ? (
          <LoaderCircle className="size-6 animate-spin" />
        ) : (
          <UploadCloud className="size-6" />
        )}
        <span className="text-sm font-medium">
          {uploading ? "Uploading to Shopify..." : "Choose product images"}
        </span>
        <span className="text-xs text-muted-foreground">
          JPEG, PNG or WebP · up to 20 MB each
        </span>
      </button>
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => {
          void uploadFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {existingMedia.length || media.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3">
          {existingMedia.map((item) => (
            <li key={item.id} className="min-w-0">
              <div
                role="img"
                aria-label={item.alt || item.mediaContentType}
                title={item.alt || item.mediaContentType}
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted bg-cover bg-center"
                style={
                  item.preview?.image?.url
                    ? { backgroundImage: `url(${item.preview.image.url})` }
                    : undefined
                }
              >
                <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                  {item.status}
                </span>
              </div>
            </li>
          ))}
          {media.map((item, index) => (
            <li key={`${item.originalSource}-${index}`} className="min-w-0">
              <div className="relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-2 text-center">
                <FileImage className="size-5 text-muted-foreground" />
                <p className="w-full truncate text-[11px] font-medium">
                  {item.filename || "New image"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Ready to attach
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={`Remove ${item.filename || "image"}`}
                  className="absolute top-1 right-1 size-8 rounded-full"
                  onClick={() =>
                    onChange(
                      media.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
