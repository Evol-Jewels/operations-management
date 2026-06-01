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
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          What&apos;s the customer&apos;s phone number?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll check if they&apos;re already in the system
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
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              Existing customer found
            </span>
          </div>
        )}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          What&apos;s the customer&apos;s name?
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

export function EnquiryTypeStep({
  customer,
  errors,
  stepNumber,
  selectEnquiryMode,
}: StepProps) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          How are they reaching out?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the enquiry type
        </p>
      </div>
      <div className="max-w-sm space-y-3">
        <OptionTile
          letter="A"
          title="Store Visit"
          description="Customer is visiting a store location"
          selected={customer.enquiryMode === "store_visit"}
          onClick={() => selectEnquiryMode?.("store_visit")}
        />
        <OptionTile
          letter="B"
          title="Online Enquiry"
          description="Customer reached out online or by phone"
          selected={customer.enquiryMode === "online"}
          onClick={() => selectEnquiryMode?.("online")}
        />
      </div>
      {errors.enquiryMode && (
        <p className="text-[11px] text-destructive">{errors.enquiryMode}</p>
      )}
    </div>
  );
}

export function VisitDetailsStep({
  customer,
  errors,
  stepNumber,
  updateCustomer,
  goNext,
  maxSelectableDate,
}: StepProps) {
  const visitDateTime = parseVisitDateTime(customer.visitTime);

  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          Schedule the visit
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select the store and preferred time
        </p>
      </div>
      <div className="max-w-sm space-y-4">
        <FormField
          label="Store location"
          htmlFor="visitCity"
          required
          error={errors.visitCity}
        >
          <Select
            value={customer.visitCity}
            onValueChange={(visitCity) => updateCustomer({ visitCity })}
          >
            <SelectTrigger id="visitCity" className="h-10 w-full text-sm">
              <SelectValue placeholder="Select store location" />
            </SelectTrigger>
            <SelectContent>
              {STORE_VISIT_LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Visit date and time"
          htmlFor="visitTime"
          required
          error={errors.visitTime}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="visitTime"
                type="button"
                variant="outline"
                className="h-10 w-full justify-between px-3 font-normal"
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {customer.visitTime ? (
                    formatVisitDateTime(customer.visitTime)
                  ) : (
                    <span className="text-muted-foreground">
                      Select visit date and time
                    </span>
                  )}
                </span>
                <Clock3 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[340px] space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Visit schedule</p>
                <p className="text-xs text-muted-foreground">
                  Choose the date and a clean time slot.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="visitDate"
                  className="text-xs font-medium text-foreground/80"
                >
                  Visit date
                </label>
                <Input
                  id="visitDate"
                  type="date"
                  max={maxSelectableDate}
                  value={visitDateTime.date}
                  onChange={(event) =>
                    updateCustomer({
                      visitTime: buildVisitDateTime(
                        event.target.value,
                        visitDateTime.hour,
                        visitDateTime.minute,
                        visitDateTime.period,
                      ),
                    })
                  }
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <VisitTimeSelect
                  label="Hour"
                  value={visitDateTime.hour}
                  options={VISIT_HOURS}
                  onChange={(hour) =>
                    updateCustomer({
                      visitTime: buildVisitDateTime(
                        visitDateTime.date,
                        hour,
                        visitDateTime.minute,
                        visitDateTime.period,
                      ),
                    })
                  }
                />
                <VisitTimeSelect
                  label="Minute"
                  value={visitDateTime.minute}
                  options={VISIT_MINUTES}
                  onChange={(minute) =>
                    updateCustomer({
                      visitTime: buildVisitDateTime(
                        visitDateTime.date,
                        visitDateTime.hour,
                        minute,
                        visitDateTime.period,
                      ),
                    })
                  }
                />
                <VisitTimeSelect
                  label="Period"
                  value={visitDateTime.period}
                  options={VISIT_PERIODS}
                  onChange={(period) =>
                    updateCustomer({
                      visitTime: buildVisitDateTime(
                        visitDateTime.date,
                        visitDateTime.hour,
                        visitDateTime.minute,
                        period as "AM" | "PM",
                      ),
                    })
                  }
                />
              </div>
            </PopoverContent>
          </Popover>
        </FormField>
      </div>
      <OkButton onClick={goNext} />
    </div>
  );
}

function VisitTimeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-foreground/80">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10 w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CategoryStep({
  customer,
  stepNumber,
  selectCategory,
}: StepProps) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          Customer category
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          How would you classify this customer?
        </p>
      </div>
      <div className="max-w-sm space-y-3">
        {(["VIP", "Middle", "Lower"] as CustomerCategory[]).map(
          (category, index) => (
            <OptionTile
              key={category}
              letter={String.fromCharCode(65 + index)}
              title={category}
              selected={customer.category === category}
              onClick={() => selectCategory?.(category)}
            />
          ),
        )}
      </div>
    </div>
  );
}

export function EmailStep({
  customer,
  stepNumber,
  updateCustomer,
  goNext,
}: StepProps) {
  return (
    <SimpleInputStep
      stepNumber={stepNumber}
      title="What's their email?"
      description="Optional - skip if you don't have it"
      input={
        <Input
          id="email"
          type="email"
          placeholder="priya@example.com"
          value={customer.email}
          onChange={(event) => updateCustomer({ email: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goNext();
            }
          }}
          className="h-11 text-base"
          autoFocus
        />
      }
      goNext={goNext}
    />
  );
}

export function CityStep({
  customer,
  stepNumber,
  updateCustomer,
  goNext,
}: StepProps) {
  return (
    <SimpleInputStep
      stepNumber={stepNumber}
      title="Which city are they from?"
      description="Optional - helps with follow-ups"
      input={
        <Input
          id="city"
          placeholder="e.g. Hyderabad"
          value={customer.city}
          onChange={(event) => updateCustomer({ city: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              goNext();
            }
          }}
          className="h-11 text-base"
          autoFocus
        />
      }
      goNext={goNext}
    />
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
          Any notes?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Preferences, behaviour notes, or anything useful
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
        <p className="mt-2 text-xs text-muted-foreground/50">
          Optional - skip if nothing to add
        </p>
      </div>
      <OkButton
        onClick={goNext}
        label={hasNotes ? "OK" : "Skip"}
        shortcutLabel="Ctrl/Cmd Enter"
      />
    </div>
  );
}

function SimpleInputStep({
  stepNumber,
  title,
  description,
  input,
  goNext,
}: {
  stepNumber: number;
  title: string;
  description: string;
  input: React.ReactNode;
  goNext: () => void;
}) {
  return (
    <div className="w-full max-w-md space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <StepNumber n={stepNumber} />
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="max-w-xs space-y-1">{input}</div>
      <OkButton onClick={goNext} />
    </div>
  );
}
