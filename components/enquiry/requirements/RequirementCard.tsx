import type { ReactNode } from "react";

export function RequirementCard({ children }: { children: ReactNode }) {
  return (
    <article className="@container/requirement min-w-0 overflow-hidden rounded-lg border border-border">
      {children}
    </article>
  );
}

export function RequirementCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-4 p-3 @[40rem]/requirement:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)] @[40rem]/requirement:p-4 [&>*]:min-w-0">
      {children}
    </div>
  );
}
