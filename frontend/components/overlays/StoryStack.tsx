"use client";

import { useRef } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./story.module.css";

/**
 * Section 3 — the Cinematic Story Stack.
 *
 * One pinned sequence (the fixed .stage is the pin) containing six fullscreen
 * poster panels. As `signals.story` scrubs 0→1, each panel rises from the bottom,
 * eases to a settle with a slight scale, and stacks OVER the previous one —
 * casting a soft shadow and pushing the earlier chapter back into shadow.
 * Everything is scroll-driven; the shared green atmosphere (WebGL, z-index 3)
 * washes over every panel so the background stays consistent throughout.
 *
 * Each panel is one uploaded artwork (object-fit: cover, full viewport) with a
 * bottom-right title + description themed by a per-panel accent — so the subject
 * of the poster stays clear while the text stays readable. The reveal/stack
 * animation is unchanged.
 */
interface Panel {
  n: string;
  img: string;
  kicker: string;
  title: string[];
  desc: string;
  accent: string; // primary accent (glow, kicker, edge, counter)
  accent2?: string; // secondary accent (divider gradient) — for dual-tone themes
  titleColor: string; // title text colour (kept light for contrast)
  pos?: string; // object-position for the cover crop
}

const CHAPTERS: Panel[] = [
  {
    n: "01",
    img: "/story/panel-1.jpg",
    kicker: "Lord of Latveria",
    title: ["Doctor", "Doom"],
    desc: "Victor von Doom bends science, sorcery, and fate to a single will — and the multiverse will kneel.",
    accent: "#00ff9c",
    titleColor: "#e9fff5",
    pos: "center",
  },
  {
    n: "02",
    img: "/story/panel-2.jpg",
    kicker: "God of Thunder",
    title: ["Thor"],
    desc: "Storm-forged and unbroken, the God of Thunder rises to answer the end of everything.",
    accent: "#ff5a3c",
    accent2: "#ffd15a",
    titleColor: "#fff3e4",
    pos: "center",
  },
  {
    n: "03",
    img: "/story/panel-3.jpg",
    kicker: "God of Stories",
    title: ["Loki"],
    desc: "At the heart of time, the God of Stories holds every fracturing world together.",
    accent: "#19d98a",
    accent2: "#ffd76a",
    titleColor: "#eafff4",
    pos: "center",
  },
  {
    n: "04",
    img: "/story/panel-4.jpg",
    kicker: "Leader of the X-Men",
    title: ["Cyclops"],
    desc: "Field leader of the X-Men, unleashing an unstoppable optic storm against the coming dark.",
    accent: "#ffffff",
    titleColor: "#ffffff",
    pos: "center",
  },
  {
    n: "05",
    img: "/story/panel-5.jpg",
    kicker: "Master of the Ten Rings",
    title: ["Shang-Chi"],
    desc: "Wielding the ancient power of the Ten Rings, he stands unshaken before the storm.",
    accent: "#ff4d4d",
    accent2: "#ff9a3c",
    titleColor: "#fff0ec",
    pos: "center",
  },
  {
    n: "06",
    // ?v=2 busts any cached copy of the old low-res image so the new HD asset
    // is guaranteed to load (the file itself was replaced in place).
    img: "/story/panel-6.jpg?v=2",
    kicker: "Marvel's First Family",
    title: ["Fantastic", "Four"],
    desc: "Four heroes, one family — stepping into a new universe against impossible odds.",
    accent: "#4da6ff",
    accent2: "#bfe3ff",
    titleColor: "#eaf5ff",
    pos: "center",
  },
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const cssVars = (c: Panel) =>
  ({
    "--accent": c.accent,
    "--accent2": c.accent2 ?? c.accent,
    "--title": c.titleColor,
    "--pos": c.pos ?? "center",
  }) as React.CSSProperties;

export default function StoryStack() {
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useRaf(() => {
    // hand the stage over to the horizontal reel: the whole stack fades out as
    // Section 4 begins, so Section 3 → 4 is a cross-push, not a cut.
    const layer = layerRef.current;
    if (layer) {
      const fade = smoothstep(0, 0.09, signals.reel);
      layer.style.opacity = (1 - fade).toFixed(3);
      if (fade >= 1) {
        if (layer.style.visibility !== "hidden") layer.style.visibility = "hidden";
        return;
      }
      layer.style.visibility = "visible";
    }

    const s = signals.story;
    const N = CHAPTERS.length;
    const step = 1 / N;

    for (let i = 0; i < N; i++) {
      const panel = panelRefs.current[i];
      if (!panel) continue;

      // this panel's own rise (0 before its turn, 1 once fully up)
      const r = clamp01((s - i * step) / step);
      // how far the NEXT panel has risen over this one (0..1)
      const cov = i < N - 1 ? clamp01((s - (i + 1) * step) / step) : 0;

      // fully below the fold, or fully hidden behind the next panel → don't paint
      if (r <= 0.0006 || cov >= 0.9994) {
        if (panel.style.visibility !== "hidden") panel.style.visibility = "hidden";
        continue;
      }

      const re = easeOutCubic(r);
      const cove = easeInOutCubic(cov);

      // rise from 100% below to 0, with a slight settle-scale (always ≥1 → no edge gap)
      const ty = (1 - re) * 100;
      const scale = 1.08 - 0.08 * re;
      panel.style.visibility = "visible";
      panel.style.zIndex = String(i + 1);
      panel.style.transform = `translate3d(0, ${ty.toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;

      // recede into shadow as the next chapter covers it
      const dim = dimRefs.current[i];
      if (dim) dim.style.opacity = (cove * 0.5).toFixed(3);

      // content reveals after the panel is mostly up, then fades as it's covered
      const content = contentRefs.current[i];
      if (content) {
        const appear = smoothstep(0.32, 0.98, r);
        content.style.opacity = (appear * (1 - cove * 0.9)).toFixed(3);
        const cy = (1 - appear) * 42 - cove * 26;
        content.style.transform = `translate3d(0, ${cy.toFixed(2)}px, 0)`;
      }
    }
  });

  return (
    <div className="story-layer" ref={layerRef} aria-hidden>
      {CHAPTERS.map((c, i) => (
        <article
          key={c.n}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className={styles.panel}
          style={{
            ...cssVars(c),
            transform: "translate3d(0, 100%, 0)",
            visibility: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.bg} src={c.img} alt="" draggable={false} />
          <span className={styles.scrim} />
          <span className={styles.glow} />
          <span className={styles.vignette} />
          <span className={styles.edge} />
          <span className={styles.counter}>{c.n} / 06</span>

          <div
            className={styles.content}
            ref={(el) => {
              contentRefs.current[i] = el;
            }}
            style={{ opacity: 0 }}
          >
            <span className={styles.kicker}>{c.kicker}</span>
            <h2 className={styles.title}>
              {c.title.map((line, li) => (
                <span key={li} className={styles.titleLine}>
                  {line}
                </span>
              ))}
            </h2>
            <span className={styles.rule} />
            <p className={styles.desc}>{c.desc}</p>
          </div>

          <span
            className={styles.dim}
            ref={(el) => {
              dimRefs.current[i] = el;
            }}
          />
        </article>
      ))}
    </div>
  );
}
