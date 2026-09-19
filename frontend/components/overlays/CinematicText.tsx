"use client";

import { useRef } from "react";
import Link from "next/link";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./cinematic.module.css";

/* ══════════════════════════════════════════════════════════════
   1. INITIAL CINEMATIC HERO BEATS (Plays before the video)
   ══════════════════════════════════════════════════════════════ */
interface InitialBeat {
  id: string;
  lines: string[];
  kicker: string;
  variant: "rise" | "loom" | "metallic";
  start: number;
  end: number;
}

const INITIAL_BEATS: InitialBeat[] = [
  {
    id: "threat",
    lines: ["A NEW THREAT"],
    kicker: "I",
    variant: "rise",
    start: 0.035,
    end: 0.095,
  },
  {
    id: "coming",
    lines: ["THEY ARE COMING"],
    kicker: "II",
    variant: "loom",
    start: 0.10,
    end: 0.165,
  },
  {
    id: "legends",
    lines: ["ONLY LEGENDS REMAIN"],
    kicker: "III",
    variant: "metallic",
    start: 0.17,
    end: 0.235,
  },
];

/* ══════════════════════════════════════════════════════════════
   2. ALTERNATING STORY BEATS (Plays during video section)
   Laid out strictly ONE BELOW OTHER with alternating Left/Right alignment
   ══════════════════════════════════════════════════════════════ */
interface StoryBeat {
  id: string;
  number: string;
  side: "left" | "right";
  title: string;
  subtitle?: string;
  lines: string[];
  cta?: {
    text: string;
    href: string;
  };
}

const STORY_BEATS: StoryBeat[] = [
  {
    id: "beat-01",
    number: "01 — LEFT",
    side: "left",
    title: "THIS IS PRAXIS.",
    lines: [
      "Where ideas leave the screen",
      "and enter the arena.",
    ],
  },
  {
    id: "beat-02",
    number: "02 — RIGHT",
    side: "right",
    title: "NOT JUST AN EVENT.",
    lines: [
      "A collision of technology,",
      "creativity, competition, and culture.",
    ],
  },
  {
    id: "beat-03",
    number: "03 — LEFT",
    side: "left",
    title: "THINK. BUILD. COMPETE.",
    lines: [
      "Challenge what you know.",
      "Create what doesn't exist.",
      "Prove what you're capable of.",
    ],
  },
  {
    id: "beat-04",
    number: "04 — RIGHT",
    side: "right",
    title: "EVERY CHALLENGE HAS A DIFFERENT RULE.",
    lines: [
      "Some demand precision.",
      "Some demand imagination.",
      "Some demand both.",
    ],
  },
  {
    id: "beat-05",
    number: "05 — LEFT",
    side: "left",
    title: "YOUR MOVE CHANGES EVERYTHING.",
    lines: [
      "One decision.",
      "One idea.",
      "One moment to stand apart.",
    ],
  },
  {
    id: "beat-06",
    number: "06 — RIGHT",
    side: "right",
    title: "FROM CODE TO CREATIVITY.",
    lines: [
      "Research · Gaming · Technology",
      "Storytelling · Innovation",
      "One arena.",
    ],
  },
  {
    id: "beat-07",
    number: "07 — LEFT",
    side: "left",
    title: "BUILT FOR THE CURIOUS.",
    subtitle: "“What happens if I try?”",
    lines: [
      "For those who don't stop at “What if?”",
      "They ask:",
    ],
  },
  {
    id: "beat-08",
    number: "08 — RIGHT",
    side: "right",
    title: "NO TWO PATHS ARE THE SAME.",
    lines: [
      "Choose your challenge.",
      "Find your edge.",
      "Make your move.",
    ],
  },
  {
    id: "beat-09",
    number: "09 — LEFT",
    side: "left",
    title: "THE ARENA IS OPEN.",
    lines: [
      "The challenges are waiting.",
      "Your next move starts here.",
    ],
  },
  {
    id: "beat-10",
    number: "10 — RIGHT",
    side: "right",
    title: "WELCOME TO PRAXIS.",
    subtitle: "MAKE. PLAY. THINK. CREATE.",
    lines: [],
    cta: {
      text: "ENTER THE ARENA →",
      href: "/events",
    },
  },
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function CinematicText() {
  const openingRef = useRef<HTMLDivElement>(null);
  const initialRefs = useRef<(HTMLDivElement | null)[]>([]);
  const streamRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useRaf(() => {
    const s = signals.scroll;

    // ── 0. Opening Centerpiece ("THIS IS PRAXIS / scroll to explore") ──
    // Visible immediately on landing at s = 0, gracefully fades out as scrolling begins
    const openEl = openingRef.current;
    if (openEl) {
      if (s > 0.038) {
        if (openEl.style.visibility !== "hidden") {
          openEl.style.opacity = "0";
          openEl.style.visibility = "hidden";
        }
      } else {
        const op = Math.max(0, 1 - s / 0.035);
        const y = -s * 550;
        const blur = (s / 0.035) * 6;
        openEl.style.visibility = op < 0.01 ? "hidden" : "visible";
        openEl.style.opacity = op.toFixed(3);
        openEl.style.transform = `translate(-50%, -50%) translateY(${y.toFixed(1)}px)`;
        openEl.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "none";
      }
    }

    // ── 1. Initial Cinematic Texts (Plays before the video: s < 0.24) ──
    for (let i = 0; i < INITIAL_BEATS.length; i++) {
      const el = initialRefs.current[i];
      if (!el) continue;
      const b = INITIAL_BEATS[i];

      if (s < b.start - 0.01 || s > b.end + 0.01) {
        if (el.style.visibility !== "hidden") {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
        }
        continue;
      }

      const t = Math.max(0, Math.min(1, (s - b.start) / (b.end - b.start)));
      const enter = smoothstep(0, 0.25, t);
      const leave = smoothstep(0.75, 1, t);
      const opacity = enter * (1 - leave);
      const y = (1 - enter) * 36 - leave * 28;
      const blur = (1 - enter) * 10 + leave * 8;
      const scale = b.variant === "loom" ? 1.3 - 0.3 * enter : 1;

      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate(-50%, -50%) translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      el.style.filter = blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none";
    }

    // ── 2. Alternating Story Stream (Starts during video: s >= 0.24) ────
    // Arranged one below other with vertical scrolling
    const streamEl = streamRef.current;
    const videoStart = 0.235;
    const videoEnd = 0.94;

    if (streamEl) {
      if (s < videoStart - 0.015 || s > videoEnd + 0.04) {
        if (streamEl.style.visibility !== "hidden") {
          streamEl.style.opacity = "0";
          streamEl.style.visibility = "hidden";
        }
      } else {
        const streamFadeIn = smoothstep(videoStart - 0.015, videoStart + 0.03, s);
        const streamFadeOut = smoothstep(videoEnd, videoEnd + 0.035, s);
        const streamOp = streamFadeIn * (1 - streamFadeOut);

        streamEl.style.visibility = streamOp < 0.01 ? "hidden" : "visible";
        streamEl.style.opacity = streamOp.toFixed(3);

        const progress = Math.max(0, Math.min(1, (s - videoStart) / (videoEnd - videoStart)));

        const N = STORY_BEATS.length;
        const indexFloat = progress * (N - 1);
        const idx = Math.min(N - 2, Math.floor(indexFloat));
        const frac = indexFloat - idx;

        const currentCard = cardRefs.current[idx];
        const nextCard = cardRefs.current[idx + 1];

        if (currentCard && nextCard) {
          const topA = currentCard.offsetTop + currentCard.offsetHeight * 0.5;
          const topB = nextCard.offsetTop + nextCard.offsetHeight * 0.5;
          const currentTargetY = topA + (topB - topA) * frac;
          const viewportMid = window.innerHeight * 0.5;
          const translateY = viewportMid - currentTargetY;

          streamEl.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;

          // Animate each card to appear and disappear from its designated side (left or right)
          const isMobile = window.innerWidth <= 768;
          const slideOffset = isMobile ? 50 : 160;
          const range = viewportMid * 0.95;

          for (let j = 0; j < N; j++) {
            const card = cardRefs.current[j];
            if (!card) continue;
            const cardMid = card.offsetTop + card.offsetHeight * 0.5;
            const diffY = cardMid - currentTargetY;
            const sideDir = STORY_BEATS[j].side === "left" ? -1 : 1;

            if (Math.abs(diffY) > range) {
              if (card.style.visibility !== "hidden") {
                card.style.opacity = "0";
                card.style.visibility = "hidden";
              }
            } else {
              card.style.visibility = "visible";
              let opacity = 1;
              let transX = 0;
              let scale = 1;

              if (diffY >= 0) {
                // Card approaching viewport center from below: slides IN from designated side (left or right)
                const t = Math.max(0, Math.min(1, 1 - diffY / range));
                const ease = smoothstep(0, 1, t);
                opacity = ease;
                transX = sideDir * slideOffset * (1 - ease);
                scale = 0.95 + 0.05 * ease;
              } else {
                // Card passing past viewport center: slides OUT to designated side (left or right)
                const t = Math.max(0, Math.min(1, -diffY / range));
                const ease = smoothstep(0, 1, t);
                opacity = Math.max(0, 1 - ease);
                transX = sideDir * slideOffset * ease;
                scale = 1 - 0.05 * ease;
              }

              card.style.opacity = opacity.toFixed(3);
              card.style.transform = `translate3d(${transX.toFixed(1)}px, 0, 0) scale(${scale.toFixed(3)})`;

              const backdrop = card.querySelector<HTMLElement>(`.${styles.greenBackdrop}`);
              if (backdrop) {
                backdrop.style.opacity = (opacity * 0.95).toFixed(2);
              }
            }
          }
        }
      }
    }
  });

  return (
    <div className={styles.wrap} aria-hidden={false}>
      {/* ── 0. Opening Centerpiece Hero (Visible immediately at scroll = 0) ── */}
      <div
        ref={openingRef}
        className={styles.openingHero}
        style={{ opacity: 1, visibility: "visible" }}
      >
        <h1 className={styles.openingTitle}>THIS IS PRAXIS</h1>
        <div className={styles.openingSub}>
          <span className={styles.subDot} />
          <span>scroll to explore</span>
          <span className={styles.subDot} />
        </div>
      </div>

      {/* ── 1. Initial Cinematic Texts ─────────────────────────── */}
      <div className={styles.initialWrap} aria-hidden>
        {INITIAL_BEATS.map((beat, i) => (
          <div
            key={beat.id}
            ref={(el) => {
              initialRefs.current[i] = el;
            }}
            className={styles.initialBeat}
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <span className={styles.kicker}>{beat.kicker}</span>
            {beat.lines.map((line, li) => (
              <span
                key={li}
                className={`${styles.initialLine} ${styles.glow} ${
                  beat.variant === "metallic" ? styles.metallic : ""
                }`}
              >
                {line}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* ── 2. Alternating Story Stream (One Below Other) ──────── */}
      <div
        ref={streamRef}
        className={styles.streamContainer}
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <div className={styles.streamInner}>
          {STORY_BEATS.map((beat, i) => {
            const sideClass = beat.side === "left" ? styles.leftCard : styles.rightCard;

            return (
              <div
                key={beat.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`${styles.cardItem} ${sideClass}`}
              >
                {/* Luminous green ambient glow aura */}
                <div className={styles.greenBackdrop} />

                {/* Tactical black card block */}
                <article className={styles.card}>
                  <div className={styles.cardTopBeam} />
                  <span className={`${styles.cornerBracket} ${styles.cornerTL}`} />
                  <span className={`${styles.cornerBracket} ${styles.cornerTR}`} />
                  <span className={`${styles.cornerBracket} ${styles.cornerBL}`} />
                  <span className={`${styles.cornerBracket} ${styles.cornerBR}`} />

                  {/* Number Badge */}
                  <div className={styles.badgeRow}>
                    <span className={styles.badgeDot} />
                    <span>{beat.number}</span>
                  </div>

                  {/* Card Title */}
                  <h2 className={styles.cardTitle}>{beat.title}</h2>

                  {/* Optional Subtitle / Quote */}
                  {beat.subtitle && (
                    <div className={styles.cardSubtitle}>{beat.subtitle}</div>
                  )}

                  {/* Body Text */}
                  {beat.lines.length > 0 && (
                    <div className={styles.cardBody}>
                      {beat.lines.map((line, lineIdx) => {
                        const isOneArena = line.trim() === "One arena.";
                        return (
                          <p
                            key={lineIdx}
                            className={`${styles.bodyLine} ${
                              isOneArena ? styles.bodyLineHighlight : ""
                            }`}
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {/* Beat 10 Call to Action Button */}
                  {beat.cta && (
                    <Link
                      href={beat.cta.href}
                      className={styles.ctaButton}
                      aria-label="Enter the Arena"
                    >
                      <span>{beat.cta.text}</span>
                      <span className={styles.ctaArrow} aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
