"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  const skeletonRows = Array.from(
    { length: rows },
    (_, index) => `row-${index}`,
  );
  const skeletonColumns = Array.from(
    { length: columns },
    (_, index) => `column-${index}`,
  );

  return (
    <div className="min-h-0 h-[30vh] overflow-y-auto rounded-md border border-border/70">
      <Table>
        <TableBody>
          {skeletonRows.map((rowKey) => (
            <TableRow key={rowKey}>
              {skeletonColumns.map((columnKey, columnIndex) => (
                <TableCell key={columnKey} className="py-3">
                  <Skeleton
                    className={
                      columnIndex === 0
                        ? "h-4 w-40"
                        : columnIndex === columns - 1
                          ? "h-8 w-8 rounded-md"
                          : "h-4 w-24"
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
