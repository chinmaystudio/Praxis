"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import { EVENTS, type EventConfig, formatPrice } from "@/lib/events";
import RegistrationModal from "@/components/registration/RegistrationModal";
import styles from "./orbit.module.css";

const TAU = Math.PI * 2;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function CharacterOrbit() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventConfig | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<EventConfig | null>(null);

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
      {EVENTS.map((event, i) => {
        const isBgmi = event.slug === "bgmi-elite-showdown";
        const isResearchX = event.slug === "research-x";
        const isInteractiveCard = isBgmi || isResearchX;
        return (
          <div
            key={event.slug}
            className={`${styles.card} ${isInteractiveCard ? styles.clickableCard : ""}`}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            tabIndex={0}
            style={{ visibility: "hidden", "--accent": event.accent } as React.CSSProperties}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest(`.${styles.rulebookButton}`) || (e.target as HTMLElement).closest(`.${styles.exploreButton}`)) {
                return;
              }
              if (isBgmi) {
                window.location.href = "/events/bgmi-elite-showdown";
              } else if (isResearchX) {
                window.location.href = "/events/research-x";
              }
            }}
            onKeyDown={(e) => {
              if (isInteractiveCard && (e.key === "Enter" || e.key === " ")) {
                if (!(e.target as HTMLElement).closest(`.${styles.rulebookButton}`) && !(e.target as HTMLElement).closest(`.${styles.exploreButton}`)) {
                  e.preventDefault();
                  if (isBgmi) {
                    window.location.href = "/events/bgmi-elite-showdown";
                  } else if (isResearchX) {
                    window.location.href = "/events/research-x";
                  }
                }
              }
            }}
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
                <button
                  className={styles.exploreButton}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveEvent(event);
                  }}
                >
                  Explore <span aria-hidden="true">↗</span>
                </button>
                <a className={styles.rulebookButton} href={event.rulebook} download={event.downloadName}>
                  View Rulebook <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        );
      })}

      {activeEvent && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setActiveEvent(null)}>
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
            <button className={styles.closeButton} type="button" aria-label="Close event details" onClick={() => setActiveEvent(null)}>×</button>
            <div className={styles.modalContent}>
              <div className={styles.modalTheme}>
                {activeEvent.theme}
                <span className={styles.modalPrice}>Entry: {formatPrice(activeEvent.price)}</span>
              </div>
              <h2 id="event-dialog-title" className={styles.modalTitle}>{activeEvent.title}</h2>
              <p className={styles.modalDescription}>{activeEvent.desc}</p>
              <div className={styles.modalActions}>
                {activeEvent.slug === "infinity-trials" && (
                  <Link className={styles.exploreButton} href="/events/infinity-trials?intro=1">
                    Explore <span aria-hidden="true">↗</span>
                  </Link>
                )}
                {activeEvent.slug === "research-x" && (
                  <Link className={styles.exploreButton} href="/events/research-x">
                    Enter ResearchX <span aria-hidden="true">↗</span>
                  </Link>
                )}
                {activeEvent.slug === "bgmi-elite-showdown" && (
                  <Link className={styles.exploreButton} href="/events/bgmi-elite-showdown">
                    Enter Showdown <span aria-hidden="true">↗</span>
                  </Link>
                )}
                <button
                  className={styles.registerButton}
                  type="button"
                  onClick={() => setRegisteringEvent(activeEvent)}
                >
                  Register · {formatPrice(activeEvent.price)} <span aria-hidden="true">↗</span>
                </button>
                <a className={styles.modalDownload} href={activeEvent.rulebook} download={activeEvent.downloadName}>
                  Download Rulebook <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {registeringEvent && (
        <RegistrationModal
          event={registeringEvent}
          isOpen={Boolean(registeringEvent)}
          onClose={() => setRegisteringEvent(null)}
        />
      )}
    </div>
  );
}
