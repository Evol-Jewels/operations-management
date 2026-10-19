"use client";

import { Maximize2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { getSessionRole, getUserRole } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import type { AssistantPageContext } from "@/types/assistant";
import { AssistantHeader } from "./AssistantHeader";
import { AssistantPanel } from "./AssistantPanel";
import { EvolE } from "./EvolE";
import { useAssistantChat } from "./useAssistantChat";

const ROLES = new Set(["ADMIN", "OPERATIONS", "SALES"]);

/** Names the record on screen so "this order" works in the chat. */
export function describePage(
  pathname: string,
  search: URLSearchParams,
): { context: AssistantPageContext; label: string | null } {
  const segments = pathname.split("/").filter(Boolean);
  const [section, id, child, childId] = segments;
  let label: string | null = null;
  if (section === "orders" && id && id !== "new") label = `Order #${id}`;
  else if (section === "enquiries" && id && id !== "new")
    label = `Enquiry #${id}`;
  else if (section === "repairs" && id && id !== "new") label = "This repair";
  else if (section === "bulk-orders" && id)
    label =
      child === "items" && childId
        ? `Bulk order BO-${id.padStart(3, "0")} · line ${childId}`
        : `Bulk order BO-${id.padStart(3, "0")}`;
  else if (section === "inventory" && search.get("productCode"))
    label = `Product ${search.get("productCode")}`;
  const query = search.toString();
  return {
    context: {
      path: `${pathname}${query ? `?${query}` : ""}`,
      title: label ?? undefined,
    },
    label,
  };
}

export function AssistantLauncher() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  // The session is only known on the client; render after mount to keep hydration stable.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const chat = useAssistantChat({});
  const allowed =
    Boolean(session) &&
    getUserRole(session) === "internal" &&
    ROLES.has(getSessionRole(session));

  useEffect(() => {
    if (!allowed) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allowed]);

  if (!mounted || !allowed) return null;
  const { context, label } = describePage(pathname, searchParams);
  const title = chat.threadId ? chat.thread.data?.title : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Evol-E"
        title="Ask Evol-E (Ctrl/⌘ + J)"
        className="print-hide fixed right-4 bottom-4 z-40 flex h-12 items-center gap-1.5 rounded-full bg-foreground px-[5px] text-sm font-medium text-background shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:right-6 sm:bottom-6 sm:pr-4"
      >
        <EvolE size={38} className="text-background" />
        <span className="hidden sm:inline">Ask Evol-E</span>
      </button>
      {/* Non-modal so the page stays usable while chatting. */}
      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 shadow-2xl sm:max-w-md md:max-w-lg"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <AssistantHeader
            chat={chat}
            title={
              <>
                <SheetTitle className="truncate text-[15px] font-semibold tracking-tight">
                  {title ?? "Evol-E"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Ask questions or get work done with Evol-E.
                </SheetDescription>
              </>
            }
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open full view"
              title="Open full view"
              asChild
            >
              <Link
                href={
                  chat.threadId
                    ? `/assistant?thread=${chat.threadId}`
                    : "/assistant"
                }
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="size-4" />
              </Link>
            </Button>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close">
                <X className="size-4" />
              </Button>
            </SheetClose>
          </AssistantHeader>
          <AssistantPanel
            chat={chat}
            compact
            context={context}
            contextLabel={label}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
