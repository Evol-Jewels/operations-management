"use client";

import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImagePreviewDialog({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[min(90vh,56rem)] max-w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden bg-black/95 p-2 sm:max-w-5xl sm:p-3">
        <DialogTitle className="sr-only">Image preview: {alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Enlarged preview of {alt}
        </DialogDescription>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-black">
          {/* biome-ignore lint/performance/noImgElement: preview URLs may be local blobs or remote references. */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="flex min-h-7 items-center gap-2 px-1 text-xs text-white/70">
          <Maximize2 className="size-3.5 shrink-0" />
          <span className="truncate">{alt}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
