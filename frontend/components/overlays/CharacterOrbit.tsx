"use client";

import { useEffect, useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./orbit.module.css";

/**
 * Section 2 — the six character cards.
 *
 * Real DOM <video> panels (autoplay · loop · muted · playsInline, object-fit
 * cover, no controls) orbit the central WebGL Doom model. As `signals.showcase`
 * scrubs, the ring rotates; each card eases to the front (large, bright, glowing)
 * then behind the model (small, dim, blurred). Depth is REAL: the wrapper creates
 * no stacking context, so each card's z-index straddles the transparent atmosphere
 * canvas (z3) — front cards (z4) over the model, back cards (z2) genuinely behind
 * it. Videos live in fixed DOM slots and only pause when the section is off-screen,
 * so they never restart, reload, or flicker while orbiting.
 */
interface Character {
  slug: string;
  name: string;
  desc: string;
}

// Identified from the uploaded clips. Names/copy are trivially editable here.
const CHARACTERS: Character[] = [
  {
    slug: "doom",
    name: "Doctor Doom",
    desc: "The iron-willed sovereign of Latveria — master of science and sorcery, bending every reality to his design.",
  },
  {
    slug: "blackpanther",
    name: "Black Panther",
    desc: "Wakanda's fearless protector, striking with the speed, precision, and fury of the panther goddess.",
  },
  {
    slug: "cyclops",
    name: "Cyclops",
    desc: "Field leader of the X-Men, unleashing devastating optic force with unshakable discipline and resolve.",
  },
  {
    slug: "mystique",
    name: "Mystique",
    desc: "The shape-shifting infiltrator who can wear any face — trusted by none, lethal in every form she takes.",
  },
  {
    slug: "gambit",
    name: "Gambit",
    desc: "The Ragin' Cajun — charging every card with explosive kinetic energy and every fight with reckless charm.",
  },
  {
    slug: "namor",
    name: "Namor",
    desc: "The winged sovereign of Talokan — as ancient as the deep and as merciless as the tide he commands.",
  },
];

const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function CharacterOrbit() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Guarantee muted inline playback (works around React not always reflecting the
  // `muted` attribute) so programmatic play() is never blocked by autoplay policy.
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
    });
  }, []);

  useRaf(() => {
    const s = signals.orbit; // cards rotation scrubbed on scroll
    const t = signals.time;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const N = CHARACTERS.length;
    const isMobile = vw <= 820;

    if (!isMobile) {
      // ── DESKTOP: Circular Orbit (only cards rotate, background is stable) ──
      const Rx = vw * 0.3; // horizontal orbit radius
      const Ry = vh * 0.15; // vertical tilt (front lower, back higher)
      const base = s * TAU * 0.85 + t * 0.045; // scroll rotates the ring + slow idle

      for (let i = 0; i < N; i++) {
        const vid = videoRefs.current[i];
        if (vid && vid.paused) vid.play().catch(() => {});

        const card = cardRefs.current[i];
        if (!card) continue;

        card.style.visibility = "visible";

        const theta = base + i * (TAU / N);
        const d = Math.cos(theta); // 1 = front, -1 = behind the model
        const depth01 = (d + 1) / 2; // 0 back .. 1 front
        const x = Math.sin(theta) * Rx;
        const y = d * Ry;
        const scale = lerp(0.6, 1.06, depth01);
        const rotY = -Math.sin(theta) * 12; // subtle turn

        card.style.transform =
          `translate(-50%, -50%) perspective(1100px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
          ` rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = lerp(0.32, 1, depth01).toFixed(3);
        // straddle the atmosphere/model canvas (z3): front over, back behind
        card.style.zIndex = d > 0 ? "4" : "2";
        // depth blur on the far cards
        card.style.filter = d < -0.05 ? `blur(${(-d * 3).toFixed(2)}px)` : "none";
        // green glow strongest on the front-most card
        card.style.setProperty("--glow", smoothstep(0.55, 1, depth01).toFixed(3));
      }
    } else {
      // ── MOBILE: 3D Helical Spiral ────────────────────────────────
      // Cards spiral vertically down across the screen while rotating in 3D.
      // Larger cards dominate the center and gracefully wind through the depth.
      const spiralSpeed = 0.3; // card cycles per showcase unit
      const base = s * spiralSpeed + t * 0.025;
      const Rx = vw * 0.22; // horizontal spiral swing
      const Yrange = vh * 0.72; // vertical span of the spiral (top to bottom)
      const turns = 1.35; // turns from top entry to bottom exit

      for (let i = 0; i < N; i++) {
        const card = cardRefs.current[i];
        const vid = videoRefs.current[i];
        if (!card) continue;

        // Progress along spiral: 0 (top entry) → 1 (bottom exit)
        const rawP = base + i / N;
        const p = rawP - Math.floor(rawP);
        const u = p - 0.5; // -0.5 (top) .. 0 (center) .. +0.5 (bottom)

        // Smooth fade-in near top, fade-out near bottom
        const fadeIn = smoothstep(0.01, 0.16, p);
        const fadeOut = 1 - smoothstep(0.84, 0.99, p);
        const envelope = fadeIn * fadeOut;

        if (envelope <= 0.005) {
          if (card.style.visibility !== "hidden") card.style.visibility = "hidden";
          if (vid && !vid.paused) vid.pause();
          continue;
        }
        card.style.visibility = "visible";

        if (vid && vid.paused) vid.play().catch(() => {});

        // Helical spiral math:
        // Angle winds as u travels from -0.5 to +0.5
        const theta = u * turns * TAU;
        const d = Math.cos(theta); // 1 = facing front, -1 = facing back
        const depth01 = (d + 1) / 2;

        // Variable radius: tighter at the extremes, wider when swinging
        const radFactor = 1 - Math.abs(u) * 0.25;
        const x = Math.sin(theta) * Rx * radFactor;
        const y = u * Yrange;

        // Scale: center card is prominent (1.05x), receding cards shrink
        const centerProximity = 1 - Math.abs(u) * 1.5;
        const scale = lerp(0.62, 1.05, clamp01(centerProximity * (0.55 + 0.45 * depth01)));

        // 3D rotations: bank into the turn, tilt along spiral ascent
        const rotY = -Math.sin(theta) * 20;
        const rotX = -u * 16;
        const rotZ = Math.sin(theta) * 4.5;

        card.style.transform =
          `translate(-50%, -50%) perspective(950px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
          ` rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

        card.style.opacity = (lerp(0.35, 1, depth01) * envelope).toFixed(3);

        // Z-Index: center card on top (5), front cards (4), back cards (2)
        card.style.zIndex = d > 0.75 ? "5" : d > 0 ? "4" : "2";

        // Blur for cards deep behind
        card.style.filter = d < -0.1 ? `blur(${((-d - 0.1) * 3.5).toFixed(2)}px)` : "none";

        // Glow strongest at center
        card.style.setProperty("--glow", smoothstep(0.5, 1, depth01 * envelope).toFixed(3));
      }
    }
  });

  return (
    <div className={styles.layer} aria-hidden>
      {CHARACTERS.map((c, i) => (
        <div
          key={c.slug}
          className={styles.card}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          style={{ visibility: "hidden" }}
        >
          <video
            ref={(el) => {
              if (el) {
                el.muted = true;
                el.playsInline = true;
              }
              videoRefs.current[i] = el;
            }}
            className={styles.video}
            src={`/videos/char-${c.slug}.mp4`}
            poster={`/videos/char-${c.slug}-poster.jpg`}
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
          />
          <div className={styles.grad} />
          <div className={styles.frame} />
          <div className={styles.tick}>
            <span className={styles.dot} />
            {`0${i + 1} · Doomsday`}
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{c.name}</div>
            <div className={styles.desc}>{c.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
