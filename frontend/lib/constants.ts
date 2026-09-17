/**
 * AVENGERS: DOOMSDAY — global design + timing constants.
 *
 * The experience is entirely SCROLL-DRIVEN. Nothing auto-plays: scroll position
 * scrubs both trailers frame-by-frame and drives every cinematic event through
 * a single scrubbed GSAP/ScrollTrigger master. Tuning lives here.
 */

/** Cinematic palette — pure black voids, toxic Doom greens, metallic highlights. */
export const COLORS = {
  black: "#000000",
  graphite: "#07090b",
  ink: "#04140f",
  green: "#00ff9c",
  greenDeep: "#00b473",
  greenDark: "#083b2a",
  emerald: "#12855b",
  mint: "#9dffd6",
  core: "#e6fff4",
  white: "#eafff6",
  silver: "#aebbb5",
} as const;

export const HEX = {
  green: 0x00ff9c,
  greenDeep: 0x00b473,
  greenDark: 0x083b2a,
  emerald: 0x12855b,
  mint: 0x9dffd6,
  core: 0xe6fff4,
} as const;

/** Asset locations (served from /public). Videos are all-intra for scrubbing. */
export const ASSETS = {
  marvelVideo: "/videos/marvel-intro-seq.mp4",
  marvelPoster: "/videos/marvel-intro-poster.jpg",
  // New user-uploaded Hero trailer (landscape ~2.39:1) — fills with object-fit:cover.
  heroVideo: "/videos/hero-seq-v2.mp4",
  heroPoster: "/videos/hero-poster-v2.jpg",
  // Section 5 ending (Thor → Doom → Captain America) — scroll-scrubbed, all-intra.
  // Swap this one file to update the ending; nothing else needs to change.
  finaleVideo: "/videos/finale-seq.mp4",
  finalePoster: "/videos/finale-poster.jpg",
  // Section 6 — the MCU timeline artwork (tall; scroll-panned).
  timelineImg: "/story/timeline.jpg",
  // Section 7 — the AVENGERS DOOMSDAY title reveal (autoplay + loop).
  titleVideo: "/videos/title-reveal.mp4",
  titlePoster: "/videos/title-reveal-poster.jpg",
} as const;

/** Approx durations (s); refined from real metadata at runtime. */
export const VIDEO = {
  marvelDur: 5.35,
  heroDur: 10.67,
  finaleDur: 23.9,
} as const;

/**
 * Scroll section heights (in vh) — the total scroll distance the scrub spans.
 * Bigger = more scroll per second of footage = a more deliberate, frame-by-
 * frame feel.
 */
export const SCROLL = {
  introAtmos: 140, // Section 1 — the void + storm builds
  marvelScrub: 240, // Section 1 — Marvel intro scrubs
  transition: 140, // continuous portal dive into the Hero
  heroText: 260, // Hero — cinematic text sequence (video hidden)
  heroScrub: 340, // Hero — Doom video appears fullscreen + scrubs
  heroOutro: 80, // Hero settle
  // ── Phase 2 · Section 2 (character showcase) ──
  showcaseRise: 160, // Hero fades / Section 2 rises from the bottom, model appears
  showcaseOrbit: 360, // the 6 cards orbit the model, active card cycles to front
  showcaseOut: 70, // settle
  // ── Phase 3 · Section 3 (cinematic story stack) ──
  storyStack: 660, // 6 fullscreen panels rise + stack sequentially (pinned)
  // ── Phase 4 · Section 4 (horizontal cinematic timeline) ──
  reelStrip: 680, // pinned; vertical scroll drives the strip right→left
  // ── Phase 5 · Section 5 (scroll-scrubbed battle: Thor → Doom → Cap) ──
  finaleScrub: 760, // the battle video scrubs frame-by-frame with scroll
  // ── Ending · Section 6 (MCU timeline artwork) + 7 (title reveal) + footer ──
  mcuPan: 560, // the tall MCU timeline pans vertically with scroll
  titleHold: 300, // the AVENGERS DOOMSDAY title reveal autoplays/holds
  footerReveal: 150, // the minimal footer rises at the very end
} as const;

/**
 * Total scroll distance (vh) and the equivalent master-timeline length in units
 * (100vh = 1 unit). Derived from SCROLL so the two never drift — the timeline's
 * total AND the scroll→time mapping both come from here, which keeps every
 * scroll-positioned cue (e.g. the cinematic text beats) locked to its moment
 * even as sections are added.
 */
export const SCROLL_VH_TOTAL = Object.values(SCROLL).reduce((a, b) => a + b, 0);
export const TIMELINE_UNITS = SCROLL_VH_TOTAL / 100;

export type Phase = "loading" | "intro" | "hero";
