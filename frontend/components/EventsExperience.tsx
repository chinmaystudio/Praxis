"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import CharacterOrbit from "@/components/overlays/CharacterOrbit";
import FlashOverlay from "@/components/overlays/FlashOverlay";
import CinematicCanvas from "@/components/webgl/CinematicCanvas";
import styles from "./events.module.css";

/**
 * The Events experience — a standalone full-screen page where the six
 * character cards orbit the central Doom model infinitely, driven by time
 * alone (no scroll). Clicking "Back" returns to the hero page.
 */
export default function EventsExperience() {
  const [mounted, setMounted] = useState(false);
  // Track pointer for the WebGL atmosphere parallax
  const onMove = useRef<((e: PointerEvent) => void) | null>(null);

  useEffect(() => {
    setMounted(true);

    // Initialise signals so the atmosphere and orbit are immediately active.
    signals.showcase = 1;
    signals.energy   = 0.22;
    signals.scroll   = 0;
    signals.heroOp   = 0;
    signals.header   = 0;
    signals.reel     = 0;
    signals.story    = 0;
    signals.finale   = 0;
    signals.mcu      = 0;
    signals.title    = 0;
    signals.footer   = 0;

    onMove.current = (e: PointerEvent) => {
      signals.mtx = (e.clientX / window.innerWidth) * 2 - 1;
      signals.mty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove.current, { passive: true });

    return () => {
      if (onMove.current) window.removeEventListener("pointermove", onMove.current);
      // Reset showcase so the main page orbit starts cleanly if the user navigates back.
      signals.showcase = 0;
    };
  }, []);

  return (
    <div className={styles.root}>
      {/* Full-screen orbit + atmosphere */}
      <div className="stage">
        <CharacterOrbit autoRotate />
        {mounted && <CinematicCanvas />}
        <FlashOverlay />
      </div>

      {/* Minimal top bar */}
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
        <span className={styles.kickerSub}>Scroll to navigate</span>
      </div>
    </div>
  );
}
