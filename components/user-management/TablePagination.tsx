import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZE = 10;

export function TablePagination({
  page,
  total,
  label,
  onPageChange,
}: {
  page: number;
  total: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <output aria-live="polite">
        {start}–{Math.min(page * PAGE_SIZE, total)} of {total} {label}
      </output>
      {pages > 1 && (
        <nav
          aria-label={`${label} pagination`}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Previous ${label} page`}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={`Next ${label} page`}
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
