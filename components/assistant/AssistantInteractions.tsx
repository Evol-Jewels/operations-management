"use client";

import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleSlash,
  ClipboardList,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  clearInvalidDependentAnswers,
  enquiryMetalQuestions,
  resolveAssistantQuestions,
} from "@/lib/assistantFormQuestions";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  AssistantAnswer,
  AssistantAttachment,
  AssistantField,
  AssistantInteraction,
  AssistantQuestion,
} from "@/types/assistant";
import { AssistantCardView } from "./AssistantCards";
import { filesIn, listIn, MediaPreview } from "./AssistantMedia";

type QuestionInteraction = Extract<AssistantInteraction, { kind: "question" }>;
type ConfirmInteraction = Extract<AssistantInteraction, { kind: "confirm" }>;
type Value = string | string[];

function initialValue(question: AssistantQuestion): Value {
  const value = question.defaultValue;
  if (question.type === "multi_choice")
    return Array.isArray(value) ? value : value ? [String(value)] : [];
  if (Array.isArray(value)) return value[0] ?? "";
  return value === undefined || value === null ? "" : String(value);
}

function isEmpty(value: Value | undefined) {
  return Array.isArray(value) ? value.length === 0 : !value?.trim();
}

function displayAnswer(question: AssistantQuestion, value: AssistantAnswer) {
  if (value === null || value === undefined || value === "") return "—";
  const label = (item: string) =>
    question.options?.find((option) => option.value === item)?.label ?? item;
  if (Array.isArray(value)) return value.map(label).join(", ");
  if (question.type === "currency" && typeof value === "number")
    return formatCurrency(value);
  if (question.type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime()))
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
  }
  return label(String(value));
}

function ChoiceChips({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssistantQuestion;
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
}) {
  const multi = question.type === "multi_choice";
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);
  const known = new Set(question.options?.map((option) => option.value));
  const other = Array.isArray(value)
    ? value.find((item) => !known.has(item))
    : value && !known.has(value)
      ? value
      : undefined;
  const [otherOpen, setOtherOpen] = useState(other !== undefined);
  const toggle = (option: string) => {
    if (!multi) {
      setOtherOpen(false);
      onChange(option);
      return;
    }
    const next = new Set(selected);
    if (next.has(option)) next.delete(option);
    else next.add(option);
    onChange([...next]);
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {question.options?.map((option) => {
          const active = selected.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              title={option.description}
              onClick={() => toggle(option.value)}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors disabled:opacity-60",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-muted",
              )}
            >
              {multi && active && (
                <Check className="size-3.5" aria-hidden="true" />
              )}
              {option.label}
            </button>
          );
        })}
        {question.allowOther && (
          <button
            type="button"
            disabled={disabled}
            aria-pressed={otherOpen}
            onClick={() => {
              setOtherOpen(true);
              if (!multi) onChange("");
            }}
            className={cn(
              "inline-flex min-h-8 items-center rounded-full border border-dashed px-3 text-sm text-muted-foreground hover:bg-muted",
              otherOpen && "border-foreground text-foreground",
            )}
          >
            Other…
          </button>
        )}
      </div>
      {question.allowOther && otherOpen && (
        <Input
          autoFocus
          disabled={disabled}
          placeholder="Type a value"
          value={other ?? ""}
          onChange={(event) => {
            const text = event.target.value;
            if (!multi) onChange(text);
            else
              onChange([
                ...[...selected].filter((item) => known.has(item)),
                ...(text ? [text] : []),
              ]);
          }}
        />
      )}
    </div>
  );
}

/** Long option lists (people, vendors, locations) get a searchable picker. */
function SearchableChoice({
  question,
  value,
  onChange,
  disabled,
  id,
}: {
  question: AssistantQuestion;
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const multi = question.type === "multi_choice";
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const label = (item: string) =>
    question.options?.find((option) => option.value === item)?.label ?? item;
  const exact = question.options?.some(
    (option) => option.label.toLowerCase() === query.trim().toLowerCase(),
  );
  const pick = (item: string) => {
    if (multi)
      onChange(
        selected.includes(item)
          ? selected.filter((entry) => entry !== item)
          : [...selected, item],
      );
    else {
      onChange(item);
      setOpen(false);
    }
    setQuery("");
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 text-left font-normal",
            !selected.length && "text-muted-foreground",
          )}
        >
          <span className="line-clamp-2">
            {selected.length
              ? selected.map(label).join(", ")
              : (question.placeholder ?? "Search and choose…")}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-64 p-0"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="Search…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {question.options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ""}`}
                  onSelect={() => pick(option.value)}
                >
                  <Check
                    className={cn(
                      "size-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
              {question.allowOther && query.trim() && !exact && (
                <CommandItem
                  value={`__other ${query}`}
                  onSelect={() => pick(query.trim())}
                >
                  <span className="pl-6">Use “{query.trim()}”</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  disabled,
  id,
}: {
  question: AssistantQuestion;
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
  id: string;
}) {
  const text = Array.isArray(value) ? value.join(", ") : value;
  switch (question.type) {
    case "choice":
    case "multi_choice":
      if ((question.options?.length ?? 0) > 8)
        return (
          <SearchableChoice
            id={id}
            question={question}
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
        );
      return (
        <ChoiceChips
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          value={text}
          disabled={disabled}
          placeholder={question.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-20"
        />
      );
    case "date":
      return (
        <DatePicker
          id={id}
          value={text}
          disabled={disabled}
          placeholder={question.placeholder ?? "Select date"}
          onChange={onChange}
        />
      );
    case "currency":
      return (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
            ₹
          </span>
          <Input
            id={id}
            inputMode="decimal"
            value={text}
            disabled={disabled}
            placeholder={question.placeholder}
            onChange={(event) =>
              onChange(event.target.value.replace(/[^\d.]/g, ""))
            }
            className="pl-7 tabular-nums"
          />
        </div>
      );
    default:
      return (
        <Input
          id={id}
          type={
            question.type === "email"
              ? "email"
              : question.type === "phone"
                ? "tel"
                : "text"
          }
          inputMode={question.type === "number" ? "decimal" : undefined}
          autoComplete="off"
          value={text}
          disabled={disabled}
          placeholder={question.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={question.type === "number" ? "tabular-nums" : undefined}
        />
      );
  }
}

function toAnswers(
  questions: AssistantQuestion[],
  values: Record<string, Value>,
) {
  const answers: Record<string, AssistantAnswer> = {};
  for (const question of questions) {
    const value = values[question.id];
    if (isEmpty(value)) {
      answers[question.id] = null;
      continue;
    }
    if (question.type === "number" || question.type === "currency")
      answers[question.id] = Number(value);
    else answers[question.id] = value ?? null;
  }
  return answers;
}

export function QuestionForm({
  toolCallId,
  interaction,
  actionable,
  submitting,
  onSubmit,
}: {
  toolCallId: string;
  interaction: QuestionInteraction;
  actionable: boolean;
  submitting: boolean;
  onSubmit: (answers: Record<string, AssistantAnswer>) => void;
}) {
  const questions = enquiryMetalQuestions(interaction.questions);
  const [values, setValues] = useState<Record<string, Value>>(() =>
    clearInvalidDependentAnswers(
      questions,
      Object.fromEntries(
        questions.map((question) => [question.id, initialValue(question)]),
      ),
    ),
  );
  const resolvedQuestions = resolveAssistantQuestions(
    questions,
    interaction.status === "answered" ? (interaction.answers ?? {}) : values,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const quickReply =
    resolvedQuestions.length === 1 &&
    resolvedQuestions[0].type === "choice" &&
    !resolvedQuestions[0].allowOther &&
    (resolvedQuestions[0].options?.length ?? 0) <= 6;

  if (interaction.status !== "pending" || !actionable) {
    const answered = interaction.status === "answered";
    return (
      <div className="rounded-xl border bg-card px-3.5 py-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {answered ? (
            <CircleCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ClipboardList className="size-3.5" />
          )}
          <span className="font-medium text-foreground">
            {interaction.title}
          </span>
          {!answered && (
            <span>
              {interaction.status === "dismissed" ? "· skipped" : "· waiting"}
            </span>
          )}
        </div>
        {answered && interaction.answers && (
          <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {resolvedQuestions.map((question) => (
              <div key={question.id} className="min-w-0">
                <dt className="text-[11px] text-muted-foreground">
                  {question.label}
                </dt>
                <dd className="truncate text-sm">
                  {displayAnswer(
                    question,
                    interaction.answers?.[question.id] ?? null,
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }

  const submit = (override?: Record<string, Value>) => {
    const current = override ?? values;
    const nextErrors: Record<string, string> = {};
    for (const question of resolveAssistantQuestions(questions, current)) {
      const value = current[question.id];
      if (question.required && isEmpty(value))
        nextErrors[question.id] = "Required";
      else if (
        question.type === "choice" &&
        !isEmpty(value) &&
        !question.allowOther &&
        !question.options?.some((option) => option.value === value)
      )
        nextErrors[question.id] = "Choose a valid option";
      else if (
        (question.type === "number" || question.type === "currency") &&
        !isEmpty(value) &&
        !Number.isFinite(Number(value))
      )
        nextErrors[question.id] = "Enter a number";
      else if (
        question.type === "email" &&
        !isEmpty(value) &&
        !/^\S+@\S+\.\S+$/.test(String(value))
      )
        nextErrors[question.id] = "Enter a valid email";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit(toAnswers(resolveAssistantQuestions(questions, current), current));
  };

  if (quickReply) {
    const question = resolvedQuestions[0];
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {question.label || interaction.title}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {question.options?.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              title={option.description}
              className="rounded-full"
              onClick={() => submit({ [question.id]: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-label={interaction.title}
    >
      <div className="border-b bg-muted/30 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ClipboardList
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          {interaction.title}
        </p>
        {interaction.description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {interaction.description}
          </p>
        )}
      </div>
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        {resolvedQuestions.map((question) => {
          const id = `${toolCallId}-${question.id}`;
          const wide =
            question.type === "textarea" ||
            ((question.type === "multi_choice" || question.type === "choice") &&
              (question.options?.length ?? 0) <= 8);
          return (
            <div
              key={question.id}
              className={cn("space-y-1.5", wide && "sm:col-span-2")}
            >
              <label
                htmlFor={id}
                className="flex items-baseline gap-1.5 text-sm font-medium"
              >
                {question.label.replace(/\s*\(optional\)$/i, "")}
                {!question.required && (
                  <span className="text-xs font-normal text-muted-foreground">
                    optional
                  </span>
                )}
              </label>
              <QuestionInput
                key={`${id}:${question.optionsFrom ? String(values[question.optionsFrom.questionId] ?? "") : ""}`}
                id={id}
                question={question}
                value={values[question.id] ?? ""}
                disabled={
                  submitting ||
                  Boolean(question.optionsFrom && !question.options?.length)
                }
                onChange={(value) => {
                  setValues((current) =>
                    clearInvalidDependentAnswers(questions, {
                      ...current,
                      [question.id]: value,
                    }),
                  );
                  if (errors[question.id])
                    setErrors(({ [question.id]: _removed, ...rest }) => rest);
                }}
              />
              {errors[question.id] ? (
                <p className="text-xs text-destructive">
                  {errors[question.id]}
                </p>
              ) : question.help ? (
                <p className="text-xs text-muted-foreground">{question.help}</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Or reply in the chat instead.
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="gap-1.5"
        >
          {submitting ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <ArrowRight className="size-3.5" />
          )}
          {interaction.submitLabel || "Continue"}
        </Button>
      </div>
    </form>
  );
}

function ChangeValue({ field }: { field: AssistantField }) {
  if (field.previous === undefined)
    return <span className="whitespace-pre-wrap">{field.value}</span>;
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {field.previous !== null && (
        <>
          <span className="text-muted-foreground line-through decoration-muted-foreground/50">
            {field.previous}
          </span>
          <ArrowRight
            className="size-3 text-muted-foreground"
            aria-hidden="true"
          />
        </>
      )}
      <span className="font-medium whitespace-pre-wrap">{field.value}</span>
    </span>
  );
}

// The backend summarises uploads as "4 file(s)"; show the files themselves instead.
const FILE_COUNT = /^\d+ file\(s\)$/;

function FieldRows({
  fields,
  files = [],
}: {
  fields: AssistantField[];
  files?: AssistantAttachment[];
}) {
  return (
    <dl className="divide-y">
      {fields.map((field) => (
        <div
          key={field.label}
          className="grid grid-cols-[minmax(0,8.5rem)_1fr] gap-3 px-4 py-2 text-sm"
        >
          <dt className="text-muted-foreground">{field.label}</dt>
          <dd className="min-w-0 break-words">
            {files.length > 0 && FILE_COUNT.test(field.value) ? (
              <div className="flex flex-wrap gap-1.5 py-0.5">
                {files.map((file) => (
                  <MediaPreview
                    key={file.url}
                    file={file}
                    className="size-14"
                  />
                ))}
              </div>
            ) : (
              <ChangeValue field={field} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type Group = NonNullable<ConfirmInteraction["confirmation"]["groups"]>[number];
const GROUP_PREVIEW = 4;

/** Lines of a proposal (e.g. bulk order designs); long lists start collapsed. */
function ConfirmationGroups({
  groups,
  files,
}: {
  groups: Group[];
  files: AssistantAttachment[][];
}) {
  const [all, setAll] = useState(groups.length <= GROUP_PREVIEW + 2);
  const shown = all ? groups : groups.slice(0, GROUP_PREVIEW);
  return (
    <>
      {shown.map((group, index) => (
        <div key={group.title} className="border-t">
          <p className="bg-muted/30 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </p>
          {group.image !== undefined ? (
            <div className="flex gap-3 pl-4">
              <div className="mt-2 size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                {group.image ? (
                  // biome-ignore lint/performance/noImgElement: uploaded media URL
                  <img
                    src={group.image}
                    alt={group.title}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <FieldRows fields={group.fields} files={files[index]} />
              </div>
            </div>
          ) : (
            <FieldRows fields={group.fields} files={files[index]} />
          )}
        </div>
      ))}
      {groups.length > shown.length ||
      (all && groups.length > GROUP_PREVIEW + 2) ? (
        <button
          type="button"
          onClick={() => setAll((value) => !value)}
          className="w-full border-t px-4 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          {all ? "Show fewer lines" : `Show all ${groups.length} lines`}
        </button>
      ) : null}
    </>
  );
}

const statusCopy = {
  confirmed: {
    label: "Done",
    icon: CircleCheck,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: CircleSlash,
    className: "text-muted-foreground",
  },
  failed: { label: "Failed", icon: CircleAlert, className: "text-destructive" },
  dismissed: {
    label: "Not confirmed",
    icon: CircleSlash,
    className: "text-muted-foreground",
  },
} as const;

export function ConfirmationCard({
  interaction,
  actionable,
  submitting,
  onDecide,
}: {
  interaction: ConfirmInteraction;
  actionable: boolean;
  submitting: boolean;
  onDecide: (approved: boolean) => void;
}) {
  const [choice, setChoice] = useState<boolean | null>(null);
  const { confirmation } = interaction;
  const danger = confirmation.tone === "danger";
  const pending = interaction.status === "pending";
  const status =
    interaction.status in statusCopy
      ? statusCopy[interaction.status as keyof typeof statusCopy]
      : null;
  const collapsed = !pending && interaction.status !== "failed";
  const fields = useMemo(() => confirmation.fields, [confirmation.fields]);
  const files = useMemo(() => filesIn(interaction.input), [interaction.input]);
  const requirements = listIn(interaction.input, "requirements");

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card shadow-sm",
          pending && danger && "border-red-500/30",
          pending && !danger && "border-foreground/20",
          !pending && "shadow-xs",
        )}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-3 px-4 py-3",
            !collapsed && "border-b",
            pending && (danger ? "bg-red-500/[0.04]" : "bg-muted/30"),
          )}
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck
                className={cn(
                  "size-4 shrink-0",
                  danger ? "text-red-500" : "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span className="truncate">{confirmation.title}</span>
            </p>
            {confirmation.description && (
              <p className="mt-0.5 pl-6 text-xs text-muted-foreground">
                {confirmation.description}
              </p>
            )}
          </div>
          {status && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-xs font-medium",
                status.className,
              )}
            >
              <status.icon className="size-3.5" aria-hidden="true" />
              {status.label}
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            {fields.length > 0 && <FieldRows fields={fields} files={files} />}
            {confirmation.groups?.length ? (
              <ConfirmationGroups
                groups={confirmation.groups}
                files={confirmation.groups.map((_, index) =>
                  filesIn(requirements[index]),
                )}
              />
            ) : null}
          </>
        )}
        {interaction.status === "failed" && interaction.error && (
          <p className="border-t bg-red-500/[0.04] px-4 py-2 text-sm text-destructive">
            {interaction.error}
          </p>
        )}
        {pending && actionable && (
          <div className="flex items-center justify-end gap-2 border-t bg-muted/20 px-4 py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => {
                setChoice(false);
                onDecide(false);
              }}
            >
              {submitting && choice === false && (
                <LoaderCircle className="size-3.5 animate-spin" />
              )}
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant={danger ? "destructive" : "default"}
              disabled={submitting}
              onClick={() => {
                setChoice(true);
                onDecide(true);
              }}
            >
              {submitting && choice === true ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {confirmation.confirmLabel || "Confirm"}
            </Button>
          </div>
        )}
      </div>
      {interaction.status === "confirmed" && interaction.result?.card && (
        <AssistantCardView card={interaction.result.card} />
      )}
    </div>
  );
}
