"use client";

import { useEffect, useRef } from "react";
import { ASSETS } from "@/lib/constants";
import { primeElement, setVideoEl } from "@/lib/videos";

/**
 * The trailers, rendered as REAL fullscreen `<video>` elements (object-fit:cover)
 * — guaranteed to display. They never autoplay. Opacity + `currentTime` are set
 * directly by the scroll handler (see Experience's ScrollTrigger onUpdate), so
 * the footage responds to scroll synchronously. The green atmosphere (WebGL)
 * sits on top as a transparent layer.
 */
export default function VideoLayer() {
  const marvelRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLVideoElement>(null);
  const finaleRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const m = marvelRef.current;
    const h = heroRef.current;
    const f = finaleRef.current;
    if (m) m.muted = true;
    if (h) h.muted = true;
    if (f) f.muted = true;
    setVideoEl("marvel", m);
    setVideoEl("hero", h);
    setVideoEl("finale", f);

    const primeM = () => primeElement(m);
    const primeH = () => primeElement(h);
    const primeF = () => primeElement(f);
    m?.addEventListener("loadeddata", primeM, { once: true });
    h?.addEventListener("loadeddata", primeH, { once: true });
    f?.addEventListener("loadeddata", primeF, { once: true });

    // safety re-prime on the first gesture
    let primed = false;
    const onGesture = () => {
      if (primed) return;
      primed = true;
      primeElement(m);
      primeElement(h);
      primeElement(f);
    };
    const evs = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));

    return () => {
      m?.removeEventListener("loadeddata", primeM);
      h?.removeEventListener("loadeddata", primeH);
      f?.removeEventListener("loadeddata", primeF);
      evs.forEach((e) => window.removeEventListener(e, onGesture));
      setVideoEl("marvel", null);
      setVideoEl("hero", null);
      setVideoEl("finale", null);
    };
  }, []);

  return (
    <div className="video-layer" aria-hidden>
      <video
        ref={marvelRef}
        className="cover-video"
        src={ASSETS.marvelVideo}
        poster={ASSETS.marvelPoster}
        preload="auto"
        muted
        playsInline
        style={{ opacity: 0 }}
      />
      <video
        ref={heroRef}
        className="cover-video"
        src={ASSETS.heroVideo}
        poster={ASSETS.heroPoster}
        preload="auto"
        muted
        playsInline
        style={{ opacity: 0 }}
      />
      <video
        ref={finaleRef}
        className="cover-video"
        src={ASSETS.finaleVideo}
        poster={ASSETS.finalePoster}
        preload="auto"
        muted
        playsInline
        style={{ opacity: 0 }}
      />
    </div>
  );
}
