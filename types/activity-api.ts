export type SourceType = "ENQUIRY" | "ORDER";

export type ActivityLogType =
  | "ENQUIRY_CREATED"
  | "STATUS_CHANGED"
  | "ITEM_ADDED"
  | "ITEM_UPDATED"
  | "ITEM_DELETED"
  | "ESTIMATION_ADDED"
  | "ESTIMATION_UPDATED"
  | "ESTIMATION_DELETED"
  | "ORDER_CREATED"
  | "ORDER_MODIFIED"
  | "COMMENT_ADDED"
  | "COMMENT_UPDATED"
  | "COMMENT_DELETED";

export interface BackendUserSummary {
  id: string;
  name: string;
  image: string | null;
}

export type BackendCreatedBy = BackendUserSummary | string | null;

export interface BackendComment {
  id: string;
  sourceType: SourceType;
  sourceCode: number;
  content: string;
  createdBy: BackendCreatedBy;
  updatedBy: BackendCreatedBy;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BackendActivityLog {
  id: string;
  sourceType: SourceType;
  sourceCode: number;
  type: ActivityLogType;
  message: string;
  itemId: string | null;
  createdBy: BackendCreatedBy;
  createdAt: string;
}

export interface ListSourceQuery {
  sourceType: SourceType;
  sourceCode: number;
  limit?: number;
  offset?: number;
}

export interface ListActivityLogsQuery extends ListSourceQuery {
  type?: ActivityLogType;
  itemId?: string;
  createdBy?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CreateCommentInput {
  sourceType: SourceType;
  sourceCode: number;
  content: string;
}
