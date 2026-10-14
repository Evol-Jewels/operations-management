import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeRequirementItems } from "@/components/enquiry/requirements/requirement-display-utils";
import { upsertEnquiryEstimation } from "./enquiryEstimationCache";
import { mapBackendEnquiryDetailsToOrder } from "./enquiryMappers";
import type {
  BackendEnquiryDetails,
  BackendEnquiryItemRow,
  BackendEstimationRow,
} from "@/types/enquiry-api";

const item: BackendEnquiryItemRow = {
  id: "item-20",
  enquiryId: "enquiry-20",
  type: "CUSTOM",
  category: "Ring",
  productCode: null,
  referenceProductCode: null,
  metalType: "Gold",
  metalPurity: "18K",
  metalWeight: null,
  stones: [],
  diamonds: [],
  colorStones: [],
  details: {},
  media: [],
  notes: null,
  status: "PENDING",
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
  estimations: [],
};
const details: BackendEnquiryDetails = {
  enquiry: {
    id: "enquiry-20",
    refCode: 20,
    name: "Test customer",
    phoneNumber: "",
    notes: null,
    budget: null,
    status: "ESTIMATED",
    createdBy: null,
    salesPerson: { id: "sales", name: "Sales", image: null },
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
  },
  items: [item, { ...item, id: "another-item" }],
  activityLogs: [],
};
const saved: BackendEstimationRow = {
  id: "server-estimate-id",
  enquiryItemId: item.id,
  metalType: "Gold",
  metalPurity: "18K",
  netWeight: "3.125",
  stones: [],
  media: [],
  makingCost: "1500.00",
  vendorName: null,
  notes: null,
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-10-14",
  updatedAt: "2026-10-14",
};

function displayItems(value: BackendEnquiryDetails) {
  const order = mapBackendEnquiryDetailsToOrder(value);
  return normalizeRequirementItems({
    selectedProducts: order.selectedProducts ?? [],
    customProducts: order.customProducts ?? [],
    estimations: order.estimations ?? [],
  });
}

test("an Estimated status without a saved quote does not fabricate a viewable estimate", () => {
  assert.equal(displayItems(details)[0].estimation, undefined);
});

test("a confirmed save attaches the server estimate to the intended item before refetch", () => {
  const updated = upsertEnquiryEstimation(details, saved, item.id);
  assert.ok(updated);
  const items = displayItems(updated);
  assert.equal(items[0].estimation?.id, saved.id);
  assert.equal(items[0].estimation?.metalWeight, 3.125);
  assert.equal(items[1].estimation, undefined);
  assert.equal(details.items[0].estimations?.length, 0);
});

test("updating a saved quote replaces it instead of creating a duplicate", () => {
  const created = upsertEnquiryEstimation(details, saved, item.id);
  const updated = upsertEnquiryEstimation(
    created,
    { ...saved, netWeight: "4.000" },
    item.id,
  );
  assert.equal(updated?.items[0].estimations?.length, 1);
  assert.ok(updated);
  assert.equal(displayItems(updated)[0].estimation?.metalWeight, 4);
});

test("nested estimate association uses its enclosing item ID", () => {
  const value = {
    ...details,
    items: [
      {
        ...item,
        estimations: [{ ...saved, enquiryItemId: "mismatched-parent" }],
      },
    ],
  };
  assert.equal(displayItems(value)[0].estimation?.productId, item.id);
});

test("other enquiry caches are left unchanged", () => {
  assert.equal(
    upsertEnquiryEstimation(details, saved, "not-this-enquiry"),
    details,
  );
  assert.equal(upsertEnquiryEstimation(undefined, saved, item.id), undefined);
});
