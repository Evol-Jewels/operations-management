"use client";

import { ArrowRight, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ACTOR_ROLE_COLORS, type ActorRole, STAGES, type Stage } from "@/types";

// ─── Small inline avatar used in the compose row ─────────────────────────────

function ComposeAvatar({ name, role }: { name: string; role: ActorRole }) {
  const colors = ACTOR_ROLE_COLORS[role];
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <div
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
        colors.bg,
        colors.text,
      )}
    >
      {initials}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ComposeBoxProps {
  currentStage: Stage;
  onSubmit: (data: {
    name: string;
    role: ActorRole;
    note: string;
    newStage: Stage | null;
  }) => void;
}

const ROLE_OPTIONS: { value: ActorRole; label: string }[] = [
  { value: "sales", label: "Sales / Store" },
  { value: "vendor", label: "Vendor" },
  { value: "owner", label: "Owner" },
  { value: "customer", label: "Customer" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ComposeBox({ currentStage, onSubmit }: ComposeBoxProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<ActorRole>("sales");
  const [note, setNote] = useState("");
  const [newStage, setNewStage] = useState<Stage | null>(null);
  const [focused, setFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const trimmedName = name.trim();
  const trimmedNote = note.trim();
  const canSubmit =
    trimmedName.length > 0 && (trimmedNote.length > 0 || newStage !== null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: trimmedName, role, note: trimmedNote, newStage });
    setSubmitted(true);
    setTimeout(() => {
      setNote("");
      setNewStage(null);
      setSubmitted(false);
      setFocused(false);
    }, 1800);
  }

  const roleColors = ACTOR_ROLE_COLORS[role];

  return (
    <div className="relative flex items-start gap-3 pt-1">
      {/* Avatar — updates live as name/role changes */}
      <div className="relative flex w-8 flex-shrink-0 flex-col items-center">
        <ComposeAvatar name={trimmedName || "?"} role={role} />
      </div>

      {/* Compose card */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex-1 overflow-hidden rounded-xl border bg-card transition-shadow duration-200",
          focused ? "shadow-sm border-foreground/20" : "border-border",
        )}
      >
        {submitted ? (
          <div className="flex items-center justify-center py-5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Update posted
          </div>
        ) : (
          <>
            {/* Top bar — name + role selector */}
            <div className="flex items-center gap-0 border-b border-border">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused(true)}
                className="h-9 flex-1 rounded-none rounded-tl-xl border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              />
              <div className="h-5 w-px bg-border" />
              <Select
                value={role}
                onValueChange={(v) => setRole(v as ActorRole)}
              >
                <SelectTrigger className="h-9 w-[138px] rounded-none rounded-tr-xl border-0 bg-transparent text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        roleColors.dotSolid,
                      )}
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent align="end">
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            ACTOR_ROLE_COLORS[opt.value].dotSolid,
                          )}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note textarea */}
            <Textarea
              placeholder="Write an update, question, or note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => setFocused(true)}
              rows={focused ? 3 : 2}
              className="resize-none rounded-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />

            {/* Bottom toolbar */}
            <div
              className={cn(
                "flex items-center justify-between gap-2 border-t border-border px-3 py-2",
                !focused && "opacity-60",
              )}
            >
              {/* Stage change */}
              <Select
                value={newStage ?? "__none__"}
                onValueChange={(v) => {
                  setNewStage(v === "__none__" ? null : (v as Stage));
                  setFocused(true);
                }}
              >
                <SelectTrigger className="h-7 w-auto gap-1.5 border border-dashed border-border bg-transparent px-2.5 text-xs shadow-none hover:border-foreground/30 focus-visible:ring-0 data-[state=open]:border-foreground/30">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <SelectValue>
                    {newStage ? (
                      <span className="font-medium text-foreground">
                        {newStage}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Move stage</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">
                      {currentStage} (no change)
                    </span>
                  </SelectItem>
                  {STAGES.filter((s) => s !== currentStage).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1.5">
                {/* Attach — prototype only */}
                <button
                  type="button"
                  title="Attach file (coming soon)"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-muted-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>

                {/* Submit */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit}
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  <Send className="h-3 w-3" />
                  Post
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
