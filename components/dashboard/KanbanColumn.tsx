"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order, Stage } from "@/types";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
  stage: Stage;
  orders: Order[];
  onCardClick: (order: Order) => void;
}

const STAGE_COLORS: Record<Stage, string> = {
  Enquiry: "bg-zinc-50 dark:bg-zinc-950/30",
  Estimation: "bg-sky-50/50 dark:bg-sky-950/20",
  "CAD Design": "bg-violet-50/50 dark:bg-violet-950/20",
  "Order Confirmed": "bg-blue-50/50 dark:bg-blue-950/20",
  Building: "bg-amber-50/50 dark:bg-amber-950/20",
  Certification: "bg-orange-50/50 dark:bg-orange-950/20",
  "Shipped to Store": "bg-teal-50/50 dark:bg-teal-950/20",
  "Customer Pickup": "bg-emerald-50/50 dark:bg-emerald-950/20",
};

const STAGE_SHORT: Record<Stage, string> = {
  Enquiry: "Enquiry",
  Estimation: "Estimation",
  "CAD Design": "CAD",
  "Order Confirmed": "Confirmed",
  Building: "Building",
  Certification: "Certify",
  "Shipped to Store": "Shipped",
  "Customer Pickup": "Pickup",
};

export function KanbanColumn({
  stage,
  orders,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: {
      type: "Column",
      stage,
    },
  });

  const colorClass = STAGE_COLORS[stage];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[240px] flex-shrink-0 flex-col snap-center rounded-xl border transition-all duration-200",
        isOver
          ? "border-foreground/40 bg-foreground/5 shadow-lg"
          : "border-border bg-card/50",
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "sticky top-0 z-10 rounded-t-xl border-b px-3 py-2.5",
          colorClass,
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {STAGE_SHORT[stage]}
          </h3>
          <span
            className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium",
              orders.length > 0
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {orders.length}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="mb-2 h-6 w-6 text-muted-foreground/30" />
              <p className="text-[11px] text-muted-foreground/60">No orders</p>
              <p className="text-[10px] text-muted-foreground/40">
                in this stage
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onClick={() => onCardClick(order)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
