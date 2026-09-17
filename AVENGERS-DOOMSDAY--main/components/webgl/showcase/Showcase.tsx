"use client";

import DoomModel from "./DoomModel";

/**
 * Section 2 — the character showcase. A rim-lit Doom placeholder at centre; the
 * six character cards now orbit as real DOM <video> panels (components/overlays/
 * CharacterOrbit) straddling this canvas in z, so cards genuinely pass behind the
 * model. Lights only touch the lit (Standard) materials of the model; the additive
 * atmosphere ignores them. Self-gates on `signals.showcase`.
 */
export default function Showcase() {
  return (
    <>
      {/* dim green ambient so the dark metal never crushes to pure black */}
      <ambientLight color="#12271d" intensity={1.6} />
      {/* cool key from the front-top gives form */}
      <directionalLight color="#d6ecff" intensity={2.6} position={[3.5, 5, 4]} />
      {/* strong green rim from behind — the cinematic edge glow */}
      <pointLight color="#00ff9c" intensity={55} distance={26} decay={2} position={[-4.2, 3, -3.2]} />
      {/* soft green fill from the front-right */}
      <pointLight color="#39ffb4" intensity={22} distance={20} decay={2} position={[4, 1.2, 3]} />
      {/* faint underglow */}
      <pointLight color="#00b473" intensity={10} distance={10} decay={2} position={[0, -1.6, 1.5]} />

      <DoomModel />
    </>
  );
}
