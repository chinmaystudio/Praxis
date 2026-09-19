"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { INFINITY_TRIALS } from "@/lib/infinity-trials";

type Props = {
  activeRound: number;
  selectedCore: number;
  finalMode: boolean;
  reducedMotion: boolean;
  scrollProgress: React.MutableRefObject<number>;
};

const TAU = Math.PI * 2;

function EnergyCore({ color }: { color: string }) {
  return (
    <group>
      <mesh>
        <octahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3.3} roughness={0.18} />
      </mesh>
      <mesh scale={1.6}>
        <octahedronGeometry args={[0.18, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} wireframe />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={2.8} />
    </group>
  );
}

function CircuitParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 340;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 2.6 + Math.random() * 4.8;
      const theta = Math.random() * TAU;
      data[i * 3] = Math.cos(theta) * radius;
      data[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      data[i * 3 + 2] = Math.sin(theta) * radius - 1;
    }
    return data;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current || reducedMotion || document.hidden) return;
    ref.current.rotation.y += delta * 0.025;
    ref.current.rotation.x += delta * 0.006;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#8edfff" size={0.018} transparent opacity={0.42} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function SentinelCore({
  activeRound,
  selectedCore,
  finalMode,
  reducedMotion,
  scrollProgress,
}: Props) {
  const root = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const coreOrbit = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Mesh>(null);
  const pointer = useRef(new THREE.Vector2());

  useFrame((state, delta) => {
    if (!root.current || !rings.current || !coreOrbit.current) return;
    const p = Math.min(1, scrollProgress.current * 2.2);
    pointer.current.lerp(state.pointer, reducedMotion ? 0 : 0.045);
    const targetY = (activeRound - 2) * -0.24 + pointer.current.x * 0.16;
    const targetX = pointer.current.y * -0.08;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetY, 3.8, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, targetX, 3.8, delta);
    root.current.position.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.55) * 0.05;
    root.current.scale.setScalar(0.78 + p * 0.22);

    if (!reducedMotion && !document.hidden) {
      rings.current.rotation.z += delta * (0.1 + p * 0.12);
      rings.current.rotation.y -= delta * 0.07;
      coreOrbit.current.rotation.z += delta * (finalMode ? 0.12 : 0.22);
    }

    const focus = -selectedCore * (TAU / 6) + Math.PI / 2;
    coreOrbit.current.rotation.z = THREE.MathUtils.damp(
      coreOrbit.current.rotation.z,
      finalMode ? Math.PI / 2 : focus,
      selectedCore >= 0 ? 0.7 : 0.12,
      delta,
    );
    if (scanner.current) {
      scanner.current.position.y = reducedMotion ? 0.35 : 1.25 - ((state.clock.elapsedTime * 0.48) % 2.5);
    }
  });

  return (
    <group ref={root} dispose={null}>
      <CircuitParticles reducedMotion={reducedMotion} />

      <group ref={rings}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.05, 0.035, 8, 96]} />
          <meshStandardMaterial color="#69737d" metalness={0.92} roughness={0.32} />
        </mesh>
        <mesh rotation={[Math.PI / 2.3, 0.2, 0]}>
          <torusGeometry args={[1.7, 0.025, 8, 96]} />
          <meshStandardMaterial color="#2d3740" metalness={0.95} roughness={0.28} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 12) * TAU]} position={[Math.cos((i / 12) * TAU) * 2.05, Math.sin((i / 12) * TAU) * 2.05, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.12]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#ff2b35" : "#48515a"} metalness={0.9} roughness={0.3} emissive={i % 3 === 0 ? "#5d0509" : "#000000"} />
          </mesh>
        ))}
      </group>

      <group>
        <mesh position={[0, 0.2, 0]} scale={[1.45, 1.2, 0.55]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#11161c" metalness={0.96} roughness={0.34} />
        </mesh>
        <mesh position={[0, -0.72, 0.16]} rotation={[0, 0, Math.PI / 4]} scale={[0.78, 0.78, 0.32]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#1f2932" metalness={0.95} roughness={0.38} />
        </mesh>
        <mesh position={[-0.82, 0.22, 0.48]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.72, 0.18, 0.14]} />
          <meshStandardMaterial color="#ff2b35" emissive="#ff0712" emissiveIntensity={5} toneMapped={false} />
        </mesh>
        <mesh position={[0.82, 0.22, 0.48]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.72, 0.18, 0.14]} />
          <meshStandardMaterial color="#ff2b35" emissive="#ff0712" emissiveIntensity={5} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.38, 0.58]}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial color="#dff7ff" emissive="#36c8ff" emissiveIntensity={4} roughness={0.12} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.38, 0.58]} scale={1.55}>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshBasicMaterial color="#36c8ff" wireframe transparent opacity={0.2} />
        </mesh>
        <mesh ref={scanner} position={[0, 0.8, 0.72]}>
          <boxGeometry args={[3.5, 0.012, 0.01]} />
          <meshBasicMaterial color="#ff2b35" transparent opacity={0.65} toneMapped={false} />
        </mesh>
      </group>

      <group ref={coreOrbit}>
        {INFINITY_TRIALS.powerCores.map((core, index) => {
          const angle = (index / 6) * TAU;
          const radius = finalMode ? 2.15 : 2.65;
          const isSelected = index === selectedCore;
          return (
            <group
              key={core.id}
              position={[Math.cos(angle) * radius, Math.sin(angle) * radius, isSelected ? 0.6 : 0]}
              scale={isSelected ? 1.38 : 1}
            >
              <EnergyCore color={core.color} />
            </group>
          );
        })}
      </group>
    </group>
  );
}
