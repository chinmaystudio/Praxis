"use client";

import type { CSSProperties } from "react";
import { INFINITY_TRIALS } from "@/lib/infinity-trials";
import styles from "./infinity-trials.module.css";

type Props = {
  selected: number;
  onSelect: (index: number) => void;
};

export default function PowerCoreSelector({ selected, onSelect }: Props) {
  const active = INFINITY_TRIALS.powerCores[selected];
  return (
    <div className={styles.coreConsole} style={{ "--core-color": active.color } as CSSProperties}>
      <div className={styles.coreGrid} role="group" aria-label="Six power cores">
        {INFINITY_TRIALS.powerCores.map((core, index) => (
          <button
            key={core.id}
            type="button"
            className={`${styles.coreButton} ${selected === index ? styles.coreButtonActive : ""}`}
            style={{ "--item-color": core.color } as CSSProperties}
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
            onFocus={() => onSelect(index)}
          >
            <span className={styles.coreOrb} aria-hidden><i /></span>
            <span><small>Core 0{index + 1}</small>{core.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.coreReadout} aria-live="polite">
        <div>
          <span className={styles.monoLabel}>Selected system</span>
          <h3>{active.label}</h3>
        </div>
        <dl>
          <div><dt>Status</dt><dd>Unclaimed</dd></div>
          <div><dt>Round 2</dt><dd>Two teams compete</dd></div>
          <div><dt>Round 3 effect</dt><dd>1 Buff + 1 Debuff</dd></div>
          <div><dt>Ability</dt><dd>Classified</dd></div>
        </dl>
      </div>
    </div>
  );
}
