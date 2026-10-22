"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ConfigOverview,
  ConfigSectionNav,
  type ConfigTab,
} from "@/components/manage-products-and-price/ConfigNavigation";
import { LocationsEditor } from "@/components/manage-products-and-price/LocationsEditor";
import { StonesAndSlabsEditor } from "@/components/manage-products-and-price/StonesAndSlabsEditor";
import { SystemConfigEditor } from "@/components/manage-products-and-price/SystemConfigEditor";
import { VendorsPanel } from "@/components/vendors/VendorsPanel";
import { useVendorAccess } from "@/hooks/useVendors";

function resolveTab(
  tab: string | null,
  hash: string,
  canManageVendors: boolean,
): ConfigTab | null {
  if (tab === "stores" || tab === "stones") return tab;
  if (tab === "system" || hash === "system-config") return "system";
  if (tab === "vendors" && canManageVendors) return "vendors";
  return null;
}

export function ManageProductsAndPricePageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canManageVendors = useVendorAccess();
  const hashSection =
    typeof window === "undefined" ? "" : window.location.hash.slice(1);
  const activeTab = resolveTab(
    searchParams.get("tab"),
    hashSection,
    canManageVendors,
  );

  function openTab(tab: ConfigTab | null) {
    router.push(tab ? `${pathname}?tab=${tab}` : pathname);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col lg:h-[calc(100svh-3rem)] lg:overflow-hidden">
      {activeTab ? (
        <ConfigSectionNav
          active={activeTab}
          canManageVendors={canManageVendors}
          onOverview={() => openTab(null)}
          onSelect={openTab}
        />
      ) : (
        <ConfigOverview canManageVendors={canManageVendors} onOpen={openTab} />
      )}
      {activeTab === "stores" ? <LocationsEditor /> : null}
      {activeTab === "stones" ? <StonesAndSlabsEditor /> : null}
      {activeTab === "system" ? <SystemConfigEditor /> : null}
      {activeTab === "vendors" ? <VendorsPanel /> : null}
    </div>
  );
}
