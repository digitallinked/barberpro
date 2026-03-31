import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-xl border border-border/70 bg-card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your BarberPro super admin account.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
