import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EVOL Jewels — Operations",
  description: "Order tracking and operations dashboard for EVOL Jewels.",
};

function Loading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <TooltipProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Suspense fallback={<Loading>{children}</Loading>}>
              {children}
            </Suspense>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
