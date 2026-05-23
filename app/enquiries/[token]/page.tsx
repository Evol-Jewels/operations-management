"use client";

import { notFound, useParams } from "next/navigation";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { EnquiryDetailPage } from "@/components/enquiry/EnquiryDetailPage";
import {
  useCreateEnquiryEvent,
  useCreateEstimation,
  useEnquiryDetails,
  useUpdateEnquiry,
  useUpdateEstimation,
} from "@/hooks/useEnquiries";
import { mapBackendEnquiryDetailsToOrder } from "@/lib/enquiryMappers";
import type { ActorRole, ProductEstimation, Stage } from "@/types";

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

function stageToBackendStatus(stage: Stage | null) {
  if (stage === "Estimation") return "ESTIMATE_SENT" as const;
  if (stage === "Order Confirmed") return "ORDER_PLACED" as const;
  if (stage === "Enquiry") return "IN_PROGRESS" as const;
  return null;
}

function EnquiryPageContent() {
  const params = useParams();
  const id = params.token as string;
  const enquiryQuery = useEnquiryDetails(id);
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

  const details = enquiryQuery.data;
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

  function handlePostUpdate({
    note,
    newStage,
  }: {
    name: string;
    role: ActorRole;
    note: string;
    newStage: Stage | null;
  }) {
    const backendStatus = stageToBackendStatus(newStage);

    if (backendStatus) {
      updateEnquiry.mutate({ status: backendStatus });
    }

    if (note.trim()) {
      createEvent.mutate({ message: note.trim() });
    }
  }

  return (
    <EnquiryDetailPage
      order={order}
      onSaveEstimation={handleSaveEstimation}
      onPostUpdate={handlePostUpdate}
      onCloseEnquiry={() => updateEnquiry.mutate({ status: "CLOSED" })}
      isSavingEstimation={
        createEstimation.isPending || updateEstimation.isPending
      }
      isPostingUpdate={createEvent.isPending || updateEnquiry.isPending}
      isClosingEnquiry={updateEnquiry.isPending}
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
