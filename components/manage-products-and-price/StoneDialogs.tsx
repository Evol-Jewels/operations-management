"use client";

import {
  type DialogMode,
  FieldBlock,
  TextInput,
} from "@/components/manage-products-and-price/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type StoneDraft = {
  name: string;
  category: "Diamond" | "Gemstone";
};

export type SlabDraft = {
  code: string;
  rangeFrom: string;
  rangeTo: string;
  pricePerCarat: string;
  notes: string;
};

type DialogProps<T> = {
  mode: DialogMode | null;
  draft: T | null;
  isSubmitting: boolean;
  onDraftChange: (draft: T) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
};

function SubmitFooter({
  mode,
  isSubmitting,
  addLabel,
  onSubmit,
}: {
  mode: DialogMode | null;
  isSubmitting: boolean;
  addLabel: string;
  onSubmit: () => void;
}) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </Button>
      </DialogClose>
      <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
        {isSubmitting
          ? mode === "edit"
            ? "Saving..."
            : "Creating..."
          : mode === "edit"
            ? "Save Changes"
            : addLabel}
      </Button>
    </DialogFooter>
  );
}

export function StoneDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: DialogProps<StoneDraft>) {
  return (
    <Dialog open={!!mode && !!draft} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Stone Type" : "Add Stone Type"}
          </DialogTitle>
          <DialogDescription>
            Stone type names are used to group slab pricing ranges.
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            <FieldBlock label="Name">
              <TextInput
                value={draft.name}
                onChange={(name) => onDraftChange({ ...draft, name })}
              />
            </FieldBlock>
            <FieldBlock label="Type">
              <Select
                value={draft.category}
                onValueChange={(category) =>
                  onDraftChange({
                    ...draft,
                    category: category as StoneDraft["category"],
                  })
                }
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                  <SelectItem value="Gemstone">Gemstone</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>
          </div>
        ) : null}

        <SubmitFooter
          mode={mode}
          isSubmitting={isSubmitting}
          addLabel="Add Stone"
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export function SlabDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: DialogProps<SlabDraft>) {
  return (
    <Dialog open={!!mode && !!draft} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Slab" : "Add Slab"}
          </DialogTitle>
          <DialogDescription>
            Manage a per-carat price range for the selected stone type.
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <div className="grid grid-cols-2 gap-5 py-2">
            <div className="col-span-2 md:col-span-1">
              <FieldBlock label="Code">
                <TextInput
                  value={draft.code}
                  onChange={(code) => onDraftChange({ ...draft, code })}
                />
              </FieldBlock>
            </div>
            <div className="col-span-2 md:col-span-1">
              <FieldBlock label="Price / ct">
                <TextInput
                  value={draft.pricePerCarat}
                  onChange={(pricePerCarat) =>
                    onDraftChange({ ...draft, pricePerCarat })
                  }
                  placeholder="10000.00"
                  inputMode="decimal"
                />
              </FieldBlock>
            </div>
            <FieldBlock label="From ct">
              <TextInput
                value={draft.rangeFrom}
                onChange={(rangeFrom) => onDraftChange({ ...draft, rangeFrom })}
                placeholder="0.000"
                inputMode="decimal"
              />
            </FieldBlock>
            <FieldBlock label="To ct">
              <TextInput
                value={draft.rangeTo}
                onChange={(rangeTo) => onDraftChange({ ...draft, rangeTo })}
                placeholder="0.100"
                inputMode="decimal"
              />
            </FieldBlock>
            <div className="col-span-2">
              <FieldBlock label="Notes">
                <Textarea
                  value={draft.notes}
                  onChange={(event) =>
                    onDraftChange({ ...draft, notes: event.target.value })
                  }
                  className="min-h-24 resize-none"
                />
              </FieldBlock>
            </div>
          </div>
        ) : null}

        <SubmitFooter
          mode={mode}
          isSubmitting={isSubmitting}
          addLabel="Add Slab"
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
