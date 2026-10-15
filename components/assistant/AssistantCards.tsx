"use client";

import {
  ArrowUpRight,
  CircleCheck,
  Diamond,
  ExternalLink,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getInventoryMediaUrl } from "@/lib/inventory-media";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  AssistantCard,
  AssistantField,
  AssistantInventoryItem,
  AssistantMetric,
  AssistantRecord,
  AssistantTone,
} from "@/types/assistant";

const toneStyles: Record<AssistantTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: AssistantTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full border px-2 text-[11px] font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed)
    return (
      <div className="flex size-full items-center justify-center bg-muted text-muted-foreground/60">
        <Diamond className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  return (
    // biome-ignore lint/performance/noImgElement: remote media without configured loaders
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover"
    />
  );
}

function MetaLine({ meta }: { meta?: AssistantField[] }) {
  if (!meta?.length) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {meta.map((item) => (
        <span key={item.label} className="whitespace-nowrap">
          <span className="text-muted-foreground/70">{item.label}</span>{" "}
          <span className="text-foreground/80 tabular-nums">{item.value}</span>
        </span>
      ))}
    </p>
  );
}

function RecordRow({ record }: { record: AssistantRecord }) {
  const body = (
    <div className="flex items-start gap-3 px-3.5 py-3">
      {record.image !== undefined && (
        <div className="size-10 shrink-0 overflow-hidden rounded-md border">
          <Thumb src={record.image} alt={record.title} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {record.code}
          </span>
          <span className="truncate text-sm font-medium">{record.title}</span>
        </div>
        {record.subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {record.subtitle}
          </p>
        )}
        <MetaLine meta={record.meta} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {record.status && (
          <StatusPill label={record.status} tone={record.statusTone} />
        )}
        {record.href && (
          <ArrowUpRight
            className="size-4 text-muted-foreground/60 transition-colors group-hover:text-foreground"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
  return record.href ? (
    <Link
      href={record.href}
      className="group block transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function CardShell({
  title,
  aside,
  href,
  children,
}: {
  title?: string;
  aside?: string | null;
  href?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      {(title || href) && (
        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3.5 py-2">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
            {aside ? (
              <span className="font-normal text-muted-foreground/70">
                {" "}
                · {aside}
              </span>
            ) : null}
          </p>
          {href && (
            <Link
              href={href}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

const PREVIEW = 6;

function RecordsCard({
  card,
}: {
  card: Extract<AssistantCard, { type: "records" }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? card.items : card.items.slice(0, PREVIEW);
  const total = card.total ?? card.items.length;
  const aside = card.items.length
    ? total > card.items.length
      ? `${card.items.length} of ${total}`
      : `${total}`
    : "none found";
  return (
    <CardShell title={card.title} aside={aside} href={card.href}>
      {card.items.length === 0 ? (
        <p className="px-3.5 py-4 text-sm text-muted-foreground">
          Nothing matched.
        </p>
      ) : (
        <div className="divide-y">
          {items.map((record) => (
            <RecordRow key={record.id} record={record} />
          ))}
        </div>
      )}
      {card.items.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="w-full border-t px-3.5 py-2 text-left text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          {expanded ? "Show less" : `Show ${card.items.length - PREVIEW} more`}
        </button>
      )}
    </CardShell>
  );
}

function FieldGrid({ fields }: { fields: AssistantField[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">{field.label}</dt>
          <dd className="mt-0.5 break-words text-sm whitespace-pre-wrap">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RecordCard({
  card,
}: {
  card: Extract<AssistantCard, { type: "record" }>;
}) {
  const { record } = card;
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            {record.code}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold tracking-tight">
            {record.title}
          </p>
          {record.subtitle && (
            <p className="truncate text-xs text-muted-foreground">
              {record.subtitle}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {record.status && (
            <StatusPill label={record.status} tone={record.statusTone} />
          )}
          {record.href && (
            <Link
              href={record.href}
              className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs hover:bg-muted"
            >
              Open
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-4 px-4 py-3.5">
        {card.sections
          .filter((section) => section.fields.length)
          .map((section) => (
            <section key={section.title}>
              <h4 className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {section.title}
              </h4>
              <FieldGrid fields={section.fields} />
            </section>
          ))}
      </div>
      {card.children
        ?.filter((group) => group.items.length)
        .map((group) => (
          <div key={group.title} className="border-t">
            <p className="bg-muted/30 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {group.title}
            </p>
            <div className="divide-y">
              {group.items.map((item) => (
                <RecordRow key={item.id} record={item} />
              ))}
            </div>
          </div>
        ))}
    </CardShell>
  );
}

function formatMetric(metric: AssistantMetric) {
  if (metric.value === null || metric.value === undefined) return "—";
  if (typeof metric.value === "string") return metric.value;
  if (metric.format === "currency") return formatCurrency(metric.value);
  if (metric.format === "percent") return `${metric.value}%`;
  return metric.value.toLocaleString("en-IN");
}

function StatsCard({
  card,
}: {
  card: Extract<AssistantCard, { type: "stats" }>;
}) {
  return (
    <CardShell title={card.title} aside={card.subtitle} href={card.href}>
      {card.metrics.length > 0 && (
        <div className="overflow-hidden">
          <div className="-mr-px -mb-px grid grid-cols-2 sm:grid-cols-3">
            {card.metrics.map((metric) => (
              <div key={metric.label} className="border-r border-b px-3.5 py-3">
                <p className="text-[11px] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums">
                  {formatMetric(metric)}
                </p>
                {metric.hint && (
                  <p className="text-[11px] text-muted-foreground">
                    {metric.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {card.breakdowns
        ?.filter((breakdown) => breakdown.rows.length)
        .map((breakdown) => {
          const max = Math.max(...breakdown.rows.map((row) => row.value), 1);
          return (
            <div
              key={breakdown.title}
              className="border-t px-3.5 py-3 first:border-t-0"
            >
              <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {breakdown.title}
              </p>
              <ul className="space-y-1.5">
                {breakdown.rows.map((row) => (
                  <li
                    key={row.label}
                    className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-xs"
                  >
                    <span className="truncate" title={row.label}>
                      {row.label}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-foreground/70"
                        style={{
                          width: `${Math.max((row.value / max) * 100, 2)}%`,
                        }}
                      />
                    </span>
                    <span className="text-right whitespace-nowrap tabular-nums">
                      {row.format === "currency"
                        ? formatCurrency(row.value)
                        : row.value.toLocaleString("en-IN")}
                      {row.secondary && (
                        <span className="ml-1.5 text-muted-foreground">
                          {row.secondary}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </CardShell>
  );
}

function ProductTile({ item }: { item: AssistantInventoryItem }) {
  const image = item.imageKey
    ? getInventoryMediaUrl({
        id: item.imageId ?? "",
        storageKey: item.imageKey,
      })
    : null;
  return (
    <Link
      href={item.href}
      className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-colors hover:border-foreground/25"
    >
      <div className="aspect-[4/3] overflow-hidden border-b">
        <Thumb src={image} alt={item.name} />
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            {item.code}
          </span>
          <StatusPill
            label={item.status === "AVAILABLE" ? "Available" : "Not available"}
            tone={item.status === "AVAILABLE" ? "success" : "neutral"}
          />
        </div>
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            item.purity ? `${item.purity}K` : null,
            item.color?.toLowerCase(),
            item.netWeight ? `${item.netWeight} g` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(item.price)}
          </span>
          {item.location && (
            <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function InventoryCard({
  card,
}: {
  card: Extract<AssistantCard, { type: "inventory" }>;
}) {
  if (!card.items.length)
    return (
      <CardShell title="Inventory">
        <p className="px-3.5 py-4 text-sm text-muted-foreground">
          No products matched.
        </p>
      </CardShell>
    );
  return (
    <div className="space-y-2">
      {card.total > card.items.length && (
        <p className="text-xs text-muted-foreground">
          Showing {card.offset + 1}–{card.offset + card.items.length} of{" "}
          {card.total.toLocaleString("en-IN")} products
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {card.items.map((item) => (
          <ProductTile key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function DoneCard({
  card,
}: {
  card: Extract<AssistantCard, { type: "done" }>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04]">
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <CircleCheck
          className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">{card.title}</p>
          {card.message && (
            <p className="mt-0.5 text-xs whitespace-pre-wrap text-muted-foreground">
              {card.message}
            </p>
          )}
        </div>
      </div>
      {card.record && (
        <div className="border-t border-emerald-500/15 bg-card">
          <RecordRow record={card.record} />
        </div>
      )}
    </div>
  );
}

export function AssistantCardView({ card }: { card: AssistantCard }) {
  switch (card.type) {
    case "records":
      return <RecordsCard card={card} />;
    case "record":
      return <RecordCard card={card} />;
    case "stats":
      return <StatsCard card={card} />;
    case "inventory":
      return <InventoryCard card={card} />;
    case "done":
      return <DoneCard card={card} />;
  }
}

export { FieldGrid };
