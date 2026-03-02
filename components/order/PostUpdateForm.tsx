"use client";

import { Paperclip, Send } from "lucide-react";
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
import { STAGES, type Stage } from "@/types";

interface PostUpdateFormProps {
  currentStage: Stage;
  onSubmit: (data: {
    name: string;
    note: string;
    newStage: Stage | null;
  }) => void;
}

export function PostUpdateForm({
  currentStage,
  onSubmit,
}: PostUpdateFormProps) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [newStage, setNewStage] = useState<Stage | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    name.trim().length > 0 && (note.trim().length > 0 || newStage !== null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), note: note.trim(), newStage });
    setSubmitted(true);
    // Reset after short delay for feedback
    setTimeout(() => {
      setName("");
      setNote("");
      setNewStage(null);
      setSubmitted(false);
    }, 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitted ? (
        <div className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-6 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
          Update posted successfully
        </div>
      ) : (
        <>
          {/* Name */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="poster-name"
            >
              Your name <span className="text-destructive">*</span>
            </label>
            <Input
              id="poster-name"
              placeholder="e.g. Raj Jewel Craft"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9"
              required
            />
          </div>

          {/* Stage change */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Move to stage{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Select
              value={newStage ?? "__none__"}
              onValueChange={(v) =>
                setNewStage(v === "__none__" ? null : (v as Stage))
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {currentStage} (current)
                </SelectItem>
                {STAGES.filter((s) => s !== currentStage).map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="update-note"
            >
              Note <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Textarea
              id="update-note"
              placeholder="Add a progress update, observation, or question…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* File — UI only for prototype */}
          <button
            type="button"
            className={cn(
              "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground transition-colors",
              "hover:border-foreground/30 hover:bg-muted/30",
            )}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach a file or photo
            <span className="text-muted-foreground/50">(coming soon)</span>
          </button>

          {/* Submit */}
          <Button type="submit" className="w-full gap-2" disabled={!canSubmit}>
            <Send className="h-3.5 w-3.5" />
            Post Update
          </Button>
        </>
      )}
    </form>
  );
}
