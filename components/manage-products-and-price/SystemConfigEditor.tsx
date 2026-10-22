"use client";

import {
  ChevronRight,
  CircleDollarSign,
  Pencil,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SpecialProductChargesPanel } from "@/components/manage-products-and-price/SpecialProductChargesPanel";
import {
  EmptyState,
  ErrorPanel,
  FieldBlock,
  getErrorMessage,
  LoadingRows,
  SectionShell,
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
import { Input } from "@/components/ui/input";
import {
  useSystemConfigs,
  useUpdateSystemConfig,
} from "@/hooks/useSystemConfigs";
import { formatCurrency } from "@/lib/utils";
import type { SystemConfig } from "@/types";

const PER_GRAM_KEYS = ["makingChargePerGram", "silverPrice", "platinumPrice"];

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

  if (config.key === "makingChargeFlat" || PER_GRAM_KEYS.includes(config.key)) {
    if (!Number.isFinite(numericValue)) return config.value;
    return PER_GRAM_KEYS.includes(config.key)
      ? `${formatCurrency(numericValue)}/g`
      : formatCurrency(numericValue);
  }

  return config.value || "Not set";
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid min-w-0 gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Key
                </p>
                <p className="truncate font-medium text-foreground">
                  {config.key}
                </p>
              </div>
              <div className="grid min-w-0 gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Label
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {formatSystemConfigLabel(config.key)}
                </p>
              </div>
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

const tileClass =
  "group min-w-0 rounded-xl border border-border bg-card p-3 text-left shadow-sm outline-none transition-colors hover:border-foreground/30 hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/40 sm:p-4";

export function SystemConfigEditor({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const systemConfigsQuery = useSystemConfigs(true);
  const updateSystemConfig = useUpdateSystemConfig();
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const showSpecialCharges = searchParams.get("config") === "special-products";

  const configs = systemConfigsQuery.data ?? [];
  const sortedConfigs = useMemo(
    () => [...configs].sort((a, b) => a.key.localeCompare(b.key)),
    [configs],
  );

  function setSpecialChargesOpen(open: boolean) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "system");
    if (open) nextParams.set("config", "special-products");
    else nextParams.delete("config");
    router.push(`${pathname}?${nextParams.toString()}`);
  }

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

  if (showSpecialCharges) {
    return (
      <SpecialProductChargesPanel onBack={() => setSpecialChargesOpen(false)} />
    );
  }

  return (
    <SectionShell
      icon={<ReceiptText className="h-5 w-5" />}
      title="System Config"
      description="View and update metal rates, GST, and making values from system config keys."
      onBack={onBack}
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => void systemConfigsQuery.refetch()}
          className="gap-2"
          disabled={systemConfigsQuery.isFetching}
          aria-label="Refresh system config"
        >
          <RefreshCw
            className={
              systemConfigsQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"
            }
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
    >
      <div
        id="system-config"
        className="scroll-mt-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
      >
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
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 2xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setSpecialChargesOpen(true)}
              className={`${tileClass} col-span-2 flex items-center gap-3 md:col-span-3 2xl:col-span-4`}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <CircleDollarSign className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  Special product making charges
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  Flat making charge overrides for specific product codes
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            </button>

            {sortedConfigs.length === 0 ? (
              <div className="col-span-full">
                <EmptyState message="No miscellaneous config keys found." />
              </div>
            ) : null}

            {sortedConfigs.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => setEditingConfig(config)}
                className={`${tileClass} flex flex-col`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                    {formatSystemConfigLabel(config.key)}
                  </p>
                  <Pencil className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:size-4" />
                </div>
                <p className="mt-1.5 break-words text-lg font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">
                  {formatSystemConfigValue(config)}
                </p>
                {config.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
                    {config.description}
                  </p>
                ) : null}
                <p className="mt-auto hidden pt-3 text-right text-xs text-muted-foreground sm:block">
                  {new Date(config.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
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
