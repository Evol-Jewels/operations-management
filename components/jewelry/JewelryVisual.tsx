import { cn } from "@/lib/utils";
import { categoryPaths, gemstonePath, shapePaths } from "./jewelry-icon-paths";

export type JewelryVisualKind =
  | "category"
  | "metal"
  | "metal-color"
  | "shape"
  | "stone";

const categoryAliases: Record<string, string> = {
  rings: "ring",
  necklaces: "necklace",
  bracelets: "bracelet",
  bangles: "bangle",
  pendants: "pendant",
  earring: "earrings",
  chains: "chain",
  anklets: "anklet",
  accessory: "accessories",
  others: "other",
  brooches: "brooch",
  tanmani: "tanmania",
};
const shapeAliases: Record<string, string> = {
  "round brilliant": "round",
  "emerald cut": "emerald",
};

export function normalizeCategoryVisual(value: string) {
  const normalized = value.trim().toLowerCase();
  return Object.hasOwn(categoryAliases, normalized)
    ? categoryAliases[normalized]
    : normalized;
}

export function getStoneShape(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "hexagon / octagon") return normalized;
  const matches = [...Object.keys(shapePaths), ...Object.keys(shapeAliases)]
    .filter((name) => new RegExp(`\\b${name}\\b`).test(normalized))
    .map((name) => shapeAliases[name] ?? name);
  const uniqueShapes = [...new Set(matches)];
  return uniqueShapes.length === 1 ? uniqueShapes[0] : undefined;
}

const metalFinishes: Record<string, string> = {
  gold: "linear-gradient(135deg,#b49155,#fff0ca 48%,#d6b777)",
  yellow: "linear-gradient(135deg,#b49155,#fff0ca 48%,#d6b777)",
  rose: "linear-gradient(135deg,#b97c69,#ffe0d0 48%,#d8a18c)",
  white: "linear-gradient(135deg,#a2a2a2,#fafafa 48%,#c6c6c6)",
  silver: "linear-gradient(135deg,#a2a2a2,#fafafa 48%,#c6c6c6)",
  platinum: "linear-gradient(135deg,#87929b,#eef2f4 48%,#b0bbc2)",
};
const stoneColors: Record<string, string> = {
  ruby: "text-rose-600 dark:text-rose-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  sapphire: "text-blue-600 dark:text-blue-400",
  amethyst: "text-violet-600 dark:text-violet-400",
  aquamarine: "text-cyan-600 dark:text-cyan-400",
  citrine: "text-amber-600 dark:text-amber-400",
  peridot: "text-lime-600 dark:text-lime-400",
};

function LineIcon({
  path,
  facets,
  className,
}: {
  path: string;
  facets?: string;
  className: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={path} />
      {facets ? <path d={facets} /> : null}
    </svg>
  );
}

export function JewelryVisual({
  kind,
  value,
  className,
  stoneCategory,
}: {
  kind: JewelryVisualKind;
  value?: string | null;
  className?: string;
  stoneCategory?: string;
}) {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  const classes = cn(
    "inline-block size-5 shrink-0 align-middle text-muted-foreground",
    className,
  );

  if (kind === "metal" || kind === "metal-color") {
    const finishes = normalized
      .replace(/\s+gold/g, "")
      .split(/\s*\+\s*/)
      .map((name) => ({
        name,
        background: Object.hasOwn(metalFinishes, name)
          ? metalFinishes[name]
          : undefined,
      }));
    if (finishes.some((finish) => !finish.background)) return null;
    return (
      <span
        aria-hidden="true"
        className={cn(
          classes,
          "inline-flex overflow-hidden rounded-full border border-black/15 shadow-[inset_0_0_0_1px_#ffffff70]",
        )}
      >
        {finishes.map(({ name, background }) => (
          <span key={name} className="h-full flex-1" style={{ background }} />
        ))}
      </span>
    );
  }

  if (kind === "category") {
    const category = normalizeCategoryVisual(normalized);
    return Object.hasOwn(categoryPaths, category) ? (
      <LineIcon path={categoryPaths[category]} className={classes} />
    ) : null;
  }

  if (kind === "stone") {
    const shape = getStoneShape(normalized);
    const stones = Object.keys(stoneColors).filter((name) =>
      new RegExp(`\\b${name}\\b`).test(normalized),
    );
    if (stones.length > 1) return null;
    const stone = stones[0];
    const isDiamond =
      stoneCategory?.toLowerCase() === "diamond" ||
      /\b(diamond|lgd|cvd|hpht)\b/.test(normalized);
    const isEmeraldCut = stone === "emerald" && /\bcut\b/.test(normalized);
    if (stone && !isDiamond && !isEmeraldCut)
      return (
        <LineIcon
          path={gemstonePath}
          className={cn(classes, stoneColors[stone])}
        />
      );
    if (shape)
      return <JewelryVisual kind="shape" value={shape} className={className} />;
    return null;
  }

  if (normalized === "hexagon / octagon") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={classes}
      >
        <g transform="translate(0 6) scale(.5)" strokeWidth={2.5}>
          <path d={shapePaths.hexagon.outline} />
        </g>
        <g transform="translate(12 6) scale(.5)" strokeWidth={2.5}>
          <path d={shapePaths.octagon.outline} />
        </g>
      </svg>
    );
  }
  const shape = Object.hasOwn(shapeAliases, normalized)
    ? shapeAliases[normalized]
    : normalized;
  if (!Object.hasOwn(shapePaths, shape)) return null;
  return (
    <LineIcon
      path={shapePaths[shape].outline}
      facets={shapePaths[shape].facets}
      className={classes}
    />
  );
}
