"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLSL_SIMPLEX } from "@/lib/glsl";
import { signals } from "@/lib/signals";

/**
 * GPU particle field. One configurable system used twice:
 *  - "dust"  : the void — a deep, slowly curling volume that fills 3D space
 *  - "ember" : warm motes that rise, layered in front as atmosphere over video
 *
 * Everything animates on the GPU (simplex curl + mouse repulsion), so tens of
 * thousands of points cost almost nothing on the CPU side.
 */
export type FieldMode = "dust" | "ember";

interface Props {
  count?: number;
  mode?: FieldMode;
  colorA?: THREE.ColorRepresentation;
  colorB?: THREE.ColorRepresentation;
  size?: number;
  opacity?: number;
  spread?: [number, number, number];
  drift?: number;
  rise?: number;
  mouseStrength?: number;
}

export default function ParticleField({
  count = 7000,
  mode = "dust",
  colorA = "#00ff9c",
  colorB = "#9dffd6",
  size = 26,
  opacity = 1,
  spread = [34, 20, 16],
  drift = 1,
  rise = 0,
  mouseStrength = 1.15,
}: Props) {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const [sx, sy, sz] = spread;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * sx;
      positions[i * 3 + 1] = (Math.random() - 0.5) * sy;
      // push most dust behind the focal plane, embers toward the camera
      positions[i * 3 + 2] =
        mode === "ember"
          ? Math.random() * sz - sz * 0.15
          : (Math.random() - 0.5) * sz - 2.0;
      seeds[i] = Math.random();
      scales[i] = 0.35 + Math.pow(Math.random(), 1.8) * 1.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseRange: { value: new THREE.Vector2(sx * 0.42, sy * 0.42) },
        uEnergy: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: size },
        uPixelRatio: { value: 1 },
        uOpacity: { value: opacity },
        uColorA: { value: new THREE.Color(colorA) },
        uColorB: { value: new THREE.Color(colorB) },
        uDrift: { value: drift },
        uRise: { value: rise },
        uSpreadY: { value: sy },
        uMouseStrength: { value: mouseStrength },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        attribute float aScale;
        uniform float uTime, uEnergy, uReveal, uSize, uPixelRatio, uDrift, uRise, uSpreadY, uMouseStrength;
        uniform vec2 uMouse, uMouseRange;
        varying float vAlpha;
        varying float vMix;
        ${GLSL_SIMPLEX}
        void main(){
          vec3 p = position;

          // rising loop for embers
          if(uRise > 0.001){
            float range = uSpreadY + 6.0;
            p.y = mod(position.y + uTime * uRise * (0.5 + aScale) + aSeed * 40.0, range) - range * 0.5;
          }

          // slow curl drift
          float t = uTime * 0.12 * uDrift;
          vec3 np = p * 0.05 + vec3(aSeed * 12.0, t, t * 0.7);
          vec3 disp = vec3(snoise(np), snoise(np + 19.1), snoise(np + 7.3));
          p += disp * (1.1 + uEnergy * 0.6);

          // pointer repulsion — the void reacts to the cursor
          vec2 m = uMouse * uMouseRange;
          vec2 d = p.xy - m;
          float dist = length(d);
          float infl = smoothstep(5.0, 0.0, dist);
          p.xy += normalize(d + 1e-4) * infl * uMouseStrength * (0.7 + 0.3 * sin(uTime * 2.0 + aSeed * 6.28));

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;

          float depth = -mv.z;
          float sizeAtten = clamp(9.0 / depth, 0.3, 7.0);
          gl_PointSize = uSize * aScale * uPixelRatio * sizeAtten * (0.75 + uEnergy * 0.4);

          float twinkle = 0.6 + 0.4 * sin(uTime * (1.2 + aSeed * 2.0) + aSeed * 30.0);
          float near = smoothstep(0.2, 2.2, depth);        // fade points hugging the camera
          float far  = smoothstep(42.0, 12.0, depth);      // fade the deep background
          vAlpha = twinkle * uReveal * near * far * (0.9 + uEnergy * 0.45);
          vMix = aSeed;
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColorA, uColorB;
        uniform float uOpacity;
        varying float vAlpha;
        varying float vMix;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float mask = smoothstep(0.5, 0.0, d);
          float core = smoothstep(0.16, 0.0, d);
          vec3 col = mix(uColorA, uColorB, vMix) + core * 0.9;
          float a = mask * vAlpha * uOpacity;
          if(a < 0.003) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = mode === "ember" ? 5 : 1;
    return pts;
    // Created once — props are constant per instance. Dynamic values (pixel
    // ratio, time, energy, reveal) are pushed in useFrame so an AdaptiveDpr
    // change never rebuilds the geometry and resets the fade-in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, mode]);

  useEffect(() => {
    const p = points;
    return () => {
      p.geometry.dispose();
      (p.material as THREE.ShaderMaterial).dispose();
    };
  }, [points]);

  useFrame((state, dt) => {
    const u = (points.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = signals.time;
    (u.uMouse.value as THREE.Vector2).set(signals.mx, signals.my);
    u.uEnergy.value = signals.energy;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    // gentle fade-in, ramped per-frame so it never depends on absolute clock
    u.uReveal.value = Math.min(1, u.uReveal.value + Math.min(dt, 0.05) * 0.9);
  });

  return <primitive object={points} />;
}
