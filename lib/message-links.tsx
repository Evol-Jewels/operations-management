import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TOKEN_PATTERN = /@([A-Za-z0-9_-]+)|(order|enquiry)\s*#(\d+)/gi;

export function renderMessageWithLinks(
  text: string,
  className?: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const full = match[0];
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, start)}</Fragment>,
      );
    }

    if (match[1] !== undefined) {
      const code = match[1];
      nodes.push(
        <Link
          key={key++}
          href={`/inventory?productCode=${encodeURIComponent(code)}`}
          className={cn(
            "font-semibold underline underline-offset-2 hover:text-primary",
            className,
          )}
        >
          {full}
        </Link>,
      );
    } else {
      const kind = match[2].toLowerCase();
      const ref = match[3];
      const path = kind === "order" ? "orders" : "enquiries";
      nodes.push(
        <Link
          key={key++}
          href={`/${path}/${ref}`}
          className={cn(
            "font-semibold underline underline-offset-2 hover:text-primary",
            className,
          )}
        >
          {full}
        </Link>,
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}
