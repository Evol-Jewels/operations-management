"use client";

import { Layers3, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  SlabDialog,
  type SlabDraft,
  StoneDialog,
  type StoneDraft,
} from "@/components/manage-products-and-price/StoneDialogs";
import {
  ConfirmDeleteDialog,
  type DialogMode,
  EmptyState,
  ErrorPanel,
  formatDate,
  formatMoneyValue,
  getErrorMessage,
  LIST_QUERY,
  LoadingRows,
  MOBILE_CARD_CLASS,
  MONEY_PATTERN,
  MobileList,
  MobileListItem,
  optionalCreateValue,
  optionalUpdateValue,
  RowActions,
  SectionShell,
  WEIGHT_PATTERN,
} from "@/components/manage-products-and-price/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateStoneSlab,
  useCreateStoneType,
  useDeleteStoneSlab,
  useDeleteStoneType,
  useStoneSlabs,
  useStoneTypes,
  useUpdateStoneSlab,
  useUpdateStoneType,
} from "@/hooks/useManageProducts";
import { cn } from "@/lib/utils";
import type {
  CreateStoneSlabInput,
  StoneSlabResponse,
  StoneTypeResponse,
  UpdateStoneSlabInput,
} from "@/types/manage-products-api";

function validateSlabDraft(draft: SlabDraft) {
  const rangeFrom = draft.rangeFrom.trim();
  const rangeTo = draft.rangeTo.trim();

  if (!draft.code.trim()) return "Slab code is required.";
  if (!WEIGHT_PATTERN.test(rangeFrom) || !WEIGHT_PATTERN.test(rangeTo)) {
    return "Slab ranges must have up to 3 decimal places.";
  }
  if (Number(rangeTo) <= Number(rangeFrom)) {
    return "To ct must be greater than From ct.";
  }
  if (!MONEY_PATTERN.test(draft.pricePerCarat.trim())) {
    return "Price / ct must have up to 2 decimal places.";
  }
  if (draft.notes.length > 10000) {
    return "Notes must be 10,000 characters or less.";
  }
  return null;
}

function StonePicker({
  stones,
  selectedId,
  onSelect,
}: {
  stones: StoneTypeResponse[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 lg:hidden">
      {stones.map((stone) => (
        <Button
          key={stone.id}
          type="button"
          size="sm"
          variant={stone.id === selectedId ? "default" : "outline"}
          aria-pressed={stone.id === selectedId}
          onClick={() => onSelect(stone.id)}
          className="h-9 shrink-0 rounded-full px-3.5"
        >
          {stone.name}
        </Button>
      ))}
    </div>
  );
}

export function StonesAndSlabsEditor({ onBack }: { onBack?: () => void }) {
  const stoneTypesQuery = useStoneTypes(LIST_QUERY);
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
    setStoneDraft({ name: "", category: "Diamond" });
    setStoneDialogMode("add");
  }

  function openEditStoneDialog(stone: StoneTypeResponse) {
    setEditingStone(stone);
    setStoneDraft({ name: stone.name, category: stone.category ?? "Diamond" });
    setStoneDialogMode("edit");
  }

  async function submitStoneDialog() {
    if (!stoneDraft || !stoneDialogMode) return;
    const name = stoneDraft.name.trim();
    if (!name) {
      toast.error("Stone type name is required.");
      return;
    }
    if (name.length > 255) {
      toast.error("Stone type name must be 255 characters or less.");
      return;
    }

    try {
      if (stoneDialogMode === "add") {
        const stone = await createStoneType.mutateAsync({
          name,
          category: stoneDraft.category,
        });
        setSelectedStoneId(stone.id);
        toast.success("Stone type created");
      } else if (editingStone) {
        const stone = await updateStoneType.mutateAsync({
          id: editingStone.id,
          input: { name, category: stoneDraft.category },
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

  async function submitSlabDialog() {
    if (!selectedStone || !slabDraft || !slabDialogMode) return;
    const validationError = validateSlabDraft(slabDraft);
    if (validationError) {
      toast.error(validationError);
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

  const addStoneButton = (
    <Button
      type="button"
      variant="ghost"
      onClick={openAddStoneDialog}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Add Stone
    </Button>
  );

  return (
    <SectionShell
      icon={<Layers3 className="h-5 w-5" />}
      title="Stones & Slabs"
      description="Manage stone types on the left and slab pricing for the selected stone on the right."
      onBack={onBack}
      action={
        <Button
          type="button"
          variant="outline"
          onClick={openAddStoneDialog}
          className="gap-2 lg:hidden"
        >
          <Plus className="h-4 w-4" />
          Stone
        </Button>
      }
    >
      <div className="grid gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
        {stoneTypes.length ? (
          <StonePicker
            stones={stoneTypes}
            selectedId={selectedStone?.id}
            onSelect={setSelectedStoneId}
          />
        ) : null}

        <Card className="hidden min-h-0 overflow-hidden py-0 lg:flex">
          <CardContent className="flex h-full min-h-0 flex-col gap-4 p-6">
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 py-1 pr-2">
              {stoneTypes.map((stone) => {
                const selected = stone.id === selectedStone?.id;

                return (
                  <div
                    key={stone.id}
                    className={cn(
                      "relative rounded-xl border",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted/20",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStoneId(stone.id)}
                      className="block w-full cursor-pointer rounded-xl p-4 pr-24 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <p className="break-words font-semibold">{stone.name}</p>
                      <p
                        className={cn(
                          "mt-1 truncate text-xs",
                          selected
                            ? "text-background/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {stone.id}
                      </p>
                      <Badge
                        variant={selected ? "outline" : "secondary"}
                        className={cn(
                          "mt-3",
                          selected && "border-background/25 text-background",
                        )}
                      >
                        {stone.category ?? "Uncategorized"}
                      </Badge>
                    </button>
                    <RowActions
                      label={stone.name}
                      onEdit={() => openEditStoneDialog(stone)}
                      onDelete={() => setStoneToDelete(stone)}
                      className={cn(
                        "absolute top-3 right-3 z-10",
                        selected &&
                          "[&_button]:text-background/70 [&_button:hover]:bg-background/10 [&_button:hover]:text-background",
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
          <Card className={cn(MOBILE_CARD_CLASS, "min-h-0 overflow-hidden")}>
            <CardContent className="flex h-full min-h-0 flex-col gap-4 p-0 md:gap-5 md:p-5 lg:p-6">
              {selectedStone ? (
                <>
                  <div className="shrink-0 space-y-4 md:space-y-5">
                    <div className="flex items-center justify-between gap-3 sm:items-start">
                      <div className="flex min-w-0 items-center gap-1">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-foreground">
                            {selectedStone.name}
                          </h2>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                            <span className="lg:hidden">
                              {selectedStone.category ?? "Uncategorized"} ·{" "}
                            </span>
                            {selectedSlabs.length} of{" "}
                            {selectedSlabsQuery.data?.total ?? 0} slabs
                            <span className="hidden lg:inline">
                              {" "}
                              · {selectedStone.id}
                            </span>
                          </p>
                        </div>
                        <RowActions
                          label={selectedStone.name}
                          onEdit={() => openEditStoneDialog(selectedStone)}
                          onDelete={() => setStoneToDelete(selectedStone)}
                          className="lg:hidden"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={openAddSlabDialog}
                        className="shrink-0 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sm:hidden">Slab</span>
                        <span className="hidden sm:inline">Add Slab</span>
                      </Button>
                    </div>
                    <Separator className="hidden md:block" />
                  </div>

                  <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
                        <EmptyState
                          message="No slabs configured for this stone."
                          action={
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={openAddSlabDialog}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add first slab
                            </Button>
                          }
                        />
                      ) : (
                        <>
                          <MobileList>
                            {selectedSlabs.map((slab) => (
                              <MobileListItem
                                key={slab.id}
                                title={slab.code}
                                aside={
                                  <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums">
                                    {formatMoneyValue(slab.pricePerCarat)}
                                    <span className="font-normal text-muted-foreground">
                                      /ct
                                    </span>
                                  </span>
                                }
                                details={
                                  <>
                                    <p className="tabular-nums">
                                      {slab.rangeFrom} – {slab.rangeTo} ct
                                    </p>
                                    {slab.notes ? (
                                      <p className="line-clamp-1 text-xs">
                                        {slab.notes}
                                      </p>
                                    ) : null}
                                  </>
                                }
                                actions={
                                  <RowActions
                                    label={`slab ${slab.code}`}
                                    onEdit={() => openEditSlabDialog(slab)}
                                    onDelete={() => setSlabToDelete(slab)}
                                  />
                                }
                              />
                            ))}
                          </MobileList>
                          <Table className="hidden md:table">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Range</TableHead>
                                <TableHead>Price / ct</TableHead>
                                <TableHead className="hidden xl:table-cell">
                                  Notes
                                </TableHead>
                                <TableHead className="hidden 2xl:table-cell">
                                  Updated
                                </TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSlabs.map((slab) => (
                                <TableRow key={slab.id}>
                                  <TableCell>
                                    <p className="font-medium">{slab.code}</p>
                                    {slab.notes ? (
                                      <p className="max-w-40 truncate text-xs text-muted-foreground xl:hidden">
                                        {slab.notes}
                                      </p>
                                    ) : null}
                                  </TableCell>
                                  <TableCell className="tabular-nums">
                                    {slab.rangeFrom} - {slab.rangeTo} ct
                                  </TableCell>
                                  <TableCell className="tabular-nums">
                                    {formatMoneyValue(slab.pricePerCarat)}
                                  </TableCell>
                                  <TableCell className="hidden max-w-64 truncate xl:table-cell">
                                    {slab.notes || "No notes"}
                                  </TableCell>
                                  <TableCell className="hidden text-muted-foreground 2xl:table-cell">
                                    {formatDate(slab.updatedAt)}
                                  </TableCell>
                                  <TableCell>
                                    <RowActions
                                      label={`slab ${slab.code}`}
                                      onEdit={() => openEditSlabDialog(slab)}
                                      onDelete={() => setSlabToDelete(slab)}
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
                </>
              ) : (
                <EmptyState
                  message="Add a stone type before managing slabs."
                  action={addStoneButton}
                />
              )}
            </CardContent>
          </Card>
        ) : null}
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

      <ConfirmDeleteDialog
        open={!!stoneToDelete}
        title="Delete stone type?"
        description={`This removes ${stoneToDelete?.name ?? "this stone type"} from the active stone list. Attached slab pricing may also be affected by the backend.`}
        isPending={deleteStoneType.isPending}
        onCancel={() => setStoneToDelete(null)}
        onConfirm={confirmDeleteStone}
      />

      <ConfirmDeleteDialog
        open={!!slabToDelete}
        title="Delete slab?"
        description={`This removes slab ${slabToDelete?.code ?? ""} from the active pricing list.`}
        isPending={deleteStoneSlab.isPending}
        onCancel={() => setSlabToDelete(null)}
        onConfirm={confirmDeleteSlab}
      />
    </SectionShell>
  );
}
