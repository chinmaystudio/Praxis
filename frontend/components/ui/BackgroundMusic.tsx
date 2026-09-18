"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ui.module.css";

const MUSIC_SRC = "/audio/avengers-theme.mp3";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantsMusicRef = useRef(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.35;

    const syncPlayingState = () => setIsPlaying(!audio.paused);
    const tryPlay = () => {
      if (!wantsMusicRef.current || !audio.paused) return;
      void audio.play().catch(() => {
        // Browsers may require a user gesture before audible playback.
        setIsPlaying(false);
      });
    };
    const unlockAudio = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-music-toggle]")) return;
      tryPlay();
    };

    audio.addEventListener("play", syncPlayingState);
    audio.addEventListener("pause", syncPlayingState);
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("touchstart", unlockAudio, { passive: true });

    tryPlay();

    return () => {
      audio.removeEventListener("play", syncPlayingState);
      audio.removeEventListener("pause", syncPlayingState);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      wantsMusicRef.current = true;
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      wantsMusicRef.current = false;
      audio.pause();
    }
  };

  return (
    <>
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" aria-hidden />
      <button
        type="button"
        className={`${styles.corner} ${styles.btn} ${styles.sound}`}
        onClick={toggleMusic}
        aria-label={isPlaying ? "Turn background music off" : "Turn background music on"}
        aria-pressed={isPlaying}
        data-music-toggle
      >
        <span className={`${styles.eq} ${isPlaying ? "" : styles.muted}`} aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>{isPlaying ? "Music On" : "Music Off"}</span>
      </button>
    </>
  );
}
