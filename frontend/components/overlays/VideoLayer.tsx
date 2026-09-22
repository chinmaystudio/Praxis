"use client";
import { useEffect, useRef, useState } from "react";
import { ASSETS } from "@/lib/constants";
import { setVideoEl } from "@/lib/videos";

/** One decoder: muted playback on arrival, frame seeking after scrolling. */
export default function VideoLayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setVideoEl("hero", video);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const play = () => {
      if (reduced || window.scrollY > 10 || document.hidden) return;
      video.muted = true;
      void video.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    };
    const visibility = () => { if (document.hidden) video.pause(); else play(); };
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pointerdown", play, { passive: true });
    if (video.readyState >= 2) play();
    return () => {
      video.pause();
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pointerdown", play);
      setVideoEl("hero", null);
    };
  }, []);
  return <>
    <div className="video-layer" aria-hidden="true">
      <video ref={ref} className="cover-video" src={ASSETS.heroVideo}
        poster={ASSETS.heroPoster} preload="auto" muted playsInline loop
        style={{ opacity: 0.65 }} />
    </div>
    {blocked && <button className="video-play-fallback" onClick={() => {
      void ref.current?.play().then(() => setBlocked(false)).catch(() => {});
    }}>Play background video</button>}
  </>;
}
