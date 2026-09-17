"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { ASSETS } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./timeline.module.css";

/**
 * Section 6 — the MCU timeline artwork.
 *
 * The uploaded image is a tall vertical timeline (Iron Man → Doomsday). Rather
 * than crop it to a thin fullscreen slice, it fills the viewport WIDTH and pans
 * vertically as `signals.mcu` scrubs 0→1 — so the whole saga is revealed top to
 * bottom, no bars, no empty space. A cinematic title sits in the bottom-right
 * while the artwork travels behind it. Fades in from the battle, out into the
 * title reveal. Swap ASSETS.timelineImg to change the artwork.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const IMG_ASPECT = 3354 / 700; // tall

export default function TimelineImage() {
  const layerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useRaf(() => {
    const m = signals.mcu;
    const layer = layerRef.current;
    if (!layer) return;

    if (m <= 0.0008 || m >= 0.9996) {
      if (layer.style.visibility !== "hidden") layer.style.visibility = "hidden";
      return;
    }
    layer.style.visibility = "visible";
    // fade in as the pan starts, out at the end (as the title reveal rises)
    layer.style.opacity = (smoothstep(0, 0.05, m) * (1 - smoothstep(0.94, 1.0, m))).toFixed(3);

    const pan = panRef.current;
    if (pan) {
      const imgH = imgRef.current?.offsetHeight || window.innerWidth * IMG_ASPECT;
      const dist = Math.max(0, imgH - window.innerHeight);
      pan.style.transform = `translate3d(0, ${(-m * dist).toFixed(1)}px, 0)`;
    }
  });

  return (
    <div className="mcu-layer" ref={layerRef} style={{ opacity: 0, visibility: "hidden" }} aria-hidden>
      <div className={styles.pan} ref={panRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.img} ref={imgRef} src={ASSETS.timelineImg} alt="" draggable={false} />
      </div>
      <span className={styles.fade} />
      <span className={styles.scrim} />
      <span className={styles.glow} />

      <div className={styles.content}>
        <span className={styles.kicker}>The Infinity Saga &amp; Beyond</span>
        <h2 className={styles.title}>
          <span className={styles.titleLine}>The Road</span>
          <span className={styles.titleLine}>to Doomsday</span>
        </h2>
        <span className={styles.rule} />
        <p className={styles.desc}>
          Every hero, every world, every sacrifice — eighteen years of saga have been building to this.
        </p>
      </div>
    </div>
  );
}
