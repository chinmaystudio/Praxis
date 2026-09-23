"use client";

import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import styles from "./arc-reactor.module.css";

type ArcReactorProps = { activeRound: number; paused?: boolean };
type PointerPosition = { x: number; y: number };

class ReactorBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ReactorFallback({ activeRound }: { activeRound: number }) {
  return (
    <svg className={styles.fallbackDrawing} viewBox="0 0 480 480" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="tr-core-glow"><stop stopColor="#edffff" /><stop offset=".42" stopColor="#88e7ec" /><stop offset="1" stopColor="#14464a" /></radialGradient>
        <linearGradient id="tr-reactor-metal" x1="80" y1="50" x2="400" y2="430" gradientUnits="userSpaceOnUse"><stop stopColor="#dac192" /><stop offset=".34" stopColor="#665343" /><stop offset=".7" stopColor="#302b28" /><stop offset="1" stopColor="#bca376" /></linearGradient>
        <linearGradient id="tr-reactor-steel" x1="90" y1="80" x2="350" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#737d83" /><stop offset=".48" stopColor="#17232b" /><stop offset="1" stopColor="#61717b" /></linearGradient>
      </defs>
      <circle cx="240" cy="240" r="186" fill="#11181b" stroke="#342e27" strokeWidth="5" />
      <circle cx="240" cy="240" r="169" stroke="url(#tr-reactor-metal)" strokeWidth="25" />
      <circle cx="240" cy="240" r="146" stroke="url(#tr-reactor-steel)" strokeWidth="12" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 30} 240 240)`}>
          <rect x="222" y="116" width="36" height="42" rx="4" fill="#372b24" stroke="#786047" strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((rib) => <path key={rib} d={`M225 ${122 + rib * 7}h30`} stroke="#b08857" strokeWidth="3" />)}
          <circle cx="240" cy="70" r="4" fill="#c3cbd0" />
        </g>
      ))}
      <circle cx="240" cy="240" r="92" stroke="#8adce3" strokeWidth="5" />
      <circle cx="240" cy="240" r="83" fill="#07171e" stroke="url(#tr-reactor-steel)" strokeWidth="10" />
      <circle cx="240" cy="240" r="68" fill="url(#tr-core-glow)" />
      <path d="M240 182 290 269H190Z" fill="#e9ffff" stroke="#7ddfe7" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="240" cy="240" r="193" stroke="#84edf0" strokeWidth="2" strokeDasharray="130 1083" transform={`rotate(${-90 + activeRound * 120} 240 240)`} />
    </svg>
  );
}

/** One draw call for repeated machined parts around the assembly. */
function RadialParts({ count, radius, z, size, color, offset = 0, emissive = false }: {
  count: number; radius: number; z: number; size: [number, number, number]; color: string; offset?: number; emissive?: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const transform = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * Math.PI * 2;
      transform.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      transform.rotation.set(0, 0, angle + Math.PI / 2);
      transform.updateMatrix();
      mesh.current?.setMatrixAt(i, transform.matrix);
    }
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
  }, [count, radius, z, offset]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={emissive ? 0.2 : 0.82} roughness={emissive ? 0.25 : 0.32} emissive={emissive ? color : "#000000"} emissiveIntensity={emissive ? 1.7 : 0} />
    </instancedMesh>
  );
}

function Ring({ radius, thickness, z, color, emissive = false }: { radius: number; thickness: number; z: number; color: string; emissive?: boolean }) {
  return (
    <mesh position={[0, 0, z]}>
      <torusGeometry args={[radius, thickness, 8, 80]} />
      <meshStandardMaterial color={color} metalness={emissive ? 0.15 : 0.85} roughness={emissive ? 0.3 : 0.26} emissive={emissive ? color : "#000000"} emissiveIntensity={emissive ? 1.8 : 0} />
    </mesh>
  );
}

function Assembly({ activeRound, animate, pointer }: { activeRound: number; animate: boolean; pointer: React.RefObject<PointerPosition> }) {
  const assembly = useRef<THREE.Group>(null);
  const trackingRing = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshStandardMaterial>(null);
  const elapsed = useRef(0);
  const triangle = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.39);
    shape.lineTo(-0.338, -0.195);
    shape.lineTo(0.338, -0.195);
    shape.closePath();
    return shape;
  }, []);

  useFrame((_state, delta) => {
    if (!animate || !assembly.current || !trackingRing.current) return;
    const frameDelta = Math.min(delta, 0.05);
    elapsed.current += frameDelta;
    assembly.current.rotation.x = THREE.MathUtils.damp(assembly.current.rotation.x, 0.18 - pointer.current.y * 0.18, 3, frameDelta);
    assembly.current.rotation.y = THREE.MathUtils.damp(assembly.current.rotation.y, -0.22 + pointer.current.x * 0.25, 3, frameDelta);
    trackingRing.current.rotation.z = THREE.MathUtils.damp(trackingRing.current.rotation.z, activeRound * (Math.PI * 2 / 3) + elapsed.current * 0.035, 2, frameDelta);
    if (core.current) core.current.emissiveIntensity = 1.6 + Math.sin(elapsed.current * 1.6) * 0.12;
  });

  return (
    <group ref={assembly} rotation={[0.18, -0.22, -0.12]}>
      {/* Stepped metal housing gives the reactor physical depth without imported models. */}
      <Ring radius={1.47} thickness={0.1} z={-0.15} color="#2d3338" />
      <Ring radius={1.43} thickness={0.055} z={0.005} color="#ba9970" />
      <mesh position={[0, 0, -0.05]}><ringGeometry args={[0.54, 1.44, 80]} /><meshStandardMaterial color="#26303a" metalness={0.8} roughness={0.38} side={THREE.DoubleSide} /></mesh>
      <Ring radius={1.32} thickness={0.07} z={0.03} color="#8e7454" />
      <Ring radius={1.19} thickness={0.032} z={0.07} color="#b5bfc4" />
      <Ring radius={0.84} thickness={0.11} z={0.1} color="#273641" />
      <Ring radius={0.77} thickness={0.037} z={0.19} color="#cab48c" />

      <RadialParts count={12} radius={1.015} z={0.1} size={[0.25, 0.35, 0.15]} color="#513c2b" />
      {[0, 1, 2, 3, 4].map((rib) => <RadialParts key={rib} count={12} radius={0.885 + rib * 0.063} z={0.2} size={[0.255, 0.024, 0.075]} color={rib % 2 ? "#ba864f" : "#d0a674"} />)}
      <RadialParts count={12} radius={1.365} z={0.082} size={[0.045, 0.045, 0.035]} color="#d5d7cf" offset={Math.PI / 12} />
      <RadialParts count={48} radius={1.235} z={0.063} size={[0.012, 0.044, 0.009]} color="#a89f86" />
      <RadialParts count={12} radius={0.68} z={0.17} size={[0.08, 0.105, 0.025]} color="#6ce8ed" emissive />

      <Ring radius={0.588} thickness={0.029} z={0.21} color="#87e8e9" emissive />
      <Ring radius={0.546} thickness={0.026} z={0.235} color="#a9b7be" />
      <mesh position={[0, 0, 0.14]}><circleGeometry args={[0.545, 64]} /><meshStandardMaterial color="#17363f" metalness={0.45} roughness={0.3} emissive="#398896" emissiveIntensity={0.45} /></mesh>
      <mesh position={[0, 0, 0.16]}><circleGeometry args={[0.45, 64]} /><meshBasicMaterial color="#9cebed" transparent opacity={0.26} depthWrite={false} /></mesh>
      <mesh position={[0, 0, 0.19]} scale={1.17}><shapeGeometry args={[triangle]} /><meshStandardMaterial color="#627982" metalness={0.8} roughness={0.21} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, 0.205]}><shapeGeometry args={[triangle]} /><meshStandardMaterial ref={core} color="#e0ffff" emissive="#a9f7ff" emissiveIntensity={1.6} roughness={0.3} side={THREE.DoubleSide} toneMapped={false} /></mesh>

      <group ref={trackingRing} rotation={[0, 0, activeRound * (Math.PI * 2 / 3)]}>
        <Ring radius={1.555} thickness={0.009} z={-0.05} color="#334f56" />
        {[0, 1, 2].map((segment) => (
          <mesh key={segment} position={[0, 0, -0.035]} rotation={[0, 0, segment * Math.PI * 2 / 3]}>
            <torusGeometry args={[1.56, segment === 0 ? 0.018 : 0.009, 6, 30, 0.58]} />
            <meshBasicMaterial color={segment === 0 ? "#b5faff" : "#56757b"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CanvasLifecycle({ onReady, onFailure }: { onReady: () => void; onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const contextLost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", contextLost);
    const frame = requestAnimationFrame(onReady);
    return () => { cancelAnimationFrame(frame); canvas.removeEventListener("webglcontextlost", contextLost); };
  }, [gl, onReady, onFailure]);
  return null;
}

export default function ArcReactor({ activeRound, paused = false }: ArcReactorProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerPosition>({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [background, setBackground] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const callbacks = useMemo(() => ({ onReady: () => setReady(true), onFailure: () => { setReady(false); setSupported(false); } }), []);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" });
    observer.observe(element);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChanged = () => setReducedMotion(query.matches);
    const visibilityChanged = () => setBackground(document.hidden);
    motionChanged();
    visibilityChanged();
    query.addEventListener("change", motionChanged);
    document.addEventListener("visibilitychange", visibilityChanged);
    if (!("WebGLRenderingContext" in window)) setSupported(false);
    return () => { observer.disconnect(); query.removeEventListener("change", motionChanged); document.removeEventListener("visibilitychange", visibilityChanged); };
  }, []);

  const animate = visible && !background && !paused && !reducedMotion;
  return (
    <div ref={wrapper} className={styles.reactor} aria-hidden="true" data-ready={ready} onPointerMove={(event) => {
      if (event.pointerType !== "mouse" || reducedMotion) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      pointer.current = { x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2, y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 };
    }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; }}>
      <div className={styles.ambient} />
      <div className={styles.fallback}><ReactorFallback activeRound={activeRound} /></div>
      {supported && <div className={styles.canvas}>
        <ReactorBoundary onFailure={callbacks.onFailure}>
          <Canvas dpr={[1, 1.5]} frameloop={animate ? "always" : "demand"} camera={{ position: [0, 0, 5.2], fov: 40 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={null}>
            <ambientLight intensity={1.7} />
            <directionalLight position={[3, 4, 5]} color="#ffe4b9" intensity={4.4} />
            <directionalLight position={[-4, 1, 3]} color="#87dfee" intensity={2.6} />
            <directionalLight position={[0, -3, 2]} color="#b65735" intensity={1.7} />
            <Assembly activeRound={activeRound} animate={animate} pointer={pointer} />
            <CanvasLifecycle {...callbacks} />
          </Canvas>
        </ReactorBoundary>
      </div>}
      <span className={styles.crosshairTop} />
      <span className={styles.crosshairBottom} />
    </div>
  );
}
