"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

/** "Scroll to begin" — the primary instruction. Fades the instant scrolling starts. */
export default function ScrollCue() {
  const ref = useRef<HTMLDivElement>(null);

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const o = Math.max(0, 1 - signals.scroll * 34);
    el.style.opacity = o.toFixed(3);
    el.style.visibility = o < 0.01 ? "hidden" : "visible";
  });

  return (
    <div ref={ref} className={`${styles.corner} ${styles.scrollCue}`} aria-hidden>
      <span className={styles.label}>Scroll to begin</span>
      <div className={styles.mouse} />
    </div>
  );
}
