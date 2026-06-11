"use client";

import { notFound, useParams } from "next/navigation";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { EnquiryDetailPage } from "@/components/enquiry/EnquiryDetailPage";
import {
  enquiryKeys,
  useCreateEstimation,
  useEnquiryDetailsByRefCode,
  useUpdateEnquiry,
  useUpdateEstimation,
} from "@/hooks/useEnquiries";
import { useComments, useCreateComment } from "@/hooks/useSourceActivity";
import { mapBackendEnquiryDetailsToOrder } from "@/lib/enquiryMappers";
import type { ProductEstimation } from "@/types";

function toDecimal(value: number, digits = 2) {
  return value.toFixed(digits);
}

function estimationToApiInput(estimation: ProductEstimation) {
  return {
    metalType: "Gold",
    metalPurity: estimation.purity,
    netWeight: toDecimal(estimation.metalWeight, 3),
    stones: estimation.stoneDetails.map((stone) => ({
      stoneType: stone.type,
      weight: toDecimal(stone.netWeight, 3),
    })),
    makingCost: toDecimal(estimation.finalAmount),
  };
}

function EnquiryPageContent() {
  const params = useParams();
  const refCode = Number(params.refCode);
  const enquiryQuery = useEnquiryDetailsByRefCode(refCode);
  const details = enquiryQuery.data;
  const id = details?.enquiry.id ?? "";
  const createEstimation = useCreateEstimation(id);
  const updateEstimation = useUpdateEstimation(id);
  const commentsQuery = useComments("ENQUIRY", refCode);
  const createComment = useCreateComment("ENQUIRY", refCode, {
    invalidateQueryKeys: [enquiryKeys.detailByRefCode(refCode)],
  });
  const updateEnquiry = useUpdateEnquiry(id);

  if (enquiryQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-sm text-muted-foreground">
        Loading enquiry...
      </div>
    );
  }

  if (enquiryQuery.isError) {
    notFound();
  }

  if (!details) return null;

  const order = mapBackendEnquiryDetailsToOrder(
    details,
    commentsQuery.data ?? [],
  );

  function handleSaveEstimation(
    productId: string,
    estimation: ProductEstimation,
  ) {
    const existing = details?.items
      .find((item) => item.id === productId)
      ?.estimations?.find((item) => item.id === estimation.id);

    if (existing) {
      updateEstimation.mutate({
        estimationId: estimation.id,
        input: estimationToApiInput(estimation),
      });
      return;
    }

    createEstimation.mutate({
      itemId: productId,
      input: estimationToApiInput(estimation),
    });
  }

  async function handlePostUpdate({ message }: { message: string }) {
    const note = message.trim();
    if (!note) return;

    await createComment.mutateAsync(note);
  }

  async function handleCloseEnquiry({
    reason,
    notes,
  }: {
    reason: string;
    notes: string;
  }) {
    await updateEnquiry.mutateAsync({ status: "CLOSED" });

    const closeNote = [reason, notes.trim()].filter(Boolean).join(" - ");
    if (closeNote) {
      await createComment.mutateAsync(closeNote);
    }
  }

  return (
    <EnquiryDetailPage
      order={order}
      onSaveEstimation={handleSaveEstimation}
      onPostUpdate={handlePostUpdate}
      onCloseEnquiry={handleCloseEnquiry}
      isSavingEstimation={
        createEstimation.isPending || updateEstimation.isPending
      }
      isPostingUpdate={createComment.isPending || updateEnquiry.isPending}
      isClosingEnquiry={updateEnquiry.isPending || createComment.isPending}
    />
  );
}

export default function EnquiryPage() {
  return (
    <RequireInternalAuth>
      <EnquiryPageContent />
    </RequireInternalAuth>
  );
}
