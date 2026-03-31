"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(
    searchParams.get("error") === "unauthorized"
      ? "You do not have super admin access."
      : ""
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="admin@barberpro.my"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
