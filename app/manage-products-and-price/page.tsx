import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ManageProductsAndPricePageClient } from "@/components/manage-products-and-price/ManageProductsAndPricePageClient";

export default function ManageProductsAndPricePage() {
  return (
    <RequireInternalAuth>
      <ManageProductsAndPricePageClient />
    </RequireInternalAuth>
  );
}
