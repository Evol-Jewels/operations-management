import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PostHogAnalytics } from "@/components/providers/PostHogAnalytics";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"),
  title: "EVOL Jewels - Operations",
  description: "Order tracking and operations dashboard for EVOL Jewels.",
  openGraph: {
    title: "EVOL Jewels - Operations",
    description: "Order tracking and operations dashboard for EVOL Jewels.",
    images: [
      {
        url: "/evol-jewels-logo.png",
        alt: "EVOL Jewels logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVOL Jewels - Operations",
    description: "Order tracking and operations dashboard for EVOL Jewels.",
    images: ["/evol-jewels-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeBootstrapScript = `
    (function() {
      try {
        var theme = window.localStorage.getItem("theme");
        if (theme !== "dark" && theme !== "light") theme = "light";
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      } catch (error) {}
    })();
  `;

  return (
    <html lang="en">
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            <ReactQueryProvider>
              <Suspense fallback={null}>
                <PostHogAnalytics />
              </Suspense>
              <AppShell>{children}</AppShell>
            </ReactQueryProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
