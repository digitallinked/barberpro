/**
 * Queue number accent colors — must stay in sync with the in-shop queue board
 * so customers see the same colour on their phone as on the TV display.
 */
export type QueueColor = {
  bg: string;
  text: string;
  shadow: string;
  subtle: string;
  border: string;
};

export const QUEUE_COLORS: QueueColor[] = [
  { bg: "#D4AF37", text: "#111111", shadow: "rgba(212,175,55,0.35)", subtle: "rgba(212,175,55,0.09)", border: "rgba(212,175,55,0.35)" },
  { bg: "#3B82F6", text: "#ffffff", shadow: "rgba(59,130,246,0.35)", subtle: "rgba(59,130,246,0.09)", border: "rgba(59,130,246,0.35)" },
  { bg: "#EF4444", text: "#ffffff", shadow: "rgba(239,68,68,0.35)", subtle: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.35)" },
  { bg: "#8B5CF6", text: "#ffffff", shadow: "rgba(139,92,246,0.35)", subtle: "rgba(139,92,246,0.09)", border: "rgba(139,92,246,0.35)" },
  { bg: "#10B981", text: "#ffffff", shadow: "rgba(16,185,129,0.35)", subtle: "rgba(16,185,129,0.09)", border: "rgba(16,185,129,0.35)" },
  { bg: "#F97316", text: "#111111", shadow: "rgba(249,115,22,0.35)", subtle: "rgba(249,115,22,0.09)", border: "rgba(249,115,22,0.35)" },
  { bg: "#EC4899", text: "#ffffff", shadow: "rgba(236,72,153,0.35)", subtle: "rgba(236,72,153,0.09)", border: "rgba(236,72,153,0.35)" },
  { bg: "#06B6D4", text: "#111111", shadow: "rgba(6,182,212,0.35)", subtle: "rgba(6,182,212,0.09)", border: "rgba(6,182,212,0.35)" },
];

/** Q0001 → gold, Q0002 → blue, … (same mapping as queue board). */
export function getQueueColor(queueNumber: string): QueueColor {
  const num = parseInt(queueNumber.replace(/\D/g, ""), 10) || 1;
  return QUEUE_COLORS[(num - 1) % QUEUE_COLORS.length]!;
}

/** Font size classes for queue board tiles by string length. */
export function queueBoardFontClass(num: string, size: "xl" | "lg" | "md" | "sm"): string {
  const n = num.length;
  if (size === "xl") {
    return n <= 4 ? "text-6xl sm:text-7xl" : n <= 6 ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl";
  }
  if (size === "lg") {
    return n <= 4 ? "text-4xl sm:text-5xl" : n <= 6 ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  }
  if (size === "md") {
    return n <= 4 ? "text-2xl sm:text-3xl" : n <= 6 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";
  }
  return n <= 5 ? "text-base" : "text-sm";
}

/**
 * Customer app: fluid typography so long queue labels never clip on narrow phones.
 */
export function queueCustomerHeroClass(queueNumber: string): string {
  const n = queueNumber.length;
  if (n <= 4) {
    return "text-[clamp(2.5rem,14vw,4.5rem)] leading-[0.95] tracking-tight";
  }
  if (n <= 6) {
    return "text-[clamp(2rem,11vw,3.5rem)] leading-[0.95] tracking-tight";
  }
  return "text-[clamp(1.65rem,8.5vw,2.75rem)] leading-tight tracking-tight break-all";
}
