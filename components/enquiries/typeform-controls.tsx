import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 4;

export function StepNumber({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex items-center gap-1 text-sm text-primary">
      <span className="font-semibold text-lg">{n}</span>
      <span className="text-muted-foreground text-xs">
        of {TOTAL_STEPS}
      </span>
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

export function OkButton({
  onClick,
  label = "OK",
  shortcutLabel = "Enter",
  hideShortcut = false,
}: {
  onClick: () => void;
  label?: string;
  shortcutLabel?: string;
  hideShortcut?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button type="button" size="sm" onClick={onClick} className="gap-2 px-5">
        {label}
        <Check className="h-3.5 w-3.5" />
      </Button>
      {!hideShortcut && (
        <span className="text-xs text-muted-foreground/50">
          press{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {shortcutLabel}
          </kbd>
        </span>
      )}
    </div>
  );
}

export function OptionKey({ letter }: { letter: string }) {
  return (
    <kbd className="mr-2.5 inline-flex h-5 w-5 items-center justify-center rounded border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
      {letter}
    </kbd>
  );
}

export function OptionTile({
  letter,
  title,
  description,
  selected,
  onClick,
}: {
  letter?: string;
  title: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center rounded-xl border-2 px-4 py-3.5 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/30",
      )}
    >
      {letter && <OptionKey letter={letter} />}
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </button>
  );
}
