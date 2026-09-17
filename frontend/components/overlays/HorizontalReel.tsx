"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./reel.module.css";

/** Scroll-driven event reel. Each full card opens its event rulebook. */
interface EventCard {
  n: string;
  title: string;
  theme: string;
  visual: string;
  image: string;
  rulebook: string;
  accent: string;
}

const EVENTS: EventCard[] = [
  { n: "01", title: "Infinity Trials", theme: "Infinity War", visual: "Infinity Gauntlet", image: "/events/infinity-trials.png", rulebook: "/rulebooks/infinity-trials-rulebook.pdf", accent: "#f2b84b" },
  { n: "02", title: "Research X", theme: "Thor", visual: "Stormbreaker + Mjolnir", image: "/events/research-x.png", rulebook: "/rulebooks/research-x-rulebook.pdf", accent: "#65cfff" },
  { n: "03", title: "BGMI Elite Showdown", theme: "Captain America", visual: "Guns + Shield", image: "/events/bgmi-elite-showdown.png", rulebook: "/rulebooks/bgmi-elite-showdown-rulebook.pdf", accent: "#ff4458" },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function HorizontalReel() {
  const layerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);

  useRaf(() => {
    const reel = signals.reel;
    const layer = layerRef.current;
    if (!layer) return;

    // only live during Section 4
    if (reel <= 0.0008 || reel >= 0.9992) {
      if (layer.style.visibility !== "hidden") layer.style.visibility = "hidden";
      return;
    }
    layer.style.visibility = "visible";

    const intro = smoothstep(0, 0.08, reel);
    const outro = smoothstep(0.9, 1.0, reel);
    layer.style.opacity = (intro * (1 - outro)).toFixed(3);

    // camera settle in / push back out
    const stage = stageRef.current;
    if (stage) {
      const sc = (0.92 + 0.08 * intro) * (1 - 0.05 * outro);
      stage.style.transform = `scale(${sc.toFixed(4)})`;
    }

    const track = trackRef.current;
    if (!track) return;
    const vw = window.innerWidth;
    const maxShift = Math.max(0, track.scrollWidth - vw);
    const travel = clamp01((reel - 0.08) / (0.9 - 0.08));
    const x = -travel * maxShift;
    track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;

    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${travel.toFixed(4)})`;
    }

    // per-frame focus + parallax (centres are transform-stable → read rect directly)
    const cx = vw / 2;
    for (let i = 0; i < EVENTS.length; i++) {
      const f = frameRefs.current[i];
      if (!f) continue;
      const rect = f.getBoundingClientRect();
      const fc = rect.left + rect.width / 2;
      const off = fc - cx;
      const close = 1 - clamp01(Math.abs(off) / (vw * 0.62));
      const scl = 0.82 + close * 0.2;
      const rot = clamp01((off / vw + 1) / 2) * 2 - 1; // -1..1
      f.style.transform = `perspective(1600px) rotateY(${(-rot * 7).toFixed(2)}deg) scale(${scl.toFixed(3)})`;
      f.style.opacity = (0.34 + close * 0.66).toFixed(3);
      f.style.zIndex = String(100 + Math.round(close * 100));
      const inner = innerRefs.current[i];
      if (inner) inner.style.transform = `translate3d(${(-off * 0.04).toFixed(1)}px, 0, 0)`;
    }
  });

  return (
    <div className="reel-layer" ref={layerRef} style={{ opacity: 0, visibility: "hidden" }}>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.track} ref={trackRef}>
          {EVENTS.map((event, i) => (
            <a
              key={event.n}
              className={styles.frame}
              ref={(el) => {
                frameRefs.current[i] = el;
              }}
              href={event.rulebook}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open the ${event.title} rulebook`}
              style={{ "--accent": event.accent } as React.CSSProperties}
            >
              <div
                className={styles.inner}
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
              >
                <article className={styles.screen}>
                  <img className={styles.poster} src={event.image} alt="" />
                  <span className={styles.scrim} />
                  <span className={`${styles.bracket} ${styles.tl}`} />
                  <span className={`${styles.bracket} ${styles.tr}`} />
                  <span className={`${styles.bracket} ${styles.bl}`} />
                  <span className={`${styles.bracket} ${styles.br}`} />
                  <div className={styles.status}>
                    <span className={styles.dot} />
                    <span>Event {event.n}</span>
                  </div>
                  <div className={styles.theme}>{event.theme}</div>
                  <div className={styles.caption}>
                    <div className={styles.visual}>{event.visual}</div>
                    <h2 className={styles.title}>{event.title}</h2>
                    <div className={styles.openRulebook}>
                      View rulebook <span aria-hidden="true">↗</span>
                    </div>
                  </div>
                </article>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className={styles.label}>
        <div className={styles.labelKicker}>Praxis 2026</div>
        <div className={styles.labelTitle}>Choose Your Event</div>
      </div>
      <div className={styles.progress}>
        <span className={styles.progressFill} ref={progressRef} />
      </div>
    </div>
  );
}
