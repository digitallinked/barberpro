"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SCROLL_DOWN_HIDE_AFTER = 64;
/** Spacer until ResizeObserver runs (avoids content under fixed bar on first paint). */
const NAV_HEIGHT_FALLBACK_PX = 72;

type Props = {
  children: ReactNode;
};

export function NavbarHeaderShell({ children }: Props) {
  const [isScrollHidden, setIsScrollHidden] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const measure = () => setHeaderHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < SCROLL_DOWN_HIDE_AFTER) {
        setIsScrollHidden(false);
      } else if (y > lastScrollY.current) {
        setIsScrollHidden(true);
      } else {
        setIsScrollHidden(false);
      }
      lastScrollY.current = y;
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: headerHeight > 0 ? headerHeight : NAV_HEIGHT_FALLBACK_PX }}
      />
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0d1013]/95 backdrop-blur transition-transform duration-300 ease-out will-change-transform",
          isScrollHidden && "-translate-y-full",
        )}
      >
        {children}
      </header>
    </>
  );
}
