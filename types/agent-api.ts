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

export type AgentMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  text: string;
  inventory?: AgentInventoryResult;
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
  | { type: "done"; messages: AgentMessage[] }
  | { type: "error"; message: string };
