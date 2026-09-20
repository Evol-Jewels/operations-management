import type { AgentStreamEvent } from "./agent-api";

export type VoiceConnection = {
  url: string;
  token: string;
  room: string;
  expiresInMs: number;
};

export type VoiceEvent = {
  turnId: string;
  event: AgentStreamEvent | { type: "user"; text: string };
};

export type VoiceState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "reconnecting";
