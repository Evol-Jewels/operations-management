"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DownloadPDFButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className="h-8 gap-1.5 text-xs print:hidden"
    >
      <Download className="h-3.5 w-3.5" />
      Download PDF
    </Button>
  );
}
