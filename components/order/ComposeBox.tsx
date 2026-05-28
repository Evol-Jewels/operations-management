"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ComposeBoxProps {
  onSubmit: (data: { message: string }) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ComposeBox({ onSubmit, isSubmitting }: ComposeBoxProps) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && !isSubmitting && !submitted;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit({ message: trimmedMessage });
    setMessage("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1600);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <label htmlFor="activity-message" className="sr-only">
        Message
      </label>
      <Textarea
        id="activity-message"
        placeholder="Write a comment..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        disabled={isSubmitting || submitted}
        className="min-h-24 resize-none rounded-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
      />
      <div className="flex items-end justify-end gap-3 border-border p-2">
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <Send className="h-3 w-3" />
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
