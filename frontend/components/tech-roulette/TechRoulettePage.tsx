"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getEventBySlug } from "@/lib/events";
import styles from "./tech-roulette.module.css";

const ArcReactor = dynamic(() => import("./ArcReactor"), { ssr: false });
const event = getEventBySlug("tech-roulette")!;
const rounds = [
  {
    name: "Eco Buzzer Battle", verb: "Think fast.", category: "KNOWLEDGE / PRECISION", title: "The first spark.",
    text: "Before you build the future, prove you understand it. Take on a live quiz at the intersection of technology, sustainability and resource conservation.",
    points: ["Live questions. Quick decisions. Positive and negative marking.", "Balance speed with accuracy. Every answer matters."],
    metrics: [["45–60", "MINUTES"], ["10–12", "TEAMS ADVANCE"]],
    outcome: "The strongest teams unlock the workshop.",
  },
  {
    name: "Build for Impact", verb: "Make it real.", category: "PROTOTYPE / ADAPTATION", title: "Built under pressure.",
    text: "Draw a unique problem statement, spin for a mandatory Innovation Twist, and turn a sustainability challenge into a working idea. Your constraints are part of the design.",
    points: ["70–90 minutes to develop your prototype.", "Present a 3-minute demo, followed by 5 minutes of questions."],
    metrics: [["70–90", "MINUTES TO BUILD"], ["05", "TEAMS ADVANCE"]],
    outcome: "Five teams move from the workshop to the final pitch.",
  },
  {
    name: "Rapid Ideation Pitch", verb: "Own the room.", category: "IDEATION / CONVICTION", title: "The final upgrade.",
    text: "A fresh challenge. An unexpected constraint. Just five minutes to find your angle. Leave the laptop behind and prove what your team can do with an idea and a sheet of paper.",
    points: ["Draw challenge and constraint cards; brainstorm on paper for 5 minutes.", "Pitch for 5–7 minutes, then take 5–10 minutes of questions."],
    metrics: [["05", "MINUTES TO THINK"], ["5–7", "MINUTES TO PITCH"]],
    outcome: "The best ideas earn the podium.",
  },
];

const briefing = [
  ["Who can enter?", "Engineering undergraduates in teams of 2–3. Cross-branch teams are welcome. Bring complementary skills: research, making and presenting."],
  ["What should we bring?", "Bring a laptop, charger and valid college IDs. Report 30 minutes before the announced start time. The complete event takes approximately 6–7 hours."],
  ["What is the challenge about?", "Resource conservation and sustainability. You will move from a live knowledge round to rapid prototyping, then a paper-based ideation pitch. Each round adds a different kind of pressure."],
  ["What can we win?", "The Champion, First Runner-Up and Second Runner-Up receive the awards described in the rulebook. Participation certificates, winner certificates and trophies are part of the event."],
  ["How do we register?", "The team leader signs in with Google, then registers all 2–3 members. Every other member verifies their email with an OTP before the ₹49 team payment."],
];

function Arrow({ down = false }: { down?: boolean }) {
  return <span aria-hidden="true">{down ? "↓" : "↗"}</span>;
}

export default function TechRoulettePage() {
  const [activeRound, setActiveRound] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadReactor, setLoadReactor] = useState(false);
  const reactorSection = useRef<HTMLElement>(null);
  const round = rounds[activeRound];

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setLoadReactor(true); observer.disconnect(); }
    }, { rootMargin: "240px" });
    if (reactorSection.current) observer.observe(reactorSection.current);
    return () => observer.disconnect();
  }, []);

  return <main className={styles.page}>
    <a href="#mission" className={styles.skip}>Skip to event details</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Praxis home"><img src="/images/praxis_new_logo.png" alt="Praxis 2026" width="144" height="48" /><span>PRAXIS / 26</span></Link>
      <nav aria-label="Tech Roulette navigation"><a href="#mission">The mission</a><a href="#rounds">The rounds</a><a href="#briefing">Briefing</a></nav>
      <Link href="/events" className={styles.back}>All events <Arrow /></Link>
    </header>

    <section className={styles.hero} aria-labelledby="tech-title">
      <picture className={styles.heroImage}>
        <source media="(max-width: 700px)" srcSet="/tech-roulette/iron-workshop-mobile.webp" />
        <img src="/tech-roulette/iron-workshop.webp" alt="A glowing reactor inside a red and gold engineering workshop" width="1672" height="941" fetchPriority="high" />
      </picture>
      <div className={styles.heroShade} />
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}><i /> PRAXIS 2026 <span>/</span> THE IRON MAN CHALLENGE</p>
        <h1 id="tech-title">TECH<span>ROULETTE<span className={styles.titleDot}>.</span></span></h1>
        <p className={styles.heroTagline}>Genius is a start.<br /><em>What will you build with it?</em></p>
        <p className={styles.heroDescription}>Think on your feet. Build under pressure. Pitch a better tomorrow. Three rounds for the engineer who refuses to settle.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/events/tech-roulette/register">Register your team <Arrow /></Link><a href="#rounds" className={styles.secondary}>Explore the challenge <Arrow down /></a></div>
      </div>
      <div className={styles.heroSerial} aria-hidden="true"><span>MK. 04</span><div /><small>INNOVATION<br />PROTOCOL</small></div>
      <div className={styles.heroBottom}><span>PCCOE PUNE <b>×</b> PRAXIS 2026</span><a href="#mission">ENTER THE WORKSHOP <Arrow down /></a><span>INSPIRED BY IRON MAN</span></div>
    </section>

    <div className={styles.stats} aria-label="Event at a glance"><div><strong>03</strong><span>ROUNDS TO PROVE IT</span></div><div><strong>2–3</strong><span>MEMBERS PER TEAM</span></div><div><strong>6–7<span> HRS</span></strong><span>ONE COMPLETE CHALLENGE</span></div><div><strong>FREE*</strong><span>PCCOE REGISTRATION</span></div></div>

    <section id="mission" className={styles.mission} aria-labelledby="mission-title">
      <div className={styles.sectionHeading}><span className={styles.sectionNumber}>01 / THE MISSION</span><p>RESOURCE CONSERVATION<br />& SUSTAINABILITY</p></div>
      <div className={styles.missionGrid}><h2 id="mission-title">A better future<br />isn’t found.<br /><em>It’s engineered.</em></h2><div className={styles.missionCopy}><p className={styles.lead}>The suit is a symbol.<br />The mind inside is the difference.</p><p>Tech Roulette brings that spirit to the workshop. Take on real sustainability problems, adapt to unexpected constraints, and make a convincing case for your solution.</p><p>Assemble a team of 2–3 engineering undergraduates. Team composition is locked at registration, and cross-branch teams are welcome.</p><a className={styles.textLink} href={event.rulebook} download={event.downloadName}>Read the official rulebook <Arrow /></a></div></div>
      <div className={styles.missionCaption}><span>THINK RESPONSIBLY.</span><span>BUILD FEARLESSLY.</span><span>INNOVATE FOR TOMORROW.</span></div>
    </section>

    <section id="rounds" ref={reactorSection} className={styles.rounds} aria-labelledby="rounds-title">
      <div className={styles.sectionHeading}><span className={styles.sectionNumber}>02 / THE INNOVATION PROTOCOL</span><button className={styles.motion} type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? "▶ Resume 3D motion" : "Ⅱ Pause 3D motion"}</button></div>
      <div className={styles.roundsHeading}><h2 id="rounds-title">Every round.<br /><em>An upgrade.</em></h2><p>Knowledge powers the core.<br /> Ingenuity takes it further.<br /> Select a stage to see your mission.</p></div>
      <div className={styles.roundSelector} role="group" aria-label="Choose a round">{rounds.map((item, index) => <button key={item.name} type="button" onClick={() => setActiveRound(index)} aria-pressed={activeRound === index} aria-controls="round-details" className={activeRound === index ? styles.selected : ""}><span>0{index + 1}</span><div><small>{item.verb}</small><strong>{item.name}</strong></div><span className={styles.roundArrow}><Arrow /></span></button>)}</div>
      <div className={styles.roundStage}>
        <div className={styles.reactorPanel}>
          <div className={styles.reactorTopline}><span>ARC REACTOR / CORE ASSEMBLY</span><span>0{activeRound + 1}—03</span></div>
          <div className={styles.reactorMount}>{loadReactor && <ArcReactor activeRound={activeRound} paused={paused} />}</div>
          <div className={styles.reactorBaseline}><span className={styles.reactorSignal} /> <span>{["KNOWLEDGE", "INGENUITY", "CONVICTION"][activeRound]} POWERS THE NEXT STAGE</span></div>
        </div>
        <article id="round-details" className={styles.roundDetails} aria-live="polite" aria-atomic="true">
          <p className={styles.eyebrow}>ROUND 0{activeRound + 1} <span>/</span> {round.category}</p><h3>{round.title}</h3><p className={styles.roundDescription}>{round.text}</p>
          <div className={styles.roundMetrics}>{round.metrics.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <ul>{round.points.map(point => <li key={point}>{point}</li>)}</ul><p className={styles.outcome}><span>↳</span> {round.outcome}</p>
        </article>
      </div>
    </section>

    <section className={styles.workshop} aria-labelledby="workshop-title">
      <div className={styles.workshopVisual}><img src="/tech-roulette/roulette-lab.webp" alt="A futuristic roulette wheel surrounded by sustainability prototypes" width="1100" height="619" loading="lazy" /><div className={styles.visualCaption}><span>THE WORKSHOP</span><span>EXPECT THE UNEXPECTED ↗</span></div></div>
      <div className={styles.workshopCopy}><span className={styles.sectionNumber}>03 / THE TWIST</span><h2 id="workshop-title">You don’t choose<br />every variable.<br /><em>You adapt.</em></h2><p>In Round 2, your problem statement is only the beginning. Spin for an Innovation Twist that becomes a mandatory part of your prototype.</p><p>In the final round, challenge and constraint cards change the equation again. The real test is what you do next.</p><a className={styles.textLink} href="#briefing">Get mission-ready <Arrow down /></a></div>
    </section>

    <section id="briefing" className={styles.briefing} aria-labelledby="briefing-title">
      <div className={styles.briefingIntro}><span className={styles.sectionNumber}>04 / BEFORE YOU SUIT UP</span><h2 id="briefing-title">Mission<br /><em>briefing.</em></h2><p>Know the format.<br />Bring your tools.<br />Make the work your own.</p><a href={event.rulebook} download={event.downloadName} className={styles.download}><span>OFFICIAL RULEBOOK<small>TECH ROULETTE · PDF</small></span><Arrow down /></a></div>
      <div className={styles.faq}>{briefing.map(([question, answer], index) => <details key={question} open={index === 0 ? true : undefined}><summary><span>0{index + 1}</span><h3>{question}</h3><b aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className={styles.final} aria-labelledby="final-title"><div className={styles.finalLines} aria-hidden="true" /><p className={styles.eyebrow}>YOUR NEXT IDEA DESERVES A SHOT.</p><h2 id="final-title">READY TO<br /><em>SUIT UP?</em></h2><div className={styles.finalBottom}><p>Bring your team.<br />Build for a better tomorrow.</p><Link href="/events/tech-roulette/register" className={styles.primary}>Register your team <Arrow /></Link><span>FREE FOR PCCOE<br />₹49 FOR AN EXTERNAL TEAM</span></div></section>

    <footer className={styles.footer}><Link href="/" aria-label="Praxis home"><img src="/images/praxis_new_logo.png" alt="Praxis" width="105" height="35" /></Link><span>TECH ROULETTE / INNOVATE FOR TOMORROW</span><Link href="/events">Explore all events <Arrow /></Link></footer>
  </main>;
}
