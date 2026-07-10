import { ArrowLeft, Link2, Plus, Trash2, Upload, Video, X } from "lucide-react";
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
import { useStoneTypes } from "@/hooks/useManageProducts";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  createEmptyNewProductStone,
  hasValidCustomProductRequirement,
  METAL_PURITIES,
  METAL_TYPES,
  type NewProduct,
  type ProductReference,
} from "./enquiry-form-types";
import { formatFileSize, getReferenceIcon } from "./enquiry-form-utils";

const STONE_TYPE_FALLBACK = ["Others"];

interface CustomProductFormProps {
  draft: NewProduct;
  setDraft: React.Dispatch<React.SetStateAction<NewProduct>>;
  referenceLinkInput: string;
  setReferenceLinkInput: (value: string) => void;
  referenceError: string;
  setReferenceError: (value: string) => void;
  addReferenceLink: () => void;
  addReferenceFiles: (files: FileList | null) => void;
  removeDraftReference: (id: string) => void;
  addNewProduct: () => void;
  onCancel: () => void;
  submitLabel?: string;
  canSubmit?: (draft: NewProduct) => boolean;
  showActions?: boolean;
  showBackButton?: boolean;
}

export function CustomProductForm({
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
  showActions = true,
  showBackButton = true,
}: CustomProductFormProps) {
  const stoneTypesQuery = useStoneTypes({ limit: 1000 });

  const stoneTypeOptions: readonly string[] = (() => {
    if (stoneTypesQuery.isError) return STONE_TYPE_FALLBACK;
    const list = stoneTypesQuery.data?.data ?? [];
    const active = list
      .filter((item) => !item.isDeleted)
      .map((item) => item.name);
    const names = Array.from(new Set([...active, "Others"])).sort((a, b) =>
      a.localeCompare(b),
    );
    return names;
  })();

  const showStoneLoadingState =
    stoneTypesQuery.isLoading && stoneTypeOptions.length === 0;

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
      <ModeHeader
        label="Describe a custom product"
        onBack={onCancel}
        showBackButton={showBackButton}
      />
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
                      {showStoneLoadingState ? (
                        <SelectItem value="__loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        stoneTypeOptions.map((stoneType) => (
                          <SelectItem key={stoneType} value={stoneType}>
                            {stoneType}
                          </SelectItem>
                        ))
                      )}
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

      {showActions && (
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
      )}
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

function ModeHeader({
  label,
  onBack,
  showBackButton = true,
}: {
  label: string;
  onBack: () => void;
  showBackButton?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {showBackButton && (
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
      )}
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
