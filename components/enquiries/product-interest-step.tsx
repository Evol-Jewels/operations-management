import { Pencil, Plus, ScanLine, Search, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { BarcodeScanDialog } from "@/components/calculator/BarcodeScanDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CustomProductForm } from "./custom-product-form";
import type { NewProduct, Product, ProductAddMode } from "./enquiry-form-types";
import { formatMetalTypeLabel, ProductThumbnail } from "./enquiry-form-utils";
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
