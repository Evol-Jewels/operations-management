import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ShopifyCollection } from "@/types/shopify-products";
import type { ShopifyProductFormState } from "./productFormUtils";

interface Props {
  state: ShopifyProductFormState;
  onChange: (state: ShopifyProductFormState) => void;
  collections: ShopifyCollection[];
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProductBasicsFields({ state, onChange, collections }: Props) {
  const [collectionSearch, setCollectionSearch] = useState("");
  const filteredCollections = useMemo(() => {
    const query = collectionSearch.trim().toLowerCase();
    return query
      ? collections.filter((collection) =>
          collection.title.toLowerCase().includes(query),
        )
      : collections;
  }, [collectionSearch, collections]);

  function update<K extends keyof ShopifyProductFormState>(
    key: K,
    value: ShopifyProductFormState[K],
  ) {
    onChange({ ...state, [key]: value });
  }

  function toggleCollection(id: string, checked: boolean) {
    update(
      "collectionIds",
      checked
        ? [...state.collectionIds, id]
        : state.collectionIds.filter((collectionId) => collectionId !== id),
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <h2 className="font-semibold">Product information</h2>
          <p className="text-sm text-muted-foreground">
            The customer-facing identity and description.
          </p>
        </div>
        <Field label="Title">
          <Input
            value={state.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Diamond halo ring"
            required
          />
        </Field>
        <Field
          label="Description"
          hint="HTML is supported and will be stored by Shopify."
        >
          <Textarea
            value={state.descriptionHtml}
            onChange={(event) => update("descriptionHtml", event.target.value)}
            placeholder="Describe materials, craftsmanship, and care details."
            className="min-h-40 resize-y"
          />
        </Field>
      </section>

      <section className="space-y-5 border-t pt-7">
        <div>
          <h2 className="font-semibold">Organization</h2>
          <p className="text-sm text-muted-foreground">
            Keep products searchable and grouped in Shopify.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor">
            <Input
              value={state.vendor}
              onChange={(event) => update("vendor", event.target.value)}
            />
          </Field>
          <Field label="Product type">
            <Input
              value={state.productType}
              onChange={(event) => update("productType", event.target.value)}
              placeholder="Ring, necklace, earrings..."
            />
          </Field>
        </div>
        <Field label="Tags" hint="Separate tags with commas.">
          <Input
            value={state.tagsText}
            onChange={(event) => update("tagsText", event.target.value)}
            placeholder="diamond, bridal, 18k"
          />
        </Field>
        <Field label={`Collections (${state.collectionIds.length} selected)`}>
          <div className="overflow-hidden rounded-lg border">
            <div className="relative border-b p-2">
              <Search className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={collectionSearch}
                onChange={(event) => setCollectionSearch(event.target.value)}
                placeholder="Find a collection"
                className="border-0 pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="grid max-h-52 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
              {filteredCollections.map((collection) => (
                <label
                  key={collection.id}
                  htmlFor={`collection-${collection.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    id={`collection-${collection.id}`}
                    checked={state.collectionIds.includes(collection.id)}
                    onCheckedChange={(checked) =>
                      toggleCollection(collection.id, checked === true)
                    }
                  />
                  <span className="truncate">{collection.title}</span>
                </label>
              ))}
              {!filteredCollections.length ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No collections found.
                </p>
              ) : null}
            </div>
          </div>
        </Field>
      </section>

      <section className="space-y-5 border-t pt-7">
        <div>
          <h2 className="font-semibold">Search engine listing</h2>
          <p className="text-sm text-muted-foreground">
            Optional overrides for search previews.
          </p>
        </div>
        <Field label="Page title">
          <Input
            value={state.seoTitle}
            onChange={(event) => update("seoTitle", event.target.value)}
            maxLength={70}
          />
        </Field>
        <Field label="Meta description">
          <Textarea
            value={state.seoDescription}
            onChange={(event) => update("seoDescription", event.target.value)}
            maxLength={320}
            className="min-h-24"
          />
        </Field>
        <Field
          label="URL handle"
          hint="Leave blank and Shopify will generate it from the title."
        >
          <Input
            value={state.handle}
            onChange={(event) => update("handle", event.target.value)}
            placeholder="diamond-halo-ring"
          />
        </Field>
      </section>
    </div>
  );
}
