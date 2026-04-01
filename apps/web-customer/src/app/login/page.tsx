"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { Suspense } from "react";

import { useT } from "@/lib/i18n/language-context";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="border-b border-border/50 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Scissors className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-bold">
            BarberPro<span className="text-primary">.my</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">{t.auth.loginTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.auth.loginDesc}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {t.auth.forgotPassword}
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              {t.auth.signUpFreeLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
