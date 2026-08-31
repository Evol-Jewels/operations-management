import { RequireInternalAuth } from "@/components/auth/RequireInternalAuth";
import { ShopifyProductEditor } from "@/components/shopify-products/ShopifyProductEditor";

export default async function EditShopifyProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return (
    <RequireInternalAuth roles={["ADMIN", "OPERATIONS"]}>
      <ShopifyProductEditor mode="edit" productId={productId} />
    </RequireInternalAuth>
  );
}
