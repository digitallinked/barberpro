import Link from "next/link";
import { Scissors } from "lucide-react";

const footerGroups = [
  {
    title: "Discover",
    links: [
      { label: "Find Shops", href: "/shops" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Browse Near Me", href: "/shops" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Profile", href: "/profile" },
      { label: "BarberPro Plus", href: "/subscription" },
      { label: "Sign Up Free", href: "/signup" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "For Businesses", href: "/for-businesses" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <>
      {/* Spacer that reserves space for the fixed bottom nav on mobile */}
      <div
        className="h-[calc(3.5rem+max(0.5rem,env(safe-area-inset-bottom)))] md:hidden"
        aria-hidden
      />

      {/* Full footer — desktop only */}
      <footer className="hidden border-t border-white/5 bg-[#0a0c0f] md:block">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4af37]/20">
                  <Scissors className="h-3.5 w-3.5 text-[#d4af37]" />
                </div>
                <p className="text-sm font-bold text-white">
                  BarberPro<span className="text-[#d4af37]">.my</span>
                </p>
              </div>
              <p className="mt-3 max-w-xs text-sm text-gray-400">
                Discover and book top barbers across Malaysia. Queue tracking,
                loyalty rewards, and more.
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="mb-4 font-bold text-white">{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 transition hover:text-[#d4af37]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 py-6 text-center text-sm text-gray-600">
          <p>
            &copy; {new Date().getFullYear()} BarberPro Technologies Sdn. Bhd.
            All rights reserved.
          </p>
          <p className="mt-1">
            Made with <span className="text-red-500">♥</span> in Malaysia
            &nbsp;|&nbsp;{" "}
            <Link href="/terms" className="transition hover:text-gray-400">
              Terms
            </Link>
            {" · "}
            <Link href="/privacy" className="transition hover:text-gray-400">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </>
  );
}
