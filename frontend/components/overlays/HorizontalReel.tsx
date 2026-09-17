"use client";

import { useEffect, useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./reel.module.css";

/**
 * Section 4 — the Horizontal Cinematic Timeline.
 *
 * The fixed .stage is the pin; vertical scroll scrubs `signals.reel` 0→1 and the
 * strip travels right→left, so the viewer feels like they're moving through a
 * sequence of scenes rather than scrolling a page. Each frame comes into focus
 * as it passes screen-centre (scale + opacity + a slight turn), with a subtle
 * parallax on its inner content. Placeholder video frames only — real clips drop
 * into `.screen` later without touching the motion.
 *
 * reel 0.00–0.08  intro  — fades/scales in as the story stack recedes
 * reel 0.08–0.90  travel — the strip slides through all four scenes
 * reel 0.90–1.00  outro  — pushes back + fades as the finale rises
 *
 * Each scene is one of the uploaded character clips (real <video>: autoplay ·
 * loop · muted · playsInline · no controls · object-fit cover). Playback is
 * gated to the section — the videos play while the reel is on-screen and pause
 * when it isn't, so they never restart or flicker while the strip travels.
 */
interface Scene {
  n: string;
  slug: string; // /videos/char-<slug>.mp4
  timecode: string;
  accent: string;
}

// first four uploaded videos, in the Section-2 character order
const SCENES: Scene[] = [
  { n: "01", slug: "doom", timecode: "00:01:12:04", accent: "#00ff9c" },
  { n: "02", slug: "blackpanther", timecode: "00:04:38:21", accent: "#38ffb2" },
  { n: "03", slug: "cyclops", timecode: "00:07:55:09", accent: "#00d884" },
  { n: "04", slug: "mystique", timecode: "00:11:20:16", accent: "#9dffd6" },
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
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const progressRef = useRef<HTMLSpanElement>(null);

  // guarantee muted inline playback so programmatic play() is never blocked
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    });
  }, []);

  useRaf(() => {
    const reel = signals.reel;
    const layer = layerRef.current;
    if (!layer) return;

    // only live during Section 4
    if (reel <= 0.0008 || reel >= 0.9992) {
      if (layer.style.visibility !== "hidden") layer.style.visibility = "hidden";
      // pause when the section is off-screen (resumes later — never restarts)
      for (const v of videoRefs.current) if (v && !v.paused) v.pause();
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
    for (let i = 0; i < SCENES.length; i++) {
      // the section is visible → keep every clip playing (looped, muted)
      const v = videoRefs.current[i];
      if (v && v.paused) v.play().catch(() => {});

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
    <div className="reel-layer" ref={layerRef} style={{ opacity: 0, visibility: "hidden" }} aria-hidden>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.track} ref={trackRef}>
          {SCENES.map((s, i) => (
            <div
              key={s.n}
              className={styles.frame}
              ref={(el) => {
                frameRefs.current[i] = el;
              }}
              style={{ "--accent": s.accent } as React.CSSProperties}
            >
              <div
                className={styles.inner}
                ref={(el) => {
                  innerRefs.current[i] = el;
                }}
              >
                <div className={styles.screen}>
                  <video
                    ref={(el) => {
                      if (el) {
                        el.muted = true;
                        el.playsInline = true;
                      }
                      videoRefs.current[i] = el;
                    }}
                    className={styles.video}
                    src={`/videos/char-${s.slug}.mp4`}
                    poster={`/videos/char-${s.slug}-poster.jpg`}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                  />
                  <span className={styles.scrim} />
                  <span className={`${styles.bracket} ${styles.tl}`} />
                  <span className={`${styles.bracket} ${styles.tr}`} />
                  <span className={`${styles.bracket} ${styles.bl}`} />
                  <span className={`${styles.bracket} ${styles.br}`} />
                  <div className={styles.status}>
                    <span className={styles.dot} />
                    <span>Scene {s.n}</span>
                  </div>
                  <div className={styles.timecode}>{s.timecode}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.label}>
        <div className={styles.labelKicker}>Section 04</div>
        <div className={styles.labelTitle}>The Cinematic Timeline</div>
      </div>
      <div className={styles.progress}>
        <span className={styles.progressFill} ref={progressRef} />
      </div>
    </div>
  );
}
