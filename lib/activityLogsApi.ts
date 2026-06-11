import { apiFetch, buildUrl } from "@/lib/apiClient";
import type {
  BackendActivityLog,
  ListActivityLogsQuery,
} from "@/types/activity-api";

export function fetchActivityLogs(query: ListActivityLogsQuery) {
  return apiFetch<BackendActivityLog[]>(
    buildUrl("api/v1/activity-logs", {
      sourceType: query.sourceType,
      sourceCode: query.sourceCode,
      limit: query.limit,
      offset: query.offset,
      type: query.type,
      itemId: query.itemId,
      createdBy: query.createdBy,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
    }),
  );
}
