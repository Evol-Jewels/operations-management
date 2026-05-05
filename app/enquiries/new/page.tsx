"use client";

import { Suspense, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  Plus,
  X,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { getCustomerByPhone } from "@/lib/mock-customers";
import { searchProducts, type Product } from "@/lib/mock-products";
import { authClient } from "@/lib/auth-client";
import type { JewelleryCategory, MetalPurity, MetalType } from "@/types";

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
  "18K",
  "22K",
  "24K",
  "925 Sterling",
  "950 Platinum",
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

type CustomerCategory = "VIP" | "Middle" | "Lower";

interface CustomerDetails {
  isExisting: boolean;
  phone: string;
  name: string;
  dob: string;
  location: string;
  email: string;
  category: CustomerCategory;
  notes: string;
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
  location: "",
  email: "",
  category: "Middle",
  notes: "",
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
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

function validateStep1(data: CustomerDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Name is required";
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
  const [newProductDraft, setNewProductDraft] = useState<NewProduct>({
    id: "",
    category: "",
    metalType: "",
    metalPurity: "",
    polish: "",
    stoneDescription: "",
    stoneCut: "",
    stoneQuality: "",
    stoneCaratEstimate: "",
  });

  const salespersonName = session?.user?.name || "Sales Team";
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productSearch.trim()) {
      setSearchResults(searchProducts(productSearch));
    } else {
      setSearchResults([]);
    }
  }, [productSearch]);

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
          location: customer.location || "",
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
          location: "",
          email: "",
          category: "Middle",
          notes: "",
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

  function handleSubmit(e: React.FormEvent) {
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
    setSubmitted(true);
    setTimeout(() => router.push("/"), 2200);
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
    setNewProductDraft({
      id: "",
      category: "",
      metalType: "",
      metalPurity: "",
      polish: "",
      stoneDescription: "",
      stoneCut: "",
      stoneQuality: "",
      stoneCaratEstimate: "",
    });
    setShowNewProductForm(false);
  }

  function removeNewProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      newProducts: prev.newProducts.filter((p) => p.id !== id),
    }));
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
                  label="Location"
                  htmlFor="location"
                  optional
                  className="sm:col-span-2"
                >
                  <Input
                    id="location"
                    placeholder="e.g. Mumbai, Delhi"
                    value={form.customer.location}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          location: e.target.value,
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
                    <SelectTrigger id="category" className="h-10 text-sm">
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
                  {form.customer.phone} · {form.customer.category}
                </p>
              </div>
            </div>
          </div>

          <FormSection
            title="Existing Products"
            description="Search by product code (e.g., SRNG679604)"
          >
            <div className="sm:col-span-2">
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
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-3"
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold ${getCategoryColor(
                            product.category,
                          )}`}
                        >
                          {product.productCode.slice(0, 4)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {product.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.productCode} · {product.metalType}{" "}
                            {product.metalPurity}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {form.selectedProducts.length > 0 && (
              <div className="sm:col-span-2 space-y-2">
                {form.selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md text-sm font-bold ${getCategoryColor(
                        product.category,
                      )}`}
                    >
                      {product.productCode.slice(0, 4)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.productCode} · {product.metalType}{" "}
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
          </FormSection>

          <FormSection
            title="Custom Product"
            description="Add custom metal and stone preferences"
          >
            <div className="sm:col-span-2">
              {!showNewProductForm ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewProductForm(true)}
                  className="w-full justify-start gap-2 h-10"
                >
                  <Plus className="h-4 w-4" />
                  Add custom product...
                </Button>
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
                        <SelectTrigger className="h-9 text-sm">
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
                        <SelectTrigger className="h-9 text-sm">
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
                        <SelectTrigger className="h-9 text-sm">
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
                        <SelectTrigger className="h-9 text-sm">
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
                      className="h-9"
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
                        <SelectTrigger className="h-9 text-sm">
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
                        <SelectTrigger className="h-9 text-sm">
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
                      className="h-9"
                    />
                  </FormField>

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
                      onClick={() => setShowNewProductForm(false)}
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
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {product.category} {product.metalType}{" "}
                        {product.metalPurity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.stoneDescription || "No stones"} ·{" "}
                        {product.stoneCut || "No cut"}
                      </p>
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

          <div className="rounded-lg border border-border bg-muted p-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Enquiry by</p>
                <p className="text-xs text-muted-foreground">
                  {salespersonName}
                </p>
              </div>
            </div>
          </div>

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
            <Button type="submit" size="default" className="gap-2 px-6">
              Save Enquiry
            </Button>
          </div>
        </form>
      )}

      <div className="h-12" />
    </div>
  );
}
