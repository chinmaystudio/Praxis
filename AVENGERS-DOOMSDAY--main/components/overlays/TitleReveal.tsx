"use client";

import { useEffect, useRef } from "react";
import { signals } from "@/lib/signals";
import { ASSETS } from "@/lib/constants";
import { useRaf } from "@/lib/useRaf";
import styles from "./title.module.css";

/**
 * Section 7 — the AVENGERS: DOOMSDAY title reveal.
 *
 * A fullscreen autoplay + loop cinematic video (muted · playsInline · no
 * controls), object-fit cover — behaves like a cinematic background, not a
 * player. It fades in as the timeline artwork exits; playback is gated to the
 * section so it never restarts or flickers. Swap ASSETS.titleVideo to change it.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function TitleReveal() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    }
  }, []);

  useRaf(() => {
    const t = signals.title;
    const layer = layerRef.current;
    const v = videoRef.current;
    if (!layer) return;

    // play while the section is (near) visible — resumes, never restarts
    if (v) {
      if (t > 0.006 && v.paused) v.play().catch(() => {});
      else if (t < 0.002 && !v.paused) v.pause();
    }

    if (t <= 0.0008) {
      if (layer.style.visibility !== "hidden") layer.style.visibility = "hidden";
      return;
    }
    layer.style.visibility = "visible";
    layer.style.opacity = smoothstep(0, 0.18, t).toFixed(3);
  });

  return (
    <div className="title-layer" ref={layerRef} style={{ opacity: 0, visibility: "hidden" }} aria-hidden>
      <video
        ref={(el) => {
          if (el) {
            el.muted = true;
            el.playsInline = true;
          }
          videoRef.current = el;
        }}
        className={styles.video}
        src={ASSETS.titleVideo}
        poster={ASSETS.titlePoster}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <span className={styles.vignette} />
    </div>
  );
}
