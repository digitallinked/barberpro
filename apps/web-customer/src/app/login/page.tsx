import Link from "next/link";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold">BarberPro</Link>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-foreground hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
