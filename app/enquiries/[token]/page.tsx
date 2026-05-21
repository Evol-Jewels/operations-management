"use client";

import { notFound, useParams } from "next/navigation";
import { EnquiryDetailPage } from "@/components/enquiry/EnquiryDetailPage";
import { useOrdersStore } from "@/lib/stores/orders-store";

export default function EnquiryPage() {
  const params = useParams();
  const token = params.token as string;
  const hasHydrated = useOrdersStore((state) => state.hasHydrated);
  const enquiry = useOrdersStore((state) =>
    state.records.find(
      (record) => record.shareableToken === token && record.type === "enquiry",
    ),
  );
  const updateRecord = useOrdersStore((state) => state.updateRecord);

  if (!enquiry && hasHydrated) notFound();

  if (!enquiry) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center text-sm text-muted-foreground">
        Loading enquiry...
      </div>
    );
  }

  return (
    <EnquiryDetailPage
      order={enquiry}
      onUpdateRecord={(updater) => updateRecord(enquiry.id, updater)}
    />
  );
}
