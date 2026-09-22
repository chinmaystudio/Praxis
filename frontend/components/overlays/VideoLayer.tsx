"use client";
import { useEffect, useRef, useState } from "react";
import { ASSETS } from "@/lib/constants";
import { setVideoEl } from "@/lib/videos";

/** One decoder: muted playback on arrival, frame seeking after scrolling. */
export default function VideoLayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  const tryPlayRef = useRef<() => void>(() => {});
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setVideoEl("hero", video);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    video.dataset.playbackMode = window.scrollY > 2 ? "scroll" : "autoplay";
    const play = () => {
      if (disposed || reduced.matches || video.dataset.playbackMode === "scroll" || window.scrollY > 2 || document.hidden) return;
      video.muted = true;
      void video.play().then(() => {
        if (disposed) { video.pause(); return; }
        setBlocked(false);
        // A gesture may start scrolling while play() is still resolving.
        if (video.dataset.playbackMode === "scroll") video.pause();
      }).catch(() => { if (!disposed && video.dataset.playbackMode !== "scroll") setBlocked(true); });
    };
    tryPlayRef.current = play;
    const onScroll = () => {
      if (window.scrollY > 2) {
        video.dataset.playbackMode = "scroll";
        video.pause();
        setBlocked(false);
      }
    };
    const visibility = () => { if (document.hidden) video.pause(); else play(); };
    const motion = () => { if (reduced.matches) video.pause(); else play(); };
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pointerdown", play, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    reduced.addEventListener("change", motion);
    // Select before loading so a phone never downloads the desktop movie too.
    video.src = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches
      ? "/videos/hero-scroll-mobile.mp4" : ASSETS.heroVideo;
    video.load();
    if (video.readyState >= 2) play();
    return () => {
      disposed = true;
      video.pause();
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pointerdown", play);
      window.removeEventListener("scroll", onScroll);
      reduced.removeEventListener("change", motion);
      setVideoEl("hero", null);
    };
  }, []);
  return <>
    <div className="video-layer" aria-hidden="true">
      <video ref={ref} className="cover-video"
        poster={ASSETS.heroPoster} preload="auto" muted playsInline loop
        style={{ opacity: 0.65 }} />
    </div>
    {blocked && <button className="video-play-fallback" onClick={() => tryPlayRef.current()}>Play background video</button>}
  </>;
}
