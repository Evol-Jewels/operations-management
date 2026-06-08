"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ConvertOrderForm } from "@/components/orders/convert-order-form";
import { CreateOrderForm } from "@/components/orders/create-order-form";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";

function LoadingState() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Checking access...</p>
    </div>
  );
}

function UnauthorizedOrderState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-lg font-semibold text-foreground">
        Order creation access required
      </h1>
      <p className="text-sm text-muted-foreground">
        Only admin and operations users can create or convert orders.
      </p>
    </div>
  );
}

function RequireOrderCreateRole({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <LoadingState />;

  const role = session ? getSessionRole(session) : "";
  if (!["ADMIN", "OPERATIONS"].includes(role)) {
    return <UnauthorizedOrderState />;
  }

  return <>{children}</>;
}

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
        <RequireOrderCreateRole>
          <OrderFormWrapper />
        </RequireOrderCreateRole>
      </Suspense>
    </RequireInternalAuth>
  );
}
