"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { GoldRatesDialog } from "@/components/layout/GoldRatesDialog";
import { useGoldRate } from "@/hooks/useSystemConfigs";
import { getSessionRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils";

const actionClassName =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 text-xs font-semibold tabular-nums transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function MobileGoldRateAction() {
  const { data: session } = authClient.useSession();
  const role = session ? getSessionRole(session) : "";
  const canOpenSystemConfig = ["ADMIN", "OPERATIONS"].includes(role);
  const canOpenRates = role === "SALES";
  const goldRateQuery = useGoldRate(Boolean(session) && role !== "PHOTOGRAPHY");
  const goldRate = goldRateQuery.data?.goldRate24k;
  const value =
    typeof goldRate === "number" && Number.isFinite(goldRate)
      ? `${formatCurrency(goldRate)}/g`
      : goldRateQuery.isLoading
        ? "Loading"
        : "Unavailable";

  if (!canOpenRates && !canOpenSystemConfig) return null;

  const content = (
    <>
      <Coins className="size-4 text-amber-600 dark:text-amber-300" />
      <span>{value}</span>
    </>
  );

  if (canOpenRates) {
    return (
      <GoldRatesDialog
        trigger={
          <button
            type="button"
            className={actionClassName}
            aria-label={`Today's gold rates. 24K: ${value}`}
          >
            {content}
          </button>
        }
      />
    );
  }

  return (
    <Link
      href="/manage-products-and-price?tab=system#system-config"
      className={actionClassName}
      aria-label={`Open System Config. Current 24K gold rate: ${value}`}
    >
      {content}
    </Link>
  );
}
