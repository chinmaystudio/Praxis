"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";

/**
 * Whole-frame lightning flash. Sits above the stage so every strike briefly
 * illuminates the entire composition — footage included. Kept subtle so it
 * reads as light bloom, not a white wash.
 */
export default function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const o = Math.min(0.34, signals.flash * 0.22);
    el.style.opacity = o.toFixed(3);
  });

  return (
    <div
      ref={ref}
      className="overlay no-select"
      aria-hidden
      style={{
        zIndex: 6,
        opacity: 0,
        background:
          "radial-gradient(120% 90% at 50% 42%, rgba(220,255,240,0.9), rgba(0,255,156,0.35) 38%, rgba(0,40,28,0) 72%)",
        mixBlendMode: "screen",
        willChange: "opacity",
      }}
    />
  );
}
