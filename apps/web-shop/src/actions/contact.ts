"use server";

import { Resend } from "resend";
import { z } from "zod";

const ContactSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(100).optional(),
  message: z.string().trim().min(10).max(5000)
});

export type ContactFormState = {
  success: boolean;
  message: string;
} | null;

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    subject: formData.get("subject") ?? undefined,
    message: formData.get("message")
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Please fill in all required fields correctly." };
  }

  const { firstName, lastName, email, subject, message } = parsed.data;

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subjectLine = subject
    ? `[Contact Form] ${subject} — from ${firstName} ${lastName}`
    : `[Contact Form] Message from ${firstName} ${lastName}`;

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "BarberPro <noreply@barberpro.my>",
    to: "hello@barberpro.my",
    replyTo: email,
    subject: subjectLine,
    text: [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      subject ? `Subject: ${subject}` : "",
      "",
      message
    ]
      .filter(Boolean)
      .join("\n")
  });

  if (error) {
    console.error("[contact-form] Resend error:", error.message);
    return {
      success: false,
      message: "Something went wrong. Please try again or email us directly at hello@barberpro.my."
    };
  }

  return {
    success: true,
    message: "Message sent! We'll get back to you within one business day."
  };
}
