"use client";

import { useEffect, useState } from "react";
import type { ProductReference } from "@/components/enquiries/enquiry-form-types";
import {
  RequirementImageCarousel,
  RequirementRecordedMedia,
} from "@/components/enquiry/requirements/RequirementMediaPanel";
import { LinkReferenceCard } from "@/components/requirements/RequirementReferencesSection";
import type { Repair, RepairReference } from "@/lib/repairs";

export function RepairReferencesPreview({ repair }: { repair: Repair }) {
  const [references, setReferences] = useState<ProductReference[]>([]);
  useEffect(() => {
    const stored: RepairReference[] = repair.references ?? [
      ...repair.images.map((image) => ({ ...image, type: "image" as const })),
      ...(repair.video ? [{ ...repair.video, type: "video" as const }] : []),
    ];
    const urls: string[] = [];
    const previews = stored.map((reference) => {
      const url = reference.file
        ? URL.createObjectURL(reference.file)
        : (reference.url ?? "");
      if (reference.file) urls.push(url);
      return {
        id: reference.id,
        type: reference.type,
        name: reference.name,
        url,
        mimeType: reference.mimeType ?? reference.file?.type,
        size: reference.size ?? reference.file?.size,
        durationSeconds: reference.durationSeconds,
      };
    });
    setReferences(previews);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [repair.references, repair.images, repair.video]);
  const item = {
    id: repair.id,
    title: repair.category || "Repair product",
    images: references.filter((reference) => reference.type === "image"),
    videos: references.filter((reference) => reference.type === "video"),
    audios: references.filter((reference) => reference.type === "audio"),
  };
  return (
    <div className="space-y-4">
      <RequirementImageCarousel item={item} />
      <RequirementRecordedMedia item={item} />
      {references
        .filter((reference) => reference.type === "link")
        .map((reference) => (
          <LinkReferenceCard key={reference.id} reference={reference} />
        ))}
    </div>
  );
}
