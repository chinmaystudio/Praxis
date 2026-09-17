"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { onStrike, signals, onCue } from "@/lib/signals";

const HALF_W = 5.4;
const HALF_H = 3.1;
const COUNT = 1400;

/**
 * Pooled spark bursts. Each lightning strike (and the Scene-04 detonation)
 * throws a cluster of hot embers that arc out with gravity and drag, then die.
 * CPU-integrated — trivial at this count — and drawn additively so bloom melts
 * them into glowing sparks.
 */
export default function Sparks() {
  const vel = useRef(new Float32Array(COUNT * 3));
  const life = useRef(new Float32Array(COUNT));
  const maxLife = useRef(new Float32Array(COUNT));
  const cursor = useRef(0);

  const points = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const aLife = new Float32Array(COUNT);
    const aSeed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 1] = -9999; // parked offscreen
      aSeed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(aLife, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: 1 },
        uColorHot: { value: new THREE.Color("#eafff2") },
        uColorCool: { value: new THREE.Color("#00ff9c") },
      },
      vertexShader: /* glsl */ `
        attribute float aLife;
        attribute float aSeed;
        uniform float uPixelRatio;
        varying float vLife;
        void main(){
          vLife = aLife;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mv;
          float depth = -mv.z;
          gl_PointSize = (2.0 + aSeed * 7.0) * aLife * uPixelRatio * clamp(26.0/depth, 0.4, 2.6);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColorHot, uColorCool;
        varying float vLife;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float mask = smoothstep(0.5, 0.0, d);
          vec3 col = mix(uColorCool, uColorHot, smoothstep(0.3, 1.0, vLife));
          gl_FragColor = vec4(col, mask * vLife);
          if(gl_FragColor.a < 0.004) discard;
        }
      `,
    });
    return new THREE.Points(geo, mat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = points;
    return () => {
      p.geometry.dispose();
      (p.material as THREE.ShaderMaterial).dispose();
    };
  }, [points]);

  const burst = (x: number, y: number, power: number, big = false) => {
    const pos = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const parr = pos.array as Float32Array;
    const n = big ? 320 : Math.floor(40 + power * 80);
    const wx = x * HALF_W;
    const wy = y * HALF_H;
    for (let k = 0; k < n; k++) {
      const i = cursor.current % COUNT;
      cursor.current++;
      const speed = (big ? 6 : 3) * (0.3 + Math.random());
      const ang = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.5) * Math.PI;
      const ce = Math.cos(elev);
      vel.current[i * 3] = Math.cos(ang) * ce * speed;
      vel.current[i * 3 + 1] = Math.sin(elev) * speed + 1.2;
      vel.current[i * 3 + 2] = Math.sin(ang) * ce * speed * 0.6;
      parr[i * 3] = wx + (Math.random() - 0.5) * 0.3;
      parr[i * 3 + 1] = wy + (Math.random() - 0.5) * 0.3;
      parr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      const lf = (big ? 1.4 : 0.7) * (0.5 + Math.random() * 0.8);
      life.current[i] = lf;
      maxLife.current[i] = lf;
    }
    pos.needsUpdate = true;
  };

  useEffect(() => {
    const off1 = onStrike((d) => burst(d.x, d.y, d.power, d.mega));
    const off2 = onCue("detonate", () => burst(0, 0.05, 1, true));
    return () => {
      off1();
      off2();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 20);
    const pos = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const parr = pos.array as Float32Array;
    const aLife = points.geometry.getAttribute("aLife") as THREE.BufferAttribute;
    const larr = aLife.array as Float32Array;
    const v = vel.current;
    let dirty = false;
    for (let i = 0; i < COUNT; i++) {
      if (life.current[i] <= 0) {
        if (larr[i] !== 0) {
          larr[i] = 0;
          dirty = true;
        }
        continue;
      }
      life.current[i] -= d;
      v[i * 3 + 1] -= 7.5 * d; // gravity
      const drag = Math.exp(-d * 1.7);
      v[i * 3] *= drag;
      v[i * 3 + 1] *= drag;
      v[i * 3 + 2] *= drag;
      parr[i * 3] += v[i * 3] * d;
      parr[i * 3 + 1] += v[i * 3 + 1] * d;
      parr[i * 3 + 2] += v[i * 3 + 2] * d;
      larr[i] = Math.max(0, life.current[i] / maxLife.current[i]);
      dirty = true;
    }
    if (dirty) {
      pos.needsUpdate = true;
      aLife.needsUpdate = true;
    }
    (points.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return <primitive object={points} />;
}
