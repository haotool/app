/**
 * React Three Fiber JSX Type Augmentation
 *
 * Workaround for @react-three/fiber v9 + React 19 TypeScript compatibility issue
 * This file extends JSX.IntrinsicElements to include Three.js primitives
 *
 * @see https://github.com/pmndrs/react-three-fiber/issues/3285
 * TODO: Remove this file when @react-three/fiber resolves the type issue
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // Groups
      group: any;

      // Meshes
      mesh: any;
      instancedMesh: any;

      // Geometries
      boxGeometry: any;
      sphereGeometry: any;
      icosahedronGeometry: any;
      octahedronGeometry: any;
      dodecahedronGeometry: any;
      cylinderGeometry: any;
      planeGeometry: any;
      torusGeometry: any;
      coneGeometry: any;
      ringGeometry: any;

      // Materials
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshLambertMaterial: any;
      meshPhysicalMaterial: any;
      lineBasicMaterial: any;
      lineDashedMaterial: any;
      pointsMaterial: any;
      shaderMaterial: any;

      // Lights
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      directionalLight: any;
      hemisphereLight: any;
      rectAreaLight: any;

      // Cameras
      perspectiveCamera: any;
      orthographicCamera: any;

      // Helpers
      color: any;
      fog: any;
      fogExp2: any;

      // Lines
      line: any;
      lineLoop: any;
      lineSegments: any;

      // Misc
      primitive: any;
      points: any;
      sprite: any;
    }
  }
}
