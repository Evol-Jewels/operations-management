"use client";

import { PackageSearch } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  getInventoryImages,
  getInventoryMediaUrl,
} from "@/lib/inventory-media";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "@/types/inventory-api";
import {
  InventoryImageDownloadButton,
  InventoryProductImage,
} from "./InventoryProductImage";

const frameClassName =
  "group/image relative aspect-[4/3] overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm";
const imageClassName =
  "object-contain p-2 transition-transform duration-300 ease-out group-hover/image:scale-[1.01] motion-reduce:transition-none sm:p-3";
const imageSizes = "(min-width: 1024px) 50vw, 100vw";
const navButtonClassName =
  "z-30 hidden size-11 cursor-pointer border-border/70 bg-background/90 shadow-md backdrop-blur-md hover:bg-background sm:inline-flex";

function ProductImageFrame({
  image,
  productCode,
}: {
  image: ReturnType<typeof getInventoryImages>[number];
  productCode: string;
}) {
  return (
    <div className={frameClassName}>
      <InventoryProductImage
        image={image}
        sizes={imageSizes}
        className={imageClassName}
        showLabel
      />
      <InventoryImageDownloadButton
        imageUrl={getInventoryMediaUrl(image)}
        productCode={productCode}
        className="top-2 right-2 size-10"
      />
    </div>
  );
}

export function ProductMediaCarousel({
  product,
}: {
  product: InventoryProduct;
}) {
  const images = useMemo(() => getInventoryImages(product), [product]);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    const updateSelection = () => setSelectedIndex(api.selectedScrollSnap());
    updateSelection();
    api.on("select", updateSelection);
    api.on("reInit", updateSelection);

    return () => {
      api.off("select", updateSelection);
      api.off("reInit", updateSelection);
    };
  }, [api]);

  if (!images.length) {
    return (
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_36%,color-mix(in_oklab,var(--muted-foreground)_12%,transparent),transparent_58%)]">
        <div className="absolute inset-4 rounded-lg border border-dashed border-border/70" />
        <div className="relative flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex size-14 items-center justify-center rounded-full border border-border bg-background/70 shadow-sm backdrop-blur-sm">
            <PackageSearch className="size-6 opacity-50" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em]">
            Images unavailable
          </p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    const image = images[0];
    if (!image) return null;

    return (
      <div className="bg-muted/20 p-2 sm:p-4">
        <ProductImageFrame image={image} productCode={product.productCode} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 bg-muted/20 p-2 sm:gap-3 sm:p-4">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        className="min-w-0"
        aria-label={`${product.name} product images`}
      >
        <CarouselContent className="ml-0">
          {images.map((image) => (
            <CarouselItem key={image.id} className="pl-0">
              <ProductImageFrame
                image={image}
                productCode={product.productCode}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute top-3 left-3 z-20 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground shadow-sm backdrop-blur-md">
          {selectedIndex + 1} / {images.length}
        </div>
        <CarouselPrevious
          variant="secondary"
          className={cn("left-3", navButtonClassName)}
        />
        <CarouselNext
          variant="secondary"
          className={cn("right-3", navButtonClassName)}
        />
      </Carousel>

      <nav
        className="scrollbar-none flex gap-2 overflow-x-auto pb-0.5"
        aria-label="Choose a product image"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            aria-label={`Show image ${index + 1} of ${images.length}`}
            aria-current={selectedIndex === index ? "true" : undefined}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-background transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-16",
              selectedIndex === index
                ? "border-foreground ring-1 ring-foreground/15"
                : "border-border/80 opacity-65 hover:border-foreground/40 hover:opacity-100",
            )}
          >
            <Image
              src={getInventoryMediaUrl(image)}
              alt=""
              fill
              unoptimized
              sizes="64px"
              className="object-contain p-1"
            />
          </button>
        ))}
      </nav>
    </div>
  );
}
