"use client";

import { create } from "zustand";
import type { BulkItemStage, BulkOrder, BulkOrderItem } from "@/lib/bulkOrders";
import { BULK_ORDERS } from "@/lib/bulkOrdersMockData";
import type { ActivityEntry, PersonSummary } from "@/types";

interface BulkOrdersStore {
  orders: BulkOrder[];
  moveItem: (input: {
    refCode: number;
    serialNumber: number;
    stage: BulkItemStage;
    actor: PersonSummary;
    remark?: string;
  }) => void;
  addComment: (input: {
    refCode: number;
    serialNumber: number;
    actor: PersonSummary;
    note: string;
    media: ActivityEntry["media"];
  }) => void;
}

function updateItem(
  orders: BulkOrder[],
  refCode: number,
  serialNumber: number,
  update: (item: BulkOrderItem) => BulkOrderItem,
) {
  return orders.map((order) =>
    order.refCode !== refCode
      ? order
      : {
          ...order,
          items: order.items.map((item) =>
            item.serialNumber === serialNumber ? update(item) : item,
          ),
        },
  );
}

// Mock-backed until the bulk order API exists; changes reset on reload.
export const useBulkOrdersStore = create<BulkOrdersStore>((set) => ({
  orders: BULK_ORDERS,
  moveItem: ({ refCode, serialNumber, stage, actor, remark }) =>
    set((state) => ({
      orders: updateItem(state.orders, refCode, serialNumber, (item) => {
        const timestamp = new Date().toISOString();
        const orderId = `${refCode}-${serialNumber}`;
        const entries: ActivityEntry[] = [
          {
            id: crypto.randomUUID(),
            orderId,
            postedBy: actor,
            timestamp,
            type: "stage_change",
            previousStage: item.stage,
            newStage: stage,
            note: `${actor.name} moved this from ${item.stage} to ${stage}`,
          },
        ];
        if (remark) {
          entries.push({
            id: crypto.randomUUID(),
            orderId,
            postedBy: actor,
            timestamp,
            type: "comment",
            note: remark,
          });
        }
        return {
          ...item,
          stage,
          stageRemark: remark,
          activity: [...item.activity, ...entries],
        };
      }),
    })),
  addComment: ({ refCode, serialNumber, actor, note, media }) =>
    set((state) => ({
      orders: updateItem(state.orders, refCode, serialNumber, (item) => ({
        ...item,
        activity: [
          ...item.activity,
          {
            id: crypto.randomUUID(),
            orderId: `${refCode}-${serialNumber}`,
            postedBy: actor,
            timestamp: new Date().toISOString(),
            type: "comment",
            note,
            media,
          },
        ],
      })),
    })),
}));

export function useBulkOrder(refCode: number) {
  return useBulkOrdersStore((state) =>
    state.orders.find((order) => order.refCode === refCode),
  );
}
