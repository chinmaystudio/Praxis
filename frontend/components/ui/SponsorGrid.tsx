import { SPONSORS } from "@/lib/sponsors";
import styles from "./praxisFooter.module.css";

export default function SponsorGrid() {
  return (
    <ul className={styles.sponsorsGrid}>
      {SPONSORS.map((sponsor) => (
        <li key={sponsor.name} className={styles.sponsorCard}>
          <div className={`${styles.sponsorLogoPanel} ${sponsor.dark ? styles.sponsorLogoPanelDark : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sponsor.src}
              alt={`${sponsor.name} logo`}
              width={sponsor.width}
              height={sponsor.height}
              loading="lazy"
              decoding="async"
              className={styles.sponsorLogo}
            />
          </div>
          <span className={styles.sponsorName}>{sponsor.name}</span>
        </li>
      ))}
    </ul>
  );
}
