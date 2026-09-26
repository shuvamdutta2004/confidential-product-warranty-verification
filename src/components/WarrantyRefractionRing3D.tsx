"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function WarrantyRefractionRing3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Geometry: Organic Ribbon Torus Knot
    const geometry = new THREE.TorusKnotGeometry(2.35, 0.72, 220, 42, 2, 3);

    // Material: Luxury Obsidian Glass with Iridescent Amber & Blue Refraction
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#070810"),
      metalness: 0.92,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      transmission: 0.18,
      ior: 1.55,
      specularIntensity: 1.5,
      specularColor: new THREE.Color("#fef3c7"),
    });

    const torusMesh = new THREE.Mesh(geometry, material);
    torusMesh.rotation.x = 0.55;
    torusMesh.rotation.y = 0.35;
    scene.add(torusMesh);

    // Lighting setup matching the luxury reference screenshot
    const ambientLight = new THREE.AmbientLight(0x0e111a, 2.5);
    scene.add(ambientLight);

    // Warm Amber / Golden rim light (bottom-left)
    const amberLight = new THREE.PointLight(0xf59e0b, 7.5, 25);
    amberLight.position.set(4.5, -3.5, 4.0);
    scene.add(amberLight);

    // Vivid Electric Blue refraction light (top-right & inside loop)
    const blueLight = new THREE.PointLight(0x38bdf8, 8.0, 25);
    blueLight.position.set(-3.8, 4.2, 3.5);
    scene.add(blueLight);

    // Royal Deep Blue accent light (back rim)
    const deepBlueLight = new THREE.PointLight(0x1d4ed8, 6.0, 25);
    deepBlueLight.position.set(-1.0, -4.0, -3.0);
    scene.add(deepBlueLight);

    // Crisp white specular glint light
    const frontWhiteLight = new THREE.PointLight(0xffffff, 3.0, 20);
    frontWhiteLight.position.set(1.5, 2.0, 6.0);
    scene.add(frontWhiteLight);

    // Floating Micro-Embers / Spark Particles
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const amberColor = new THREE.Color("#fbbf24");
    const blueColor = new THREE.Color("#60a5fa");

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 3.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const isAmber = Math.random() > 0.45;
      const chosenColor = isAmber ? amberColor : blueColor;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse Interaction
    let targetRotX = 0.55;
    let targetRotY = 0.35;
    let currentRotX = targetRotX;
    let currentRotY = targetRotY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = 0.35 + x * 0.45;
      targetRotX = 0.55 - y * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 600;
      const newHeight = container.clientHeight || 600;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous gentle rotation + mouse lerp
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      torusMesh.rotation.x = currentRotX + Math.sin(elapsed * 0.4) * 0.05;
      torusMesh.rotation.y = currentRotY + elapsed * 0.22;
      torusMesh.rotation.z = Math.cos(elapsed * 0.3) * 0.04;

      // Particle floating rotation
      particles.rotation.y = -elapsed * 0.06;
      particles.rotation.x = elapsed * 0.03;

      // Subtle dynamic breathing of amber & blue lights
      amberLight.intensity = 7.0 + Math.sin(elapsed * 1.5) * 1.5;
      blueLight.intensity = 7.5 + Math.cos(elapsed * 1.8) * 1.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "540px",
        position: "relative",
        cursor: "grab",
        userSelect: "none",
      }}
    />
  );
}
