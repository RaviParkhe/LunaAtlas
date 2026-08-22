import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Sun, Play, Square, Mountain, Crosshair, Plus, Minus, MapPin } from 'lucide-react';

export default function MoonViewer3D({
  namedSites = [],
  selectedSite,
  onSelectSite
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const moonMeshRef = useRef(null);
  const glowMeshRef = useRef(null);
  const markersGroupRef = useRef(null);
  const reqIdRef = useRef(null);
  const dirLightRef = useRef(null);
  const ambientLightRef = useRef(null);

  const [isRotating, setIsRotating] = useState(false);
  const isRotatingRef = useRef(false);
  isRotatingRef.current = isRotating;

  const [isSolarGrazingActive, setIsSolarGrazingActive] = useState(true);
  const [isSunAnimating, setIsSunAnimating] = useState(false);
  const [sunAngle, setSunAngle] = useState(60);
  const [bumpIntensity, setBumpIntensity] = useState(0.12);
  const [currentAltitudeKm, setCurrentAltitudeKm] = useState(1737);

  const targetCamPos = useRef(new THREE.Vector3(0, -6.2, 3.4));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const latLonToVector3 = (latDeg, lonDeg, radius) => {
    const phi = (90 - latDeg) * (Math.PI / 180);
    const theta = (lonDeg + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Sleek, compact Apple-style 3D Billboard Badge for Active Site
  const createCompactBadge = (siteName, rank, lat, lon) => {
    const canvas = document.createElement('canvas');
    canvas.width = 380;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');

    // Apple Frosted Glass Capsule
    ctx.fillStyle = 'rgba(29, 29, 31, 0.92)';
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 4;

    const r = 24;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(380 - r, 0);
    ctx.quadraticCurveTo(380, 0, 380, r);
    ctx.lineTo(380, 110 - r);
    ctx.quadraticCurveTo(380, 110, 380 - r, 110);
    ctx.lineTo(r, 110);
    ctx.quadraticCurveTo(0, 110, 0, 110 - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Site Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 32px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    const rankPrefix = rank ? `#${rank} ` : '';
    ctx.fillText(`${rankPrefix}${siteName}`, 24, 46);

    // Coordinates
    const latStr = `${Math.abs(lat).toFixed(1)}°S`;
    const lonStr = `${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`;
    ctx.fillStyle = '#2997ff';
    ctx.font = '500 24px -apple-system, sans-serif';
    ctx.fillText(`${latStr}, ${lonStr}`, 24, 86);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.32, 0.09, 1.0);
    return sprite;
  };

  // Mini Number Pin Dot (#1, #2, #3...)
  const createMiniRankDot = (rank, isRank1) => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Luminous Circular Tag
    ctx.fillStyle = isRank1 ? '#0066cc' : 'rgba(29, 29, 31, 0.9)';
    ctx.strokeStyle = isRank1 ? '#ffffff' : '#0066cc';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.arc(48, 48, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${rank || 1}`, 48, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.07, 0.07, 1.0);
    return sprite;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 1000);
    camera.position.set(0, -6.2, 3.4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2a394a, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xfffcf2, 2.8);
    const initialSunRad = (60 * Math.PI) / 180;
    dirLight.position.set(Math.cos(initialSunRad) * 14, -2.5, Math.sin(initialSunRad) * 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const earthshine = new THREE.DirectionalLight(0x2997ff, 0.35);
    earthshine.position.set(-10, 4, -10);
    scene.add(earthshine);

    // Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2500;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 400;
      starCoords[i + 1] = (Math.random() - 0.5) * 400;
      starCoords[i + 2] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.75, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // NASA LROC 4K Seamless Moon Globe
    const MOON_RADIUS = 2.5;
    const sphereGeo = new THREE.SphereGeometry(MOON_RADIUS, 128, 128);

    const textureLoader = new THREE.TextureLoader();
    const colorTexture4K = textureLoader.load('/textures/moon_nasa_lroc_4k.jpg');
    const bumpTexture4K = textureLoader.load('/textures/moon_nasa_bump_4k.jpg');

    colorTexture4K.colorSpace = THREE.SRGBColorSpace;
    colorTexture4K.anisotropy = renderer.capabilities.getMaxAnisotropy();
    bumpTexture4K.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const moonMat = new THREE.MeshStandardMaterial({
      map: colorTexture4K,
      bumpMap: bumpTexture4K,
      bumpScale: bumpIntensity,
      roughness: 0.88,
      metalness: 0.02
    });

    const moonMesh = new THREE.Mesh(sphereGeo, moonMat);
    scene.add(moonMesh);
    moonMeshRef.current = moonMesh;

    // Atmospheric Glow Shell
    const glowGeo = new THREE.SphereGeometry(MOON_RADIUS * 1.012, 64, 64);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(0.0, 0.4, 0.8, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowMesh);
    glowMeshRef.current = glowMesh;

    // Tactical Markers Group
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Mouse Drag & Click Raycaster Setup
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();
    let isDragging = false;
    let mouseDownPos = { x: 0, y: 0 };
    let prevMousePos = { x: 0, y: 0 };
    const domEl = renderer.domElement;

    const onMouseDown = (e) => {
      isDragging = true;
      mouseDownPos = { x: e.clientX, y: e.clientY };
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = domEl.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Hover Pointer Cursor Effect
      if (cameraRef.current && markersGroupRef.current) {
        raycaster.setFromCamera(mouseVec, cameraRef.current);
        const intersects = raycaster.intersectObjects(markersGroupRef.current.children, true);
        if (intersects.length > 0 && intersects.some(hit => hit.object.userData && hit.object.userData.site)) {
          domEl.style.cursor = 'pointer';
        } else {
          domEl.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      if (moonMeshRef.current) {
        moonMeshRef.current.rotation.y += deltaX * 0.005;
        moonMeshRef.current.rotation.x -= deltaY * 0.005;

        if (markersGroupRef.current) {
          markersGroupRef.current.rotation.y = moonMeshRef.current.rotation.y;
          markersGroupRef.current.rotation.x = moonMeshRef.current.rotation.x;
        }
      }

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e) => {
      isDragging = false;
      const distMoved = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);

      // If mouse didn't drag extensively (pure click / slight click jitter < 8px), perform hit selection
      if (distMoved < 8) {
        const rect = domEl.getBoundingClientRect();
        mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        if (cameraRef.current && markersGroupRef.current) {
          raycaster.setFromCamera(mouseVec, cameraRef.current);
          const intersects = raycaster.intersectObjects(markersGroupRef.current.children, true);
          if (intersects.length > 0) {
            const hit = intersects.find(item => item.object.userData && item.object.userData.site);
            if (hit && hit.object.userData.site) {
              onSelectSite && onSelectSite(hit.object.userData.site);
            }
          }
        }
      }
    };

    // Deep Surface Zooming
    const onWheel = (e) => {
      e.preventDefault();
      const currentDist = camera.position.length();
      const speed = Math.max(0.0006, (currentDist - 2.5) * 0.0012);
      const newDist = THREE.MathUtils.clamp(currentDist + e.deltaY * speed, 2.55, 14.0);
      
      const dir = camera.position.clone().normalize();
      camera.position.copy(dir.multiplyScalar(newDist));
      targetCamPos.current.copy(camera.position);

      const altKm = Math.round(((newDist - 2.5) / 2.5) * 1737.4);
      setCurrentAltitudeKm(Math.max(25, altKm));
    };

    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      if (isRotatingRef.current && moonMeshRef.current) {
        moonMeshRef.current.rotation.y += 0.003;
        if (markersGroupRef.current) markersGroupRef.current.rotation.y = moonMeshRef.current.rotation.y;
      }

      camera.position.lerp(targetCamPos.current, 0.05);
      camera.lookAt(targetLookAt.current);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Solar Grazing Animation cycle
  useEffect(() => {
    let animTimer;
    if (isSunAnimating && isSolarGrazingActive) {
      animTimer = setInterval(() => {
        setSunAngle((prev) => {
          const next = (prev + 0.8) % 360;
          if (dirLightRef.current) {
            const rad = (next * Math.PI) / 180;
            dirLightRef.current.position.set(Math.cos(rad) * 14, -2.5, Math.sin(rad) * 14);
          }
          return next;
        });
      }, 50);
    }
    return () => clearInterval(animTimer);
  }, [isSunAnimating, isSolarGrazingActive]);

  // Clean, 100% Selectable Tactical Markers with Invisible Generous Hitbox Spheres
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;
    group.clear();

    const MOON_RADIUS = 2.5;

    namedSites && namedSites.forEach((site) => {
      const pos = latLonToVector3(site.lat, site.lon, MOON_RADIUS);
      const isSelected = selectedSite && selectedSite.name === site.name;
      const isRank1 = site.rank === 1;

      // Base Pinpoint Ring
      const ringGeo = new THREE.RingGeometry(0.015, 0.04, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x2997ff : isRank1 ? 0x0066cc : 0xd2d2d7,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      ringMesh.userData = { site };
      group.add(ringMesh);

      // Slender Beacon Pin Line
      const beaconHeight = isSelected ? 0.28 : 0.18;
      const normal = pos.clone().normalize();
      const topPos = pos.clone().add(normal.clone().multiplyScalar(beaconHeight));

      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, topPos]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0x0066cc : 0x86868b,
        linewidth: isSelected ? 2 : 1
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { site };
      group.add(line);

      // Generous Invisible Hit-Test Sphere (guarantees 100% click hit precision)
      const hitGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(topPos);
      hitMesh.userData = { site };
      group.add(hitMesh);

      if (isSelected) {
        // Selected site displays the prominent Apple HUD Badge
        const textSprite = createCompactBadge(site.name, site.rank, site.lat, site.lon);
        const spritePos = topPos.clone().add(normal.clone().multiplyScalar(0.07));
        textSprite.position.copy(spritePos);
        textSprite.userData = { site };
        group.add(textSprite);
      } else {
        // Non-active sites display a mini rank dot (#2, #3, etc.)
        const miniDot = createMiniRankDot(site.rank, isRank1);
        miniDot.position.copy(topPos);
        miniDot.userData = { site };
        group.add(miniDot);
      }
    });
  }, [namedSites, selectedSite]);

  // Smooth FlyTo camera animation upon selecting candidate site
  useEffect(() => {
    if (!selectedSite || !cameraRef.current) return;
    const MOON_RADIUS = 2.5;
    const sitePos = latLonToVector3(selectedSite.lat, selectedSite.lon, MOON_RADIUS);

    const normal = sitePos.clone().normalize();
    const camOffset = normal.clone().multiplyScalar(2.72);
    targetCamPos.current.copy(camOffset);
    targetLookAt.current.copy(sitePos.clone().multiplyScalar(0.8));
    setCurrentAltitudeKm(150);
  }, [selectedSite]);

  const handleToggleSolarGrazing = (enabled) => {
    setIsSolarGrazingActive(enabled);
    setIsSunAnimating(false);
    if (dirLightRef.current && ambientLightRef.current) {
      if (enabled) {
        const rad = (sunAngle * Math.PI) / 180;
        dirLightRef.current.position.set(Math.cos(rad) * 14, -2.5, Math.sin(rad) * 14);
        dirLightRef.current.intensity = 2.8;
        ambientLightRef.current.intensity = 0.85;
      } else {
        dirLightRef.current.position.set(0, -10, 10);
        dirLightRef.current.intensity = 2.4;
        ambientLightRef.current.intensity = 1.4;
      }
    }
  };

  const handleSunAngle = (deg) => {
    setSunAngle(deg);
    if (dirLightRef.current && isSolarGrazingActive) {
      const rad = (deg * Math.PI) / 180;
      dirLightRef.current.position.set(Math.cos(rad) * 14, -2.5, Math.sin(rad) * 14);
    }
  };

  const handleBumpChange = (scale) => {
    setBumpIntensity(scale);
    if (moonMeshRef.current && moonMeshRef.current.material) {
      moonMeshRef.current.material.bumpScale = scale;
      moonMeshRef.current.material.needsUpdate = true;
    }
  };

  const handleZoom = (direction) => {
    if (!cameraRef.current) return;
    const currentDist = cameraRef.current.position.length();
    const factor = direction === 'in' ? 0.78 : 1.28;
    const newDist = THREE.MathUtils.clamp(currentDist * factor, 2.55, 14.0);
    const dir = cameraRef.current.position.clone().normalize();
    targetCamPos.current.copy(dir.multiplyScalar(newDist));
    const altKm = Math.round(((newDist - 2.5) / 2.5) * 1737.4);
    setCurrentAltitudeKm(Math.max(25, altKm));
  };

  return (
    <div className="relative w-full h-full bg-[#000000] overflow-hidden select-none font-sans">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Floating Control Bar (Apple Frosted Glass) */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)]/85 border border-[var(--border-color)] backdrop-blur-md flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse"></span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              NASA LROC 4K SEAMLESS MOON (ALT: ~{currentAltitudeKm} km)
            </span>
          </div>

          {selectedSite && (
            <div className="px-3.5 py-1.5 rounded-full bg-[var(--apple-parchment)]/95 border border-[var(--border-color)] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
              <Crosshair className="w-3.5 h-3.5 text-[#0066cc]" />
              <span className="text-xs font-medium text-[#0066cc]">
                TARGET: {selectedSite.name.toUpperCase()} ({Math.abs(selectedSite.lat).toFixed(1)}°S, {selectedSite.lon.toFixed(1)}°E)
              </span>
            </div>
          )}
        </div>

        {/* Rotate Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 ${
              isRotating
                ? 'bg-[#0066cc] border-[#0066cc] text-white'
                : 'bg-[var(--bg-card)]/85 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] backdrop-blur-md'
            }`}
            title="Toggle smooth lunar polar axis rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            <span>{isRotating ? 'Rotating' : 'Rotate'}</span>
          </button>
        </div>
      </div>

      {/* Floating Candidate Site Quick-Selector Bar */}
      <div className="absolute top-16 left-4 right-4 flex items-center gap-1.5 overflow-x-auto py-1 pointer-events-auto z-10 no-scrollbar">
        {namedSites && namedSites.map((site) => {
          const isSelected = selectedSite && selectedSite.name === site.name;
          return (
            <button
              key={site.name}
              onClick={() => onSelectSite && onSelectSite(site)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm backdrop-blur-md ${
                isSelected
                  ? 'bg-[#0066cc] border-[#0066cc] text-white shadow-md'
                  : 'bg-[var(--bg-card)]/85 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-active)]'
              }`}
            >
              <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-[#0066cc]'}`} />
              <span>#{site.rank ?? 1} {site.name}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute right-4 top-28 flex flex-col gap-1.5 pointer-events-auto z-10">
        <button
          onClick={() => handleZoom('in')}
          className="w-8 h-8 rounded-full bg-[var(--bg-card)]/85 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="w-8 h-8 rounded-full bg-[var(--bg-card)]/85 hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 backdrop-blur-md"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3 p-2 px-4 rounded-full bg-[var(--bg-card)]/90 border border-[var(--border-color)] backdrop-blur-md pointer-events-auto shadow-md">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="solarGrazing"
              checked={isSolarGrazingActive}
              onChange={(e) => handleToggleSolarGrazing(e.target.checked)}
              className="accent-[#0066cc] cursor-pointer"
            />
            <label htmlFor="solarGrazing" className="flex items-center gap-1 text-xs font-medium text-amber-500 cursor-pointer">
              <Sun className="w-3.5 h-3.5" />
              <span>Solar Grazing</span>
            </label>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            value={sunAngle}
            disabled={!isSolarGrazingActive}
            onChange={(e) => handleSunAngle(Number(e.target.value))}
            className="w-28 cursor-pointer disabled:opacity-40"
          />
          <span className="text-xs font-mono text-[var(--text-secondary)] w-8 text-right">
            {sunAngle}°
          </span>

          <button
            onClick={() => setIsSunAnimating(!isSunAnimating)}
            disabled={!isSolarGrazingActive}
            className="p-1 rounded-full hover:bg-[var(--apple-parchment)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-40 active:scale-95"
            title={isSunAnimating ? 'Pause Solar Rotation' : 'Simulate Solar Angle Cycle'}
          >
            {isSunAnimating ? <Square className="w-3 h-3 text-amber-500" /> : <Play className="w-3 h-3" />}
          </button>

          <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[#0066cc]">
            <Mountain className="w-3.5 h-3.5" />
            <span>Crater Relief</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.25"
            step="0.01"
            value={bumpIntensity}
            onChange={(e) => handleBumpChange(Number(e.target.value))}
            className="w-20 cursor-pointer"
          />
          <span className="text-xs font-mono text-[var(--text-secondary)] w-7 text-right">
            {Math.round(bumpIntensity * 100)}%
          </span>
        </div>

        <div className="p-2 px-3.5 rounded-full bg-[var(--bg-card)]/90 border border-[var(--border-color)] backdrop-blur-md pointer-events-auto shadow-sm text-xs text-[var(--text-muted)] flex items-center gap-3">
          <span>• Click any Pin or Top Pill to FlyTo</span>
          <span>• Drag to Tilt</span>
          <span>• Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
}
