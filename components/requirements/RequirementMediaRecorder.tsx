"use client";

import { fixWebmDuration } from "@fix-webm-duration/fix";
import {
  Circle,
  Mic,
  Pause,
  Play,
  RefreshCcw,
  Square,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPreviewPlayer } from "@/components/requirements/AudioPreviewPlayer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type EnquiryRecordingKind,
  getEnquiryMediaSizeError,
} from "@/lib/enquiryMedia";
import { cn } from "@/lib/utils";

export type RecordingKind = EnquiryRecordingKind;

type RecorderState =
  | "idle"
  | "requesting"
  | "ready"
  | "recording"
  | "paused"
  | "preview";

export function RequirementMediaRecorder({
  kind,
  open,
  onOpenChange,
  onRecorded,
}: {
  kind: RecordingKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: (file: File, durationSeconds: number) => void;
}) {
  const [state, setState] = useState<RecorderState>("requesting");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewUrlRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const recordedMsRef = useRef(0);
  const discardingRef = useRef(false);
  const requestIdRef = useRef(0);

  const isVideo = kind === "video";
  const title = isVideo ? "Record a video" : "Record audio";

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
  }

  function clearPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    setRecordedFile(null);
  }

  function reset() {
    clearTimer();
    requestIdRef.current += 1;
    discardingRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    chunksRef.current = [];
    recordedMsRef.current = 0;
    stopStream();
    clearPreview();
    setElapsedSeconds(0);
    setError("");
    setState("idle");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  useEffect(() => {
    const video = liveVideoRef.current;
    if (video && streamRef.current && state !== "preview") {
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive")
        recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const prepareRecorder = useCallback(async () => {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setState("idle");
      setError(
        "Recording is not supported in this browser. Try a current version of Chrome, Edge, or Safari.",
      );
      return;
    }

    const requestId = ++requestIdRef.current;
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        isVideo
          ? {
              audio: true,
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            }
          : { audio: true, video: false },
      );
      if (requestId !== requestIdRef.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;
      setState("ready");
    } catch (permissionError) {
      if (requestId !== requestIdRef.current) return;
      setState("idle");
      setError(getPermissionError(permissionError, kind));
    }
  }, [isVideo, kind]);

  useEffect(() => {
    if (!open) return;
    const requestTimer = window.setTimeout(() => {
      void prepareRecorder();
    }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [open, prepareRecorder]);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    setError("");
    chunksRef.current = [];
    const mimeType = getSupportedMimeType(kind);
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      clearTimer();
      stopStream();
      setState("idle");
      setError("The recording stopped unexpectedly. Please try again.");
    };
    recorder.onstop = async () => {
      clearTimer();
      if (discardingRef.current) return;
      const recordedDuration = Math.max(
        1,
        Math.round(recordedMsRef.current / 1000),
      );
      setElapsedSeconds(recordedDuration);
      const resolvedMimeType =
        recorder.mimeType ||
        mimeType ||
        (isVideo ? "video/webm" : "audio/webm");
      const recordedBlob = new Blob(chunksRef.current, {
        type: resolvedMimeType,
      });
      chunksRef.current = [];
      stopStream();

      if (!recordedBlob.size) {
        setState("idle");
        setError("No recording was captured. Please try again.");
        return;
      }

      const blob = resolvedMimeType.includes("webm")
        ? await fixWebmDuration(recordedBlob, recordedMsRef.current, {
            logger: false,
          })
        : recordedBlob;

      const file = new File([blob], createFileName(kind, resolvedMimeType), {
        type: resolvedMimeType,
        lastModified: Date.now(),
      });
      const nextPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = nextPreviewUrl;
      setPreviewUrl(nextPreviewUrl);
      const sizeError = getEnquiryMediaSizeError(file, kind);
      setRecordedFile(sizeError ? null : file);
      setError(sizeError ?? "");
      setState("preview");
    };

    startedAtRef.current = Date.now();
    recordedMsRef.current = 0;
    discardingRef.current = false;
    setElapsedSeconds(0);
    startTimer();
    recorder.start(1000);
    setState("recording");
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (recorder.state === "recording") {
      recordedMsRef.current += Date.now() - startedAtRef.current;
    }
    clearTimer();
    recorder.stop();
  }

  function pauseRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recordedMsRef.current += Date.now() - startedAtRef.current;
    recorder.pause();
    clearTimer();
    setElapsedSeconds(Math.floor(recordedMsRef.current / 1000));
    setState("paused");
  }

  function resumeRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    startedAtRef.current = Date.now();
    startTimer();
    setState("recording");
  }

  function startTimer() {
    clearTimer();
    timerRef.current = setInterval(() => {
      const activeMs = Date.now() - startedAtRef.current;
      setElapsedSeconds(Math.floor((recordedMsRef.current + activeMs) / 1000));
    }, 250);
  }

  async function retake() {
    clearPreview();
    setElapsedSeconds(0);
    setState("idle");
    await prepareRecorder();
  }

  function useRecording() {
    if (!recordedFile) return;
    onRecorded(recordedFile, elapsedSeconds);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-xl"
        onEscapeKeyDown={(event) => {
          if (state === "recording" || state === "paused")
            event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (state === "recording" || state === "paused")
            event.preventDefault();
        }}
      >
        <DialogHeader className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This recording stays on this device until you create the enquiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5">
          <div
            className={cn(
              "relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30",
              isVideo && "bg-black",
            )}
          >
            {isVideo && state !== "preview" && streamRef.current ? (
              <video
                ref={liveVideoRef}
                muted
                autoPlay
                playsInline
                aria-label="Live camera preview"
                className="aspect-video size-full object-contain"
              />
            ) : null}

            {state === "preview" && previewUrl ? (
              isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="aspect-video size-full object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <div className="w-full space-y-5 px-6 text-center">
                  <RecorderGlyph kind={kind} active={false} />
                  <AudioPreviewPlayer
                    src={previewUrl}
                    durationSeconds={elapsedSeconds}
                  />
                </div>
              )
            ) : null}

            {!isVideo && state !== "preview" ? (
              <div className="space-y-4 text-center">
                <RecorderGlyph kind={kind} active={state === "recording"} />
                <p className="text-sm font-medium text-foreground">
                  {state === "recording"
                    ? "Recording your microphone"
                    : state === "paused"
                      ? "Recording paused"
                      : "Microphone preview"}
                </p>
              </div>
            ) : null}

            {isVideo && !streamRef.current && state !== "preview" ? (
              <div className="space-y-3 px-6 text-center text-white/75">
                <Video className="mx-auto size-8" />
                <p className="text-sm">Your camera preview will appear here.</p>
              </div>
            ) : null}

            {state === "recording" || state === "paused" ? (
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    state === "recording"
                      ? "animate-pulse bg-red-500"
                      : "bg-amber-400",
                  )}
                />
                {state === "recording" ? "REC" : "PAUSED"}{" "}
                {formatDuration(elapsedSeconds)}
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border bg-muted/15 px-5 py-3">
          <div className="flex flex-wrap justify-end gap-2">
            {state === "preview" ? (
              <>
                <Button type="button" variant="outline" onClick={retake}>
                  <RefreshCcw className="size-3.5" /> Retake
                </Button>
                <Button
                  type="button"
                  disabled={!recordedFile}
                  onClick={useRecording}
                >
                  Use recording
                </Button>
              </>
            ) : state === "recording" || state === "paused" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    state === "recording" ? pauseRecording : resumeRecording
                  }
                >
                  {state === "recording" ? <Pause /> : <Play />}
                  {state === "recording" ? "Pause" : "Resume"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                >
                  <Square className="size-3 fill-current" /> Stop
                </Button>
              </>
            ) : state === "ready" ? (
              <Button type="button" onClick={startRecording}>
                <Circle className="size-3.5 fill-current text-red-500" /> Start
              </Button>
            ) : (
              <Button
                type="button"
                disabled={state === "requesting"}
                onClick={prepareRecorder}
              >
                <Circle className="size-3.5 fill-current text-red-500" />
                {state === "requesting" ? "Preparing..." : "Start"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecorderGlyph({
  kind,
  active,
}: {
  kind: RecordingKind;
  active: boolean;
}) {
  const Icon = kind === "video" ? Video : Mic;
  return (
    <div
      className={cn(
        "mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-background shadow-sm",
        active && "border-red-500/40 bg-red-500/10 text-red-600",
      )}
    >
      <Icon className="size-7" />
    </div>
  );
}

function getSupportedMimeType(kind: RecordingKind) {
  const candidates =
    kind === "video"
      ? [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          "video/mp4",
        ]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function createFileName(kind: RecordingKind, mimeType: string) {
  const extension = mimeType.includes("mp4")
    ? kind === "audio"
      ? "m4a"
      : "mp4"
    : "webm";
  return `${kind}-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function getPermissionError(error: unknown, kind: RecordingKind) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return `Permission was denied. Allow ${kind === "video" ? "camera and microphone" : "microphone"} access in your browser settings and try again.`;
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return `No ${kind === "video" ? "camera or microphone" : "microphone"} was found on this device.`;
  }
  return `Could not start ${kind} recording. Check that the device is available and try again.`;
}
