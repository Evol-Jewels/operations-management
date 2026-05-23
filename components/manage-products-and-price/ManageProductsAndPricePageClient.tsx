"use client";

import {
  ArrowLeft,
  CircleDollarSign,
  Layers3,
  Pencil,
  Percent,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  useCreateMetal,
  useCreateStoneSlab,
  useCreateStoneType,
  useDeleteMetal,
  useDeleteStoneSlab,
  useDeleteStoneType,
  useMetals,
  useStoneSlabs,
  useStoneTypes,
  useUpdateMetal,
  useUpdateStoneSlab,
  useUpdateStoneType,
} from "@/hooks/useManageProducts";
import { formatCurrency } from "@/lib/utils";
import type {
  CreateMetalInput,
  CreateStoneSlabInput,
  MetalResponse,
  StoneSlabResponse,
  StoneTypeResponse,
  UpdateMetalInput,
  UpdateStoneSlabInput,
} from "@/types/manage-products-api";

type ManageSection = "overview" | "metals" | "stones-slabs" | "misc";
type DialogMode = "add" | "edit";

type MiscSettings = {
  makingChargeFlat: number;
  makingChargePerGram: number;
  gstRate: number;
};

type MetalDraft = {
  name: string;
  type: string;
  percentage: string;
  ratePerGram: string;
  notes: string;
};

type StoneDraft = {
  name: string;
};

type SlabDraft = {
  code: string;
  rangeFrom: string;
  rangeTo: string;
  pricePerCarat: string;
  notes: string;
};

const LIST_QUERY = { limit: 50, offset: 0 };
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const WEIGHT_PATTERN = /^\d+(\.\d{1,3})?$/;
const PERCENTAGE_PATTERN = /^\d+(\.\d{1,2})?$/;

function toNumber(value: string) {
  return Number(value) || 0;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoneyValue(value: string | null) {
  if (!value) return "Not set";
  return `${formatCurrency(Number(value))}`;
}

function optionalCreateValue(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalUpdateValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function SectionShell({
  icon,
  title,
  description,
  onBack,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="shrink-0 space-y-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to categories
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function FieldBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </Label>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = "0.001",
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      onChange={(event) => onChange(toNumber(event.target.value))}
      className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0"
    />
  );
}

function OverviewCard({
  icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-36 cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 text-foreground">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <span className="mt-auto pt-5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {meta}
      </span>
    </button>
  );
}

function LoadingRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={`loading-row-${count}-${index + 1}`}
          className="h-14 w-full rounded-lg"
        />
      ))}
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-3 gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function Overview({
  miscSettings,
  metalsTotal,
  stoneTypesTotal,
  slabTotal,
  loadingCounts,
  onSelect,
}: {
  miscSettings: MiscSettings;
  metalsTotal: number;
  stoneTypesTotal: number;
  slabTotal: number;
  loadingCounts: boolean;
  onSelect: (section: ManageSection) => void;
}) {
  const countMeta = loadingCounts
    ? "Loading..."
    : `${stoneTypesTotal} stones, ${slabTotal} slabs`;

  return (
    <div className="space-y-6 overflow-y-auto pr-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Manage Products & Pricing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage backend pricing records for metals, stone types, and stone slab
          ranges.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Metals"
          description="Manage metal names, purity percentages, and per-gram rates."
          meta={loadingCounts ? "Loading..." : `${metalsTotal} metals`}
          onClick={() => onSelect("metals")}
        />
        <OverviewCard
          icon={<Layers3 className="h-5 w-5" />}
          title="Stones & Slabs"
          description="Manage stone types and their per-carat slab ranges."
          meta={countMeta}
          onClick={() => onSelect("stones-slabs")}
        />
        <OverviewCard
          icon={<ReceiptText className="h-5 w-5" />}
          title="Miscellaneous"
          description="Local GST and making cost rules."
          meta={`${miscSettings.gstRate * 100}% GST`}
          onClick={() => onSelect("misc")}
        />
      </div>
    </div>
  );
}

function MetalDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: DialogMode | null;
  draft: MetalDraft | null;
  isSubmitting: boolean;
  onDraftChange: (draft: MetalDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const open = !!mode && !!draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Metal" : "Add Metal"}
          </DialogTitle>
          <DialogDescription>
            Manage the metal name, type, purity percentage, and per-gram rate.
          </DialogDescription>
        </DialogHeader>

        {draft ? (
          <div className="grid gap-5 py-2 md:grid-cols-2">
            <FieldBlock label="Name">
              <TextInput
                value={draft.name}
                onChange={(name) => onDraftChange({ ...draft, name })}
              />
            </FieldBlock>
            <FieldBlock label="Type">
              <TextInput
                value={draft.type}
                onChange={(type) => onDraftChange({ ...draft, type })}
                placeholder="Gold, Platinum, Silver"
              />
            </FieldBlock>
            <FieldBlock label="Percentage">
              <TextInput
                value={draft.percentage}
                onChange={(percentage) =>
                  onDraftChange({ ...draft, percentage })
                }
                placeholder="91.60"
              />
            </FieldBlock>
            <FieldBlock label="Rate / gram">
              <TextInput
                value={draft.ratePerGram}
                onChange={(ratePerGram) =>
                  onDraftChange({ ...draft, ratePerGram })
                }
                placeholder="10000.00"
              />
            </FieldBlock>
            <div className="md:col-span-2">
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
                : "Add Metal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetalsEditor({ onBack }: { onBack: () => void }) {
  const metalsQuery = useMetals(LIST_QUERY);
  const createMetal = useCreateMetal();
  const updateMetal = useUpdateMetal();
  const deleteMetal = useDeleteMetal();
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editingMetal, setEditingMetal] = useState<MetalResponse | null>(null);
  const [draft, setDraft] = useState<MetalDraft | null>(null);
  const [metalToDelete, setMetalToDelete] = useState<MetalResponse | null>(
    null,
  );
  const metals = metalsQuery.data?.data ?? [];
  const isSubmitting =
    createMetal.isPending || updateMetal.isPending || deleteMetal.isPending;

  function closeDialog() {
    setDialogMode(null);
    setEditingMetal(null);
    setDraft(null);
  }

  function openAddDialog() {
    setEditingMetal(null);
    setDraft({
      name: "",
      type: "",
      percentage: "",
      ratePerGram: "",
      notes: "",
    });
    setDialogMode("add");
  }

  function openEditDialog(metal: MetalResponse) {
    setEditingMetal(metal);
    setDraft({
      name: metal.name,
      type: metal.type ?? "",
      percentage: metal.percentage ?? "",
      ratePerGram: metal.ratePerGram ?? "",
      notes: metal.notes ?? "",
    });
    setDialogMode("edit");
  }

  function validateDraft(currentDraft: MetalDraft) {
    const name = currentDraft.name.trim();
    const type = currentDraft.type.trim();
    const percentage = currentDraft.percentage.trim();
    const ratePerGram = currentDraft.ratePerGram.trim();

    if (!name) {
      toast.error("Metal name is required.");
      return false;
    }
    if (name.length > 255) {
      toast.error("Metal name must be 255 characters or less.");
      return false;
    }
    if (type.length > 50) {
      toast.error("Metal type must be 50 characters or less.");
      return false;
    }
    if (percentage && !PERCENTAGE_PATTERN.test(percentage)) {
      toast.error("Percentage must have up to 2 decimal places.");
      return false;
    }
    if (percentage && Number(percentage) > 100) {
      toast.error("Percentage must be between 0 and 100.");
      return false;
    }
    if (ratePerGram && !MONEY_PATTERN.test(ratePerGram)) {
      toast.error("Rate / gram must have up to 2 decimal places.");
      return false;
    }
    if (currentDraft.notes.length > 10000) {
      toast.error("Notes must be 10,000 characters or less.");
      return false;
    }

    return true;
  }

  async function submitDialog() {
    if (!draft || !dialogMode || !validateDraft(draft)) return;

    try {
      if (dialogMode === "add") {
        const input: CreateMetalInput = {
          name: draft.name.trim(),
          type: optionalCreateValue(draft.type),
          percentage: optionalCreateValue(draft.percentage),
          ratePerGram: optionalCreateValue(draft.ratePerGram),
          notes: optionalCreateValue(draft.notes),
        };
        await createMetal.mutateAsync(input);
        toast.success("Metal created");
      } else if (editingMetal) {
        const input: UpdateMetalInput = {
          name: draft.name.trim(),
          type: optionalUpdateValue(draft.type),
          percentage: optionalUpdateValue(draft.percentage),
          ratePerGram: optionalUpdateValue(draft.ratePerGram),
          notes: optionalUpdateValue(draft.notes),
        };
        await updateMetal.mutateAsync({ id: editingMetal.id, input });
        toast.success("Metal updated");
      }
      closeDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save metal"));
    }
  }

  async function confirmDeleteMetal() {
    if (!metalToDelete) return;

    try {
      await deleteMetal.mutateAsync(metalToDelete.id);
      setMetalToDelete(null);
      toast.success("Metal deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete metal"));
    }
  }

  return (
    <SectionShell
      icon={<CircleDollarSign className="h-5 w-5" />}
      title="Metals"
      description="Manage metal records used by pricing and estimates."
      onBack={onBack}
    >
      <Card className="h-full overflow-hidden py-0">
        <CardContent className="flex h-full min-h-0 flex-col gap-5 p-5 lg:p-6">
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Metal Records
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {metals.length} of {metalsQuery.data?.total ?? 0} loaded
              </p>
            </div>
            <Button type="button" onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Metal
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {metalsQuery.isLoading ? <LoadingRows /> : null}
            {metalsQuery.isError ? (
              <ErrorPanel
                message={getErrorMessage(
                  metalsQuery.error,
                  "Could not load metals.",
                )}
                onRetry={() => void metalsQuery.refetch()}
              />
            ) : null}
            {!metalsQuery.isLoading && !metalsQuery.isError ? (
              metals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No metals configured.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={openAddDialog}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Metal
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Rate / g</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metals.map((metal) => (
                      <TableRow key={metal.id}>
                        <TableCell className="font-medium">
                          {metal.name}
                        </TableCell>
                        <TableCell>{metal.type || "Not set"}</TableCell>
                        <TableCell>
                          {metal.percentage
                            ? `${metal.percentage}%`
                            : "Not set"}
                        </TableCell>
                        <TableCell>
                          {formatMoneyValue(metal.ratePerGram)}
                        </TableCell>
                        <TableCell className="max-w-64 truncate">
                          {metal.notes || "No notes"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(metal.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditDialog(metal)}
                              aria-label={`Edit ${metal.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setMetalToDelete(metal)}
                              aria-label={`Delete ${metal.name}`}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : null}
          </div>
        </CardContent>
      </Card>

      <MetalDialog
        mode={dialogMode}
        draft={draft}
        isSubmitting={isSubmitting}
        onDraftChange={setDraft}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSubmit={submitDialog}
      />

      <AlertDialog
        open={!!metalToDelete}
        onOpenChange={(open) => {
          if (!open) setMetalToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete metal?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {metalToDelete?.name ?? "this metal"} from the active
              pricing list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMetal.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMetal}
              disabled={deleteMetal.isPending}
            >
              {deleteMetal.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  );
}

function StoneDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: DialogMode | null;
  draft: StoneDraft | null;
  isSubmitting: boolean;
  onDraftChange: (draft: StoneDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const open = !!mode && !!draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <FieldBlock label="Name">
            <TextInput
              value={draft.name}
              onChange={(name) => onDraftChange({ ...draft, name })}
            />
          </FieldBlock>
        ) : null}

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
                : "Add Stone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlabDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: DialogMode | null;
  draft: SlabDraft | null;
  isSubmitting: boolean;
  onDraftChange: (draft: SlabDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const open = !!mode && !!draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <div className="grid gap-5 py-2 md:grid-cols-2">
            <FieldBlock label="Code">
              <TextInput
                value={draft.code}
                onChange={(code) => onDraftChange({ ...draft, code })}
              />
            </FieldBlock>
            <FieldBlock label="From ct">
              <TextInput
                value={draft.rangeFrom}
                onChange={(rangeFrom) => onDraftChange({ ...draft, rangeFrom })}
                placeholder="0.000"
              />
            </FieldBlock>
            <FieldBlock label="To ct">
              <TextInput
                value={draft.rangeTo}
                onChange={(rangeTo) => onDraftChange({ ...draft, rangeTo })}
                placeholder="0.100"
              />
            </FieldBlock>
            <FieldBlock label="Price / ct">
              <TextInput
                value={draft.pricePerCarat}
                onChange={(pricePerCarat) =>
                  onDraftChange({ ...draft, pricePerCarat })
                }
                placeholder="10000.00"
              />
            </FieldBlock>
            <div className="md:col-span-2">
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
                : "Add Slab"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StonesAndSlabsEditor({ onBack }: { onBack: () => void }) {
  const stoneTypesQuery = useStoneTypes(LIST_QUERY);
  const allSlabsQuery = useStoneSlabs(LIST_QUERY);
  const [selectedStoneId, setSelectedStoneId] = useState<string | null>(null);
  const selectedSlabsQuery = useStoneSlabs(
    { ...LIST_QUERY, stoneTypeId: selectedStoneId ?? undefined },
    Boolean(selectedStoneId),
  );
  const createStoneType = useCreateStoneType();
  const updateStoneType = useUpdateStoneType();
  const deleteStoneType = useDeleteStoneType();
  const createStoneSlab = useCreateStoneSlab();
  const updateStoneSlab = useUpdateStoneSlab();
  const deleteStoneSlab = useDeleteStoneSlab();
  const [stoneDialogMode, setStoneDialogMode] = useState<DialogMode | null>(
    null,
  );
  const [editingStone, setEditingStone] = useState<StoneTypeResponse | null>(
    null,
  );
  const [stoneDraft, setStoneDraft] = useState<StoneDraft | null>(null);
  const [stoneToDelete, setStoneToDelete] = useState<StoneTypeResponse | null>(
    null,
  );
  const [slabDialogMode, setSlabDialogMode] = useState<DialogMode | null>(null);
  const [editingSlab, setEditingSlab] = useState<StoneSlabResponse | null>(
    null,
  );
  const [slabDraft, setSlabDraft] = useState<SlabDraft | null>(null);
  const [slabToDelete, setSlabToDelete] = useState<StoneSlabResponse | null>(
    null,
  );
  const stoneTypes = stoneTypesQuery.data?.data ?? [];
  const selectedStone =
    stoneTypes.find((stone) => stone.id === selectedStoneId) ??
    stoneTypes[0] ??
    null;
  const selectedSlabs = selectedSlabsQuery.data?.data ?? [];
  const allSlabs = allSlabsQuery.data?.data ?? [];
  const slabCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slab of allSlabs) {
      counts.set(slab.stoneTypeId, (counts.get(slab.stoneTypeId) ?? 0) + 1);
    }
    return counts;
  }, [allSlabs]);
  const isSubmitting =
    createStoneType.isPending ||
    updateStoneType.isPending ||
    deleteStoneType.isPending ||
    createStoneSlab.isPending ||
    updateStoneSlab.isPending ||
    deleteStoneSlab.isPending;

  useEffect(() => {
    if (stoneTypes.length === 0) {
      setSelectedStoneId(null);
      return;
    }
    if (
      !selectedStoneId ||
      !stoneTypes.some((stone) => stone.id === selectedStoneId)
    ) {
      setSelectedStoneId(stoneTypes[0].id);
    }
  }, [selectedStoneId, stoneTypes]);

  function closeStoneDialog() {
    setStoneDialogMode(null);
    setEditingStone(null);
    setStoneDraft(null);
  }

  function openAddStoneDialog() {
    setEditingStone(null);
    setStoneDraft({ name: "" });
    setStoneDialogMode("add");
  }

  function openEditStoneDialog(stone: StoneTypeResponse) {
    setEditingStone(stone);
    setStoneDraft({ name: stone.name });
    setStoneDialogMode("edit");
  }

  function validateStoneDraft(currentDraft: StoneDraft) {
    const name = currentDraft.name.trim();
    if (!name) {
      toast.error("Stone type name is required.");
      return false;
    }
    if (name.length > 255) {
      toast.error("Stone type name must be 255 characters or less.");
      return false;
    }
    return true;
  }

  async function submitStoneDialog() {
    if (!stoneDraft || !stoneDialogMode || !validateStoneDraft(stoneDraft)) {
      return;
    }

    try {
      if (stoneDialogMode === "add") {
        const stone = await createStoneType.mutateAsync({
          name: stoneDraft.name.trim(),
        });
        setSelectedStoneId(stone.id);
        toast.success("Stone type created");
      } else if (editingStone) {
        const stone = await updateStoneType.mutateAsync({
          id: editingStone.id,
          input: { name: stoneDraft.name.trim() },
        });
        setSelectedStoneId(stone.id);
        toast.success("Stone type updated");
      }
      closeStoneDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save stone type"));
    }
  }

  async function confirmDeleteStone() {
    if (!stoneToDelete) return;

    try {
      await deleteStoneType.mutateAsync(stoneToDelete.id);
      setStoneToDelete(null);
      toast.success("Stone type deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete stone type"));
    }
  }

  function closeSlabDialog() {
    setSlabDialogMode(null);
    setEditingSlab(null);
    setSlabDraft(null);
  }

  function openAddSlabDialog() {
    if (!selectedStone) {
      toast.error("Select a stone type before adding a slab.");
      return;
    }
    setEditingSlab(null);
    setSlabDraft({
      code: "",
      rangeFrom: "",
      rangeTo: "",
      pricePerCarat: "",
      notes: "",
    });
    setSlabDialogMode("add");
  }

  function openEditSlabDialog(slab: StoneSlabResponse) {
    setEditingSlab(slab);
    setSlabDraft({
      code: slab.code,
      rangeFrom: slab.rangeFrom,
      rangeTo: slab.rangeTo,
      pricePerCarat: slab.pricePerCarat,
      notes: slab.notes ?? "",
    });
    setSlabDialogMode("edit");
  }

  function validateSlabDraft(currentDraft: SlabDraft) {
    const code = currentDraft.code.trim();
    const rangeFrom = currentDraft.rangeFrom.trim();
    const rangeTo = currentDraft.rangeTo.trim();
    const pricePerCarat = currentDraft.pricePerCarat.trim();

    if (!code) {
      toast.error("Slab code is required.");
      return false;
    }
    if (!WEIGHT_PATTERN.test(rangeFrom) || !WEIGHT_PATTERN.test(rangeTo)) {
      toast.error("Slab ranges must have up to 3 decimal places.");
      return false;
    }
    if (Number(rangeTo) <= Number(rangeFrom)) {
      toast.error("To ct must be greater than From ct.");
      return false;
    }
    if (!MONEY_PATTERN.test(pricePerCarat)) {
      toast.error("Price / ct must have up to 2 decimal places.");
      return false;
    }
    if (currentDraft.notes.length > 10000) {
      toast.error("Notes must be 10,000 characters or less.");
      return false;
    }
    return true;
  }

  async function submitSlabDialog() {
    if (
      !selectedStone ||
      !slabDraft ||
      !slabDialogMode ||
      !validateSlabDraft(slabDraft)
    ) {
      return;
    }

    try {
      if (slabDialogMode === "add") {
        const input: CreateStoneSlabInput = {
          stoneTypeId: selectedStone.id,
          code: slabDraft.code.trim(),
          rangeFrom: slabDraft.rangeFrom.trim(),
          rangeTo: slabDraft.rangeTo.trim(),
          pricePerCarat: slabDraft.pricePerCarat.trim(),
          notes: optionalCreateValue(slabDraft.notes),
        };
        await createStoneSlab.mutateAsync(input);
        toast.success("Slab created");
      } else if (editingSlab) {
        const input: UpdateStoneSlabInput = {
          code: slabDraft.code.trim(),
          rangeFrom: slabDraft.rangeFrom.trim(),
          rangeTo: slabDraft.rangeTo.trim(),
          pricePerCarat: slabDraft.pricePerCarat.trim(),
          notes: optionalUpdateValue(slabDraft.notes),
        };
        await updateStoneSlab.mutateAsync({ id: editingSlab.id, input });
        toast.success("Slab updated");
      }
      closeSlabDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save slab"));
    }
  }

  async function confirmDeleteSlab() {
    if (!slabToDelete) return;

    try {
      await deleteStoneSlab.mutateAsync(slabToDelete.id);
      setSlabToDelete(null);
      toast.success("Slab deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete slab"));
    }
  }

  return (
    <SectionShell
      icon={<Layers3 className="h-5 w-5" />}
      title="Stones & Slabs"
      description="Manage stone types on the left and slab pricing for the selected stone on the right."
      onBack={onBack}
    >
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="min-h-0 overflow-hidden py-0">
          <CardContent className="flex h-full min-h-0 flex-col gap-4 p-5 lg:p-6">
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Stone Types
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stoneTypes.length} of {stoneTypesQuery.data?.total ?? 0}{" "}
                  loaded
                </p>
              </div>
              <Button
                type="button"
                onClick={openAddStoneDialog}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-1">
              {stoneTypesQuery.isLoading ? <LoadingRows /> : null}
              {stoneTypesQuery.isError ? (
                <ErrorPanel
                  message={getErrorMessage(
                    stoneTypesQuery.error,
                    "Could not load stone types.",
                  )}
                  onRetry={() => void stoneTypesQuery.refetch()}
                />
              ) : null}
              {!stoneTypesQuery.isLoading && !stoneTypesQuery.isError ? (
                stoneTypes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No stone types configured.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={openAddStoneDialog}
                      className="mt-3 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Stone
                    </Button>
                  </div>
                ) : (
                  stoneTypes.map((stone) => {
                    const selected = stone.id === selectedStone?.id;

                    return (
                      <div
                        key={stone.id}
                        className={
                          selected
                            ? "relative rounded-2xl border border-foreground bg-foreground text-background"
                            : "relative rounded-2xl border border-border bg-muted/20"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedStoneId(stone.id)}
                          className="block w-full cursor-pointer rounded-2xl p-4 pr-24 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        >
                          <p className="break-words font-semibold">
                            {stone.name}
                          </p>
                          <p
                            className={
                              selected
                                ? "mt-1 truncate text-xs text-background/70"
                                : "mt-1 truncate text-xs text-muted-foreground"
                            }
                          >
                            {stone.id}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={selected ? "outline" : "secondary"}
                              className={
                                selected
                                  ? "border-background/25 text-background"
                                  : undefined
                              }
                            >
                              Stone type
                            </Badge>
                            <span
                              className={
                                selected
                                  ? "text-xs text-background/70"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              {slabCounts.get(stone.id) ?? 0} slabs
                            </span>
                          </div>
                        </button>
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditStoneDialog(stone)}
                            aria-label={`Edit ${stone.name}`}
                            className={
                              selected
                                ? "text-background/70 hover:bg-background/10 hover:text-background"
                                : "text-muted-foreground hover:text-foreground"
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setStoneToDelete(stone)}
                            aria-label={`Delete ${stone.name}`}
                            className={
                              selected
                                ? "text-background/70 hover:bg-background/10 hover:text-background"
                                : "text-muted-foreground hover:text-destructive"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 overflow-hidden py-0">
          <CardContent className="flex h-full min-h-0 flex-col gap-5 p-5 lg:p-6">
            {selectedStone ? (
              <>
                <div className="shrink-0 space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold text-foreground">
                        {selectedStone.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedStone.id}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={openAddSlabDialog}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Slab
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Pricing Slabs
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedSlabs.length} of{" "}
                      {selectedSlabsQuery.data?.total ?? 0} slabs loaded
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {selectedSlabsQuery.isLoading ? <LoadingRows /> : null}
                  {selectedSlabsQuery.isError ? (
                    <ErrorPanel
                      message={getErrorMessage(
                        selectedSlabsQuery.error,
                        "Could not load slabs.",
                      )}
                      onRetry={() => void selectedSlabsQuery.refetch()}
                    />
                  ) : null}
                  {!selectedSlabsQuery.isLoading &&
                  !selectedSlabsQuery.isError ? (
                    selectedSlabs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-10 text-center">
                        <p className="text-sm text-muted-foreground">
                          No slabs configured for this stone.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={openAddSlabDialog}
                          className="mt-3 gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add first slab
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Range</TableHead>
                            <TableHead>Price / ct</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSlabs.map((slab) => (
                            <TableRow key={slab.id}>
                              <TableCell className="font-medium">
                                {slab.code}
                              </TableCell>
                              <TableCell>
                                {slab.rangeFrom} - {slab.rangeTo} ct
                              </TableCell>
                              <TableCell>
                                {formatMoneyValue(slab.pricePerCarat)}
                              </TableCell>
                              <TableCell className="max-w-64 truncate">
                                {slab.notes || "No notes"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(slab.updatedAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => openEditSlabDialog(slab)}
                                    aria-label={`Edit slab ${slab.code}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setSlabToDelete(slab)}
                                    aria-label={`Delete slab ${slab.code}`}
                                    className="text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border text-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Add a stone type before managing slabs.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={openAddStoneDialog}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stone
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StoneDialog
        mode={stoneDialogMode}
        draft={stoneDraft}
        isSubmitting={isSubmitting}
        onDraftChange={setStoneDraft}
        onOpenChange={(open) => {
          if (!open) closeStoneDialog();
        }}
        onSubmit={submitStoneDialog}
      />

      <SlabDialog
        mode={slabDialogMode}
        draft={slabDraft}
        isSubmitting={isSubmitting}
        onDraftChange={setSlabDraft}
        onOpenChange={(open) => {
          if (!open) closeSlabDialog();
        }}
        onSubmit={submitSlabDialog}
      />

      <AlertDialog
        open={!!stoneToDelete}
        onOpenChange={(open) => {
          if (!open) setStoneToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stone type?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {stoneToDelete?.name ?? "this stone type"} from the
              active stone list. Attached slab pricing may also be affected by
              the backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStoneType.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStone}
              disabled={deleteStoneType.isPending}
            >
              {deleteStoneType.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!slabToDelete}
        onOpenChange={(open) => {
          if (!open) setSlabToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete slab?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes slab {slabToDelete?.code ?? ""} from the active
              pricing list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStoneSlab.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSlab}
              disabled={deleteStoneSlab.isPending}
            >
              {deleteStoneSlab.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  );
}

function MiscEditor({
  settings,
  onChange,
  onBack,
}: {
  settings: MiscSettings;
  onChange: (settings: MiscSettings) => void;
  onBack: () => void;
}) {
  return (
    <SectionShell
      icon={<ReceiptText className="h-5 w-5" />}
      title="Miscellaneous"
      description="Manage local GST and making cost values used by the calculator."
      onBack={onBack}
    >
      <Card className="h-full overflow-hidden py-0">
        <CardContent className="h-full space-y-6 overflow-y-auto p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <FieldBlock label="GST percentage">
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.gstRate * 100}
                  step="0.1"
                  onChange={(value) =>
                    onChange({ ...settings, gstRate: value / 100 })
                  }
                />
                <Percent className="mb-2 h-4 w-4 text-muted-foreground" />
              </div>
            </FieldBlock>
            <FieldBlock
              label="Making flat fee"
              description="Flat fee for small products."
            >
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.makingChargeFlat}
                  onChange={(makingChargeFlat) =>
                    onChange({ ...settings, makingChargeFlat })
                  }
                />
                <span className="pb-2 text-sm text-muted-foreground">INR</span>
              </div>
            </FieldBlock>
            <FieldBlock
              label="Making per gram"
              description="Rate applied per gram."
            >
              <div className="flex items-end gap-3">
                <NumberInput
                  value={settings.makingChargePerGram}
                  onChange={(makingChargePerGram) =>
                    onChange({ ...settings, makingChargePerGram })
                  }
                />
                <span className="pb-2 text-sm text-muted-foreground">
                  INR/g
                </span>
              </div>
            </FieldBlock>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Current GST</p>
              <p className="mt-1 font-semibold text-foreground">
                {settings.gstRate * 100}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flat making</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(settings.makingChargeFlat)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Per gram making</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(settings.makingChargePerGram)}/g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  );
}

export function ManageProductsAndPricePageClient() {
  const [miscSettings, setMiscSettings] = useState<MiscSettings>({
    makingChargeFlat: 4000,
    makingChargePerGram: 1800,
    gstRate: 0.03,
  });
  const [activeSection, setActiveSection] = useState<ManageSection>("overview");
  const metalsQuery = useMetals(LIST_QUERY);
  const stoneTypesQuery = useStoneTypes(LIST_QUERY);
  const stoneSlabsQuery = useStoneSlabs(LIST_QUERY);
  const loadingCounts =
    metalsQuery.isLoading ||
    stoneTypesQuery.isLoading ||
    stoneSlabsQuery.isLoading;

  return (
    <div className="mx-auto flex h-[calc(100svh-2rem)] w-full max-w-7xl flex-col overflow-hidden sm:h-[calc(100svh-3rem)]">
      {activeSection === "overview" ? (
        <Overview
          miscSettings={miscSettings}
          metalsTotal={metalsQuery.data?.total ?? 0}
          stoneTypesTotal={stoneTypesQuery.data?.total ?? 0}
          slabTotal={stoneSlabsQuery.data?.total ?? 0}
          loadingCounts={loadingCounts}
          onSelect={setActiveSection}
        />
      ) : null}
      {activeSection === "metals" ? (
        <MetalsEditor onBack={() => setActiveSection("overview")} />
      ) : null}
      {activeSection === "stones-slabs" ? (
        <StonesAndSlabsEditor onBack={() => setActiveSection("overview")} />
      ) : null}
      {activeSection === "misc" ? (
        <MiscEditor
          settings={miscSettings}
          onChange={setMiscSettings}
          onBack={() => setActiveSection("overview")}
        />
      ) : null}
    </div>
  );
}
