"use client";

import { Gem, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequirementDraft } from "./requirement-form-types";

export function RequirementSummaryList({
  requirements,
  onAdd,
  onEdit,
  onRemove,
}: {
  requirements: RequirementDraft[];
  onAdd?: () => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (requirements.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Added Requirements ({requirements.length}{" "}
          {requirements.length === 1 ? "item" : "items"})
        </p>
        {onAdd ? (
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            Add new requirement
          </Button>
        ) : null}
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {requirements.map((requirement, index) => (
          <div
            key={requirement.id}
            className="flex min-w-0 items-center gap-3 px-3.5 py-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Gem className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {requirement.category || `Requirement ${index + 1}`}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[
                  [requirement.metalType, requirement.metalPurity]
                    .filter(Boolean)
                    .join(" "),
                  `${filledCount(requirement.diamonds)} diamond`,
                  `${filledCount(requirement.colorStones)} stone`,
                  requirement.references.length
                    ? `${requirement.references.length} ref`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {requirement.references.length > 0 ? (
              <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onEdit(requirement.id)}
              aria-label="Edit requirement"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(requirement.id)}
              aria-label="Remove requirement"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function filledCount(items: object[]) {
  const count = items.filter((item) =>
    Object.entries(item as Record<string, unknown>).some(
      ([key, value]) => key !== "id" && String(value ?? "").trim(),
    ),
  ).length;
  return count || 0;
}
