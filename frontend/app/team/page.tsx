import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import SiteHeader from "@/components/ui/SiteHeader";
import { COMMITTEE, EVENT_TEAMS } from "@/lib/team";
import styles from "./team.module.css";

export const metadata: Metadata = {
  title: "Our Team | PRAXIS 2026",
  description: "Meet the people bringing Praxis 2026 to life at PCCOE Pune, and the teams behind its events.",
};

const initials = (name: string) => name.split(" ").filter(Boolean).map(part => part[0]).slice(0, 2).join("");

export default function TeamPage() {
  return (
    <div className={styles.page}>
      <SiteHeader cinematic={false} teamActive />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="team-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span /> PRAXIS 2026 / THE TEAM</p>
            <h1 id="team-title">MANY MINDS.<br /><span>ONE PRAXIS.</span></h1>
            <p className={styles.intro}>The planners, the problem-solvers, the people who show up. Meet the team turning a shared vision into an unforgettable experience.</p>
            <a className={styles.heroLink} href={COMMITTEE.length ? "#committee" : "#event-teams"}>MEET THE TEAM <span aria-hidden>↘</span></a>
          </div>
          <div className={styles.emblem} aria-hidden="true">
            <div className={styles.orbit} /><div className={styles.orbitInner} />
            <span className={styles.orbitLabel}>BUILT TOGETHER</span>
            <div className={styles.emblemCore}><span>P / 26</span><strong>THE<br />COLLECTIVE</strong><i /></div>
            <span className={styles.orbitFoot}>PCCOE · PUNE</span>
          </div>
        </section>

        <div className={styles.manifesto}><span>ONE SHARED VISION</span><p>Different strengths. A shared commitment to make it happen.</p><span aria-hidden>PRAXIS / 26</span></div>

        {COMMITTEE.length > 0 && <section className={styles.section} id="committee" aria-labelledby="committee-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE ORGANIZING COMMITTEE</p><h2 id="committee-title">BEHIND THE <span>EXPERIENCE.</span></h2></div><p>The people bringing it all together.</p></div>
          <p className={styles.roleKey}>TY / Third Year · SY / Second Year · POC / Point of Contact</p>
          {COMMITTEE.map((group, index) => <div className={styles.committeeGroup} key={group.title}>
            <h3><span aria-hidden>0{index + 1}</span>{group.title}<small>{group.members.length} MEMBERS</small></h3>
            <ul className={styles.committeeGrid}>{group.members.map(person => <li className={styles.committeeCard} key={`${person.name}-${person.role}`}>
              <span className={styles.monogram} aria-hidden>{initials(person.name)}</span>
              <h4>{person.name}</h4><p>{person.role}</p>
            </li>)}</ul>
          </div>)}
        </section>}

        <section className={styles.section} id="event-teams" aria-labelledby="event-teams-title">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE PEOPLE BEHIND EACH CHALLENGE</p><h2 id="event-teams-title">EVENT <span>LEADS &amp; TEAMS.</span></h2></div><p>From the first idea to the final round.</p></div>
          <div className={styles.eventsGrid}>{EVENT_TEAMS.map((event, index) => <article className={styles.eventCard} key={event.slug} style={{ "--event-accent": event.accent } as CSSProperties}>
            <div className={styles.cardTop}><span>EVENT TEAM</span><span className={styles.eventNumber}>0{index + 1}</span></div>
            <p className={styles.eventTheme}>{event.theme}</p>
            <h3>{event.title}</h3>
            <ul className={styles.people}>{event.members.map(person => <li key={person.name}>
              <span className={styles.avatar} aria-hidden>{initials(person.name)}</span>
              <div><h4>{person.name}</h4><p>{person.role}</p></div>
            </li>)}</ul>
            <Link href={`/events/${event.slug}`} className={styles.eventLink}>EXPLORE EVENT <span aria-hidden>↗</span><span className={styles.srOnly}>: {event.title}</span></Link>
          </article>)}</div>
        </section>

        <aside className={styles.closing}><div><p className={styles.eyebrow}>YOUR NEXT CHALLENGE AWAITS</p><h2>MEET THE TEAM.<br /><span>JOIN THE EXPERIENCE.</span></h2></div><Link href="/events">EXPLORE ALL EVENTS <span aria-hidden>→</span></Link></aside>
      </main>
      <footer className={styles.footer}><span>© 2026 PRAXIS · PCCOE PUNE</span><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/gallery">Gallery</Link><Link href="/sponsors">Sponsors</Link><Link href="/events">Events</Link></nav></footer>
    </div>
  );
}
