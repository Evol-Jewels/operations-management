import type { Metadata } from "next";
import { CustomerRequirementConfirmation } from "@/components/customer-order-confirmation/CustomerRequirementConfirmation";

export const metadata: Metadata = {
  title: "Confirm your order requirements | EVOL Jewels",
  description:
    "Privately review and confirm the requirements for your EVOL Jewels order.",
};

export default function CustomerOrderConfirmationPage() {
  return <CustomerRequirementConfirmation />;
}
