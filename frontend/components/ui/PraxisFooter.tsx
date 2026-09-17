"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./praxisFooter.module.css";

const PILLARS = [
  {
    tag: "Track 01 · Code & AI",
    name: "Optic Arena",
    desc: "24-hour national hackathon & algorithmic combat. Engineer solutions bending real-world constraints.",
  },
  {
    tag: "Track 02 · Hardware & Bot",
    name: "Latverian Protocol",
    desc: "Autonomous robotics, battle-bot warfare, and drone navigation across multi-terrain arenas.",
  },
  {
    tag: "Track 03 · Gaming & Esports",
    name: "Multiverse Combat",
    desc: "High-stakes tactical tournament spanning PC & mobile arenas. Only one champion survives.",
  },
  {
    tag: "Track 04 · Creative & 3D",
    name: "Arcane Design",
    desc: "Interactive web experiences, WebGL shaders, visual VFX, and cinematic concept design.",
  },
];

const STATS = [
  { num: "₹5L+", label: "Cash Prize Pool" },
  { num: "30+", label: "Flagship Events" },
  { num: "5,000+", label: "National Innovators" },
  { num: "48h", label: "Non-Stop Creation" },
];

export default function PraxisFooter() {
  const [activeVideo, setActiveVideo] = useState<"title" | "finale">("title");
  const videoRef = useRef<HTMLVideoElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleVideo = () => {
    const next = activeVideo === "title" ? "finale" : "title";
    setActiveVideo(next);
  };

  const videoSrc = activeVideo === "title" ? "/videos/title-reveal.mp4" : "/videos/finale-seq.mp4";
  const posterSrc = activeVideo === "title" ? "/videos/title-reveal-poster.jpg" : "/videos/finale-poster.jpg";

  return (
    <footer className={styles.footerSection} id="praxis-footer">
      {/* ── Background Video Provided by User ───────────────────── */}
      <div className={styles.videoWrap} aria-hidden>
        <video
          key={videoSrc}
          ref={videoRef}
          className={styles.bgVideo}
          src={videoSrc}
          poster={posterSrc}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        <div className={styles.videoOverlay} />
      </div>

      {/* ── Main Praxis Festival Content ────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.headerBlock}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Praxis 2026 · Annual Techno-Cultural Festival
          </div>

          <h2 className={styles.title}>
            WHERE INNOVATION MEETS <span className={styles.titleAccent}>THE MULTIVERSE</span>
          </h2>

          <p className={styles.lead}>
            Praxis is the premier annual technical and creative symposium. Innovators, engineers, and digital artists
            from across the nation converge to collaborate, build autonomous intelligence, and push the boundaries
            of what reality allows.
          </p>
        </div>

        {/* ── Stats Strip ───────────────────────────────────────── */}
        <div className={styles.statsRow}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Pillars Grid ──────────────────────────────────────── */}
        <div className={styles.pillarsGrid}>
          {PILLARS.map((p) => (
            <div key={p.name} className={styles.pillarCard}>
              <div>
                <span className={styles.pillarTag}>{p.tag}</span>
                <h3 className={styles.pillarName}>{p.name}</h3>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Action Buttons ────────────────────────────────────── */}
        <div className={styles.actionsBar}>
          <Link href="/events" className={styles.primaryBtn}>
            Explore All Events
            <span aria-hidden>→</span>
          </Link>

          <button
            type="button"
            onClick={toggleVideo}
            className={styles.secondaryBtn}
            aria-label="Toggle background video"
          >
            Switch Video Backdrop ⟳ ({activeVideo === "title" ? "Title Reveal" : "Finale Battle"})
          </button>
        </div>

        {/* ── Bottom Base Bar ───────────────────────────────────── */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © 2026 PRAXIS · ALL RIGHTS RESERVED · FAN-INSPIRED CINEMATIC EXPERIENCE
          </div>

          <div className={styles.socialLinks}>
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <a href="https://x.com/MarvelStudios" target="_blank" rel="noopener noreferrer">
              X ↗
            </a>
            <a href="https://www.youtube.com/marvel" target="_blank" rel="noopener noreferrer">
              YouTube ↗
            </a>
          </div>

          <button type="button" onClick={scrollToTop} className={styles.toTop} aria-label="Back to top">
            BACK TO TOP ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
