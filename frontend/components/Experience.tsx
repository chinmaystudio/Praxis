"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useLenis } from "@/lib/useLenis";
import { signals } from "@/lib/signals";
import { getVideoEl, scrubEl, primeElement } from "@/lib/videos";
import { VIDEO, SCROLL } from "@/lib/constants";

import CinematicCanvas from "@/components/webgl/CinematicCanvas";
import VideoLayer from "@/components/overlays/VideoLayer";
import FlashOverlay from "@/components/overlays/FlashOverlay";
import CinematicText from "@/components/overlays/CinematicText";
import ScrollCue from "@/components/ui/ScrollCue";
import SiteHeader from "@/components/ui/SiteHeader";
import HeroOverlay from "@/components/ui/HeroOverlay";
import PraxisFooter from "@/components/ui/PraxisFooter";

/**
 * The director — scroll opens directly into the Hero.
 *
 * A single scrubbed GSAP ScrollTrigger master drives:
 *   1. signals.header — the site header slides in immediately
 *   2. signals.heroOp — the Doom trailer fades in after the text sequence
 *   3. signals.heroT  — the trailer scrubs frame-by-frame with scroll
 *
 * The page ends at the bottom of the hero video. Clicking "Explore Events"
 * in the HeroOverlay navigates to /events where the CharacterOrbit runs
 * infinitely.
 */
export default function Experience() {
  const [mounted, setMounted] = useState(false);
  useLenis();
  const trackRef = useRef<HTMLDivElement>(null);
  const builtRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // ── pointer tracking + video decoder priming ──────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      signals.mtx = (e.clientX / window.innerWidth) * 2 - 1;
      signals.mty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Re-prime the hero trailer on the first gesture so scrubbing always
    // paints real frames. (The experience is completely silent.)
    let started = false;
    const onGesture = () => {
      if (started) return;
      started = true;
      primeElement(getVideoEl("hero"));
    };
    const evs = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const;
    evs.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));

    return () => {
      window.removeEventListener("pointermove", onMove);
      evs.forEach((e) => window.removeEventListener(e, onGesture));
    };
  }, []);

  // ── scroll-scrubbed master ──────────────────────────────────────
  useEffect(() => {
    if (!mounted || builtRef.current || !trackRef.current) return;
    builtRef.current = true;

    // ── Timeline positions (units; 100vh = 1 unit) — hero only ──
    const heroText  = SCROLL.heroText  / 100; // 2.6
    const heroScrub = SCROLL.heroScrub / 100; // 7.2
    const heroOutro = SCROLL.heroOutro / 100; // 0.8
    const TOTAL = heroText + heroScrub + heroOutro; // 10.6

    const T = {
      videoStart: heroText,             // 2.6 — trailer appears
      videoEnd:   heroText + heroScrub, // 9.8 — trailer fully scrubbed
      total:      TOTAL,                // 10.6
    };

    // Initialise signals cleanly.
    signals.energy  = 0.15;
    signals.header  = 0;
    signals.heroOp  = 0;
    signals.heroT   = 0;
    signals.footer  = 0;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: trackRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          signals.scroll = self.progress;
          // Drive the hero trailer synchronously on the scroll event —
          // never rAF-throttled: fade + frame-accurate seek.
          const hero = getVideoEl("hero");
          if (hero) {
            hero.style.opacity = signals.heroOp.toFixed(3);
            if (signals.heroOp > 0.002) scrubEl(hero, signals.heroT);
          }
        },
      },
    });

    // ── Header slides in at the start ────────────────────────────
    tl.to(signals, { header: 1, duration: 0.4 }, 0);

    // ── Hero text sequence: atmosphere, no video yet ──────────────
    tl.to(signals, { energy: 0.15, duration: heroText }, 0);

    // ── Doom trailer appears + scrubs ─────────────────────────────
    tl.to(signals, { heroOp: 1, duration: 0.3, ease: "power2.out" }, T.videoStart);
    tl.to(signals, { energy: 0.15, duration: 0.6 }, T.videoStart);
    tl.to(signals, { heroT: VIDEO.heroDur, duration: T.videoEnd - T.videoStart }, T.videoStart);
    tl.to(signals, { energy: 0.13, duration: 0.8 }, T.videoEnd);

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Record<string, unknown>).__doom = { signals, tl };
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      builtRef.current = false;
    };
  }, [mounted]);

  // Scroll track spans only the hero section (1060vh).
  const heroVh = SCROLL.heroText + SCROLL.heroScrub + SCROLL.heroOutro;

  return (
    <>
      <div className="stage">
        {/* real fullscreen <video> trailer (z-index 1) */}
        <VideoLayer />
        {/* transparent green atmosphere on top (z-index 3) */}
        {mounted && <CinematicCanvas />}
        <FlashOverlay />
        <CinematicText />
      </div>

      <SiteHeader />
      <HeroOverlay />
      <ScrollCue />

      {/* invisible scroll track — hero text sequence + video */}
      <div className="scroll-track" ref={trackRef} aria-hidden>
        <section style={{ height: `${heroVh}vh` }} aria-label="Hero" />
      </div>

      {/* ── Separate Dedicated Praxis Footer Section ────────────── */}
      <PraxisFooter />
    </>
  );
}
