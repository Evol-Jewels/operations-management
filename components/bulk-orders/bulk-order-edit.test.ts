import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
  BackendBulkOrderDetails,
  BackendBulkOrderItem,
} from "@/types/bulk-order-api";
import {
  buildHeaderPatch,
  buildItemPatch,
  buildProductInput,
  centsToMoney,
  createHeaderDraft,
  createItemDraft,
  moneyToCents,
  quotationSubtotal,
  syncStoneQuotes,
} from "./bulk-order-edit";

const item: BackendBulkOrderItem = {
  id: "line-id",
  refCode: 456,
  bulkSerialNumber: 1,
  quantity: 2,
  vendorDesignNumber: "RG-12",
  status: "NEW",
  notes: "Keep engraving",
  estimatedDeliveryDate: "2026-12-01",
  vendorDeliveryDate: "2026-11-20",
  isCadRequired: true,
  quotedSubtotal: "110.10",
  quotationBreakdown: {
    metal: { rate: "10.00", amount: "10.00" },
    diamonds: [{ specId: "d1", rate: "100.10", amount: "100.10" }],
    colorStones: [],
    other: [],
    setting: "0.00",
    labour: { amount: "0.00" },
  },
  customProduct: {
    id: "product-id",
    orderId: "line-id",
    category: "RING",
    metalType: "Gold",
    metalPurity: "14K",
    metalColor: "YELLOW",
    size: 6.25,
    metalNetWeight: "1.200",
    metalGrossWeight: "1.300",
    metalPureWeight: "0.800",
    stones: [
      {
        stoneType: "Diamond",
        approxPieces: 1,
        netWeight: "0.500",
        slabCode: "SLAB-1",
      },
    ],
    requirementSpecification: {
      references: [
        {
          type: "VIDEO",
          url: "https://example.test/video.mp4",
          mimeType: "video/mp4",
          durationSeconds: 10,
        },
      ],
      diamonds: [{ id: "d1", shape: "PEAR", clarity: "VS", weight: "0.500" }],
      colorStones: [],
      details: {
        findingType: "Hidden halo",
        deliveryDate: "2026-11-25",
        specialNotes: "Retain these",
      },
      notes: "Original requirement",
    },
  },
};
const order: BackendBulkOrderDetails = {
  id: "bulk-id",
  refCode: 123,
  vendorId: "vendor-id",
  vendorName: "Vendor",
  vendorCity: "Surat",
  packingListNumber: "PACK-12",
  quotationDate: "2026-10-20",
  expectedDeliveryDate: "2026-12-01",
  currency: "INR",
  quotedSubtotal: "110.10",
  taxRate: "3.00",
  taxAmount: "3.30",
  roundingAmount: "-0.40",
  quotedTotal: "113.00",
  documentUrl: "https://example.test/packing.pdf",
  createdBy: null,
  createdAt: "2026-10-20",
  updatedAt: "2026-10-20",
  items: [item],
  summary: {
    status: "PENDING",
    lines: 1,
    filledLines: 0,
    pendingLines: 1,
    cancelledLines: 0,
    pieces: 2,
    filled: 0,
    pending: 2,
    cancelledPieces: 0,
    cancelledAmount: "0.00",
    amounts: {
      metal: "10.00",
      stone: "100.10",
      other: "0.00",
      setting: "0.00",
      labour: "0.00",
      quoted: "110.10",
    },
  },
  reconciliation: {
    lineSubtotal: "110.10",
    expectedTotal: "113.00",
    subtotalDifference: "0.00",
    totalDifference: "0.00",
    hasDifference: false,
  },
};

describe("bulk editing payloads", () => {
  test("header changes preserve taxes, rounding and dates by sending only changed fields", () => {
    assert.deepEqual(
      buildHeaderPatch(
        { ...createHeaderDraft(order), packingListNumber: " REVISED " },
        order,
      ),
      { packingListNumber: "REVISED" },
    );
    assert.deepEqual(buildHeaderPatch(createHeaderDraft(order), order), {});
    assert.deepEqual(
      buildHeaderPatch(
        { ...createHeaderDraft(order), vendorCity: "", documentUrl: "" },
        order,
      ),
      { vendorCity: null, documentUrl: null },
    );
  });
  test("rejects missing vendors, invalid amounts and out-of-range tax", () => {
    for (const patch of [
      { vendorId: "" },
      { taxRate: "101" },
      { quotedTotal: "1e5" },
      { quotedTotal: "1.001" },
      { packingListNumber: " " },
      { expectedDeliveryDate: "" },
    ])
      assert.throws(() =>
        buildHeaderPatch({ ...createHeaderDraft(order), ...patch }, order),
      );
  });
  test("line patches retain unrelated specification and quote data", () => {
    assert.deepEqual(
      buildItemPatch(item, {
        quotationBreakdown: {
          labour: item.quotationBreakdown.labour,
          setting: "0.00",
          metal: item.quotationBreakdown.metal,
          diamonds: item.quotationBreakdown.diamonds,
          other: [],
          colorStones: [],
        },
      }),
      {},
    );
    assert.deepEqual(buildItemPatch(item, { quantity: 5 }), { quantity: 5 });
    assert.deepEqual(buildItemPatch(item, { quantity: 2 }), {});
    assert.deepEqual(
      buildItemPatch(item, { notes: null, estimatedDeliveryDate: null }),
      { notes: null, estimatedDeliveryDate: null },
    );
    const draft = createItemDraft(item);
    const customProduct = buildProductInput(item, draft, {
      size: "7.25",
      gross: "1.300",
      pure: "0.800",
    });
    assert.equal(customProduct.size, 7.25);
    assert.equal(customProduct.metalPureWeight, "0.800");
    assert.deepEqual(customProduct.stones, item.customProduct?.stones);
    assert.equal("id" in customProduct, false);
    assert.equal("referenceProductCode" in customProduct, false);
    assert.equal(draft.details.findingType, "Hidden halo");
    assert.equal(draft.details.specialNotes, "Retain these");
  });
  test("optional product fields can be cleared and diamond-only lines are supported", () => {
    const draft = {
      ...createItemDraft(item),
      metalType: "",
      metalPurity: "",
      metalWeight: "",
    };
    const product = buildProductInput(item, draft, {
      size: "",
      gross: "",
      pure: "",
    });
    assert.equal(product.metalType, undefined);
    assert.equal(product.size, undefined);
    assert.equal(product.metalPureWeight, undefined);
    assert.deepEqual(product.stones, item.customProduct?.stones);
  });
  test("matches quote rows by stable stone ID after edits, additions and removals", () => {
    const draft = createItemDraft(item);
    draft.diamonds = [{ id: "new", shape: "ROUND" }, ...draft.diamonds];
    let quote = syncStoneQuotes(item.quotationBreakdown, draft);
    assert.deepEqual(quote.diamonds, [
      { specId: "new", amount: "0.00" },
      item.quotationBreakdown.diamonds[0],
    ]);
    draft.diamonds = draft.diamonds.filter((row) => row.id !== "d1");
    quote = syncStoneQuotes(quote, draft);
    assert.deepEqual(quote.diamonds, [{ specId: "new", amount: "0.00" }]);
  });
  test("money uses exact cents and quantity does not multiply quotations", () => {
    assert.equal(
      centsToMoney(moneyToCents("999999999999.99")),
      "999999999999.99",
    );
    assert.equal(centsToMoney(moneyToCents("-0.40", true)), "-0.40");
    assert.equal(quotationSubtotal(item.quotationBreakdown), "110.10");
    assert.equal(
      quotationSubtotal({ ...item.quotationBreakdown, setting: "0.20" }),
      "110.30",
    );
  });
  test("rejects fractional quantities and precision loss in size or weights", () => {
    assert.throws(() => buildItemPatch(item, { quantity: 1.5 }));
    assert.throws(() =>
      buildProductInput(item, createItemDraft(item), {
        size: "7.255",
        gross: "",
        pure: "",
      }),
    );
    assert.throws(() =>
      buildProductInput(item, createItemDraft(item), {
        size: "7",
        gross: "1.1234",
        pure: "",
      }),
    );
  });
  test("maps the shared category choices to supported bulk categories", () => {
    const product = buildProductInput(
      item,
      { ...createItemDraft(item), category: "Earrings" },
      { size: "", gross: "", pure: "" },
    );
    assert.equal(product.category, "EARRING");
  });
});
