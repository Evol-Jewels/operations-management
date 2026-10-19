"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

const INK = "#1b2534";
const OUTLINE = "M20 14h24l14 10-26 34L6 24z";
const FACETS = [
  { d: "M6 24 20 14l4 10z", fill: "#e6f2fb" },
  { d: "M20 14h12l-8 10z", fill: "#ffffff" },
  { d: "M24 24l8-10 8 10z", fill: "#d5e9f7" },
  { d: "M32 14h12l-4 10z", fill: "#f4f9fd" },
  { d: "M40 24l4-10 14 10z", fill: "#c0dcf0" },
  { d: "M6 24h18l8 34z", fill: "#d2e6f5" },
  { d: "M24 24h16l-8 34z", fill: "#e8f3fb" },
  { d: "M40 24h18L32 58z", fill: "#acd0ea" },
];

/** Evol-E, the assistant mascot: a small cut diamond that floats, blinks and glints. */
export function EvolE({
  size = 32,
  mood = "idle",
  className,
}: {
  size?: number;
  mood?: "idle" | "thinking";
  className?: string;
}) {
  const id = useId().replace(/[^\w-]/g, "");
  const still = useReducedMotion() ?? false;
  const thinking = mood === "thinking";
  const loop = (duration: number) =>
    still
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <clipPath id={`${id}-gem`}>
          <path d={OUTLINE} />
        </clipPath>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-sheen`} x1="0" x2="1">
          <stop stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.ellipse
        cx="32"
        cy="61"
        rx="15"
        ry="2.4"
        fill={`url(#${id}-shadow)`}
        animate={still ? undefined : { scaleX: [1, 0.85, 1] }}
        transition={loop(thinking ? 1.4 : 3.6)}
      />
      <motion.g
        animate={
          still
            ? undefined
            : thinking
              ? { y: [0, -2, 0], rotate: [-3, 3, -3] }
              : { y: [0, -2, 0] }
        }
        transition={loop(thinking ? 1.4 : 3.6)}
      >
        <g clipPath={`url(#${id}-gem)`}>
          {FACETS.map((facet) => (
            <path
              key={facet.d}
              d={facet.d}
              fill={facet.fill}
              stroke="#fff"
              strokeOpacity="0.7"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          ))}
          <path d="M9 23.5 19.5 16l1.5 3.5L12 24z" fill="#fff" opacity="0.8" />
          {!still && (
            <motion.rect
              y="6"
              width="10"
              height="60"
              fill={`url(#${id}-sheen)`}
              initial={{ x: -24, rotate: 20 }}
              animate={{ x: 72 }}
              transition={{
                duration: 1.1,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: thinking ? 0.6 : 4.5,
              }}
            />
          )}
        </g>
        <path
          d={OUTLINE}
          stroke={INK}
          strokeOpacity="0.85"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <motion.g
          animate={
            still
              ? undefined
              : thinking
                ? { x: 1.2, y: -1.4, scaleY: 1 }
                : { x: 0, y: 0, scaleY: [1, 1, 0.12, 1] }
          }
          transition={
            thinking || still
              ? { duration: 0.3 }
              : { duration: 4.2, times: [0, 0.93, 0.965, 1], repeat: Infinity }
          }
        >
          <rect x="25.6" y="30" width="3.2" height="5.4" rx="1.6" fill={INK} />
          <rect x="35.2" y="30" width="3.2" height="5.4" rx="1.6" fill={INK} />
        </motion.g>
        <path
          d={thinking ? "M30.4 39.6h3.2" : "M30 39q2 1.6 4 0"}
          stroke={INK}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </motion.g>
      <motion.path
        d="M54 3q.5 3.5 4 4-3.5.5-4 4-.5-3.5-4-4 3.5-.5 4-4z"
        fill="#e8b84a"
        animate={
          still
            ? undefined
            : thinking
              ? { rotate: 360, scale: [1, 1.15, 1] }
              : { scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }
        }
        transition={
          still
            ? { duration: 0 }
            : thinking
              ? { duration: 1.8, repeat: Infinity, ease: "linear" }
              : loop(2.8)
        }
      />
      <motion.circle
        cx="60"
        cy="14"
        r="1"
        fill="#e8b84a"
        animate={still ? undefined : { opacity: [0, 0.9, 0] }}
        transition={still ? { duration: 0 } : { ...loop(2.8), delay: 1.4 }}
      />
    </svg>
  );
}
