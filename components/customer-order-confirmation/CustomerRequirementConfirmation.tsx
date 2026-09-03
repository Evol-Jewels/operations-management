"use client";

import { CheckCircle2, FileQuestion } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { normalizeRequirementItems } from "@/components/enquiry/requirements/requirement-display-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { validatePhone } from "@/components/ui/phone-input";
import { useOrderDetails } from "@/hooks/useOrders";
import { mapBackendOrderDetailsToOrder } from "@/lib/orderMappers";
import { CustomerAccessCard } from "./CustomerAccessCard";
import { CustomerPageFrame, CustomerPageLoading } from "./CustomerPageFrame";
import {
  type AccessStep,
  customerNamesMatch,
  getConfirmationStorageKey,
  type LocalConfirmation,
  maskPhoneNumber,
  OTP_LENGTH,
  phoneNumbersMatch,
  readLocalConfirmation,
} from "./customer-confirmation-utils";
import { RequirementReview } from "./RequirementReview";

export function CustomerRequirementConfirmation() {
  const params = useParams<{ refCode: string }>();
  const refCode = params.refCode;
  const orderQuery = useOrderDetails(refCode);
  const order = useMemo(
    () =>
      orderQuery.data
        ? mapBackendOrderDetailsToOrder(orderQuery.data)
        : undefined,
    [orderQuery.data],
  );
  const requirements = useMemo(
    () =>
      order
        ? normalizeRequirementItems({
            selectedProducts: order.selectedProducts ?? [],
            customProducts: order.customProducts ?? [],
            // Deliberately empty: estimates are never exposed on this page.
            estimations: [],
          })
        : [],
    [order],
  );

  const [step, setStep] = useState<AccessStep>("phone");
  const [phone, setPhone] = useState("");
  const [phoneIsValid, setPhoneIsValid] = useState(false);
  const [phoneError, setPhoneError] = useState<string>();
  const [otp, setOtp] = useState("");
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmation, setConfirmation] = useState<LocalConfirmation | null>(
    null,
  );

  useEffect(() => {
    setConfirmation(readLocalConfirmation(refCode));
  }, [refCode]);

  function handlePhoneSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validatePhone(phone);

    if (validationError || !phoneIsValid) {
      setPhoneError(validationError ?? "Enter a valid phone number");
      return;
    }

    if (
      !order?.customerPhone ||
      !phoneNumbersMatch(phone, order.customerPhone)
    ) {
      setPhoneError(
        "This phone number does not match the customer details for this order.",
      );
      return;
    }

    setPhoneError(undefined);
    setOtp("");
    setStep("otp");
  }

  function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^\d{6}$/.test(otp)) {
      return;
    }

    setStep("requirements");
  }

  function handleConfirm() {
    if (!order || confirmation) return;

    if (!customerNamesMatch(confirmationName, order.customerName)) {
      return;
    }

    const nextConfirmation: LocalConfirmation = {
      confirmedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      getConfirmationStorageKey(refCode),
      JSON.stringify(nextConfirmation),
    );
    setConfirmation(nextConfirmation);
  }

  if (orderQuery.isLoading) return <CustomerPageLoading />;

  if (orderQuery.isError || !order) {
    return (
      <CustomerPageFrame>
        <Card className="mx-auto mt-8 max-w-lg">
          <CardContent className="px-6 py-12 text-center sm:px-10">
            <FileQuestion className="mx-auto size-8 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold tracking-tight">
              We couldn&apos;t find this order
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Check that the confirmation link is complete, or ask your EVOL
              representative to share it again.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-7"
              onClick={() => orderQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </CustomerPageFrame>
    );
  }

  if (step === "requirements" && confirmation) {
    return (
      <CustomerPageFrame>
        <ConfirmationSuccess
          customerName={order.customerName}
          refCode={refCode}
        />
      </CustomerPageFrame>
    );
  }

  return (
    <CustomerPageFrame>
      {step === "requirements" ? (
        <RequirementReview
          customerName={order.customerName}
          refCode={refCode}
          requirements={requirements}
          confirmationName={confirmationName}
          onNameChange={setConfirmationName}
          onConfirm={handleConfirm}
        />
      ) : (
        <CustomerAccessCard
          step={step}
          refCode={refCode}
          phone={phone}
          phoneError={phoneError}
          phoneIsValid={phoneIsValid}
          otp={otp}
          maskedPhone={maskPhoneNumber(phone)}
          onPhoneChange={(value) => {
            setPhone(value);
            setPhoneError(undefined);
          }}
          onPhoneValidityChange={setPhoneIsValid}
          onPhoneSubmit={handlePhoneSubmit}
          onOtpChange={(value) => {
            setOtp(value.replace(/\D/g, "").slice(0, OTP_LENGTH));
          }}
          onOtpSubmit={handleOtpSubmit}
          onBack={() => {
            setOtp("");
            setStep("phone");
          }}
        />
      )}
    </CustomerPageFrame>
  );
}

function ConfirmationSuccess({
  customerName,
  refCode,
}: {
  customerName: string;
  refCode: string;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-lg flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
        <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Requirements confirmed
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Thank you, {customerName}. The requirements for order #{refCode} have
          been confirmed.
        </p>
      </div>
    </div>
  );
}
