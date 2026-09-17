"use client";

import { useRef, useState } from "react";
import { signals } from "@/lib/signals";
import { useRaf } from "@/lib/useRaf";
import styles from "./ui.module.css";

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export default function SiteHeader() {
  const ref = useRef<HTMLElement>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", passType: "Developer Pass" });

  useRaf(() => {
    const el = ref.current;
    if (!el) return;
    const h = signals.header * (1 - smoothstep(0.02, 0.14, signals.reel));
    el.style.opacity = h.toFixed(3);
    el.style.transform = `translateY(${(1 - h) * -20}px)`;
    el.style.pointerEvents = h > 0.6 ? "auto" : "none";
    el.style.visibility = h < 0.01 ? "hidden" : "visible";
  });

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsRegisterOpen(false);
      setIsSubmitted(false);
      setFormData({ name: "", email: "", passType: "Developer Pass" });
    }, 2200);
  };

  return (
    <>
      <header ref={ref} className={styles.header} style={{ opacity: 0, visibility: "hidden" }}>
        {/* Left: Pure Praxis Banner Logo (Large, no extra text) */}
        <div
          className={styles.brand}
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          aria-label="Praxis Home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/praxis-banner.png?v=4"
            alt="PRAXIS"
            className={styles.brandLogo}
          />
        </div>

        {/* Right: Unique, Attractive Cyber Sci-Fi Register Button */}
        <button
          className={styles.registerBtn}
          type="button"
          onClick={() => setIsRegisterOpen(true)}
          aria-label="Register for Praxis"
        >
          <span className={styles.btnScanline} aria-hidden />
          <span className={styles.btnCornerTL} aria-hidden />
          <span className={styles.btnCornerBR} aria-hidden />
          <span className={styles.btnDot} aria-hidden />
          <span className={styles.btnLabel}>REGISTER</span>
          <svg
            className={styles.btnArrow}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>
      </header>

      {/* Registration Modal Overlay */}
      {isRegisterOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsRegisterOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setIsRegisterOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalBadge}>
                <span>●</span>
                <span>Praxis 2026 // Access Portal</span>
              </div>
              <h2 className={styles.modalTitle}>Secure Coordinates</h2>
              <p className={styles.modalDesc}>
                Claim your pass for the ultimate multiverse showcase. Enter your identity parameters below.
              </p>
            </div>

            {isSubmitted ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✓</div>
                <h3 className={styles.modalTitle} style={{ fontSize: "1.2rem" }}>
                  Access Granted
                </h3>
                <p className={styles.modalDesc}>
                  Your registration has been confirmed. Stand by for quantum transmission.
                </p>
              </div>
            ) : (
              <form className={styles.modalForm} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Victor Von Doom"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="doom@latveria.gov"
                    className={styles.formInput}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Access Clearance</label>
                  <select
                    className={styles.formInput}
                    value={formData.passType}
                    onChange={(e) => setFormData({ ...formData, passType: e.target.value })}
                    style={{ background: "#06130e" }}
                  >
                    <option value="Student Pass">Student Pass — Standard Access</option>
                    <option value="Developer Pass">Developer Pass — Full Workshop &amp; Keynote</option>
                    <option value="VIP Omniverse">VIP Omniverse — All Access + Backstage</option>
                  </select>
                </div>

                <button type="submit" className={styles.modalSubmit}>
                  Confirm Registration
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
