"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./footer.module.css";

/**
 * The closing footer — rises from the bottom after the title reveal, driven by
 * `signals.footer`. Minimal + elegant, in the same dark-green cinematic language.
 * Links are placeholders for now.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const NAV = ["Overview", "Characters", "Story", "Timeline"];
const SOCIAL = ["Instagram", "X", "YouTube"];

export default function SiteFooter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLElement>(null);

  useRaf(() => {
    const foot = signals.footer;
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (foot <= 0.0006) {
      if (wrap.style.visibility !== "hidden") wrap.style.visibility = "hidden";
      return;
    }
    wrap.style.visibility = "visible";
    if (footRef.current) {
      footRef.current.style.transform = `translateY(${((1 - foot) * 100).toFixed(2)}%)`;
      footRef.current.style.opacity = smoothstep(0, 0.25, foot).toFixed(3);
    }
  });

  const noop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={styles.wrap} ref={wrapRef} style={{ visibility: "hidden" }}>
      <footer className={styles.footer} ref={footRef} style={{ opacity: 0 }}>
        <span className={styles.glow} />
        <div className={styles.inner}>
          <div className={styles.brand}>
            <span className={styles.mark}>
              Doomsday<span>.</span>
            </span>
            <span className={styles.tag}>A scroll-driven cinematic concept experience.</span>
          </div>

          <nav>
            <div className={styles.colHead}>Explore</div>
            <div className={styles.links}>
              {NAV.map((l) => (
                <a key={l} href="#" onClick={noop}>
                  {l}
                </a>
              ))}
            </div>
          </nav>

          <div>
            <div className={styles.colHead}>Follow</div>
            <div className={styles.social}>
              {SOCIAL.map((l) => (
                <a key={l} href="#" onClick={noop}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rule} />
        <div className={styles.base}>
          <span>© 2026 · Placeholder — fan concept, not affiliated with Marvel.</span>
          <span>Built as a cinematic web experience.</span>
        </div>
      </footer>
    </div>
  );
}
