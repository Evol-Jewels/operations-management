// Mirrors evol-backend src/app/assistant/assistant.types.ts.

export type AssistantTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type AssistantField = {
  label: string;
  value: string;
  previous?: string | null;
};

export type AssistantRecord = {
  id: string;
  code: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  statusTone?: AssistantTone;
  image?: string | null;
  meta?: AssistantField[];
  href?: string | null;
};

export type AssistantInventoryItem = {
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
  imageId: string | null;
  imageKey: string | null;
  href: string;
};

export type AssistantMetric = {
  label: string;
  value: number | string | null;
  format?: "currency" | "number" | "percent" | "text";
  hint?: string | null;
};

export type AssistantCard =
  | {
      type: "inventory";
      items: AssistantInventoryItem[];
      total: number;
      offset: number;
    }
  | {
      type: "records";
      entity: string;
      title: string;
      items: AssistantRecord[];
      total?: number;
      offset?: number;
      href?: string | null;
    }
  | {
      type: "record";
      entity: string;
      record: AssistantRecord;
      sections: { title: string; fields: AssistantField[] }[];
      children?: { title: string; items: AssistantRecord[] }[];
    }
  | {
      type: "stats";
      title: string;
      subtitle?: string | null;
      metrics: AssistantMetric[];
      breakdowns?: {
        title: string;
        rows: {
          label: string;
          value: number;
          format?: "currency" | "number";
          secondary?: string | null;
        }[];
      }[];
      href?: string | null;
    }
  | {
      type: "done";
      title: string;
      message?: string | null;
      record?: AssistantRecord | null;
    };

export type AssistantQuestionType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "phone"
  | "email"
  | "choice"
  | "multi_choice";

export type AssistantQuestion = {
  id: string;
  label: string;
  type: AssistantQuestionType;
  required: boolean;
  options?: { value: string; label: string; description?: string }[];
  optionsFrom?: {
    questionId: string;
    optionsByValue: Record<
      string,
      { value: string; label: string; description?: string }[]
    >;
  };
  allowOther?: boolean;
  placeholder?: string;
  help?: string;
  defaultValue?: string | number | string[];
};

export type AssistantAnswer = string | number | string[] | null;

export type AssistantInteractionStatus =
  | "pending"
  | "answered"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "dismissed";

export type AssistantConfirmation = {
  title: string;
  description?: string | null;
  fields: AssistantField[];
  groups?: { title: string; fields: AssistantField[] }[];
  tone?: "default" | "danger";
  confirmLabel?: string;
};

export type AssistantInteraction =
  | {
      kind: "question";
      status: AssistantInteractionStatus;
      title: string;
      description?: string;
      questions: AssistantQuestion[];
      submitLabel?: string;
      answers?: Record<string, AssistantAnswer>;
    }
  | {
      kind: "confirm";
      status: AssistantInteractionStatus;
      tool: string;
      input: unknown;
      confirmation: AssistantConfirmation;
      result?: { card?: AssistantCard; summary?: string };
      error?: string;
    };

export type AssistantAttachment = {
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
  durationSeconds?: number;
  publicId?: string;
};

export type AssistantPageContext = { path: string; title?: string };

export type AssistantToolPart = {
  type: "tool";
  id: string;
  name: string;
  label: string;
  status: "running" | "done" | "error";
  summary?: string;
  error?: string;
  card?: AssistantCard;
  interaction?: AssistantInteraction;
};

export type AssistantPart =
  | { type: "text"; text: string }
  /** A reply that failed or was stopped before it finished. */
  | { type: "notice"; tone: "info" | "error"; text: string }
  | AssistantToolPart;

export type AssistantMessage =
  | {
      id: string;
      role: "user";
      text: string;
      attachments?: AssistantAttachment[];
      context?: AssistantPageContext;
      createdAt: string;
    }
  | {
      id: string;
      role: "assistant";
      parts: AssistantPart[];
      createdAt: string;
    };

export type AssistantThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type AssistantThread = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  pendingToolCallId: string | null;
  isRunning: boolean;
};

export type AssistantCapabilities = {
  tools: { name: string; label: string; mode: "read" | "write" }[];
};

export type AssistantSendInput =
  | {
      type: "message";
      text: string;
      attachments?: AssistantAttachment[];
      context?: AssistantPageContext;
    }
  | {
      type: "answer";
      toolCallId: string;
      answers: Record<string, AssistantAnswer>;
    }
  | { type: "confirm"; toolCallId: string; approved: boolean };

export type AssistantStreamEvent =
  | { type: "start"; messageId: string }
  | { type: "text"; delta: string }
  | { type: "tool_start"; id: string; name: string; label: string }
  | {
      type: "tool_end";
      id: string;
      name: string;
      status: "done" | "error";
      summary?: string;
      error?: string;
      card?: AssistantCard;
      interaction?: AssistantInteraction;
    }
  | { type: "done"; messages: AssistantMessage[]; title: string }
  | { type: "error"; message: string };
