import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { type AccessStep, OTP_LENGTH } from "./customer-confirmation-utils";

interface CustomerAccessCardProps {
  step: Exclude<AccessStep, "requirements">;
  refCode: string;
  phone: string;
  phoneError?: string;
  phoneIsValid: boolean;
  otp: string;
  maskedPhone: string;
  onPhoneChange: (value: string) => void;
  onPhoneValidityChange: (valid: boolean) => void;
  onPhoneSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onOtpChange: (value: string) => void;
  onOtpSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

export function CustomerAccessCard(props: CustomerAccessCardProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center py-5 sm:py-8">
      <Card className="w-full gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-4 [.border-b]:pb-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline">Order #{props.refCode}</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <LockKeyhole className="size-3.5" />
              Private
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {props.step === "phone" ? (
            <PhoneStep {...props} />
          ) : (
            <OtpStep {...props} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PhoneStep(props: CustomerAccessCardProps) {
  return (
    <form onSubmit={props.onPhoneSubmit} noValidate>
      <StepHeading
        step="Step 1 of 2"
        title="Confirm your order requirements"
        description="Enter the phone number saved with this order to continue."
      />

      <div className="mt-5 space-y-2">
        <Label htmlFor="customer-phone">Phone number</Label>
        <PhoneInput
          id="customer-phone"
          value={props.phone}
          onChange={props.onPhoneChange}
          onValidityChange={props.onPhoneValidityChange}
          error={props.phoneError}
          showErrorMessage={false}
        />
        {props.phoneError ? (
          <p className="text-xs text-destructive" role="alert">
            {props.phoneError}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-5 h-11 w-full"
        disabled={!props.phone || !props.phoneIsValid}
      >
        Continue
      </Button>
    </form>
  );
}

function OtpStep(props: CustomerAccessCardProps) {
  return (
    <form onSubmit={props.onOtpSubmit} noValidate>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={props.onBack}
        className="-ml-2 mb-4 text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Change phone number
      </Button>
      <StepHeading
        step="Step 2 of 2"
        title="Enter verification code"
        description={`Enter the 6-digit code for the number ending in ${props.maskedPhone.slice(-4)}.`}
      />

      <div className="mt-5 space-y-2">
        <Label htmlFor="customer-otp">6-digit code</Label>
        <Input
          id="customer-otp"
          value={props.otp}
          onChange={(event) => props.onOtpChange(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          autoFocus
          placeholder="000000"
          className="h-12 text-center font-mono text-xl tracking-[0.45em] tabular-nums"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-5 h-11 w-full"
        disabled={props.otp.length !== OTP_LENGTH}
      >
        View requirements
      </Button>
    </form>
  );
}

function StepHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{step}</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
