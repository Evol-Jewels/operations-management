"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkspaceViewMode = "table" | "kanban";

const VIEWS = [
  { mode: "table", label: "List view", icon: List },
  { mode: "kanban", label: "Board view", icon: LayoutGrid },
] as const;

export function WorkspaceViewToggle({
  value,
  onChange,
  className,
}: {
  value: WorkspaceViewMode;
  onChange: (mode: WorkspaceViewMode) => void;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5",
        className,
      )}
    >
      <legend className="sr-only">View mode</legend>
      {VIEWS.map(({ mode, label, icon: Icon }) => (
        <Button
          key={mode}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={label}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "size-9 text-muted-foreground",
            value === mode && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
        </Button>
      ))}
    </fieldset>
  );
}
