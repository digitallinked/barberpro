import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Self Check-in — BarberPro",
  robots: { index: false, follow: true },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function CheckInLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(){});
            }
            (async function() {
              if ('wakeLock' in navigator) {
                try {
                  let lock = await navigator.wakeLock.request('screen');
                  document.addEventListener('visibilitychange', async function() {
                    if (document.visibilityState === 'visible') {
                      lock = await navigator.wakeLock.request('screen');
                    }
                  });
                } catch(e) {}
              }
            })();
          `,
        }}
      />
      {children}
    </>
  );
}
