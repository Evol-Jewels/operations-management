import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import {
  compactUrl,
  getDisplayMetalPurity,
  hasValue,
  type RequirementDisplayItem,
} from "@/components/enquiry/requirements/requirement-display-utils";

export function CustomerRequirementDetails({
  item,
}: {
  item: RequirementDisplayItem;
}) {
  const specialNotes = item.details.specialNotes;
  const showSpecialNotes = specialNotes && specialNotes !== item.notes;
  const displayedDetailKeys = new Set([
    "orderType",
    "subcategory",
    "productSize",
    "polish",
    "certification",
    "metalColor",
    "settingType",
    "findingType",
    "specialNotes",
    "budgetRange",
    "deliveryDate",
  ]);
  const additionalDetails = Object.entries(item.details).filter(
    ([key, value]) => !displayedDetailKeys.has(key) && hasValue(value),
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
      </div>

      <DetailSection title="Product">
        <DetailRow label="Order type" value={item.details.orderType} />
        <DetailRow label="Category" value={item.title} />
        <DetailRow label="Subcategory" value={item.details.subcategory} />
        <DetailRow label="Product size" value={item.details.productSize} />
        <DetailRow label="Setting type" value={item.details.settingType} />
        <DetailRow label="Finding type" value={item.details.findingType} />
      </DetailSection>

      <DetailSection title="Metal and finish">
        <DetailRow label="Metal type" value={item.metalType} />
        <DetailRow
          label="Metal purity"
          value={getDisplayMetalPurity(item.metalPurity)}
        />
        <DetailRow label="Metal colour" value={item.details.metalColor} />
        <DetailRow label="Metal weight" value={item.metalWeight} />
        <DetailRow label="Polish" value={item.details.polish} />
        <DetailRow label="Certification" value={item.details.certification} />
      </DetailSection>

      {item.stones.length > 0 ? (
        <DetailSection title="Stones">
          {item.stones.map((stone, index) => (
            <DetailGroup key={stone.id} label={`Stone ${index + 1}`}>
              <DetailRow label="Stone type" value={stone.stoneType} />
              <DetailRow label="Pieces" value={stone.pieces} />
              <DetailRow label="Weight" value={stone.weight} />
            </DetailGroup>
          ))}
        </DetailSection>
      ) : null}

      {item.diamonds.length > 0 ? (
        <DetailSection title="Diamonds">
          {item.diamonds.map((diamond, index) => (
            <DetailGroup
              key={diamond.id ?? index}
              label={`Diamond ${index + 1}`}
            >
              <DetailRow label="Type" value={diamond.type} />
              <DetailRow label="Growth method" value={diamond.growthMethod} />
              <DetailRow label="Shape" value={diamond.shape} />
              <DetailRow label="Clarity" value={diamond.clarity} />
              <DetailRow label="Colour" value={diamond.colour} />
              <DetailRow label="Size" value={diamond.size} />
              <DetailRow label="Pieces" value={diamond.pieces} />
              <DetailRow label="Weight" value={diamond.weight} />
              <DetailRow label="Notes" value={diamond.notes} />
            </DetailGroup>
          ))}
        </DetailSection>
      ) : null}

      {item.colorStones.length > 0 ? (
        <DetailSection title="Colour stones">
          {item.colorStones.map((stone, index) => (
            <DetailGroup
              key={stone.id ?? index}
              label={`Colour stone ${index + 1}`}
            >
              <DetailRow label="Stone type" value={stone.stoneType} />
              <DetailRow label="Nature" value={stone.nature} />
              <DetailRow label="Origin" value={stone.origin} />
              <DetailRow label="Treatment" value={stone.treatment} />
              <DetailRow label="Shape" value={stone.shape} />
              <DetailRow label="Colour" value={stone.colour} />
              <DetailRow label="Size" value={stone.size} />
              <DetailRow label="Pieces" value={stone.pieces} />
              <DetailRow label="Weight" value={stone.weight} />
              <DetailRow label="Notes" value={stone.notes} />
            </DetailGroup>
          ))}
        </DetailSection>
      ) : null}

      {item.notes || showSpecialNotes ? (
        <DetailSection title="Notes">
          <DetailRow label="Requirement notes" value={item.notes} />
          {showSpecialNotes ? (
            <DetailRow label="Special notes" value={specialNotes} />
          ) : null}
        </DetailSection>
      ) : null}

      {additionalDetails.length > 0 ? (
        <DetailSection title="Additional details">
          {additionalDetails.map(([key, value]) => (
            <DetailRow key={key} label={formatDetailLabel(key)} value={value} />
          ))}
        </DetailSection>
      ) : null}

      {item.links.length > 0 ? (
        <DetailSection title="Reference links">
          <div className="flex flex-col gap-2">
            {item.links.map((reference) => (
              <a
                key={reference.id}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{compactUrl(reference.url)}</span>
              </a>
            ))}
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function DetailGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!hasValue(value)) return null;

  return (
    <div className="flex flex-col gap-1 border-b border-dashed border-border/70 pb-2 last:border-b-0 last:pb-0 sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-foreground sm:text-right">
        {value}
      </dd>
    </div>
  );
}

function formatDetailLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}
