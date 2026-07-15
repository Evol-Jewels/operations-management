import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const REPLAY_SAMPLE_KEY = "evol:posthog:record-session";

function shouldRecordSession() {
  try {
    const storedDecision = window.sessionStorage.getItem(REPLAY_SAMPLE_KEY);
    if (storedDecision) return storedDecision === "true";

    const shouldRecord = Math.random() < 0.2;
    window.sessionStorage.setItem(REPLAY_SAMPLE_KEY, String(shouldRecord));
    return shouldRecord;
  } catch {
    return false;
  }
}

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: !shouldRecordSession(),
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    person_profiles: "identified_only",
    loaded: (client) => {
      if (process.env.NODE_ENV === "development") {
        client.debug();
      }
    },
  });
}
