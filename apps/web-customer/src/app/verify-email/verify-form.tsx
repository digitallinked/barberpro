"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, Mail } from "lucide-react";

import { verifyOtpAction, resendOtpAction } from "./actions";

interface VerifyFormProps {
  email: string;
}

export function VerifyForm({ email }: VerifyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((char, i) => {
      if (i < 6) next[i] = char;
    });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const token = digits.join("");
    if (token.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    startTransition(async () => {
      const result = await verifyOtpAction(email, token);
      if (!result.success) {
        setError(result.error);
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
      router.push("/profile");
      router.refresh();
    });
  }

  function handleResend() {
    setError("");
    startTransition(async () => {
      const result = await resendOtpAction(email);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setResendCooldown(60);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-10 rounded-lg border border-border bg-muted text-center text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending || digits.join("").length < 6}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Verifying…" : "Verify Email"}
      </button>

      <div className="text-center text-sm text-muted-foreground">
        {"Didn't receive the code? "}
        {resendCooldown > 0 ? (
          <span>Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 p-3 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>
          Code sent to <span className="font-medium text-foreground">{email}</span>
        </span>
      </div>
    </form>
  );
}
