import type { CreateOrderInput } from "@/types/order-api";

export async function createOrder(input: CreateOrderInput) {
  console.log("Create order payload", input);

  return {
    order: {
      id: `order-${Date.now()}`,
    },
  };
}
