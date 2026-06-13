import { ImageIcon, Link2, Video } from "lucide-react";
import type {
  Product,
  ProductReference,
  ProductReferenceType,
  StepId,
} from "./enquiry-form-types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateEnquiryId() {
  return `enq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSteps(): StepId[] {
  return ["phone", "name", "notes", "products"];
}

export function normalizeReferenceLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidReferenceLink(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatFileSize(size?: number): string {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokeObjectUrls(references: ProductReference[]) {
  for (const reference of references) {
    if (reference.type !== "link") URL.revokeObjectURL(reference.url);
  }
}

export function formatMetalTypeLabel(metalType: string): string {
  return metalType === "Gold" ? "Yellow Gold" : metalType;
}

export function parseVisitDateTime(value: string): {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!value) return { date: "", hour: "10", minute: "00", period: "AM" };

  const [date, time = "10:00"] = value.split("T");
  const [rawHour = "10", minute = "00"] = time.split(":");
  const hour24 = Number(rawHour);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const normalizedHour = hour24 % 12 || 12;

  return {
    date,
    hour: String(normalizedHour).padStart(2, "0"),
    minute,
    period,
  };
}

export function buildVisitDateTime(
  date: string,
  hour: string,
  minute: string,
  period: "AM" | "PM",
): string {
  if (!date) return "";

  const normalizedHour = Number(hour) % 12;
  const hour24 =
    period === "PM"
      ? normalizedHour + 12
      : normalizedHour === 12
        ? 0
        : normalizedHour;

  return `${date}T${String(hour24).padStart(2, "0")}:${minute}`;
}

export function formatVisitDateTime(value: string): string {
  if (!value) return "";

  const { date, hour, minute, period } = parseVisitDateTime(value);
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${hour}:${minute} ${period}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Ring: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    Necklace:
      "bg-purple-500/10 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    Bracelet:
      "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    Earrings:
      "bg-pink-500/10 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300",
    Bangle:
      "bg-orange-500/10 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    Pendant:
      "bg-blue-500/10 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    Chain:
      "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
    Brooch:
      "bg-rose-500/10 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  };
  return colors[category] || "bg-muted text-muted-foreground";
}

export function ProductThumbnail({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-xs"
      : size === "lg"
        ? "aspect-[4/3] w-full text-sm"
        : "h-12 w-12 text-sm";

  if (product.imageUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: inventory images can be remote URLs.
      <img
        src={product.imageUrl}
        alt={product.name}
        className={`${sizeClass} flex-shrink-0 rounded-lg border border-border/60 bg-muted object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} flex-shrink-0 items-center justify-center rounded-lg font-bold ${getCategoryColor(
        product.category,
      )}`}
    >
      {product.productCode.slice(0, 4)}
    </div>
  );
}

export function getReferenceIcon(type: ProductReferenceType) {
  if (type === "image") return <ImageIcon className="h-4 w-4" />;
  if (type === "video") return <Video className="h-4 w-4" />;
  return <Link2 className="h-4 w-4" />;
}
