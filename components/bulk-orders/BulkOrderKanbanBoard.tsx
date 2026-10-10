"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  TraversalOrder,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleCheck, Package } from "lucide-react";
import { useState } from "react";
import {
  BULK_ITEM_STAGES,
  type BulkItemStage,
  type BulkOrderItem,
  isBulkItemFilled,
  isFilledStage,
  isLockedBulkItemStage,
} from "@/lib/bulkOrders";
import { cn } from "@/lib/utils";
import { BulkOrderItemCard } from "./BulkOrderItemCard";

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

function DraggableItemCard({
  refCode,
  item,
}: {
  refCode: number;
  item: BulkOrderItem;
}) {
  const dragDisabled = isLockedBulkItemStage(item.stage);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.serialNumber,
    disabled: dragDisabled,
    data: { type: "Card" },
  });
  return (
    <BulkOrderItemCard
      refCode={refCode}
      item={item}
      ref={setNodeRef}
      {...(dragDisabled ? {} : attributes)}
      {...listeners}
      draggableCard={!dragDisabled}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "pointer-events-none opacity-30")}
    />
  );
}

function byTrackingPriority(a: BulkOrderItem, b: BulkOrderItem) {
  return (
    Number(isBulkItemFilled(a)) - Number(isBulkItemFilled(b)) ||
    a.estimatedDeliveryDate.localeCompare(b.estimatedDeliveryDate) ||
    a.serialNumber - b.serialNumber
  );
}

function StageColumn({
  refCode,
  stage,
  items,
}: {
  refCode: number;
  stage: BulkItemStage;
  items: BulkOrderItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: "Column" },
  });
  const pieces = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex max-h-[70vh] min-h-72 w-60 shrink-0 snap-start flex-col rounded-xl border transition-colors duration-200",
        isOver
          ? "border-foreground/40 bg-foreground/5 shadow-lg"
          : "border-border bg-card/50",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2.5",
          isLockedBulkItemStage(stage)
            ? "bg-muted/30 dark:bg-muted/20"
            : "bg-muted/40",
        )}
      >
        <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          <span className="truncate">{stage}</span>
          {isFilledStage(stage) && (
            <CircleCheck
              className="size-3.5 shrink-0 text-emerald-500"
              aria-label="Items here count as filled"
            >
              <title>Items here count as filled</title>
            </CircleCheck>
          )}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
          {pieces !== items.length && (
            <span className="tabular-nums">{pieces} pcs</span>
          )}
          <span
            className={cn(
              "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-medium",
              items.length
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {items.length}
          </span>
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext
          items={items.map((item) => item.serialNumber)}
          strategy={verticalListSortingStrategy}
        >
          {items.length ? (
            items.map((item) => (
              <DraggableItemCard
                key={item.serialNumber}
                refCode={refCode}
                item={item}
              />
            ))
          ) : (
            <div
              className={cn(
                "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center transition-colors",
                isOver ? "border-foreground/40" : "border-transparent",
              )}
            >
              <Package
                className="mb-2 size-6 text-muted-foreground/30"
                aria-hidden="true"
              />
              <p className="text-[11px] text-muted-foreground/60">No items</p>
              <p className="text-[10px] text-muted-foreground/40">
                Drop here to move
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </section>
  );
}

export function BulkOrderKanbanBoard({
  refCode,
  items,
  onMove,
}: {
  refCode: number;
  items: BulkOrderItem[];
  onMove: (item: BulkOrderItem, stage: BulkItemStage) => void;
}) {
  const [activeItem, setActiveItem] = useState<BulkOrderItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
      onDragStart={({ active }) =>
        setActiveItem(
          items.find((item) => item.serialNumber === active.id) ?? null,
        )
      }
      onDragCancel={() => setActiveItem(null)}
      onDragEnd={({ active, over }) => {
        setActiveItem(null);
        if (!over) return;
        const item = items.find((value) => value.serialNumber === active.id);
        const stage = BULK_ITEM_STAGES.find((value) => value === over.id);
        if (item && stage && stage !== item.stage) onMove(item, stage);
      }}
    >
      <div
        className={cn(
          "flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          activeItem
            ? "snap-none scroll-auto"
            : "snap-x snap-proximity scroll-smooth",
        )}
      >
        {BULK_ITEM_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            refCode={refCode}
            stage={stage}
            items={items
              .filter((item) => item.stage === stage)
              .sort(byTrackingPriority)}
          />
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground/50 sm:hidden">
        Swipe to see all stages →
      </p>
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div className="pointer-events-none rotate-2 scale-105 cursor-grabbing">
            <BulkOrderItemCard refCode={refCode} item={activeItem} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
