import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { RepairDetailPage } from "@/components/repairs/RepairDetailPage";

export default async function RepairPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireInternalAuth>
      <RepairDetailPage id={id} />
    </RequireInternalAuth>
  );
}
