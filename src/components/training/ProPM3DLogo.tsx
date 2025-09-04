import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Environment, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface SegmentProps {
  angle: number;
  radius: number;
  color: string;
  index: number;
}

const LogoSegment: React.FC<SegmentProps> = ({ angle, radius, color, index }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.z = Math.sin(time * 0.5 + index * 0.2) * 0.1;
      meshRef.current.position.y = Math.sin(time * 0.3 + index * 0.4) * 0.05;
    }
  });

  const segmentGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const innerRadius = radius * 0.6;
    const outerRadius = radius;
    const startAngle = angle - Math.PI / 8;
    const endAngle = angle + Math.PI / 8;
    
    // Create segment shape
    shape.moveTo(Math.cos(startAngle) * innerRadius, Math.sin(startAngle) * innerRadius);
    shape.lineTo(Math.cos(startAngle) * outerRadius, Math.sin(startAngle) * outerRadius);
    shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
    shape.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 8
    });
  }, [angle, radius]);

  return (
    <mesh ref={meshRef} geometry={segmentGeometry} position={[0, 0, 0]}>
      <meshStandardMaterial 
        color={color}
        metalness={0.7}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

const CenterSphere: React.FC = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sphereRef.current) {
      const time = state.clock.getElapsedTime();
      sphereRef.current.rotation.x = time * 0.2;
      sphereRef.current.rotation.y = time * 0.3;
      sphereRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
    }
  });

  return (
    <Sphere ref={sphereRef} args={[0.4, 32, 32]} position={[0, 0, 0.2]}>
      <meshStandardMaterial 
        color="hsl(var(--primary))"
        metalness={0.9}
        roughness={0.1}
        emissive="hsl(var(--primary))"
        emissiveIntensity={0.2}
      />
    </Sphere>
  );
};

const Logo3D: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.z = time * 0.1;
      groupRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
    }
  });

  const segments = useMemo(() => {
    const colors = [
      "hsl(221, 83%, 53%)", // Primary blue
      "hsl(271, 81%, 56%)", // Purple
      "hsl(142, 76%, 36%)", // Green
      "hsl(25, 95%, 53%)",  // Orange
      "hsl(340, 82%, 52%)", // Pink
      "hsl(200, 98%, 39%)", // Cyan
      "hsl(47, 96%, 53%)",  // Yellow
      "hsl(0, 84%, 60%)"    // Red
    ];
    
    return Array.from({ length: 8 }, (_, i) => ({
      angle: (i * Math.PI * 2) / 8,
      color: colors[i],
      index: i
    }));
  }, []);

  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        {segments.map((segment, index) => (
          <LogoSegment 
            key={index}
            angle={segment.angle}
            radius={2}
            color={segment.color}
            index={segment.index}
          />
        ))}
        <CenterSphere />
        
        {/* PM Text */}
        <Text
          position={[0, 0, 0.5]}
          fontSize={0.8}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          PM
        </Text>
        
        {/* PRO Text */}
        <Text
          position={[0, -3.5, 0]}
          fontSize={0.4}
          color="hsl(var(--primary))"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          PRO PM
        </Text>
        
        {/* PROPM.FR Text */}
        <Text
          position={[0, -4.2, 0]}
          fontSize={0.3}
          color="hsl(var(--muted-foreground))"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-regular.woff"
        >
          PROPM.FR
        </Text>
      </group>
    </Float>
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
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Environment preset="studio" />
        
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Logo3D />
        
        {autoRotate && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  );
};