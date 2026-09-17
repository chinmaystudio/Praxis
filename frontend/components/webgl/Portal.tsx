"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLSL_SIMPLEX, GLSL_FBM } from "@/lib/glsl";
import { signals } from "@/lib/signals";

/**
 * The rift. A polar-coordinate energy tunnel: swirling fbm filaments around a
 * dark eye, a blazing rim, and a center that whites out as the camera dives
 * through. Driven entirely by `signals.portal` (0 = closed, 1 = fully through).
 */
export default function Portal() {
  const mesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(6, 6, 1, 1);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpen: { value: 0 },
        uDive: { value: 0 },
        uColorDeep: { value: new THREE.Color("#06120d") },
        uColorMid: { value: new THREE.Color("#0aa76a") },
        uColorBright: { value: new THREE.Color("#7dffc4") },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime, uOpen, uDive;
        uniform vec3 uColorDeep, uColorMid, uColorBright;
        ${GLSL_SIMPLEX}
        ${GLSL_FBM}
        void main(){
          vec2 c = vUv - 0.5;
          float r = length(c) * 2.0;
          float ang = atan(c.y, c.x);

          // swirling filaments in polar space
          float swirl = ang * 3.0 + (1.0 - r) * 6.0 - uTime * 1.6;
          vec3 sp = vec3(cos(swirl) * r * 2.2, sin(swirl) * r * 2.2, uTime * 0.35);
          float fil = fbm(sp) * 0.5 + 0.5;
          fil = pow(fil, 1.6);

          float rimFade = smoothstep(1.02, 0.45, r);      // fade beyond the disk
          float ring = smoothstep(0.17, 0.0, abs(r - 0.54)) * 1.6; // blazing rim
          float eye = smoothstep(0.34, 0.0, r);            // dark eye
          float body = fil * rimFade * (1.0 - eye * 0.7);

          vec3 col = mix(uColorDeep, uColorMid, body);
          col = mix(col, uColorBright, ring + body * 0.35);

          // center whites out on the dive
          float flash = smoothstep(0.55, 0.0, r) * uDive;
          col += flash * vec3(1.0);

          float alpha = (ring + body + flash) * rimFade * uOpen;
          if(alpha < 0.004) discard;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.z = -1.0;
    m.renderOrder = 4;
    m.visible = false;
    return m;
  }, []);

  useEffect(() => {
    const m = mesh;
    return () => {
      m.geometry.dispose();
      (m.material as THREE.ShaderMaterial).dispose();
    };
  }, [mesh]);

  useFrame(() => {
    const portal = signals.portal;
    mesh.visible = portal > 0.001;
    if (!mesh.visible) return;
    const u = (mesh.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = signals.time;
    u.uOpen.value = THREE.MathUtils.clamp(portal / 0.14, 0, 1);
    u.uDive.value = THREE.MathUtils.smoothstep(portal, 0.55, 1.0);
    mesh.scale.setScalar(0.25 + Math.pow(portal, 2.3) * 16.0);
  });

  return <primitive object={mesh} />;
}
