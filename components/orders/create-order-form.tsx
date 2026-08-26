"use client";

import { ConvertOrderForm } from "./convert-order-form";

export function CreateOrderForm({
  refillProductCode,
}: {
  refillProductCode?: string;
}) {
  return (
    <ConvertOrderForm mode="create" refillProductCode={refillProductCode} />
  );
}
