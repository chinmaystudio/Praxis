"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { signals } from "@/lib/signals";

/**
 * Cinematic grade. Bloom melts the additive energy into glow; chromatic
 * aberration punches on every strike, the portal dive and the shatter; a soft
 * vignette + film grain seal the filmic look. Because the videos live *inside*
 * the scene, they receive the exact same grade — one continuous image.
 */
export default function Effects() {
  const caRef = useRef<{ offset: Vector2 } | null>(null);
  const bloomRef = useRef<{ intensity: number } | null>(null);

  useFrame(() => {
    const s = signals;
    const ca = caRef.current;
    if (ca) {
      const amt =
        0.00045 + s.flash * 0.0022 + s.portal * 0.006 + s.shatter * 0.004 + s.collapse * 0.0022;
      ca.offset.set(amt, amt * 0.65);
    }
    const b = bloomRef.current;
    if (b) {
      b.intensity = 0.5 + s.energy * 0.32 + s.flash * 0.55 + s.reveal * 0.4 + s.portal * 0.45;
    }
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        ref={bloomRef as never}
        intensity={0.55}
        luminanceThreshold={0.42}
        luminanceSmoothing={0.85}
        mipmapBlur
        radius={0.62}
      />
      <ChromaticAberration
        ref={caRef as never}
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0007, 0.0005)}
        radialModulation={false}
        modulationOffset={0.2}
      />
      <Vignette eskil={false} offset={0.26} darkness={0.78} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.05} />
    </EffectComposer>
  );
}
