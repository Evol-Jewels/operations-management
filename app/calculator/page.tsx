import { cookies } from "next/headers";
import { CalculatorPageClient } from "@/components/calculator/CalculatorPageClient";
import { CALCULATOR_TAB_COOKIE, isCalculatorTab } from "@/lib/calculatorTab";

export default async function CalculatorPage() {
  const store = await cookies();
  const cookieTab = store.get(CALCULATOR_TAB_COOKIE)?.value;
  const initialTab = isCalculatorTab(cookieTab) ? cookieTab : "search";

  return <CalculatorPageClient initialTab={initialTab} />;
}
