import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/ui/SiteHeader";
import SponsorGrid from "@/components/ui/SponsorGrid";
import styles from "./sponsors.module.css";

export const metadata: Metadata = {
  title: "Sponsors & Partners | PRAXIS 2026",
  description: "Meet the sponsors and partners supporting Praxis 2026 at PCCOE Pune.",
};

export default function SponsorsPage() {
  return (
    <div className={styles.page}>
      <SiteHeader cinematic={false} sponsorsActive />
      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="sponsors-title">
          <p className={styles.eyebrow}><span aria-hidden /> PRAXIS 2026 / OUR PARTNERS</p>
          <h1 id="sponsors-title">THE PEOPLE BEHIND<br /><span>THE POSSIBILITY.</span></h1>
          <p className={styles.description}>Big ideas come to life together. Meet the sponsors and partners supporting the energy, creativity, and ambition of Praxis 2026.</p>
        </section>
        <section className={styles.directory} aria-labelledby="partners-title">
          <div className={styles.sectionHeading}>
            <h2 id="partners-title">SPONSORS <span>&amp; PARTNERS</span></h2>
            <p>Thank you for being part of Praxis.</p>
          </div>
          <SponsorGrid />
        </section>
        <div className={styles.closing}>
          <p>Discover what we&apos;re building together.</p>
          <Link href="/events">EXPLORE THE EVENTS <span aria-hidden>→</span></Link>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>© 2026 PRAXIS · PCCOE PUNE</span>
        <nav aria-label="Footer"><Link href="/">Home</Link><Link href="/team">Team</Link><Link href="/gallery">Gallery</Link><Link href="/events">Events</Link></nav>
      </footer>
    </div>
  );
}
