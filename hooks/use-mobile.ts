import * as React from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSnapshot() {
  return !window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
