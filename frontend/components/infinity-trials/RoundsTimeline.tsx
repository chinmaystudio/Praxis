"use client";

import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import { INFINITY_TRIALS } from "@/lib/infinity-trials";
import styles from "./infinity-trials.module.css";

type Props = {
  activeRound: number;
  onChange: (index: number) => void;
};

export default function RoundsTimeline({ activeRound, onChange }: Props) {
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = INFINITY_TRIALS.rounds.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    onChange(next);
    tabs.current[next]?.focus();
  };

  const round = INFINITY_TRIALS.rounds[activeRound];

  return (
    <div className={styles.timelineShell} style={{ "--round-accent": round.accent } as CSSProperties}>
      <div className={styles.roundTabs} role="tablist" aria-label="Competition rounds">
        {INFINITY_TRIALS.rounds.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => { tabs.current[index] = node; }}
            className={`${styles.roundTab} ${activeRound === index ? styles.roundTabActive : ""}`}
            type="button"
            role="tab"
            aria-selected={activeRound === index}
            aria-controls={`round-panel-${item.id}`}
            tabIndex={activeRound === index ? 0 : -1}
            onClick={() => onChange(index)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <span>0{item.id}</span>
            <strong>{item.title}</strong>
            <i aria-hidden />
          </button>
        ))}
      </div>

      <article
        className={styles.roundPanel}
        id={`round-panel-${round.id}`}
        role="tabpanel"
        aria-labelledby={`round-${round.id}`}
        key={round.id}
      >
        <div className={styles.roundHeader}>
          <span className={styles.monoLabel}>{round.codename}</span>
          <span className={styles.roundIndex} aria-hidden>0{round.id}</span>
        </div>
        <h3 id={`round-${round.id}`}>{round.title}</h3>
        <p className={styles.roundSummary}>{round.summary}</p>
        <ul>
          {round.details.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      </article>
    </div>
  );
}
