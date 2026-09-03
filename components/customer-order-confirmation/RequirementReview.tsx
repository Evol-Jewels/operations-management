"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { RequirementMediaPanel } from "@/components/enquiry/requirements/RequirementMediaPanel";
import type { RequirementDisplayItem } from "@/components/enquiry/requirements/requirement-display-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
import { CustomerRequirementDetails } from "./CustomerRequirementDetails";
import { customerNamesMatch } from "./customer-confirmation-utils";

interface RequirementReviewProps {
  customerName: string;
  refCode: string;
  requirements: RequirementDisplayItem[];
  confirmationName: string;
  onNameChange: (value: string) => void;
  onConfirm: () => void;
}

export function RequirementReview(props: RequirementReviewProps) {
  return (
    <div className="py-4 sm:py-6">
      <header className="border-b border-border pb-4">
        <p className="font-mono text-xs text-muted-foreground">
          Order #{props.refCode}
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Review order requirements
        </h1>
      </header>

      <section className="mt-4 space-y-3" aria-label="Order requirements">
        {props.requirements.length > 0 ? (
          props.requirements.map((item, index) => (
            <RequirementCard
              key={item.id}
              item={item}
              index={index}
              total={props.requirements.length}
            />
          ))
        ) : (
          <EmptyRequirements />
        )}
      </section>

      <div className="mt-5">
        <ConfirmationForm {...props} />
      </div>
    </div>
  );
}

function RequirementCard({
  item,
  index,
  total,
}: {
  item: RequirementDisplayItem;
  index: number;
  total: number;
}) {
  const hasMedia =
    item.images.length > 0 || item.videos.length > 0 || item.audios.length > 0;

  return (
    <Card className="overflow-hidden">
      {total > 1 ? (
        <CardHeader className="border-b border-border px-4 py-3 sm:px-5">
          <CardTitle className="text-sm font-medium">
            Requirement {index + 1}
          </CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-5 p-4 sm:p-5">
        {hasMedia ? (
          <div className="mx-auto w-full max-w-md">
            <RequirementMediaPanel
              item={item}
              settings={DEFAULT_CALCULATOR_SETTINGS}
              isFinalized
              onSaveEstimation={() => undefined}
            />
          </div>
        ) : null}
        <CustomerRequirementDetails item={item} />
      </CardContent>
    </Card>
  );
}

function ConfirmationForm(props: RequirementReviewProps) {
  const [open, setOpen] = useState(false);
  const canConfirm =
    customerNamesMatch(props.confirmationName, props.customerName) &&
    props.requirements.length > 0;

  return (
    <>
      <div className="flex justify-center py-2">
        <Button type="button" onClick={() => setOpen(true)}>
          Confirm requirements
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader className="border-b border-border p-5 text-left">
            <DialogTitle>Confirm requirements</DialogTitle>
            <DialogDescription id="confirmation-instruction">
              Type in{" "}
              <strong className="font-semibold text-foreground">
                {props.customerName}
              </strong>{" "}
              to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5">
            <Label htmlFor="customer-confirmation-name" className="sr-only">
              Customer name
            </Label>
            <Input
              id="customer-confirmation-name"
              value={props.confirmationName}
              onChange={(event) => props.onNameChange(event.target.value)}
              autoComplete="name"
              placeholder={props.customerName}
              aria-describedby="confirmation-instruction"
              className="h-11"
            />
          </div>

          <DialogFooter className="flex-row justify-between border-t border-border p-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                props.onConfirm();
                setOpen(false);
              }}
              disabled={!canConfirm}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyRequirements() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-8 text-center">
        <FileText className="mx-auto size-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No customer-facing requirements were recorded for this order.
        </p>
      </CardContent>
    </Card>
  );
}
