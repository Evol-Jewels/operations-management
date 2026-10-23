"use client";

import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Side = "left" | "right";
type FabPosition = { side: Side; bottom: number };
type Bounds = { min: number; max: number; gap: number };
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

const STORAGE_KEY = "evol-e-launcher-position";
const DRAG_THRESHOLD = 6;
const EDGE_GAP = 16;

function readStoredPosition(): FabPosition | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "");
    if (
      (value?.side === "left" || value?.side === "right") &&
      typeof value.bottom === "number"
    ) {
      return value;
    }
  } catch {}
  return null;
}

function visibleHeight(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element || getComputedStyle(element).display === "none") return 0;
  return element.getBoundingClientRect().height;
}

function bottomBarTops(viewport: number) {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-fab-avoid]"))
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => element.getBoundingClientRect().top)
    .filter((top) => top > viewport / 2 && top < viewport);
}

/** Lets a floating button be dragged anywhere, snapping to the nearest side on release. */
export function useDraggableFab(size: number) {
  const pathname = usePathname();
  const [position, setPosition] = useState(readStoredPosition);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  // Keep the button clear of the top bar, bottom tab bar and any bar pinned to the
  // bottom of the page (marked with data-fab-avoid), re-checking as the page changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure after navigation
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const floor = Math.min(
        viewport - visibleHeight('nav[aria-label="Primary"]'),
        ...bottomBarTops(viewport),
      );
      const gap = window.innerWidth >= 640 ? 24 : EDGE_GAP;
      const min = Math.round(viewport - floor + gap);
      const max = Math.max(
        min,
        viewport - visibleHeight("[data-mobile-top-bar]") - size - EDGE_GAP,
      );
      setBounds((current) =>
        current?.min === min && current.max === max && current.gap === gap
          ? current
          : { min, max, gap },
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, size]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const distance = Math.hypot(
      event.clientX - state.startX,
      event.clientY - state.startY,
    );
    if (!state.moved && distance < DRAG_THRESHOLD) return;
    state.moved = true;
    const { width, height } = event.currentTarget.getBoundingClientRect();
    setDragPoint({
      x: Math.min(
        Math.max(event.clientX - state.offsetX, 0),
        window.innerWidth - width,
      ),
      y: Math.min(
        Math.max(event.clientY - state.offsetY, 0),
        window.innerHeight - height,
      ),
    });
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const state = drag.current;
    drag.current = null;
    if (!state?.moved) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next: FabPosition = {
      side:
        rect.left + rect.width / 2 < window.innerWidth / 2 ? "left" : "right",
      bottom: Math.round(window.innerHeight - rect.bottom),
    };
    suppressClick.current = true;
    setDragPoint(null);
    setPosition(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  /** Returns true when the click ended a drag and should be ignored. */
  function consumeDragClick() {
    const wasDrag = suppressClick.current;
    suppressClick.current = false;
    return wasDrag;
  }

  let style: CSSProperties | undefined;
  if (dragPoint) {
    style = {
      left: dragPoint.x,
      top: dragPoint.y,
      right: "auto",
      bottom: "auto",
    };
  } else if (bounds) {
    const { side, bottom: preferred } = position ?? {
      side: "right",
      bottom: bounds.min,
    };
    const bottom = Math.min(Math.max(preferred, bounds.min), bounds.max);
    style =
      side === "left"
        ? { left: bounds.gap, right: "auto", bottom }
        : { right: bounds.gap, left: "auto", bottom };
  }

  return {
    style,
    isDragging: dragPoint !== null,
    consumeDragClick,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}
