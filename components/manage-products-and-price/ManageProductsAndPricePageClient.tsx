"use client";

import {
  ArrowLeft,
  CircleDollarSign,
  Layers3,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useCreateLocation,
  useCreateStoneSlab,
  useCreateStoneType,
  useDeleteLocation,
  useDeleteStoneSlab,
  useDeleteStoneType,
  useLocations,
  useStoneSlabs,
  useStoneTypes,
  useUpdateLocation,
  useUpdateStoneSlab,
  useUpdateStoneType,
} from "@/hooks/useManageProducts";
import {
  useSystemConfigs,
  useUpdateSystemConfig,
} from "@/hooks/useSystemConfigs";
import { formatCurrency } from "@/lib/utils";
import type { SystemConfig } from "@/types";
import type {
  CreateLocationInput,
  CreateStoneSlabInput,
  LocationResponse,
  StoneSlabResponse,
  StoneTypeResponse,
  UpdateLocationInput,
  UpdateStoneSlabInput,
} from "@/types/manage-products-api";

type ManageSection = "overview" | "locations" | "stones-slabs" | "misc";
type DialogMode = "add" | "edit";

type LocationDraft = {
  name: string;
  city: string;
  type: "WAREHOUSE" | "STORE" | "";
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
const LOCATION_TYPES = ["WAREHOUSE", "STORE"] as const;

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

function formatSystemConfigLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSystemConfigValue(config: SystemConfig) {
  const numericValue = Number(config.value);

  if (config.key === "gstRate") {
    return Number.isFinite(numericValue) ? `${numericValue}%` : config.value;
  }

  if (
    config.key === "makingChargeFlat" ||
    config.key === "makingChargePerGram"
  ) {
    if (!Number.isFinite(numericValue)) return config.value;
    return config.key === "makingChargePerGram"
      ? `${formatCurrency(numericValue)}/g`
      : formatCurrency(numericValue);
  }

  return config.value || "Not set";
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
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onBack: () => void;
  action?: ReactNode;
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

        <div className="flex items-start justify-between gap-4">
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
          {action ? <div className="shrink-0 pt-1">{action}</div> : null}
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
      className="h-10 rounded-none border-0 border-b bg-transparent px-2 shadow-none focus-visible:ring-0"
    />
  );
}

function OverviewCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-36 cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40"
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

function Overview() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(updater: (params: URLSearchParams) => void) {
    const nextParams = new URLSearchParams(searchParams.toString());
    updater(nextParams);
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="space-y-6 overflow-y-auto pr-1">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Manage Config & Pricing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage backend pricing records for store locations, stone types, and
          stone slab ranges.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          title="Stores & Locations"
          description="Manage store and warehouse locations used across the app."
          onClick={() => updateSearchParams((p) => p.set("tab", "stores"))}
        />
        <OverviewCard
          icon={<Layers3 className="h-5 w-5" />}
          title="Stones & Slabs"
          description="Manage stone types and their per-carat slab ranges."
          onClick={() => updateSearchParams((p) => p.set("tab", "stones"))}
        />
        <OverviewCard
          icon={<ReceiptText className="h-5 w-5" />}
          title="System Config"
          description="Edit shared GST and making keys from system config."
          onClick={() => updateSearchParams((p) => p.set("tab", "system"))}
        />
      </div>
    </div>
  );
}

function LocationDialog({
  mode,
  draft,
  isSubmitting,
  onDraftChange,
  onOpenChange,
  onSubmit,
}: {
  mode: DialogMode | null;
  draft: LocationDraft | null;
  isSubmitting: boolean;
  onDraftChange: (draft: LocationDraft) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const open = !!mode && !!draft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Location" : "Add Location"}
          </DialogTitle>
          <DialogDescription>
            Manage store and warehouse names, cities, and notes.
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
            <FieldBlock label="City">
              <TextInput
                value={draft.city}
                onChange={(city) => onDraftChange({ ...draft, city })}
              />
            </FieldBlock>
            <FieldBlock label="Type">
              <Select
                value={draft.type}
                onValueChange={(type) =>
                  onDraftChange({
                    ...draft,
                    type: type as LocationDraft["type"],
                  })
                }
              >
                <SelectTrigger className="h-10 w-full rounded-none border-0 border-b bg-transparent px-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((locationType) => (
                    <SelectItem key={locationType} value={locationType}>
                      {locationType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                : "Add Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LocationsEditor({ onBack }: { onBack: () => void }) {
  const [nameFilter, setNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"WAREHOUSE" | "STORE" | "">("");
  const locationsQuery = useLocations({
    limit: 50,
    offset: 0,
    name: nameFilter.trim() || undefined,
    city: cityFilter.trim() || undefined,
    type: typeFilter || undefined,
  });
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editingLocation, setEditingLocation] =
    useState<LocationResponse | null>(null);
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [locationToDelete, setLocationToDelete] =
    useState<LocationResponse | null>(null);
  const locations = locationsQuery.data?.data ?? [];
  const isSubmitting =
    createLocation.isPending ||
    updateLocation.isPending ||
    deleteLocation.isPending;

  function closeDialog() {
    setDialogMode(null);
    setEditingLocation(null);
    setDraft(null);
  }

  function openAddDialog() {
    setEditingLocation(null);
    setDraft({
      name: "",
      city: "",
      type: "",
      notes: "",
    });
    setDialogMode("add");
  }

  function openEditDialog(location: LocationResponse) {
    setEditingLocation(location);
    setDraft({
      name: location.name,
      city: location.city,
      type:
        location.type === "WAREHOUSE" || location.type === "STORE"
          ? location.type
          : "",
      notes: location.notes ?? "",
    });
    setDialogMode("edit");
  }

  function validateDraft(currentDraft: LocationDraft) {
    const name = currentDraft.name.trim();
    const city = currentDraft.city.trim();
    const type = currentDraft.type;

    if (!name) {
      toast.error("Location name is required.");
      return false;
    }
    if (name.length > 255) {
      toast.error("Location name must be 255 characters or less.");
      return false;
    }
    if (!city) {
      toast.error("City is required.");
      return false;
    }
    if (city.length > 255) {
      toast.error("City must be 255 characters or less.");
      return false;
    }
    if (currentDraft.notes.length > 10000) {
      toast.error("Notes must be 10,000 characters or less.");
      return false;
    }
    if (!type) {
      toast.error("Type is required.");
      return false;
    }

    return true;
  }

  async function submitDialog() {
    if (!draft || !dialogMode || !validateDraft(draft)) return;

    try {
      if (dialogMode === "add") {
        const input: CreateLocationInput = {
          name: draft.name.trim(),
          city: draft.city.trim(),
          type: draft.type as "WAREHOUSE" | "STORE",
          notes: optionalCreateValue(draft.notes),
        };
        await createLocation.mutateAsync(input);
        toast.success("Location created");
      } else if (editingLocation) {
        const input: UpdateLocationInput = {
          name: draft.name.trim(),
          city: draft.city.trim(),
          type: draft.type || null,
          notes: optionalUpdateValue(draft.notes),
        };
        await updateLocation.mutateAsync({ id: editingLocation.id, input });
        toast.success("Location updated");
      }
      closeDialog();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save location"));
    }
  }

  async function confirmDeleteLocation() {
    if (!locationToDelete) return;

    try {
      await deleteLocation.mutateAsync(locationToDelete.id);
      setLocationToDelete(null);
      toast.success("Location deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete location"));
    }
  }

  return (
    <SectionShell
      icon={<CircleDollarSign className="h-5 w-5" />}
      title="Stores & Locations"
      description="Manage store and warehouse locations used across the app."
      onBack={onBack}
      action={
        <Button type="button" onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      }
    >

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter by name"
        />
        <Input
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          placeholder="Filter by city"
        />
        <Select
          value={typeFilter}
          onValueChange={(value) =>
            setTypeFilter(value as "WAREHOUSE" | "STORE" | "")
          }
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WAREHOUSE">WAREHOUSE</SelectItem>
            <SelectItem value="STORE">STORE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {locationsQuery.isLoading ? <LoadingRows /> : null}
        {locationsQuery.isError ? (
          <ErrorPanel
            message={getErrorMessage(
              locationsQuery.error,
              "Could not load locations.",
            )}
            onRetry={() => void locationsQuery.refetch()}
          />
        ) : null}
        {!locationsQuery.isLoading && !locationsQuery.isError ? (
          locations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No locations configured.
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={openAddDialog}
                className="mt-3 gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Location
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">
                      {location.name}
                    </TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase">
                        {location.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      {location.notes || "No notes"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(location.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(location)}
                          aria-label={`Edit ${location.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setLocationToDelete(location)}
                          aria-label={`Delete ${location.name}`}
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

      <LocationDialog
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
        open={!!locationToDelete}
        onOpenChange={(open) => {
          if (!open) setLocationToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {locationToDelete?.name ?? "this location"} from the
              active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLocation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLocation}
              disabled={deleteLocation.isPending}
            >
              {deleteLocation.isPending ? "Deleting..." : "Delete"}
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

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-1 pr-2 py-1">
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
                            ? "relative rounded-xl border border-foreground bg-foreground text-background"
                            : "relative rounded-xl border border-border bg-muted/20"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedStoneId(stone.id)}
                          className="block w-full cursor-pointer rounded-xl p-4 pr-24 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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

function SystemConfigDialog({
  config,
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  config: SystemConfig | null;
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open && config) setDraft(config.value);
  }, [config, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit system config</DialogTitle>
          <DialogDescription>
            Update a single configuration value and save it back to the backend.
          </DialogDescription>
        </DialogHeader>

        {config ? (
          <div className="space-y-5 py-2">
            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Key
              </p>
              <p className="font-medium text-foreground">{config.key}</p>
            </div>

            <div className="grid gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Label
              </p>
              <p className="text-sm text-muted-foreground">
                {formatSystemConfigLabel(config.key)}
              </p>
            </div>

            {config.description ? (
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Description
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            ) : null}

            <FieldBlock label="Value">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="h-10"
              />
            </FieldBlock>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isSubmitting || !config}
            onClick={() => onSubmit(draft.trim())}
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SystemConfigsEditor({ onBack }: { onBack: () => void }) {
  const systemConfigsQuery = useSystemConfigs(true);
  const updateSystemConfig = useUpdateSystemConfig();
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  const configs = systemConfigsQuery.data ?? [];
  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.key.localeCompare(b.key)),
    [configs],
  );

  async function submitConfig(value: string) {
    if (!editingConfig) return;

    try {
      await updateSystemConfig.mutateAsync({
        key: editingConfig.key,
        input: { value },
      });
      setEditingConfig(null);
      toast.success("Config updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save config"));
    }
  }

  return (
    <SectionShell
      icon={<ReceiptText className="h-5 w-5" />}
      title="System Config"
      description="View and update GST and making values from system config keys."
      onBack={onBack}
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => void systemConfigsQuery.refetch()}
          className="gap-2"
          disabled={systemConfigsQuery.isFetching}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {systemConfigsQuery.isLoading ? <LoadingRows count={3} /> : null}
        {systemConfigsQuery.isError ? (
          <ErrorPanel
            message={getErrorMessage(
              systemConfigsQuery.error,
              "Could not load system configs.",
            )}
            onRetry={() => void systemConfigsQuery.refetch()}
          />
        ) : null}

        {!systemConfigsQuery.isLoading && !systemConfigsQuery.isError ? (
          sortedConfigs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No miscellaneous config keys found.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedConfigs.map((config) => (
                <button
                  key={config.id}
                  type="button"
                  onClick={() => setEditingConfig(config)}
                  className="group rounded-xl border border-border bg-card p-4 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatSystemConfigLabel(config.key)}
                      </p>
                      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-foreground">
                        {formatSystemConfigValue(config)}
                      </p>
                    </div>
                    <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>

                  {config.description ? (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-end gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(config.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : null}
      </div>

      <SystemConfigDialog
        config={editingConfig}
        open={!!editingConfig}
        isSubmitting={updateSystemConfig.isPending}
        onOpenChange={(open) => {
          if (!open) setEditingConfig(null);
        }}
        onSubmit={submitConfig}
      />
    </SectionShell>
  );
}

export function ManageProductsAndPricePageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(updater: (params: URLSearchParams) => void) {
    const nextParams = new URLSearchParams(searchParams.toString());
    updater(nextParams);
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const activeTab = searchParams.get("tab");
  const activeSection: ManageSection =
    activeTab === "stores"
      ? "locations"
      : activeTab === "stones"
        ? "stones-slabs"
        : activeTab === "system"
          ? "misc"
          : "overview";

  return (
    <div className="mx-auto flex h-[calc(100svh-2rem)] w-full max-w-7xl flex-col overflow-hidden sm:h-[calc(100svh-3rem)]">
      {activeSection === "overview" ? <Overview /> : null}
      {activeSection === "locations" ? (
        <LocationsEditor
          onBack={() => updateSearchParams((p) => p.delete("tab"))}
        />
      ) : null}
      {activeSection === "stones-slabs" ? (
        <StonesAndSlabsEditor
          onBack={() => updateSearchParams((p) => p.delete("tab"))}
        />
      ) : null}
      {activeSection === "misc" ? (
        <SystemConfigsEditor
          onBack={() => updateSearchParams((p) => p.delete("tab"))}
        />
      ) : null}
    </div>
  );
}
