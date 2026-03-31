import Link from "next/link";

import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold">BarberPro</Link>
          <p className="mt-2 text-muted-foreground">Create your account</p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
