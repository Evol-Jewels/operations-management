export type AgentInventoryItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  color: string;
  status: string;
  purity: number | null;
  netWeight: string | null;
  grossWeight: string | null;
  location: string | null;
  price: number;
  vendor?: string | null;
  imageId?: string | null;
  imageKey?: string | null;
  href: string;
};

export type AgentInventoryResult = {
  items: AgentInventoryItem[];
  total: number;
  offset: number;
};

export type AgentEnquiryItem = {
  kind: "enquiry";
  id: string;
  code: string;
  name: string;
  phoneNumber: string;
  status: string;
  budget: string | null;
  salesPerson: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  estimationCount?: number;
  href: string;
};

export type AgentEnquiryResult = {
  kind: "enquiry";
  items: AgentEnquiryItem[];
  total: number;
  offset: number;
};

export type AgentOrderItem = {
  kind: "order";
  id: string;
  code: string;
  sourceEnquiry: number | null;
  name: string;
  phoneNumber: string;
  status: string;
  productType: string;
  productCode: string | null;
  vendor: string | null;
  estimatedDeliveryDate: string | null;
  isCadRequired: boolean;
  salesPerson: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  href: string;
};

export type AgentOrderResult = {
  kind: "order";
  items: AgentOrderItem[];
  total: number;
  offset: number;
};

export type AgentAnalyticsRow = {
  rank: number;
  salesPerson: string;
  transactions: number;
  revenue: string;
  revenueShare: string;
  target: string | null;
  incentive: {
    eligible: boolean;
    earnedAmount: string;
    payableAmount: string;
  } | null;
};

export type AgentSalesAnalyticsResult = {
  kind: "sales_analytics";
  period: string;
  salesPerson?: string | null;
  transactions?: number;
  revenue?: string;
  target?: string | null;
  incentive?: {
    eligible: boolean;
    earnedAmount: string;
    payableAmount: string;
  } | null;
  summary?: Record<string, number>;
  breakdown?: AgentAnalyticsRow[];
  breakdownTruncated?: boolean;
};

export type AgentSalesLeaderboardResult = {
  kind: "sales_leaderboard";
  period: string;
  leaderboard: {
    rank: number;
    salesPerson: { id: string; name: string | null };
    totalProductsSold: number;
  }[];
};

export type AgentOrderUpdateResult = {
  kind: "order_update";
  code: string;
  status: string;
  message?: string | null;
};

export type AgentUserItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  status: string;
  role: string | null;
  department: string | null;
  location: string | null;
  monthlySalesTarget: string | null;
};

export type AgentUsersResult = {
  kind: "users";
  items: AgentUserItem[];
  total: number;
  offset: number;
};

export type AgentProductAnalyticsResult = {
  kind: "product_analytics";
  summary: Record<string, number>;
};

export type AgentMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  inventory?: AgentInventoryResult;
  enquiries?: AgentEnquiryResult;
  orders?: AgentOrderResult;
  salesAnalytics?: AgentSalesAnalyticsResult;
  salesLeaderboard?: AgentSalesLeaderboardResult;
  orderUpdate?: AgentOrderUpdateResult;
  users?: AgentUsersResult;
  productAnalytics?: AgentProductAnalyticsResult;
};

export type AgentSessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type AgentConversation = {
  id: string;
  title: string;
  messages: AgentMessage[];
  isRunning: boolean;
};

export type AgentStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool"; name: string }
  | { type: "inventory"; result: AgentInventoryResult }
  | { type: "enquiries"; result: AgentEnquiryResult }
  | { type: "orders"; result: AgentOrderResult }
  | { type: "salesAnalytics"; result: AgentSalesAnalyticsResult }
  | { type: "salesLeaderboard"; result: AgentSalesLeaderboardResult }
  | { type: "orderUpdate"; result: AgentOrderUpdateResult }
  | { type: "users"; result: AgentUsersResult }
  | { type: "productAnalytics"; result: AgentProductAnalyticsResult }
  | { type: "done"; messages: AgentMessage[] }
  | { type: "error"; message: string };
