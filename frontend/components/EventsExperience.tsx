"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/lib/useLenis";
import { signals } from "@/lib/signals";
import CharacterOrbit from "@/components/overlays/CharacterOrbit";
import FlashOverlay from "@/components/overlays/FlashOverlay";
import CinematicCanvas from "@/components/webgl/CinematicCanvas";
import styles from "./events.module.css";

/**
 * Events page — the six character cards orbit the central model, driven by
 * scroll exactly like on the main page but here the orbit is the whole
 * experience.
 *
 * signals.showcase is scrubbed from 0.5 → 12 over 1200 vh of scroll:
 *   • 0.5  — all 6 cards have completed their fly-in (fully visible on load)
 *   • TAU × 0.85 ≈ 5.34 units per visual rotation
 *   • delta = 11.5 units ≈ 2.15 full rotations as the user scrolls down
 *
 * The idle time-drift (t × 0.045 in CharacterOrbit) keeps the ring gently
 * floating even when the user pauses.
 */
export default function EventsExperience() {
  const [mounted, setMounted] = useState(false);
  useLenis();
  const trackRef = useRef<HTMLDivElement>(null);
  const builtRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Background 3D model and atmosphere are stable and active
    signals.showcase = 1.0;
    signals.energy   = 0.22;
    signals.orbit    = 0;
    signals.footer   = 0;
    signals.scroll   = 0;
    signals.heroOp   = 0;
    signals.header   = 0;
  }, []);

  // Pointer tracking for subtle ambient parallax
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      signals.mtx = (e.clientX / window.innerWidth) * 2 - 1;
      signals.mty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Scroll-scrubbed cards rotation ONLY (background remains completely stable)
  useEffect(() => {
    if (!mounted || builtRef.current || !trackRef.current) return;
    builtRef.current = true;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: trackRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          signals.scroll = self.progress;
        },
      },
    });

    // Only scrub signals.orbit — cards rotate smoothly, background is locked
    tl.fromTo(signals, { orbit: 0 }, { orbit: 12, ease: "none", duration: 1 }, 0);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      signals.orbit = 0;
      signals.showcase = 0;
      builtRef.current = false;
    };
  }, [mounted]);

  return (
    <>
      {/* Fixed full-viewport stage — same pattern as the main page */}
      <div className="stage">
        <CharacterOrbit />
        {mounted && <CinematicCanvas />}
        <FlashOverlay />
      </div>

      {/* Top navigation bar */}
      <header className={styles.bar}>
        <Link href="/" className={styles.back} aria-label="Back to main experience">
          <span className={styles.backArrow} aria-hidden>←</span>
          Back
        </Link>
        <div className={styles.title}>
          <span className={styles.titleMark} aria-hidden />
          <span className={styles.titleText}>
            MARVEL<b>STUDIOS</b>
          </span>
        </div>
        <span className={styles.label}>Avengers · Doomsday</span>
      </header>

      {/* Bottom kicker */}
      <div className={styles.kicker} aria-hidden>
        <span className={styles.kickerDot} />
        <span>Character Showcase</span>
        <span className={styles.kickerSep}>·</span>
        <span className={styles.kickerSub}>Scroll to rotate</span>
      </div>

      {/* Invisible scroll track — drives the orbit (1200 vh ≈ 2 full rotations) */}
      <div className="scroll-track" ref={trackRef} aria-hidden>
        <section style={{ height: "1200vh" }} aria-label="Character Orbit" />
      </div>
    </>
  );
}
