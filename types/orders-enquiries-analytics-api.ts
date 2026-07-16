import type { BackendEnquiryStatus } from "@/types/enquiry-api";
import type { BackendOrderStatus } from "@/types/order-api";

export interface OrdersEnquiriesAnalyticsQuery {
  from?: string;
  to?: string;
  salesPerson?: string;
}

export interface OrdersEnquiriesAnalyticsResponse {
  period: {
    from: string;
    to: string;
  };
  periodActivity: {
    enquiriesCreated: number;
    ordersCreated: number;
    enquiryFunnel: Record<BackendEnquiryStatus, number>;
    conversion: {
      directOrders: number;
      enquiryOrders: number;
      enquiriesWithOrders: number;
      enquiryToOrderRate: number;
    };
    timing: {
      medianHoursToFirstEstimate: number | null;
      medianDaysToFirstOrder: number | null;
    };
    trends: Array<{
      date: string;
      enquiriesCreated: number;
      ordersCreated: number;
    }>;
  };
  currentSnapshot: {
    openEnquiries: number;
    activeOrders: number;
    overdueOrders: number;
    dueSoonOrders: number;
    noDeliveryDateOrders: number;
    orderStages: Array<{
      status: BackendOrderStatus;
      count: number;
    }>;
  };
  generatedAt: string;
}
