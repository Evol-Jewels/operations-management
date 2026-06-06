import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerCategory } from "@/types";
import type { CustomerDetails, EnquiryMode } from "./enquiry-form-types";
import {
  STORE_VISIT_LOCATIONS,
  VISIT_HOURS,
  VISIT_MINUTES,
  VISIT_PERIODS,
} from "./enquiry-form-types";
import {
  buildVisitDateTime,
  formatVisitDateTime,
  parseVisitDateTime,
} from "./enquiry-form-utils";
import { OkButton, OptionTile, StepNumber } from "./typeform-controls";

interface StepProps {
  customer: CustomerDetails;
  errors: Record<string, string>;
  stepNumber: number;
  updateCustomer: (patch: Partial<CustomerDetails>) => void;
  goNext: () => void;
  selectEnquiryMode?: (mode: EnquiryMode) => void;
  selectCategory?: (category: CustomerCategory) => void;
  setIsPhoneValid: (isValid: boolean) => void;
  maxSelectableDate?: string;
}

export function PhoneStep({
  customer,
  errors,
  stepNumber,
  updateCustomer,
  goNext,
  setIsPhoneValid,
}: StepProps) {
  return (
    <div className="w-full max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          What is the customer&apos;s phone number?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Need to contact them for the enquiry
        </p>
      </div>
      <div className="max-w-xs space-y-1">
        <PhoneInput
          value={customer.phone}
          onChange={(phone) => updateCustomer({ phone })}
          onValidityChange={setIsPhoneValid}
          error={errors.phone}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goNext();
            }
          }}
        />
      </div>
      <OkButton onClick={goNext} />
    </div>
  );
}

export function NameStep({
  customer,
  errors,
  stepNumber,
  updateCustomer,
  goNext,
}: StepProps) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        {customer.isExisting && (
          <div className="mb-3">
            <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              Existing customer found
            </span>
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          What is the customer&apos;s name?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Full name as they&apos;d like to be addressed
        </p>
      </div>
      <div className="max-w-xs space-y-1">
        <Input
          id="name"
          placeholder="e.g. Priya Mehta"
          value={customer.name}
          onChange={(event) => updateCustomer({ name: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goNext();
            }
          }}
          className="h-11 text-base"
          autoFocus
        />
        {errors.name && (
          <p className="text-[11px] text-destructive">{errors.name}</p>
        )}
      </div>
      <OkButton onClick={goNext} />
    </div>
  );
}

export function NotesStep({
  customer,
  stepNumber,
  updateCustomer,
  goNext,
}: StepProps) {
  const hasNotes = customer.notes.trim().length > 0;

  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          Any notes?{" "}
          <span className="text-sm text-muted-foreground/60">(optional)</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer preferences, behaviour notes, or anything useful for enquiry.
        </p>
      </div>
      <div className="max-w-sm space-y-4">
        <Textarea
          id="notes"
          placeholder="e.g. Prefers yellow gold, allergic to nickel..."
          value={customer.notes}
          onChange={(event) => updateCustomer({ notes: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              goNext();
            }
          }}
          rows={4}
          className="resize-none text-sm"
          autoFocus
        />
        <div className="space-y-2">
          <label
            htmlFor="budget"
            className="text-xs font-medium text-foreground/80"
          >
            Budget (₹)
          </label>
          <Input
            id="budget"
            type="number"
            min={10000}
            placeholder="Minimum ₹10,000"
            value={customer.budget ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              updateCustomer({
                budget: value === "" ? undefined : Number(value),
              });
            }}
            className="h-10 text-base"
          />
        </div>
      </div>
      <OkButton
        onClick={goNext}
        label={hasNotes ? "OK" : "Skip"}
        shortcutLabel="Ctrl/Cmd Enter"
      />
    </div>
  );
}
