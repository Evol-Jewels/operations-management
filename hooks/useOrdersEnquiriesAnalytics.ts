"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrdersEnquiriesAnalytics } from "@/lib/ordersEnquiriesAnalyticsApi";
import type { OrdersEnquiriesAnalyticsQuery } from "@/types/orders-enquiries-analytics-api";

export const ordersEnquiriesAnalyticsKeys = {
  all: ["orders-enquiries-analytics"] as const,
  detail: (query: OrdersEnquiriesAnalyticsQuery = {}) =>
    [...ordersEnquiriesAnalyticsKeys.all, query] as const,
};

export function useOrdersEnquiriesAnalytics(
  query: OrdersEnquiriesAnalyticsQuery = {},
) {
  return useQuery({
    queryKey: ordersEnquiriesAnalyticsKeys.detail(query),
    queryFn: () => fetchOrdersEnquiriesAnalytics(query),
  });
}
