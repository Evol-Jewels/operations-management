"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockOrders } from "@/lib/mock-data";
import type {
  ActivityEntry,
  CloseReason,
  Order,
  ProductEstimation,
  Stage,
} from "@/types";

import type {
  ActivityEntry,
  CloseReason,
  Order,
  ProductEstimation,
  Stage,
} from "@/types";

interface OrdersStore {
  records: Order[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addEnquiry: (record: Order) => void;
  addOrder: (record: Order) => void;
  updateRecord: (recordId: string, updater: (record: Order) => Order) => void;
  moveRecordStage: (
    recordId: string,
    newStage: Stage,
    activity: ActivityEntry,
  ) => void;
  closeEnquiry: (recordId: string, reason: CloseReason, notes?: string) => void;
  addProductEstimation: (
    recordId: string,
    estimation: ProductEstimation,
  ) => void;
}

function cloneSeedRecords() {
  return JSON.parse(JSON.stringify(mockOrders)) as Order[];
}

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set) => ({
      records: cloneSeedRecords(),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      addEnquiry: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),
      addOrder: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),
      updateRecord: (recordId, updater) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId ? updater(record) : record,
          ),
        })),
      moveRecordStage: (recordId, newStage, activity) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  currentStage: newStage,
                  lastUpdatedAt: activity.timestamp,
                  activityFeed: [...record.activityFeed, activity],
                }
              : record,
          ),
        })),
      closeEnquiry: (recordId, reason, notes) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  status: "closed" as const,
                  closedAt: new Date().toISOString(),
                  closeReason: reason,
                  closeNotes: notes || undefined,
                  lastUpdatedAt: new Date().toISOString(),
                  activityFeed: [
                    ...record.activityFeed,
                    {
                      id: `act-${Date.now()}-close`,
                      orderId: record.id,
                      postedBy: "System",
                      timestamp: new Date().toISOString(),
                      type: "enquiry_closed",
                      note: `Enquiry closed. Reason: ${reason}${notes ? ` - ${notes}` : ""}`,
                    } as ActivityEntry,
                  ],
                }
              : record,
          ),
        })),
      addProductEstimation: (recordId, estimation) =>
        set((state) => ({
          records: state.records.map((record) =>
            record.id === recordId
              ? {
                  ...record,
                  estimations: [
                    ...(record.estimations || []).filter(
                      (e) => e.productId !== estimation.productId,
                    ),
                    estimation,
                  ],
                  lastUpdatedAt: new Date().toISOString(),
                  activityFeed: [
                    ...record.activityFeed,
                    {
                      id: `act-${Date.now()}-estimation`,
                      orderId: record.id,
                      postedBy: "System",
                      timestamp: new Date().toISOString(),
                      type: "estimation_added",
                      note: `Estimation added for product ${estimation.productId}`,
                    } as ActivityEntry,
                  ],
                }
              : record,
          ),
        })),
    }),
    {
      name: "evol-orders-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ records: state.records }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
