"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ConvertOrderForm } from "@/components/orders/convert-order-form";
import { CreateOrderForm } from "@/components/orders/create-order-form";

function OrderFormWrapper() {
  const searchParams = useSearchParams();
  const enquiryId = searchParams.get("from");

  if (!enquiryId) return <CreateOrderForm />;

  return <ConvertOrderForm enquiryId={enquiryId} />;
}

export default function NewOrderPage() {
  return (
    <RequireInternalAuth>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      >
        <OrderFormWrapper />
      </Suspense>
    </RequireInternalAuth>
  );
}
