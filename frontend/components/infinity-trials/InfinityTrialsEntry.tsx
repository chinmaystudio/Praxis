"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./intro.module.css";

export default function InfinityTrialsEntry({ playIntro, children }: { playIntro: boolean; children: ReactNode }) {
  const [showIntro, setShowIntro] = useState(playIntro);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showIntro) return;
    // A cached load failure can occur before React attaches the media handlers.
    if (videoRef.current?.error) {
      setShowIntro(false);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skipRef.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setShowIntro(false); };
    window.addEventListener("keydown", escape);
    const timer = window.setTimeout(() => setWaiting(true), 10000);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
      window.clearTimeout(timer);
    };
  }, [showIntro]);

  useEffect(() => {
    if (showIntro || !playIntro) return;
    window.scrollTo(0, 0);
    const title = document.getElementById("event-title");
    title?.setAttribute("tabindex", "-1");
    title?.focus({ preventScroll: true });
  }, [showIntro, playIntro]);

  if (!showIntro) return children;

  return <main className={styles.intro} aria-label="Infinity Trials opening film">
    <video ref={videoRef} className={styles.video} src="/videos/infinity-trials-intro.mp4?v=2" autoPlay muted={muted} playsInline controls preload="auto" onPlaying={() => { setPlaying(true); setWaiting(false); }} onPause={() => setPlaying(false)} onEnded={() => setShowIntro(false)} onError={() => setShowIntro(false)} aria-label="Infinity Trials cinematic introduction" />
    <div className={styles.topbar}><span>PRAXIS 2026 <b> / </b> THE INFINITY TRIALS</span><button ref={skipRef} type="button" onClick={() => setShowIntro(false)}>Skip intro <span aria-hidden="true">↗</span></button></div>
    <div className={styles.bottomBar}>
      <p role="status">{playing ? "Your journey is about to begin." : waiting ? "Taking a moment to load. You can skip straight to the trials." : "The Infinity Trials · Opening film"}</p>
      <div>{!playing && <button type="button" onClick={() => { void videoRef.current?.play().catch(() => setWaiting(true)); }}>Play intro ▷</button>}<button type="button" aria-pressed={!muted} onClick={() => setMuted(value => !value)}>{muted ? "Enable sound" : "Mute sound"}</button></div>
    </div>
  </main>;
}
