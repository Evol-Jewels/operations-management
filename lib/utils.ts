import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  type Order,
  type RiskSignal,
  STAGE_EXPECTED_DAYS,
  STAGES,
  type Stage,
  type UrgencyLevel,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Stage helpers ────────────────────────────────────────────────────────────

export function getStageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

export function isStageComplete(stage: Stage, currentStage: Stage): boolean {
  return getStageIndex(stage) < getStageIndex(currentStage);
}

export function isStageCurrent(stage: Stage, currentStage: Stage): boolean {
  return stage === currentStage;
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

export function getUrgencyLevel(
  deliveryDate: string | undefined,
): UrgencyLevel {
  if (!deliveryDate) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due-soon";
  return "on-track";
}

export function getDaysRemaining(
  deliveryDate: string | undefined,
): number | null {
  if (!deliveryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  return Math.floor(
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatDaysRemaining(deliveryDate: string | undefined): string {
  const days = getDaysRemaining(deliveryDate);
  if (days === null) return "No date";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days}d remaining`;
}

// ─── Date formatting ─────────────────────────────────────────────────────────

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns a human-readable relative time string from an ISO timestamp.
 * Examples: "just now", "2h ago", "Yesterday", "3d ago", "12 Jan"
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 2) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  // Older than 30 days — show the date
  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Risk signal helpers ──────────────────────────────────────────────────────

/**
 * Returns the number of days since the last activity was posted on an order.
 * Returns null if there are no activity entries.
 */
export function getDaysSinceLastActivity(order: Order): number | null {
  if (!order.activityFeed.length) return null;
  const sorted = [...order.activityFeed].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const latest = new Date(sorted[0].timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  latest.setHours(0, 0, 0, 0);
  return Math.floor(
    (today.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Returns the number of days the order has been in its current stage,
 * calculated from the most recent stage_change entry (or createdAt if none).
 */
export function getDaysInCurrentStage(order: Order): number {
  // Find the latest stage_change entry that moved TO the current stage
  const stageChanges = [...order.activityFeed]
    .filter(
      (e) => e.type === "stage_change" && e.newStage === order.currentStage,
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  const stageEnteredAt =
    stageChanges.length > 0
      ? new Date(stageChanges[0].timestamp)
      : new Date(order.createdAt);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  stageEnteredAt.setHours(0, 0, 0, 0);
  return Math.floor(
    (today.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Computes the risk signal for an order:
 * - "stale": no activity in 7+ days AND order is not complete
 * - "stuck": in current stage longer than STAGE_EXPECTED_DAYS threshold
 * - null: no risk
 *
 * Stale takes priority over stuck.
 * Terminal stage "Customer Pickup" has no risk signals.
 */
export function computeRiskSignal(order: Order): RiskSignal {
  // Terminal stage — no risk signals
  if (order.currentStage === "Customer Pickup") return null;

  const daysSinceActivity = getDaysSinceLastActivity(order);
  if (daysSinceActivity !== null && daysSinceActivity >= 7) return "stale";

  const expectedDays = STAGE_EXPECTED_DAYS[order.currentStage];
  if (expectedDays !== undefined) {
    const daysInStage = getDaysInCurrentStage(order);
    if (daysInStage > expectedDays) return "stuck";
  }

  return null;
}
