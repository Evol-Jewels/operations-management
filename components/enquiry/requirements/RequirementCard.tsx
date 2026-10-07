import type { ReactNode } from "react";

export function RequirementCard({ children }: { children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-lg border border-border">
      {children}
    </article>
  );
}

export function RequirementCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 p-3 xl:grid-cols-[minmax(15rem,1fr)_minmax(0,2fr)] xl:p-4">
      {children}
    </div>
  );
}
