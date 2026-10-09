"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printOrderDetails } from "@/lib/printOrderDetails";

export function DownloadPDFButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={printOrderDetails}
      className="h-8 gap-1.5 text-xs print:hidden"
    >
      <Download className="h-3.5 w-3.5" />
      Download PDF
    </Button>
  );
}
