import * as React from "react";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return /Android/i.test(navigator.userAgent);
}

// Chrome on Android opens the system photo picker for media-only inputs, and
// its files can become unreadable right after selection. Allowing any file
// type makes Chrome use the regular file chooser, whose files stay readable.
export function useFilePickerAccept(accept: string) {
  const isAndroid = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );
  return isAndroid ? `${accept},*/*` : accept;
}
