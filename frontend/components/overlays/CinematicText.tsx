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
 * reverses when scrolling back). A storm opener + a portal line ride Section 1;
 * four story beats form the Hero text sequence before the Doom trailer; a closing
 * line punctuates the trailer; and three beats narrate the Section 5 ending
 * (Thor → Doom → Captain America). Original, movie-style copy. (The reserved
 * AVENGERS: DOOMSDAY title is deliberately NOT here.)
 */
const BEATS: Beat[] = [
  // ── Section 1 · storm + portal ──
  { id: "unravel", lines: ["REALITY IS UNRAVELING"], startU: 0.35, endU: 1.2, variant: "rise" },
  { id: "rift", lines: ["THE RIFT OPENS"], startU: 3.95, endU: 4.6, variant: "chroma" },
  // ── Hero · text sequence before the Doom trailer ──
  { id: "threat", lines: ["A NEW THREAT"], startU: 5.35, endU: 6.0, variant: "rise", kicker: "I" },
  { id: "multiverse", lines: ["THE MULTIVERSE", "IS BREAKING"], startU: 6.05, endU: 6.7, variant: "chroma", kicker: "II" },
  { id: "coming", lines: ["THEY ARE COMING"], startU: 6.75, endU: 7.25, variant: "loom", kicker: "III" },
  { id: "legends", lines: ["ONLY LEGENDS REMAIN"], startU: 7.3, endU: 7.75, variant: "metallic", kicker: "IV" },
  // ── Hero · trailer climax ──
  { id: "end", lines: ["THE END BEGINS"], startU: 10.6, endU: 11.15, variant: "rise" },
  // ── Section 5 · the battle (Thor → Doom → Captain America) ──
  { id: "thor", lines: ["THOR ENTERS", "THE FRAY"], startU: 31.95, endU: 33.3, variant: "loom" },
  { id: "thunder", lines: ["THE GOD OF THUNDER"], startU: 35.8, endU: 36.8, variant: "metallic" },
  { id: "cap", lines: ["THE FIRST", "AVENGER RETURNS"], startU: 37.5, endU: 38.35, variant: "rise" },
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
