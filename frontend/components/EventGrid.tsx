"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { EVENTS, formatPrice, type EventConfig } from "@/lib/events";
import RegistrationModal from "./registration/RegistrationModal";
import styles from "./event-grid.module.css";
export default function EventGrid() {
 const [registering,setRegistering]=useState<EventConfig|null>(null);
 return <main className={styles.page}>
  <header><Link href="/" aria-label="Praxis home"><img src="/images/praxis_new_logo.png" alt="Praxis 2026" width="180" height="60" /></Link><Link href="/">← Home</Link></header>
  <div className={styles.heading}><p>PRAXIS 2026 · PCCOE PUNE</p><h1>Choose your arena.</h1><p>Explore the event, assemble your team, and join the challenge.</p></div>
  <div className={styles.grid}>{EVENTS.map(event=><article key={event.slug} style={{"--accent":event.accent} as CSSProperties}>
   <img src={event.image} alt={event.title} loading="lazy" width="640" height="800" />
   <div className={styles.content}><span>{event.theme}</span><h2>{event.title}</h2><p>{event.desc}</p><p className={styles.fee}>{event.feeLabel || formatPrice(event.price)}</p>
    <div className={styles.actions}>{event.isTeamEvent || event.slug === "tech-roulette" ? <Link href={"/events/"+event.slug}>Explore event ↗</Link> : <button onClick={()=>setRegistering(event)}>Register ↗</button>}<a href={event.rulebook} download={event.downloadName}>Rulebook ↓</a></div>
   </div>
  </article>)}</div>
  {registering && <RegistrationModal event={registering} isOpen onClose={()=>setRegistering(null)} />}
 </main>;
}
