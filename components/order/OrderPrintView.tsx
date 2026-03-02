/**
 * OrderPrintView — rendered only when window.print() is called.
 * Hidden from the normal UI via `hidden print:block` (Tailwind) +
 * the @media print rules in globals.css that hide all other DOM.
 *
 * Intentionally uses only inline-safe, print-friendly styles —
 * no dark-mode classes, no animations, no interactive elements.
 */

import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  ACTOR_ROLE_LABELS,
  type ActivityEntry,
  type ActorRole,
  type Order,
  STAGES,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function PrintRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
      <span
        style={{
          width: 140,
          flexShrink: 0,
          fontSize: "9pt",
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: "10pt", color: "#111827" }}>{value}</span>
    </div>
  );
}

function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-section" style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: "8pt",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#9ca3af",
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #e5e7eb",
        margin: "20px 0",
      }}
    />
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function PrintHeader({ order }: { order: Order }) {
  return (
    <div className="print-section" style={{ marginBottom: 24 }}>
      {/* Top row: store name + print date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: "8pt",
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Evol Jewellery — Order Record
        </div>
        <div style={{ fontSize: "8pt", color: "#9ca3af" }}>
          Printed:{" "}
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Customer name + category */}
      <h1
        style={{
          fontSize: "20pt",
          fontWeight: 700,
          color: "#111827",
          margin: "0 0 4px 0",
          letterSpacing: "-0.02em",
        }}
      >
        {order.customerName}
        <span style={{ fontWeight: 400, color: "#6b7280", marginLeft: 8 }}>
          · {order.category}
        </span>
      </h1>

      {/* Badges row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        {/* Type badge */}
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 99,
            fontSize: "8pt",
            fontWeight: 600,
            background: order.type === "order" ? "#111827" : "transparent",
            color: order.type === "order" ? "#fff" : "#6b7280",
            border: order.type === "order" ? "none" : "1px solid #d1d5db",
          }}
        >
          {order.type === "order" ? "Order" : "Enquiry"}
        </span>

        {/* Order number */}
        {order.orderNumber && (
          <span
            style={{
              fontSize: "9pt",
              color: "#6b7280",
              fontFamily: "monospace",
            }}
          >
            {order.orderNumber}
          </span>
        )}

        {/* Current stage */}
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 99,
            fontSize: "8pt",
            fontWeight: 500,
            background: "#f3f4f6",
            color: "#374151",
            border: "1px solid #e5e7eb",
          }}
        >
          Stage: {order.currentStage}
        </span>

        {/* Delivery date */}
        {order.deliveryDate && (
          <span style={{ fontSize: "9pt", color: "#374151" }}>
            Delivery: <strong>{formatDate(order.deliveryDate)}</strong>
          </span>
        )}
      </div>

      {/* Actors */}
      <div
        style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}
      >
        {[
          { label: "Sales", name: order.salespersonName },
          ...(order.vendorName
            ? [{ label: "Vendor", name: order.vendorName }]
            : []),
          { label: "Customer", name: order.customerName },
        ].map(({ label, name }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background:
                  label === "Sales"
                    ? "#dbeafe"
                    : label === "Vendor"
                      ? "#fef3c7"
                      : "#d1fae5",
                color:
                  label === "Sales"
                    ? "#1d4ed8"
                    : label === "Vendor"
                      ? "#92400e"
                      : "#065f46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7pt",
                fontWeight: 700,
              }}
            >
              {initials(name)}
            </div>
            <span style={{ fontSize: "8pt", color: "#6b7280" }}>{label}:</span>
            <span
              style={{ fontSize: "9pt", fontWeight: 600, color: "#111827" }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stage Pipeline ──────────────────────────────────────────────────────────

function PrintStagePipeline({ order }: { order: Order }) {
  const visibleStages = STAGES.filter(
    (s) => s !== "CAD Design" || order.cadDesignRequired,
  );
  const currentIdx = visibleStages.indexOf(order.currentStage);

  return (
    <PrintSection title="Pipeline">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          alignItems: "center",
        }}
      >
        {visibleStages.map((stage, idx) => {
          const isPast = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={stage}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontSize: "8pt",
                  fontWeight: isCurrent ? 700 : 400,
                  background: isCurrent
                    ? "#111827"
                    : isPast
                      ? "#f3f4f6"
                      : "transparent",
                  color: isCurrent ? "#fff" : isPast ? "#6b7280" : "#d1d5db",
                  border: `1px solid ${isCurrent ? "#111827" : isPast ? "#e5e7eb" : "#f3f4f6"}`,
                  textDecoration: isPast ? "line-through" : "none",
                }}
              >
                {stage}
              </span>
              {idx < visibleStages.length - 1 && (
                <span style={{ color: "#d1d5db", fontSize: "8pt" }}>›</span>
              )}
            </div>
          );
        })}
      </div>
    </PrintSection>
  );
}

// ─── Order Details ────────────────────────────────────────────────────────────

function PrintOrderDetails({ order }: { order: Order }) {
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
    <div
      className="print-section"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0 32px",
        marginBottom: 20,
      }}
    >
      {/* Customer */}
      <PrintSection title="Customer">
        <PrintRow label="Name" value={order.customerName} />
        <PrintRow label="Phone" value={order.customerPhone} />
        <PrintRow label="Email" value={order.customerEmail} />
        <PrintRow label="Address" value={order.customerAddress} />
      </PrintSection>

      {/* Order */}
      <PrintSection title="Order">
        <PrintRow label="Salesperson" value={order.salespersonName} />
        <PrintRow label="Vendor" value={order.vendorName} />
        <PrintRow
          label="Delivery date"
          value={
            order.deliveryDate ? formatDate(order.deliveryDate) : undefined
          }
        />
        <PrintRow
          label="Certification"
          value={
            order.certification !== "None"
              ? order.certification
              : "No certification"
          }
        />
        <PrintRow
          label="CAD design"
          value={order.cadDesignRequired ? "Required" : "Not required"}
        />
      </PrintSection>

      {/* Product */}
      <PrintSection title="Product">
        <PrintRow label="Category" value={order.category} />
        <PrintRow label="Metal" value={metalSummary || undefined} />
        <PrintRow label="Polish" value={order.polish} />
        {stoneSummary && <PrintRow label="Stones" value={stoneSummary} />}
        {sizeSummary && <PrintRow label="Sizing" value={sizeSummary} />}
      </PrintSection>

      {/* Financials */}
      <PrintSection title="Financials">
        <PrintRow
          label="Total estimate"
          value={
            order.totalEstimate
              ? formatCurrency(order.totalEstimate)
              : undefined
          }
        />
        <PrintRow
          label="Advance paid"
          value={
            order.advancePaid ? formatCurrency(order.advancePaid) : undefined
          }
        />
        {order.totalEstimate && order.advancePaid && (
          <PrintRow
            label="Balance due"
            value={formatCurrency(order.totalEstimate - order.advancePaid)}
          />
        )}
        <PrintRow label="Budget range" value={order.budgetRange} />
        <PrintRow label="Occasion" value={order.occasion} />
      </PrintSection>

      {/* Notes — full width */}
      {(order.specialInstructions || order.timelineNotes) && (
        <div style={{ gridColumn: "1 / -1" }}>
          <PrintSection title="Notes & Instructions">
            <PrintRow
              label="Special instructions"
              value={order.specialInstructions}
            />
            <PrintRow label="Timeline notes" value={order.timelineNotes} />
          </PrintSection>
        </div>
      )}
    </div>
  );
}

// ─── Production Spec (orders only) ───────────────────────────────────────────

function PrintProductionSpec({ order }: { order: Order }) {
  if (order.type !== "order") return null;

  const metalLine = [
    order.metalType,
    order.metalPurity,
    order.metalWeight ? `${order.metalWeight}g` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const stoneLine = [
    order.stoneDescription,
    order.stoneCut ? `${order.stoneCut} cut` : null,
    order.stoneQuality,
    order.stoneCaratEstimate ? `~${order.stoneCaratEstimate} ct` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const sizingLine = [
    order.ringSize ? `Ring size ${order.ringSize}` : null,
    order.chainLength ? `Chain ${order.chainLength}` : null,
    order.bangleSize ? `Bangle ${order.bangleSize}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PrintSection title="Production Spec">
      <PrintRow label="Material" value={metalLine || undefined} />
      {order.polish && <PrintRow label="Finish" value={order.polish} />}
      {stoneLine && <PrintRow label="Stones" value={stoneLine} />}
      {sizingLine && <PrintRow label="Sizing" value={sizingLine} />}
      <PrintRow
        label="Certification"
        value={
          order.certification === "None"
            ? "No certification required"
            : order.certification
        }
      />
      <PrintRow
        label="CAD design"
        value={order.cadDesignRequired ? "Required" : "Not required"}
      />
      {order.specialInstructions && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: "8pt",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#92400e",
              marginBottom: 4,
            }}
          >
            Special Instructions
          </div>
          <p style={{ fontSize: "10pt", color: "#78350f", margin: 0 }}>
            {order.specialInstructions}
          </p>
        </div>
      )}
    </PrintSection>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<
  ActorRole,
  { bg: string; text: string; border: string }
> = {
  sales: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  vendor: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  owner: { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  customer: { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
};

function PrintActivityEntry({
  entry,
  isLast,
}: {
  entry: ActivityEntry;
  isLast: boolean;
}) {
  const isSystem =
    entry.type === "order_created" || entry.type === "stage_change";
  const roleColor = entry.actorRole
    ? ROLE_COLORS[entry.actorRole]
    : ROLE_COLORS.sales;

  return (
    <div
      className="print-section"
      style={{
        display: "flex",
        gap: 12,
        paddingBottom: isLast ? 0 : 16,
        marginBottom: isLast ? 0 : 4,
        borderBottom: isLast ? "none" : "1px dashed #f3f4f6",
      }}
    >
      {/* Avatar / node */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {isSystem ? (
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background:
                entry.type === "order_created" ? "#111827" : "#f3f4f6",
              border: "2px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: entry.type === "order_created" ? "#fff" : "#9ca3af",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: roleColor.bg,
              color: roleColor.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8pt",
              fontWeight: 700,
            }}
          >
            {initials(entry.postedBy)}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: "10pt", fontWeight: 600, color: "#111827" }}>
            {entry.postedBy}
          </span>
          {entry.actorRole && (
            <span
              style={{
                fontSize: "7pt",
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 99,
                border: `1px solid ${roleColor.border}`,
                background: roleColor.bg,
                color: roleColor.text,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {ACTOR_ROLE_LABELS[entry.actorRole]}
            </span>
          )}
          {entry.type === "stage_change" && entry.newStage && (
            <span style={{ fontSize: "9pt", color: "#6b7280" }}>
              moved to{" "}
              <strong style={{ color: "#111827" }}>{entry.newStage}</strong>
              {entry.previousStage && (
                <span style={{ color: "#9ca3af" }}>
                  {" "}
                  (from {entry.previousStage})
                </span>
              )}
            </span>
          )}
          {entry.type === "order_created" && (
            <span style={{ fontSize: "9pt", color: "#6b7280" }}>
              created this order
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: "8pt", color: "#9ca3af", marginBottom: 4 }}>
          {formatDateTime(entry.timestamp)}
        </div>

        {/* Note bubble */}
        {entry.note && (
          <div
            style={{
              padding: "8px 12px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderLeft: `3px solid ${roleColor.border}`,
              borderRadius: "0 6px 6px 6px",
              fontSize: "10pt",
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            {entry.note}
          </div>
        )}

        {/* File attachment */}
        {entry.file && (
          <div
            style={{
              marginTop: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: "9pt",
              color: "#374151",
            }}
          >
            <span>📎</span>
            <span>{entry.file.filename}</span>
            <span
              style={{
                fontSize: "7pt",
                color: "#9ca3af",
                textTransform: "uppercase",
                background: "#fff",
                border: "1px solid #e5e7eb",
                padding: "0 4px",
                borderRadius: 3,
              }}
            >
              {entry.file.fileType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PrintActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <PrintSection
      title={`Activity (${sorted.length} ${sorted.length === 1 ? "event" : "events"})`}
    >
      {sorted.length === 0 ? (
        <p style={{ fontSize: "9pt", color: "#9ca3af" }}>
          No activity recorded.
        </p>
      ) : (
        sorted.map((entry, i) => (
          <PrintActivityEntry
            key={entry.id}
            entry={entry}
            isLast={i === sorted.length - 1}
          />
        ))
      )}
    </PrintSection>
  );
}

// ─── Root Print View ──────────────────────────────────────────────────────────

interface OrderPrintViewProps {
  order: Order;
}

export function OrderPrintView({ order }: OrderPrintViewProps) {
  return (
    <div
      id="order-print-view"
      style={{
        display: "none", // shown only by @media print in globals.css
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "10pt",
        color: "#111827",
        background: "#fff",
        padding: 0,
        margin: 0,
      }}
    >
      {/* ── Header ── */}
      <PrintHeader order={order} />

      <Divider />

      {/* ── Stage pipeline ── */}
      <PrintStagePipeline order={order} />

      <Divider />

      {/* ── Order details grid ── */}
      <PrintOrderDetails order={order} />

      {/* ── Production spec (orders only) ── */}
      {order.type === "order" && (
        <>
          <Divider />
          <PrintProductionSpec order={order} />
        </>
      )}

      {/* ── Activity timeline — may span multiple pages ── */}
      <div className="print-break-before">
        <Divider />
        <PrintActivityTimeline entries={order.activityFeed} />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 12,
          borderTop: "1px solid #e5e7eb",
          fontSize: "8pt",
          color: "#9ca3af",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Evol Jewellery Order Management System</span>
        <span>
          {order.orderNumber ? `${order.orderNumber} · ` : ""}
          {order.shareableToken}
        </span>
      </div>
    </div>
  );
}
