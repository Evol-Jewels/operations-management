import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ShopifyProductEditor } from "@/components/shopify-products/ShopifyProductEditor";

export default function NewShopifyProductPage() {
  return (
    <RequireInternalAuth roles={["ADMIN", "OPERATIONS"]}>
      <ShopifyProductEditor mode="create" />
    </RequireInternalAuth>
  );
}
