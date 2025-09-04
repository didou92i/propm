import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Composant segment simplifié avec géométrie de base
const SimpleSegment: React.FC<{ position: [number, number, number], color: string, index: number }> = ({ 
  position, 
  color, 
  index 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.z = time * 0.5 + index * 0.2;
      meshRef.current.rotation.x = Math.sin(time + index) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 1.5, 0.3]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.6}
        roughness={0.4}
      />
    </mesh>
  );
};

// Sphère centrale simplifiée
const SimpleSphere: React.FC = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sphereRef.current) {
      const time = state.clock.getElapsedTime();
      sphereRef.current.rotation.y = time * 0.5;
      sphereRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
  });

  return (
    <mesh ref={sphereRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 16, 16]} />
      <meshStandardMaterial 
        color="#3b82f6"
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
};

// Logo 3D ultra-simplifié
const SimpleLogo3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  // Positions et couleurs pour les segments
  const segments = [
    { position: [1.5, 0, 0] as [number, number, number], color: "#ef4444" },
    { position: [1.1, 1.1, 0] as [number, number, number], color: "#f97316" },
    { position: [0, 1.5, 0] as [number, number, number], color: "#eab308" },
    { position: [-1.1, 1.1, 0] as [number, number, number], color: "#22c55e" },
    { position: [-1.5, 0, 0] as [number, number, number], color: "#06b6d4" },
    { position: [-1.1, -1.1, 0] as [number, number, number], color: "#3b82f6" },
    { position: [0, -1.5, 0] as [number, number, number], color: "#8b5cf6" },
    { position: [1.1, -1.1, 0] as [number, number, number], color: "#ec4899" },
  ];

  return (
    <group ref={groupRef}>
      {segments.map((segment, index) => (
        <SimpleSegment 
          key={index}
          position={segment.position}
          color={segment.color}
          index={index}
        />
      ))}
      <SimpleSphere />
      
      {/* Texte PM simplifié */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[1.2, 0.6, 0.2]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

interface ProPM3DLogoProps {
  size?: number;
  autoRotate?: boolean;
}

export const ProPM3DLogo: React.FC<ProPM3DLogoProps> = ({ 
  size = 400, 
  autoRotate = true 
}) => {
  return (
    <div style={{ width: size, height: size }} className="mx-auto">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true }}
      >
        {/* Éclairage simple */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <SimpleLogo3D />
      </Canvas>
    </div>
  );
};