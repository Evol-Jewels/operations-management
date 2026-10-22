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
  onCardMove?: (order: Order) => void;
  canMoveCard?: (order: Order) => boolean;
  emptyLabel?: string;
  cardActionLabel?: string;
}

export function KanbanColumn({
  column,
  orders,
  onCardClick,
  onCardMove,
  canMoveCard,
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
      data-stage={column.id}
      className={cn(
        "flex min-h-0 w-[calc(100vw-4rem)] max-w-80 flex-shrink-0 snap-start flex-col rounded-xl border transition-all duration-200 md:w-[300px] lg:w-[272px] xl:w-[264px]",
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

      <section
        aria-label={`${column.label} records`}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable stage lists need keyboard access.
        tabIndex={0}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-y-contain p-2 scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.length === 0 ? (
            <div className="flex min-h-40 flex-col xl:min-h-56 items-center justify-center py-8 text-center">
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
                onMove={
                  onCardMove && (canMoveCard?.(order) ?? true)
                    ? () => onCardMove(order)
                    : undefined
                }
                actionLabel={cardActionLabel}
              />
            ))
          )}
        </SortableContext>
        {column.footer}
      </section>
    </div>
  );
}
