const BRAND_COLOR = "#1a1a2e";
const BRAND_NAME = "BarberPro";

function wrapHtml(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: ${BRAND_COLOR}; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${BRAND_NAME}</h1>
      </td>
    </tr>
    <tr>
      <td style="background-color: #ffffff; padding: 32px 24px; border-radius: 0 0 12px 12px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function bookingConfirmationEmail(params: {
  customerName: string;
  shopName: string;
  serviceName: string;
  dateTime: string;
  barberName?: string;
}): { subject: string; html: string } {
  const barberLine = params.barberName
    ? `<p style="margin: 8px 0; color: #334155;"><strong>Barber:</strong> ${params.barberName}</p>`
    : "";

  return {
    subject: `Booking Confirmed at ${params.shopName}`,
    html: wrapHtml(`
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">Booking Confirmed!</h2>
      <p style="color: #334155;">Hi ${params.customerName},</p>
      <p style="color: #334155;">Your appointment has been confirmed.</p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 8px 0; color: #334155;"><strong>Shop:</strong> ${params.shopName}</p>
        <p style="margin: 8px 0; color: #334155;"><strong>Service:</strong> ${params.serviceName}</p>
        ${barberLine}
        <p style="margin: 8px 0; color: #334155;"><strong>Date & Time:</strong> ${params.dateTime}</p>
      </div>
      <p style="color: #64748b; font-size: 14px;">If you need to cancel, please contact the shop directly.</p>
    `),
  };
}

export function paymentFailedEmail(params: {
  ownerName: string;
  shopName: string;
  retryUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Failed — ${params.shopName}`,
    html: wrapHtml(`
      <h2 style="color: #dc2626; margin-top: 0;">Payment Failed</h2>
      <p style="color: #334155;">Hi ${params.ownerName},</p>
      <p style="color: #334155;">We were unable to process your subscription payment for <strong>${params.shopName}</strong>.</p>
      <p style="color: #334155;">Please update your payment method to avoid service interruption.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.retryUrl}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Update Payment Method
        </a>
      </div>
    `),
  };
}

export function staffInviteEmail(params: {
  staffName: string;
  shopName: string;
  inviterName: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${params.shopName} on BarberPro`,
    html: wrapHtml(`
      <h2 style="color: ${BRAND_COLOR}; margin-top: 0;">You're Invited!</h2>
      <p style="color: #334155;">Hi ${params.staffName},</p>
      <p style="color: #334155;"><strong>${params.inviterName}</strong> has invited you to join <strong>${params.shopName}</strong> on BarberPro.</p>
      <p style="color: #334155;">Click below to log in and get started:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.loginUrl}" style="background-color: ${BRAND_COLOR}; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Log In to BarberPro
        </a>
      </div>
    `),
  };
}
