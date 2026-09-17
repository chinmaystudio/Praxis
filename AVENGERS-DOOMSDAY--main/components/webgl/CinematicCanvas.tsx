"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import SceneDriver from "./SceneDriver";
import CameraRig from "./CameraRig";
import ParticleField from "./ParticleField";
import VolumetricFog from "./VolumetricFog";
import Lightning from "./Lightning";
import Sparks from "./Sparks";
import Portal from "./Portal";
import Showcase from "./showcase/Showcase";

/**
 * The green atmosphere layer — a TRANSPARENT WebGL canvas that sits on top of
 * the DOM `<video>` trailers (see VideoLayer). Everything here is additive
 * (particles, fog, lightning, portal) so it glows over the footage while the
 * transparent areas let the video show straight through.
 */
export default function CinematicCanvas() {
  return (
    <Canvas
      className="canvas-layer"
      gl={{
        antialias: false,
        alpha: true,
        stencil: false,
        depth: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 120 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0); // fully transparent so the video shows
        scene.background = null;
      }}
    >
      <SceneDriver />
      <CameraRig />

      {/* deep void dust */}
      <ParticleField
        mode="dust"
        count={7000}
        colorA="#00ff9c"
        colorB="#9dffd6"
        size={4.6}
        spread={[38, 22, 18]}
        drift={1}
        mouseStrength={1.2}
      />

      <VolumetricFog />

      {/* embers drifting in front — atmosphere over the footage */}
      <ParticleField
        mode="ember"
        count={1600}
        colorA="#12b877"
        colorB="#d7ffef"
        size={6}
        spread={[26, 20, 9]}
        rise={1.5}
        drift={0.6}
        mouseStrength={0.5}
        opacity={0.9}
      />

      <Lightning />
      <Sparks />
      <Portal />

      {/* Phase 2 · Section 2 — character showcase (self-gates on signals.showcase) */}
      <Showcase />

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
