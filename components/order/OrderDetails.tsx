"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getEnquiryMedia } from "@/lib/storage/enquiry-media";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { EnquirySelectedProduct, MetalPurity, Order } from "@/types";
import { EstimationForm } from "@/components/order/EstimationForm";

// ─── Primitives ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid min-w-0 gap-1">
      <dt className="min-w-0 text-xs leading-5 text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium leading-5 text-foreground">
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </h3>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function formatMetalTypeLabel(metalType: string): string {
  return metalType === "Gold" ? "Yellow Gold" : metalType;
}

function ProductThumbnail({ product }: { product: EnquirySelectedProduct }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        className="h-12 w-12 flex-shrink-0 rounded-md border border-border/60 bg-muted object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted text-xs font-semibold text-muted-foreground">
      {product.productCode.slice(0, 4)}
    </div>
  );
}

function EnquiryReferences({ order }: { order: Order }) {
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadMedia() {
      const refs =
        order.customProducts?.flatMap((product) =>
          product.references.filter((reference) => reference.mediaId),
        ) ?? [];

      if (refs.length === 0) {
        setMediaUrls({});
        return;
      }

      const nextUrls: Record<string, string> = {};

      for (const reference of refs) {
        if (!reference.mediaId) continue;
        const media = await getEnquiryMedia(reference.mediaId);
        if (!media) continue;

        const objectUrl = URL.createObjectURL(media.blob);
        objectUrls.push(objectUrl);
        nextUrls[reference.id] = objectUrl;
      }

      if (!cancelled) {
        setMediaUrls(nextUrls);
      }
    }

    loadMedia();

    return () => {
      cancelled = true;
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [order.customProducts]);

  if (
    (!order.selectedProducts || order.selectedProducts.length === 0) &&
    (!order.customProducts || order.customProducts.length === 0)
  ) {
    return null;
  }

  return (
    <div className="sm:col-span-2">
      <Section title="Enquiry References">
        {order.selectedProducts && order.selectedProducts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Existing products</p>
            {order.selectedProducts.map((product) => {
              const estimation = order.estimations?.find(
                (e) => e.productId === product.id,
              );
              return (
                <div
                  key={product.id}
                  className="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <ProductThumbnail product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.productCode} · {product.category} ·{" "}
                        {formatMetalTypeLabel(product.metalType)}{" "}
                        {product.metalPurity}
                      </p>
                    </div>
                    {order.status !== "closed" && (
                      <EstimationForm
                        orderId={order.id}
                        productId={product.id}
                        initialPurity={product.metalPurity}
                      />
                    )}
                  </div>
                  {estimation && (
                    <div className="text-xs text-muted-foreground pl-14">
                      Estimation: ₹{estimation.finalAmount.toLocaleString()} ·{" "}
                      {estimation.purity}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {order.customProducts && order.customProducts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Custom products</p>
            {order.customProducts.map((product) => {
              const estimation = order.estimations?.find(
                (e) => e.productId === product.id,
              );
              return (
                <div
                  key={product.id}
                  className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {[
                          product.category || "Custom",
                          product.metalType,
                          product.metalPurity,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          product.polish || null,
                          product.stoneDescription || null,
                          product.stoneCut || null,
                          product.stoneQuality || null,
                          product.stoneCaratEstimate
                            ? `~${product.stoneCaratEstimate} ct`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No extra stone specs"}
                      </p>
                    </div>
                    {order.status !== "closed" && (
                      <EstimationForm
                        orderId={order.id}
                        productId={product.id}
                        initialPurity={product.metalPurity as MetalPurity}
                      />
                    )}
                  </div>
                  {estimation && (
                    <div className="text-xs text-muted-foreground">
                      Estimation: ₹{estimation.finalAmount.toLocaleString()} ·{" "}
                      {estimation.purity}
                    </div>
                  )}
                  {product.references.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {product.references.map((reference) => {
                        const mediaUrl = mediaUrls[reference.id];
                        return (
                          <div
                            key={reference.id}
                            className="overflow-hidden rounded-lg border border-border bg-card"
                          >
                            {reference.type === "image" && mediaUrl && (
                              <img
                                src={mediaUrl}
                                alt={reference.name}
                                className="h-32 w-full object-cover"
                              />
                            )}
                            {reference.type === "video" && mediaUrl && (
                              <video
                                src={mediaUrl}
                                controls
                                className="h-32 w-full bg-black object-cover"
                              />
                            )}
                            <div className="space-y-1 p-3">
                              <p className="text-sm font-medium text-foreground">
                                {reference.type === "link"
                                  ? "Reference link"
                                  : reference.name}
                              </p>
                              {reference.type === "link" && reference.url ? (
                                <a
                                  href={reference.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-xs text-primary hover:underline"
                                >
                                  {reference.url}
                                </a>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {[
                                    reference.mimeType,
                                    reference.size
                                      ? `${Math.round(reference.size / 1024)} KB`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Actors strip — always visible even when collapsed ───────────────────────

function ActorsStrip({ order }: { order: Order }) {
  const actors = [
    { label: "Salesperson", value: order.salespersonName },
    { label: "Vendor", value: order.vendorName },
    { label: "Customer", value: order.customerName },
  ].filter((a) => a.value);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {actors.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <span className="block text-xs text-muted-foreground">{label}</span>
          <span className="block truncate text-sm font-medium text-foreground">
            {value}
          </span>
        </div>
      ))}
      {order.deliveryDate && (
        <div className="min-w-0">
          <span className="block text-xs text-muted-foreground">Delivery</span>
          <span className="block text-sm font-medium text-foreground">
            {formatDate(order.deliveryDate)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface OrderDetailsProps {
  order: Order;
  defaultOpen?: boolean;
}

export function OrderDetails({
  order,
  defaultOpen = false,
}: OrderDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);

  const stoneSummary = [
    order.stoneDescription,
    order.stoneCut && `${order.stoneCut} cut`,
    order.stoneQuality,
    order.stoneCaratEstimate && `~${order.stoneCaratEstimate} ct`,
  ]
    .filter(Boolean)
    .join(", ");

  const metalSummary = [
    order.metalType,
    order.metalPurity,
    order.metalWeight && `${order.metalWeight}g`,
  ]
    .filter(Boolean)
    .join(" · ");

  const sizeSummary = [
    order.ringSize && `Ring: ${order.ringSize}`,
    order.chainLength && `Chain: ${order.chainLength}`,
    order.bangleSize && `Bangle: ${order.bangleSize}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header — always visible, clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Order Details
          </p>
          {/* Actors strip always visible */}
          <ActorsStrip order={order} />
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Expandable content */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="grid gap-y-8">
            <Section title="Customer">
              <DetailRow label="Name" value={order.customerName} />
              <DetailRow label="Phone" value={order.customerPhone} />
              <DetailRow label="Email" value={order.customerEmail} />
              <DetailRow label="Address" value={order.customerAddress} />
              <DetailRow label="Date of birth" value={order.customerDob} />
              <DetailRow label="Location" value={order.customerLocation} />
              <DetailRow label="Category" value={order.customerCategory} />
              <DetailRow label="Customer notes" value={order.customerNotes} />
            </Section>

            <Section title="Order">
              <DetailRow label="Salesperson" value={order.salespersonName} />
              <DetailRow label="Vendor" value={order.vendorName} />
              <DetailRow
                label="Delivery date"
                value={
                  order.deliveryDate
                    ? formatDate(order.deliveryDate)
                    : undefined
                }
              />
              <DetailRow
                label="Certification"
                value={
                  order.certification !== "None"
                    ? order.certification
                    : "No certification"
                }
              />
              <DetailRow
                label="CAD design"
                value={order.cadDesignRequired ? "Required" : "Not required"}
              />
            </Section>

            <Section title="Product">
              <DetailRow label="Category" value={order.category} />
              <DetailRow label="Metal" value={metalSummary || undefined} />
              <DetailRow label="Polish" value={order.polish} />
              {stoneSummary && (
                <DetailRow label="Stones" value={stoneSummary} />
              )}
              {sizeSummary && <DetailRow label="Sizing" value={sizeSummary} />}
            </Section>

            <Section title="Financials">
              <DetailRow
                label="Total estimate"
                value={
                  order.totalEstimate
                    ? formatCurrency(order.totalEstimate)
                    : undefined
                }
              />
              <DetailRow
                label="Advance paid"
                value={
                  order.advancePaid
                    ? formatCurrency(order.advancePaid)
                    : undefined
                }
              />
              {order.totalEstimate && order.advancePaid && (
                <DetailRow
                  label="Balance due"
                  value={formatCurrency(
                    order.totalEstimate - order.advancePaid,
                  )}
                />
              )}
              {order.budgetRange && (
                <DetailRow label="Budget range" value={order.budgetRange} />
              )}
              {order.occasion && (
                <DetailRow label="Occasion" value={order.occasion} />
              )}
            </Section>

            {(order.specialInstructions || order.timelineNotes) && (
              <div className="sm:col-span-2">
                <Section title="Notes & Instructions">
                  <DetailRow
                    label="Special instructions"
                    value={order.specialInstructions}
                  />
                  <DetailRow
                    label="Timeline notes"
                    value={order.timelineNotes}
                  />
                </Section>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
