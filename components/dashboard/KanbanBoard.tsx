"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  TraversalOrder,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Order } from "@/types";
import { KanbanCardPreview } from "./KanbanCard";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanStageStrip, useStageScroller } from "./KanbanStageStrip";
import { MoveStageSheet } from "./MoveStageSheet";

export interface KanbanColumnConfig {
  id: string;
  label: string;
  shortLabel?: string;
  emptyDescription?: string;
  footer?: ReactNode;
}

interface KanbanBoardProps {
  orders: Order[];
  columns: KanbanColumnConfig[];
  getColumnId: (order: Order) => string;
  onOrderMove?: (order: Order, newColumnId: string) => void;
  onCardClick: (order: Order) => void;
  emptyLabel?: string;
  cardActionLabel?: string;
  canMoveCard?: (order: Order) => boolean;
  moveTargetIds?: readonly string[];
}

const stageCollisionDetection: CollisionDetection = (args) => {
  const columns = {
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => container.data.current?.type === "Column",
    ),
  };
  return args.pointerCoordinates
    ? pointerWithin(columns)
    : closestCorners(columns);
};

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
  cardActionLabel,
  canMoveCard,
  moveTargetIds,
}: KanbanBoardProps) {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [movingOrder, setMovingOrder] = useState<Order | null>(null);
  const { boardRef, activeId, scrollToStage } = useStageScroller(
    columns[0]?.id,
  );

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
      collisionDetection={stageCollisionDetection}
      autoScroll={{
        order: TraversalOrder.ReversedTreeOrder,
        acceleration: 8,
        interval: 16,
        threshold: { x: 0.12, y: 0.1 },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveOrder(null)}
    >
      <div className="relative flex h-full min-h-0 flex-col gap-2.5">
        <KanbanStageStrip
          label="Jump to stage"
          stages={columns.map((column) => ({
            id: column.id,
            label: column.shortLabel ?? column.label,
            count: groupedOrders[column.id]?.length ?? 0,
          }))}
          activeId={activeId}
          onSelect={scrollToStage}
          className="xl:hidden"
        />
        <div
          ref={boardRef}
          className={cn(
            "relative flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2 pt-1 scrollbar-thin lg:pb-4 scrollbar-thumb-border scrollbar-track-transparent",
            activeOrder
              ? "snap-none scroll-auto"
              : "snap-x snap-mandatory scroll-smooth",
          )}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              orders={groupedOrders[column.id] ?? []}
              onCardClick={onCardClick}
              emptyLabel={emptyLabel}
              cardActionLabel={cardActionLabel}
              onCardMove={canMoveCard ? setMovingOrder : undefined}
              canMoveCard={canMoveCard}
            />
          ))}
        </div>

        <MoveStageSheet
          open={Boolean(movingOrder)}
          onOpenChange={(open) => {
            if (!open) setMovingOrder(null);
          }}
          title="Move to stage"
          description={
            movingOrder
              ? `${movingOrder.customerName} · ${movingOrder.orderNumber ?? `#${movingOrder.refCode}`}`
              : undefined
          }
          stages={moveTargetIds ?? columns.map((column) => column.id)}
          currentStage={movingOrder ? getColumnId(movingOrder) : undefined}
          onSelect={(stage) => {
            if (movingOrder && onOrderMove) onOrderMove(movingOrder, stage);
          }}
        />

        {/* Drag overlay - shows what's being dragged */}
        <DragOverlay dropAnimation={null}>
          {activeOrder ? (
            <div className="pointer-events-none rotate-2 scale-105 cursor-grabbing">
              <KanbanCardPreview order={activeOrder} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
