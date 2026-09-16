"use client";

import { Diamond } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getAgentMediaUrl } from "@/lib/inventory-media";

export function InventoryCardImage({
  imageId,
  code,
  className,
}: {
  imageId?: string | null;
  code: string;
  className?: string;
}) {
  const imageUrl = getAgentMediaUrl(imageId);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = imageUrl && failedUrl !== imageUrl;

  return (
    <div
      className={`${className ?? ""} relative overflow-hidden border-b bg-muted/20`}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={`Product image for ${code}`}
          fill
          unoptimized
          sizes="(min-width: 640px) 384px, 50vw"
          className="object-cover"
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        <div
          aria-label="Product image unavailable"
          role="img"
          className="absolute inset-0 flex items-center justify-center"
        >
          <Diamond
            className="size-6 text-muted-foreground/40"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}
