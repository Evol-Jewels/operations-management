"use client";

import { LoaderCircle, Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceState } from "@/types/agent-voice";

const labels: Record<VoiceState, string> = {
  idle: "Voice",
  connecting: "Connecting…",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Speaking",
  reconnecting: "Reconnecting…",
};

export function VoiceOverlay({
  state,
  muted,
  audioBlocked,
  onMute,
  onEnd,
  onEnableAudio,
}: {
  state: VoiceState;
  muted: boolean;
  audioBlocked: boolean;
  onMute: () => void;
  onEnd: () => void;
  onEnableAudio: () => void;
}) {
  const connecting = state === "connecting" || state === "reconnecting";
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 px-2 sm:px-5">
      <section
        aria-label="Voice conversation controls"
        className="pointer-events-auto mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-3xl border bg-background/90 p-4 shadow-lg backdrop-blur-xl sm:gap-4 sm:px-5"
      >
        <div
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-14"
        >
          {connecting ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />
          ) : (
            <div className="flex h-6 items-center gap-1">
              {["h-2", "h-4", "h-6", "h-4", "h-2"].map((height, index) => (
                <span
                  key={`${index}-${height}`}
                  className={`w-1 rounded-full bg-current ${height} ${!muted && state === "speaking" ? "animate-pulse motion-reduce:animate-none" : ""}`}
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p role="status" className="text-sm font-medium">
            {muted && state === "listening"
              ? "Microphone muted"
              : labels[state]}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {connecting
              ? "Getting ready to talk"
              : "Your conversation continues below"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={muted ? "secondary" : "outline"}
            size="icon"
            className="size-11 rounded-full"
            disabled={connecting}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={muted}
            onClick={onMute}
          >
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="size-11 rounded-full"
            aria-label="End voice conversation"
            onClick={onEnd}
          >
            <PhoneOff className="size-4" />
          </Button>
        </div>
        {audioBlocked && (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full rounded-xl"
            onClick={onEnableAudio}
          >
            <Volume2 className="size-4" />
            Enable assistant audio
          </Button>
        )}
      </section>
    </div>
  );
}
