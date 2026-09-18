"use client";

import { useRef } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./footer.module.css";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.wrap} ref={wrapRef} style={{ visibility: "hidden" }}>
      <footer className={styles.footer} ref={footRef} style={{ opacity: 0 }}>
        <span className={styles.glow} />
        <div className={styles.inner}>
          <div className={styles.brand}>
            <div className={styles.studio}>MARVEL STUDIOS</div>
            <span className={styles.mark}>
              AVENGERS<span>: DOOMSDAY</span>
            </span>
            <span className={styles.tag}>
              A scroll-driven cinematic concept experience exploring the sovereign of Latveria and the multiverse.
            </span>
          </div>

          <nav>
            <div className={styles.colHead}>Experience</div>
            <div className={styles.links}>
              <Link href="/events" className={styles.exploreLink}>
                Explore Events Orbit →
              </Link>
              <button type="button" onClick={scrollToTop} className={styles.btnLink}>
                Replay Experience ↑
              </button>
            </div>
          </nav>

          <div>
            <div className={styles.colHead}>Follow</div>
            <div className={styles.social}>
              <a href="https://www.marvel.com" target="_blank" rel="noopener noreferrer">
                Marvel.com ↗
              </a>
              <a href="https://x.com/MarvelStudios" target="_blank" rel="noopener noreferrer">
                X (Twitter) ↗
              </a>
              <a href="https://www.youtube.com/marvel" target="_blank" rel="noopener noreferrer">
                YouTube ↗
              </a>
            </div>
          </div>
        </div>

        <div className={styles.rule} />
        <div className={styles.base}>
          <span>© 2026 MARVEL STUDIOS · FAN CONCEPT EXPERIENCE</span>
          <button type="button" onClick={scrollToTop} className={styles.toTopBtn} aria-label="Back to top">
            BACK TO TOP ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
