"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { TIMELINE_UNITS } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./cinematic.module.css";

type Variant = "rise" | "chroma" | "loom" | "metallic";
interface Beat {
  id: string;
  lines: string[];
  // Timeline UNIT window (100vh = 1 unit) — NOT a raw scroll fraction. Converted
  // to a scroll fraction via TIMELINE_UNITS at runtime so each beat stays pinned
  // to its exact moment no matter how the overall scroll length changes.
  startU: number;
  endU: number;
  variant: Variant;
  kicker?: string;
}

/**
 * Cinematic storytelling copy, scrubbed by scroll. Each beat owns a timeline
 * window and animates in → holds → out as the user scrolls through it (and
 * reverses when scrolling back). Four story beats form the Hero text sequence
 * before the Doom trailer; a closing line punctuates the trailer climax.
 * (The reserved AVENGERS: DOOMSDAY title is deliberately NOT here.)
 *
 * Beat positions are expressed in the original 49-unit scale (100vh = 1 unit)
 * and converted to scroll fractions at runtime via TIMELINE_UNITS. Windows have
 * been widened so each beat lingers on screen for ~60–70 vh of scroll.
 */
const BEATS: Beat[] = [
  // ── Hero · text sequence before the Doom trailer ──
  { id: "threat",   lines: ["A NEW THREAT"],       startU:  2.0, endU:  4.5, variant: "rise",     kicker: "I" },
  { id: "coming",   lines: ["THEY ARE COMING"],     startU:  5.5, endU:  8.0, variant: "loom",     kicker: "II" },
  { id: "legends",  lines: ["ONLY LEGENDS REMAIN"], startU:  8.5, endU: 10.2, variant: "metallic", kicker: "III" },
  // ── Hero · trailer climax ──
  { id: "end",      lines: ["THE END BEGINS"],      startU: 10.8, endU: 12.8, variant: "rise" },
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function CinematicText() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useRaf(() => {
    const s = signals.scroll;
    for (let i = 0; i < BEATS.length; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const b = BEATS[i];
      const start = b.startU / TIMELINE_UNITS;
      const end = b.endU / TIMELINE_UNITS;
      if (s < start - 0.02 || s > end + 0.02) {
        if (el.style.visibility !== "hidden") {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
        }
        continue;
      }
      const t = Math.max(0, Math.min(1, (s - start) / (end - start)));
      const enter = smoothstep(0, 0.2, t);
      const leave = smoothstep(0.72, 1, t);
      const opacity = enter * (1 - leave);
      const y = (1 - enter) * 38 + leave * -32;
      const blur = (1 - enter) * 11 + leave * 9;
      const scale = b.variant === "loom" ? 1.35 - 0.35 * enter : 1;

      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate(-50%, -50%) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      el.style.filter = blur > 0.12 ? `blur(${blur.toFixed(1)}px)` : "none";
    }
  });

  return (
    <div className={styles.wrap} aria-hidden>
      {BEATS.map((b, i) => {
        const small = b.lines.length > 1;
        return (
          <div
            key={b.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={styles.beat}
            style={{ opacity: 0, visibility: "hidden" }}
          >
            {b.kicker && <span className={styles.kicker}>{b.kicker}</span>}
            {b.lines.map((line, li) => {
              if (b.variant === "chroma") {
                return (
                  <span
                    key={li}
                    className={`${styles.line} ${styles.glow} ${small ? styles.small : ""} ${styles.chroma}`}
                    data-text={line}
                  >
                    {line}
                  </span>
                );
              }
              return (
                <span
                  key={li}
                  className={`${styles.line} ${styles.glow} ${small ? styles.small : ""} ${
                    b.variant === "metallic" ? styles.metallic : ""
                  }`}
                >
                  {line}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
