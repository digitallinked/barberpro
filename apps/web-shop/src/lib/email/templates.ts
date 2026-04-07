const BRAND_COLOR = "#1a1a2e";
const BRAND_ACCENT = "#6366f1";
const BRAND_NAME = "BarberPro";

// ─── Shared primitives ────────────────────────────────────────────────────────

function base(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${BRAND_NAME}</title>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR} 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;background:${BRAND_ACCENT};border-radius:8px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">✂</div>
                      <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${BRAND_NAME}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} ${BRAND_NAME} · Malaysia's barber shop management platform
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                You're receiving this because you have a ${BRAND_NAME} account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(text: string, bg: string, color = "#ffffff"): string {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;padding:4px 12px;border-radius:100px;">${text}</span>`;
}

function divider(): string {
  return `<div style="border-top:1px solid #e2e8f0;margin:28px 0;"></div>`;
}

function infoRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 16px;color:#64748b;font-size:14px;width:40%;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:10px 16px;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #f1f5f9;">${value}</td>
  </tr>`;
}

function infoTable(rows: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0;">
    <tbody>${rows}</tbody>
  </table>`;
}

function ctaButton(text: string, href: string, bg = BRAND_ACCENT): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
    <tr>
      <td align="center" style="background:${bg};border-radius:10px;box-shadow:0 4px 12px ${bg}55;">
        <a href="${href}" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.2px;text-decoration:none;padding:14px 36px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function alertBox(text: string, bg: string, border: string, icon: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1px solid ${border};border-radius:10px;margin:24px 0;">
    <tr>
      <td style="padding:16px 20px;font-size:14px;color:#0f172a;line-height:1.6;">
        <span style="font-size:18px;margin-right:8px;">${icon}</span>${text}
      </td>
    </tr>
  </table>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function bookingConfirmationEmail(params: {
  customerName: string;
  shopName: string;
  serviceName: string;
  dateTime: string;
  barberName?: string;
}): { subject: string; html: string } {
  const barberRow = params.barberName ? infoRow("Barber", params.barberName) : "";

  return {
    subject: `Booking confirmed at ${params.shopName} ✓`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:64px;">✓</div>
        ${badge("Booking Confirmed", "#16a34a")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">You're all set!</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.customerName}, your appointment is confirmed.</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Service", params.serviceName)}
        ${barberRow}
        ${infoRow("Date & Time", params.dateTime)}
      `)}
      <p style="color:#64748b;font-size:14px;text-align:center;margin:0;">Need to reschedule? Contact the shop directly.</p>
      `,
      `Your appointment at ${params.shopName} is confirmed.`
    ),
  };
}

export function subscriptionStartedEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  trialEndsAt?: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const isTrial = Boolean(params.trialEndsAt);
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);

  return {
    subject: `Welcome to BarberPro ${planLabel} — your shop is live 🎉`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">🎉</div>
        ${badge(isTrial ? "14-Day Free Trial" : "Subscription Active", isTrial ? "#7c3aed" : "#16a34a")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Welcome aboard, ${params.ownerName}!</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">
          ${isTrial
            ? `Your 14-day free trial for <strong>${params.shopName}</strong> has started.`
            : `<strong>${params.shopName}</strong> is now live on BarberPro ${planLabel}.`}
        </p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan", `BarberPro ${planLabel}`)}
        ${isTrial && params.trialEndsAt ? infoRow("Trial ends", params.trialEndsAt) : ""}
      `)}
      ${isTrial ? alertBox(
        `Your trial ends on <strong>${params.trialEndsAt}</strong>. After that, you'll be billed automatically. You can cancel anytime from your billing settings.`,
        "#faf5ff", "#ddd6fe", "ℹ️"
      ) : ""}
      ${ctaButton("Go to Your Dashboard", params.billingUrl)}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        Questions? Reply to this email — we're happy to help.
      </p>
      `,
      `Your BarberPro ${planLabel} subscription is now active.`
    ),
  };
}

export function subscriptionRenewedEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  amountPaid: string;
  nextBillingDate: string;
  invoiceUrl?: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);

  return {
    subject: `Payment received — BarberPro ${planLabel} renewed ✓`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">✓</div>
        ${badge("Payment Successful", "#16a34a")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Subscription renewed</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, thanks for staying with BarberPro!</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan", `BarberPro ${planLabel}`)}
        ${infoRow("Amount charged", params.amountPaid)}
        ${infoRow("Next billing date", params.nextBillingDate)}
      `)}
      ${params.invoiceUrl ? ctaButton("Download Invoice", params.invoiceUrl, "#1e40af") : ""}
      ${ctaButton("Manage Billing", params.billingUrl, BRAND_COLOR)}
      `,
      `Your BarberPro ${planLabel} subscription has been renewed successfully.`
    ),
  };
}

export function paymentFailedEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  amountDue: string;
  retryDate?: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);

  return {
    subject: `Action required: Payment failed for BarberPro ${planLabel}`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">✗</div>
        ${badge("Payment Failed", "#dc2626")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">We couldn't process your payment</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, please update your payment details to keep your shop running.</p>
      </div>
      ${alertBox(
        `Your subscription for <strong>${params.shopName}</strong> is at risk of being suspended. Update your payment method as soon as possible to avoid interruption.`,
        "#fff7ed", "#fed7aa", "⚠️"
      )}
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan", `BarberPro ${planLabel}`)}
        ${infoRow("Amount due", params.amountDue)}
        ${params.retryDate ? infoRow("Next retry", params.retryDate) : ""}
      `)}
      ${ctaButton("Update Payment Method", params.billingUrl, "#dc2626")}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        Stripe will automatically retry the charge. If the issue persists, contact us.
      </p>
      `,
      `Payment failed for your BarberPro subscription. Please update your payment method.`
    ),
  };
}

export function subscriptionCancelledEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  accessUntil: string;
  reactivateUrl: string;
}): { subject: string; html: string } {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);

  return {
    subject: `Your BarberPro subscription has been cancelled`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">😢</div>
        ${badge("Subscription Cancelled", "#64748b")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Sorry to see you go</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, your cancellation has been processed.</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan cancelled", `BarberPro ${planLabel}`)}
        ${infoRow("Access until", params.accessUntil)}
      `)}
      ${alertBox(
        `You'll retain full access to <strong>${params.shopName}</strong> until <strong>${params.accessUntil}</strong>. After that, your shop will be deactivated.`,
        "#f0f9ff", "#bae6fd", "ℹ️"
      )}
      ${ctaButton("Reactivate Subscription", params.reactivateUrl, BRAND_ACCENT)}
      ${divider()}
      <p style="color:#64748b;font-size:14px;text-align:center;margin:0;">
        Changed your mind? You can reactivate at any time before your access expires.
      </p>
      `,
      `Your BarberPro subscription has been cancelled. You have access until ${params.accessUntil}.`
    ),
  };
}

export function planChangedEmail(params: {
  ownerName: string;
  shopName: string;
  oldPlan: string;
  newPlan: string;
  newAmount: string;
  effectiveDate: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const oldLabel = params.oldPlan.charAt(0).toUpperCase() + params.oldPlan.slice(1);
  const newLabel = params.newPlan.charAt(0).toUpperCase() + params.newPlan.slice(1);
  const isUpgrade =
    ["professional", "enterprise"].includes(params.newPlan) &&
    params.newPlan !== params.oldPlan;

  return {
    subject: `Plan ${isUpgrade ? "upgraded" : "changed"} — BarberPro ${newLabel}`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">${isUpgrade ? "⬆️" : "🔄"}</div>
        ${badge(isUpgrade ? "Plan Upgraded" : "Plan Changed", isUpgrade ? "#16a34a" : "#7c3aed")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Your plan has been updated</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, here's a summary of your plan change.</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Previous plan", `BarberPro ${oldLabel}`)}
        ${infoRow("New plan", `BarberPro ${newLabel}`)}
        ${infoRow("New monthly rate", params.newAmount)}
        ${infoRow("Effective date", params.effectiveDate)}
      `)}
      ${ctaButton("View Billing Details", params.billingUrl, BRAND_ACCENT)}
      `,
      `Your BarberPro plan has been changed from ${oldLabel} to ${newLabel}.`
    ),
  };
}

export function trialEndingEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  trialEndsAt: string;
  daysLeft: number;
  billingUrl: string;
}): { subject: string; html: string } {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);
  const urgency = params.daysLeft <= 1 ? "#dc2626" : params.daysLeft <= 3 ? "#d97706" : "#7c3aed";

  return {
    subject: `Your free trial ends in ${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""} — BarberPro`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">⏳</div>
        ${badge(`${params.daysLeft} Day${params.daysLeft !== 1 ? "s" : ""} Left`, urgency)}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Your trial is ending soon</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, your 14-day free trial for <strong>${params.shopName}</strong> ends on <strong>${params.trialEndsAt}</strong>.</p>
      </div>
      ${alertBox(
        `After your trial ends, your subscription will automatically continue at the <strong>BarberPro ${planLabel}</strong> rate. No action needed if you wish to continue — your card on file will be charged.`,
        "#faf5ff", "#ddd6fe", "💳"
      )}
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan", `BarberPro ${planLabel}`)}
        ${infoRow("Trial ends", params.trialEndsAt)}
        ${infoRow("Days remaining", `${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""}`)}
      `)}
      ${ctaButton("Manage Subscription", params.billingUrl, urgency)}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        Want to cancel before being charged? Visit your billing settings.
      </p>
      `,
      `Your BarberPro trial ends in ${params.daysLeft} day${params.daysLeft !== 1 ? "s" : ""} on ${params.trialEndsAt}.`
    ),
  };
}

export function upcomingRenewalEmail(params: {
  ownerName: string;
  shopName: string;
  plan: string;
  amount: string;
  renewalDate: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const planLabel = params.plan.charAt(0).toUpperCase() + params.plan.slice(1);

  return {
    subject: `Upcoming renewal: BarberPro ${planLabel} on ${params.renewalDate}`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">📅</div>
        ${badge("Upcoming Renewal", "#1e40af")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Your subscription renews soon</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, just a heads-up about your upcoming renewal.</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Plan", `BarberPro ${planLabel}`)}
        ${infoRow("Amount", params.amount)}
        ${infoRow("Renewal date", params.renewalDate)}
      `)}
      ${ctaButton("Manage Billing", params.billingUrl, BRAND_COLOR)}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        To cancel, visit your billing settings before the renewal date.
      </p>
      `,
      `Your BarberPro ${planLabel} subscription renews on ${params.renewalDate} for ${params.amount}.`
    ),
  };
}

export function cardExpiredEmail(params: {
  ownerName: string;
  shopName: string;
  last4?: string;
  billingUrl: string;
}): { subject: string; html: string } {
  const cardLine = params.last4
    ? `Your card ending in <strong>${params.last4}</strong> has expired or is about to expire.`
    : `Your payment method has expired or is about to expire.`;

  return {
    subject: `Action required: Update your payment method — BarberPro`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#fff7ed;border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">💳</div>
        ${badge("Payment Method Expired", "#d97706")}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">Update your card details</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.ownerName}, ${cardLine}</p>
      </div>
      ${alertBox(
        `If your payment method is not updated before your next billing cycle, your <strong>${params.shopName}</strong> subscription may be suspended.`,
        "#fff7ed", "#fed7aa", "⚠️"
      )}
      ${ctaButton("Update Payment Method", params.billingUrl, "#d97706")}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        Your data is safe — updates take effect immediately.
      </p>
      `,
      `Your payment method for BarberPro needs to be updated.`
    ),
  };
}

export function staffInviteEmail(params: {
  staffName: string;
  shopName: string;
  inviterName: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to join ${params.shopName} on BarberPro`,
    html: base(
      `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:16px;">👋</div>
        ${badge("Staff Invitation", BRAND_ACCENT)}
        <h1 style="margin:20px 0 8px;color:${BRAND_COLOR};font-size:26px;font-weight:700;letter-spacing:-0.5px;">You're invited!</h1>
        <p style="margin:0;color:#64748b;font-size:16px;">Hi ${params.staffName}, <strong>${params.inviterName}</strong> has invited you to join <strong>${params.shopName}</strong> on BarberPro.</p>
      </div>
      ${infoTable(`
        ${infoRow("Shop", params.shopName)}
        ${infoRow("Invited by", params.inviterName)}
      `)}
      ${ctaButton("Accept Invitation & Log In", params.loginUrl, BRAND_ACCENT)}
      ${divider()}
      <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
        If you weren't expecting this, you can safely ignore this email.
      </p>
      `,
      `${params.inviterName} invited you to join ${params.shopName} on BarberPro.`
    ),
  };
}
