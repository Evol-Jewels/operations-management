import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-center px-4 sm:px-6">
          <Image
            src="/evol-logo.webp"
            alt="EVOL Jewels"
            width={160}
            height={48}
            priority
            className="h-9 w-auto object-contain dark:invert"
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-6">
        {children}
      </div>
    </main>
  );
}

export function CustomerPageLoading() {
  return (
    <CustomerPageFrame>
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg items-center py-8">
        <Card className="w-full">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
      <span className="sr-only">
        <Loader2 className="animate-spin" /> Loading order
      </span>
    </CustomerPageFrame>
  );
}
