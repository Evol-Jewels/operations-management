"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { StatusDot } from "./KanbanRecordCard";

export interface StageStripItem {
  id: string;
  label: string;
  count?: number;
}

export function useStageScroller(firstStageId?: string) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(firstStageId);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const columns = board.querySelectorAll<HTMLElement>("[data-stage]");
      const visible = Array.from(columns).find(
        (column) =>
          column.offsetLeft + column.offsetWidth / 2 > board.scrollLeft,
      );
      if (visible?.dataset.stage) setActiveId(visible.dataset.stage);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    board.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      board.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToStage = useCallback((id: string) => {
    const board = boardRef.current;
    const column = Array.from(
      board?.querySelectorAll<HTMLElement>("[data-stage]") ?? [],
    ).find((element) => element.dataset.stage === id);
    if (!board || !column) return;

    setActiveId(id);
    board.scrollTo({ left: column.offsetLeft, behavior: "smooth" });
  }, []);

  return { boardRef, activeId, scrollToStage };
}

export function KanbanStageStrip({
  stages,
  activeId,
  onSelect,
  label,
  className,
}: {
  stages: StageStripItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  label: string;
  className?: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const chip = Array.from(
      strip?.querySelectorAll<HTMLElement>("[data-chip]") ?? [],
    ).find((element) => element.dataset.chip === activeId);
    if (!strip || !chip) return;

    strip.scrollTo({
      left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeId]);

  return (
    <div
      ref={stripRef}
      role="toolbar"
      aria-label={label}
      className={cn(
        "relative -mx-4 flex shrink-0 gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0",
        className,
      )}
    >
      {stages.map((stage) => {
        const isActive = stage.id === activeId;
        return (
          <button
            key={stage.id}
            type="button"
            data-chip={stage.id}
            aria-pressed={isActive}
            onClick={() => onSelect(stage.id)}
            className={cn(
              "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-foreground/80 bg-foreground/[0.06] text-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
              stage.count === 0 && !isActive && "text-muted-foreground/60",
            )}
          >
            {stage.id !== "all" && <StatusDot status={stage.id} />}
            {stage.label}
            {stage.count !== undefined && (
              <span
                className={cn(
                  "tabular-nums",
                  stage.count > 0
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground/60",
                )}
              >
                {stage.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
