import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { InventoryProduct } from "@/types/inventory-api";
import { createRefillOrderSeed } from "./order-form-utils";

function inventoryProduct(
  overrides: Partial<InventoryProduct> = {},
): InventoryProduct {
  return {
    id: "product-id",
    productCode: "EV-1001",
    name: "Solitaire Ring",
    category: "RING",
    description: "Classic solitaire ring",
    vendor: "  ABC Jewellers  ",
    color: "YELLOW",
    purity: 18,
    size: "13",
    isCustomerProduct: false,
    locationId: "location-id",
    location: {
      id: "location-id",
      name: "Banjara Hills",
      city: "Hyderabad",
      type: "STORE",
      notes: null,
    },
    sourceCategoryCode: null,
    sourceCategoryTitle: null,
    sourceCreatedAt: "2026-08-01T00:00:00.000Z",
    netWeight: "5.800",
    grossWeight: "6.100",
    totalDiamondWeight: "0.300",
    totalStoneWeight: "0.300",
    notes: "Match the original finish",
    media: [
      {
        id: "image-id",
        mediaType: "IMAGE",
        storageKey: "https://cdn.example.com/product.jpg",
        altText: "Solitaire ring",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    price: {
      goldCost: 100_000,
      nonGoldCost: 25_000,
      subtotal: 125_000,
      gstPercentage: 3,
      gst: 3_750,
      total: 128_750,
    },
    stones: [],
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    isDeleted: false,
    ...overrides,
  };
}

describe("createRefillOrderSeed", () => {
  test("maps inventory details needed by an existing-product order", () => {
    assert.deepEqual(createRefillOrderSeed(inventoryProduct()), {
      name: "Solitaire Ring",
      productCode: "EV-1001",
      category: "Ring",
      metalType: "Gold",
      metalPurity: "18K",
      metalNetWeight: "5.800",
      metalGrossWeight: "6.100",
      size: "13",
      imageUrl: "https://cdn.example.com/product.jpg",
      basePrice: 128_750,
      notes: "Match the original finish",
      vendor: "ABC Jewellers",
    });
  });

  test("falls back to description and tolerates missing optional details", () => {
    const seed = createRefillOrderSeed(
      inventoryProduct({
        vendor: "",
        size: null,
        netWeight: "",
        grossWeight: "",
        notes: null,
        media: [],
      }),
    );

    assert.equal(seed.notes, "Classic solitaire ring");
    assert.equal(seed.vendor, "");
    assert.equal(seed.imageUrl, undefined);
    assert.equal(seed.size, undefined);
    assert.equal(seed.metalNetWeight, undefined);
    assert.equal(seed.metalGrossWeight, undefined);
  });
});
