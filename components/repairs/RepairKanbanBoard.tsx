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
import { ArrowRightLeft, Package } from "lucide-react";
import { useState } from "react";
import {
  KanbanStageStrip,
  useStageScroller,
} from "@/components/dashboard/KanbanStageStrip";
import { MoveStageSheet } from "@/components/dashboard/MoveStageSheet";
import {
  formatRepairRefCode,
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
  onMoveRequest,
}: {
  repair: Repair;
  disabled: boolean;
  onMoveRequest: (repair: Repair) => void;
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
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "pointer-events-none opacity-30")}
    >
      <RepairWorkspaceCard
        repair={repair}
        {...(dragDisabled ? {} : attributes)}
        {...listeners}
        draggableCard={!dragDisabled}
        className={cn(!dragDisabled && "max-xl:pr-12")}
      />
      {!dragDisabled && (
        <button
          type="button"
          onClick={() => onMoveRequest(repair)}
          aria-label={`Move ${repair.customerName || "stock repair"} to another stage`}
          className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden xl:pointer-coarse:flex"
        >
          <ArrowRightLeft className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function RepairColumn({
  stage,
  repairs,
  disabled,
  onMoveRequest,
}: {
  stage: RepairStage;
  repairs: Repair[];
  disabled: boolean;
  onMoveRequest: (repair: Repair) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
    data: { type: "Column" },
    disabled,
  });
  return (
    <section
      ref={setNodeRef}
      data-stage={stage}
      className={cn(
        "flex min-h-80 w-[calc(100vw-4rem)] max-w-80 shrink-0 snap-start flex-col rounded-xl border transition-colors duration-200 md:w-[280px] xl:w-[240px]",
        isOver
          ? "border-foreground/40 bg-foreground/5 shadow-lg"
          : "border-border bg-card/50",
      )}
    >
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b px-3 py-2.5",
          isRepairTerminal(stage)
            ? "bg-muted/30 dark:bg-muted/20"
            : "bg-muted/40",
        )}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          {stage}
        </h3>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium",
            repairs.length > 0
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground",
          )}
        >
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
                onMoveRequest={onMoveRequest}
              />
            ))
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center">
              <Package
                className="mb-2 size-6 text-muted-foreground/30"
                aria-hidden="true"
              />
              <p className="text-[11px] text-muted-foreground/60">No repairs</p>
              <p className="text-[10px] text-muted-foreground/40">
                in this status
              </p>
            </div>
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
  const [movingRepair, setMovingRepair] = useState<Repair | null>(null);
  const { boardRef, activeId, scrollToStage } = useStageScroller(
    REPAIR_STAGES[0],
  );
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
      <KanbanStageStrip
        label="Jump to stage"
        className="mb-2.5 xl:hidden"
        stages={REPAIR_STAGES.map((stage) => ({
          id: stage,
          label: stage,
          count: repairs.filter((repair) => repair.stage === stage).length,
        }))}
        activeId={activeId}
        onSelect={scrollToStage}
      />
      <div
        ref={boardRef}
        className={cn(
          "relative flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
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
            onMoveRequest={setMovingRepair}
          />
        ))}
      </div>
      <MoveStageSheet
        open={Boolean(movingRepair)}
        onOpenChange={(open) => {
          if (!open) setMovingRepair(null);
        }}
        title="Move to stage"
        description={
          movingRepair
            ? `${movingRepair.customerName || "Stock repair"} · ${formatRepairRefCode(movingRepair.refCode)}`
            : undefined
        }
        stages={REPAIR_STAGES}
        currentStage={movingRepair?.stage}
        onSelect={(stage) => {
          const target = REPAIR_STAGES.find((value) => value === stage);
          if (movingRepair && target) onMove(movingRepair, target);
        }}
      />
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
