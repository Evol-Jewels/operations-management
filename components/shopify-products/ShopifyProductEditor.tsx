"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ProductBasicsFields } from "@/components/shopify-products/ProductBasicsFields";
import { ProductMediaUploader } from "@/components/shopify-products/ProductMediaUploader";
import { ProductVariantsEditor } from "@/components/shopify-products/ProductVariantsEditor";
import {
  createPayload,
  EMPTY_PRODUCT_FORM,
  type ShopifyProductFormState,
  stateFromProduct,
  updatePayload,
} from "@/components/shopify-products/productFormUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateShopifyDraft,
  useShopifyCollections,
  useShopifyProduct,
  useUpdateShopifyProduct,
} from "@/hooks/useShopifyProducts";
import type {
  ShopifyMediaInput,
  ShopifyMutationResult,
  ShopifyProductDetail,
} from "@/types/shopify-products";

interface Props {
  mode: "create" | "edit";
  productId?: string;
}

interface FormProps extends Props {
  product?: ShopifyProductDetail;
}

function ProductForm({ mode, productId = "", product }: FormProps) {
  const [state, setState] = useState<ShopifyProductFormState>(() =>
    product ? stateFromProduct(product) : EMPTY_PRODUCT_FORM,
  );
  const [media, setMedia] = useState<ShopifyMediaInput[]>([]);
  const [result, setResult] = useState<ShopifyMutationResult | null>(null);
  const collectionsQuery = useShopifyCollections();
  const createMutation = useCreateShopifyDraft();
  const updateMutation = useUpdateShopifyProduct(productId);
  const mutation = mode === "create" ? createMutation : updateMutation;
  const isActive = product?.status === "ACTIVE";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.title.trim()) {
      toast.error("Product title is required");
      return;
    }
    if (
      isActive &&
      !window.confirm(
        "This product is active. Saving will update its live Shopify details. Continue?",
      )
    ) {
      return;
    }
    try {
      const response =
        mode === "create"
          ? await createMutation.mutateAsync(createPayload(state, media))
          : await updateMutation.mutateAsync(updatePayload(state, media));
      setResult(response);
      toast.success(
        mode === "create"
          ? "Draft created in Shopify"
          : "Product updated in Shopify",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Shopify could not save the product",
      );
    }
  }

  if (result) {
    return (
      <main className="mx-auto grid min-h-[65vh] w-full max-w-3xl place-items-center">
        <section className="flex w-full flex-col items-center gap-5 border-y py-10 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">{result.status}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {result.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "create"
                ? "The draft is ready for review in Shopify."
                : "Shopify now has the latest product details."}
            </p>
          </div>
          {result.warnings.length ? (
            <div className="w-full border-y border-destructive/30 bg-destructive/5 px-4 py-3 text-left text-sm">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/shopify-products">Back to products</Link>
            </Button>
            <Button asChild>
              <a href={result.adminUrl} target="_blank" rel="noreferrer">
                Open in Shopify <ArrowUpRight />
              </a>
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl pb-12">
      <form onSubmit={submit} className="space-y-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <Button asChild type="button" variant="ghost" size="icon-sm">
              <Link href="/shopify-products">
                <ArrowLeft />
              </Link>
            </Button>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {mode === "create"
                    ? "Upload new product"
                    : "Edit product details"}
                </h1>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {product?.status ?? "DRAFT"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {mode === "create"
                  ? "New products are always created as unpublished Shopify drafts."
                  : "Status and publishing remain controlled in Shopify Admin."}
              </p>
            </div>
          </div>
          {product ? (
            <Button asChild type="button" size="sm" variant="outline">
              <a href={product.adminUrl} target="_blank" rel="noreferrer">
                Open in Shopify <ArrowUpRight />
              </a>
            </Button>
          ) : null}
        </header>

        {isActive ? (
          <div className="flex gap-3 border-y border-amber-500/30 bg-amber-500/5 px-1 py-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <p>
              This product is active. Detail changes saved here can be visible
              to customers; its active status will not be changed.
            </p>
          </div>
        ) : null}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
          <div className="min-w-0 space-y-8">
            <section className="border-b pb-8">
              <ProductBasicsFields
                state={state}
                onChange={setState}
                collections={collectionsQuery.data?.collections ?? []}
              />
            </section>
            <ProductVariantsEditor
              state={state}
              onChange={setState}
              allowOptionChanges={mode === "create"}
            />
          </div>
          <aside className="space-y-8 lg:sticky lg:top-6">
            <ProductMediaUploader
              media={media}
              existingMedia={product?.media.nodes}
              onChange={setMedia}
            />
            <section className="space-y-4 border-t pt-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-medium">Shopify is the source of truth</p>
                  <p className="text-sm text-muted-foreground">
                    This app does not publish, archive, or delete products.
                  </p>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Save />
                )}
                {mutation.isPending
                  ? "Saving to Shopify..."
                  : mode === "create"
                    ? "Create product draft"
                    : "Save changes"}
              </Button>
            </section>
          </aside>
        </div>
      </form>
    </main>
  );
}

export function ShopifyProductEditor({ mode, productId = "" }: Props) {
  const productQuery = useShopifyProduct(mode === "edit" ? productId : "");
  if (mode === "edit" && productQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-[34rem] rounded-lg" />
          <Skeleton className="h-[28rem] rounded-lg" />
        </div>
      </div>
    );
  }
  if (mode === "edit" && (productQuery.isError || !productQuery.data)) {
    return (
      <div className="mx-auto max-w-xl border-y py-8 text-center">
        <p className="font-medium">Product could not be loaded</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {productQuery.error?.message}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/shopify-products">Back to products</Link>
        </Button>
      </div>
    );
  }
  return (
    <ProductForm
      key={productQuery.data?.id ?? "new"}
      mode={mode}
      productId={productId}
      product={productQuery.data}
    />
  );
}
