"use client";

import { IndianRupee } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SalesTargetMeterProps {
  progressValue: number;
  fillHeight: number;
  isIncentiveEligible: boolean;
  isLoading?: boolean;
}

function DiamondGem({
  className,
  delay = 0,
  style,
}: {
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const gradientId = `diamond-${String(delay).replace(".", "-")}`;

  return (
    <motion.svg
      animate={{
        filter: ["brightness(0.98)", "brightness(1.14)", "brightness(0.98)"],
        opacity: [0.9, 1, 0.92],
        y: [0, -1.2, 0],
      }}
      className={className}
      style={style}
      transition={{
        delay,
        duration: 3.8,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      }}
      viewBox="0 0 52 48"
    >
      <defs>
        <linearGradient id={`${gradientId}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#dcfffb" />
          <stop offset="100%" stopColor="#a7f3ee" />
        </linearGradient>
        <linearGradient id={`${gradientId}-left`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8ffff" />
          <stop offset="58%" stopColor="#bff7ef" />
          <stop offset="100%" stopColor="#67d7df" />
        </linearGradient>
        <linearGradient id={`${gradientId}-right`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="55%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#2fb5c4" />
        </linearGradient>
        <linearGradient
          id={`${gradientId}-bottom`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor="#a7f3ee" />
          <stop offset="54%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#168da0" />
        </linearGradient>
        <radialGradient id={`${gradientId}-shine`} cx="32%" cy="24%" r="48%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path
        d="M26 46 5.5 17.5 14 6.5h24l8.5 11L26 46Z"
        fill="rgba(8,145,178,0.24)"
        opacity="0.55"
      />
      <path
        d="M5.5 17.5h41L26 46 5.5 17.5Z"
        fill={`url(#${gradientId}-bottom)`}
        stroke="rgba(8,145,178,0.5)"
        strokeWidth="1"
      />
      <path
        d="M5.5 17.5 14 6.5 22 17.5H5.5Z"
        fill={`url(#${gradientId}-left)`}
        opacity="0.92"
      />
      <path
        d="M30 17.5 38 6.5l8.5 11H30Z"
        fill={`url(#${gradientId}-right)`}
        opacity="0.92"
      />
      <path
        d="M14 6.5h24l-8 11h-8L14 6.5Z"
        fill={`url(#${gradientId}-top)`}
        opacity="0.96"
      />
      <path d="M22 17.5 26 46 30 17.5Z" fill="#dffffb" opacity="0.34" />
      <path d="M5.5 17.5 20 28 26 46 22 17.5Z" fill="#ecfeff" opacity="0.22" />
      <path d="M46.5 17.5 32 28 26 46 30 17.5Z" fill="#0e7490" opacity="0.24" />
      <path
        d="M5.5 17.5h41M14 6.5l12 39.5L38 6.5M22 17.5 14 6.5M30 17.5 38 6.5"
        fill="none"
        stroke="rgba(8,145,178,0.34)"
        strokeLinecap="round"
        strokeWidth="0.75"
      />
      <ellipse cx="18" cy="13" fill={`url(#${gradientId}-shine)`} rx="9" ry="6" />
      <circle cx="31" cy="14" fill="white" opacity="0.78" r="1.6" />
    </motion.svg>
  );
}

export function SalesTargetMeter({
  progressValue,
  fillHeight,
  isIncentiveEligible,
  isLoading,
}: SalesTargetMeterProps) {
  const artworkHostRef = useRef<HTMLDivElement>(null);
  const [artworkWidth, setArtworkWidth] = useState(348);
  const meterProgress = Math.min(
    100,
    Math.max(0, progressValue >= 100 ? 100 : fillHeight),
  );
  const fillSurfaceBottom =
    meterProgress >= 100 ? "calc(100% - 2px)" : `${meterProgress}%`;
  const meterMarks = [100, 75, 50, 25, 0];
  const artworkScale = Math.min(1, artworkWidth / 348);

  useEffect(() => {
    const element = artworkHostRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setArtworkWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Irregularly scattered pieces so the pile reads as poured-in diamonds, not rows.
  const diamondPieces = [
    { left: 14, bottom: 1, size: 23, delay: 0, rotate: -18 },
    { left: 2, bottom: 13, size: 17, delay: 0.02, rotate: -16 },
    { left: 8, bottom: 8, size: 18, delay: 0.04, rotate: 11 },
    { left: 33, bottom: 4, size: 25, delay: 0.1, rotate: 9 },
    { left: 55, bottom: 0, size: 22, delay: 0.15, rotate: -5 },
    { left: 77, bottom: 5, size: 26, delay: 0.25, rotate: 16 },
    { left: 88, bottom: 0, size: 21, delay: 0.05, rotate: -13 },
    { left: 44, bottom: 8, size: 19, delay: 0.12, rotate: 24 },
    { left: 22, bottom: 12, size: 24, delay: 0.2, rotate: 6 },
    { left: 7, bottom: 20, size: 17, delay: 0.24, rotate: -22 },
    { left: 1, bottom: 27, size: 18, delay: 0.31, rotate: 20 },
    { left: 46, bottom: 14, size: 28, delay: 0.3, rotate: -12 },
    { left: 66, bottom: 9, size: 23, delay: 0.35, rotate: 20 },
    { left: 84, bottom: 17, size: 22, delay: 0.22, rotate: -8 },
    { left: 57, bottom: 16, size: 20, delay: 0.18, rotate: -19 },
    { left: 11, bottom: 16, size: 18, delay: 0.27, rotate: 15 },
    { left: 11, bottom: 24, size: 21, delay: 0.4, rotate: -15 },
    { left: 18, bottom: 29, size: 18, delay: 0.37, rotate: 24 },
    { left: 6, bottom: 34, size: 18, delay: 0.44, rotate: 18 },
    { left: 2, bottom: 40, size: 17, delay: 0.49, rotate: -7 },
    { left: 31, bottom: 22, size: 26, delay: 0.45, rotate: 11 },
    { left: 52, bottom: 27, size: 24, delay: 0.5, rotate: -22 },
    { left: 73, bottom: 23, size: 27, delay: 0.55, rotate: 8 },
    { left: 91, bottom: 31, size: 20, delay: 0.42, rotate: -6 },
    { left: 40, bottom: 30, size: 19, delay: 0.58, rotate: 22 },
    { left: 63, bottom: 34, size: 18, delay: 0.48, rotate: -8 },
    { left: 50, bottom: 39, size: 20, delay: 0.57, rotate: 18 },
    { left: 34, bottom: 38, size: 18, delay: 0.54, rotate: 10 },
    { left: 55, bottom: 35, size: 17, delay: 0.56, rotate: -21 },
    { left: 72, bottom: 35, size: 18, delay: 0.59, rotate: 24 },
    { left: 19, bottom: 38, size: 23, delay: 0.6, rotate: 17 },
    { left: 9, bottom: 42, size: 18, delay: 0.52, rotate: -10 },
    { left: 24, bottom: 43, size: 19, delay: 0.63, rotate: -25 },
    { left: 7, bottom: 49, size: 17, delay: 0.67, rotate: 6 },
    { left: 1, bottom: 52, size: 18, delay: 0.71, rotate: 18 },
    { left: 42, bottom: 35, size: 25, delay: 0.65, rotate: -3 },
    { left: 62, bottom: 42, size: 24, delay: 0.7, rotate: 14 },
    { left: 82, bottom: 39, size: 22, delay: 0.62, rotate: -18 },
    { left: 28, bottom: 45, size: 20, delay: 0.68, rotate: -15 },
    { left: 51, bottom: 47, size: 19, delay: 0.74, rotate: 9 },
    { left: 39, bottom: 48, size: 18, delay: 0.69, rotate: 22 },
    { left: 68, bottom: 47, size: 18, delay: 0.73, rotate: -12 },
    { left: 83, bottom: 47, size: 17, delay: 0.76, rotate: 16 },
    { left: 47, bottom: 52, size: 21, delay: 0.79, rotate: -17 },
    { left: 12, bottom: 52, size: 20, delay: 0.75, rotate: -9 },
    { left: 21, bottom: 55, size: 18, delay: 0.77, rotate: 16 },
    { left: 9, bottom: 61, size: 17, delay: 0.81, rotate: -19 },
    { left: 5, bottom: 57, size: 16, delay: 0.86, rotate: 27 },
    { left: 2, bottom: 66, size: 17, delay: 0.91, rotate: -24 },
    { left: 35, bottom: 49, size: 24, delay: 0.8, rotate: 19 },
    { left: 55, bottom: 55, size: 27, delay: 0.85, rotate: -14 },
    { left: 43, bottom: 58, size: 18, delay: 0.82, rotate: 12 },
    { left: 77, bottom: 50, size: 23, delay: 0.78, rotate: 7 },
    { left: 91, bottom: 57, size: 19, delay: 0.72, rotate: -21 },
    { left: 66, bottom: 58, size: 19, delay: 0.83, rotate: 21 },
    { left: 78, bottom: 61, size: 18, delay: 0.87, rotate: -20 },
    { left: 22, bottom: 60, size: 18, delay: 0.89, rotate: -23 },
    { left: 55, bottom: 63, size: 20, delay: 0.93, rotate: 8 },
    { left: 36, bottom: 64, size: 18, delay: 0.96, rotate: -7 },
    { left: 24, bottom: 66, size: 22, delay: 0.9, rotate: -4 },
    { left: 15, bottom: 73, size: 17, delay: 0.94, rotate: 9 },
    { left: 11, bottom: 68, size: 18, delay: 0.97, rotate: 18 },
    { left: 6, bottom: 76, size: 16, delay: 1.06, rotate: -14 },
    { left: 1, bottom: 82, size: 16, delay: 1.13, rotate: 9 },
    { left: 47, bottom: 69, size: 25, delay: 0.95, rotate: 13 },
    { left: 68, bottom: 64, size: 23, delay: 0.88, rotate: -16 },
    { left: 72, bottom: 69, size: 18, delay: 1.01, rotate: 19 },
    { left: 84, bottom: 72, size: 20, delay: 0.92, rotate: 12 },
    { left: 32, bottom: 75, size: 19, delay: 1.08, rotate: -20 },
    { left: 56, bottom: 76, size: 18, delay: 1.16, rotate: -4 },
    { left: 21, bottom: 77, size: 17, delay: 1.18, rotate: 25 },
    { left: 45, bottom: 74, size: 18, delay: 1.22, rotate: -17 },
    { left: 16, bottom: 82, size: 19, delay: 1.0, rotate: 8 },
    { left: 8, bottom: 86, size: 17, delay: 1.24, rotate: -11 },
    { left: 38, bottom: 79, size: 23, delay: 1.05, rotate: -11 },
    { left: 58, bottom: 84, size: 24, delay: 1.1, rotate: 18 },
    { left: 76, bottom: 81, size: 20, delay: 1.02, rotate: -7 },
    { left: 27, bottom: 87, size: 18, delay: 1.28, rotate: 12 },
    { left: 43, bottom: 88, size: 17, delay: 1.32, rotate: -24 },
    { left: 30, bottom: 93, size: 18, delay: 1.15, rotate: -16 },
    { left: 13, bottom: 95, size: 16, delay: 1.34, rotate: 21 },
    { left: 50, bottom: 90, size: 21, delay: 1.2, rotate: 5 },
    { left: 61, bottom: 96, size: 16, delay: 1.38, rotate: -13 },
    { left: 70, bottom: 94, size: 18, delay: 1.12, rotate: 14 },
    { left: 85, bottom: 89, size: 17, delay: 1.25, rotate: -18 },
    { left: 35, bottom: 98, size: 15, delay: 1.42, rotate: 7 },
    { left: 22, bottom: 90, size: 16, delay: 1.46, rotate: -28 },
  ];

  return (
    <div className="flex h-full min-h-72 flex-col rounded-md border border-border/50 bg-card/70 p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground dark:text-white">
          Sales Target Meter
        </p>
        <IndianRupee className="h-5 w-5 text-muted-foreground dark:text-white/70" />
      </div>

      <div
        className="mx-auto mt-5 w-full max-w-[21.75rem]"
        ref={artworkHostRef}
        style={{ height: `${360 * artworkScale}px` }}
      >
      <div
        className="relative h-[22.5rem] w-[21.75rem] origin-top-left"
        style={{ transform: `scale(${artworkScale})` }}
      >
        {/* Jar cap */}
        <div className="absolute left-1/2 top-5 z-30 h-10 w-44 -translate-x-1/2 rounded-md border border-slate-400/50 bg-[linear-gradient(90deg,#e5e7eb,#fafafa_24%,#a3a3a3_50%,#f8fafc_73%,#cbd5e1)] shadow-md dark:border-white/25 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.66),rgba(255,255,255,0.15)_27%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.16)_72%,rgba(255,255,255,0.45))] dark:shadow-[0_10px_22px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-10px_18px_rgba(0,0,0,0.24)]" />

        {/* Progress badge centered on cap */}
        <span
          className={cn(
            "absolute left-1/2 top-[2.7rem] z-40 -translate-x-1/2 rounded-md px-2.5 py-0.5 text-base font-semibold tabular-nums shadow-sm",
            isIncentiveEligible
              ? "bg-emerald-500 text-white"
              : "bg-foreground text-background dark:bg-white dark:text-neutral-950",
          )}
        >
          {isLoading || progressValue == null ? "--" : `${progressValue}%`}
        </span>

        {/* Jar base */}
        <div className="absolute left-1/2 bottom-5 z-30 h-5 w-44 -translate-x-1/2 rounded-md border border-slate-400/50 bg-[linear-gradient(90deg,#e5e7eb,#fafafa_24%,#a3a3a3_50%,#f8fafc_73%,#cbd5e1)] shadow-md dark:border-white/25 dark:bg-[linear-gradient(90deg,rgba(255,255,255,0.52),rgba(255,255,255,0.13)_30%,rgba(255,255,255,0.5)_56%,rgba(255,255,255,0.18)_78%,rgba(255,255,255,0.42))] dark:shadow-[0_8px_18px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-6px_10px_rgba(0,0,0,0.2)]" />

        {/* Jar body */}
        <div className="absolute left-1/2 top-[4rem] h-[15.5rem] w-48 -translate-x-1/2 rounded-b-[2.45rem] rounded-t-[1.75rem] border-2 border-cyan-900/28 bg-[radial-gradient(circle_at_34%_28%,rgba(255,255,255,0.68),transparent_28%),linear-gradient(90deg,rgba(255,255,255,0.56),rgba(207,250,254,0.24)_42%,rgba(8,145,178,0.14))] shadow-[inset_12px_0_20px_rgba(255,255,255,0.55),inset_-16px_0_22px_rgba(8,47,73,0.12),0_18px_34px_rgba(15,23,42,0.16)] backdrop-blur-sm dark:border-white/45 dark:bg-[radial-gradient(circle_at_34%_35%,rgba(255,255,255,0.14),transparent_30%),linear-gradient(90deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015)_42%,rgba(0,0,0,0.2))] dark:shadow-[inset_16px_0_24px_rgba(255,255,255,0.1),inset_-18px_0_24px_rgba(0,0,0,0.38),0_24px_48px_rgba(0,0,0,0.42)]">
          {/* Jar opening shadow */}
          <div className="absolute left-4 right-4 top-1 h-5 rounded-b-[1.35rem] border-x-2 border-b-2 border-slate-300/40 bg-gradient-to-b from-slate-200/60 to-slate-300/40 dark:border-white/30 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(10,10,10,0.44))] dark:shadow-[inset_0_-9px_14px_rgba(0,0,0,0.26),0_1px_0_rgba(255,255,255,0.16)]" />

          {/* Glass reflections */}
          <div className="absolute inset-y-8 left-4 w-2 rounded-full bg-white/38 blur-sm dark:bg-white/20" />
          <div className="absolute inset-y-8 right-7 w-5 rounded-full bg-sky-100/30 blur-md dark:bg-cyan-100/12" />
          <div className="absolute left-8 top-12 h-16 w-7 rounded-full border-l border-white/40 dark:border-white/18" />

          {/* Diamonds fill container fills the full jar interior */}
          <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-b-[2.1rem] rounded-t-[1.45rem]">
            {/* Liquid fill behind diamonds */}
            <motion.div
              animate={{ opacity: [0.46, 0.58, 0.5] }}
              className="absolute inset-x-0 bottom-0 rounded-b-[2.1rem] bg-[radial-gradient(circle_at_35%_24%,rgba(255,255,255,0.7),transparent_30%),linear-gradient(180deg,rgba(240,253,250,0.66),rgba(204,251,241,0.28)_42%,rgba(125,211,252,0.26))] shadow-[0_-10px_24px_rgba(8,145,178,0.1),inset_0_1px_0_rgba(255,255,255,0.66),inset_0_-16px_22px_rgba(14,116,144,0.06)] dark:bg-[radial-gradient(circle_at_35%_24%,rgba(255,255,255,0.2),transparent_34%),linear-gradient(180deg,rgba(45,212,191,0.35),rgba(165,243,252,0.2)_38%,rgba(8,145,178,0.24))] dark:shadow-[0_-12px_30px_rgba(45,212,191,0.18),inset_0_1px_0_rgba(255,255,255,0.32)]"
              style={{ height: `${meterProgress}%` }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />

            {/* Diamonds clipped to fill height */}
            <div
              className="absolute inset-x-0 bottom-0 overflow-hidden rounded-b-[2.1rem]"
              style={{ height: `${meterProgress}%` }}
            >
              <div className="absolute inset-x-2 bottom-4 top-0 rounded-[2rem] bg-cyan-400/18 blur-xl dark:bg-cyan-300/18" />
              {diamondPieces.map((diamond, index) => (
                <DiamondGem
                  className="absolute drop-shadow-[0_3px_5px_rgba(8,47,73,0.36)] dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                  delay={diamond.delay}
                  key={`${diamond.left}-${diamond.bottom}-${index}`}
                  style={{
                    bottom: `${diamond.bottom}%`,
                    height: `${diamond.size}px`,
                    left: `${diamond.left}%`,
                    rotate: `${diamond.rotate}deg`,
                    transform: "translateX(-50%)",
                    width: `${diamond.size}px`,
                  }}
                />
              ))}

              {/* Soft surface shimmer at the top of the fill */}
              <div className="absolute -top-2 left-3 right-3 h-6 rounded-[50%] bg-white/45 blur-sm dark:bg-white/38" />
              <div className="absolute left-5 right-5 top-0 h-px bg-cyan-950/20 shadow-[0_0_12px_rgba(8,145,178,0.34)] dark:bg-cyan-50/90 dark:shadow-[0_0_16px_rgba(165,243,252,0.75)]" />
            </div>
          </div>

          {/* Fill line indicator */}
          <div
            className="absolute left-0 right-0 z-20 h-1 rounded-full bg-cyan-500 shadow-[0_0_14px_rgba(8,145,178,0.45)] dark:bg-cyan-100/85 dark:shadow-[0_0_18px_rgba(125,249,236,0.7)]"
            style={{ bottom: fillSurfaceBottom }}
          />
        </div>

        {/* Side scale */}
        <div className="absolute left-[17.1rem] top-[5.25rem] h-[13.15rem] w-[4.5rem]">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-border dark:bg-white/12">
            <div
              className="absolute bottom-0 left-0 w-px bg-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-500 dark:bg-cyan-300 dark:shadow-[0_0_16px_rgba(34,211,238,0.7)]"
              style={{ height: `${meterProgress}%` }}
            />
          </div>
          {meterMarks.map((mark) => {
            const isCurrentMark =
              meterProgress >= mark || (mark === 0 && meterProgress > 0);

            return (
              <div
                className="absolute left-0 flex -translate-y-1/2 items-center gap-1.5"
                key={mark}
                style={{ top: `${100 - mark}%` }}
              >
                <span
                  className={cn(
                    "h-px w-3 bg-border dark:bg-white/45",
                    isCurrentMark && "bg-sky-400 dark:bg-cyan-300",
                  )}
                />
                <span
                  className={cn(
                    "rounded-full border border-border/50 bg-muted/50 px-1.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground shadow-sm dark:border-white/12 dark:bg-white/[0.04] dark:text-white/62 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
                    isCurrentMark &&
                      "border-sky-400/40 bg-sky-50 text-sky-700 dark:border-cyan-300/35 dark:bg-cyan-300/12 dark:text-cyan-100",
                  )}
                >
                  {mark}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Ground shadow */}
        <div className="absolute left-1/2 bottom-1 h-7 w-48 -translate-x-1/2 rounded-[50%] bg-black/15 blur-xl dark:bg-black/45" />
      </div>
      </div>
    </div>
  );
}
