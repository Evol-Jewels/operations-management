import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ShopifyProductsPageClient } from "@/components/shopify-products/ShopifyProductsPageClient";

export default function ShopifyProductsPage() {
  return (
    <RequireInternalAuth roles={["ADMIN", "OPERATIONS"]}>
      <ShopifyProductsPageClient />
    </RequireInternalAuth>
  );
}
