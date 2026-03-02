"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { JewelleryCategory, MetalPurity, MetalType } from "@/types";

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

const SALESPERSONS = ["Ananya S.", "Dev R.", "Priyanka M.", "Rajan K."];

const BUDGET_RANGES = [
  "Under ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000 – ₹3,00,000",
  "Above ₹3,00,000",
  "Flexible",
];

// ─── Form state type ──────────────────────────────────────────────────────────

interface EnquiryFormState {
  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  // Product
  category: string;
  metalType: string;
  metalPurity: string;
  polish: string;
  // Stones
  stoneDescription: string;
  stoneCut: string;
  stoneQuality: string;
  stoneCaratEstimate: string;
  // Context
  budgetRange: string;
  occasion: string;
  timelineNotes: string;
  // Staff
  salespersonName: string;
}

const EMPTY: EnquiryFormState = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  category: "",
  metalType: "",
  metalPurity: "",
  polish: "",
  stoneDescription: "",
  stoneCut: "",
  stoneQuality: "",
  stoneCaratEstimate: "",
  budgetRange: "",
  occasion: "",
  timelineNotes: "",
  salespersonName: "",
};

type Errors = Partial<Record<keyof EnquiryFormState, string>>;

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: EnquiryFormState): Errors {
  const errors: Errors = {};
  if (!form.customerName.trim())
    errors.customerName = "Customer name is required";
  if (!form.customerPhone.trim())
    errors.customerPhone = "Phone number is required";
  if (!form.category) errors.category = "Select a jewellery category";
  if (!form.metalType) errors.metalType = "Select a metal type";
  if (!form.salespersonName) errors.salespersonName = "Assign a salesperson";
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewEnquiryPage() {
  const router = useRouter();
  const [form, setForm] = useState<EnquiryFormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof EnquiryFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstKey = Object.keys(errs)[0];
      document
        .getElementById(firstKey)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitted(true);
    // In a real app: add to store, get new ID, redirect to order page
    setTimeout(() => router.push("/"), 2200);
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
            {form.customerName}&apos;s enquiry has been added to the tracker.
            Redirecting you back…
          </p>
        </div>
      </div>
    );
  }

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

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">New Enquiry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Capture a walk-in customer&apos;s interest. Fields marked{" "}
          <span className="text-destructive">*</span> are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-10">
        {/* ── 1. Customer ─────────────────────────────────────────────── */}
        <FormSection title="Customer" description="Who walked in today?">
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

        {/* ── 2. Product Interest ──────────────────────────────────────── */}
        <FormSection
          title="Product Interest"
          description="What is the customer looking for?"
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

        {/* ── 3. Stone Preferences ────────────────────────────────────── */}
        <FormSection
          title="Stone Preferences"
          description="Leave blank if no stones or not yet decided."
        >
          <FormField
            label="Stone type / description"
            htmlFor="stoneDescription"
            optional
            className="sm:col-span-2"
          >
            <Input
              id="stoneDescription"
              placeholder="e.g. Natural Diamonds, Blue Sapphire, Ruby and Emerald"
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
                <SelectValue placeholder="e.g. Round Brilliant, Oval" />
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
                <SelectValue placeholder="e.g. VVS, VS1, AAA" />
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
            label="Carat estimate (rough)"
            htmlFor="stoneCaratEstimate"
            optional
            hint="Rough estimate is fine — e.g. 0.5, 1.2"
          >
            <Input
              id="stoneCaratEstimate"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.50"
              value={form.stoneCaratEstimate}
              onChange={(e) => set("stoneCaratEstimate", e.target.value)}
              className="h-9"
            />
          </FormField>
        </FormSection>

        {/* ── 4. Context ───────────────────────────────────────────────── */}
        <FormSection
          title="Context"
          description="Help the team understand the customer's situation."
        >
          <FormField label="Budget range" optional>
            <Select
              value={form.budgetRange}
              onValueChange={(v) => set("budgetRange", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Occasion" htmlFor="occasion" optional>
            <Input
              id="occasion"
              placeholder="e.g. Wedding, Anniversary, Birthday gift"
              value={form.occasion}
              onChange={(e) => set("occasion", e.target.value)}
              className="h-9"
            />
          </FormField>

          <FormField
            label="Timeline / urgency"
            htmlFor="timelineNotes"
            optional
            className="sm:col-span-2"
          >
            <Textarea
              id="timelineNotes"
              placeholder="e.g. Needed within 3 weeks for the wedding on March 15th"
              value={form.timelineNotes}
              onChange={(e) => set("timelineNotes", e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </FormField>
        </FormSection>

        {/* ── 5. Staff ─────────────────────────────────────────────────── */}
        <FormSection title="Staff" description="Who is handling this enquiry?">
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
            Save Enquiry
          </Button>
        </div>
      </form>

      {/* Bottom breathing room */}
      <div className="h-12" />
    </div>
  );
}
