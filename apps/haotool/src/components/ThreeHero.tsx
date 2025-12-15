/**
 * ThreeHero Component - 3D Interactive Hero Section
 * [update:2025-12-16] - Fully aligned with .example/haotool.org-v1.0.6
 * [context7:@react-three/fiber:2025-12-16]
 * [context7:@react-three/drei:2025-12-16]
 *
 * Key differences from previous version:
 * - Full-screen absolute positioning (no left/right split)
 * - Background matches page background (#020617)
 * - No gradient mask overlay
 * - 3D object positioned to the right (position={[1.5, 0, 0]})
 */
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Float,
  Environment,
  MeshTransmissionMaterial,
  ContactShadows,
  PerformanceMonitor,
  Lightformer,
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface ThreeHeroProps {
  isCtaHovered: boolean;
}

interface PerformanceState {
  dpr: number;
  samples: number;
  resolution: number;
  enablePostProc: boolean;
  highQuality: boolean;
}

// -----------------------------------------------------------------------------
// Interactive Lighting Rig
// -----------------------------------------------------------------------------
const LightRig = ({ isActive }: { isActive: boolean }) => {
  const lightRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useFrame(() => {
    if (!lightRef.current) return;
    // Map mouse to viewport, but damped
    const targetX = (mouse.x * viewport.width) / 2.5;
    const targetY = (mouse.y * viewport.height) / 2.5;

    lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, targetX, 0.1);
    lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, targetY, 0.1);
    lightRef.current.lookAt(0, 0, 0);
  });

  return (
    <group ref={lightRef} position={[0, 0, 6]}>
      {/* Dynamic Key Light - Sharp and Intense */}
      <spotLight
        castShadow
        position={[0, 0, 0]}
        intensity={isActive ? 40 : 25}
        angle={0.35}
        penumbra={0.5}
        color={isActive ? '#a5b4fc' : '#ffffff'}
        distance={25}
        decay={2}
      />
    </group>
  );
};

// -----------------------------------------------------------------------------
// Prism Logic Core
// -----------------------------------------------------------------------------
const PrismLogic = ({ perf, isActive }: { perf: PerformanceState; isActive: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [isHovered, setIsHovered] = useState(false);

  // Smooth values
  const outerSpeed = useRef(0.1);
  const innerSpeed = useRef(0.2);
  const currentScale = useRef(1);

  // Scroll tracking
  const scrollYRef = useRef(0);

  // Connect to global scroll for parallax
  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    // Initialize
    scrollYRef.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state, delta) => {
    if (!outerRef.current || !innerRef.current || !groupRef.current) return;

    // 1. Handle Scroll Parallax (Lerped for smoothness)
    // We move the whole group down (Y) and away (Z) as user scrolls
    const targetY = -scrollYRef.current * 0.002;
    const targetZ = -scrollYRef.current * 0.001; // Subtle push away
    const targetRotationY = scrollYRef.current * 0.0005;

    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.05,
    );

    // 2. Determine target states for interaction
    const isActiveState = isActive || isHovered;

    // 3. Lerp rotation speeds
    const targetOuterSpeed = isActiveState ? 2.0 : 0.1;
    const targetInnerSpeed = isActiveState ? 3.0 : 0.2;

    outerSpeed.current = THREE.MathUtils.lerp(outerSpeed.current, targetOuterSpeed, 0.05);
    innerSpeed.current = THREE.MathUtils.lerp(innerSpeed.current, targetInnerSpeed, 0.05);

    const t = state.clock.getElapsedTime();

    // 4. Apply continuous rotation
    outerRef.current.rotation.x += outerSpeed.current * delta;
    outerRef.current.rotation.z = Math.cos(t * 0.15) * 0.1;

    innerRef.current.rotation.y -= innerSpeed.current * delta;
    innerRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;

    // 5. Lerp Scale (Scale up on hover)
    // Slightly scale up to 1.1 when hovered
    const targetScale = isHovered ? 1.1 : 1.0;
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, 0.1);

    // Apply scale to the floating group content
    outerRef.current.scale.setScalar(currentScale.current);
    innerRef.current.scale.setScalar(0.7 * currentScale.current);

    // 6. Lerp Emissive Intensity (Glow brighter on hover)
    if (coreMaterialRef.current) {
      // Normal: 0.2, Hover: 2.0, Active (CTA): 3.0
      const targetEmissiveIntensity = isActive ? 3.0 : isHovered ? 2.0 : 0.2;
      coreMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        coreMaterialRef.current.emissiveIntensity,
        targetEmissiveIntensity,
        0.1,
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={isActive || isHovered ? 3 : 2}
        rotationIntensity={0.2}
        floatIntensity={0.5}
        floatingRange={[-0.1, 0.1]}
      >
        {/* Outer Shell: Optical Glass */}
        <mesh
          ref={outerRef}
          castShadow
          receiveShadow
          onPointerOver={(e) => {
            e.stopPropagation();
            if (typeof document !== 'undefined') {
              document.body.style.cursor = 'pointer';
            }
            setIsHovered(true);
          }}
          onPointerOut={() => {
            if (typeof document !== 'undefined') {
              document.body.style.cursor = 'auto';
            }
            setIsHovered(false);
          }}
        >
          <dodecahedronGeometry args={[1.6, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={perf.samples}
            resolution={perf.resolution}
            transmission={1}
            roughness={0.1}
            thickness={1.5}
            ior={1.5}
            chromaticAberration={perf.highQuality ? 0.04 : 0.02}
            anisotropy={perf.highQuality ? 0.2 : 0}
            distortion={0.2}
            distortionScale={0.15}
            temporalDistortion={0.1}
            clearcoat={1}
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
            color={isActive || isHovered ? '#c7d2fe' : '#eef2ff'}
            background={new THREE.Color('#020617')}
          />
        </mesh>

        {/* Inner Core: Obsidian Logic */}
        <group ref={innerRef} scale={0.7}>
          <mesh castShadow receiveShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              ref={coreMaterialRef}
              color="#334155"
              metalness={1.0}
              roughness={0.15}
              emissive={isActive || isHovered ? '#4f46e5' : '#0f172a'}
              toneMapped={false}
            />
          </mesh>

          {/* Decorative Wireframe Elements */}
          <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]} scale={1.1} castShadow>
            <boxGeometry args={[1.2, 0.1, 1.2]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      </Float>
    </group>
  );
};

// -----------------------------------------------------------------------------
// Main Scene Component
// -----------------------------------------------------------------------------
const ThreeHero: React.FC<ThreeHeroProps> = ({ isCtaHovered = false }) => {
  const [perf, setPerf] = useState<PerformanceState>({
    dpr: 1.5,
    samples: 10,
    resolution: 1024,
    enablePostProc: true,
    highQuality: true,
  });

  const handleDecline = () => {
    setPerf({
      dpr: 1,
      samples: 6,
      resolution: 512,
      enablePostProc: false,
      highQuality: false,
    });
  };

  // SSR guard
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
      <Canvas
        dpr={perf.dpr}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ pointerEvents: 'none' }}
        shadows
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{ position: [0, 0, 7], fov: 35 }}
      >
        <PerformanceMonitor onDecline={handleDecline} />

        <color attach="background" args={['#020617']} />

        <Environment preset="city">
          <Lightformer
            intensity={5}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={[10, 10, 1]}
          />
          <Lightformer
            intensity={3}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={[10, 2, 1]}
          />
          <Lightformer
            intensity={3}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={[20, 2, 1]}
          />
        </Environment>

        {/* Lighting Setup */}
        <ambientLight intensity={0.2} color="#1e1b4b" />

        {/* Rim Light for Dramatic Edges */}
        <spotLight
          position={[5, 5, -5]}
          intensity={15}
          color="#818cf8"
          angle={0.6}
          penumbra={1}
          castShadow={false}
        />

        {/* Fill Light for Shadow Depth */}
        <pointLight position={[-5, -5, 5]} intensity={3} color="#9333ea" />

        <LightRig isActive={isCtaHovered} />

        <group position={[1.5, 0, 0]}>
          <PrismLogic perf={perf} isActive={isCtaHovered} />
        </group>

        <ContactShadows
          position={[0, -2.5, 0]}
          opacity={0.5}
          scale={15}
          blur={3}
          far={4.5}
          color="#000000"
        />

        {perf.enablePostProc && (
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.6} radius={0.4} />
            <Noise opacity={0.025} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};

export default ThreeHero;
