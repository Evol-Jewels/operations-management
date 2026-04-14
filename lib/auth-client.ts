"use client";

import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";

const baseURL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL?.trim() ||
  "http://localhost:3001/api/v1/auth";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
          defaultValue: "customer",
          input: false,
        },
      },
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
