export interface BackendStockSaleUserSummary {
  id: string;
  name: string | null;
  image: string | null;
}

export interface BackendStockSaleLocationSummary {
  id: string;
  name: string;
  city: string;
}

export interface BackendStockSaleItem {
  id: string;
  productCode: string;
}

export interface BackendStockSaleRow {
  id: string;
  saleMonth: string | null;
  customerName: string;
  totalAmount: string;
  storeName: string | null;
  location: BackendStockSaleLocationSummary | null;
  source: string | null;
  stockType: string | null;
  salesPersonRaw: string | null;
  salesPerson: BackendStockSaleUserSummary | null;
  items: BackendStockSaleItem[];
  createdAt: string;
  updatedAt: string;
  syncedAt: string;
}

export interface ListStockSalesQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface StockSalesListResponse {
  data: BackendStockSaleRow[];
  total: number;
}

export type StockSalesAnalyticsPeriod = "month" | "allTime";
export type StockSalesMoneyValue = string | number;

export interface StockSalesAnalyticsQuery {
  period?: StockSalesAnalyticsPeriod;
  saleMonth?: string;
}

export interface StockSalesPersonAnalyticsQuery
  extends StockSalesAnalyticsQuery {
  salesPersonId: string;
}

export interface StockSalesAnalyticsSalesPerson {
  id: string;
  name: string | null;
  image: string | null;
}

export interface StockSalesAnalyticsBreakdownRow {
  rank: number;
  salesPerson: StockSalesAnalyticsSalesPerson | null;
  label?: string;
  transactions: number;
  revenue: string;
  target: string | null;
  revenueShare: string;
  incentive: {
    eligible: boolean;
    earnedAmount: string;
    payableAmount: string;
    multiplier: string;
  } | null;
}

export interface StockSalesLeaderboardRow {
  rank: number;
  salesPerson: StockSalesAnalyticsSalesPerson;
  totalProductsSold: number;
}

export interface StockSalesLeaderboardResponse {
  period: string;
  leaderboard: StockSalesLeaderboardRow[];
}

export interface StockSalesMeResponse {
  period: string;
  salesPerson: StockSalesAnalyticsSalesPerson;
  transactions: number;
  target?: StockSalesMoneyValue | null;
  revenue: StockSalesMoneyValue;
  incentive: {
    eligible: boolean;
    earnedAmount: StockSalesMoneyValue;
    payableAmount: StockSalesMoneyValue;
    multiplier: string;
  };
}

export interface StockSalesAnalyticsResponse {
  period: string;
  summary: {
    totalSalesPeople: number;
    totalTransactions: number;
    totalRevenue: string;
    totalEarnedIncentive: string;
    totalPayableIncentive: string;
  };
  salesBreakdown: StockSalesAnalyticsBreakdownRow[];
}

export interface StockSalesSyncSummary {
  sheetUrl: string;
  startedAt: string;
  finishedAt: string;
  rowsRead: number;
  transactionsInserted: number;
  itemsInserted: number;
  rowsSkipped: number;
}
