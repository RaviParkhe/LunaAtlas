import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Rotate3d, Compass, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function MoonViewer3D({
  namedSites,
  selectedSite,
  onSelectSite,
  activeLayer
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const moonMeshRef = useRef(null);
  const markersGroupRef = useRef(null);
  const targetLookAt = useRef(new THREE.Vector3(0, -1.8, 0));
  const targetCamPos = useRef(new THREE.Vector3(0, -3.2, 2.2));

  const [isRotating, setIsRotating] = useState(true);

  // Convert Lunar Lat/Lon to 3D Sphere Coordinates (R = 2.0)
  const latLonToVector3 = (latDeg, lonDeg, radius = 2.0) => {
    const phi = (90 - latDeg) * (Math.PI / 180);
    const theta = (lonDeg + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, -3.2, 2.2); // Positioned looking directly at Lunar South Pole
    camera.lookAt(0, -1.8, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Lighting (Sunlight + Ambient space light)
    const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // 4. Procedural Lunar Surface Texture Generation
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 1024;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d');
    
    // Base lunar basalt gray
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 1024, 512);

    // Generate craters
    for (let i = 0; i < 300; i++) {
      const cx = Math.random() * 1024;
      const cy = Math.random() * 512;
      const cr = Math.random() * 18 + 2;
      
      const grad = ctx.createRadialGradient(cx, cy, cr * 0.2, cx, cy, cr);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.7, '#334155');
      grad.addColorStop(1, '#64748b');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, 2 * Math.PI);
      ctx.fill();
    }

    // South Pole Highlight Overlay (bottom band of texture)
    const southPoleGrad = ctx.createLinearGradient(0, 420, 0, 512);
    southPoleGrad.addColorStop(0, 'rgba(6, 182, 212, 0.0)');
    southPoleGrad.addColorStop(1, 'rgba(6, 182, 212, 0.45)');
    ctx.fillStyle = southPoleGrad;
    ctx.fillRect(0, 420, 1024, 92);

    const moonTexture = new THREE.CanvasTexture(textureCanvas);
    const moonGeo = new THREE.SphereGeometry(2.0, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.85,
      metalness: 0.1
    });

    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);
    moonMeshRef.current = moonMesh;

    // 5. Markers Group for Candidate Sites
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // 6. Stars background particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 400;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 50;
      starPos[i + 1] = (Math.random() - 0.5) * 50;
      starPos[i + 2] = (Math.random() - 0.5) * 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.15 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 7. Mouse drag rotation interaction
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      if (moonMeshRef.current) {
        moonMeshRef.current.rotation.y += deltaX * 0.005;
        moonMeshRef.current.rotation.x += deltaY * 0.005;
        if (markersGroupRef.current) {
          markersGroupRef.current.rotation.y += deltaX * 0.005;
          markersGroupRef.current.rotation.x += deltaY * 0.005;
        }
      }

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => { isDragging = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 8. Animation Loop with smooth camera interpolation
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation towards target
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        cameraRef.current.lookAt(targetLookAt.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.innerHTML = '';
      }
    };
  }, []);

  // Update Markers when Named Sites change
  useEffect(() => {
    const group = markersGroupRef.current;
    if (!group) return;

    // Clear old markers
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (namedSites && namedSites.length > 0) {
      namedSites.forEach((site) => {
        const pos = latLonToVector3(site.lat || -89.0, site.lon || 0.0, 2.02);
        const isSelected = selectedSite && selectedSite.name === site.name;
        const isRank1 = site.rank === 1;

        // Pin Geometry
        const pinGeo = new THREE.SphereGeometry(isSelected ? 0.06 : 0.04, 16, 16);
        const pinColor = isRank1 ? 0x3b82f6 : isSelected ? 0x10b981 : 0xf59e0b;
        const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(pos);
        group.add(pinMesh);

        // Halo Ring for Selected or Rank 1
        if (isSelected || isRank1) {
          const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: pinColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.position.copy(pos);
          ringMesh.lookAt(pos.clone().multiplyScalar(2));
          group.add(ringMesh);
        }
      });
    }
  }, [namedSites, selectedSite]);

  // Cinematic Camera Navigation (flyTo) when selected site changes
  useEffect(() => {
    if (selectedSite && cameraRef.current) {
      const sitePos = latLonToVector3(selectedSite.lat || -89.0, selectedSite.lon || 0.0, 2.0);
      targetLookAt.current.copy(sitePos);
      
      // Position camera slightly offset from the site normal for a cinematic 3D perspective
      const camOffset = sitePos.clone().normalize().multiplyScalar(3.0);
      targetCamPos.current.copy(camOffset);
    }
  }, [selectedSite]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#050811] rounded-lg overflow-hidden border border-[#1a2744] select-none">
      {/* 3D WebGL Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Mode HUD Badge */}
      <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-[#0d1527]/90 border border-blue-500/50 text-[10px] text-blue-300 font-mono flex items-center space-x-1.5 shadow-md">
        <Rotate3d className="w-3.5 h-3.5 text-blue-400" />
        <span>3D LUNAR GLOBE (R=1,737.4 km)</span>
      </div>

      {/* Camera Reset Controls */}
      <div className="absolute right-3 bottom-3 flex flex-col space-y-1.5 z-10">
        <button
          onClick={() => {
            targetCamPos.current.set(0, -3.2, 2.2);
            targetLookAt.current.set(0, -1.8, 0);
          }}
          className="px-2.5 py-1 bg-[#0d1527]/90 hover:bg-[#1a2744] text-slate-300 rounded border border-[#1a2744] text-[10px] font-mono flex items-center space-x-1 shadow-md transition"
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Reset South Pole</span>
        </button>
      </div>
    </div>
  );
}
