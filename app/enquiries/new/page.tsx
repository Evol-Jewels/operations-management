"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  Plus,
  X,
  Phone,
  User,
  Link2,
  ImageIcon,
  Video,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput, validatePhone } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { getCustomerByPhone } from "@/lib/mock-customers";
import { formatCurrency, searchProducts, type Product } from "@/lib/mock-products";
import { saveEnquiryMedia } from "@/lib/storage/enquiry-media";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { authClient } from "@/lib/auth-client";
import type {
  CustomerCategory,
  EnquiryReference,
  JewelleryCategory,
  MetalPurity,
  MetalType,
  Order,
} from "@/types";

const CATEGORIES: JewelleryCategory[] = [
  "Ring",
  "Necklace",
  "Bracelet",
  "Earrings",
  "Bangle",
  "Pendant",
  "Chain",
  "Brooch",
  "Other",
];

const METAL_TYPES: MetalType[] = [
  "Gold",
  "White Gold",
  "Rose Gold",
  "Silver",
  "Platinum",
];

const METAL_PURITIES: MetalPurity[] = [
  "14K",
  "18K",
  "22K",
  "24K",
  "Other",
];

const STONE_CUTS = [
  "Round Brilliant",
  "Princess",
  "Oval",
  "Cushion",
  "Emerald Cut",
  "Pear",
  "Marquise",
  "Radiant",
  "Asscher",
  "Polki",
  "Cabochon",
  "Rose Cut",
  "Uncut",
  "Other",
];

const STONE_QUALITIES = [
  "AAA Grade",
  "VVS",
  "VS1",
  "VS2",
  "SI1",
  "SI2",
  "Eye-clean",
  "Good",
  "Commercial",
];

const POLISH_OPTIONS = [
  "High polish",
  "Matte",
  "Satin",
  "Hammered",
  "Brushed",
  "Antique finish",
];

const INTEREST_LEVELS = ["Low", "Average", "High"];

type EnquiryMode = "store_visit" | "online";

const STORE_VISIT_LOCATIONS = [
  "Hyderabad - Banjara Hills",
  "Bangalore - ITC Gardenia",
] as const;

const VISIT_HOURS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const VISIT_MINUTES = ["00", "15", "30", "45"] as const;
const VISIT_PERIODS = ["AM", "PM"] as const;

interface CustomerDetails {
  isExisting: boolean;
  phone: string;
  name: string;
  dob: string;
  city: string;
  address: string;
  email: string;
  category: CustomerCategory;
  notes: string;
  enquiryMode: EnquiryMode | "";
  visitCity: string;
  visitTime: string;
}

interface NewProduct {
  id: string;
  category: string;
  metalType: string;
  metalPurity: string;
  polish: string;
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratEstimate: string;
  references: ProductReference[];
  notes: string;
  interestLevel: string;
}

type ProductReferenceType = "link" | "image" | "video";

interface ProductReference {
  id: string;
  type: ProductReferenceType;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
  file?: File;
}

interface EnquiryFormData {
  customer: CustomerDetails;
  selectedProducts: Product[];
  newProducts: NewProduct[];
}

const EMPTY_CUSTOMER: CustomerDetails = {
  isExisting: false,
  phone: "",
  name: "",
  dob: "",
  city: "",
  address: "",
  email: "",
  category: "Middle",
  notes: "",
  enquiryMode: "",
  visitCity: "",
  visitTime: "",
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function generateEnquiryId() {
  return `enq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyNewProduct(): NewProduct {
  return {
    id: "",
    category: "",
    metalType: "",
    metalPurity: "",
    polish: "",
    stoneDescription: "",
    stoneCut: "",
    stoneQuality: "",
    stoneCaratEstimate: "",
    references: [],
    notes: "",
    interestLevel: "",
  };
}

function normalizeReferenceLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidReferenceLink(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatFileSize(size?: number): string {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function revokeObjectUrls(references: ProductReference[]) {
  for (const reference of references) {
    if (reference.type !== "link") {
      URL.revokeObjectURL(reference.url);
    }
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Ring: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    Necklace:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Bracelet:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    Earrings: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    Bangle:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    Pendant: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Chain: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    Brooch: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  };
  return (
    colors[category] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  );
}

function formatMetalTypeLabel(metalType: string): string {
  return metalType === "Gold" ? "Yellow Gold" : metalType;
}

function ProductThumbnail({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "h-10 w-10 text-xs" : size === "lg" ? "w-full aspect-[4/3] text-sm" : "h-12 w-12 text-sm";

  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={product.name}
        className={`${sizeClass} flex-shrink-0 rounded-lg border border-border/60 bg-muted object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} flex-shrink-0 items-center justify-center rounded-lg font-bold ${getCategoryColor(
        product.category,
      )}`}
    >
      {product.productCode.slice(0, 4)}
    </div>
  );
}

function validateStep1(data: CustomerDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.enquiryMode) {
    errors.enquiryMode = "Select store visit or online enquiry";
  }
  if (data.enquiryMode === "store_visit" && !data.visitCity.trim()) {
    errors.visitCity = "City is required for store visits";
  }
  if (data.enquiryMode === "store_visit" && !data.visitTime) {
    errors.visitTime = "Visit date and time is required";
  }
  if (!data.category) errors.category = "Select a customer category";
  return errors;
}

function validateStep2(data: EnquiryFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.selectedProducts.length === 0 && data.newProducts.length === 0) {
    errors.products = "Select or add at least one product";
  }
  return errors;
}

function getEnquiryModeLabel(mode: EnquiryMode | ""): string {
  if (mode === "store_visit") return "Store Visit";
  if (mode === "online") return "Online Enquiry";
  return "";
}

function parseVisitDateTime(value: string): {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!value) {
    return {
      date: "",
      hour: "10",
      minute: "00",
      period: "AM",
    };
  }

  const [date, time = "10:00"] = value.split("T");
  const [rawHour = "10", minute = "00"] = time.split(":");
  const hour24 = Number(rawHour);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const normalizedHour = hour24 % 12 || 12;

  return {
    date,
    hour: String(normalizedHour).padStart(2, "0"),
    minute,
    period,
  };
}

function buildVisitDateTime(
  date: string,
  hour: string,
  minute: string,
  period: "AM" | "PM",
): string {
  if (!date) return "";

  const normalizedHour = Number(hour) % 12;
  const hour24 =
    period === "PM" ? normalizedHour + 12 : normalizedHour === 12 ? 0 : normalizedHour;

  return `${date}T${String(hour24).padStart(2, "0")}:${minute}`;
}

function formatVisitDateTime(value: string): string {
  if (!value) return "";

  const { date, hour, minute, period } = parseVisitDateTime(value);
  if (!date) return "";

  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${hour}:${minute} ${period}`;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function NewEnquiryPage() {
  return (
    <RequireInternalAuth>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <EnquiryForm />
      </Suspense>
    </RequireInternalAuth>
  );
}

function EnquiryForm() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const addEnquiry = useOrdersStore((state) => state.addEnquiry);
  const [showPhoneEntry, setShowPhoneEntry] = useState(true);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EnquiryFormData>({
    customer: { ...EMPTY_CUSTOMER },
    selectedProducts: [],
    newProducts: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductDraft, setNewProductDraft] =
    useState<NewProduct>(createEmptyNewProduct);
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const salespersonName = session?.user?.name || "Sales Team";
  const searchInputRef = useRef<HTMLInputElement>(null);
  const visitDateTime = parseVisitDateTime(form.customer.visitTime);
  const maxSelectableDate = getTodayDateString();

  useEffect(() => {
    if (productSearch.trim()) {
      setSearchResults(searchProducts(productSearch));
    } else {
      setSearchResults([]);
    }
  }, [productSearch]);

  useEffect(() => {
    return () => {
      revokeObjectUrls(newProductDraft.references);
      for (const product of form.newProducts) {
        revokeObjectUrls(product.references);
      }
    };
  }, [newProductDraft.references, form.newProducts]);

  function handlePhoneLookup() {
    const phone = form.customer.phone;
    const err = validatePhone(phone);

    if (err || !isPhoneValid) {
      setErrors({ phone: err || "Enter a valid phone number" });
      return;
    }

    const customer = getCustomerByPhone(phone);
    if (customer) {
      setForm((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          isExisting: true,
          name: customer.name,
          city: customer.location || "",
          address: "",
          email: customer.email || "",
          category: customer.category,
          notes: customer.notes || "",
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          isExisting: false,
          name: "",
          city: "",
          address: "",
          email: "",
          category: "Middle",
          notes: "",
          enquiryMode: "",
          visitCity: "",
          visitTime: "",
        },
      }));
    }
    setErrors({});
    setShowPhoneEntry(false);
    setStep(1);
  }

  function handleNext() {
    const errs = validateStep1(form.customer);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document
        .getElementById(firstKey)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setStep(2);
  }

  function handleBack() {
    if (step === 1) {
      setShowPhoneEntry(true);
    } else {
      setStep(step - 1);
    }
  }

  async function persistReference(
    reference: ProductReference,
    enquiryId: string,
    productId: string,
  ): Promise<EnquiryReference> {
    if (reference.type === "link") {
      return {
        id: reference.id,
        type: reference.type,
        name: reference.name,
        url: reference.url,
      };
    }

    if (!reference.file) {
      throw new Error(`Missing file data for ${reference.name}`);
    }

    const savedMedia = await saveEnquiryMedia({
      enquiryId,
      productId,
      file: reference.file,
      type: reference.type,
    });

    return {
      id: reference.id,
      type: reference.type,
      name: reference.name,
      mediaId: savedMedia.id,
      mimeType: savedMedia.mimeType,
      size: savedMedia.size,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateStep2(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document
        .getElementById(firstKey)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const enquiryId = generateEnquiryId();
      const createdAt = new Date().toISOString();
      const primarySelectedProduct = form.selectedProducts[0];
      const primaryCustomProduct = form.newProducts[0];
      const customProducts = await Promise.all(
        form.newProducts.map(async (product) => ({
          id: product.id,
          category: product.category || "Other",
          metalType: product.metalType,
          metalPurity: product.metalPurity || "Other",
          polish: product.polish,
          stoneDescription: product.stoneDescription,
          stoneCut: product.stoneCut,
          stoneQuality: product.stoneQuality,
          stoneCaratEstimate: product.stoneCaratEstimate
            ? Number(product.stoneCaratEstimate)
            : undefined,
          references: await Promise.all(
            product.references.map((reference) =>
              persistReference(reference, enquiryId, product.id),
            ),
          ),
        })),
      );

      const summaryBits = [
        form.customer.enquiryMode
          ? `Enquiry type: ${getEnquiryModeLabel(form.customer.enquiryMode)}.`
          : null,
        form.customer.enquiryMode === "store_visit"
          ? `Store visit scheduled for ${form.customer.visitCity.trim()} on ${formatVisitDateTime(form.customer.visitTime)}.`
          : null,
        primarySelectedProduct
          ? `Interested in ${primarySelectedProduct.name} (${primarySelectedProduct.productCode}).`
          : null,
        customProducts.length > 0
          ? `${customProducts.length} custom product requirement${customProducts.length > 1 ? "s" : ""} added.`
          : null,
        form.customer.notes.trim()
          ? `Customer notes: ${form.customer.notes.trim()}`
          : null,
      ].filter(Boolean);

      const customerLocation = [form.customer.city.trim(), form.customer.address.trim()]
        .filter(Boolean)
        .join(", ");

      const enquiryRecord: Order = {
        id: enquiryId,
        type: "enquiry",
        shareableToken: `enq-${slugify(form.customer.name)}-${Date.now()}`,
        customerName: form.customer.name.trim(),
        customerPhone: form.customer.phone.trim() || undefined,
        customerEmail: form.customer.email.trim() || undefined,
        customerDob: form.customer.dob || undefined,
        customerLocation: customerLocation || undefined,
        customerCategory: form.customer.category,
        customerNotes: form.customer.notes.trim() || undefined,
        salespersonName,
        category:
          primarySelectedProduct?.category ??
          (primaryCustomProduct?.category as JewelleryCategory | undefined) ??
          "Other",
        metalType:
          primarySelectedProduct?.metalType ??
          (primaryCustomProduct?.metalType as MetalType | undefined) ??
          "Gold",
        metalPurity:
          primarySelectedProduct?.metalPurity ??
          (primaryCustomProduct?.metalPurity as MetalPurity | undefined) ??
          "Other",
        polish: primaryCustomProduct?.polish || undefined,
        stoneDescription:
          primaryCustomProduct?.stoneDescription ||
          primarySelectedProduct?.description ||
          undefined,
        stoneCut: primaryCustomProduct?.stoneCut || undefined,
        stoneQuality: primaryCustomProduct?.stoneQuality || undefined,
        stoneCaratEstimate: primaryCustomProduct?.stoneCaratEstimate
          ? Number(primaryCustomProduct.stoneCaratEstimate)
          : undefined,
        certification: "None",
        cadDesignRequired: false,
        currentStage: "Enquiry",
        createdAt,
        lastUpdatedAt: createdAt,
        activityFeed: [
          {
            id: `act-${Date.now()}-enquiry-created`,
            orderId: enquiryId,
            postedBy: salespersonName,
            actorRole: "sales",
            timestamp: createdAt,
            type: "order_created",
            note: summaryBits.join(" "),
          },
        ],
        selectedProducts: form.selectedProducts.map((product) => ({ ...product })),
        customProducts,
      };

      addEnquiry(enquiryRecord);
      setSubmitted(true);
      setTimeout(() => router.push("/"), 2200);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save the enquiry. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function addProduct(product: Product) {
    if (!form.selectedProducts.find((p) => p.id === product.id)) {
      setForm((prev) => ({
        ...prev,
        selectedProducts: [...prev.selectedProducts, product],
      }));
    }
    setProductSearch("");
    setSearchResults([]);
  }

  function removeSelectedProduct(productId: string) {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((p) => p.id !== productId),
    }));
  }

  function addNewProduct() {
    if (!newProductDraft.metalType) return;
    setForm((prev) => ({
      ...prev,
      newProducts: [
        ...prev.newProducts,
        { ...newProductDraft, id: generateId() },
      ],
    }));
    setNewProductDraft(createEmptyNewProduct());
    setReferenceLinkInput("");
    setReferenceError("");
    setShowNewProductForm(false);
  }

  function removeNewProduct(id: string) {
    setForm((prev) => {
      const productToRemove = prev.newProducts.find((p) => p.id === id);
      if (productToRemove) {
        revokeObjectUrls(productToRemove.references);
      }

      return {
        ...prev,
        newProducts: prev.newProducts.filter((p) => p.id !== id),
      };
    });
  }

  function addReferenceLink() {
    const normalized = normalizeReferenceLink(referenceLinkInput);
    if (!normalized) return;
    if (!isValidReferenceLink(normalized)) {
      setReferenceError("Enter a valid product or inspiration link");
      return;
    }

    setNewProductDraft((prev) => ({
      ...prev,
      references: [
        ...prev.references,
        {
          id: generateId(),
          type: "link",
          url: normalized,
          name: normalized,
        },
      ],
    }));
    setReferenceLinkInput("");
    setReferenceError("");
  }

  function addReferenceFiles(files: FileList | null) {
    if (!files?.length) return;

    const nextReferences: ProductReference[] = [];

    for (const file of Array.from(files)) {
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : null;

      if (!type) {
        setReferenceError("Only image and video files are supported");
        continue;
      }

      nextReferences.push({
        id: generateId(),
        type,
        url: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
        file,
      });
    }

    if (!nextReferences.length) return;

    setNewProductDraft((prev) => ({
      ...prev,
      references: [...prev.references, ...nextReferences],
    }));
    setReferenceError("");
  }

  function removeDraftReference(referenceId: string) {
    setNewProductDraft((prev) => {
      const reference = prev.references.find((item) => item.id === referenceId);
      if (reference && reference.type !== "link") {
        URL.revokeObjectURL(reference.url);
      }

      return {
        ...prev,
        references: prev.references.filter((item) => item.id !== referenceId),
      };
    });
  }

  function getReferenceIcon(type: ProductReferenceType) {
    if (type === "image") return <ImageIcon className="h-4 w-4" />;
    if (type === "video") return <Video className="h-4 w-4" />;
    return <Link2 className="h-4 w-4" />;
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 py-28 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Enquiry captured
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.customer.name}&apos;s enquiry has been added to the tracker.
            Redirecting you back…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-0">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-2 gap-1.5 text-muted-foreground"
        >
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      {showPhoneEntry ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              New Enquiry
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter phone number to continue
            </p>
          </div>

          <div className="flex w-full max-w-sm flex-col gap-4">
            <PhoneInput
              value={form.customer.phone}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  customer: { ...prev.customer, phone: value },
                }))
              }
              onValidityChange={setIsPhoneValid}
              error={errors.phone}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePhoneLookup();
                }
              }}
            />

            <Button
              type="button"
              onClick={handlePhoneLookup}
              disabled={!form.customer.phone.trim() || !isPhoneValid}
              className="w-full"
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <div className="h-px flex-1 bg-border" />
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 1 ? "Customer Details" : "Product Interest"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 1
                ? "Fill in customer details"
                : "Select products or add custom requirements"}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-8">
              <FormSection
                title="Customer"
                description="Fill in customer details"
              >
                {form.customer.isExisting && (
                  <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-200 p-3 dark:bg-amber-950/20 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <span className="font-medium">
                        Existing customer found
                      </span>{" "}
                      — You can edit details below.
                    </p>
                  </div>
                )}

                <div className="sm:col-span-2 text-sm text-muted-foreground">
                  Phone: {form.customer.phone}
                </div>

                <div id="enquiryMode" className="sm:col-span-2 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <label className="text-xs font-medium text-foreground/80">
                      Enquiry type
                      <span className="ml-0.5 text-destructive">*</span>
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={
                        form.customer.enquiryMode === "store_visit"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          customer: {
                            ...prev.customer,
                            enquiryMode: "store_visit",
                          },
                        }))
                      }
                      className="h-10 justify-center"
                    >
                      Store Visit
                    </Button>
                    <Button
                      type="button"
                      variant={
                        form.customer.enquiryMode === "online"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          customer: {
                            ...prev.customer,
                            enquiryMode: "online",
                            visitCity: "",
                            visitTime: "",
                          },
                        }))
                      }
                      className="h-10 justify-center"
                    >
                      Online Enquiry
                    </Button>
                  </div>
                  {errors.enquiryMode && (
                    <p className="text-[11px] text-destructive">
                      {errors.enquiryMode}
                    </p>
                  )}
                </div>

                {form.customer.enquiryMode === "store_visit" && (
                  <>
                    <FormField
                      label="Visit city"
                      htmlFor="visitCity"
                      required
                      error={errors.visitCity}
                    >
                      <Select
                        value={form.customer.visitCity}
                        onValueChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            customer: {
                              ...prev.customer,
                              visitCity: value,
                            },
                          }))
                        }
                      >
                        <SelectTrigger id="visitCity" className="h-10 w-full text-sm">
                          <SelectValue placeholder="Select store location" />
                        </SelectTrigger>
                        <SelectContent>
                          {STORE_VISIT_LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField
                      label="Visit date and time"
                      htmlFor="visitTime"
                      required
                      error={errors.visitTime}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="visitTime"
                            type="button"
                            variant="outline"
                            className="h-10 w-full justify-between px-3 font-normal"
                          >
                            <span className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              {form.customer.visitTime ? (
                                formatVisitDateTime(form.customer.visitTime)
                              ) : (
                                <span className="text-muted-foreground">
                                  Select visit date and time
                                </span>
                              )}
                            </span>
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-[340px] space-y-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Visit schedule</p>
                            <p className="text-xs text-muted-foreground">
                              Choose the date and a clean time slot.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="visitDate"
                              className="text-xs font-medium text-foreground/80"
                            >
                              Visit date
                            </label>
                            <Input
                              id="visitDate"
                              type="date"
                              max={maxSelectableDate}
                              value={visitDateTime.date}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  customer: {
                                    ...prev.customer,
                                    visitTime: buildVisitDateTime(
                                      e.target.value,
                                      visitDateTime.hour,
                                      visitDateTime.minute,
                                      visitDateTime.period,
                                    ),
                                  },
                                }))
                              }
                              className="h-10"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <label className="text-xs font-medium text-foreground/80">
                                Hour
                              </label>
                              <Select
                                value={visitDateTime.hour}
                                onValueChange={(value) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    customer: {
                                      ...prev.customer,
                                      visitTime: buildVisitDateTime(
                                        visitDateTime.date,
                                        value,
                                        visitDateTime.minute,
                                        visitDateTime.period,
                                      ),
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-10 w-full text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VISIT_HOURS.map((hour) => (
                                    <SelectItem key={hour} value={hour}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-foreground/80">
                                Minute
                              </label>
                              <Select
                                value={visitDateTime.minute}
                                onValueChange={(value) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    customer: {
                                      ...prev.customer,
                                      visitTime: buildVisitDateTime(
                                        visitDateTime.date,
                                        visitDateTime.hour,
                                        value,
                                        visitDateTime.period,
                                      ),
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-10 w-full text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VISIT_MINUTES.map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-medium text-foreground/80">
                                Period
                              </label>
                              <Select
                                value={visitDateTime.period}
                                onValueChange={(value) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    customer: {
                                      ...prev.customer,
                                      visitTime: buildVisitDateTime(
                                        visitDateTime.date,
                                        visitDateTime.hour,
                                        visitDateTime.minute,
                                        value as "AM" | "PM",
                                      ),
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger className="h-10 w-full text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VISIT_PERIODS.map((period) => (
                                    <SelectItem key={period} value={period}>
                                      {period}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </FormField>
                  </>
                )}

                <FormField
                  label="Full name"
                  htmlFor="name"
                  required
                  error={errors.name}
                >
                  <Input
                    id="name"
                    placeholder="e.g. Priya Mehta"
                    value={form.customer.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, name: e.target.value },
                      }))
                    }
                    className="h-10"
                  />
                </FormField>

                <FormField label="Date of birth" htmlFor="dob" optional>
                  <Input
                    id="dob"
                    type="date"
                    max={maxSelectableDate}
                    value={form.customer.dob}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, dob: e.target.value },
                      }))
                    }
                    className="h-10"
                  />
                </FormField>

                <FormField
                  label="City"
                  htmlFor="city"
                  optional
                >
                  <Input
                    id="city"
                    placeholder="e.g. Hyderabad"
                    value={form.customer.city}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          city: e.target.value,
                        },
                      }))
                    }
                    className="h-10"
                  />
                </FormField>

                <FormField
                  label="Address"
                  htmlFor="address"
                  optional
                >
                  <Input
                    id="address"
                    placeholder="e.g. Road no. 12, Banjara Hills"
                    value={form.customer.address}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          address: e.target.value,
                        },
                      }))
                    }
                    className="h-10"
                  />
                </FormField>

                <FormField label="Email address" htmlFor="email" optional>
                  <Input
                    id="email"
                    type="email"
                    placeholder="priya@example.com"
                    value={form.customer.email}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, email: e.target.value },
                      }))
                    }
                    className="h-10"
                  />
                </FormField>

                <FormField
                  label="Category"
                  htmlFor="category"
                  required
                  error={errors.category}
                >
                  <Select
                    value={form.customer.category}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          category: v as CustomerCategory,
                        },
                      }))
                    }
                  >
                    <SelectTrigger id="category" className="h-10 w-full text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Middle">Middle</SelectItem>
                      <SelectItem value="Lower">Lower</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label="Notes"
                  htmlFor="notes"
                  optional
                  className="sm:col-span-2"
                  hint="Add any customer preferences, behaviour notes"
                >
                  <Textarea
                    id="notes"
                    placeholder="e.g. Prefers yellow gold, allergic to nickel..."
                    value={form.customer.notes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: { ...prev.customer, notes: e.target.value },
                      }))
                    }
                    rows={3}
                    className="resize-none text-sm"
                  />
                </FormField>
              </FormSection>

              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPhoneEntry(true)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Phone
                </Button>
                <Button type="button" onClick={handleNext} className="px-6">
                  Continue to Products
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{form.customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {form.customer.phone}
                </p>
                {form.customer.enquiryMode && (
                  <p className="text-xs text-muted-foreground">
                    {getEnquiryModeLabel(form.customer.enquiryMode)}
                    {form.customer.enquiryMode === "store_visit" &&
                    form.customer.visitCity
                      ? ` · ${form.customer.visitCity}`
                      : ""}
                    {form.customer.enquiryMode === "store_visit" &&
                    form.customer.visitTime
                      ? ` · ${formatVisitDateTime(form.customer.visitTime)}`
                      : ""}
                  </p>
                )}
              </div>
            </div>
          </div>



          <FormSection
            title="Existing Products"
            description="Search by product code (e.g., SRNG679604)"
          >
            <div className="sm:col-span-2 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by code..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-10 pl-10"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border bg-background shadow-xl">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/80 transition-colors"
                      >
                        <div className="w-[40%] shrink-0">
                          <ProductThumbnail product={product} size="lg" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="truncate text-sm font-semibold">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.productCode} · {formatMetalTypeLabel(product.metalType)}{" "}
                            {product.metalPurity}
                          </p>
                          {product.basePrice && (
                            <p className="mt-1 text-sm font-medium text-primary">
                              {formatCurrency(product.basePrice)}
                            </p>
                          )}
                        </div>
                        <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewProductForm(true)}
                  className="h-10 whitespace-nowrap gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Customer Product
                </Button>
              </div>

            {form.selectedProducts.length > 0 && (
              <div className="sm:col-span-2 space-y-2">
                {form.selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <ProductThumbnail product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.productCode} · {formatMetalTypeLabel(product.metalType)}{" "}
                        {product.metalPurity}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedProduct(product.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </FormSection>

          <FormSection
            title="Custom Product"
            description="Add custom metal and stone preferences"
          >
            <div className="sm:col-span-2">
              {!showNewProductForm ? (
                <div></div>
              ) : (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Category" optional>
                      <Select
                        value={newProductDraft.category}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            category: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Metal type" required>
                      <Select
                        value={newProductDraft.metalType}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            metalType: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select metal" />
                        </SelectTrigger>
                        <SelectContent>
                          {METAL_TYPES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Metal purity" optional>
                      <Select
                        value={newProductDraft.metalPurity}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            metalPurity: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select purity" />
                        </SelectTrigger>
                        <SelectContent>
                          {METAL_PURITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Polish / finish" optional>
                      <Select
                        value={newProductDraft.polish}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({ ...prev, polish: v }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select polish" />
                        </SelectTrigger>
                        <SelectContent>
                          {POLISH_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <FormField
                    label="Stone description"
                    htmlFor="stoneDescription"
                    optional
                    className="sm:col-span-2"
                  >
                    <Input
                      id="stoneDescription"
                      placeholder="e.g. Natural Diamonds, Blue Sapphire"
                      value={newProductDraft.stoneDescription}
                      onChange={(e) =>
                        setNewProductDraft((prev) => ({
                          ...prev,
                          stoneDescription: e.target.value,
                        }))
                      }
                      className="h-9 w-full"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Stone cut" optional>
                      <Select
                        value={newProductDraft.stoneCut}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            stoneCut: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select cut" />
                        </SelectTrigger>
                        <SelectContent>
                          {STONE_CUTS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Stone quality" optional>
                      <Select
                        value={newProductDraft.stoneQuality}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            stoneQuality: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {STONE_QUALITIES.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <FormField label="Carat estimate" optional>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.50"
                      value={newProductDraft.stoneCaratEstimate}
                      onChange={(e) =>
                        setNewProductDraft((prev) => ({
                          ...prev,
                          stoneCaratEstimate: e.target.value,
                        }))
                      }
                      className="h-9 w-full"
                    />
                  </FormField>

                  <FormField
                    label="References"
                    optional
                    className="sm:col-span-2"
                  >
                    <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-3">
                      <div className="flex flex-wrap gap-2">
                        <Input
                          placeholder="Paste a product, Pinterest, Instagram, or drive link"
                          value={referenceLinkInput}
                          onChange={(e) => {
                            setReferenceLinkInput(e.target.value);
                            if (referenceError) setReferenceError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addReferenceLink();
                            }
                          }}
                          className="h-9 flex-1 min-w-[200px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addReferenceLink}
                          className="gap-2"
                        >
                          <Link2 className="h-4 w-4" />
                          Add Link
                        </Button>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/40">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Upload className="h-4 w-4" />
                            <span>Upload</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              addReferenceFiles(e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>

                      {newProductDraft.references.length > 0 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {newProductDraft.references.map((reference) => (
                            <div
                              key={reference.id}
                              className="overflow-hidden rounded-xl border bg-background"
                            >
                              {reference.type === "image" ? (
                                <img
                                  src={reference.url}
                                  alt={reference.name}
                                  className="h-32 w-full object-cover"
                                />
                              ) : reference.type === "video" ? (
                                <video
                                  src={reference.url}
                                  controls
                                  className="h-32 w-full bg-black object-cover"
                                />
                              ) : null}

                              <div className="flex items-start justify-between gap-3 p-3">
                                <div className="min-w-0 space-y-1">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    {getReferenceIcon(reference.type)}
                                    <span className="truncate">
                                      {reference.type === "link"
                                        ? "Reference Link"
                                        : reference.name}
                                    </span>
                                  </div>
                                  {reference.type === "link" ? (
                                    <a
                                      href={reference.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block truncate text-xs text-primary hover:underline"
                                    >
                                      {reference.url}
                                    </a>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      {[reference.mimeType, formatFileSize(reference.size)]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeDraftReference(reference.id)
                                  }
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {referenceError && (
                        <p className="text-sm text-destructive">
                          {referenceError}
                        </p>
                      )}
                    </div>
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Notes" optional>
                      <Textarea
                        placeholder="Any notes about the enquiry or design..."
                        value={newProductDraft.notes}
                        onChange={(e) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="min-h-[80px] w-full"
                      />
                    </FormField>

                    <FormField label="Interest level" optional>
                      <Select
                        value={newProductDraft.interestLevel}
                        onValueChange={(v) =>
                          setNewProductDraft((prev) => ({
                            ...prev,
                            interestLevel: v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 w-full text-sm">
                          <SelectValue placeholder="Select interest" />
                        </SelectTrigger>
                        <SelectContent>
                          {INTEREST_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={addNewProduct}
                      disabled={!newProductDraft.metalType}
                      size="sm"
                    >
                      Add Product
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        revokeObjectUrls(newProductDraft.references);
                        setNewProductDraft(createEmptyNewProduct());
                        setReferenceLinkInput("");
                        setReferenceError("");
                        setShowNewProductForm(false);
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {form.newProducts.length > 0 && (
              <div className="sm:col-span-2 space-y-2">
                {form.newProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {product.category} {formatMetalTypeLabel(product.metalType)}{" "}
                        {product.metalPurity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.stoneDescription || "No stones"} ·{" "}
                        {product.stoneCut || "No cut"}
                      </p>
                      {product.references.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {product.references.map((reference) => (
                            <div
                              key={reference.id}
                              className="flex items-center gap-2 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
                            >
                              {getReferenceIcon(reference.type)}
                              <span className="max-w-44 truncate">
                                {reference.type === "link"
                                  ? "Link"
                                  : reference.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNewProduct(product.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {errors.products && (
              <p className="text-sm text-destructive sm:col-span-2">
                {errors.products}
              </p>
            )}
          </FormSection>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              size="default"
              className="gap-2 px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Enquiry"}
            </Button>
          </div>
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </form>
      )}

      <div className="h-12" />
    </div>
  );
}
