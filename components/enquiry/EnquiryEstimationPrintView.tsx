import {
  compactUrl,
  type RequirementDisplayItem,
} from "@/components/enquiry/requirements/requirement-display-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  EnquiryColorStone,
  EnquiryDiamond,
  ProductEstimation,
} from "@/types";

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function joinValues(values: Array<string | number | undefined | null>) {
  return values.filter(hasValue).join(" - ");
}

function hasRecordValues(item: object) {
  return Object.entries(item as Record<string, unknown>).some(
    ([key, value]) => key !== "id" && hasValue(value),
  );
}

function formatPrintDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function PrintSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        clear: "none",
        margin: "0 auto 14px",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      <h2
        style={{
          borderBottom: "1px solid #d9d9d9",
          color: "#111111",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10.5pt",
          fontWeight: 700,
          lineHeight: 1.25,
          letterSpacing: 0,
          margin: "0 0 8px",
          paddingBottom: 5,
          textTransform: "uppercase",
        }}
      >
        {title}
        {count ? ` (${count})` : ""}
      </h2>
      {children}
    </section>
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
    <div
      style={{
        alignItems: "baseline",
        borderBottom: "1px dotted #cfcfcf",
        display: "grid",
        gap: 8,
        gridTemplateColumns: "minmax(76px, 42%) minmax(0, 1fr)",
        padding: "4px 0",
      }}
    >
      <dt
        style={{
          color: "#555555",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "8.5pt",
          lineHeight: 1.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          color: "#111111",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9.5pt",
          fontWeight: 700,
          lineHeight: 1.35,
          margin: 0,
          overflowWrap: "anywhere",
          textAlign: "left",
          whiteSpace: "pre-wrap",
          wordBreak: "normal",
        }}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <dl
      style={{
        display: "grid",
        gap: "0 14px",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        margin: 0,
      }}
    >
      {children}
    </dl>
  );
}

function StoneCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        breakInside: "avoid",
        border: "1px solid #d8d8d8",
        borderRadius: 6,
        marginBottom: 0,
        pageBreakInside: "avoid",
        padding: "8px 9px 5px",
      }}
    >
      <p
        style={{
          color: "#111111",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9.5pt",
          fontWeight: 700,
          margin: "0 0 4px",
        }}
      >
        {title}
      </p>
      <DetailGrid>{children}</DetailGrid>
    </div>
  );
}

function MediaPanel({ item }: { item: RequirementDisplayItem }) {
  const images = item.images.filter((image) => image.url);
  const primaryImage = images[0];
  const secondaryImages = images.slice(1);
  const links = item.links.filter((link) => link.url);

  return (
    <aside
      style={{
        breakInside: "avoid",
        float: "left",
        margin: "10px 24px 14px 0",
        pageBreakInside: "avoid",
        width: 210,
      }}
    >
      <div
        style={{
          alignItems: "center",
          aspectRatio: "1 / 1",
          background: "#f7f7f7",
          border: "1px solid #cfcfcf",
          borderRadius: 6,
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.name || item.title}
            decoding="sync"
            loading="eager"
            style={{ height: "100%", objectFit: "contain", width: "100%" }}
          />
        ) : (
          <span
            style={{
              color: "#666666",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "9pt",
            }}
          >
            No image added
          </span>
        )}
      </div>
      {secondaryImages.length > 0 ? (
        <div
          style={{
            display: "grid",
            gap: 7,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            marginTop: 8,
          }}
        >
          {secondaryImages.map((image, index) => (
            <div
              key={image.id}
              style={{
                alignItems: "center",
                aspectRatio: "1 / 1",
                background: "#f7f7f7",
                border: "1px solid #d8d8d8",
                borderRadius: 5,
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={image.url}
                alt={image.name || `${item.title} reference ${index + 2}`}
                decoding="sync"
                loading="eager"
                style={{
                  display: "block",
                  height: "100%",
                  objectFit: "contain",
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>
      ) : null}
      {links.length > 0 ? <ReferenceLinks links={links} /> : null}
      {item.estimation ? <EstimateCard estimation={item.estimation} /> : null}
    </aside>
  );
}

function ReferenceLinks({
  links,
}: {
  links: RequirementDisplayItem["links"];
}) {
  return (
    <div
      style={{
        border: "1px solid #d8d8d8",
        borderRadius: 6,
        marginTop: 12,
        padding: "9px 10px",
      }}
    >
      <p
        style={{
          color: "#555555",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "7.5pt",
          fontWeight: 700,
          letterSpacing: 0,
          margin: "0 0 7px",
        }}
      >
        Reference links
      </p>
      <div style={{ display: "grid", gap: 6 }}>
        {links.map((link, index) =>
          link.url ? (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              title={link.url}
              style={{
                borderBottom: "1px dotted #cfcfcf",
                color: "#111111",
                display: "grid",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "8.5pt",
                fontWeight: 700,
                gap: 6,
                gridTemplateColumns: "18px minmax(0, 1fr)",
                lineHeight: 1.25,
                paddingBottom: 5,
                textDecoration: "none",
                textTransform: "none",
              }}
            >
              <span style={{ color: "#666666" }}>{index + 1}.</span>
              <span
                style={{
                  overflowWrap: "anywhere",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                {compactUrl(link.url)}
              </span>
            </a>
          ) : null,
        )}
      </div>
    </div>
  );
}

function EstimateCard({ estimation }: { estimation: ProductEstimation }) {
  return (
    <div
      style={{
        border: "1px solid #d8d8d8",
        borderRadius: 6,
        marginTop: 12,
        padding: "10px 12px",
      }}
    >
      <p
        style={{
          color: "#555555",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "7.5pt",
          fontWeight: 700,
          letterSpacing: "0.2em",
          margin: 0,
          textTransform: "uppercase",
        }}
      >
        Estimate
      </p>
      <p
        style={{
          color: "#111111",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "15pt",
          fontWeight: 700,
          margin: "4px 0",
        }}
      >
        {formatCurrency(estimation.finalAmount)}
      </p>
      <p
        style={{
          color: "#555555",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "9pt",
          margin: 0,
        }}
      >
        {estimation.metalWeight}g {estimation.purity} -{" "}
        {formatDate(estimation.createdAt)}
      </p>
      {estimation.vendorName || estimation.notes ? (
        <p
          style={{
            borderTop: "1px dotted #cfcfcf",
            color: "#555555",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "9pt",
            margin: "10px 0 0",
            overflowWrap: "anywhere",
            paddingTop: 10,
          }}
        >
          {[estimation.vendorName, estimation.notes].filter(Boolean).join(" - ")}
        </p>
      ) : null}
    </div>
  );
}

function DiamondDetails({ diamonds }: { diamonds: EnquiryDiamond[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {diamonds.map((diamond, index) => (
        <StoneCard
          key={diamond.id ?? index}
          title={`Diamond ${index + 1} of ${diamonds.length}`}
        >
          <DetailRow
            label="Type"
            value={joinValues([diamond.type, diamond.growthMethod])}
          />
          <DetailRow label="Shape" value={diamond.shape} />
          <DetailRow label="Clarity" value={diamond.clarity} />
          <DetailRow label="Colour" value={diamond.colour} />
          <DetailRow label="Size" value={diamond.size} />
          <DetailRow label="Pieces" value={diamond.pieces} />
          <DetailRow label="Approx. weight" value={diamond.weight} />
          <div style={{ gridColumn: "1 / -1" }}>
            <DetailRow label="Notes" value={diamond.notes} />
          </div>
        </StoneCard>
      ))}
    </div>
  );
}

function ColorStoneDetails({ stones }: { stones: EnquiryColorStone[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {stones.map((stone, index) => (
        <StoneCard
          key={stone.id ?? index}
          title={`Color Stone ${index + 1} of ${stones.length}`}
        >
          <DetailRow label="Type" value={stone.stoneType} />
          <DetailRow label="Nature" value={stone.nature} />
          <DetailRow label="Origin" value={stone.origin} />
          <DetailRow label="Treatment" value={stone.treatment} />
          <DetailRow label="Shape" value={stone.shape} />
          <DetailRow label="Colour" value={stone.colour} />
          <DetailRow label="Size" value={stone.size} />
          <DetailRow label="Pieces" value={stone.pieces} />
          <DetailRow label="Weight" value={stone.weight} />
          <div style={{ gridColumn: "1 / -1" }}>
            <DetailRow label="Notes" value={stone.notes} />
          </div>
        </StoneCard>
      ))}
    </div>
  );
}

export function EnquiryEstimationPrintView({
  item,
  enquiryRefCode,
}: {
  item: RequirementDisplayItem;
  enquiryRefCode: number;
}) {
  const metal = joinValues([item.metalType, item.metalPurity]);
  const printDate = formatPrintDate(new Date());
  const visibleDiamonds = item.diamonds.filter(hasRecordValues);
  const visibleColorStones = item.colorStones.filter(hasRecordValues);

  return (
    <div
      id="enquiry-estimation-print-view"
      style={{
        background: "#ffffff",
        color: "#111111",
        display: "none",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 0,
      }}
    >
      <article
        style={{
          background: "#ffffff",
          color: "#111111",
          display: "block",
          margin: "0 auto",
          maxWidth: "680px",
          padding: "0 0 12px",
        }}
      >
        <header
          style={{
            borderBottom: "1px solid #111111",
            gridColumn: "1 / -1",
            marginBottom: 2,
            paddingBottom: 12,
            textAlign: "center",
          }}
        >
          <img
            src="/evol-logo.webp"
            alt="Evol Jewels"
            decoding="sync"
            loading="eager"
            style={{
              display: "block",
              height: 34,
              margin: "0 auto 8px",
              objectFit: "contain",
              width: "auto",
            }}
          />
          <p
            style={{
              color: "#555555",
              fontSize: "8pt",
              fontWeight: 700,
              letterSpacing: "0.18em",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Custom Requirement Specification
          </p>
          <div
            style={{
              alignItems: "center",
              color: "#111111",
              display: "flex",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "9pt",
              fontWeight: 700,
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <span>{`Enquiry No: #${enquiryRefCode}`}</span>
            <span>{`Date: ${printDate}`}</span>
          </div>
        </header>

        <MediaPanel item={item} />

        <main
          style={{
            marginLeft: 234,
            paddingTop: 10,
            minWidth: 0,
            width: "auto",
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h1
              style={{
                color: "#111111",
                fontSize: "19pt",
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.15,
                margin: "0 0 4px",
                textAlign: "left",
                textTransform: "capitalize",
              }}
            >
              {item.title}
            </h1>
            {item.subtitle ? (
              <p
                style={{
                  color: "#555555",
                  fontSize: "9.5pt",
                  fontWeight: 700,
                  margin: 0,
                  textAlign: "left",
                  textTransform: "uppercase",
                }}
              >
                {item.subtitle}
              </p>
            ) : null}
          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "1fr",
            }}
          >
            <PrintSection title="Metal">
              <DetailGrid>
                <DetailRow label="Metal" value={metal} />
                <DetailRow label="Metal color" value={item.details.metalColor} />
                <DetailRow label="Gold weight" value={item.metalWeight} />
                <DetailRow label="Certification" value={item.details.certification} />
                <DetailRow label="Polish" value={item.details.polish} />
              </DetailGrid>
            </PrintSection>
          </div>

          {visibleDiamonds.length > 0 ? (
            <PrintSection
              title="Diamond Details"
              count={`${visibleDiamonds.length} item${visibleDiamonds.length === 1 ? "" : "s"}`}
            >
              <DiamondDetails diamonds={visibleDiamonds} />
            </PrintSection>
          ) : null}

          {visibleColorStones.length > 0 ? (
            <PrintSection
              title="Color Stone Details"
              count={`${visibleColorStones.length} item${visibleColorStones.length === 1 ? "" : "s"}`}
            >
              <ColorStoneDetails stones={visibleColorStones} />
            </PrintSection>
          ) : null}

          {item.notes ? (
            <PrintSection title="Special notes">
              <p
                style={{
                  color: "#111111",
                  fontSize: "9.5pt",
                  fontWeight: 700,
                  lineHeight: 1.5,
                  margin: 0,
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.notes}
              </p>
            </PrintSection>
          ) : null}
        </main>
      </article>
    </div>
  );
}
