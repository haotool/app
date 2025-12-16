/**
 * SectionBackground Component - Floating 3D bubbles for section backgrounds
 * [update:2025-12-16] - Added from .example/haotool.org-v1.0.6
 * [context7:@react-three/fiber:2025-12-16]
 * [context7:@react-three/drei:2025-12-16]
 *
 * Performance-optimized 3D background with instanced rendering
 */
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface FloatingBubblesProps {
  count?: number;
}

const FloatingBubbles = ({ count = 25 }: FloatingBubblesProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Reusable dummy object for matrix calculations to avoid GC
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    // Math.random() is intentionally used here for initial particle positions (runs once on mount)
    /* eslint-disable react-hooks/purity */
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      scale: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.2 + 0.1,
      phase: Math.random() * Math.PI * 2, // Random starting phase
      rotationSpeed: (Math.random() - 0.5) * 0.5,
    }));
    /* eslint-enable react-hooks/purity */
  }, [count]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const t = state.clock.getElapsedTime();

    // 1. Efficiently update matrices in a single loop
    particles.forEach((particle, i) => {
      const { position, scale, speed, phase, rotationSpeed } = particle;

      // Float animation: Sine wave oscillation on Y
      const y = position[1] + Math.sin(t * speed + phase) * 0.6;

      // Update dummy object properties
      dummy.position.set(position[0], y, position[2]);
      dummy.scale.setScalar(scale);
      // Gentle complex rotation
      dummy.rotation.set(t * rotationSpeed + phase, t * rotationSpeed * 0.5 + phase, 0);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    // Mark instance matrix as needing update for the GPU
    mesh.instanceMatrix.needsUpdate = true;

    // 2. Performant Color Shift on the single material shared by all instances
    // Oscillate Hue between 0.6 (Indigo) and 0.68 (Purple)
    const hue = 0.6 + Math.sin(t * 0.15) * 0.08;
    material.color.setHSL(hue, 0.7, 0.6);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {/* Lowest poly count spherical primitive (12 vertices) */}
      <icosahedronGeometry args={[1, 0]} />
      {/* MeshBasicMaterial is unlit and fastest to render */}
      {/* eslint-disable react/no-unknown-property */}
      <meshBasicMaterial
        ref={materialRef}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false} // Crucial for transparency performance and look
        color="#a5b4fc"
      />
      {/* eslint-enable react/no-unknown-property */}
    </instancedMesh>
  );
};

const SectionBackground: React.FC = () => {
  // SSR guard
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <motion.div
      className="absolute inset-0 z-0 pointer-events-none mix-blend-screen overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{
        opacity: [0.3, 0.5, 0.3],
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      viewport={{ once: true }}
    >
      <Canvas
        style={{ pointerEvents: 'none' }}
        camera={{ position: [0, 0, 10], fov: 40 }}
        dpr={[1, 1.5]} // Cap DPR at 1.5 for mobile performance
        gl={{
          alpha: true,
          antialias: false, // Disable antialias for background elements
          powerPreference: 'low-power', // Hint to browser to save battery
          depth: false, // Disable depth buffer if possible (though needed for sorting, depthWrite=false handles most)
        }}
      >
        {/* No lights needed for MeshBasicMaterial -> Significant Perf Gain */}
        <FloatingBubbles />
      </Canvas>
    </motion.div>
  );
};

export default SectionBackground;
