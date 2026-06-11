"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/utils";

export function RelativeTime({ isoString }: { isoString: string }) {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    setRelativeTime(formatRelativeTime(isoString));
  }, [isoString]);

  return <span>{relativeTime}</span>;
}
