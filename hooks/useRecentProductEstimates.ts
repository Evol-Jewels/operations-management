"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchRecentProductEstimates } from "@/lib/recentProductEstimatesApi";

const RECENT_ESTIMATES_PAGE_SIZE = 20;

export function useInfiniteRecentProductEstimates(refreshKey: string) {
  return useInfiniteQuery({
    queryKey: [
      "recent-product-estimates",
      { refreshKey, limit: RECENT_ESTIMATES_PAGE_SIZE },
    ],
    queryFn: ({ pageParam }) =>
      fetchRecentProductEstimates({
        limit: RECENT_ESTIMATES_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < RECENT_ESTIMATES_PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
}
