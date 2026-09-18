"use client";

import { useRef, useState } from "react";
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
interface EventCard {
  slug: string;
  title: string;
  theme: string;
  desc: string;
  image: string;
  rulebook: string;
  downloadName: string;
  accent: string;
}

const EVENTS: EventCard[] = [
  {
    slug: "infinity-trials",
    title: "Infinity Trials",
    theme: "Infinity War",
    desc: "Face a cosmic challenge where strategy, speed, and teamwork decide who is worthy of the stones.",
    image: "/events/infinity-trials.png",
    rulebook: "/rulebooks/infinity-trials-rulebook.pdf",
    downloadName: "Infinity-Trials-Rulebook.pdf",
    accent: "#f2b84b",
  },
  {
    slug: "research-x",
    title: "Research X",
    theme: "Thor",
    desc: "Channel thunderous ideas into a sharp research showcase built around insight, evidence, and impact.",
    image: "/events/research-x.png",
    rulebook: "/rulebooks/research-x-rulebook.pdf",
    downloadName: "Research-X-Rulebook.pdf",
    accent: "#65cfff",
  },
  {
    slug: "bgmi-elite-showdown",
    title: "BGMI Elite Showdown",
    theme: "Captain America",
    desc: "Enter the battleground with disciplined teamwork, tactical precision, and the resolve to hold the line.",
    image: "/events/bgmi-elite-showdown.png",
    rulebook: "/rulebooks/bgmi-elite-showdown-rulebook.pdf",
    downloadName: "BGMI-Elite-Showdown-Rulebook.pdf",
    accent: "#ff4458",
  },
  {
    slug: "tech-roulette",
    title: "Tech Roulette",
    theme: "Iron Man",
    desc: "A three-round technical showdown combining sustainability knowledge, rapid prototyping, and high-pressure solution pitching.",
    image: "/events/tech-roulette.png",
    rulebook: "/rulebooks/tech-roulette-rulebook.docx",
    downloadName: "Tech-Roulette-Rulebook.docx",
    accent: "#35d9ff",
  },
  {
    slug: "storyverse",
    title: "StoryVerse",
    theme: "Doctor Strange Multiverse",
    desc: "Transform an AI-generated story video into an interactive browser game across two connected creative rounds.",
    image: "/events/storyverse.png",
    rulebook: "/rulebooks/storyverse-rulebook.docx",
    downloadName: "StoryVerse-Rulebook.docx",
    accent: "#ff9f3f",
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
  const [activeEvent, setActiveEvent] = useState<EventCard | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState(false);

  useRaf(() => {
    const s = signals.orbit;
    const t = signals.time;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const N = EVENTS.length;
    const isMobile = vw <= 820;

    if (!isMobile) {
      const Rx = vw * 0.3;
      const Ry = vh * 0.15;
      const base = s * TAU * 0.85 + t * 0.045;

      for (let i = 0; i < N; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;

        card.style.visibility = "visible";
        const theta = base + i * (TAU / N);
        const d = Math.cos(theta);
        const depth01 = (d + 1) / 2;
        const x = Math.sin(theta) * Rx;
        const y = d * Ry;
        const scale = lerp(0.6, 1.06, depth01);
        const rotY = -Math.sin(theta) * 12;

        card.style.transform =
          `translate(-50%, -50%) perspective(1100px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
          ` rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = lerp(0.32, 1, depth01).toFixed(3);
        card.style.zIndex = d > 0 ? "4" : "2";
        card.style.pointerEvents = d > 0.35 ? "auto" : "none";
        card.style.filter = d < -0.05 ? `blur(${(-d * 3).toFixed(2)}px)` : "none";
        card.style.setProperty("--glow", smoothstep(0.55, 1, depth01).toFixed(3));
      }
      return;
    }

    const base = s * 0.3 + t * 0.025;
    const Rx = vw * 0.22;
    const yRange = vh * 0.72;
    const turns = 1.35;

    for (let i = 0; i < N; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;

      const p = (base + i / N) % 1;
      const u = p - 0.5;
      const envelope = smoothstep(0.01, 0.16, p) * (1 - smoothstep(0.84, 0.99, p));

      if (envelope <= 0.005) {
        card.style.visibility = "hidden";
        card.style.pointerEvents = "none";
        continue;
      }

      const theta = u * turns * TAU;
      const d = Math.cos(theta);
      const depth01 = (d + 1) / 2;
      const x = Math.sin(theta) * Rx * (1 - Math.abs(u) * 0.25);
      const y = u * yRange;
      const centerProximity = 1 - Math.abs(u) * 1.5;
      const scale = lerp(0.62, 1.05, clamp01(centerProximity * (0.55 + 0.45 * depth01)));
      const rotY = -Math.sin(theta) * 20;
      const rotX = -u * 16;
      const rotZ = Math.sin(theta) * 4.5;

      card.style.visibility = "visible";
      card.style.transform =
        `translate(-50%, -50%) perspective(950px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)` +
        ` rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = (lerp(0.35, 1, depth01) * envelope).toFixed(3);
      card.style.zIndex = d > 0.75 ? "5" : d > 0 ? "4" : "2";
      card.style.pointerEvents = d > 0.35 ? "auto" : "none";
      card.style.filter = d < -0.1 ? `blur(${((-d - 0.1) * 3.5).toFixed(2)}px)` : "none";
      card.style.setProperty("--glow", smoothstep(0.5, 1, depth01 * envelope).toFixed(3));
    }
  });

  return (
    <div className={styles.layer}>
      {EVENTS.map((event, i) => (
        <div
          key={event.slug}
          className={styles.card}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          tabIndex={0}
          style={{ visibility: "hidden", "--accent": event.accent } as React.CSSProperties}
        >
          <img className={styles.poster} src={event.image} alt="" />
          <div className={styles.grad} />
          <div className={styles.frame} />
          <div className={styles.namePlate}>
            <div className={styles.name}>{event.title}</div>
          </div>
          <div className={styles.info}>
            <div className={styles.name}>{event.title}</div>
            <div className={styles.desc}>{event.desc}</div>
            <div className={styles.actions}>
              <button className={styles.exploreButton} type="button" onClick={() => { setActiveEvent(event); setRegistrationMessage(false); }}>
                Explore <span aria-hidden="true">↗</span>
              </button>
              <a className={styles.rulebookButton} href={event.rulebook} download={event.downloadName}>
                View Rulebook <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
      ))}

      {activeEvent && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => { setActiveEvent(null); setRegistrationMessage(false); }}>
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            style={{ "--accent": activeEvent.accent } as React.CSSProperties}
            onClick={(event) => event.stopPropagation()}
          >
            <img className={styles.modalPoster} src={activeEvent.image} alt="" />
            <div className={styles.modalShade} />
            <button className={styles.closeButton} type="button" aria-label="Close event details" onClick={() => { setActiveEvent(null); setRegistrationMessage(false); }}>×</button>
            <div className={styles.modalContent}>
              <div className={styles.modalTheme}>{activeEvent.theme}</div>
              <h2 id="event-dialog-title" className={styles.modalTitle}>{activeEvent.title}</h2>
              <p className={styles.modalDescription}>{activeEvent.desc}</p>
              <div className={styles.modalActions}>
                <button className={styles.registerButton} type="button" onClick={() => setRegistrationMessage(true)}>
                  Register <span aria-hidden="true">↗</span>
                </button>
                <a className={styles.modalDownload} href={activeEvent.rulebook} download={activeEvent.downloadName}>
                  Download Rulebook <span aria-hidden="true">↓</span>
                </a>
              </div>
              {registrationMessage && <p className={styles.registrationMessage} role="status">Registration link coming soon.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
