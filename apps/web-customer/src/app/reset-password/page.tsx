import Link from "next/link";
import { Scissors } from "lucide-react";
import { ResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
            <h1 className="text-2xl font-bold">Set new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a strong password for your account.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <ResetForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
