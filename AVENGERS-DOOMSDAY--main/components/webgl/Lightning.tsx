"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { onStrike, signals, type StrikeDetail } from "@/lib/signals";

const HALF_W = 5.4;
const HALF_H = 3.1;
const MAX_VERTS = 900; // per bolt (main + branches), segment pairs

type Bolt = {
  seg: THREE.LineSegments;
  mat: THREE.ShaderMaterial;
  life: number;
  ttl: number;
  reflickAt: number;
};

/** Recursive midpoint-displacement path between two points. */
function fractalPath(a: THREE.Vector3, b: THREE.Vector3, iters: number, amp: number) {
  let pts = [a.clone(), b.clone()];
  for (let it = 0; it < iters; it++) {
    const next: THREE.Vector3[] = [];
    const a2 = amp * Math.pow(0.55, it);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const dir = p1.clone().sub(p0);
      const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
      const off = (Math.random() - 0.5) * a2;
      mid.add(perp.multiplyScalar(off));
      mid.z += (Math.random() - 0.5) * a2 * 0.4;
      next.push(p0);
      next.push(mid);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

function buildStrike(detail: StrikeDetail): Float32Array {
  const verts: number[] = [];
  const push = (pts: THREE.Vector3[]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      verts.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z);
    }
  };

  const root = new THREE.Vector3(detail.x * HALF_W, detail.y * HALF_H, (Math.random() - 0.5) * 2);
  const spread = detail.mega ? 1.9 : 1.0;

  // Main arteries fan out across the frame.
  const arteries = detail.mega ? 5 : 2 + Math.floor(Math.random() * 2);
  const mains: THREE.Vector3[][] = [];
  for (let m = 0; m < arteries; m++) {
    const ang = Math.random() * Math.PI * 2;
    const len = (2.6 + Math.random() * 4.2) * spread;
    const end = new THREE.Vector3(
      root.x + Math.cos(ang) * len,
      root.y + Math.sin(ang) * len - (detail.mega ? 0 : 1.2),
      root.z + (Math.random() - 0.5) * 2,
    );
    const path = fractalPath(root, end, 6, 1.5 * spread);
    mains.push(path);
    push(path);
  }

  // Veins branching off the arteries.
  const branchCount = detail.mega ? 26 : 6 + Math.floor(Math.random() * 6);
  for (let b = 0; b < branchCount; b++) {
    const main = mains[Math.floor(Math.random() * mains.length)];
    const start = main[Math.floor(Math.random() * main.length)].clone();
    const ang = Math.random() * Math.PI * 2;
    const len = (0.6 + Math.random() * 1.8) * spread;
    const end = new THREE.Vector3(
      start.x + Math.cos(ang) * len,
      start.y + Math.sin(ang) * len,
      start.z + (Math.random() - 0.5) * 1.5,
    );
    push(fractalPath(start, end, 4, 0.8 * spread));
    if (verts.length / 6 > MAX_VERTS) break;
  }

  const arr = new Float32Array(MAX_VERTS * 6);
  arr.set(verts.slice(0, MAX_VERTS * 6));
  return arr;
}

export default function Lightning() {
  const group = useRef<THREE.Group>(null);
  const boltsRef = useRef<Bolt[]>([]);
  const cursor = useRef(0);

  const bolts = useMemo(() => {
    const list: Bolt[] = [];
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MAX_VERTS * 6), 3));
      geo.setDrawRange(0, 0);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#a8ffcf") },
        },
        vertexShader: /* glsl */ `
          void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform float uOpacity; uniform vec3 uColor;
          void main(){ gl_FragColor = vec4(uColor, uOpacity); }
        `,
      });
      const seg = new THREE.LineSegments(geo, mat);
      seg.frustumCulled = false;
      seg.renderOrder = 6;
      list.push({ seg, mat, life: 0, ttl: 1, reflickAt: 0 });
    }
    return list;
  }, []);

  useEffect(() => {
    boltsRef.current = bolts;
    return () => {
      bolts.forEach((b) => {
        b.seg.geometry.dispose();
        b.mat.dispose();
      });
    };
  }, [bolts]);

  useEffect(() => {
    return onStrike((detail) => {
      const list = boltsRef.current;
      if (!list.length) return;
      const bolt = list[cursor.current % list.length];
      cursor.current++;
      const arr = buildStrike(detail);
      const attr = bolt.seg.geometry.getAttribute("position") as THREE.BufferAttribute;
      (attr.array as Float32Array).set(arr);
      attr.needsUpdate = true;
      // count actual used verts (trailing zeros collapse to origin — trim them)
      let used = MAX_VERTS * 6;
      for (let i = arr.length - 3; i >= 0; i -= 3) {
        if (arr[i] !== 0 || arr[i + 1] !== 0 || arr[i + 2] !== 0) {
          used = i + 3;
          break;
        }
      }
      bolt.seg.geometry.setDrawRange(0, used / 3);
      bolt.mat.uniforms.uColor.value.set(detail.mega ? "#eafff5" : "#a8ffcf");
      bolt.life = 1;
      bolt.ttl = detail.mega ? 0.5 : 0.16 + Math.random() * 0.12;
      bolt.reflickAt = bolt.ttl * (0.4 + Math.random() * 0.3);
    });
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 20);
    for (const b of bolts) {
      if (b.life <= 0) {
        if (b.mat.uniforms.uOpacity.value !== 0) b.mat.uniforms.uOpacity.value = 0;
        continue;
      }
      b.life -= d / b.ttl;
      // strobe flicker
      const flick = 0.35 + 0.65 * Math.abs(Math.sin(signals.time * 90 + b.ttl * 30));
      b.mat.uniforms.uOpacity.value = Math.max(0, b.life) * flick * 1.6;
    }
  });

  return (
    <group ref={group}>
      {bolts.map((b, i) => (
        <primitive key={i} object={b.seg} />
      ))}
    </group>
  );
}
