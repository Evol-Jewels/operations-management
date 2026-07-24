import { FileImage, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadShopifyImage } from "@/lib/shopifyProductsApi";
import type {
  ShopifyMediaInput,
  ShopifyProductDetail,
} from "@/types/shopify-products";

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
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(uploadShopifyImage),
      );
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
      if (inputRef.current) inputRef.current.value = "";
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
        className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 p-5 text-center transition-colors hover:bg-muted/50"
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
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(event) => uploadFiles(event.target.files)}
      />

      <div className="space-y-2">
        {existingMedia.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div
              className="size-12 rounded-md border bg-muted bg-cover bg-center"
              style={
                item.preview?.image?.url
                  ? { backgroundImage: `url(${item.preview.image.url})` }
                  : undefined
              }
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {item.alt || item.mediaContentType}
              </p>
              <p className="text-xs text-muted-foreground">
                Existing Shopify media · {item.status}
              </p>
            </div>
          </div>
        ))}
        {media.map((item, index) => (
          <div
            key={`${item.originalSource}-${index}`}
            className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3"
          >
            <div className="grid size-12 place-items-center rounded-md border bg-background">
              <FileImage className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {item.filename || "New product image"}
              </p>
              <p className="text-xs text-muted-foreground">Ready to attach</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                onChange(media.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
