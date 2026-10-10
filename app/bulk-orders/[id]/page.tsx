import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { BulkOrderDetailPage } from "@/components/bulk-orders/BulkOrderDetailPage";

export default async function BulkOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireInternalAuth>
      <BulkOrderDetailPage refCode={Number(id)} />
    </RequireInternalAuth>
  );
}
