"use client";

import { Eye, EyeOff, Loader2, Scissors, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(form.password);
      if (result?.error) {
        setError(result.error);
      }
    } catch {
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password for your account
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters with a mix of letters and numbers.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
