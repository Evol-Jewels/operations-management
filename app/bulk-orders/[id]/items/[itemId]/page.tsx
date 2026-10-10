import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { BulkOrderItemPage } from "@/components/bulk-orders/BulkOrderItemPage";

export default async function BulkOrderItemRoute({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  return (
    <RequireInternalAuth>
      <BulkOrderItemPage refCode={Number(id)} serialNumber={Number(itemId)} />
    </RequireInternalAuth>
  );
}
