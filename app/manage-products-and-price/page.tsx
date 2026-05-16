import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";

export default function ManageProductsAndPricePage() {
  return (
    <RequireInternalAuth>
      Manage Products, Stones, Slabs and Metal Prices
    </RequireInternalAuth>
  );
}
