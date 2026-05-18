import {
  ArrowLeft,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/lib/mock-products";
import { formatCurrency } from "@/lib/mock-products";
import { cn } from "@/lib/utils";
import type { NewProduct, ProductAddMode } from "./enquiry-form-types";
import {
  CATEGORIES,
  INTEREST_LEVELS,
  METAL_PURITIES,
  METAL_TYPES,
  POLISH_OPTIONS,
  STONE_CUTS,
  STONE_QUALITIES,
} from "./enquiry-form-types";
import {
  formatFileSize,
  formatMetalTypeLabel,
  getReferenceIcon,
  ProductThumbnail,
} from "./enquiry-form-utils";
import { StepNumber } from "./typeform-controls";

interface ProductInterestStepProps {
  stepNumber: number;
  selectedProducts: Product[];
  newProducts: NewProduct[];
  productAddMode: ProductAddMode;
  setProductAddMode: (mode: ProductAddMode) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  newProductDraft: NewProduct;
  setNewProductDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  errors: Record<string, string>;
  submitError: string;
  addProduct: (product: Product) => void;
  removeSelectedProduct: (productId: string) => void;
  addNewProduct: () => void;
  cancelNewProduct: () => void;
  removeNewProduct: (id: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (referenceId: string) => void;
}

export function ProductInterestStep({
  stepNumber,
  selectedProducts,
  newProducts,
  productAddMode,
  setProductAddMode,
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  newProductDraft,
  setNewProductDraft,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  errors,
  submitError,
  addProduct,
  removeSelectedProduct,
  addNewProduct,
  cancelNewProduct,
  removeNewProduct,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
}: ProductInterestStepProps) {
  return (
    <div className="w-full max-w-2xl space-y-6 self-start pt-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          What are they interested in?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add products from the catalogue or describe a custom requirement
        </p>
      </div>

      {(selectedProducts.length > 0 || newProducts.length > 0) && (
        <AddedProducts
          selectedProducts={selectedProducts}
          newProducts={newProducts}
          removeSelectedProduct={removeSelectedProduct}
          removeNewProduct={removeNewProduct}
        />
      )}

      {productAddMode === "choose" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductModeButton
            icon={<Search className="h-4 w-4 text-primary" />}
            title="Search catalogue"
            description="Find an existing product"
            onClick={() => {
              setProductAddMode("search");
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
          />
          <ProductModeButton
            icon={<Pencil className="h-4 w-4 text-primary" />}
            title="Describe custom"
            description="Add a custom requirement"
            onClick={() => setProductAddMode("custom")}
          />
        </div>
      )}

      {productAddMode === "search" && (
        <CatalogueSearch
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          searchResults={searchResults}
          searchInputRef={searchInputRef}
          addProduct={(product) => {
            addProduct(product);
            setProductAddMode("choose");
          }}
          onBack={() => {
            setProductAddMode("choose");
            setProductSearch("");
          }}
        />
      )}

      {productAddMode === "custom" && (
        <CustomProductForm
          draft={newProductDraft}
          setDraft={setNewProductDraft}
          referenceLinkInput={referenceLinkInput}
          setReferenceLinkInput={setReferenceLinkInput}
          referenceError={referenceError}
          setReferenceError={setReferenceError}
          addReferenceLink={addReferenceLink}
          addReferenceFiles={addReferenceFiles}
          removeDraftReference={removeDraftReference}
          addNewProduct={() => {
            addNewProduct();
            setProductAddMode("choose");
          }}
          onCancel={() => {
            cancelNewProduct();
            setProductAddMode("choose");
          }}
        />
      )}

      {errors.products && (
        <p className="text-sm text-destructive">{errors.products}</p>
      )}
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
    </div>
  );
}

function AddedProducts({
  selectedProducts,
  newProducts,
  removeSelectedProduct,
  removeNewProduct,
}: {
  selectedProducts: Product[];
  newProducts: NewProduct[];
  removeSelectedProduct: (productId: string) => void;
  removeNewProduct: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
        Added products
      </p>
      <div className="divide-y divide-border rounded-xl border bg-card">
        {selectedProducts.map((product) => (
          <div
            key={`sel-${product.id}`}
            className="flex items-center gap-3 px-3.5 py-3"
          >
            <ProductThumbnail product={product} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {product.productCode} ·{" "}
                {formatMetalTypeLabel(product.metalType)} {product.metalPurity}
                {product.basePrice
                  ? ` · ${formatCurrency(product.basePrice)}`
                  : ""}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Catalogue
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => removeSelectedProduct(product.id)}
              className="shrink-0 text-muted-foreground/60 hover:text-destructive"
              aria-label={`Remove ${product.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {newProducts.map((product) => (
          <div
            key={`cust-${product.id}`}
            className="flex items-center gap-3 px-3.5 py-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {product.category ? `${product.category} - ` : ""}
                {formatMetalTypeLabel(product.metalType)} {product.metalPurity}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  product.stoneDescription || "No stones",
                  product.polish,
                  product.references.length > 0
                    ? `${product.references.length} ref`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Custom
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => removeNewProduct(product.id)}
              className="shrink-0 text-muted-foreground/60 hover:text-destructive"
              aria-label="Remove custom product"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductModeButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-border px-4 py-5 text-center transition-all hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function CatalogueSearch({
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  addProduct,
  onBack,
}: {
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  addProduct: (product: Product) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      <ModeHeader label="Search catalogue" onBack={onBack} />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search by product code..."
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
          className="h-10 pl-10"
          autoFocus
        />
      </div>
      {searchResults.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-xl border bg-card">
          {searchResults.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <ProductThumbnail product={product} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {product.productCode} ·{" "}
                  {formatMetalTypeLabel(product.metalType)}{" "}
                  {product.metalPurity}
                </p>
              </div>
              {product.basePrice && (
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(product.basePrice)}
                </span>
              )}
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      {productSearch.trim() && searchResults.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No products found for &quot;{productSearch}&quot;
        </p>
      )}
    </div>
  );
}

function CustomProductForm({
  draft,
  setDraft,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
  addNewProduct,
  onCancel,
}: {
  draft: NewProduct;
  setDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (referenceId: string) => void;
  addNewProduct: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <ModeHeader label="Describe a custom product" onBack={onCancel} />
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Category"
            value={draft.category}
            options={CATEGORIES}
            optional
            placeholder="Select category"
            onChange={(category) => setDraft((prev) => ({ ...prev, category }))}
          />
          <SelectField
            label="Metal type"
            value={draft.metalType}
            options={METAL_TYPES}
            required
            placeholder="Select metal"
            onChange={(metalType) =>
              setDraft((prev) => ({ ...prev, metalType }))
            }
          />
          <SelectField
            label="Metal purity"
            value={draft.metalPurity}
            options={METAL_PURITIES}
            optional
            placeholder="Select purity"
            onChange={(metalPurity) =>
              setDraft((prev) => ({ ...prev, metalPurity }))
            }
          />
          <SelectField
            label="Polish / finish"
            value={draft.polish}
            options={POLISH_OPTIONS}
            optional
            placeholder="Select polish"
            onChange={(polish) => setDraft((prev) => ({ ...prev, polish }))}
          />
        </div>

        <FormField
          label="Stone description"
          htmlFor="stoneDescription"
          optional
        >
          <Input
            id="stoneDescription"
            placeholder="e.g. Natural Diamonds, Blue Sapphire"
            value={draft.stoneDescription}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                stoneDescription: event.target.value,
              }))
            }
            className="h-9 w-full"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Stone cut"
            value={draft.stoneCut}
            options={STONE_CUTS}
            optional
            placeholder="Select cut"
            onChange={(stoneCut) => setDraft((prev) => ({ ...prev, stoneCut }))}
          />
          <SelectField
            label="Stone quality"
            value={draft.stoneQuality}
            options={STONE_QUALITIES}
            optional
            placeholder="Select quality"
            onChange={(stoneQuality) =>
              setDraft((prev) => ({ ...prev, stoneQuality }))
            }
          />
          <FormField label="Carat estimate" optional>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.50"
              value={draft.stoneCaratEstimate}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  stoneCaratEstimate: event.target.value,
                }))
              }
              className="h-9 w-full"
            />
          </FormField>
        </div>

        <FormField label="References" optional>
          <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Paste a link"
                value={referenceLinkInput}
                onChange={(event) => {
                  setReferenceLinkInput(event.target.value);
                  if (referenceError) setReferenceError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addReferenceLink();
                  }
                }}
                className="h-9 min-w-[180px] flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReferenceLink}
              >
                <Link2 className="h-3.5 w-3.5" />
                Add
              </Button>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Upload</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    addReferenceFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {draft.references.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {draft.references.map((reference) => (
                  <div
                    key={reference.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2"
                  >
                    {reference.type === "image" ? (
                      // biome-ignore lint/performance/noImgElement: local object URLs cannot be optimized by next/image.
                      <img
                        src={reference.url}
                        alt={reference.name}
                        className="h-8 w-8 shrink-0 rounded object-cover"
                      />
                    ) : reference.type === "video" ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                        <Video className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
                        {getReferenceIcon(reference.type)}
                        <span className="truncate">
                          {reference.type === "link"
                            ? reference.url
                            : reference.name}
                        </span>
                      </div>
                      {reference.size && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(reference.size)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeDraftReference(reference.id)}
                      className="shrink-0 text-muted-foreground/60 hover:text-destructive"
                      aria-label="Remove reference"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {referenceError && (
              <p className="text-[11px] text-destructive">{referenceError}</p>
            )}
          </div>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Notes" optional>
            <Textarea
              placeholder="Design preferences, special requests..."
              value={draft.notes}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, notes: event.target.value }))
              }
              className="min-h-[72px] w-full resize-none"
            />
          </FormField>
          <SelectField
            label="Interest level"
            value={draft.interestLevel}
            options={INTEREST_LEVELS}
            optional
            placeholder="Select interest"
            onChange={(interestLevel) =>
              setDraft((prev) => ({ ...prev, interestLevel }))
            }
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={addNewProduct}
          disabled={!draft.metalType}
          className="gap-2 px-5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onChange,
  optional,
  required,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <FormField label={label} optional={optional} required={required}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

function ModeHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md",
          "text-muted-foreground transition-colors hover:bg-muted",
        )}
        aria-label="Back to product options"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
