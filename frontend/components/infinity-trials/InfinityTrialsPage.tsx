"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { INFINITY_TRIALS as event } from "@/lib/infinity-trials";
import { STONES } from "./trail-data";
import styles from "./trail.module.css";
import ScrollFillText from "./ScrollFillText";

const StoneCanvas = dynamic(() => import("./InfinityTrialsCanvas"), { ssr: false });
const chapterIds = ["round-1", "round-2", "round-3", "rewards", "briefing", "assemble"];
const descriptions = [
  "Before you can save the universe, prove you belong among its mightiest minds. Read the clues. Trust your instincts. Beat the clock.",
  "The hunt begins. Twelve teams are drawn into six rivalries. Follow your stone’s trail, outthink the other team, and claim a power that changes the final battle.",
  "This is what you came for. Four teammates. Four different challenges. One unbroken relay. Every player carries the team one step closer to victory.",
  "The battle ends. The legends remain. The three highest-scoring teams take their place on the podium and share a ₹17,000 prize pool.",
  "A great alliance knows the mission before the first move. Arrive prepared, play fair, and let your teamwork do the talking.",
  "Every hero needs an alliance. Gather your team of four and step into a contest of observation, memory, strategy, speed and adaptability.",
];
const metrics = [
  [["30", "QUESTIONS"], ["10 min", "ANALYTICAL SECTION"], ["12", "TEAMS ADVANCE"]],
  [["6", "TREASURE HUNTS"], ["2", "TEAMS PER STONE"], ["1 + 1", "BUFF & DEBUFF"]],
  [["4", "RELAY CHALLENGES"], ["100", "TOTAL POINTS"], ["3 min", "PLAYER ASSIGNMENT"]],
];

function StoneChapter({ index, paused, reduced, active, onActivate }: { index: number; paused: boolean; reduced: boolean; active: number; onActivate: (index: number) => void }) {
  const item = STONES[index];
  const round = index < 3 ? event.rounds[index] : null;
  const root = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(index === 0);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, { rootMargin: "100px" });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  function activate() {
    onActivate(index);
    setOpen(value => !value);
  }

  return <article ref={root} id={chapterIds[index]} className={`${styles.chapter} ${index % 2 ? styles.reverse : ""} ${active === index ? styles.active : ""} ${paused || reduced ? styles.still : ""}`} style={{ "--stone": item.color } as CSSProperties} aria-labelledby={`chapter-title-${index}`}>
    <div className={styles.chapterRail} aria-hidden="true"><span>0{index + 1}</span></div>
    <div className={styles.stoneScene}>
      <svg className={styles.chapterRope} viewBox="0 0 500 600" preserveAspectRatio="none" aria-hidden="true"><defs><filter id={`glow-${index}`}><feGaussianBlur stdDeviation="4" /></filter></defs><path className={styles.ropeHalo} d="M500 0 C430 80 100 120 250 300 S360 520 500 600" filter={`url(#glow-${index})`} /><path className={styles.ropeLine} d="M500 0 C430 80 100 120 250 300 S360 520 500 600" /><path className={styles.ropeSpark} d="M500 0 C430 80 100 120 250 300 S360 520 500 600" /></svg>
      <div className={`${styles.gemStage} ${ready && inView && !failed ? styles.ready : ""}`}>
        <div className={styles.portal} aria-hidden="true"><span /><span /><span /><i /></div>
        <div className={styles.gemFallback} aria-hidden="true" />
        {inView && !failed && <div className={styles.canvas} aria-hidden="true"><StoneCanvas index={index} paused={paused || reduced} active={active === index} onReady={onReady} onFailure={onFailure} /></div>}
        <button type="button" className={styles.gemButton} aria-label={`${item.name} stone: ${open ? "close" : "open"} ${item.label} details`} aria-expanded={open} aria-controls={`stone-details-${index}`} onClick={activate}><span className={styles.srOnly}>{item.label}</span></button>
        <div className={styles.stoneCaption}><span>THE {item.name.toUpperCase()} STONE</span><small>{open ? "MISSION REVEALED" : "TOUCH TO REVEAL"} <b>↗</b></small></div>
      </div>
      <span className={styles.ghostNumber} aria-hidden="true">0{index + 1}</span>
    </div>

    <div className={styles.chapterCopy}>
      <div className={styles.connection} aria-hidden="true"><span /></div>
      <p className={styles.eyebrow}>0{index + 1} / {item.kicker}</p>
      <h3 id={`chapter-title-${index}`}><ScrollFillText text={item.label + "."} disabled={paused || reduced} /></h3>
      <p className={styles.chapterDescription}><ScrollFillText text={descriptions[index]} disabled={paused || reduced} /></p>
      {round && <div className={styles.metrics}>{metrics[index].map(([value, label]) => <div key={label}><strong>{value}</strong><small>{label}</small></div>)}</div>}
      {index === 1 && <div className={styles.powerNote}><span>YOUR STONE. YOUR ADVANTAGE.</span><p>A buff for your team. A debuff for a rival.<br />Both activate only in the Endgame.</p></div>}
      {index === 2 && <p className={styles.endgameNote}>25 points per challenge. Highest total wins.<br />Completion time breaks a tie.</p>}
      {index === 3 && <div className={styles.prizeList}>{event.prizes.map((prize, i) => <div key={prize.rank}><span>{["✦", "◇", "△"][i]}</span><small>{prize.place}</small><strong>{prize.amount}</strong></div>)}</div>}
      {index === 4 && <div className={styles.essentials}><div><small>WHEN</small><strong>{event.date}</strong><span>{event.time}</span></div><div><small>WHERE</small><strong>5th Building, PCCOE</strong><span>Nigdi · Report before the announced time</span></div><div><small>YOUR TEAM</small><strong>Exactly four participants</strong><span>Carry valid college ID when required</span></div></div>}
      {index === 5 && <><div className={styles.teamFour} aria-label="Four teammates"><span>01</span><span>02</span><span>03</span><span>04</span><small>FOUR STRENGTHS.<br />ONE ALLIANCE.</small></div><Link className={styles.primary} href="/events/infinity-trials/register">Register your team ↗</Link><div className={styles.contacts}>{event.coordinators.map(person => <a key={person.phone} href={`tel:+91${person.phone}`}><small>EVENT COORDINATOR</small><strong>{person.name} <span>↗</span></strong><span>+91 {person.phone}</span></a>)}</div></>}

      <details id={`stone-details-${index}`} className={styles.missionDetails} open={open} onToggle={e => setOpen(e.currentTarget.open)}>
        <summary>{["The first test", "How the hunt works", "Inside the final relay", "How champions are decided", "The complete ground rules", "Before your team arrives"][index]}<span>{open ? "−" : "+"}</span></summary>
        {round ? <ul>{round.details.map(detail => <li key={detail}>{detail}</li>)}</ul> : index === 3 ? <p>Teams are ranked by total points in Round 3. The highest three totals earn the podium places. When points are tied, the lowest completion time wins.</p> : index === 4 ? <ol>{event.rules.map(rule => <li key={rule}>{rule}</li>)}</ol> : <p>{event.date}, {event.time}. {event.venue}. Your team must have exactly four participants. Arrive before the reporting time announced by the organizers and carry valid college identification when required.</p>}
      </details>
      {index < 3 && <p className={styles.advance}><span>↳</span> {["TOP 12 TEAMS ADVANCE", "SIX STONES. SIX FINALISTS.", "ONE TEAM BECOMES LEGEND."][index]}</p>}
      {index === 4 && <a className={styles.textLink} href={event.rulebookPath} download>Download the official rulebook <span>↓</span></a>}
    </div>
  </article>;
}

export default function InfinityTrialsPage() {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync(); media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Background Audio: starts playing at minimum sound when the page opens
  useEffect(() => {
    const audio = new Audio("/audio/infinity-trials-theme.m4a");
    audio.loop = true;
    audio.volume = 0.18; // minimum subtle background volume
    audioRef.current = audio;

    const tryPlay = () => {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked by browser policy without gesture; attach listener for first interaction
          setIsPlaying(false);
        });
    };

    tryPlay();

    // Start on first user interaction if browser blocked pure autoplay
    const onFirstGesture = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.18;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      cleanupGestureListeners();
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.removeEventListener("wheel", onFirstGesture);
      window.removeEventListener("scroll", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };

    window.addEventListener("pointerdown", onFirstGesture, { passive: true, once: true });
    window.addEventListener("keydown", onFirstGesture, { passive: true, once: true });
    window.addEventListener("wheel", onFirstGesture, { passive: true, once: true });
    window.addEventListener("scroll", onFirstGesture, { passive: true, once: true });
    window.addEventListener("touchstart", onFirstGesture, { passive: true, once: true });

    return () => {
      cleanupGestureListeners();
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.volume = 0.18;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  return <main className={`${styles.page} ${paused || reduced ? styles.still : ""}`}>
    <a className={styles.skip} href="#trials">Skip to the Infinity Trail</a>
    <header className={styles.nav}>
      <Link className={styles.navBrand} href="/" aria-label="Praxis home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/praxis-infinity-logo.png"
          alt="PRAXIS"
          className={styles.brandLogo}
        />
      </Link>

      <nav className={styles.navLinks} aria-label="Event navigation">
        <a href="#trials" className={styles.navLink}>
          <span className={styles.navDot} />
          <span>The journey</span>
        </a>
        <a href="#rewards" className={styles.navLink}>
          <span className={styles.navDot} />
          <span>The rewards</span>
        </a>
        <a href="#assemble" className={styles.navLink}>
          <span className={styles.navDot} />
          <span>Your alliance</span>
        </a>
      </nav>

      <div className={styles.navActions}>
        <button
          type="button"
          className={`${styles.audioBtn} ${isPlaying ? styles.audioPlaying : ""}`}
          onClick={toggleAudio}
          aria-label={isPlaying ? "Turn audio off" : "Turn audio on"}
          title={isPlaying ? "Audio playing at low volume. Click to turn off." : "Audio off. Click to play."}
        >
          <span className={styles.eqWave} aria-hidden="true">
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
            <span className={styles.eqBar} />
          </span>
          <span className={styles.audioLabel}>{isPlaying ? "Sound ON" : "Sound OFF"}</span>
        </button>

        <Link className={styles.backBtn} href="/events">
          <span>All events</span>
          <span className={styles.backArrow}>↗</span>
        </Link>
      </div>
    </header>
    <section className={styles.hero} aria-labelledby="event-title">
      <div className={styles.heroArt} aria-hidden="true" /><div className={styles.heroHalo} aria-hidden="true" />
      <div className={styles.heroContent}><p className={styles.eyebrow}>PCCOE PRESENTS · PRAXIS 2026</p><p className={styles.prelude}>Whatever it takes.</p><h1 id="event-title"><span>THE INFINITY</span><strong>TRIALS</strong></h1><p className={styles.heroTagline}>Three trials. Six stones. <b>One ultimate champion.</b></p><p className={styles.heroDescription}>Follow the stones. Forge your alliance. Write your Endgame.</p><div className={styles.actions}><a className={styles.primary} href="#trials">Enter the Infinity Trail <span>↓</span></a><a className={styles.textLink} href="#assemble">Assemble your team <span>↗</span></a></div><div className={styles.heroMeta}><span>09—10 OCTOBER 2026</span><i /><span>PCCOE, NIGDI</span><i /><span>TEAMS OF FOUR</span></div></div>
      <div className={styles.heroBottom}><span>AN AVENGERS-INSPIRED TEAM CHALLENGE</span><a href="#trials">YOUR JOURNEY BEGINS BELOW ↓</a></div>
    </section>
    <div className={styles.factStrip}><div><strong>{event.prizePool}</strong><small>PRIZE POOL</small></div><div><strong>04</strong><small>PLAYERS PER TEAM</small></div><div><strong>03</strong><small>ESCALATING TRIALS</small></div><div><strong>06</strong><small>FINALIST TEAMS</small></div></div>
    <section id="trials" className={styles.journey} aria-labelledby="journey-title">
      <div className={styles.journeyIntro}><p className={styles.eyebrow}>ONE ROPE. SIX STONES. YOUR ENTIRE JOURNEY.</p><h2 id="journey-title">The path to <em>Endgame.</em></h2><p>Every stone holds a chapter. Follow the spell.<br />Discover the trials, the stakes, and your place in the story.</p></div>
      <div className={styles.journeyToolbar}><nav aria-label="Infinity stone chapters">{STONES.map((stone, index) => <a key={stone.name} href={`#${chapterIds[index]}`} style={{ "--stone": stone.color } as CSSProperties} aria-label={`${stone.name}: ${stone.label}`} onClick={() => setActive(index)}><i /><span>{index < 3 ? `Round 0${index + 1}` : ["Rewards", "Briefing", "Team entry"][index - 3]}</span></a>)}</nav><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "▶ Motion" : "Ⅱ Motion"}</button></div>
      <div className={styles.chapters}>{STONES.map((stone, index) => <StoneChapter key={stone.name} index={index} paused={paused} reduced={reduced} active={active} onActivate={setActive} />)}</div>
      <p className={styles.mappingNote}>The stones guide this journey. In Round 2, all six Infinity Stones are allocated by lottery and contested in paired treasure hunts.</p>
    </section>
    <section className={styles.final}><p className={styles.eyebrow}>THIS IS YOUR ENDGAME.</p><h2>Six stones. Four teammates.<br /><em>Whatever it takes.</em></h2><a className={styles.primary} href="#assemble">Find your alliance <span>↗</span></a><p>{event.date} · {event.venue}</p></section>
    <footer className={styles.footer}><Link className={styles.brand} href="/">PRAXIS <small>2026</small></Link><span>THE INFINITY TRIALS · PCCOE</span><Link href="/events">Discover more events ↗</Link></footer>
  </main>;
}
