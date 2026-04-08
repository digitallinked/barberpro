import { parseEnv } from "@barberpro/env";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional().default("BarberPro <noreply@barberpro.my>"),
  CRON_SECRET: z.string().min(1).optional(),
});

export const env = parseEnv(envSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID,
  NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  CRON_SECRET: process.env.CRON_SECRET,
});

export function hasSupabaseEnv() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasStripeEnv() {
  return Boolean(env.STRIPE_SECRET_KEY);
}
