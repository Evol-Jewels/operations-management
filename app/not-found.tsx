"use client";

import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-3xl items-center justify-center">
      <div className="w-full rounded-xl border border-border/70 bg-card/95 p-8 text-center shadow-xl sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          404 Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          The route you requested does not exist or may have been moved. Use one
          of the actions below to get back into the app.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button asChild className="gap-2">
            <Link href="/orders-and-enquiries">
              <Home className="h-4 w-4" />
              Go to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
