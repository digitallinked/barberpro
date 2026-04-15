"use client";

import {
  Building2,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  Loader2,
  Phone,
  Scissors,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  completeSetupWizard,
  createFirstService,
  getSetupWizardStatus,
  saveOperatingHours,
  saveOwnerDetails,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translations } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "owner" | "business" | "workflow" | "hours" | "service";
type BranchCount = "1" | "2-3" | "4+";
type StaffCount = "1-5" | "6-10" | "11+";
type Workflow = "queue" | "appointments" | "pos" | "all";

const STEPS: Step[] = ["owner", "business", "workflow", "hours", "service"];

const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DAY_LABELS = {
  ms: ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkipLink({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="pt-1 text-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );
}

function SelectCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition-all",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground hover:border-border/80 hover:bg-muted/80",
        className
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2">
          <Check className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("owner");

  // Language — drives all UI strings; defaults to BM (Malaysia-first)
  const [lang, setLang] = useState<"ms" | "en">("ms");
  const t = translations[lang].onboarding;

  // Step 1: owner details
  const [phone, setPhone] = useState("");

  // Step 2: business size
  const [branchCount, setBranchCount] = useState<BranchCount>("1");
  const [staffCount, setStaffCount] = useState<StaffCount>("1-5");

  // Step 3: primary workflow
  const [workflow, setWorkflow] = useState<Workflow>("all");

  // Step 4: operating hours
  const [openDays, setOpenDays] = useState<string[]>([
    "mon", "tue", "wed", "thu", "fri", "sat",
  ]);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("20:00");

  // Step 5: first service
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");

  // ── Initialization: check auth + wizard status ────────────────────
  useEffect(() => {
    async function init() {
      const result = await getSetupWizardStatus();
      if (result.completed) {
        router.replace("/dashboard");
        return;
      }
      setIsInitializing(false);
    }
    init();
  }, [router]);

  // ── Helpers ───────────────────────────────────────────────────────

  const skipWizard = async () => {
    setIsLoading(true);
    await completeSetupWizard();
    router.push("/dashboard");
  };

  const toggleDay = (day: string) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ── Step handlers ─────────────────────────────────────────────────

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await saveOwnerDetails({ phone, language: lang });
    setIsLoading(false);
    setCurrentStep("business");
  };

  const handleHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (openDays.length > 0) {
      await saveOperatingHours({ days: openDays, openTime, closeTime });
    }
    setIsLoading(false);
    setCurrentStep("service");
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const price = parseFloat(servicePrice);
    if (serviceName.trim() && price > 0) {
      await createFirstService({
        name: serviceName.trim(),
        price,
        duration_min: parseInt(serviceDuration) || 30,
      });
    }
    await completeSetupWizard();
    setIsLoading(false);
    setIsDone(true);
  };

  // ── Loading / initializing ────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────────

  if (isDone) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 animate-in zoom-in-50 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/20 duration-500">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t.doneTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.doneDesc}</p>
          <Button
            className="mt-8 w-full"
            size="lg"
            onClick={() => router.push("/dashboard")}
          >
            {t.goToDashboard}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────

  const stepIndex = STEPS.indexOf(currentStep);

  const STEP_LABELS = [t.step1, t.step2, t.step3, t.step4, t.step5];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b border-white/5 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Scissors className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-white">
            BarberPro<span className="text-primary">.my</span>
          </span>
        </div>

        <button
          type="button"
          onClick={skipWizard}
          disabled={isLoading}
          className="text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        >
          {t.skipWizard} →
        </button>
      </header>

      {/* ── Content ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* ── Step indicator ── */}
          <div className="mb-8 flex items-center justify-center">
            {STEPS.map((s, i) => {
              const isCompleted = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/20 text-primary ring-2 ring-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "hidden text-[10px] font-medium sm:block",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {STEP_LABELS[i]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 mb-4 h-0.5 w-8 rounded-full transition-colors sm:w-12",
                        i < stepIndex ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Card ── */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xl shadow-black/20">

            {/* ── Step 1: Owner details ── */}
            {currentStep === "owner" && (
              <form onSubmit={handleOwnerSubmit} className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t.ownerTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.ownerDesc}</p>
                  </div>
                </div>

                {/* Language selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    {t.language}
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(["ms", "en"] as const).map((l) => (
                      <SelectCard
                        key={l}
                        selected={lang === l}
                        onClick={() => setLang(l)}
                      >
                        <span className="text-2xl leading-none">
                          {l === "ms" ? "🇲🇾" : "🇬🇧"}
                        </span>
                        <span>{l === "ms" ? "Bahasa Malaysia" : "English"}</span>
                      </SelectCard>
                    ))}
                  </div>
                </div>

                {/* Phone number */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {t.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.continue}
                </Button>
                <SkipLink onClick={skipWizard} label={t.skipWizard} disabled={isLoading} />
              </form>
            )}

            {/* ── Step 2: Business size ── */}
            {currentStep === "business" && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t.businessTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.businessDesc}</p>
                  </div>
                </div>

                {/* Branch count */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.howManyBranches}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "1" as BranchCount, label: t.oneBranch },
                        { v: "2-3" as BranchCount, label: t.twoToThreeBranches },
                        { v: "4+" as BranchCount, label: t.fourPlusBranches },
                      ] as const
                    ).map(({ v, label }) => (
                      <SelectCard
                        key={v}
                        selected={branchCount === v}
                        onClick={() => setBranchCount(v)}
                        className="py-3 text-xs"
                      >
                        {label}
                      </SelectCard>
                    ))}
                  </div>
                </div>

                {/* Staff count */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.howManyStaff}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { v: "1-5" as StaffCount, label: t.oneToFiveStaff },
                        { v: "6-10" as StaffCount, label: t.sixToTenStaff },
                        { v: "11+" as StaffCount, label: t.elevenPlusStaff },
                      ] as const
                    ).map(({ v, label }) => (
                      <SelectCard
                        key={v}
                        selected={staffCount === v}
                        onClick={() => setStaffCount(v)}
                        className="py-3 text-xs"
                      >
                        {label}
                      </SelectCard>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setCurrentStep("workflow")}
                  disabled={isLoading}
                >
                  {t.continue}
                </Button>
                <SkipLink onClick={skipWizard} label={t.skipWizard} disabled={isLoading} />
              </div>
            )}

            {/* ── Step 3: Primary workflow ── */}
            {currentStep === "workflow" && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t.workflowTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.workflowDesc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: "queue" as Workflow, icon: Users, label: t.queue },
                      { id: "appointments" as Workflow, icon: CalendarCheck2, label: t.appointments },
                      { id: "pos" as Workflow, icon: CreditCard, label: t.pos },
                      { id: "all" as Workflow, icon: Zap, label: t.all },
                    ] as const
                  ).map(({ id, icon: Icon, label }) => (
                    <SelectCard
                      key={id}
                      selected={workflow === id}
                      onClick={() => setWorkflow(id)}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6",
                          workflow === id ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-center text-xs leading-tight">{label}</span>
                    </SelectCard>
                  ))}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setCurrentStep("hours")}
                  disabled={isLoading}
                >
                  {t.continue}
                </Button>
                <SkipLink onClick={skipWizard} label={t.skipWizard} disabled={isLoading} />
              </div>
            )}

            {/* ── Step 4: Operating hours ── */}
            {currentStep === "hours" && (
              <form onSubmit={handleHoursSubmit} className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t.hoursTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.hoursDesc}</p>
                  </div>
                </div>

                {/* Day toggles */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {lang === "ms" ? "Hari buka" : "Open days"}
                  </Label>
                  <div className="flex gap-1.5">
                    {WEEK_DAYS.map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "flex-1 rounded-lg border py-2.5 text-[10px] font-semibold uppercase tracking-wide transition-all",
                          openDays.includes(day)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {lang === "ms" ? DAY_LABELS.ms[i] : DAY_LABELS.en[i]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="openTime">{t.opensAt}</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="closeTime">{t.closesAt}</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.continue}
                </Button>
                <SkipLink onClick={skipWizard} label={t.skipWizard} disabled={isLoading} />
              </form>
            )}

            {/* ── Step 5: First service ── */}
            {currentStep === "service" && (
              <form onSubmit={handleServiceSubmit} className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{t.serviceTitle}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t.serviceDesc}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="serviceName">{t.serviceName}</Label>
                  <Input
                    id="serviceName"
                    placeholder={t.serviceNamePlaceholder}
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="servicePrice">{t.servicePrice} (RM)</Label>
                    <Input
                      id="servicePrice"
                      type="number"
                      min="0"
                      step="0.50"
                      placeholder="25.00"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="serviceDuration">{t.serviceDuration}</Label>
                    <Input
                      id="serviceDuration"
                      type="number"
                      min="5"
                      step="5"
                      placeholder="30"
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(e.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.continue}
                </Button>
                <SkipLink onClick={skipWizard} label={t.skipWizard} disabled={isLoading} />
              </form>
            )}
          </div>

          {/* Step counter */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {lang === "ms"
              ? `Langkah ${stepIndex + 1} daripada ${STEPS.length}`
              : `Step ${stepIndex + 1} of ${STEPS.length}`}
          </p>
        </div>
      </div>
    </main>
  );
}
