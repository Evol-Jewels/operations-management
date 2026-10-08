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
import { useState } from "react";
import {
  isRepairTerminal,
  REPAIR_STAGES,
  type Repair,
  type RepairStage,
} from "@/lib/repairs";
import { cn } from "@/lib/utils";
import { RepairWorkspaceCard } from "./RepairWorkspaceCard";

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

function DraggableRepairCard({
  repair,
  disabled,
}: {
  repair: Repair;
  disabled: boolean;
}) {
  const dragDisabled = disabled || isRepairTerminal(repair.stage);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: repair.id,
    disabled: dragDisabled,
    data: { type: "Card" },
  });
  return (
    <RepairWorkspaceCard
      repair={repair}
      ref={setNodeRef}
      {...(dragDisabled ? {} : attributes)}
      {...listeners}
      draggableCard={!dragDisabled}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "pointer-events-none opacity-30")}
    />
  );
}

function RepairColumn({
  stage,
  repairs,
  disabled,
}: {
  stage: RepairStage;
  repairs: Repair[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: "Column" },
    disabled,
  });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-80 w-[240px] shrink-0 flex-col snap-center rounded-xl border transition-colors duration-200",
        isOver
          ? "border-foreground/40 bg-foreground/5 shadow-lg"
          : "border-border bg-card/50",
      )}
    >
      <div className="flex items-center justify-between rounded-t-xl border-b bg-muted/40 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {stage}
        </h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          {repairs.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        <SortableContext
          items={repairs.map((repair) => repair.id)}
          strategy={verticalListSortingStrategy}
        >
          {repairs.length ? (
            repairs.map((repair) => (
              <DraggableRepairCard
                key={repair.id}
                repair={repair}
                disabled={disabled}
              />
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No repairs
            </p>
          )}
        </SortableContext>
      </div>
    </section>
  );
}

export function RepairKanbanBoard({
  repairs,
  disabled,
  onMove,
}: {
  repairs: Repair[];
  disabled: boolean;
  onMove: (repair: Repair, stage: RepairStage) => void;
}) {
  const [activeRepair, setActiveRepair] = useState<Repair | null>(null);
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
        setActiveRepair(
          repairs.find((repair) => repair.id === active.id) ?? null,
        )
      }
      onDragCancel={() => setActiveRepair(null)}
      onDragEnd={({ active, over }) => {
        setActiveRepair(null);
        if (disabled || !over) return;
        const repair = repairs.find((record) => record.id === active.id);
        const stage = REPAIR_STAGES.find((value) => value === over.id);
        if (repair && stage && stage !== repair.stage) onMove(repair, stage);
      }}
    >
      <div
        className={cn(
          "flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
          activeRepair
            ? "snap-none scroll-auto"
            : "snap-x snap-mandatory scroll-smooth",
        )}
      >
        {REPAIR_STAGES.map((stage) => (
          <RepairColumn
            key={stage}
            stage={stage}
            repairs={repairs.filter((repair) => repair.stage === stage)}
            disabled={disabled}
          />
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground/50 sm:hidden">
        Swipe to see all stages →
      </p>
      <DragOverlay dropAnimation={null}>
        {activeRepair && (
          <div className="pointer-events-none cursor-grabbing">
            <RepairWorkspaceCard repair={activeRepair} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
