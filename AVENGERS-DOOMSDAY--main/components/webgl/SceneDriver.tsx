"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { signals, emitStrike } from "@/lib/signals";

/**
 * The heartbeat. One component owns the shared clock, decays the impulse
 * channels, smooths the pointer, and spawns lightning while the storm rages.
 * Everything else just reads `signals`.
 */
export default function SceneDriver() {
  const strikeTimer = useRef(0);
  const nextGap = useRef(0.6);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 20); // clamp huge tab-switch deltas
    signals.time = state.clock.getElapsedTime();

    // Impulse decay
    signals.shake *= Math.exp(-d * 3.4);
    signals.flash *= Math.exp(-d * 4.2);
    if (signals.shake < 0.0005) signals.shake = 0;
    if (signals.flash < 0.0005) signals.flash = 0;

    // Pointer smoothing (raw target -> smoothed)
    const k = 1 - Math.exp(-d * 7);
    signals.mx += (signals.mtx - signals.mx) * k;
    signals.my += (signals.mty - signals.my) * k;

    // Energy-scaled auto lightning while the storm rages. Threshold 0.2 keeps
    // the calm hero atmosphere (energy ~0.15) lightning-free.
    if (signals.energy > 0.2 && signals.portal < 0.02) {
      strikeTimer.current += d;
      if (strikeTimer.current >= nextGap.current) {
        strikeTimer.current = 0;
        const e = signals.energy;
        // more energy -> tighter gaps and stronger bolts
        nextGap.current = THREE.MathUtils.lerp(1.4, 0.11, e) * (0.6 + Math.random() * 0.8);
        emitStrike({
          x: (Math.random() - 0.5) * 1.7,
          y: 0.45 + Math.random() * 0.5,
          power: 0.4 + e * 0.55 + Math.random() * 0.15,
        });
      }
    }
  });

  return null;
}
