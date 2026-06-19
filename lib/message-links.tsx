import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const CODE_PATTERN = /@([A-Za-z0-9_-]+)/g;
const REF_PATTERN = /#(\d+)/g;
const KIND_TRIGGER = /\b(orders?|enquir(?:y|ies))\b(?![^\s,])/gi;

type Match =
  | { kind: "code"; index: number; length: number; code: string }
  | {
      kind: "ref";
      index: number;
      length: number;
      ref: string;
      path: "orders" | "enquiries" | null;
    };

export function renderMessageWithLinks(
  text: string,
  className?: string,
): ReactNode[] {
  const matches: Match[] = [];

  for (const m of text.matchAll(CODE_PATTERN)) {
    matches.push({
      kind: "code",
      index: m.index,
      length: m[0].length,
      code: m[1],
    });
  }

  for (const m of text.matchAll(REF_PATTERN)) {
    matches.push({
      kind: "ref",
      index: m.index,
      length: m[0].length,
      ref: m[1],
      path: resolveRefPath(text, m.index),
    });
  }

  matches.sort((a, b) => a.index - b.index);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  const linkClass = cn(
    "font-semibold underline underline-offset-2 hover:text-primary",
    className,
  );

  for (const m of matches) {
    if (m.index > cursor) {
      nodes.push(
        <Fragment key={key++}>{text.slice(cursor, m.index)}</Fragment>,
      );
    }

    if (m.kind === "code") {
      nodes.push(
        <Link
          key={key++}
          href={`/inventory?productCode=${encodeURIComponent(m.code)}`}
          className={linkClass}
        >
          {text.slice(m.index, m.index + m.length)}
        </Link>,
      );
    } else if (m.path) {
      nodes.push(
        <Link key={key++} href={`/${m.path}/${m.ref}`} className={linkClass}>
          {text.slice(m.index, m.index + m.length)}
        </Link>,
      );
    } else {
      nodes.push(
        <Fragment key={key++}>
          {text.slice(m.index, m.index + m.length)}
        </Fragment>,
      );
    }

    cursor = m.index + m.length;
  }

  if (cursor < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(cursor)}</Fragment>);
  }

  return nodes;
}

function resolveRefPath(
  text: string,
  refIndex: number,
): "orders" | "enquiries" | null {
  KIND_TRIGGER.lastIndex = 0;
  const before = text.slice(0, refIndex);
  const triggers = [...before.matchAll(KIND_TRIGGER)];
  const last = triggers[triggers.length - 1];
  if (!last) return null;
  if (last.index + last[0].length > refIndex) return null;
  const word = last[1].toLowerCase();
  if (word === "order" || word === "orders") return "orders";
  return "enquiries";
}
