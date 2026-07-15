"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function captureProductEvent(
  eventName: string,
  properties: AnalyticsProperties = {},
) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

  posthog.capture(eventName, properties);
}
