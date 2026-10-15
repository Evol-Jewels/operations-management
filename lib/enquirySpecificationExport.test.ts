import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EnquiryEstimationPrintView } from "@/components/enquiry/EnquiryEstimationPrintView";
import type { RequirementDisplayItem } from "@/components/enquiry/requirements/requirement-display-utils";
import type { RecordType } from "@/types";

const specification: RequirementDisplayItem = {
  id: "item",
  kind: "custom",
  title: "Bracelet",
  subtitle: "Yellow Gold 18K",
  status: "ESTIMATED",
  defaultPurity: "18K",
  metalType: "Gold",
  metalPurity: "18K",
  references: [],
  images: [],
  videos: [],
  audios: [],
  links: [],
  diamonds: [{ id: "diamond", shape: "Oval", weight: "0.5", pieces: "2" }],
  colorStones: [],
  details: { orderType: "Client" },
  notes: "Requirement note",
};
const withEstimation: RequirementDisplayItem = {
  ...specification,
  estimation: {
    id: "estimate",
    productId: "item",
    metalType: "Platinum",
    purity: "950",
    metalWeight: 7.123,
    stoneDetails: [
      { id: "stone", type: "Private priced stone", netWeight: 2.3, pieces: 4 },
    ],
    makingCost: 9182,
    finalAmount: 123456,
    createdAt: "2026-10-14",
    notes: "Private estimate note",
    vendorName: "Private estimate vendor",
  },
};

for (const recordType of ["enquiry", "order"] satisfies RecordType[]) {
  test(`${recordType} specification export ignores all estimate data`, () => {
    const render = (item: RequirementDisplayItem) =>
      renderToStaticMarkup(
        createElement(EnquiryEstimationPrintView, {
          item,
          enquiryRefCode: 20,
          recordType,
        }),
      );
    const html = render(withEstimation);
    assert.equal(html, render(specification));
    for (const value of ["Bracelet", "Oval", "Requirement note", "18K"])
      assert.ok(html.includes(value));
    for (const value of [
      "Platinum",
      "Private estimate",
      "Private priced stone",
      "Making charge",
      "123456",
      "GST",
    ])
      assert.ok(!html.includes(value));
  });
}
