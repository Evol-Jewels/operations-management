"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RefillRequestsList } from "@/components/refill-requests/RefillRequestsList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRefillRequests } from "@/hooks/useRefillRequests";
import { BulkOrdersWorkspace } from "./BulkOrdersWorkspace";

type BulkView = "orders" | "refills";

const TABS: Array<{ value: BulkView; label: string }> = [
  { value: "orders", label: "Bulk orders" },
  { value: "refills", label: "Refill requests" },
];

export function BulkOrdersTab({
  canManageRefills,
}: {
  canManageRefills: boolean;
}) {
  const searchParams = useSearchParams();
  const urlView: BulkView =
    searchParams.get("bulk") === "refills" ? "refills" : "orders";
  const [view, setView] = useState<BulkView>(urlView);
  const refillsQuery = useRefillRequests(canManageRefills);
  const pendingCount =
    refillsQuery.data?.filter((request) => request.status === "PENDING")
      .length ?? 0;

  useEffect(() => setView(urlView), [urlView]);

  if (!canManageRefills) return <BulkOrdersWorkspace />;

  const renderTabs = (count: number) => (
    <TabsList className="w-fit shrink-0" aria-label="Bulk orders">
      {TABS.map(({ value, label }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          {label}
          {view === value ? (
            <span className="rounded-sm bg-primary-foreground/10 px-1.5 text-xs tabular-nums">
              {count}
            </span>
          ) : value === "refills" && pendingCount > 0 ? (
            <span className="rounded-sm bg-amber-500/15 px-1.5 text-xs tabular-nums text-amber-700 dark:text-amber-400">
              {pendingCount} pending
            </span>
          ) : null}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        const next: BulkView = value === "refills" ? "refills" : "orders";
        setView(next);
        const url = new URL(window.location.href);
        if (next === "refills") url.searchParams.set("bulk", "refills");
        else url.searchParams.delete("bulk");
        window.history.replaceState(null, "", url);
      }}
      className="gap-4"
    >
      <TabsContent value="orders">
        <BulkOrdersWorkspace heading={renderTabs} />
      </TabsContent>
      <TabsContent value="refills">
        <RefillRequestsList heading={renderTabs} />
      </TabsContent>
    </Tabs>
  );
}
