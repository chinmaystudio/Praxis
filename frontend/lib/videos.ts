"use client";

import { ASSETS } from "./constants";

/**
 * Video helpers for the DOM-rendered trailers. The trailers are REAL fullscreen
 * `<video>` elements (see components/overlays/VideoLayer) — never WebGL textures
 * — so they are guaranteed to display. They are never played: scroll sets
 * `currentTime` (all-intra encoding makes every seek instant).
 */

export const VIDEO_META = {
  marvel: { src: ASSETS.marvelVideo, poster: ASSETS.marvelPoster, aspect: 1180 / 490 },
  hero: { src: ASSETS.heroVideo, poster: ASSETS.heroPoster, aspect: 1770 / 742 },
  finale: { src: ASSETS.finaleVideo, poster: ASSETS.finalePoster, aspect: 1180 / 486 },
} as const;

/**
 * Registry of the live `<video>` elements (set by VideoLayer). The scroll
 * handler reads them to seek + fade synchronously on the scroll event, so the
 * video responds even if the rAF loop is throttled.
 */
type Which = "marvel" | "hero" | "finale";
const els: Record<Which, HTMLVideoElement | null> = { marvel: null, hero: null, finale: null };
export function setVideoEl(which: Which, el: HTMLVideoElement | null) {
  els[which] = el;
}
export function getVideoEl(which: Which) {
  return els[which];
}

/** Warm the decoder with a muted play→pause so the first seeked frame paints. */
export function primeElement(el: HTMLVideoElement | null) {
  if (!el) return;
  try {
    el.muted = true;
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.then(() => el.pause()).catch(() => {});
    } else {
      el.pause();
    }
  } catch {
    /* noop */
  }
}

/** Seek a scrubbed video, skipping micro-moves that would thrash the decoder. */
export function scrubEl(el: HTMLVideoElement | null, t: number) {
  if (!el || el.readyState < 1) return;
  const dur = el.duration || 1;
  const clamped = Math.max(0, Math.min(dur - 0.03, t));
  if (Math.abs(el.currentTime - clamped) > 0.008) {
    el.currentTime = clamped;
  }
}
