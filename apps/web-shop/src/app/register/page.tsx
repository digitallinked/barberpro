"use client";

import {
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { checkSlugAvailability, saveOnboarding, signUp, verifyOtp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = "account" | "verify" | "onboarding" | "payment";
type Plan = "starter" | "professional";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account", icon: <Mail className="h-4 w-4" /> },
  { id: "verify", label: "Verify", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "onboarding", label: "Shop", icon: <Building2 className="h-4 w-4" /> },
  { id: "payment", label: "Plan", icon: <Star className="h-4 w-4" /> }
];

const STEP_ORDER: Step[] = ["account", "verify", "onboarding", "payment"];

type PasswordRule = { label: string; test: (p: string) => boolean };

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { label: "Number (0–9)", test: (p) => /[0-9]/.test(p) },
  { label: "Symbol (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) }
];

function PasswordRequirements({ password }: { password: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strength = passed <= 1 ? "weak" : passed <= 3 ? "fair" : passed === 4 ? "good" : "strong";
  const barColors = {
    weak: ["bg-red-500", "bg-border", "bg-border", "bg-border"],
    fair: ["bg-amber-500", "bg-amber-500", "bg-border", "bg-border"],
    good: ["bg-yellow-400", "bg-yellow-400", "bg-yellow-400", "bg-border"],
    strong: ["bg-green-500", "bg-green-500", "bg-green-500", "bg-green-500"]
  }[strength];
  const strengthLabel = { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong" }[strength];
  const strengthColor = {
    weak: "text-red-400",
    fair: "text-amber-400",
    good: "text-yellow-400",
    strong: "text-green-400"
  }[strength];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {barColors.map((color, i) => (
            <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", color)} />
          ))}
        </div>
        <span className={cn("text-xs font-medium", strengthColor)}>{strengthLabel}</span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-1 gap-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <div key={rule.label} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                  ok ? "bg-green-500" : "bg-muted"
                )}
              >
                {ok && <Check className="h-2 w-2 text-white" />}
              </div>
              <span className={cn("text-xs transition-colors", ok ? "text-foreground" : "text-muted-foreground")}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep = (searchParams.get("step") as Step) ?? "account";
  const [step, setStep] = useState<Step>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account form
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false
  });

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Onboarding
  const [shopForm, setShopForm] = useState({
    shopName: "",
    slug: "",
    phone: "",
    addressLine1: "",
    city: "",
    postcode: "",
    state: ""
  });
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<Plan>("starter");

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // Debounced slug availability check
  const triggerSlugCheck = (slug: string) => {
    if (slugTimerRef.current) clearTimeout(slugTimerRef.current);
    if (!slug || slug.length < 3) {
      setSlugStatus("idle");
      setSlugError(null);
      return;
    }
    setSlugStatus("checking");
    setSlugError(null);
    slugTimerRef.current = setTimeout(async () => {
      const result = await checkSlugAvailability(slug);
      if (result.available) {
        setSlugStatus("available");
        setSlugError(null);
      } else {
        setSlugStatus(result.error === "This URL is already taken" ? "taken" : "error");
        setSlugError(result.error ?? null);
      }
    }, 500);
  };

  // Auto-generate slug from shop name
  const handleShopNameChange = (name: string) => {
    const newSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setShopForm((f) => ({ ...f, shopName: name, slug: newSlug }));
    triggerSlugCheck(newSlug);
  };

  const handleSlugChange = (raw: string) => {
    const newSlug = raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    setShopForm((f) => ({ ...f, slug: newSlug }));
    triggerSlugCheck(newSlug);
  };

  // OTP input handling
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Step 1: Account creation
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (accountForm.password !== accountForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (accountForm.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!accountForm.acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    const result = await signUp({
      email: accountForm.email,
      password: accountForm.password,
      fullName: accountForm.fullName,
      acceptedTerms: accountForm.acceptedTerms
    });
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setResendCooldown(60);
    setStep("verify");
  };

  // Step 2: OTP verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = otp.join("");
    if (token.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(accountForm.email, token);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStep("onboarding");
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setIsLoading(true);
    const result = await signUp({
      email: accountForm.email,
      password: accountForm.password,
      fullName: accountForm.fullName,
      acceptedTerms: accountForm.acceptedTerms
    });
    setIsLoading(false);
    if (!result.error) {
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    }
  };

  // Step 3: Shop onboarding
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shopForm.shopName.trim()) {
      setError("Shop name is required");
      return;
    }

    if (slugStatus === "taken" || slugStatus === "error") {
      setError(slugError ?? "Please choose a different shop URL");
      return;
    }

    if (slugStatus === "checking") {
      setError("Please wait — checking URL availability");
      return;
    }

    // Final server-side check before saving (handles race conditions)
    const slugCheck = await checkSlugAvailability(shopForm.slug);
    if (!slugCheck.available) {
      setSlugStatus("taken");
      setSlugError(slugCheck.error ?? "This URL is already taken");
      setError(slugCheck.error ?? "This URL is already taken");
      return;
    }

    setIsLoading(true);
    const result = await saveOnboarding({
      shopName: shopForm.shopName,
      slug: shopForm.slug,
      phone: shopForm.phone,
      addressLine1: shopForm.addressLine1,
      city: shopForm.city,
      postcode: shopForm.postcode,
      state: shopForm.state,
      plan: "starter" // plan is finalised in step 4
    });
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStep("payment");
  };

  // Step 4: Start free trial — send to setup wizard before dashboard
  const handleStartTrial = () => {
    router.push("/onboarding");
  };

  const currentStepIndex = STEP_ORDER.indexOf(step);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Start your free trial</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              14 days free — no charge until your trial ends
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  i < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : i === currentStepIndex
                      ? "bg-primary/20 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "ml-1.5 mr-3 text-xs font-medium",
                  i <= currentStepIndex ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="mr-3 h-3.5 w-3.5 text-border" />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === "account" && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Create your account</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter your details to get started
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="Ahmad bin Razak"
                  required
                  value={accountForm.fullName}
                  onChange={(e) =>
                    setAccountForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@barbershop.com"
                  autoComplete="email"
                  required
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={accountForm.password}
                    onChange={(e) =>
                      setAccountForm((f) => ({ ...f, password: e.target.value }))
                    }
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

                {/* Password requirements — shown once the user starts typing */}
                {accountForm.password.length > 0 && (
                  <PasswordRequirements password={accountForm.password} />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                    value={accountForm.confirmPassword}
                    onChange={(e) =>
                      setAccountForm((f) => ({ ...f, confirmPassword: e.target.value }))
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

              {/* Terms acceptance */}
              <label className="flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={accountForm.acceptedTerms}
                    onChange={(e) =>
                      setAccountForm((f) => ({ ...f, acceptedTerms: e.target.checked }))
                    }
                  />
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                      accountForm.acceptedTerms
                        ? "border-primary bg-primary"
                        : "border-border bg-muted"
                    )}
                  >
                    {accountForm.acceptedTerms && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . I understand I will need to subscribe after my 14-day free trial.
                </span>
              </label>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{accountForm.email}</span>
                </p>
              </div>

              {/* OTP input */}
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      "h-12 w-11 rounded-lg border text-center text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                      digit
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-foreground"
                    )}
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.join("").length < 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify email"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive a code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Shop details */}
          {step === "onboarding" && (
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Set up your shop</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell us about your barber shop
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shopName">Shop name</Label>
                <Input
                  id="shopName"
                  placeholder="Ahmad's Barber Studio"
                  required
                  value={shopForm.shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug">Shop URL</Label>
                  {slugStatus === "checking" && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                      <Check className="h-3 w-3" /> Available
                    </span>
                  )}
                  {(slugStatus === "taken" || slugStatus === "error") && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                      <span className="h-3 w-3 text-center font-bold leading-3">✕</span> {slugError}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-md border border-r-0 border-border bg-background px-3 text-xs text-muted-foreground">
                    barberpro.my/
                  </span>
                  <Input
                    id="slug"
                    placeholder="ahmads-barber"
                    required
                    value={shopForm.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={cn(
                      "rounded-l-none",
                      slugStatus === "available" && "border-green-500/50 focus-visible:ring-green-500",
                      (slugStatus === "taken" || slugStatus === "error") && "border-red-500/50 focus-visible:ring-red-500"
                    )}
                    pattern="[a-z0-9-]+"
                    minLength={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens. Min. 3 characters.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60 12-345 6789"
                  value={shopForm.phone}
                  onChange={(e) => setShopForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="addressLine1">Street address</Label>
                <Input
                  id="addressLine1"
                  placeholder="No. 23, Jalan Masjid India"
                  value={shopForm.addressLine1}
                  onChange={(e) => setShopForm((f) => ({ ...f, addressLine1: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input
                    id="postcode"
                    placeholder="50100"
                    maxLength={5}
                    inputMode="numeric"
                    value={shopForm.postcode}
                    onChange={(e) =>
                      setShopForm((f) => ({ ...f, postcode: e.target.value.replace(/\D/g, "") }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Kuala Lumpur"
                    value={shopForm.city}
                    onChange={(e) => setShopForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={shopForm.state}
                  onChange={(e) => setShopForm((f) => ({ ...f, state: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="" disabled>Select state…</option>
                  <optgroup label="States">
                    {[
                      "Johor", "Kedah", "Kelantan", "Melaka",
                      "Negeri Sembilan", "Pahang", "Perak", "Perlis",
                      "Pulau Pinang", "Sabah", "Sarawak", "Selangor", "Terengganu"
                    ].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Federal Territories">
                    {["W.P. Kuala Lumpur", "W.P. Labuan", "W.P. Putrajaya"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          )}

          {/* Step 4: Trial started — no card required */}
          {step === "payment" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/30">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Your 14-day trial is ready!</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  No credit card required. Full access, completely free.
                </p>
              </div>

              {/* Trial benefits */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                {[
                  { icon: <Zap className="h-4 w-4 text-primary" />, text: "Full access to all features for 14 days" },
                  { icon: <Check className="h-4 w-4 text-primary" />, text: "No credit card required to start" },
                  { icon: <Check className="h-4 w-4 text-primary" />, text: "Cancel anytime — no obligation" },
                  { icon: <Check className="h-4 w-4 text-primary" />, text: "We'll remind you before your trial ends" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      {item.icon}
                    </div>
                    <span className="text-sm text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Plan selection (for when trial ends — user can choose before or later) */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan after trial — choose now or later
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      {
                        id: "starter" as const,
                        name: "Starter",
                        price: "RM 99",
                        desc: "1 branch, up to 5 staff",
                        features: ["Queue & POS", "Appointments & CRM", "Basic payroll & reports"],
                        popular: false
                      },
                      {
                        id: "professional" as const,
                        name: "Professional",
                        price: "RM 249",
                        desc: "Unlimited branches & staff",
                        features: ["Everything in Starter", "Advanced analytics", "Priority support"],
                        popular: true
                      }
                    ]
                  ).map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={cn(
                        "relative rounded-lg border p-3.5 text-left transition-all",
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted hover:border-border/80"
                      )}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          Popular
                        </span>
                      )}
                      {selectedPlan === plan.id && (
                        <Check className="absolute right-2 top-2.5 h-3.5 w-3.5 text-primary" />
                      )}
                      <div className="text-sm font-semibold">{plan.name}</div>
                      <div className="mt-0.5 text-xl font-bold text-primary">{plan.price}</div>
                      <div className="text-xs text-muted-foreground">{plan.desc}/mo</div>
                      <ul className="mt-2.5 space-y-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                            <span className="text-[11px] leading-tight text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  You can change your plan anytime from your billing settings.
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleStartTrial}
              >
                <Zap className="mr-2 h-4 w-4" />
                Start my free trial
              </Button>
            </div>
          )}
        </div>

        {step === "account" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
