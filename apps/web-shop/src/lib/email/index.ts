import { Resend } from "resend";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resendInstance) {
    resendInstance = new Resend(env.RESEND_API_KEY);
  }
  return resendInstance;
}

export function hasEmailEnv(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
  if (!hasEmailEnv()) {
    logger.warn("Email not sent: RESEND_API_KEY not configured", { action: "sendEmail", subject });
    return false;
  }

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL!,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      logger.error("Failed to send email", error, { action: "sendEmail", subject });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Email send exception", error, { action: "sendEmail", subject });
    return false;
  }
}
