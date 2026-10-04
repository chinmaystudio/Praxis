"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SponsorGrid from "./SponsorGrid";
import styles from "./praxisFooter.module.css";

const STATS = [
  { num: "1,000+", label: "Participants" },
  { num: "₹78,000", label: "Cash Prize Pool" },
  { num: "5", label: "Flagship Events" },
];

export default function PraxisFooter() {
  const [activeVideo, setActiveVideo] = useState<"title" | "finale">("title");
  const videoRef = useRef<HTMLVideoElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [visible,setVisible] = useState(false);
  useEffect(()=>{
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:"150px"});
    if(footerRef.current) observer.observe(footerRef.current);
    return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{const video=videoRef.current;if(!video)return;if(visible&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)void video.play().catch(()=>{});else video.pause();},[visible,activeVideo]);

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
    <footer ref={footerRef} className={styles.footerSection} id="praxis-footer">
      {/* ── Background Video Provided by User ───────────────────── */}
      <div className={styles.videoWrap} aria-hidden>
        <video
          key={videoSrc}
          ref={videoRef}
          className={styles.bgVideo}
          src={visible ? videoSrc : undefined}
          poster={posterSrc}
          muted
          loop
          playsInline
          preload="none"
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
        <section className={styles.sponsors} aria-labelledby="footer-sponsors-title">
          <div className={styles.sponsorsHeading}>
            <div>
              <p className={styles.sponsorsEyebrow}>THE PEOPLE BEHIND THE POSSIBILITY</p>
              <h2 id="footer-sponsors-title" className={styles.sponsorsTitle}>
                SPONSORS <span>&amp; PARTNERS</span>
              </h2>
            </div>
            <Link href="/sponsors" className={styles.sponsorsPageLink}>Meet our sponsors <span aria-hidden>→</span></Link>
          </div>
          <SponsorGrid />
        </section>

        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © 2026 PRAXIS · ALL RIGHTS RESERVED · FAN-INSPIRED CINEMATIC EXPERIENCE
          </div>

          <div className={styles.socialLinks}>
            <Link href="/">Home</Link>
            <Link href="/events">Events</Link>
            <Link href="/team">Team</Link>
            <Link href="/gallery">Gallery</Link>
            <Link href="/sponsors">Sponsors</Link>
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
