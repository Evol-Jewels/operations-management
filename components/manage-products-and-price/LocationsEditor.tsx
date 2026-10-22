"use client";

import { CircleDollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDeleteDialog,
  type DialogMode,
  EmptyState,
  ErrorPanel,
  FieldBlock,
  formatDate,
  getErrorMessage,
  LoadingRows,
  MobileList,
  MobileListItem,
  optionalCreateValue,
  optionalUpdateValue,
  RowActions,
  SectionShell,
  TextInput,
} from "@/components/manage-products-and-price/shared";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useDeleteLocation,
  useLocations,
  useUpdateLocation,
} from "@/hooks/useManageProducts";
import type {
  CreateLocationInput,
  LocationResponse,
  UpdateLocationInput,
} from "@/types/manage-products-api";

type LocationType = "WAREHOUSE" | "STORE";

type LocationDraft = {
  name: string;
  city: string;
  type: LocationType | "";
  notes: string;
};

const LOCATION_TYPES: LocationType[] = ["WAREHOUSE", "STORE"];
const ALL_TYPES = "ALL";

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
                  onDraftChange({ ...draft, type: type as LocationType })
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

function validateDraft(draft: LocationDraft) {
  const name = draft.name.trim();
  const city = draft.city.trim();

  if (!name) return "Location name is required.";
  if (name.length > 255) return "Location name must be 255 characters or less.";
  if (!city) return "City is required.";
  if (city.length > 255) return "City must be 255 characters or less.";
  if (draft.notes.length > 10000) {
    return "Notes must be 10,000 characters or less.";
  }
  if (!draft.type) return "Type is required.";
  return null;
}

export function LocationsEditor({ onBack }: { onBack?: () => void }) {
  const [nameFilter, setNameFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<LocationType | "">("");
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
    setDraft({ name: "", city: "", type: "", notes: "" });
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

  async function submitDialog() {
    if (!draft || !dialogMode) return;
    const validationError = validateDraft(draft);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (dialogMode === "add") {
        const input: CreateLocationInput = {
          name: draft.name.trim(),
          city: draft.city.trim(),
          type: draft.type as LocationType,
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
          <span className="sm:hidden">Add</span>
          <span className="hidden sm:inline">Add Location</span>
        </Button>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        <Input
          value={nameFilter}
          onChange={(event) => setNameFilter(event.target.value)}
          placeholder="Filter by name"
          aria-label="Filter by name"
          className="col-span-2 md:col-span-1"
        />
        <Input
          value={cityFilter}
          onChange={(event) => setCityFilter(event.target.value)}
          placeholder="City"
          aria-label="Filter by city"
        />
        <Select
          value={typeFilter || ALL_TYPES}
          onValueChange={(value) =>
            setTypeFilter(value === ALL_TYPES ? "" : (value as LocationType))
          }
        >
          <SelectTrigger className="w-full" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES}>All types</SelectItem>
            {LOCATION_TYPES.map((locationType) => (
              <SelectItem key={locationType} value={locationType}>
                {locationType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
            <EmptyState
              message="No locations configured."
              action={
                <Button
                  type="button"
                  variant="ghost"
                  onClick={openAddDialog}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              }
            />
          ) : (
            <>
              <MobileList>
                {locations.map((location) => (
                  <MobileListItem
                    key={location.id}
                    title={location.name}
                    details={
                      <>
                        <p className="flex items-center gap-2">
                          <span className="truncate">{location.city}</span>
                          <Badge
                            variant="secondary"
                            className="px-1.5 text-[10px] uppercase"
                          >
                            {location.type}
                          </Badge>
                        </p>
                        {location.notes ? (
                          <p className="line-clamp-1 text-xs">
                            {location.notes}
                          </p>
                        ) : null}
                      </>
                    }
                    actions={
                      <RowActions
                        label={location.name}
                        onEdit={() => openEditDialog(location)}
                        onDelete={() => setLocationToDelete(location)}
                      />
                    }
                  />
                ))}
              </MobileList>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Notes
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Updated
                    </TableHead>
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
                      <TableCell className="hidden max-w-64 truncate lg:table-cell">
                        {location.notes || "No notes"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground xl:table-cell">
                        {formatDate(location.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          label={location.name}
                          onEdit={() => openEditDialog(location)}
                          onDelete={() => setLocationToDelete(location)}
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

      <ConfirmDeleteDialog
        open={!!locationToDelete}
        title="Delete location?"
        description={`This removes ${locationToDelete?.name ?? "this location"} from the active list.`}
        isPending={deleteLocation.isPending}
        onCancel={() => setLocationToDelete(null)}
        onConfirm={confirmDeleteLocation}
      />
    </SectionShell>
  );
}
