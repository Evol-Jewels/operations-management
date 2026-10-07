import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { CreateRepairForm } from "@/components/repairs/CreateRepairForm";

export default function NewRepairPage() {
  return (
    <RequireInternalAuth>
      <CreateRepairForm />
    </RequireInternalAuth>
  );
}
