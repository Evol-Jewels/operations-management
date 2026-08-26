"use client";

import * as React from "react";
import { formatRelativeTime } from "@/lib/utils";

const subscribe = () => () => undefined;

export function RelativeTime({ isoString }: { isoString: string }) {
  const relativeTime = React.useSyncExternalStore(
    subscribe,
    () => formatRelativeTime(isoString),
    () => "",
  );

  return <span>{relativeTime}</span>;
}
