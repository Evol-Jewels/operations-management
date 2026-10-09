import {
  RequirementCard,
  RequirementCardBody,
} from "@/components/enquiry/requirements/RequirementCard";
import {
  DetailNoteRow,
  DetailRow,
  DetailSection,
} from "@/components/enquiry/requirements/RequirementDetailsPanel";
import type { Repair } from "@/lib/repairs";
import { RepairReferencesPreview } from "./RepairReferencesPreview";
import { RepairTypeBadge } from "./RepairTypeBadge";

export function RepairProductCard({ repair }: { repair: Repair }) {
  return (
    <RequirementCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <p className="text-sm font-medium uppercase tracking-wide text-foreground">
          Item 1 <span className="font-normal text-muted-foreground">of 1</span>
        </p>
        <RepairTypeBadge productType={repair.productType} />
      </div>
      <RequirementCardBody>
        <RepairReferencesPreview repair={repair} />
        <div className="min-w-0 space-y-4">
          <div>
            <h3 className="break-words text-lg font-semibold leading-tight text-foreground">
              {repair.category || "Repair product"}
            </h3>
            <p className="mt-1 break-words text-xs uppercase tracking-wide text-muted-foreground">
              {[repair.barcode, repair.purity, repair.metalColor]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4 border-t border-border pt-4">
            <DetailSection title="Overview">
              <DetailRow label="Barcode" value={repair.barcode || "—"} />
              <DetailRow label="Product" value={repair.productType} />
              <DetailRow
                label="Category"
                value={repair.category || "Not added"}
              />
            </DetailSection>
            <DetailSection title="Metal">
              <DetailRow
                label="Gross weight"
                value={`${repair.grossWeight} g`}
              />
              <DetailRow label="Net weight" value={`${repair.netWeight} g`} />
              <DetailRow label="Purity" value={repair.purity} />
              <DetailRow label="Metal color" value={repair.metalColor} />
            </DetailSection>
          </div>
          <DetailSection title="Diamond details">
            <DetailRow
              label="Diamond carats"
              value={repair.diamondCarats || "—"}
            />
            <DetailRow
              label="Diamond pieces"
              value={repair.diamondPieces || "—"}
            />
          </DetailSection>
          <DetailSection title="Remarks">
            <DetailNoteRow
              label="Product remarks"
              value={repair.productRemarks || "—"}
            />
            <DetailNoteRow
              label="Repair remarks"
              value={repair.repairRemarks}
            />
          </DetailSection>
        </div>
      </RequirementCardBody>
    </RequirementCard>
  );
}
