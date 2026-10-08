import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendRepairComment,
  EMPTY_REPAIR,
  moveRepair,
  prepareRepairMedia,
  REPAIR_FLOW_STAGES,
  type Repair,
  type RepairDraft,
  validateRepair,
  validateRepairVendor,
} from "./repairs";

function draft(overrides: Partial<RepairDraft> = {}): RepairDraft {
  return {
    ...EMPTY_REPAIR,
    productType: "Stock",
    category: "Ring",
    barcode: "EV-R1001",
    grossWeight: "6.2",
    netWeight: "5.8",
    purity: "18KT",
    metalColor: "Yellow",
    repairRemarks: "Repair clasp",
    images: [
      {
        id: "image",
        name: "product.png",
        file: new Blob(["image"], { type: "image/png" }),
      },
    ],
    ...overrides,
  };
}
function repair(): Repair {
  return {
    ...draft(),
    id: "repair",
    refCode: "REP-TEST",
    stage: "New",
    createdAt: "2026-10-05T09:00:00Z",
    updatedAt: "2026-10-05T09:00:00Z",
    history: [],
  };
}
const vendor = {
  vendorName: "Test vendor",
  vendorEstimateDate: "2026-10-10",
  deliveryDate: "2026-10-12",
};

test("stock repairs do not require customer fields; customer repairs do", () => {
  assert.deepEqual(validateRepair(draft()), {});
  const errors = validateRepair(draft({ productType: "Customer" }));
  assert.ok(errors.customerName);
  assert.ok(errors.customerPhone);
  assert.deepEqual(
    validateRepair(
      draft({
        productType: "Customer",
        customerName: "Test Customer",
        customerPhone: "+91 9876543210",
      }),
    ),
    {},
  );
});

test("local comments retain their author and attachments alongside repair history", () => {
  const original = repair();
  const file = new Blob(["image"], { type: "image/png" });
  const comment = {
    id: "comment",
    message: "  Repair update  ",
    timestamp: "2026-10-06T09:00:00Z",
    author: { id: "user", name: "Tester" },
    attachments: [
      { id: "attachment", name: "image.png", file, type: "image" as const },
    ],
  };
  const updated = appendRepairComment(original, comment);
  assert.equal(updated.comments?.[0].message, "Repair update");
  assert.equal(updated.comments?.[0].author.name, "Tester");
  assert.equal(updated.comments?.[0].attachments[0].file, file);
  assert.equal(updated.updatedAt, comment.timestamp);
  assert.deepEqual(updated.history, original.history);
  assert.equal(original.comments, undefined);
  assert.equal(
    appendRepairComment(updated, { ...comment, id: "second" }).comments?.length,
    2,
  );
  assert.throws(
    () => appendRepairComment(original, { ...comment, message: "  " }),
    /Enter a comment/,
  );
});

test("shared media preserves every recording and link without storing temporary preview URLs", () => {
  const image = new Blob(["image"], { type: "image/png" });
  const video = new Blob(["video"], { type: "video/webm" });
  const audio = new Blob(["audio"], { type: "audio/webm" });
  const media = prepareRepairMedia([
    {
      id: "image",
      type: "image",
      name: "photo.png",
      file: image,
      url: "blob:photo",
    },
    {
      id: "video",
      type: "video",
      name: "video.webm",
      file: video,
      url: "blob:video",
      durationSeconds: 12,
    },
    {
      id: "video-2",
      type: "video",
      name: "video-2.webm",
      file: video,
      url: "blob:video-2",
    },
    {
      id: "audio",
      type: "audio",
      name: "audio.webm",
      file: audio,
      url: "blob:audio",
      durationSeconds: 8,
    },
    {
      id: "link",
      type: "link",
      name: "Reference",
      url: "https://example.test/product",
    },
  ]);
  assert.equal(media.images.length, 1);
  assert.equal(media.video?.id, "video");
  assert.equal(media.references.length, 5);
  assert.equal(media.references[3].file, audio);
  assert.equal(media.references[3].durationSeconds, 8);
  assert.equal(media.references[4].url, "https://example.test/product");
  assert.ok(
    media.references
      .slice(0, 4)
      .every((reference) => reference.url === undefined),
  );
  assert.deepEqual(prepareRepairMedia([]).images, []);
  assert.equal(prepareRepairMedia([]).video, undefined);
});
test("required repair remarks and product fields are validated", () => {
  const errors = validateRepair({ ...EMPTY_REPAIR });
  for (const key of [
    "category",
    "grossWeight",
    "netWeight",
    "purity",
    "metalColor",
    "repairRemarks",
  ] as const)
    assert.ok(errors[key]);
});
test("weights and diamond quantities reject invalid values", () => {
  assert.ok(validateRepair(draft({ grossWeight: "-1" })).grossWeight);
  assert.ok(validateRepair(draft({ netWeight: "7" })).netWeight);
  assert.ok(validateRepair(draft({ diamondCarats: "-1" })).diamondCarats);
  assert.ok(validateRepair(draft({ diamondPieces: "1.5" })).diamondPieces);
});
test("stock and customer repairs can omit images and barcode", () => {
  const optionalFields = { barcode: "", images: [], references: [] };
  assert.deepEqual(validateRepair(draft(optionalFields)), {});
  assert.deepEqual(
    validateRepair(
      draft({
        ...optionalFields,
        productType: "Customer",
        customerName: "Test Customer",
        customerPhone: "+91 9876543210",
      }),
    ),
    {},
  );
  assert.deepEqual(
    validateRepair(draft({ ...optionalFields, barcode: "   " })),
    {},
  );
});
test("New to Ready for Repair requires all vendor fields and valid dates", () => {
  assert.throws(() => moveRepair(repair(), "Ready for Repair"), /required/);
  for (const key of [
    "vendorName",
    "vendorEstimateDate",
    "deliveryDate",
  ] as const)
    assert.throws(
      () => moveRepair(repair(), "Ready for Repair", { ...vendor, [key]: "" }),
      /required/,
    );
  assert.throws(
    () =>
      moveRepair(repair(), "Ready for Repair", {
        ...vendor,
        deliveryDate: "2026-02-30",
      }),
    /required/,
  );
});
test("every active stage supports forward, backward and direct moves", () => {
  let current = repair();
  const activeStages = REPAIR_FLOW_STAGES.filter((stage) => stage !== "Closed");
  for (const stage of activeStages.slice(1))
    current = moveRepair(current, stage, vendor);
  assert.equal(current.stage, "At Store");
  assert.equal(current.history.length, 5);
  for (const stage of [...activeStages].slice(0, -1).reverse())
    current = moveRepair(current, stage);
  assert.equal(current.stage, "New");
  assert.equal(current.history.length, 10);
  assert.deepEqual(current.vendor, vendor);
  assert.equal(moveRepair(current, "Dispatched", vendor).stage, "Dispatched");
  assert.throws(() => moveRepair(current, "New", vendor), /different/);
});

test("closing at store and cancelling any active stage lock further transitions", () => {
  for (const stage of REPAIR_FLOW_STAGES.filter(
    (stage) => stage !== "Closed",
  )) {
    const current = { ...repair(), stage, vendor };
    const cancelled = moveRepair(current, "Cancelled");
    assert.equal(cancelled.stage, "Cancelled");
    assert.throws(() => moveRepair(cancelled, "New"), /cannot change/);
  }
  const closed = moveRepair(
    { ...repair(), stage: "At Store", vendor },
    "Closed",
  );
  assert.equal(closed.stage, "Closed");
  assert.throws(() => moveRepair(closed, "At Store"), /cannot change/);
  assert.equal(moveRepair(repair(), "Closed", vendor).stage, "Closed");
});

test("vendor fields are optional on creation, but provided dates must be valid", () => {
  assert.deepEqual(validateRepairVendor(undefined, false), {});
  assert.deepEqual(validateRepair(draft({ vendor })), {});
  assert.ok(
    validateRepair(draft({ vendor: { ...vendor, deliveryDate: "2026-02-30" } }))
      .vendor,
  );
  assert.equal(Object.keys(validateRepairVendor(undefined)).length, 3);
  assert.deepEqual(
    validateRepairVendor({ ...vendor, vendorName: "Custom workshop" }),
    {},
  );
});
