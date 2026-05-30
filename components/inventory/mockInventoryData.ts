export type InventoryMedia = {
  id: string;
  mediaType: "IMAGE";
  storageKey: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type InventoryStone = {
  id: string;
  stoneSlabCode: string;
  totalNetWeight: string;
  totalPieces: number;
  slab: {
    id: string;
    code: string;
    pricePerCarat: string;
    rangeFrom: string;
    rangeTo: string;
    notes: string | null;
    stoneType: {
      id: string;
      name: string;
      category: string;
      clarity: string;
      color: string | null;
    };
  };
};

export type InventoryProduct = {
  id: string;
  productCode: string;
  name: string;
  category: string;
  description: string;
  vendor: string;
  color: string;
  purity: number;
  size: string | null;
  isCustomerProduct: boolean;
  locationId: string;
  location: {
    id: string;
    name: string;
    city: string;
    type: string;
    notes: string;
  };
  sourceCreatedAt: string;
  netWeight: string;
  grossWeight: string;
  totalDiamondWeight: string;
  totalStoneWeight: string;
  notes: string | null;
  media: InventoryMedia[];
  stones: InventoryStone[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export const mockInventoryProducts: InventoryProduct[] = [
  {
    id: "0209c312-7f86-49ca-b951-b4f62b5e5e67",
    productCode: "CBRC544802",
    name: "Bracelets",
    category: "BRACELET",
    description: "Bracelet",
    vendor: "DB PAHLAJANI VENTURES LLP",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: true,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:40.736Z",
    netWeight: "11.638",
    grossWeight: "13.300",
    totalDiamondWeight: "8.310",
    totalStoneWeight: "8.310",
    notes: null,
    media: [
      {
        id: "7f5715ca-a1bb-434b-91b9-f75c92efa8eb",
        mediaType: "IMAGE",
        storageKey:
          "https://files.synergicserp.com/PML/IMAGES/CBRC544802-1746437082027.jpg",
        altText: "Bracelets CBRC544802",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "22aabd13-fe53-4a95-8cdb-f4a28a971791",
        stoneSlabCode: "LGDRDVVSEFP20",
        totalNetWeight: "8.310",
        totalPieces: 41,
        slab: {
          id: "94906c9e-6f65-4b9b-9f26-a05ce2847d7a",
          code: "LGDRDVVSEFP20",
          pricePerCarat: "25000.00",
          rangeFrom: "0.180",
          rangeTo: "0.230",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:03.856Z",
    updatedAt: "2026-05-30T13:16:03.856Z",
    isDeleted: false,
  },
  {
    id: "80cc4c5a-069c-4775-a19f-c61147a2b718",
    productCode: "CBRC482673",
    name: "Bracelets",
    category: "BRACELET",
    description: "Bracelet",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "ROSE",
    purity: 14,
    size: null,
    isCustomerProduct: true,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:40.736Z",
    netWeight: "89.168",
    grossWeight: "91.780",
    totalDiamondWeight: "13.060",
    totalStoneWeight: "13.060",
    notes: null,
    media: [
      {
        id: "4d72f59f-4f0b-49cc-aa5a-10348213a06f",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/CBRC482673.jpg",
        altText: "Bracelets CBRC482673",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "83fdd1d5-bb50-406a-90f7-7f579b16302a",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "13.060",
        totalPieces: 997,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:03.684Z",
    updatedAt: "2026-05-30T13:16:03.684Z",
    isDeleted: false,
  },
  {
    id: "b1d0e659-570d-4d61-a33b-c73b2d8ebfbf",
    productCode: "SPND679608",
    name: "Pendant",
    category: "PENDANT",
    description: "Pendant",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:17:00.256Z",
    netWeight: "5.519",
    grossWeight: "5.637",
    totalDiamondWeight: "0.590",
    totalStoneWeight: "0.590",
    notes: null,
    media: [
      {
        id: "f0571444-288b-4a55-9368-af1b1e128dc8",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/708b8dfe-164b-4dc9-b4e5-fbe7d1943ebb.jpg",
        altText: "Pendant SPND679608",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "eec29e83-9bf4-47ec-9ec5-c70f7dc70cf5",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.140",
        totalPieces: 18,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "2f3991a7-d0da-40af-a67d-02bb51616f68",
        stoneSlabCode: "LGDRDVVSEFWD4",
        totalNetWeight: "0.450",
        totalPieces: 27,
        slab: {
          id: "8976072a-a21f-49a1-b09a-d743065df116",
          code: "LGDRDVVSEFWD4",
          pricePerCarat: "20000.00",
          rangeFrom: "0.017",
          rangeTo: "0.034",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:03.443Z",
    updatedAt: "2026-05-30T13:16:03.443Z",
    isDeleted: false,
  },
  {
    id: "ff566a96-4761-41ae-a927-252016ea4262",
    productCode: "SBRC679605",
    name: "Bracelets",
    category: "BRACELET",
    description: "Bracelet",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:44.209Z",
    netWeight: "16.194",
    grossWeight: "16.510",
    totalDiamondWeight: "1.580",
    totalStoneWeight: "1.580",
    notes: null,
    media: [
      {
        id: "c14a57f1-9249-4aaa-b879-076d44ab8373",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/6621e8e4-6b7c-473f-aafa-a04a22972fe3.jpg",
        altText: "Bracelets SBRC679605",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "9a3f36ab-ba99-4719-a999-c0b82c71db2b",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.390",
        totalPieces: 70,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "d7998fc5-71bb-4a46-bfad-e61e0f76d18d",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.380",
        totalPieces: 36,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "733496dd-4b49-4d71-b99b-64f12d635586",
        stoneSlabCode: "LGDRDVVSEFWD4",
        totalNetWeight: "0.810",
        totalPieces: 45,
        slab: {
          id: "8976072a-a21f-49a1-b09a-d743065df116",
          code: "LGDRDVVSEFWD4",
          pricePerCarat: "20000.00",
          rangeFrom: "0.017",
          rangeTo: "0.034",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:03.238Z",
    updatedAt: "2026-05-30T13:16:03.238Z",
    isDeleted: false,
  },
  {
    id: "a1f6fdc2-645e-4a15-80a3-1f1dded12bb6",
    productCode: "SRNG679607",
    name: "Ring",
    category: "RING",
    description: "Ring",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a001",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a001",
      name: "Banjara Hills",
      city: "Hyderabad",
      type: "STORE",
      notes: "Hyderabad Store in Banjara Hills, Road No 12",
    },
    sourceCreatedAt: "2026-05-29T22:17:04.405Z",
    netWeight: "4.136",
    grossWeight: "4.260",
    totalDiamondWeight: "0.620",
    totalStoneWeight: "0.620",
    notes: null,
    media: [
      {
        id: "3711ea74-52a3-480f-8743-7c40e058b9ac",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/4ee87c2c-f215-4850-8242-faea4708d817.jpg",
        altText: "Ring SRNG679607",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "1808b29e-0df9-4664-ad91-e5c48ab2cd04",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.020",
        totalPieces: 4,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "6dcf1e44-0584-42e2-ad64-dd9fe0f1703a",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.370",
        totalPieces: 35,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "e1d6cb4f-c7e8-44a8-b888-10d6755d9c8c",
        stoneSlabCode: "LGDRDVVSEFWD4",
        totalNetWeight: "0.230",
        totalPieces: 13,
        slab: {
          id: "8976072a-a21f-49a1-b09a-d743065df116",
          code: "LGDRDVVSEFWD4",
          pricePerCarat: "20000.00",
          rangeFrom: "0.017",
          rangeTo: "0.034",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:03.027Z",
    updatedAt: "2026-05-30T13:16:03.027Z",
    isDeleted: false,
  },
  {
    id: "4d75b8f3-a6ab-4d9e-9e59-b211abd47a7d",
    productCode: "SRNG679604",
    name: "Ring",
    category: "RING",
    description: "Ring",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:17:04.405Z",
    netWeight: "5.451",
    grossWeight: "5.565",
    totalDiamondWeight: "0.570",
    totalStoneWeight: "0.570",
    notes: null,
    media: [
      {
        id: "c97b6e79-3466-49c1-8c05-e756a25eecb2",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/44b40e10-f8e5-4aa1-b77e-156e316e0003.jpg",
        altText: "Ring SRNG679604",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "f05d151a-22cc-4822-9f16-b9f1c6685f80",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.140",
        totalPieces: 26,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "54bcbc91-5e48-4de2-b9a0-5d3abeb816bc",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.430",
        totalPieces: 40,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:02.800Z",
    updatedAt: "2026-05-30T13:16:02.800Z",
    isDeleted: false,
  },
  {
    id: "bfe872f7-5646-4997-95e6-623343b665a3",
    productCode: "SERN679603",
    name: "Earrings",
    category: "EARRING",
    description: "Earrings",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:50.886Z",
    netWeight: "7.078",
    grossWeight: "7.272",
    totalDiamondWeight: "0.970",
    totalStoneWeight: "0.970",
    notes: null,
    media: [
      {
        id: "c8f61a97-61fb-4e59-9ffb-6c726e6751be",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/3a9157da-66a5-4252-ae31-8e608faf378a.jpg",
        altText: "Earrings SERN679603",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "6b063122-4910-4363-a24d-e26ed7533323",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.120",
        totalPieces: 24,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "8d1ee208-455a-4a18-ab60-b226ea4b3129",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.630",
        totalPieces: 54,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "d4cade83-c6ef-4898-9ff7-666eba17e566",
        stoneSlabCode: "LGDRDVVSEFWD3",
        totalNetWeight: "0.220",
        totalPieces: 14,
        slab: {
          id: "1c88f38e-6c81-4a56-a3a3-4b414f5d9df8",
          code: "LGDRDVVSEFWD3",
          pricePerCarat: "20000.00",
          rangeFrom: "0.013",
          rangeTo: "0.017",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:02.579Z",
    updatedAt: "2026-05-30T13:16:02.579Z",
    isDeleted: false,
  },
  {
    id: "343b4abe-b576-44b1-9ff1-91de70e341b2",
    productCode: "SERN679606",
    name: "Earrings",
    category: "EARRING",
    description: "Earrings",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:50.886Z",
    netWeight: "6.668",
    grossWeight: "6.820",
    totalDiamondWeight: "0.760",
    totalStoneWeight: "0.760",
    notes: null,
    media: [
      {
        id: "c5f22f70-b36d-4e1b-a161-237f07a79ef8",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/1d1bbe05-a78d-40b9-a04c-606abdeaa9f2.jpg",
        altText: "Earrings SERN679606",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "ed8f6e32-f697-4d37-8f64-a44383358c63",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "0.210",
        totalPieces: 28,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "49d2fc4a-77d3-4bc5-a532-475849466830",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.310",
        totalPieces: 28,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "8cdfc604-8a4d-46d6-88ea-3c56dd73beea",
        stoneSlabCode: "LGDRDVVSEFWD4",
        totalNetWeight: "0.240",
        totalPieces: 14,
        slab: {
          id: "8976072a-a21f-49a1-b09a-d743065df116",
          code: "LGDRDVVSEFWD4",
          pricePerCarat: "20000.00",
          rangeFrom: "0.017",
          rangeTo: "0.034",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:02.388Z",
    updatedAt: "2026-05-30T13:16:02.388Z",
    isDeleted: false,
  },
  {
    id: "c2214d14-2613-4f18-b581-329609fbe508",
    productCode: "SERN679602",
    name: "Earrings",
    category: "EARRING",
    description: "Earrings",
    vendor: "FINESSE JEWELS PRIVATE LIMITED",
    color: "ROSE",
    purity: 14,
    size: null,
    isCustomerProduct: false,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:50.886Z",
    netWeight: "10.110",
    grossWeight: "10.646",
    totalDiamondWeight: "2.680",
    totalStoneWeight: "2.680",
    notes: null,
    media: [
      {
        id: "d1898aa2-2779-4ca4-acdf-12a115603422",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/131dd1a1-4009-4aca-8d93-8468dd1f0f7a.jpg",
        altText: "Earrings SERN679602",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "d9a6c752-c0e9-41b4-816d-695f8dbf7195",
        stoneSlabCode: "LGDRDVVSEFWD1",
        totalNetWeight: "1.330",
        totalPieces: 280,
        slab: {
          id: "02f120cc-ce8d-42b6-8e19-b6d49e50866e",
          code: "LGDRDVVSEFWD1",
          pricePerCarat: "25000.00",
          rangeFrom: "0.000",
          rangeTo: "0.009",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "aead15a5-0956-4ae7-b779-5b780a54f8e6",
        stoneSlabCode: "LGDRDVVSEFWD2",
        totalNetWeight: "0.620",
        totalPieces: 58,
        slab: {
          id: "3b6de727-f0b1-4c72-8ab0-450ff8ea72ef",
          code: "LGDRDVVSEFWD2",
          pricePerCarat: "25000.00",
          rangeFrom: "0.009",
          rangeTo: "0.013",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
      {
        id: "5681526a-bdac-4b5f-9447-149be4fa5963",
        stoneSlabCode: "LGDRDVVSEFWD4",
        totalNetWeight: "0.730",
        totalPieces: 42,
        slab: {
          id: "8976072a-a21f-49a1-b09a-d743065df116",
          code: "LGDRDVVSEFWD4",
          pricePerCarat: "20000.00",
          rangeFrom: "0.017",
          rangeTo: "0.034",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:02.131Z",
    updatedAt: "2026-05-30T13:16:02.131Z",
    isDeleted: false,
  },
  {
    id: "b1c68627-e482-4b18-a2d4-b270b1861f1b",
    productCode: "CBRC647635",
    name: "Bracelets",
    category: "BRACELET",
    description: "Bracelet",
    vendor: "DB PAHLAJANI VENTURES LLP",
    color: "YELLOW",
    purity: 18,
    size: null,
    isCustomerProduct: true,
    locationId: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
    location: {
      id: "c7a0a4c7-74c8-4f5a-9c33-c2d2c0d5a002",
      name: "ITC Gardenia",
      city: "Bangalore",
      type: "STORE",
      notes:
        "Store in Bangalore at ITC Gardenia, Vittal Mallaya Road, Ashok Nagar",
    },
    sourceCreatedAt: "2026-05-29T22:16:40.736Z",
    netWeight: "21.256",
    grossWeight: "26.500",
    totalDiamondWeight: "26.220",
    totalStoneWeight: "26.220",
    notes: null,
    media: [
      {
        id: "d9b7222a-a3ff-4e93-a15c-280f9a9c95d8",
        mediaType: "IMAGE",
        storageKey: "https://files.synergicserp.com/PML/IMAGES/0ad3315c-f8e5-4308-89b3-303e0e597b05.jpg",
        altText: "Bracelets CBRC647635",
        sortOrder: 0,
        isPrimary: true,
      },
    ],
    stones: [
      {
        id: "ce846cba-1173-4932-a7be-ceee10e8e072",
        stoneSlabCode: "LGDRDVVSEFS10",
        totalNetWeight: "26.220",
        totalPieces: 25,
        slab: {
          id: "f7bdca34-6b95-4e63-a041-616b322e9978",
          code: "LGDRDVVSEFS10",
          pricePerCarat: "44000.00",
          rangeFrom: "1.000",
          rangeTo: "1.100",
          notes: null,
          stoneType: {
            id: "2e459be2-1e2b-483f-a8bd-31b8e95291a4",
            name: "Round",
            category: "Diamond",
            clarity: "VVS/EF",
            color: null,
          },
        },
      },
    ],
    createdAt: "2026-05-30T13:16:01.739Z",
    updatedAt: "2026-05-30T13:16:01.739Z",
    isDeleted: false,
  },
];
