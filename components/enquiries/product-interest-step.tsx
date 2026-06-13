import {
  ArrowLeft,
  Link2,
  Pencil,
  Plus,
  ScanLine,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
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
import { cn, formatCurrency } from "@/lib/utils";
import type {
  NewProduct,
  Product,
  ProductAddMode,
  ProductReference,
} from "./enquiry-form-types";
import {
  CATEGORIES,
  createEmptyNewProductStone,
  hasValidCustomProductRequirement,
  METAL_PURITIES,
  METAL_TYPES,
  STONE_TYPES,
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
  totalSteps: number;
  subtitle?: string;
  selectedProducts: Product[];
  newProducts: NewProduct[];
  productAddMode: ProductAddMode;
  setProductAddMode: (mode: ProductAddMode) => void;
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  productLookupLoading: boolean;
  productLookupError: string;
  notFoundCode: string;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  newProductDraft: NewProduct;
  setNewProductDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  errors: Record<string, string>;
  submitError: string;
  addProduct: (product: Product) => void;
  searchInventoryProducts: (code: string) => void;
  removeSelectedProduct: (productId: string) => void;
  addNewProduct: () => void;
  cancelNewProduct: () => void;
  editNewProduct?: (id: string) => void;
  removeNewProduct: (id: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (referenceId: string) => void;
  customProductSubmitLabel?: string;
  canSubmitCustomProduct?: (draft: NewProduct) => boolean;
}

export function ProductInterestStep({
  stepNumber,
  totalSteps,
  subtitle,
  selectedProducts,
  newProducts,
  productAddMode,
  setProductAddMode,
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  productLookupLoading,
  productLookupError,
  notFoundCode,
  isScannerOpen,
  setIsScannerOpen,
  newProductDraft,
  setNewProductDraft,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  errors,
  submitError,
  addProduct,
  searchInventoryProducts,
  removeSelectedProduct,
  addNewProduct,
  cancelNewProduct,
  editNewProduct,
  removeNewProduct,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
  customProductSubmitLabel,
  canSubmitCustomProduct,
}: ProductInterestStepProps) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pt-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} total={totalSteps} />
          What are they interested in?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {subtitle ??
            "Add products from inventory or describe a custom requirement"}
        </p>
      </div>

      {productAddMode === "choose" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <InventoryQuickEntry
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            searchResults={searchResults}
            searchInputRef={searchInputRef}
            selectedProducts={selectedProducts}
            isLoading={productLookupLoading}
            error={productLookupError}
            notFoundCode={notFoundCode}
            isScannerOpen={isScannerOpen}
            setIsScannerOpen={setIsScannerOpen}
            searchInventoryProducts={searchInventoryProducts}
            addProduct={addProduct}
          />
          <ProductModeButton
            icon={<Pencil className="h-4 w-4 text-primary" />}
            title="Add custom product"
            description="Describe the product requirement"
            onClick={() => setProductAddMode("custom")}
          />
        </div>
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
          submitLabel={customProductSubmitLabel}
          canSubmit={canSubmitCustomProduct}
        />
      )}

      {(selectedProducts.length > 0 || newProducts.length > 0) && (
        <AddedProducts
          selectedProducts={selectedProducts}
          newProducts={newProducts}
          removeSelectedProduct={removeSelectedProduct}
          editNewProduct={editNewProduct}
          removeNewProduct={removeNewProduct}
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
  editNewProduct,
  removeNewProduct,
}: {
  selectedProducts: Product[];
  newProducts: NewProduct[];
  removeSelectedProduct: (productId: string) => void;
  editNewProduct?: (id: string) => void;
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
              Inventory
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
                  formatStoneSummary(product),
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
            {editNewProduct && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => editNewProduct(product.id)}
                className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                aria-label="Edit custom product"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
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

function formatStoneSummary(product: NewProduct) {
  const stones = product.stones
    .filter((stone) => stone.stoneType.trim())
    .map((stone) => {
      const meta = [
        stone.pieces ? `${stone.pieces} pcs` : null,
        stone.weight ? `~${stone.weight} ct` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return meta ? `${stone.stoneType} (${meta})` : stone.stoneType;
    });

  return stones.join(" · ");
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
      className="flex h-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-border bg-card px-4 py-5 text-center transition-all hover:border-primary/30 hover:bg-muted/30"
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

function InventoryQuickEntry({
  productSearch,
  setProductSearch,
  searchResults,
  searchInputRef,
  selectedProducts,
  isLoading,
  error,
  notFoundCode,
  isScannerOpen,
  setIsScannerOpen,
  searchInventoryProducts,
  addProduct,
}: {
  productSearch: string;
  setProductSearch: (value: string) => void;
  searchResults: Product[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  selectedProducts: Product[];
  isLoading: boolean;
  error: string;
  notFoundCode: string;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  searchInventoryProducts: (code: string) => void;
  addProduct: (product: Product) => void;
}) {
  const searchInventoryProductsRef = useRef(searchInventoryProducts);

  useEffect(() => {
    searchInventoryProductsRef.current = searchInventoryProducts;
  }, [searchInventoryProducts]);

  useEffect(() => {
    const code = productSearch.trim();
    if (!code) return;

    const timeoutId = window.setTimeout(() => {
      searchInventoryProductsRef.current(code);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [productSearch]);

  return (
    <div className="space-y-4 rounded-xl border-2 border-border w-full bg-card flex flex-col justify-center items-center text-center px-4 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Search className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Find in inventory</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Search by code or scan a barcode
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsScannerOpen(true)}
          className="h-10 sm:w-28"
        >
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search inventory..."
            value={productSearch}
            onChange={(event) =>
              setProductSearch(event.target.value.toUpperCase())
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") searchInventoryProducts(productSearch);
            }}
            className="h-10 pl-10 uppercase"
          />
        </div>
      </div>
      <BarcodeScanDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onDecoded={(code) => searchInventoryProducts(code)}
      />
      {isLoading && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Searching inventory...
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {notFoundCode && !error && (
        <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          No inventory product found for{" "}
          <span className="font-medium text-foreground">{notFoundCode}</span>.
        </p>
      )}
      {searchResults.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-xl border bg-card">
          {searchResults.map((product) => {
            const alreadyAdded = selectedProducts.some(
              (item) => item.id === product.id,
            );

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                disabled={alreadyAdded}
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
                {alreadyAdded ? (
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    Added
                  </span>
                ) : (
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      )}
      {productSearch.trim() &&
        !isLoading &&
        !error &&
        notFoundCode &&
        searchResults.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No products found for &quot;{productSearch}&quot;
          </p>
        )}
    </div>
  );
}

function ReferenceInputPanel({
  references,
  referenceLinkInput,
  setReferenceLinkInput,
  referenceError,
  setReferenceError,
  addReferenceLink,
  addReferenceFiles,
  removeDraftReference,
}: {
  references: ProductReference[];
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (referenceId: string) => void;
}) {
  const links = references.filter((reference) => reference.type === "link");
  const uploads = references.filter((reference) => reference.type !== "link");

  return (
    <FormField label="References" optional>
      <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3.5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10.5rem]">
          <div className="flex min-w-0 flex-col gap-2">
            <Textarea
              placeholder="Paste one or more links, each on a new line"
              value={referenceLinkInput}
              onChange={(event) => {
                setReferenceLinkInput(event.target.value);
                if (referenceError) setReferenceError("");
              }}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  addReferenceLink();
                }
              }}
              className="min-h-[88px] w-full resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReferenceLink}
                disabled={!referenceLinkInput.trim()}
                className="w-full justify-center gap-2 sm:w-auto"
              >
                <Link2 className="h-3.5 w-3.5" />
                Add links
              </Button>
            </div>
          </div>

          <label className="flex min-h-[128px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Upload className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-foreground">Upload</span>
            <span className="text-xs text-muted-foreground">
              Images or videos
            </span>
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

        {referenceError && (
          <p className="text-[11px] text-destructive">{referenceError}</p>
        )}

        {references.length > 0 && (
          <div className="space-y-3 border-t border-border/70 pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Attached references
              </p>
              <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {references.length}
              </span>
            </div>
            {links.length > 0 && (
              <ReferenceGroup
                label={`${links.length} link${links.length === 1 ? "" : "s"}`}
                references={links}
                removeDraftReference={removeDraftReference}
              />
            )}
            {uploads.length > 0 && (
              <ReferenceGroup
                label={`${uploads.length} upload${
                  uploads.length === 1 ? "" : "s"
                }`}
                references={uploads}
                removeDraftReference={removeDraftReference}
              />
            )}
          </div>
        )}
      </div>
    </FormField>
  );
}

function ReferenceGroup({
  label,
  references,
  removeDraftReference,
}: {
  label: string;
  references: ProductReference[];
  removeDraftReference: (referenceId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {references.map((reference) => (
          <ReferenceItem
            key={reference.id}
            reference={reference}
            onRemove={() => removeDraftReference(reference.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReferenceItem({
  reference,
  onRemove,
}: {
  reference: ProductReference;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2">
      {reference.type === "image" ? (
        // biome-ignore lint/performance/noImgElement: local object URLs cannot be optimized by next/image.
        <img
          src={reference.url}
          alt={reference.name}
          className="h-9 w-9 shrink-0 rounded-md border border-border/60 object-cover"
        />
      ) : reference.type === "video" ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted">
          <Video className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted text-muted-foreground">
          <Link2 className="h-4 w-4" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium">
          {getReferenceIcon(reference.type)}
          <span className="truncate">
            {reference.type === "link" ? reference.url : reference.name}
          </span>
        </div>
        <p className="truncate text-[10px] text-muted-foreground">
          {reference.type === "link"
            ? "Reference link"
            : formatFileSize(reference.size)}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground/60 hover:text-destructive"
        aria-label="Remove reference"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
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
  submitLabel = "Add product",
  canSubmit = hasValidCustomProductRequirement,
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
  submitLabel?: string;
  canSubmit?: (draft: NewProduct) => boolean;
}) {
  function updateStone(
    stoneId: string,
    patch: Partial<NewProduct["stones"][number]>,
  ) {
    setDraft((prev) => ({
      ...prev,
      stones: prev.stones.map((stone) =>
        stone.id === stoneId ? { ...stone, ...patch } : stone,
      ),
    }));
  }

  function addStone() {
    setDraft((prev) => ({
      ...prev,
      stones: [...prev.stones, createEmptyNewProductStone()],
    }));
  }

  function removeStone(stoneId: string) {
    setDraft((prev) => ({
      ...prev,
      stones:
        prev.stones.length > 1
          ? prev.stones.filter((stone) => stone.id !== stoneId)
          : prev.stones,
    }));
  }

  return (
    <div className="space-y-4">
      <ModeHeader label="Describe a custom product" onBack={onCancel} />
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <ReferenceInputPanel
          references={draft.references}
          referenceLinkInput={referenceLinkInput}
          setReferenceLinkInput={setReferenceLinkInput}
          referenceError={referenceError}
          setReferenceError={setReferenceError}
          addReferenceLink={addReferenceLink}
          addReferenceFiles={addReferenceFiles}
          removeDraftReference={removeDraftReference}
        />

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Metal details
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              value={draft.category}
              options={CATEGORIES}
              optional
              placeholder="Select category"
              onChange={(category) =>
                setDraft((prev) => ({ ...prev, category }))
              }
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
              label="Purity"
              value={draft.metalPurity}
              options={METAL_PURITIES}
              optional
              placeholder="Select purity"
              onChange={(metalPurity) =>
                setDraft((prev) => ({ ...prev, metalPurity }))
              }
            />
            <FormField label="Color" optional>
              <Input
                placeholder="Yellow, rose, white..."
                value={draft.metalColor}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    metalColor: event.target.value,
                  }))
                }
                className="h-9 w-full"
              />
            </FormField>
            <FormField label="Approx weight" optional>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000 g"
                value={draft.metalNetWeight}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    metalNetWeight: event.target.value,
                  }))
                }
                className="h-9 w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Stone requirements
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStone}
              className="h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add stone
            </Button>
          </div>

          <div className="space-y-3">
            {draft.stones.map((stone, index) => (
              <div
                key={stone.id}
                className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_auto]"
              >
                <FormField
                  label={index === 0 ? "Stone type" : `Stone ${index + 1}`}
                  required
                >
                  <Select
                    value={stone.stoneType}
                    onValueChange={(stoneType) =>
                      updateStone(stone.id, { stoneType })
                    }
                  >
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue placeholder="Select stone" />
                    </SelectTrigger>
                    <SelectContent>
                      {STONE_TYPES.map((stoneType) => (
                        <SelectItem key={stoneType} value={stoneType}>
                          {stoneType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Pieces" optional>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={stone.pieces}
                    onChange={(event) =>
                      updateStone(stone.id, { pieces: event.target.value })
                    }
                    className="h-9 w-full"
                  />
                </FormField>
                <FormField label="Weight" optional>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0.000 ct"
                    value={stone.weight}
                    onChange={(event) =>
                      updateStone(stone.id, { weight: event.target.value })
                    }
                    className="h-9 w-full"
                  />
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeStone(stone.id)}
                    disabled={draft.stones.length === 1}
                    className="text-muted-foreground/70 hover:text-destructive"
                    aria-label={`Remove stone ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <FormField label="Notes" optional>
          <Textarea
            placeholder="Any custom requirement, design preference, sizing, finish, deadline..."
            value={draft.notes}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, notes: event.target.value }))
            }
            className="min-h-[88px] w-full resize-none"
          />
        </FormField>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={addNewProduct}
          disabled={!canSubmit(draft)}
          className="gap-2 px-5"
        >
          <Plus className="h-3.5 w-3.5" />
          {submitLabel}
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
