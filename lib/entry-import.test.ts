import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanColorStone } from "@/components/requirements/requirement-form-utils";
import type { BackendEnquiryItemRow } from "@/types/enquiry-api";
import type { BackendOrderRow } from "@/types/order-api";
import {
  importEnquiryRequirement,
  importOrderRequirement,
} from "./entry-import";

function enquiry(): BackendEnquiryItemRow {
  return {
    id: "old-item",
    enquiryId: "old-enquiry",
    type: "CUSTOM",
    category: "Ring",
    productCode: null,
    referenceProductCode: "EV-1",
    metalType: "Gold",
    metalPurity: "18KT",
    metalWeight: "5.800",
    stones: [],
    diamonds: [{ id: "old-diamond", shape: "Oval", weight: "1.2" }],
    colorStones: [],
    details: { productSize: "12", deliveryDate: "2026-11-01" },
    media: [
      {
        type: "AUDIO",
        url: "https://example.com/audio.webm",
        durationSeconds: 12,
      },
    ],
    notes: "Keep the setting low",
    status: "CLOSED",
    createdBy: null,
    updatedBy: null,
    createdAt: "",
    updatedAt: "",
  };
}

test("imports enquiry requirements with fresh IDs and independent editable details", () => {
  const item = enquiry();
  const draft = importEnquiryRequirement(item);
  assert.notEqual(draft.id, item.id);
  assert.notEqual(draft.diamonds[0].id, item.diamonds[0].id);
  assert.equal(draft.references[0].type, "audio");
  assert.equal(draft.references[0].durationSeconds, 12);
  assert.equal(draft.referenceProductCode, "EV-1");
  draft.details.productSize = "14";
  draft.diamonds[0].weight = "2";
  assert.equal(item.details.productSize, "12");
  assert.equal(item.diamonds[0].weight, "1.2");
  assert.equal("status" in draft, false);
  assert.equal(
    importEnquiryRequirement({ ...item, type: "EXISTING", productCode: "EV-2" })
      .productCode,
    "EV-2",
  );
});

test("preserves imported enquiry stone details through submission serialization", () => {
  const source = enquiry();
  source.colorStones = [
    {
      stoneType: "Ruby",
      shape: "Oval",
      colour: "Red",
      size: "4x6",
      pieces: "7",
      weight: "1.4",
    },
  ];
  const draft = importEnquiryRequirement(source);
  const { id: _id, ...serialized } = cleanColorStone(draft.colorStones[0]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(serialized)),
    source.colorStones[0],
  );

  source.colorStones = [];
  source.stones = [{ stoneType: "Ruby", pieces: 7, weight: "1.4" }];
  const legacyDraft = importEnquiryRequirement(source);
  assert.equal(cleanColorStone(legacyDraft.colorStones[0]).pieces, "7");
});

function order(): BackendOrderRow {
  return {
    id: "old-order",
    refCode: 1,
    sourceEnquiry: 3,
    name: "Customer",
    phoneNumber: "1234567890",
    customerAddress: "Address",
    notes: "Updated notes",
    salesPerson: { id: "user", name: "Sales", image: null },
    createdBy: null,
    status: "CLOSED",
    productType: "CUSTOM",
    isCadRequired: true,
    estimatedDeliveryDate: "2026-11-10T00:00:00.000Z",
    vendor: "Vendor",
    vendorDeliveryDate: null,
    createdAt: "",
    updatedAt: "",
    customProduct: {
      category: "EARRING",
      metalType: "GOLD",
      metalPurity: "18KT",
      metalColor: "ROSE",
      metalNetWeight: "5.800",
      size: 12,
      referenceProductCode: "EV-1",
      stones: [{ stoneType: "Diamond", approxPieces: 2, netWeight: "1.5" }],
      requirementSpecification: {
        diamonds: [{ shape: "Oval", pieces: "2", weight: "1.5" }],
        colorStones: [],
        references: [{ type: "IMAGE", url: "https://example.com/image.jpg" }],
        details: { deliveryDate: "2026-01-01", polish: "Glossy" },
        notes: "Old notes",
      },
    },
  };
}

test("imports saved custom order specifications and current delivery and notes", () => {
  const source = order();
  const draft = importOrderRequirement(source);
  assert.equal(draft.category, "Earrings");
  assert.equal(draft.metalType, "Gold");
  assert.equal(draft.details.metalColor, "Rose");
  assert.equal(draft.details.deliveryDate, "2026-11-10");
  assert.equal(draft.details.polish, "Glossy");
  assert.equal(draft.notes, "Updated notes");
  assert.equal(draft.diamonds[0].shape, "Oval");
  assert.deepEqual(draft.colorStones, []);
  assert.equal(draft.references[0].url, "https://example.com/image.jpg");
  draft.diamonds[0].shape = "Round";
  assert.equal(
    source.customProduct?.requirementSpecification?.diamonds?.[0].shape,
    "Oval",
  );
});

test("imports legacy order stones and rejects missing custom product details", () => {
  const source = order();
  assert.ok(source.customProduct);
  source.customProduct.requirementSpecification = null;
  const draft = importOrderRequirement(source);
  assert.equal(draft.colorStones[0].stoneType, "Diamond");
  assert.equal(draft.colorStones[0].pieces, "2");
  assert.equal(draft.colorStones[0].weight, "1.5");
  assert.throws(
    () => importOrderRequirement({ ...source, customProduct: null }),
    /unavailable/,
  );
});

test("imports legacy order stones when a partial specification has no diamonds", () => {
  const source = order();
  assert.ok(source.customProduct);
  source.customProduct.requirementSpecification = { diamonds: [] };
  const draft = importOrderRequirement(source);
  assert.deepEqual(draft.diamonds, []);
  assert.equal(draft.colorStones.length, 1);
  assert.equal(draft.colorStones[0].stoneType, "Diamond");
  assert.equal(draft.colorStones[0].pieces, "2");
  assert.equal(draft.colorStones[0].weight, "1.5");
});
