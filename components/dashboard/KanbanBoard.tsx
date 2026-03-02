"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";
import { type Order, STAGES, type Stage } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  orders: Order[];
  onOrderMove: (orderId: string, newStage: Stage) => void;
  onCardClick: (order: Order) => void;
}

// Group orders by stage
function groupOrdersByStage(orders: Order[]): Record<Stage, Order[]> {
  return STAGES.reduce(
    (acc, stage) => {
      acc[stage] = orders.filter((o) => o.currentStage === stage);
      return acc;
    },
    {} as Record<Stage, Order[]>,
  );
}

export function KanbanBoard({
  orders,
  onOrderMove,
  onCardClick,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Group orders by stage
  const groupedOrders = useMemo(() => groupOrdersByStage(orders), [orders]);

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
      setActiveId(active.id as string);

      // Find the order being dragged
      const order = orders.find((o) => o.id === active.id);
      if (order) {
        setActiveOrder(order);
      }
    },
    [orders],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      // Find the containers
      const activeOrder = orders.find((o) => o.id === activeId);
      if (!activeOrder) return;

      const overData = over.data.current;

      // If dragging over a column (stage)
      if (overData?.type === "Column") {
        const newStage = overId as Stage;

        // Only update if stage actually changed
        if (activeOrder.currentStage !== newStage) {
          onOrderMove(activeOrder.id, newStage);
        }
      }
    },
    [orders, onOrderMove],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveOrder(null);

      if (!over) return;

      const activeId = active.id;
      const overId = over.id;

      // If dropped over a column
      if (over.data.current?.type === "Column") {
        const order = orders.find((o) => o.id === activeId);
        if (order && order.currentStage !== overId) {
          onOrderMove(order.id, overId as Stage);
        }
      }
    },
    [orders, onOrderMove],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* Kanban board container */}
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              orders={groupedOrders[stage]}
              onCardClick={onCardClick}
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
