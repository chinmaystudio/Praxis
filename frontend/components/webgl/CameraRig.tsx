"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { signals } from "@/lib/signals";

const target = new THREE.Vector3();

/**
 * Cinematic camera. Stays anchored ~6u back and sells motion through:
 *  - pointer parallax (the scene leans with the cursor)
 *  - additive shake driven by lightning strikes / the detonation
 *  - a subtle forward dolly for the portal dive + scroll push
 * The camera never physically flies through geometry — the portal rushes the
 * lens instead — which keeps the fullscreen video planes perfectly framed.
 */
export default function CameraRig() {
  useFrame((state) => {
    const cam = state.camera;
    const t = signals.time;
    const shake = signals.shake;

    const sx = (Math.sin(t * 54.0) + Math.sin(t * 97.3)) * 0.5 * shake * 0.4;
    const sy = (Math.cos(t * 61.0) + Math.sin(t * 88.7)) * 0.5 * shake * 0.4;

    // Section 2 (showcase): a gentle push-in + slow cinematic drift + a touch
    // more parallax so the character section feels alive.
    const sc = signals.showcase;
    const driftX = Math.sin(t * 0.17) * 0.5 * sc;
    const driftY = Math.cos(t * 0.13) * 0.26 * sc;

    // Section 4 (reel): the atmosphere pans gently with the horizontal travel.
    // Section 5 (finale): a slow breathing float + a touch of push-in.
    const fin = signals.finale;
    const reelAmt = signals.reel * (1 - fin);
    const reelPan = Math.sin(t * 0.12) * 0.35 * reelAmt;
    const finFloatX = Math.sin(t * 0.09) * 0.18 * fin;
    const finFloatY = Math.cos(t * 0.11) * 0.12 * fin;

    const tx = signals.mx * (0.7 + sc * 0.5 + reelAmt * 0.2) + sx + driftX + reelPan + finFloatX;
    const ty = signals.my * (0.5 + sc * 0.3) + sy + driftY + sc * 0.12 + finFloatY;
    const tz = 6 - signals.dolly * 1.7 - sc * 1.1 - fin * 0.7;

    cam.position.x += (tx - cam.position.x) * 0.06;
    cam.position.y += (ty - cam.position.y) * 0.06;
    cam.position.z += (tz - cam.position.z) * 0.07;

    target.set(signals.mx * -0.22 + driftX * 0.5, signals.my * -0.16 + sc * 0.08, 0);
    cam.lookAt(target);

    // roll from shake, applied after lookAt
    const roll = shake * Math.sin(t * 40.0) * 0.03;
    cam.rotateZ(roll);
  });

  return null;
}
