import { logger } from "@/lib/logger";

export type NotificationChannel = "sms" | "whatsapp";

type SendNotificationOptions = {
  to: string;
  message: string;
  channel: NotificationChannel;
};

// SMS via gateway (Vonage/Nexmo or local Malaysian provider)
async function sendSms(to: string, message: string): Promise<boolean> {
  const apiKey = process.env.SMS_API_KEY;
  const apiSecret = process.env.SMS_API_SECRET;
  const from = process.env.SMS_FROM ?? "BarberPro";

  if (!apiKey || !apiSecret) {
    logger.warn("SMS not sent: SMS gateway not configured", { action: "sendSms" });
    return false;
  }

  try {
    const response = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
        from,
        to,
        text: message,
      }),
    });

    if (!response.ok) {
      logger.error("SMS send failed", new Error(`Status ${response.status}`), { action: "sendSms" });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("SMS exception", error, { action: "sendSms" });
    return false;
  }
}

// WhatsApp via Business API (Meta Cloud API or third-party BSP)
async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    logger.warn("WhatsApp not sent: WhatsApp API not configured", { action: "sendWhatsApp" });
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      logger.error("WhatsApp send failed", new Error(`Status ${response.status}`), { action: "sendWhatsApp" });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("WhatsApp exception", error, { action: "sendWhatsApp" });
    return false;
  }
}

export async function sendNotification({ to, message, channel }: SendNotificationOptions): Promise<boolean> {
  switch (channel) {
    case "sms":
      return sendSms(to, message);
    case "whatsapp":
      return sendWhatsApp(to, message);
    default:
      return false;
  }
}

export function hasNotificationChannel(channel: NotificationChannel): boolean {
  if (channel === "sms") return Boolean(process.env.SMS_API_KEY);
  if (channel === "whatsapp") return Boolean(process.env.WHATSAPP_API_TOKEN);
  return false;
}
