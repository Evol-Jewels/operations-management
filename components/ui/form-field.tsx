import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  optional,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-xs font-medium",
            error ? "text-destructive" : "text-foreground/80",
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {optional && (
          <span className="text-[10px] text-muted-foreground/60">Optional</span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// Section heading — used between form sections
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-0.5 border-b border-border pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
