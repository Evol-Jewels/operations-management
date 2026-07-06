"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";
import type { Order } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";

export interface KanbanColumnConfig {
  id: string;
  label: string;
  shortLabel?: string;
}

interface KanbanBoardProps {
  orders: Order[];
  columns: KanbanColumnConfig[];
  getColumnId: (order: Order) => string;
  onOrderMove?: (order: Order, newColumnId: string) => void;
  onCardClick: (order: Order) => void;
  emptyLabel?: string;
}

function groupOrdersByColumn(
  orders: Order[],
  columns: KanbanColumnConfig[],
  getColumnId: (order: Order) => string,
): Record<string, Order[]> {
  return columns.reduce(
    (acc, stage) => {
      acc[stage.id] = orders.filter((order) => getColumnId(order) === stage.id);
      return acc;
    },
    {} as Record<string, Order[]>,
  );
}

export function KanbanBoard({
  orders,
  columns,
  getColumnId,
  onOrderMove,
  onCardClick,
  emptyLabel,
}: KanbanBoardProps) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const groupedOrders = useMemo(
    () => groupOrdersByColumn(orders, columns, getColumnId),
    [columns, getColumnId, orders],
  );

  // Sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;

      // Find the order being dragged
      const order = orders.find((o) => o.id === active.id);
      if (order) {
        setActiveOrder(order);
      }
    },
    [orders],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveOrder(null);

      if (!over) return;

      const activeId = active.id;
      const order = orders.find((o) => o.id === activeId);
      if (!order || !onOrderMove) return;

      const overData = over.data.current;
      const overOrder =
        overData?.type === "Card"
          ? orders.find((candidate) => candidate.id === over.id)
          : null;
      const newColumnId =
        overData?.type === "Column"
          ? String(over.id)
          : overOrder
            ? getColumnId(overOrder)
            : null;

      if (newColumnId && getColumnId(order) !== newColumnId) {
        onOrderMove(order, newColumnId);
      }
    },
    [getColumnId, orders, onOrderMove],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Kanban board container */}
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              orders={groupedOrders[column.id] ?? []}
              onCardClick={onCardClick}
              emptyLabel={emptyLabel}
            />
          ))}
        </div>

        {/* Mobile scroll hint */}
        <p className="mt-1 text-center text-[11px] text-muted-foreground/50 sm:hidden">
          Swipe to see all stages →
        </p>

        {/* Drag overlay - shows what's being dragged */}
        <DragOverlay dropAnimation={null}>
          {activeOrder ? (
            <div className="rotate-2 scale-105 cursor-grabbing">
              <KanbanCard order={activeOrder} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
