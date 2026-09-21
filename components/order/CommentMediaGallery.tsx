import { ExternalLink, ImageIcon, Video } from "lucide-react";
import { AudioPreviewPlayer } from "@/components/requirements/AudioPreviewPlayer";
import { Button } from "@/components/ui/button";
import type { ActivityEntry } from "@/types";

type CommentMedia = NonNullable<ActivityEntry["media"]>[number];

function MediaLabel({ item }: { item: CommentMedia }) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2.5 py-2">
      {item.type === "video" ? (
        <Video className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {item.name}
      </span>
      <Button variant="ghost" size="icon-xs" asChild>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.name}`}
        >
          <ExternalLink className="size-3.5" />
        </a>
      </Button>
    </div>
  );
}

export function CommentMediaGallery({ media }: { media: CommentMedia[] }) {
  if (media.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {media.map((item, index) => {
        const key = `${item.url}-${index}`;
        if (item.type === "audio") {
          return (
            <div key={key} className="sm:col-span-2">
              <AudioPreviewPlayer
                src={item.url}
                durationSeconds={item.durationSeconds}
                className="bg-muted/30"
              />
              <p className="mt-1.5 truncate px-1 text-[11px] text-muted-foreground">
                {item.name}
              </p>
            </div>
          );
        }

        return (
          <div
            key={key}
            className="min-w-0 overflow-hidden rounded-lg border border-border bg-muted/20"
          >
            {item.type === "image" ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {/* biome-ignore lint/performance/noImgElement: comment media is hosted remotely. */}
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-opacity hover:opacity-90"
                />
              </a>
            ) : (
              <video
                src={item.url}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black object-contain"
              >
                <track kind="captions" />
              </video>
            )}
            <MediaLabel item={item} />
          </div>
        );
      })}
    </div>
  );
}
