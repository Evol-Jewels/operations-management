export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  location?: string;
  category: "VIP" | "Middle" | "Lower";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockCustomers: Customer[] = [
  {
    id: "cust-001",
    phone: "+919820011234",
    name: "Priya Mehta",
    email: "priya.mehta@gmail.com",
    location: "14, Juhu Scheme, Mumbai 400049",
    category: "VIP",
    notes: "Prefers yellow gold, allergic to nickel. Very detail-oriented.",
    createdAt: "2025-08-15T10:00:00.000Z",
    updatedAt: "2026-01-20T14:30:00.000Z",
  },
  {
    id: "cust-002",
    phone: "+919987055678",
    name: "Arjun Kapoor",
    email: "arjun.kapoor@outlook.com",
    location: "8, Bandra West, Mumbai 400050",
    category: "Middle",
    notes:
      "Looking for anniversary gift. Budget-conscious but quality matters.",
    createdAt: "2025-11-10T09:00:00.000Z",
    updatedAt: "2025-12-05T11:00:00.000Z",
  },
  {
    id: "cust-003",
    phone: "+919123477890",
    name: "Deepa Nair",
    location: "Kochi, Kerala",
    category: "VIP",
    notes: "Bridal collection buyer. Prefers traditional designs.",
    createdAt: "2024-06-20T10:00:00.000Z",
    updatedAt: "2025-12-01T16:00:00.000Z",
  },
  {
    id: "cust-004",
    phone: "+918800144321",
    name: "Rahul Singhania",
    email: "rahul.s@techcorp.in",
    location: "Gurgaon, Haryana",
    category: "Middle",
    notes: "Gift buyer. Often last-minute decisions.",
    createdAt: "2025-09-25T14:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "cust-005",
    phone: "+919765432100",
    name: "Sunita Bose",
    email: "sunita.bose@yahoo.com",
    location: "Kolkata",
    category: "Lower",
    notes: "First-time buyer. Needs guidance on gemstone quality.",
    createdAt: "2026-01-10T11:00:00.000Z",
    updatedAt: "2026-01-10T11:00:00.000Z",
  },
  {
    id: "cust-006",
    phone: "+917000099887",
    name: "Vijay Tiwari",
    location: "Delhi",
    category: "Middle",
    notes: "Repeat buyer. trusts our recommendations.",
    createdAt: "2025-07-05T10:00:00.000Z",
    updatedAt: "2025-11-20T15:00:00.000Z",
  },
  {
    id: "cust-007",
    phone: "+919810077654",
    name: "Kavita Sharma",
    email: "kavita.s@gmail.com",
    location: "Pune, Maharashtra",
    category: "VIP",
    notes: "Loves antique designs. Brought sister for brooch too.",
    createdAt: "2025-04-12T10:00:00.000Z",
    updatedAt: "2025-12-10T14:00:00.000Z",
  },
  {
    id: "cust-008",
    phone: "+919450066123",
    name: "Meera Pillai",
    email: "meera.pillai@gmail.com",
    location: "Trivandrum, Kerala",
    category: "Middle",
    notes: "Traditional gold lover. Wedding gift shopping.",
    createdAt: "2025-12-20T10:00:00.000Z",
    updatedAt: "2026-02-15T09:00:00.000Z",
  },
];

export function getCustomerByPhone(phone: string): Customer | undefined {
  const normalized = phone.replace(/\D/g, "");
  return mockCustomers.find((c) => {
    const storedNormalized = c.phone.replace(/\D/g, "");
    return storedNormalized === normalized;
  });
}
