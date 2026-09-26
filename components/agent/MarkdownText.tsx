import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_li]:list-item [&_li]:list-disc [&_li]:marker:text-muted-foreground [&_ol_li]:list-decimal [&_p]:break-words [&_strong]:font-semibold [&_table]:w-full [&_tr]:border-b">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
