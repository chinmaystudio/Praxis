"use client";
import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { STONES } from "./trail-data";

type Props = { index: number; paused: boolean; active: boolean; onReady: () => void; onFailure: () => void };
class Boundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Relic({ index, paused, active, onReady }: Props) {
  const gem = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const sparks = useRef<THREE.Points>(null);
  const time = useRef(0);
  const color = STONES[index].color;
  const uniforms = useMemo(() => ({ time: { value: 0 } }), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({length:65},(_,i)=>{
    const t=i/64;return new THREE.Vector3(-4.8+t*9.6,Math.sin(t*Math.PI*2)*.4-.25,Math.cos(t*Math.PI*2)*.45);
  })), []);
  const positions = useMemo(() => new Float32Array(110 * 3), []);
  useEffect(() => { onReady(); }, [onReady]);
  useFrame((_, delta) => {
    if (!paused) time.current += Math.min(delta, .04);
    const t=time.current;
    uniforms.time.value=t;
    if(gem.current){gem.current.rotation.y=t*.32+index;gem.current.position.y=Math.sin(t*1.15)*.09;gem.current.rotation.z=Math.sin(t*.6)*.09;}
    if(ring.current) ring.current.rotation.z=t*.07;
    if(sparks.current){for(let i=0;i<110;i++){const p=curve.getPoint((i/110+t*.035)%1);positions[i*3]=p.x;positions[i*3+1]=p.y+Math.sin(i*2.4+t)*.22;positions[i*3+2]=p.z+Math.cos(i*2.4+t)*.18;}sparks.current.geometry.attributes.position.needsUpdate=true;}
  });
  return <>
    <ambientLight intensity={.7}/><directionalLight position={[3,5,5]} intensity={3}/><directionalLight position={[-3,-2,3]} intensity={1.5} color="#a4b6ff"/>
    <group ref={gem} scale={active?1.08:1}>
      <mesh scale={[.72,1.23,.7]}><icosahedronGeometry args={[.73,1]}/><meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={.25} metalness={.38} roughness={.13} clearcoat={1} flatShading/></mesh>
      <mesh scale={[.725,1.235,.705]}><icosahedronGeometry args={[.73,1]}/><meshBasicMaterial wireframe color={color} transparent opacity={.16}/></mesh>
      <mesh scale={[.25,.53,.3]}><octahedronGeometry args={[.75]}/><meshBasicMaterial color={new THREE.Color(color).multiplyScalar(2)}/></mesh>
    </group>
    <group ref={ring} rotation={[.12,.15,0]}>
      {[1.13,1.28,1.43].map((r,i)=><mesh key={r}><torusGeometry args={[r,i===1?.012:.007,4,100]}/><meshBasicMaterial color="#f5a044" transparent opacity={.65}/></mesh>)}
      {Array.from({length:32},(_,i)=><mesh key={i} position={[Math.cos(i*Math.PI/16)*1.36,Math.sin(i*Math.PI/16)*1.36,0]} rotation={[0,0,i*Math.PI/16]}><boxGeometry args={[i%4===0?.12:.04,.014,.01]}/><meshBasicMaterial color="#ffbc6c"/></mesh>)}
    </group>
    <mesh><tubeGeometry args={[curve,100,.018,5,false]}/><shaderMaterial uniforms={uniforms} vertexShader="uniform float time; void main(){ vec3 p=position; p.y+=sin(p.x*5.0+time*2.0)*.025; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }" fragmentShader="void main(){gl_FragColor=vec4(3.8,1.1,.13,1.0);}"/></mesh>
    <points ref={sparks}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]} usage={THREE.DynamicDrawUsage}/></bufferGeometry><pointsMaterial size={1.6} color="#ffa443" transparent opacity={.8} sizeAttenuation={false} blending={THREE.AdditiveBlending} depthWrite={false}/></points>
    <EffectComposer multisampling={0}><Bloom intensity={.8} luminanceThreshold={1} mipmapBlur radius={.35} levels={5}/></EffectComposer>
  </>;
}
export default function InfinityTrialsCanvas(props: Props) {
  return <Boundary onFailure={props.onFailure}><Canvas camera={{position:[0,0,7],fov:38}} dpr={[1,1.5]} frameloop={props.paused?"demand":"always"} gl={{alpha:true,antialias:false,powerPreference:"low-power"}} onCreated={({gl})=>{gl.setClearColor(0,0);gl.domElement.addEventListener("webglcontextlost",props.onFailure,{once:true});}}><Relic {...props}/></Canvas></Boundary>;
}
