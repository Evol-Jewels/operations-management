"use client";

import { ArrowLeft, CheckCircle2, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOrderById } from "@/lib/mock-data";
import type {
  CertificationType,
  JewelleryCategory,
  MetalPurity,
  MetalType,
} from "@/types";

// ─── Static options ───────────────────────────────────────────────────────────

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
const CERTIFICATIONS: CertificationType[] = [
  "None",
  "Jewellery",
  "GIA",
  "IGI",
  "SGL",
];
const POLISH_OPTIONS = [
  "High polish",
  "Matte",
  "Satin",
  "Hammered",
  "Brushed",
  "Antique finish",
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
const SALESPERSONS = ["Ananya S.", "Dev R.", "Priyanka M.", "Rajan K."];
const VENDORS = [
  "Raj Jewel Craft",
  "Sunrise Gold Works",
  "Heritage Crafts Mumbai",
  "Bharat Gems & Jewels",
  "Patel Diamond House",
];
const SETTING_TYPES = [
  "Prong / Claw",
  "Bezel",
  "Pavé",
  "Channel",
  "Bar",
  "Tension",
  "Flush / Gypsy",
  "Cluster",
  "Invisible",
];

// ─── Auto-generate order number ───────────────────────────────────────────────

function generateOrderNumber() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `EVL-${year}-${seq}`;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface OrderFormState {
  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  // Staff & vendor
  salespersonName: string;
  vendorName: string;
  // Product
  category: string;
  metalType: string;
  metalPurity: string;
  metalWeight: string;
  polish: string;
  // Stones
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratPerStone: string;
  stonePlacement: string;
  settingType: string;
  // Sizing
  ringSize: string;
  chainLength: string;
  bangleSize: string;
  // Order specifics
  certification: string;
  cadDesignRequired: boolean;
  advancePaid: string;
  totalEstimate: string;
  deliveryDate: string;
  specialInstructions: string;
}

const EMPTY: OrderFormState = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  salespersonName: "",
  vendorName: "",
  category: "",
  metalType: "",
  metalPurity: "",
  metalWeight: "",
  polish: "",
  stoneDescription: "",
  stoneCut: "",
  stoneQuality: "",
  stoneCaratPerStone: "",
  stonePlacement: "",
  settingType: "",
  ringSize: "",
  chainLength: "",
  bangleSize: "",
  certification: "None",
  cadDesignRequired: false,
  advancePaid: "",
  totalEstimate: "",
  deliveryDate: "",
  specialInstructions: "",
};

type Errors = Partial<Record<keyof OrderFormState, string>>;

function validate(form: OrderFormState): Errors {
  const errors: Errors = {};
  if (!form.customerName.trim())
    errors.customerName = "Customer name is required";
  if (!form.customerPhone.trim())
    errors.customerPhone = "Phone number is required";
  if (!form.category) errors.category = "Select a jewellery category";
  if (!form.metalType) errors.metalType = "Select a metal type";
  if (!form.salespersonName) errors.salespersonName = "Assign a salesperson";
  if (!form.vendorName.trim())
    errors.vendorName = "Vendor / manufacturer name is required";
  if (!form.deliveryDate) errors.deliveryDate = "Delivery date is required";
  if (form.totalEstimate && isNaN(Number(form.totalEstimate)))
    errors.totalEstimate = "Enter a valid amount";
  if (form.advancePaid && isNaN(Number(form.advancePaid)))
    errors.advancePaid = "Enter a valid amount";
  return errors;
}

// ─── Size fields — shown conditionally ───────────────────────────────────────

function needsRingSize(cat: string) {
  return cat === "Ring";
}
function needsChainLength(cat: string) {
  return ["Necklace", "Chain", "Pendant"].includes(cat);
}
function needsBangleSize(cat: string) {
  return cat === "Bangle";
}

// ─── Inner form (needs useSearchParams) ──────────────────────────────────────

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromEnquiryId = searchParams.get("from");

  const [orderNumber] = useState(generateOrderNumber);
  const [form, setForm] = useState<OrderFormState>(() => {
    // Pre-fill from enquiry if ?from= param present
    if (fromEnquiryId) {
      const enquiry = getOrderById(fromEnquiryId);
      if (enquiry) {
        return {
          ...EMPTY,
          customerName: enquiry.customerName,
          customerPhone: enquiry.customerPhone ?? "",
          customerEmail: enquiry.customerEmail ?? "",
          customerAddress: enquiry.customerAddress ?? "",
          salespersonName: enquiry.salespersonName,
          category: enquiry.category,
          metalType: enquiry.metalType,
          metalPurity: enquiry.metalPurity,
          polish: enquiry.polish ?? "",
          stoneDescription: enquiry.stoneDescription ?? "",
          stoneCut: enquiry.stoneCut ?? "",
          stoneQuality: enquiry.stoneQuality ?? "",
          stoneCaratPerStone: enquiry.stoneCaratEstimate
            ? String(enquiry.stoneCaratEstimate)
            : "",
        };
      }
    }
    return EMPTY;
  });

  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [newToken, setNewToken] = useState("");

  function set<K extends keyof OrderFormState>(
    field: K,
    value: OrderFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document
        .getElementById(Object.keys(errs)[0])
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Generate a mock shareable token
    const token = `evl-new-${form.customerName.toLowerCase().replace(/\s+/g, "-")}-${form.category.toLowerCase()}`;
    setNewToken(token);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-5 py-28 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">
            Order created
          </h1>
          <p className="text-sm text-muted-foreground">
            {orderNumber} for {form.customerName} is now in the tracker.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Button className="w-full gap-2" asChild>
            <Link href={`/orders/${newToken}`}>View order page</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Share the order page link with your vendor to get started.
        </p>
      </div>
    );
  }

  const showRingSize = needsRingSize(form.category);
  const showChainLength = needsChainLength(form.category);
  const showBangleSize = needsBangleSize(form.category);
  const showSizing = showRingSize || showChainLength || showBangleSize;

  return (
    <div className="mx-auto max-w-2xl space-y-0">
      {/* Back */}
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

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {fromEnquiryId ? "Convert to Order" : "New Order"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fromEnquiryId
              ? "Customer and product details have been pre-filled from the enquiry. Review and complete."
              : "Fill in all production specs. A shareable order page will be generated on submit."}
          </p>
        </div>
        {/* Auto-generated order number */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm text-foreground">
            {orderNumber}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        {/* ── 1. Customer ──────────────────────────────────────────────── */}
        <FormSection title="Customer">
          <FormField
            label="Full name"
            htmlFor="customerName"
            required
            error={errors.customerName}
            className="sm:col-span-2"
          >
            <Input
              id="customerName"
              placeholder="e.g. Priya Mehta"
              value={form.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField
            label="Phone number"
            htmlFor="customerPhone"
            required
            error={errors.customerPhone}
          >
            <Input
              id="customerPhone"
              type="tel"
              placeholder="+91 98200 00000"
              value={form.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField label="Email address" htmlFor="customerEmail" optional>
            <Input
              id="customerEmail"
              type="email"
              placeholder="priya@example.com"
              value={form.customerEmail}
              onChange={(e) => set("customerEmail", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField
            label="Address"
            htmlFor="customerAddress"
            optional
            className="sm:col-span-2"
          >
            <Input
              id="customerAddress"
              placeholder="e.g. 14, Juhu Scheme, Mumbai 400049"
              value={form.customerAddress}
              onChange={(e) => set("customerAddress", e.target.value)}
              className="h-9"
            />
          </FormField>
        </FormSection>

        {/* ── 2. Staff & Vendor ────────────────────────────────────────── */}
        <FormSection title="Staff & Vendor">
          <FormField
            label="Salesperson"
            required
            error={errors.salespersonName}
          >
            <Select
              value={form.salespersonName}
              onValueChange={(v) => set("salespersonName", v)}
            >
              <SelectTrigger id="salespersonName" className="h-9 text-sm">
                <SelectValue placeholder="Select salesperson" />
              </SelectTrigger>
              <SelectContent>
                {SALESPERSONS.map((sp) => (
                  <SelectItem key={sp} value={sp}>
                    {sp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Vendor / manufacturer"
            htmlFor="vendorName"
            required
            error={errors.vendorName}
          >
            <Input
              id="vendorName"
              placeholder="e.g. Raj Jewel Craft"
              list="vendor-suggestions"
              value={form.vendorName}
              onChange={(e) => set("vendorName", e.target.value)}
              className="h-9"
            />
            <datalist id="vendor-suggestions">
              {VENDORS.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </FormField>
        </FormSection>

        {/* ── 3. Product Specifications ────────────────────────────────── */}
        <FormSection
          title="Product Specifications"
          description="Precise specs sent to the vendor for production."
        >
          <FormField
            label="Jewellery category"
            required
            error={errors.category}
          >
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger id="category" className="h-9 text-sm">
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
          <FormField label="Metal type" required error={errors.metalType}>
            <Select
              value={form.metalType}
              onValueChange={(v) => set("metalType", v)}
            >
              <SelectTrigger id="metalType" className="h-9 text-sm">
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
              value={form.metalPurity}
              onValueChange={(v) => set("metalPurity", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="e.g. 18K, 22K" />
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
          <FormField
            label="Metal weight (grams)"
            htmlFor="metalWeight"
            optional
            hint="Final weight — fill in if known at order time"
          >
            <Input
              id="metalWeight"
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 4.5"
              value={form.metalWeight}
              onChange={(e) => set("metalWeight", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField label="Polish / finish" optional>
            <Select value={form.polish} onValueChange={(v) => set("polish", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="e.g. High polish, Matte" />
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
        </FormSection>

        {/* ── 4. Stone Specifications ──────────────────────────────────── */}
        <FormSection
          title="Stone Specifications"
          description="Skip if no stones are set in this piece."
        >
          <FormField
            label="Stone type / description"
            htmlFor="stoneDescription"
            optional
            className="sm:col-span-2"
          >
            <Input
              id="stoneDescription"
              placeholder="e.g. Natural Diamonds, Blue Sapphire, Polki and Rubies"
              value={form.stoneDescription}
              onChange={(e) => set("stoneDescription", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField label="Stone cut" optional>
            <Select
              value={form.stoneCut}
              onValueChange={(v) => set("stoneCut", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="e.g. Round Brilliant" />
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
          <FormField label="Stone quality / grade" optional>
            <Select
              value={form.stoneQuality}
              onValueChange={(v) => set("stoneQuality", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="e.g. VVS, VS2, AAA" />
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
          <FormField
            label="Carat per stone"
            htmlFor="stoneCaratPerStone"
            optional
            hint="Per individual stone, e.g. 0.25 ct each"
          >
            <Input
              id="stoneCaratPerStone"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.25"
              value={form.stoneCaratPerStone}
              onChange={(e) => set("stoneCaratPerStone", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField
            label="Stone placement / layout"
            htmlFor="stonePlacement"
            optional
            hint="e.g. Centre stone + 8 side stones"
          >
            <Input
              id="stonePlacement"
              placeholder="e.g. 1 centre oval, 10 round side stones"
              value={form.stonePlacement}
              onChange={(e) => set("stonePlacement", e.target.value)}
              className="h-9"
            />
          </FormField>
          <FormField label="Setting type" optional>
            <Select
              value={form.settingType}
              onValueChange={(v) => set("settingType", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="e.g. Prong, Pavé, Bezel" />
              </SelectTrigger>
              <SelectContent>
                {SETTING_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        {/* ── 5. Sizing (conditional) ──────────────────────────────────── */}
        {showSizing && (
          <FormSection title="Sizing">
            {showRingSize && (
              <FormField
                label="Ring size"
                htmlFor="ringSize"
                optional
                hint="Indian ring size number, e.g. 13, 14, 15"
              >
                <Input
                  id="ringSize"
                  placeholder="e.g. 13"
                  value={form.ringSize}
                  onChange={(e) => set("ringSize", e.target.value)}
                  className="h-9"
                />
              </FormField>
            )}
            {showChainLength && (
              <FormField
                label="Chain length (cm)"
                htmlFor="chainLength"
                optional
                hint="e.g. 45 cm, 50 cm"
              >
                <Input
                  id="chainLength"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="45"
                  value={form.chainLength}
                  onChange={(e) => set("chainLength", e.target.value)}
                  className="h-9"
                />
              </FormField>
            )}
            {showBangleSize && (
              <FormField
                label="Bangle inner diameter (inches)"
                htmlFor="bangleSize"
                optional
                hint="e.g. 2.4, 2.6, 2.8"
              >
                <Input
                  id="bangleSize"
                  placeholder="e.g. 2.6"
                  value={form.bangleSize}
                  onChange={(e) => set("bangleSize", e.target.value)}
                  className="h-9"
                />
              </FormField>
            )}
          </FormSection>
        )}

        {/* ── 6. Order Details ─────────────────────────────────────────── */}
        <FormSection
          title="Order Details"
          description="Delivery, pricing, and certification."
        >
          <FormField label="Certification" optional>
            <Select
              value={form.certification}
              onValueChange={(v) => set("certification", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CERTIFICATIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "None" ? "No certification" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Delivery date"
            htmlFor="deliveryDate"
            required
            error={errors.deliveryDate}
          >
            <Input
              id="deliveryDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={form.deliveryDate}
              onChange={(e) => set("deliveryDate", e.target.value)}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Total estimate (₹)"
            htmlFor="totalEstimate"
            optional
            error={errors.totalEstimate}
            hint="Full price before discounts"
          >
            <Input
              id="totalEstimate"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 85000"
              value={form.totalEstimate}
              onChange={(e) => set("totalEstimate", e.target.value)}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Advance paid (₹)"
            htmlFor="advancePaid"
            optional
            error={errors.advancePaid}
          >
            <Input
              id="advancePaid"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 25000"
              value={form.advancePaid}
              onChange={(e) => set("advancePaid", e.target.value)}
              className="h-9"
            />
          </FormField>

          {/* CAD design toggle */}
          <label
            htmlFor="cadDesignRequired"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50 sm:col-span-2"
          >
            <Checkbox
              id="cadDesignRequired"
              checked={form.cadDesignRequired}
              onCheckedChange={(checked) => set("cadDesignRequired", !!checked)}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                CAD design required
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Check this for custom pieces where a digital design needs vendor
                approval before production starts.
              </p>
            </div>
          </label>

          <FormField
            label="Special instructions"
            htmlFor="specialInstructions"
            optional
            className="sm:col-span-2"
            hint="Engravings, packaging preferences, customer-specific requests"
          >
            <Textarea
              id="specialInstructions"
              placeholder="e.g. Engrave 'P & R 14.02.2025' inside the band. Customer will collect in person — no delivery required."
              value={form.specialInstructions}
              onChange={(e) => set("specialInstructions", e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </FormField>
        </FormSection>

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground"
          >
            <Link href="/">Cancel</Link>
          </Button>
          <Button type="submit" size="default" className="gap-2 px-6">
            Create Order
          </Button>
        </div>
      </form>

      <div className="h-12" />
    </div>
  );
}

// ─── Page wrapper (Suspense for useSearchParams) ──────────────────────────────

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderForm />
    </Suspense>
  );
}
