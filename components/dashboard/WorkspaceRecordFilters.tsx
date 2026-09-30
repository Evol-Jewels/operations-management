"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { useId } from "react";
import { AnalyticsFilterPopover } from "@/components/inventory/AnalyticsFilterPopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DateFilter = "all" | "7d" | "30d" | "90d" | "custom";
export type SortBy = "createdAt" | "updatedAt" | "name" | "deliveryDate";

const ORDER_STATUSES = [
  "New",
  "CAD Design",
  "In Production",
  "Certification",
  "At Store",
  "In Transit",
  "Delivered",
  "Closed",
  "Cancelled",
];
const ENQUIRY_STATUSES = ["New", "Estimated", "Converted", "Closed"];

const DATE_LABELS: Record<DateFilter, string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom range",
};

interface WorkspaceRecordFiltersProps {
  recordType: "order" | "enquiry";
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  orderType: string;
  onOrderTypeChange: (value: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (value: DateFilter) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  onSortChange: (field: SortBy, direction: "asc" | "desc") => void;
  onReset: () => void;
  viewMode: "table" | "kanban";
  onViewModeChange: (mode: "table" | "kanban") => void;
}

export function WorkspaceRecordFilters({
  recordType,
  search,
  onSearchChange,
  status,
  onStatusChange,
  orderType,
  onOrderTypeChange,
  dateFilter,
  onDateFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sortBy,
  sortOrder,
  onSortChange,
  onReset,
  viewMode,
  onViewModeChange,
}: WorkspaceRecordFiltersProps) {
  const id = useId();
  const isOrder = recordType === "order";
  const filterCount =
    (status !== "all" ? 1 : 0) +
    (isOrder && orderType !== "all" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0);
  const chips = [
    status !== "all"
      ? {
          key: "status",
          label: `Status: ${status}`,
          remove: () => onStatusChange("all"),
        }
      : null,
    isOrder && orderType !== "all"
      ? {
          key: "type",
          label: `Type: ${orderType === "STOCK_REFILL" ? "Stock refill" : orderType === "CUSTOMER" ? "Customer" : "Stock"}`,
          remove: () => onOrderTypeChange("all"),
        }
      : null,
    dateFilter !== "all"
      ? {
          key: "date",
          label:
            dateFilter === "custom" && (dateFrom || dateTo)
              ? `Created: ${dateFrom || "Any"} – ${dateTo || "Any"}`
              : `Created: ${DATE_LABELS[dateFilter]}`,
          remove: () => onDateFilterChange("all"),
        }
      : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[12rem] flex-1 sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={
              isOrder
                ? "Search customer, vendor, phone or ID"
                : "Search customer, phone or ID"
            }
            aria-label={`Search ${isOrder ? "orders" : "enquiries"}`}
            maxLength={255}
            className="h-9 pl-9"
          />
        </div>
        <AnalyticsFilterPopover count={filterCount} onReset={onReset}>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor={`${id}-status`}>Status</Label>
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger id={`${id}-status`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(isOrder ? ORDER_STATUSES : ENQUIRY_STATUSES).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            {isOrder && (
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor={`${id}-type`}>Order type</Label>
                <Select value={orderType} onValueChange={onOrderTypeChange}>
                  <SelectTrigger id={`${id}-type`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="STOCK">Stock</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="STOCK_REFILL">Stock refill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-date`}>Created date</Label>
              <Select
                value={dateFilter}
                onValueChange={(value) =>
                  onDateFilterChange(value as DateFilter)
                }
              >
                <SelectTrigger id={`${id}-date`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DATE_LABELS) as [DateFilter, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            {dateFilter === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${id}-from`}>From</Label>
                  <DatePicker
                    id={`${id}-from`}
                    value={dateFrom}
                    onChange={onDateFromChange}
                    placeholder="From date"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor={`${id}-to`}>To</Label>
                  <DatePicker
                    id={`${id}-to`}
                    value={dateTo}
                    onChange={onDateToChange}
                    placeholder="To date"
                  />
                </div>
              </div>
            )}
            {dateFilter === "custom" &&
              dateFrom &&
              dateTo &&
              dateFrom > dateTo && (
                <p role="alert" className="text-xs text-destructive">
                  The end date must be on or after the start date.
                </p>
              )}
          </div>
        </AnalyticsFilterPopover>
        <Select
          value={`${sortBy}:${sortOrder}`}
          onValueChange={(value) => {
            const [field, direction] = value.split(":") as [
              SortBy,
              "asc" | "desc",
            ];
            onSortChange(field, direction);
          }}
        >
          <SelectTrigger
            aria-label="Sort records"
            className="h-9 w-[10rem] sm:w-[11rem]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
            <SelectItem value="updatedAt:asc">
              Least recently updated
            </SelectItem>
            <SelectItem value="createdAt:desc">Newest created</SelectItem>
            <SelectItem value="createdAt:asc">Oldest created</SelectItem>
            <SelectItem value="name:asc">Customer A–Z</SelectItem>
            <SelectItem value="name:desc">Customer Z–A</SelectItem>
            {isOrder && (
              <>
                <SelectItem value="deliveryDate:asc">
                  Delivery soonest
                </SelectItem>
                <SelectItem value="deliveryDate:desc">
                  Delivery latest
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <fieldset className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 lg:hidden">
          <legend className="sr-only">View mode</legend>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
            onClick={() => onViewModeChange("table")}
            className={cn(
              "size-8",
              viewMode === "table" && "bg-muted text-foreground",
            )}
          >
            <List className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Kanban view"
            aria-pressed={viewMode === "kanban"}
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "size-8",
              viewMode === "kanban" && "bg-muted text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </Button>
        </fieldset>
      </div>
      {chips.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          aria-label="Selected record filters"
        >
          {chips.map((chip) => (
            <li key={chip.key}>
              <Badge
                variant="secondary"
                className="h-8 gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 text-xs font-medium text-foreground"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.remove}
                  aria-label={`Remove ${chip.label} filter`}
                  className="-mr-1 inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
