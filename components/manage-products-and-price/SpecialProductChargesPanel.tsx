"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDeleteDialog,
  type DialogMode,
  EmptyState,
  ErrorPanel,
  FieldBlock,
  formatDate,
  formatMoneyValue,
  getErrorMessage,
  LoadingRows,
  MONEY_PATTERN,
  MobileList,
  MobileListItem,
  optionalCreateValue,
  optionalUpdateValue,
  RowActions,
  SectionShell,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSpecialProductMakingCharge,
  useDeleteSpecialProductMakingCharge,
  useSpecialProductMakingCharges,
  useUpdateSpecialProductMakingCharge,
} from "@/hooks/useSystemConfigs";
import type {
  CreateSpecialProductMakingChargeInput,
  SpecialProductMakingCharge,
  UpdateSpecialProductMakingChargeInput,
} from "@/types";

type SpecialMakingChargeDraft = {
  productCode: string;
  makingCost: string;
  notes: string;
};

const EMPTY_DRAFT: SpecialMakingChargeDraft = {
  productCode: "",
  makingCost: "",
  notes: "",
};

function validateDraft(draft: SpecialMakingChargeDraft) {
  const productCode = draft.productCode.trim();
  if (!productCode) return "Product code is required.";
  if (productCode.length > 255) {
    return "Product code must be 255 characters or less.";
  }
  if (!MONEY_PATTERN.test(draft.makingCost.trim())) {
    return "Making charge must be a valid amount.";
  }
  if (draft.notes.length > 10000) {
    return "Notes must be 10,000 characters or less.";
  }
  return null;
}

function SpecialMakingChargeDialog({
  mode,
  open,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: DialogMode;
  open: boolean;
  draft: SpecialMakingChargeDraft;
  isSubmitting: boolean;
  onDraftChange: (draft: SpecialMakingChargeDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit special making charge"
              : "Add special making charge"}
          </DialogTitle>
          <DialogDescription>
            Set a flat making charge override for a product code.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <FieldBlock label="Product code">
            <TextInput
              value={draft.productCode}
              onChange={(productCode) =>
                onDraftChange({
                  ...draft,
                  productCode: productCode.trimStart(),
                })
              }
              placeholder="EVOL123"
            />
          </FieldBlock>
          <FieldBlock label="Making charge">
            <TextInput
              value={draft.makingCost}
              onChange={(makingCost) => onDraftChange({ ...draft, makingCost })}
              placeholder="4000"
              inputMode="decimal"
            />
          </FieldBlock>
          <FieldBlock label="Notes">
            <Textarea
              value={draft.notes}
              onChange={(event) =>
                onDraftChange({ ...draft, notes: event.target.value })
              }
              placeholder="Optional note"
              className="min-h-24 resize-none"
            />
          </FieldBlock>
        </div>

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
                : "Adding..."
              : mode === "edit"
                ? "Save changes"
                : "Add charge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SpecialProductChargesPanel({ onBack }: { onBack: () => void }) {
  const chargesQuery = useSpecialProductMakingCharges();
  const createCharge = useCreateSpecialProductMakingCharge();
  const updateCharge = useUpdateSpecialProductMakingCharge();
  const deleteCharge = useDeleteSpecialProductMakingCharge();
  const [dialogMode, setDialogMode] = useState<DialogMode>("add");
  const [editingCharge, setEditingCharge] =
    useState<SpecialProductMakingCharge | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<SpecialMakingChargeDraft>(EMPTY_DRAFT);
  const [chargeToDelete, setChargeToDelete] =
    useState<SpecialProductMakingCharge | null>(null);
  const charges = chargesQuery.data ?? [];

  function openAddDialog() {
    setDialogMode("add");
    setEditingCharge(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  }

  function openEditDialog(charge: SpecialProductMakingCharge) {
    setDialogMode("edit");
    setEditingCharge(charge);
    setDraft({
      productCode: charge.productCode,
      makingCost: charge.makingCost,
      notes: charge.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function submitCharge() {
    const validationError = validateDraft(draft);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (dialogMode === "edit" && editingCharge) {
        const input: UpdateSpecialProductMakingChargeInput = {
          productCode: draft.productCode.trim(),
          makingCost: draft.makingCost.trim(),
          notes: optionalUpdateValue(draft.notes),
        };
        await updateCharge.mutateAsync({
          productCode: editingCharge.productCode,
          input,
        });
        toast.success("Special making charge updated");
      } else {
        const input: CreateSpecialProductMakingChargeInput = {
          productCode: draft.productCode.trim(),
          makingCost: draft.makingCost.trim(),
          notes: optionalCreateValue(draft.notes),
        };
        await createCharge.mutateAsync(input);
        toast.success("Special making charge added");
      }
      setDialogOpen(false);
      setEditingCharge(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save special charge"));
    }
  }

  async function confirmDeleteCharge() {
    if (!chargeToDelete) return;

    try {
      await deleteCharge.mutateAsync(chargeToDelete.productCode);
      setChargeToDelete(null);
      toast.success("Special making charge deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete special charge"));
    }
  }

  return (
    <SectionShell
      title="Special product making charges"
      description="Product-specific flat making charges override the default estimation making logic."
      onBack={onBack}
      backLabel="Back to system config"
      action={
        <Button type="button" onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Product</span>
        </Button>
      }
    >
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {chargesQuery.isLoading ? <LoadingRows /> : null}
        {chargesQuery.isError ? (
          <ErrorPanel
            message={getErrorMessage(
              chargesQuery.error,
              "Could not load special product making charges.",
            )}
            onRetry={() => void chargesQuery.refetch()}
          />
        ) : null}
        {!chargesQuery.isLoading && !chargesQuery.isError ? (
          charges.length === 0 ? (
            <EmptyState
              message="No special product making charges configured."
              action={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={openAddDialog}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add first product
                </Button>
              }
            />
          ) : (
            <>
              <MobileList>
                {charges.map((charge) => (
                  <MobileListItem
                    key={charge.id}
                    title={charge.productCode}
                    aside={
                      <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums">
                        {formatMoneyValue(charge.makingCost)}
                      </span>
                    }
                    details={
                      <p className="line-clamp-2 text-xs">
                        {charge.notes || "No notes"}
                      </p>
                    }
                    actions={
                      <RowActions
                        label={charge.productCode}
                        onEdit={() => openEditDialog(charge)}
                        onDelete={() => setChargeToDelete(charge)}
                      />
                    }
                  />
                ))}
              </MobileList>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Code</TableHead>
                    <TableHead>Making Charge</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Updated
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">
                        {charge.productCode}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatMoneyValue(charge.makingCost)}
                      </TableCell>
                      <TableCell className="max-w-56 truncate lg:max-w-72">
                        {charge.notes || "No notes"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatDate(charge.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          label={charge.productCode}
                          onEdit={() => openEditDialog(charge)}
                          onDelete={() => setChargeToDelete(charge)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )
        ) : null}
      </div>

      <SpecialMakingChargeDialog
        mode={dialogMode}
        open={dialogOpen}
        draft={draft}
        isSubmitting={createCharge.isPending || updateCharge.isPending}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCharge(null);
        }}
        onSubmit={submitCharge}
      />

      <ConfirmDeleteDialog
        open={!!chargeToDelete}
        title="Delete special making charge?"
        description={`This removes the flat making charge override for ${chargeToDelete?.productCode ?? "this product"}.`}
        isPending={deleteCharge.isPending}
        onCancel={() => setChargeToDelete(null)}
        onConfirm={confirmDeleteCharge}
      />
    </SectionShell>
  );
}
