"use client";

import { ArrowLeft, Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";

export type DialogMode = "add" | "edit";

export const LIST_QUERY = { limit: 50, offset: 0 };
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
export const WEIGHT_PATTERN = /^\d+(\.\d{1,3})?$/;

export const MOBILE_CARD_CLASS =
  "gap-0 border-0 bg-transparent py-0 shadow-none md:border md:bg-card md:shadow-sm";

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMoneyValue(value: string | null) {
  if (!value) return "Not set";
  return `${formatCurrency(Number(value))}`;
}

export function optionalCreateValue(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function optionalUpdateValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export function SectionShell({
  icon,
  title,
  description,
  onBack,
  backLabel,
  action,
  children,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:min-h-0 lg:flex-1">
      <div className="shrink-0 space-y-3">
        {onBack && backLabel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-1 h-9 gap-2 px-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        ) : null}

        <div className="flex items-center justify-between gap-3 sm:items-start sm:gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card sm:flex">
                {icon}
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-1 hidden max-w-2xl text-sm text-muted-foreground sm:block">
                {description}
              </p>
            </div>
          </div>
          {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
        </div>
      </div>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function FieldBlock({
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

export function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text";
}) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-10 rounded-none border-0 border-b bg-transparent px-2 shadow-none focus-visible:ring-0"
    />
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
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

export function ErrorPanel({
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

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function RowActions({
  label,
  onEdit,
  onDelete,
  className,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0 justify-end gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        className="size-10 text-muted-foreground hover:text-foreground md:size-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        className="size-10 text-muted-foreground hover:text-destructive md:size-8"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function MobileList({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
      {children}
    </ul>
  );
}

export function MobileListItem({
  title,
  aside,
  details,
  actions,
}: {
  title: ReactNode;
  aside?: ReactNode;
  details?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 py-2.5 pr-1.5 pl-4">
      <div className="min-w-0 flex-1 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate font-medium text-foreground">
            {title}
          </p>
          {aside}
        </div>
        {details ? (
          <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {details}
          </div>
        ) : null}
      </div>
      {actions}
    </li>
  );
}

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
