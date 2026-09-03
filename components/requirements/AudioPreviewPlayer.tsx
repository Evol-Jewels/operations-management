"use client";

import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AudioPreviewPlayer({
  src,
  durationSeconds = 0,
  className,
}: {
  src: string;
  durationSeconds?: number;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isScrubbingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(durationSeconds);
  const duration = mediaDuration > 0 ? mediaDuration : durationSeconds;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }

  function previewSeek(nextTime: number) {
    setCurrentTime(nextTime);
    if (!isScrubbingRef.current) commitSeek(nextTime);
  }

  function commitSeek(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-background p-2.5",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={(event) => {
          if (!isScrubbingRef.current) {
            setCurrentTime(event.currentTarget.currentTime);
          }
        }}
        onLoadedMetadata={(event) => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (durationSeconds > 0) return;
          const nextDuration = event.currentTarget.duration;
          if (Number.isFinite(nextDuration) && nextDuration > 0) {
            setMediaDuration(nextDuration);
          }
        }}
        className="sr-only"
      >
        <track kind="captions" />
      </audio>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
        className="row-span-2 size-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="ml-0.5 size-4 fill-current" />
        )}
      </Button>
      <input
        type="range"
        min={0}
        max={Math.max(duration, 1)}
        step={0.1}
        value={Math.min(currentTime, Math.max(duration, 1))}
        onPointerDown={() => {
          isScrubbingRef.current = true;
        }}
        onPointerUp={(event) => {
          isScrubbingRef.current = false;
          commitSeek(Number(event.currentTarget.value));
        }}
        onPointerCancel={(event) => {
          isScrubbingRef.current = false;
          commitSeek(Number(event.currentTarget.value));
        }}
        onChange={(event) => previewSeek(Number(event.target.value))}
        aria-label="Audio playback position"
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        className="h-5 min-w-0 w-full cursor-pointer accent-primary"
      />
      <span className="flex min-w-0 justify-between gap-3 font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </span>
    </div>
  );
}

function formatTime(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
