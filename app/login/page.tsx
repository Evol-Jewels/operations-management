"use client";

import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Step = "email" | "otp";

function getRedirectTarget(raw: string | null) {
  const value = raw?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function toAbsoluteCallbackURL(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectTarget(searchParams.get("next"));
  const { data: session, isPending } = authClient.useSession();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  useEffect(() => {
    if (isPending || !session) return;
    router.replace(redirectTo);
  }, [isPending, redirectTo, router, session]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setEmailPending(true);
    setError(null);

    const result = await authClient.emailOtp.sendVerificationOtp({
      email: normalizedEmail,
      type: "sign-in",
    });

    setEmailPending(false);

    if (result.error) {
      setError(result.error.message || "Failed to send OTP");
      return;
    }

    setEmail(normalizedEmail);
    setStep("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;

    setOtpPending(true);
    setError(null);

    const result = await authClient.signIn.emailOtp({
      email,
      otp: otp.trim(),
    });

    setOtpPending(false);

    if (result.error) {
      setError(result.error.message || "Invalid OTP");
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGooglePending(true);
    setError(null);

    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: toAbsoluteCallbackURL(redirectTo),
    });

    if (result.error) {
      setGooglePending(false);
      setError(result.error.message || "Google sign-in failed");
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md items-center">
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            EVOL Jewels
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Use email OTP or Google. Internal users can access the operations
            dashboard after sign-in.
          </p>
        </div>

        <div className="space-y-4">
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={emailPending}
              >
                {emailPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                OTP sent to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit code"
                  className="h-10"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={otpPending}
              >
                {otpPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify and continue
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOtp("");
                  setError(null);
                  setStep("email");
                }}
              >
                Use a different email
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={googlePending}
          >
            {googlePending && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Continue with Google
          </Button>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
