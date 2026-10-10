"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  type BulkItemStage,
  type BulkOrderItem,
  FILLED_FROM_STAGE,
  isFilledStage,
  isLockedBulkItemStage,
} from "@/lib/bulkOrders";
import { useBulkOrdersStore } from "@/lib/stores/bulk-orders-store";
import type { PersonSummary } from "@/types";
import {
  BulkItemCloseDialog,
  type BulkItemTerminalStage,
} from "./BulkItemCloseDialog";

export function useCurrentPerson(): PersonSummary {
  const { data: session } = authClient.useSession();
  return {
    id: session?.user.id ?? "current-user",
    name: session?.user.name || "You",
    image: session?.user.image ?? null,
  };
}

function getMoveDescription(item: BulkOrderItem, stage: BulkItemStage) {
  const wasFilled = isFilledStage(item.stage);
  const isFilled = isFilledStage(stage);
  if (!wasFilled && isFilled) {
    return `Marked as filled · ${item.quantity} pcs received at store`;
  }
  if (wasFilled && !isFilled) {
    return `Back to pending until it reaches ${FILLED_FROM_STAGE}`;
  }
  return undefined;
}

export function useBulkItemMove(refCode: number) {
  const moveItem = useBulkOrdersStore((state) => state.moveItem);
  const actor = useCurrentPerson();
  const [pending, setPending] = useState<{
    item: BulkOrderItem;
    stage: BulkItemTerminalStage;
  } | null>(null);

  const commit = (item: BulkOrderItem, stage: BulkItemStage, remark = "") => {
    moveItem({
      refCode,
      serialNumber: item.serialNumber,
      stage,
      actor,
      remark: remark || undefined,
    });
    toast.success(
      stage === "Cancelled"
        ? `${item.vendorDesignNumber} cancelled`
        : stage === "Closed"
          ? `${item.vendorDesignNumber} closed`
          : `${item.vendorDesignNumber} moved to ${stage}`,
      {
        description:
          stage === "Cancelled"
            ? "Removed from the bulk order's pieces and totals"
            : getMoveDescription(item, stage),
      },
    );
  };

  const requestMove = (item: BulkOrderItem, stage: BulkItemStage) => {
    if (stage === item.stage) return;
    if (isLockedBulkItemStage(item.stage)) {
      toast.error(
        `${item.vendorDesignNumber} is ${item.stage.toLowerCase()} and locked`,
      );
      return;
    }
    if (stage === "Closed" && !isFilledStage(item.stage)) {
      toast.error(
        `Move ${item.vendorDesignNumber} to ${FILLED_FROM_STAGE} before closing`,
        {
          description:
            "Items count as filled only once they reach the store. Cancel it instead if it won't arrive.",
        },
      );
      return;
    }
    if (stage === "Closed" || stage === "Cancelled") {
      setPending({ item, stage });
      return;
    }
    commit(item, stage);
  };

  const dialog = pending ? (
    <BulkItemCloseDialog
      key={`${pending.item.serialNumber}-${pending.stage}`}
      item={pending.item}
      stage={pending.stage}
      onCancel={() => setPending(null)}
      onConfirm={(remark) => {
        commit(pending.item, pending.stage, remark);
        setPending(null);
      }}
    />
  ) : null;

  return { requestMove, dialog };
}
