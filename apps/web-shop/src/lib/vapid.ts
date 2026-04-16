/**
 * VAPID configuration for Web Push in the shop app.
 *
 * Generate a key pair once:
 *   npx web-push generate-vapid-keys
 *
 * Required environment variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — sent to the browser for subscription
 *   VAPID_PRIVATE_KEY             — server-only, used when sending pushes
 *   VAPID_SUBJECT                 — "mailto:hello@barberpro.my" or the app URL
 */
export function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@barberpro.my";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY."
    );
  }

  return { publicKey, privateKey, subject };
}
