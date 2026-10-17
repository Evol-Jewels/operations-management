"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";
import type { KanbanColumnConfig } from "./KanbanBoard";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumnHeader } from "./KanbanColumnHeader";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  orders: Order[];
  onCardClick: (order: Order) => void;
  emptyLabel?: string;
  cardActionLabel?: string;
}

export function KanbanColumn({
  column,
  orders,
  onCardClick,
  emptyLabel = "No records in this status",
  cardActionLabel,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-80 w-[264px] flex-shrink-0 flex-col snap-center rounded-xl border transition-all duration-200",
        isOver
          ? "border-foreground/40 bg-foreground/5 shadow-lg"
          : "border-border bg-card/50",
      )}
    >
      <KanbanColumnHeader
        status={column.id}
        label={column.shortLabel ?? column.label}
        count={orders.length}
      />

      {/* Cards container */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-2">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center">
              <Package className="mb-2 h-6 w-6 text-muted-foreground/30" />
              <p className="text-[11px] text-muted-foreground/60">
                {emptyLabel}
              </p>
              <p className="text-[10px] text-muted-foreground/40">
                {column.emptyDescription ?? "in this status"}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onClick={() => onCardClick(order)}
                actionLabel={cardActionLabel}
              />
            ))
          )}
        </SortableContext>
        {column.footer}
      </div>
    </div>
  );
}
