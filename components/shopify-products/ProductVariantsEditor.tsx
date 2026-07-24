import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ShopifyVariantInput } from "@/types/shopify-products";
import {
  buildVariants,
  type ProductOptionDraft,
  type ShopifyProductFormState,
} from "./productFormUtils";

interface Props {
  state: ShopifyProductFormState;
  onChange: (state: ShopifyProductFormState) => void;
  allowOptionChanges: boolean;
}

function variantTitle(variant: ShopifyVariantInput) {
  return (
    variant.optionValues.map((option) => option.name).join(" / ") ||
    "Default variant"
  );
}

export function ProductVariantsEditor({
  state,
  onChange,
  allowOptionChanges,
}: Props) {
  function updateOptions(options: ProductOptionDraft[]) {
    onChange({
      ...state,
      options,
      variants: buildVariants(options, state.variants),
    });
  }

  function updateOption(index: number, patch: Partial<ProductOptionDraft>) {
    updateOptions(
      state.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  }

  function addOption() {
    if (state.options.length >= 3) return;
    updateOptions([...state.options, { name: "", valuesText: "" }]);
  }

  function removeOption(index: number) {
    updateOptions(
      state.options.filter((_, optionIndex) => optionIndex !== index),
    );
  }

  function updateVariant(index: number, patch: Partial<ShopifyVariantInput>) {
    onChange({
      ...state,
      variants: state.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Options and variants</h2>
          <p className="text-sm text-muted-foreground">
            Manage up to three option groups and the commercial details for
            every combination.
          </p>
        </div>
        {allowOptionChanges && state.options.length < 3 ? (
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus /> Add option
          </Button>
        ) : null}
      </div>

      {state.options.length ? (
        <div className="space-y-3 border-y bg-muted/20 py-4">
          {state.options.map((option, index) => (
            <div
              key={`${index}-${option.name}`}
              className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.8fr)_auto] sm:items-end"
            >
              <div className="space-y-2">
                <Label>Option name</Label>
                <Input
                  value={option.name}
                  onChange={(event) =>
                    updateOption(index, { name: event.target.value })
                  }
                  placeholder="Metal colour"
                  disabled={!allowOptionChanges}
                />
              </div>
              <div className="space-y-2">
                <Label>Values</Label>
                <Input
                  value={option.valuesText}
                  onChange={(event) =>
                    updateOption(index, { valuesText: event.target.value })
                  }
                  placeholder="Yellow Gold, Rose Gold, White Gold"
                  disabled={!allowOptionChanges}
                />
              </div>
              {allowOptionChanges ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeOption(index)}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Separate option values with commas.
          </p>
        </div>
      ) : allowOptionChanges ? (
        <button
          type="button"
          onClick={addOption}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-5 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="size-4" /> This product has options, such as size or
          metal colour
        </button>
      ) : null}

      <Table className="border-y">
        <TableHeader>
          <TableRow>
            <TableHead>Variant</TableHead>
            <TableHead className="min-w-32">Price</TableHead>
            <TableHead className="min-w-32">Compare at</TableHead>
            <TableHead className="min-w-36">SKU</TableHead>
            <TableHead className="min-w-36">Barcode</TableHead>
            <TableHead>Taxable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.variants.map((variant, index) => (
            <TableRow key={variant.id || `${variantTitle(variant)}-${index}`}>
              <TableCell className="font-medium">
                {variantTitle(variant)}
              </TableCell>
              <TableCell>
                <Input
                  value={variant.price ?? ""}
                  onChange={(event) =>
                    updateVariant(index, { price: event.target.value })
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={variant.compareAtPrice ?? ""}
                  onChange={(event) =>
                    updateVariant(index, {
                      compareAtPrice: event.target.value,
                    })
                  }
                  inputMode="decimal"
                  placeholder="Optional"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={variant.sku ?? ""}
                  onChange={(event) =>
                    updateVariant(index, { sku: event.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  value={variant.barcode ?? ""}
                  onChange={(event) =>
                    updateVariant(index, { barcode: event.target.value })
                  }
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={variant.taxable}
                  onCheckedChange={(checked) =>
                    updateVariant(index, { taxable: checked === true })
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!allowOptionChanges ? (
        <p className="text-xs text-muted-foreground">
          Variant option structure is managed in Shopify Admin; price, SKU,
          barcode, and tax settings can be updated here.
        </p>
      ) : null}
    </section>
  );
}
