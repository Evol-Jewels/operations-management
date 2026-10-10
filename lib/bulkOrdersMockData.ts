import type { ActivityEntry, EnquiryDiamond } from "@/types";
import type {
  BulkItemStage,
  BulkOrder,
  BulkOrderItem,
  BulkOrderProduct,
} from "./bulkOrders";

// Sheet rows from packing list QOS/26-27/0113. Diamond shape, colour and
// growth method are not in the sheet, so they are filled with sample values.
function diamond(
  shape: string,
  clarity: string,
  size: string,
  pieces: number,
  weight: number,
  colour: string,
  growthMethod: "CVD" | "HPHT",
): EnquiryDiamond {
  return {
    type: "Lab Grown",
    growthMethod,
    shape,
    clarity,
    colour,
    size,
    pieces: String(pieces),
    weight: `${weight.toFixed(2)} ct`,
  };
}

function product(
  values: Omit<
    BulkOrderProduct,
    "metalType" | "metalPurity" | "certification" | "colorStones"
  >,
): BulkOrderProduct {
  return {
    metalType: "Gold",
    metalPurity: "14KT",
    certification: "IGI",
    colorStones: [],
    ...values,
  };
}

const PRODUCTS = {
  NC0137: product({
    vendorDesignNumber: "NC0137",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Rose",
    polish: "Only Prongs Rhodium",
    diamondQuality: "VS, VVS",
    grossWeight: 2.022,
    netWeight: 1.718,
    diamonds: [
      diamond("Heart", "VS1", "0.48 ct", 1, 0.48, "EF", "CVD"),
      diamond("Pear", "VVS2", "1.04 ct", 1, 1.04, "F", "CVD"),
    ],
    amounts: {
      metal: 15646,
      stone: 20280,
      other: 0,
      labour: 5602,
      quoted: 41528,
    },
  }),
  NC0158: product({
    vendorDesignNumber: "NC0158",
    category: "Necklace",
    productSize: "L 18.00 INCH",
    metalColor: "Yellow",
    polish: "Bright Finish",
    diamondQuality: "VS",
    grossWeight: 6.744,
    netWeight: 5.504,
    diamonds: [
      diamond(
        "Round Brilliant",
        "VS2",
        "0.15 - 0.499 ct",
        39,
        6.2,
        "G",
        "HPHT",
      ),
    ],
    amounts: {
      metal: 50125,
      stone: 52700,
      other: 0,
      labour: 8256,
      quoted: 111081,
    },
  }),
  RG0496: product({
    vendorDesignNumber: "RG0496",
    category: "Ring",
    productSize: "6.50 US",
    metalColor: "White",
    polish: "Full Rhodium",
    diamondQuality: "VS",
    grossWeight: 1.451,
    netWeight: 1.275,
    diamonds: [
      diamond("Pear", "VS1", "0.15 ct avg", 3, 0.45, "EF", "CVD"),
      diamond("Round Brilliant", "VS2", "+11 - 14", 4, 0.43, "G", "CVD"),
    ],
    amounts: {
      metal: 11612,
      stone: 8830,
      other: 0,
      labour: 4924,
      quoted: 25366,
    },
  }),
  NC0139: product({
    vendorDesignNumber: "NC0139",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Yellow",
    polish: "Only Gold Polish",
    diamondQuality: "VS",
    grossWeight: 2.058,
    netWeight: 1.786,
    diamonds: [
      diamond("Round Brilliant", "VS1", "+11 - 14", 7, 0.6, "F", "HPHT"),
      diamond("Round Brilliant", "VS2", "+6.5 - 11", 2, 0.11, "G", "HPHT"),
      diamond("Oval", "VS1", "0.15 - 0.499 ct", 3, 0.65, "EF", "CVD"),
    ],
    amounts: {
      metal: 16265,
      stone: 11560,
      other: 0,
      labour: 8601,
      quoted: 36426,
    },
  }),
  NC0135: product({
    vendorDesignNumber: "NC0135",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Rose + White",
    polish: "In setting Rhodium",
    diamondQuality: "VS",
    grossWeight: 2.199,
    netWeight: 1.699,
    diamonds: [
      diamond("Pear", "VS1", "0.61 ct", 1, 0.61, "E", "CVD"),
      diamond("Round Brilliant", "VS2", "+11 - 14", 6, 0.47, "G", "HPHT"),
      diamond("Marquise", "VS2", "0.15 - 0.499 ct", 8, 1.42, "F", "CVD"),
    ],
    amounts: {
      metal: 15473,
      stone: 23080,
      other: 0,
      labour: 9066,
      quoted: 47619,
    },
  }),
  NC0148: product({
    vendorDesignNumber: "NC0148",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "White",
    polish: "Full Rhodium",
    diamondQuality: "VS",
    grossWeight: 2.421,
    netWeight: 1.857,
    diamonds: [
      diamond("Round Brilliant", "VS1", "+11 - 14", 25, 2.67, "EF", "HPHT"),
      diamond("Round Brilliant", "VS2", "+2 - 6.5", 1, 0.02, "G", "HPHT"),
      diamond("Princess", "VS1", "+6.5 - 11", 3, 0.13, "F", "CVD"),
    ],
    amounts: {
      metal: 16912,
      stone: 23970,
      other: 0,
      labour: 13799,
      quoted: 54681,
    },
  }),
  NC0142: product({
    vendorDesignNumber: "NC0142",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Rose",
    polish: "Only Prongs Rhodium",
    diamondQuality: "VS",
    grossWeight: 1.919,
    netWeight: 1.761,
    diamonds: [
      diamond("Pear", "VS1", "0.57 ct", 1, 0.57, "EF", "CVD"),
      diamond("Round Brilliant", "VS2", "+11 - 14", 2, 0.22, "G", "CVD"),
    ],
    amounts: {
      metal: 16038,
      stone: 8425,
      other: 0,
      labour: 6008,
      quoted: 30470,
    },
  }),
  NC0145: product({
    vendorDesignNumber: "NC0145",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Yellow + White",
    polish: "Back Rhodium",
    diamondQuality: "VS",
    grossWeight: 1.932,
    netWeight: 1.736,
    diamonds: [
      diamond("Emerald Cut", "VS1", "0.77 ct", 1, 0.77, "F", "CVD"),
      diamond("Round Brilliant", "VS2", "+11 - 14", 2, 0.21, "G", "HPHT"),
    ],
    amounts: {
      metal: 15810,
      stone: 10640,
      other: 0,
      labour: 5935,
      quoted: 32384,
    },
  }),
  NC0152: product({
    vendorDesignNumber: "NC0152",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "Yellow",
    polish: "Bright Finish",
    diamondQuality: "VS",
    grossWeight: 6.379,
    netWeight: 5.713,
    diamonds: [diamond("Cushion", "VS2", "+14", 24, 3.33, "G", "HPHT")],
    amounts: {
      metal: 52029,
      stone: 12321,
      other: 0,
      labour: 20813,
      quoted: 85163,
    },
  }),
  NC0153: product({
    vendorDesignNumber: "NC0153",
    category: "Necklace",
    productSize: "L 16 - 18 INCH",
    metalColor: "White",
    polish: "Full Rhodium",
    diamondQuality: "VVS",
    grossWeight: 2.22,
    netWeight: 1.704,
    diamonds: [
      diamond("Oval", "VVS1", "1.00 - 1.099 ct", 1, 1.04, "E", "CVD"),
      diamond(
        "Round Brilliant",
        "VVS2",
        "1.50 - 1.999 ct",
        1,
        1.54,
        "F",
        "CVD",
      ),
    ],
    amounts: {
      metal: 15518,
      stone: 35080,
      other: 0,
      labour: 5441,
      quoted: 56039,
    },
  }),
} satisfies Record<string, BulkOrderProduct>;

type DesignNumber = keyof typeof PRODUCTS;

// Primary Google Drive images of existing inventory products, served by the media proxy.
const DESIGN_IMAGES: Record<DesignNumber, string[]> = {
  NC0137: ["24d3560a-5047-4a92-a69b-54568b30af91"],
  NC0158: ["b6a0b50f-a7ff-471c-a760-4ef74c3f2b94"],
  RG0496: [
    "d9ffbd96-394f-4931-9d14-4eeace257763",
    "22325e26-dbdc-42de-bf9f-a8870b1e4e1e",
  ],
  NC0139: ["7ae35458-3f03-4261-ae75-b3ccc45e4569"],
  NC0135: ["4f0f470c-175b-4e6e-87e1-44d7b9292502"],
  NC0148: ["0d698625-f4fc-4dff-a92b-11cd95a6fa26"],
  NC0142: ["66f2b9aa-3238-48bf-bf1b-c9ccd625644c"],
  NC0145: ["03e3999d-5888-4e64-8ab4-0177cdaddb72"],
  NC0152: ["dbe5ef12-e80f-436a-9758-2d5aac2039aa"],
  NC0153: [
    "d5bda4f6-52a8-4e55-94f6-3ad5a28aa987",
    "e5456eb3-d0b3-4041-924a-2b4a85011f24",
  ],
};

function line(
  serialNumber: number,
  design: DesignNumber,
  stage: BulkItemStage,
  estimatedDeliveryDate: string,
  quantity = 1,
  notes: Pick<BulkOrderItem, "remarks" | "stageRemark"> = {},
): Omit<BulkOrderItem, "activity"> {
  const base = PRODUCTS[design];
  const { metal, stone, other, labour, quoted } = base.amounts;

  return {
    ...base,
    amounts: {
      metal: metal * quantity,
      stone: stone * quantity,
      other: other * quantity,
      labour: labour * quantity,
      quoted: quoted * quantity,
    },
    serialNumber,
    quantity,
    imageMediaIds: DESIGN_IMAGES[design],
    stage,
    estimatedDeliveryDate,
    ...notes,
  };
}

const BIKASH = { id: "user-bikash", name: "Bikash" };
const VAMSHI = { id: "user-vamshi", name: "Vamshi" };
const DAY = 86_400_000;

function addDays(iso: string, days: number) {
  return new Date(Date.parse(iso) + days * DAY).toISOString();
}

function withActivity(
  order: Omit<BulkOrder, "items"> & {
    items: Array<Omit<BulkOrderItem, "activity">>;
  },
  comments: Record<number, ActivityEntry[]> = {},
): BulkOrder {
  return {
    ...order,
    items: order.items.map((item) => {
      const id = `${order.refCode}-${item.serialNumber}`;
      const movedAt = addDays(order.createdAt, 4 + item.serialNumber);
      const activity: ActivityEntry[] = [
        {
          id: `${id}-created`,
          orderId: id,
          postedBy: order.createdBy,
          timestamp: order.createdAt,
          type: "order_created",
          note: `${order.createdBy.name} added this item from packing list ${order.packingListNumber}`,
        },
      ];
      if (item.stage !== "New") {
        activity.push({
          id: `${id}-stage`,
          orderId: id,
          postedBy: order.createdBy,
          timestamp: movedAt,
          type: "stage_change",
          newStage: item.stage,
          note: `${order.createdBy.name} moved this to ${item.stage}`,
        });
      }
      if (item.stageRemark) {
        activity.push({
          id: `${id}-stage-remark`,
          orderId: id,
          postedBy: order.createdBy,
          timestamp: addDays(movedAt, 0.01),
          type: "comment",
          note: item.stageRemark,
        });
      }
      return {
        ...item,
        activity: [...activity, ...(comments[item.serialNumber] ?? [])],
      };
    }),
  };
}

export const BULK_ORDERS: BulkOrder[] = [
  withActivity(
    {
      refCode: 1,
      packingListNumber: "QOS/26-27/0113",
      vendorName: "NJ Gems Surat",
      vendorCity: "Surat",
      quotationDate: "2026-08-06",
      expectedDeliveryDate: "2026-10-20",
      currency: "INR",
      createdAt: "2026-08-06T10:30:00.000Z",
      createdBy: BIKASH,
      items: [
        line(1, "NC0137", "At Store", "2026-09-22"),
        line(2, "NC0158", "In Production", "2026-10-14"),
        line(3, "RG0496", "In Photoshoot", "2026-09-18"),
        line(4, "NC0139", "At Store", "2026-09-25"),
        line(5, "NC0135", "Certification", "2026-10-08", 1, {
          remarks: "Pear centre stone re-sent for IGI grading.",
        }),
        line(6, "NC0148", "Website Upload", "2026-09-12"),
        line(7, "NC0142", "In Production", "2026-10-20"),
        line(8, "NC0145", "At Store", "2026-09-29"),
        line(9, "NC0152", "Certification", "2026-10-12"),
        line(10, "NC0153", "Editing", "2026-09-15"),
      ],
    },
    {
      2: [
        {
          id: "1-2-comment",
          orderId: "1-2",
          postedBy: VAMSHI,
          timestamp: "2026-10-06T07:45:00.000Z",
          type: "comment",
          note: "Vendor confirmed casting is done. Setting starts this week.",
        },
      ],
    },
  ),
  withActivity({
    refCode: 2,
    packingListNumber: "QOS/26-27/0098",
    vendorName: "NJ Gems Surat",
    vendorCity: "Surat",
    quotationDate: "2026-07-02",
    expectedDeliveryDate: "2026-08-20",
    currency: "INR",
    createdAt: "2026-07-02T09:15:00.000Z",
    createdBy: VAMSHI,
    items: [
      line(1, "NC0137", "Closed", "2026-08-12", 2),
      line(2, "RG0496", "Closed", "2026-08-14"),
      line(3, "NC0142", "Closed", "2026-08-20"),
    ],
  }),
  withActivity({
    refCode: 3,
    packingListNumber: "QOS/26-27/0121",
    vendorName: "NJ Gems Surat",
    vendorCity: "Surat",
    quotationDate: "2026-09-28",
    expectedDeliveryDate: "2026-11-25",
    currency: "INR",
    createdAt: "2026-09-28T11:45:00.000Z",
    createdBy: BIKASH,
    items: [
      line(1, "NC0158", "Certification", "2026-10-30", 2),
      line(2, "NC0153", "In Production", "2026-11-10"),
      line(3, "NC0145", "CAD Design", "2026-11-25", 3),
      line(4, "RG0496", "Cancelled", "2026-11-25", 2, {
        stageRemark: "Vendor can't source matching pear stones before Diwali.",
      }),
    ],
  }),
];
