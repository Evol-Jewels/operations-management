"use client";

import { notFound, useParams } from "next/navigation";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { EnquiryDetailPage } from "@/components/enquiry/EnquiryDetailPage";
import {
  useCreateEnquiryEvent,
  useCreateEstimation,
  useEnquiryDetailsByRefCode,
  useUpdateEnquiry,
  useUpdateEstimation,
} from "@/hooks/useEnquiries";
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
  const createEvent = useCreateEnquiryEvent(id);
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

  const order = mapBackendEnquiryDetailsToOrder(details);

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
    await createEvent.mutateAsync({ message: message.trim() });
  }

  async function handleCloseEnquiry({
    reason,
    notes,
  }: {
    reason: string;
    notes: string;
  }) {
    await updateEnquiry.mutateAsync({ status: "CLOSED" });

    const messageParts = [`Enquiry closed. Reason: ${reason}`];
    if (notes.trim()) {
      messageParts.push(notes.trim());
    }

    await createEvent.mutateAsync({ message: messageParts.join(" - ") });
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
      isPostingUpdate={createEvent.isPending || updateEnquiry.isPending}
      isClosingEnquiry={updateEnquiry.isPending || createEvent.isPending}
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
