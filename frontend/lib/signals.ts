/**
 * Per-frame signal bus.
 *
 * These values change every frame (mouse, camera shake, energy ramps) and are
 * read inside `useFrame` / rAF loops. Keeping them in a plain mutable singleton
 * — instead of React/zustand state — means zero re-renders in the hot path.
 * GSAP tweens write directly onto this object; the WebGL scene reads from it.
 */
export interface Signals {
  time: number;
  // Pointer — smoothed (-1..1) and raw target (-1..1)
  mx: number;
  my: number;
  mtx: number;
  mty: number;
  // Pointer in a loose world space, handy for lights following the cursor
  mwx: number;
  mwy: number;
  // Impulse channels (decay every frame)
  shake: number;
  flash: number;
  // Ramps driven by the scrubbed master (0..1)
  energy: number;
  portal: number;
  dolly: number;
  reveal: number;
  bgBlur: number;
  collapse: number;
  scroll: number;
  shatter: number;
  // Scroll-scrubbed video playheads (seconds) + plane opacities (0..1)
  marvelT: number;
  heroT: number;
  marvelOp: number;
  heroOp: number;
  header: number; // website chrome reveal (0..1)
  showcase: number; // Section 2 (character showcase) progress (0..1)
  story: number; // Section 3 (story-stack) progress (0..1)
  reel: number; // Section 4 (horizontal cinematic timeline) progress (0..1)
  finale: number; // Section 5 (scroll-scrubbed battle) opacity/reveal (0..1)
  finaleT: number; // Section 5 scroll-scrubbed video playhead (seconds)
  mcu: number; // Section 6 (MCU timeline image) vertical scroll-pan (0..1)
  title: number; // Section 7 (AVENGERS DOOMSDAY title reveal video) reveal (0..1)
  footer: number; // footer reveal (0..1)
  // Housekeeping
  strikeSeq: number;
  lastStrike: number;
}

export const signals: Signals = {
  time: 0,
  mx: 0,
  my: 0,
  mtx: 0,
  mty: 0,
  mwx: 0,
  mwy: 0,
  shake: 0, // camera shake amount
  flash: 0, // additive screen flash from strikes
  energy: 0, // storm intensity — drives lightning cadence + fog glow
  portal: 0, // portal open amount
  dolly: 0, // camera forward push (dive / scroll)
  reveal: 0, // final title assembly
  bgBlur: 0, // background defocus behind the hero title
  collapse: 0, // fracture / freeze amount
  scroll: 0, // normalized scroll (0..1)
  shatter: 0, // unused in the scroll build
  marvelT: 0,
  heroT: 0,
  marvelOp: 0,
  heroOp: 0,
  header: 0,
  showcase: 0,
  story: 0,
  reel: 0,
  finale: 0,
  finaleT: 0,
  mcu: 0,
  title: 0,
  footer: 0,
  strikeSeq: 0,
  lastStrike: -999,
};

export type StrikeDetail = {
  /** normalized screen x/y (-1..1) where the bolt roots */
  x: number;
  y: number;
  /** 0..1 power — scales shake, screen flash and glow */
  power: number;
  /** true for the single enormous detonation in Scene 04 */
  mega?: boolean;
};

/** Decoupled event bus so lightning / sparks / camera all react to one strike. */
export const bus =
  typeof EventTarget !== "undefined" ? new EventTarget() : null;

/** Fire a lightning strike everything else can subscribe to. */
export function emitStrike(detail: StrikeDetail) {
  signals.strikeSeq += 1;
  signals.lastStrike = signals.time;
  // Impulse into the shared channels — read + decayed by the render loop.
  signals.shake = Math.min(1.4, signals.shake + detail.power * (detail.mega ? 1.4 : 0.7));
  signals.flash = Math.min(0.95, signals.flash + detail.power * (detail.mega ? 0.9 : 0.32));
  bus?.dispatchEvent(new CustomEvent<StrikeDetail>("strike", { detail }));
}

export function onStrike(fn: (d: StrikeDetail) => void) {
  if (!bus) return () => {};
  const handler = (e: Event) => fn((e as CustomEvent<StrikeDetail>).detail);
  bus.addEventListener("strike", handler);
  return () => bus.removeEventListener("strike", handler);
}

/** Generic one-shot cue bus (detonation, portal, reveal, shatter …). */
export function emitCue(name: string, detail?: unknown) {
  bus?.dispatchEvent(new CustomEvent(name, { detail }));
}
export function onCue(name: string, fn: (detail: unknown) => void) {
  if (!bus) return () => {};
  const handler = (e: Event) => fn((e as CustomEvent).detail);
  bus.addEventListener(name, handler);
  return () => bus.removeEventListener(name, handler);
}
