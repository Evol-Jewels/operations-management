"use client";

import type { LocalAudioTrack, Room } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { endAgentVoice, startAgentVoice } from "@/lib/agentApi";
import type {
  VoiceConnection,
  VoiceEvent,
  VoiceState,
} from "@/types/agent-voice";

type Options = {
  ensureSession: () => Promise<string>;
  onEvent: (event: VoiceEvent) => void;
  onActiveChange: (active: boolean) => void;
  onReconnect: () => void;
  scope: string;
};

type ActiveCall = {
  room?: Room;
  track?: LocalAudioTrack;
  connection?: VoiceConnection;
  sessionId?: string;
  timer?: ReturnType<typeof setTimeout>;
  expiry?: ReturnType<typeof setTimeout>;
};

export function useInventoryVoice(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<ActiveCall | null>(null);

  const end = () => {
    const call = active.current;
    if (!call) return;
    active.current = null;
    clearTimeout(call.timer);
    clearTimeout(call.expiry);
    call.track?.stop();
    if (call.room) {
      for (const participant of call.room.remoteParticipants.values()) {
        for (const publication of participant.audioTrackPublications.values()) {
          publication.track?.detach().forEach((element) => element.remove());
        }
      }
      void call.room.disconnect();
    }
    if (call.connection && call.sessionId)
      void endAgentVoice(call.sessionId, call.connection.room).catch(
        () => undefined,
      );
    setState("idle");
    setMuted(false);
    setAudioBlocked(false);
    latest.current.onActiveChange(false);
  };
  const endRef = useRef(end);
  endRef.current = end;
  useEffect(() => () => endRef.current(), [options.scope]);

  const start = async () => {
    if (active.current) return;
    const call: ActiveCall = {};
    active.current = call;
    setError("");
    setState("connecting");
    latest.current.onActiveChange(true);
    const current = () => active.current === call;
    const fail = (message: string) => {
      if (!current()) return;
      setError(message);
      endRef.current();
    };
    try {
      const { Room, RoomEvent, Track, ParticipantKind, createLocalAudioTrack } =
        await import("livekit-client");
      if (!current()) return;
      call.track = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      if (!current()) {
        call.track.stop();
        return;
      }
      call.sessionId = await latest.current.ensureSession();
      if (!current()) return;
      // Let a completed start return its room so a cancelled connection can clean it up.
      const connectionStartedAt = performance.now();
      call.connection = await startAgentVoice(
        call.sessionId,
        AbortSignal.timeout(45_000),
      );
      if (!current()) {
        void endAgentVoice(call.sessionId, call.connection.room).catch(
          () => undefined,
        );
        return;
      }
      const room = new Room({ adaptiveStream: true, dynacast: true });
      call.room = room;
      const updateAgent = () => {
        if (!current()) return;
        const agent = [...room.remoteParticipants.values()].find(
          (participant) => participant.kind === ParticipantKind.AGENT,
        );
        const agentState =
          agent?.attributes["inventory.voice.state"] ??
          agent?.attributes["lk.agent.state"];
        if (
          agentState === "listening" ||
          agentState === "thinking" ||
          agentState === "speaking"
        ) {
          clearTimeout(call.timer);
          setState(agentState);
        }
      };
      let events = Promise.resolve();
      room.registerTextStreamHandler(
        "inventory.events",
        (reader, participant) => {
          const source = room.remoteParticipants.get(participant.identity);
          if (source?.kind !== ParticipantKind.AGENT) return;
          const content = reader.readAll();
          events = events
            .then(async () => {
              const raw: unknown = JSON.parse(await content);
              if (
                !current() ||
                !raw ||
                typeof raw !== "object" ||
                !("turnId" in raw) ||
                !("event" in raw)
              )
                return;
              latest.current.onEvent(raw as VoiceEvent);
            })
            .catch(() => {
              if (current())
                setError(
                  "A chat update was missed. Saved messages will reload when voice ends.",
                );
            });
        },
      );
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio || !current()) return;
        const element = track.attach();
        element.style.display = "none";
        document.body.appendChild(element);
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) =>
        track.detach().forEach((element) => element.remove()),
      );
      room.on(RoomEvent.ParticipantAttributesChanged, updateAgent);
      room.on(RoomEvent.ParticipantConnected, updateAgent);
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant.kind === ParticipantKind.AGENT)
          fail(
            "The voice assistant disconnected. You can start voice again or continue typing.",
          );
      });
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (current()) setAudioBlocked(!room.canPlaybackAudio);
      });
      room.on(RoomEvent.Reconnecting, () => {
        if (current()) setState("reconnecting");
      });
      room.on(RoomEvent.Reconnected, () => {
        updateAgent();
        if (current()) latest.current.onReconnect();
      });
      room.on(RoomEvent.Disconnected, () =>
        fail("Voice disconnected. Your conversation is saved."),
      );
      call.timer = setTimeout(
        () =>
          fail("Voice could not connect. Please try again or continue typing."),
        45_000,
      );
      call.expiry = setTimeout(
        () =>
          fail("This voice session has ended. Start voice again to continue."),
        Math.max(
          0,
          call.connection.expiresInMs -
            (performance.now() - connectionStartedAt),
        ),
      );
      await room.connect(call.connection.url, call.connection.token);
      if (!current()) {
        await room.disconnect();
        return;
      }
      await room.localParticipant.publishTrack(call.track);
      await room.startAudio().catch(() => {
        if (current()) setAudioBlocked(true);
      });
      updateAgent();
    } catch (cause) {
      fail(
        cause instanceof Error && cause.name === "NotAllowedError"
          ? "Allow microphone access in your browser to use voice."
          : cause instanceof Error
            ? cause.message
            : "Unable to start voice. Please try again.",
      );
    }
  };

  const toggleMute = async () => {
    const call = active.current;
    if (!call?.track) return;
    try {
      if (call.track.isMuted) await call.track.unmute();
      else await call.track.mute();
      if (active.current === call) setMuted(call.track.isMuted);
    } catch {
      setError("Unable to change the microphone. End voice and try again.");
    }
  };

  return {
    state,
    muted,
    audioBlocked,
    error,
    active: state !== "idle",
    start,
    end,
    toggleMute,
    enableAudio: () => {
      void active.current?.room
        ?.startAudio()
        .catch(() => setError("Your browser could not play audio."));
    },
    dismissError: () => setError(""),
  };
}
