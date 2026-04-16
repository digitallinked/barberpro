// BarberPro Customer — Service Worker
// Handles PWA install lifecycle and Web Push notifications.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ─── Push event ───────────────────────────────────────────────────────────────
// Triggered when the server sends a Web Push notification, even when the
// browser tab is closed or the app is in the background.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "BarberPro", body: event.data.text(), actionUrl: "/" };
  }

  const title = payload.title ?? "BarberPro";
  const options = {
    body: payload.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      actionUrl: payload.actionUrl ?? "/",
      ...(payload.data ?? {}),
    },
    requireInteraction: false,
    tag: payload.data?.ticketId ?? "barberpro-customer",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ───────────────────────────────────────────────────────
// Opens / focuses the relevant page when the user taps the notification.

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Re-focus an existing window on the same origin if available.
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(actionUrl);
            return client.focus();
          }
        }
        // No existing window — open a new one.
        if (self.clients.openWindow) {
          return self.clients.openWindow(actionUrl);
        }
      })
  );
});
