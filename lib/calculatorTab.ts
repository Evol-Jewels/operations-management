export const CALCULATOR_TABS = ["search", "calculate"] as const;
export type CalculatorTab = (typeof CALCULATOR_TABS)[number];

export const CALCULATOR_TAB_COOKIE = "calculator:tab";

export function isCalculatorTab(value: unknown): value is CalculatorTab {
  return (
    typeof value === "string" &&
    (CALCULATOR_TABS as readonly string[]).includes(value)
  );
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function writeCalculatorTabCookie(tab: CalculatorTab) {
  if (typeof document === "undefined") return;
  document.cookie = `${CALCULATOR_TAB_COOKIE}=${tab}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
