import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Lock,
  Scissors,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";

import { StylesAiTool } from "./styles-ai-tool";

async function getSubscriptionStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isPlus: false };

  const { data: row } = await (supabase as any)
    .from("customer_accounts")
    .select("subscription_status")
    .eq("auth_user_id", user.id)
    .maybeSingle() as { data: { subscription_status: string | null } | null };

  const status = row?.subscription_status ?? null;
  const isPlus = status === "active" || status === "trialing";

  return { user, isPlus };
}

export default async function StylesPage() {
  const { user, isPlus } = await getSubscriptionStatus();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0c0f]">
      <Navbar />

      <main className="flex-1">
        {isPlus ? (
          /* ── Plus member: show the tool ── */
          <StylesAiTool />
        ) : (
          /* ── Non-Plus: paywall gate ── */
          <PlusGate isLoggedIn={!!user} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function PlusGate({ isLoggedIn }: { isLoggedIn: boolean }) {
  const perks = [
    "AI Haircut Styler | Upload your photo & try styles",
    "Save & share looks with your barber",
    "Access curated style inspiration boards",
    "Priority queue at all partner shops",
    "Exclusive member-only promotions",
    "Early access to new features",
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-1.5 text-sm font-semibold text-[#d4af37]">
          <Star className="h-3.5 w-3.5" />
          BarberPro Plus Exclusive
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          AI Haircut{" "}
          <span className="text-[#d4af37]">Styler</span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Upload your photo, explore hairstyles with AI, and save the look to
          show your barber exactly what you want.
        </p>
      </div>

      {/* Feature preview cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Camera,
            label: "Upload Photo",
            desc: "Take a selfie or pick from gallery",
          },
          {
            icon: Wand2,
            label: "AI Styling",
            desc: "Try dozens of cuts in seconds",
          },
          {
            icon: Scissors,
            label: "Show Barber",
            desc: "Share your chosen look instantly",
          },
        ].map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#161a1f] p-5"
          >
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0c0f]/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2">
                <Lock className="h-5 w-5 text-gray-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Plus only
                </span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af37]/10">
              <Icon className="h-5 w-5 text-[#d4af37]" strokeWidth={1.75} />
            </div>
            <p className="mt-3 font-semibold text-white">{label}</p>
            <p className="mt-1 text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Perks list + CTA card */}
      <div className="overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-[#d4af37]/10 via-[#161a1f] to-[#161a1f]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/20">
              <Sparkles className="h-5 w-5 text-[#d4af37]" />
            </div>
            <div>
              <p className="font-bold text-white">BarberPro Plus</p>
              <p className="text-sm text-[#d4af37]">RM 19 / month</p>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                <span className="text-sm text-gray-300">{perk}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isLoggedIn ? (
              <Link
                href="/subscription"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                Unlock with Plus — RM 19/mo
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup?next=/subscription"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
                >
                  <Sparkles className="h-4 w-4" />
                  Sign Up & Try Plus Free
                </Link>
                <Link
                  href="/login?next=/subscription"
                  className="flex items-center justify-center rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  Already a member? Log in
                </Link>
              </>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            Start with a free trial · Cancel anytime · No questions asked
          </p>
        </div>
      </div>
    </div>
  );
}
