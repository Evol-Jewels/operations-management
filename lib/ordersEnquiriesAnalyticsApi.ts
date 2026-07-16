import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  OrdersEnquiriesAnalyticsQuery,
  OrdersEnquiriesAnalyticsResponse,
} from "@/types/orders-enquiries-analytics-api";

export function fetchOrdersEnquiriesAnalytics(
  query: OrdersEnquiriesAnalyticsQuery = {},
) {
  return apiFetch<OrdersEnquiriesAnalyticsResponse>(
    buildUrl("api/v1/analytics/orders-enquiries", { ...query }),
  );
}
