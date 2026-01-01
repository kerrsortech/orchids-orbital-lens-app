'use client';

import { useRef, useEffect, useState, useMemo, memo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getPlanetaryPositions, getMoonPosition, getEarthDayNight } from '@/lib/astronomy-utils';

// ================================
// ASTRONOMICAL CONSTANTS (NASA/JPL)
// ================================

// Orbital periods in Earth days (NASA data)
const ORBITAL_PERIODS = {
  Mercury: 87.969,
  Venus: 224.701,
  Earth: 365.256,
  Mars: 686.980,
  Jupiter: 4332.589,
  Saturn: 10759.22,
  Uranus: 30688.5,
  Neptune: 60182,
};

// Sidereal rotation periods in Earth days (NASA data)
// Negative = retrograde rotation
const ROTATION_PERIODS_DAYS = {
  Mercury: 58.6462,
  Venus: -243.025,      // Retrograde
  Earth: 0.99726968,    // 23h 56m 4.1s
  Mars: 1.02595675,     // 24h 37m 22.7s
  Jupiter: 0.41354,     // 9h 55m 30s
  Saturn: 0.44401,      // 10h 39m 22s
  Uranus: -0.71833,     // 17h 14m (retrograde)
  Neptune: 0.67125,     // 16h 6m 36s
  Moon: 27.321661,      // Tidally locked
  Sun: 25.05,           // Equatorial rotation
};

// Axial tilts in degrees (obliquity - NASA data)
const AXIAL_TILTS = {
  Mercury: 0.034,
  Venus: 177.36,        // Almost upside down
  Earth: 23.4393,
  Mars: 25.19,
  Jupiter: 3.13,
  Saturn: 26.73,
  Uranus: 97.77,        // On its side
  Neptune: 28.32,
  Moon: 6.687,
  Sun: 7.25,
};

// Real planet radii relative to Earth (Earth = 1)
const REAL_RADIUS_RATIO = {
  Sun: 109.2,
  Mercury: 0.383,
  Venus: 0.949,
  Earth: 1.0,
  Mars: 0.532,
  Jupiter: 11.21,
  Saturn: 9.45,
  Uranus: 4.01,
  Neptune: 3.88,
  Moon: 0.273,
};

// ================================
// VISUAL CONFIGURATION
// ================================

// 8K textures for maximum quality
const TEXTURE_PATHS = {
  Sun: '/textures/sun_8k.jpg',
  Mercury: '/textures/mercury_8k.jpg',
  Venus: '/textures/venus.jpg',
  Earth: '/textures/earth_8k.jpg',
  EarthClouds: '/textures/earth_clouds_8k.jpg',
  EarthNight: '/textures/earth_night.jpg',
  Mars: '/textures/mars_8k.jpg',
  Jupiter: '/textures/jupiter_8k.jpg',
  Saturn: '/textures/saturn_8k.jpg',
  SaturnRing: '/textures/saturn_ring.png',
  Uranus: '/textures/uranus.jpg',
  Neptune: '/textures/neptune.jpg',
  Moon: '/textures/moon_8k.jpg',
  Stars: '/textures/stars.jpg',
};

// Visual scales - planets are enlarged for visibility while maintaining relative proportions
const BASE_PLANET_SIZE = 3.5;

function getVisualSize(planetName: string): number {
  const ratio = REAL_RADIUS_RATIO[planetName as keyof typeof REAL_RADIUS_RATIO] || 1;
  // Use sqrt to compress the range for better visibility
  if (planetName === 'Sun') return 28;
  if (planetName === 'Moon') return BASE_PLANET_SIZE * 0.35;
  return BASE_PLANET_SIZE * Math.sqrt(ratio) * 1.8;
}

// Fixed visual orbit radii for good spacing
const VISUAL_ORBIT_RADIUS = {
  Mercury: 50,
  Venus: 75,
  Earth: 105,
  Mars: 140,
  Jupiter: 200,
  Saturn: 280,
  Uranus: 360,
  Neptune: 440,
};

// ================================
// SHADER CODE
// ================================

const SUN_CORONA_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SUN_CORONA_FRAGMENT = `
  uniform vec3 glowColor;
  uniform float intensity;
  uniform float falloff;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    float strength = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), falloff);
    
    // Add subtle animation
    float pulse = 1.0 + sin(time * 0.5) * 0.08;
    float flicker = 1.0 + sin(time * 2.3 + vPosition.x * 0.5) * 0.03;
    
    vec3 glow = glowColor * strength * intensity * pulse * flicker;
    float alpha = strength * intensity * 0.85;
    
    gl_FragColor = vec4(glow, alpha);
  }
`;

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  uniform vec3 atmosphereColor;
  uniform float atmosphereStrength;
  varying vec3 vNormal;
  
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    vec3 color = atmosphereColor * intensity;
    float alpha = intensity * atmosphereStrength;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ================================
// PLANET CONFIGURATIONS
// ================================

interface PlanetVisualConfig {
  hasAtmosphere?: boolean;
  atmosphereColor?: number;
  atmosphereStrength?: number;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

const PLANET_VISUAL_CONFIG: Record<string, PlanetVisualConfig> = {
  Mercury: {},
  Venus: { hasAtmosphere: true, atmosphereColor: 0xffdd99, atmosphereStrength: 0.5 },
  Earth: { hasAtmosphere: true, atmosphereColor: 0x88ccff, atmosphereStrength: 0.35 },
  Mars: { hasAtmosphere: true, atmosphereColor: 0xffaa88, atmosphereStrength: 0.12 },
  Jupiter: {},
  Saturn: { hasRings: true, ringInner: 1.15, ringOuter: 2.35 },
  Uranus: { hasRings: true, ringInner: 1.6, ringOuter: 1.85, hasAtmosphere: true, atmosphereColor: 0xaaeeff, atmosphereStrength: 0.15 },
  Neptune: { hasAtmosphere: true, atmosphereColor: 0x5588ff, atmosphereStrength: 0.25 },
};

// ================================
// MAIN COMPONENT
// ================================

export const SolarSystem3D = memo(function SolarSystem3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const planetsRef = useRef<Map<string, THREE.Group>>(new Map());
  const moonRef = useRef<THREE.Group | null>(null);
  const sunRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const texturesRef = useRef<Map<string, THREE.Texture>>(new Map());
  const coronaMaterialsRef = useRef<THREE.ShaderMaterial[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeSpeed, setTimeSpeed] = useState(1440); // minutes per real second
  const [isPaused, setIsPaused] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const planets = useMemo(() => getPlanetaryPositions(currentTime), [currentTime]);
  const moonPosition = useMemo(() => getMoonPosition(currentTime), [currentTime]);
  const earthDayNight = useMemo(() => getEarthDayNight(currentTime), [currentTime]);

  // ================================
  // CREATE STARFIELD
  // ================================
  const createStarfield = useCallback((scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
    // Milky way background sphere
    const starsTexture = texturesRef.current.get('Stars');
    if (starsTexture) {
      starsTexture.colorSpace = THREE.SRGBColorSpace;
      const skyGeometry = new THREE.SphereGeometry(5000, 64, 64);
      const skyMaterial = new THREE.MeshBasicMaterial({
        map: starsTexture,
        side: THREE.BackSide,
      });
      const sky = new THREE.Mesh(skyGeometry, skyMaterial);
      scene.add(sky);
    }

    // Individual stars with varied colors
    const starCount = 25000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 3000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Star colors based on temperature class
      const temp = Math.random();
      if (temp < 0.05) {
        // Red giants
        colors[i3] = 1.0; colors[i3 + 1] = 0.6; colors[i3 + 2] = 0.4;
      } else if (temp < 0.12) {
        // Orange
        colors[i3] = 1.0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.6;
      } else if (temp < 0.25) {
        // Blue-white (hot)
        colors[i3] = 0.8; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1.0;
      } else if (temp < 0.35) {
        // Yellow
        colors[i3] = 1.0; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.85;
      } else {
        // White
        const b = 0.7 + Math.random() * 0.3;
        colors[i3] = b; colors[i3 + 1] = b; colors[i3 + 2] = b;
      }

      sizes[i] = 0.5 + Math.random() * 2.0;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
  }, []);

  // ================================
  // CREATE SUN
  // ================================
  const createSun = useCallback((scene: THREE.Scene) => {
    const sunGroup = new THREE.Group();
    sunRef.current = sunGroup;

    const sunSize = getVisualSize('Sun');
    const sunTexture = texturesRef.current.get('Sun');

    // Sun core
    const coreGeometry = new THREE.SphereGeometry(sunSize, 128, 128);
    const coreMaterial = new THREE.MeshBasicMaterial({
      map: sunTexture,
      color: 0xffffff,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'sunCore';
    sunGroup.add(core);

    // Multi-layered corona with smooth falloff
    const coronaLayers = [
      { scale: 1.05, color: 0xffffff, intensity: 0.7, falloff: 1.5 },
      { scale: 1.12, color: 0xfffae6, intensity: 0.5, falloff: 1.8 },
      { scale: 1.22, color: 0xffee99, intensity: 0.35, falloff: 2.0 },
      { scale: 1.35, color: 0xffdd66, intensity: 0.25, falloff: 2.2 },
      { scale: 1.55, color: 0xffcc33, intensity: 0.15, falloff: 2.5 },
      { scale: 1.85, color: 0xffaa00, intensity: 0.08, falloff: 3.0 },
      { scale: 2.3, color: 0xff8800, intensity: 0.04, falloff: 3.5 },
      { scale: 3.0, color: 0xff5500, intensity: 0.02, falloff: 4.0 },
    ];

    coronaMaterialsRef.current = [];

    coronaLayers.forEach((layer, i) => {
      const coronaGeometry = new THREE.SphereGeometry(sunSize * layer.scale, 64, 64);
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(layer.color) },
          intensity: { value: layer.intensity },
          falloff: { value: layer.falloff },
          time: { value: 0 },
        },
        vertexShader: SUN_CORONA_VERTEX,
        fragmentShader: SUN_CORONA_FRAGMENT,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });

      coronaMaterialsRef.current.push(coronaMaterial);
      const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
      corona.name = `corona_${i}`;
      sunGroup.add(corona);
    });

    // Point light from sun
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0.05);
    sunLight.position.set(0, 0, 0);
    sunGroup.add(sunLight);

    scene.add(sunGroup);
  }, []);

  // ================================
  // CREATE PLANET
  // ================================
  const createPlanet = useCallback((scene: THREE.Scene, name: string) => {
    const planetGroup = new THREE.Group();
    planetGroup.name = name;

    const size = getVisualSize(name);
    const config = PLANET_VISUAL_CONFIG[name] || {};
    const texture = texturesRef.current.get(name);
    const axialTilt = AXIAL_TILTS[name as keyof typeof AXIAL_TILTS] || 0;

    // Main planet mesh
    const geometry = new THREE.SphereGeometry(size, 128, 128);

    let material: THREE.Material;
    if (name === 'Earth') {
      material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 15,
        specular: new THREE.Color(0x333344),
      });
    } else {
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.05,
      });
    }

    // Fallback color if no texture
    if (!texture) {
      const fallbackColors: Record<string, number> = {
        Mercury: 0x9e9e9e,
        Venus: 0xe8c87a,
        Earth: 0x4a90d9,
        Mars: 0xc1440e,
        Jupiter: 0xd4a574,
        Saturn: 0xeadba6,
        Uranus: 0xa5d6e7,
        Neptune: 0x4169e1,
      };
      (material as THREE.MeshStandardMaterial).color = new THREE.Color(fallbackColors[name] || 0x888888);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'planetMesh';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    planetGroup.add(mesh);

    // Earth clouds layer
    if (name === 'Earth') {
      const cloudTexture = texturesRef.current.get('EarthClouds');
      if (cloudTexture) {
        const cloudGeometry = new THREE.SphereGeometry(size * 1.015, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.name = 'clouds';
        planetGroup.add(clouds);
      }
    }

    // Atmosphere glow
    if (config.hasAtmosphere) {
      const atmoGeometry = new THREE.SphereGeometry(size * 1.03, 64, 64);
      const atmoMaterial = new THREE.ShaderMaterial({
        uniforms: {
          atmosphereColor: { value: new THREE.Color(config.atmosphereColor || 0x88aaff) },
          atmosphereStrength: { value: config.atmosphereStrength || 0.3 },
        },
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const atmosphere = new THREE.Mesh(atmoGeometry, atmoMaterial);
      atmosphere.name = 'atmosphere';
      planetGroup.add(atmosphere);
    }

    // Rings (Saturn, Uranus)
    if (config.hasRings) {
      const ringInner = size * (config.ringInner || 1.3);
      const ringOuter = size * (config.ringOuter || 2.4);
      const ringGeometry = new THREE.RingGeometry(ringInner, ringOuter, 256, 8);

      // Fix UV mapping for rings
      const pos = ringGeometry.attributes.position;
      const uv = ringGeometry.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const dist = Math.sqrt(x * x + y * y);
        const u = (dist - ringInner) / (ringOuter - ringInner);
        uv.setXY(i, u, 0.5);
      }

      let ringMaterial: THREE.Material;
      const ringTexture = name === 'Saturn' ? texturesRef.current.get('SaturnRing') : null;

      if (ringTexture) {
        ringMaterial = new THREE.MeshBasicMaterial({
          map: ringTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
      } else {
        // Procedural ring
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        if (name === 'Saturn') {
          gradient.addColorStop(0, 'rgba(200, 180, 150, 0)');
          gradient.addColorStop(0.05, 'rgba(220, 200, 170, 0.9)');
          gradient.addColorStop(0.12, 'rgba(180, 160, 130, 0.25)');
          gradient.addColorStop(0.18, 'rgba(235, 215, 185, 0.95)');
          gradient.addColorStop(0.35, 'rgba(210, 190, 160, 0.7)');
          gradient.addColorStop(0.48, 'rgba(180, 160, 130, 0.15)');
          gradient.addColorStop(0.55, 'rgba(230, 210, 180, 0.85)');
          gradient.addColorStop(0.75, 'rgba(200, 180, 150, 0.5)');
          gradient.addColorStop(0.9, 'rgba(180, 160, 130, 0.3)');
          gradient.addColorStop(1, 'rgba(180, 160, 130, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(160, 200, 220, 0)');
          gradient.addColorStop(0.2, 'rgba(160, 200, 220, 0.4)');
          gradient.addColorStop(0.5, 'rgba(180, 220, 240, 0.3)');
          gradient.addColorStop(0.8, 'rgba(160, 200, 220, 0.2)');
          gradient.addColorStop(1, 'rgba(160, 200, 220, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const canvasTexture = new THREE.CanvasTexture(canvas);
        ringMaterial = new THREE.MeshBasicMaterial({
          map: canvasTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        });
      }

      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.name = 'ring';
      planetGroup.add(ring);
    }

    // Apply axial tilt to entire group
    planetGroup.rotation.x = (axialTilt * Math.PI) / 180;

    // Create orbit path
    const orbitRadius = VISUAL_ORBIT_RADIUS[name as keyof typeof VISUAL_ORBIT_RADIUS];
    if (orbitRadius) {
      const orbitGeometry = new THREE.BufferGeometry();
      const orbitPoints: THREE.Vector3[] = [];
      for (let i = 0; i <= 360; i++) {
        const angle = (i / 360) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
          Math.cos(angle) * orbitRadius,
          0,
          Math.sin(angle) * orbitRadius
        ));
      }
      orbitGeometry.setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0x334466,
        transparent: true,
        opacity: 0.25,
      });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbit);
    }

    scene.add(planetGroup);
    planetsRef.current.set(name, planetGroup);
  }, []);

  // ================================
  // CREATE MOON
  // ================================
  const createMoon = useCallback((scene: THREE.Scene) => {
    const moonGroup = new THREE.Group();
    const size = getVisualSize('Moon');
    const texture = texturesRef.current.get('Moon');

    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0,
    });

    if (!texture) {
      material.color = new THREE.Color(0xbbbbbb);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    moonGroup.add(mesh);

    moonGroup.rotation.x = (AXIAL_TILTS.Moon * Math.PI) / 180;
    scene.add(moonGroup);
    moonRef.current = moonGroup;
  }, []);

  // ================================
  // LIGHTING SETUP
  // ================================
  const setupLighting = useCallback((scene: THREE.Scene) => {
    const ambient = new THREE.AmbientLight(0x202030, 0.3);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222244, 0.2);
    scene.add(hemi);
  }, []);

  // ================================
  // INITIALIZATION
  // ================================
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000008);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 15000);
    camera.position.set(200, 350, 600);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 60;
    controls.maxDistance = 3000;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 1.0;
    controlsRef.current = controls;

    // Load textures
    const loader = new THREE.TextureLoader();
    let loaded = 0;
    const total = Object.keys(TEXTURE_PATHS).length;

    const texturePromises = Object.entries(TEXTURE_PATHS).map(([name, path]) => {
      return new Promise<void>((resolve) => {
        loader.load(
          path,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            texturesRef.current.set(name, texture);
            loaded++;
            setLoadingProgress(Math.round((loaded / total) * 100));
            resolve();
          },
          undefined,
          () => {
            console.warn(`Texture not loaded: ${name}`);
            loaded++;
            setLoadingProgress(Math.round((loaded / total) * 100));
            resolve();
          }
        );
      });
    });

    Promise.all(texturePromises).then(() => {
      createStarfield(scene, renderer);
      createSun(scene);
      ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].forEach(name => {
        createPlanet(scene, name);
      });
      createMoon(scene);
      setupLighting(scene);
      setIsReady(true);
    });

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      texturesRef.current.forEach(t => t.dispose());
      renderer.dispose();
    };
  }, [createStarfield, createSun, createPlanet, createMoon, setupLighting]);

  // ================================
  // UPDATE PLANET POSITIONS
  // ================================
  useEffect(() => {
    if (!isReady) return;

    planets.forEach((planet) => {
      const group = planetsRef.current.get(planet.name);
      if (group) {
        const visualRadius = VISUAL_ORBIT_RADIUS[planet.name as keyof typeof VISUAL_ORBIT_RADIUS] || 50;
        const angle = Math.atan2(planet.y, planet.x);

        group.userData.targetAngle = angle;
        group.userData.orbitRadius = visualRadius;

        if (group.userData.currentAngle === undefined) {
          group.userData.currentAngle = angle;
          group.position.set(
            Math.cos(angle) * visualRadius,
            0,
            Math.sin(angle) * visualRadius
          );
        }
      }
    });

    // Moon
    const earth = planetsRef.current.get('Earth');
    if (earth && moonRef.current) {
      const earthData = planets.find(p => p.name === 'Earth');
      if (earthData) {
        const earthAngle = Math.atan2(earthData.y, earthData.x);
        const moonAngle = Math.atan2(moonPosition.y, moonPosition.x);
        const relativeAngle = moonAngle - earthAngle;

        moonRef.current.userData.targetAngle = relativeAngle;
        if (moonRef.current.userData.currentAngle === undefined) {
          moonRef.current.userData.currentAngle = relativeAngle;
        }
      }
    }
  }, [planets, moonPosition, isReady]);

  // ================================
  // TIME SIMULATION
  // ================================
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 60000 * timeSpeed));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeSpeed, isPaused]);

  // ================================
  // ANIMATION LOOP
  // ================================
  useEffect(() => {
    if (!isReady || !rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      controlsRef.current?.update();

      // Sun rotation and corona animation
      if (sunRef.current) {
        const core = sunRef.current.children.find(c => c.name === 'sunCore') as THREE.Mesh;
        if (core) {
          const sunRotationsPerSecond = (timeSpeed / 1440) / ROTATION_PERIODS_DAYS.Sun;
          core.rotation.y += sunRotationsPerSecond * 2 * Math.PI * delta;
        }

        coronaMaterialsRef.current.forEach(mat => {
          mat.uniforms.time.value = elapsed;
        });
      }

      // Planet animations
      planetsRef.current.forEach((group, name) => {
        // Smooth orbital interpolation
        if (group.userData.targetAngle !== undefined) {
          let current = group.userData.currentAngle || 0;
          const target = group.userData.targetAngle;

          let diff = target - current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          const lerp = 1 - Math.pow(0.00001, delta);
          current += diff * lerp;
          group.userData.currentAngle = current;

          const radius = group.userData.orbitRadius || 50;
          group.position.set(
            Math.cos(current) * radius,
            0,
            Math.sin(current) * radius
          );
        }

        // Self-rotation
        const rotationPeriod = ROTATION_PERIODS_DAYS[name as keyof typeof ROTATION_PERIODS_DAYS];
        if (rotationPeriod) {
          const mesh = group.children.find(c => c.name === 'planetMesh') as THREE.Mesh;
          if (mesh) {
            const daysPerSecond = timeSpeed / 1440;
            const rotationsPerSecond = daysPerSecond / Math.abs(rotationPeriod);
            const direction = rotationPeriod > 0 ? 1 : -1;
            mesh.rotation.y += direction * rotationsPerSecond * 2 * Math.PI * delta;
          }

          // Clouds rotate slightly faster
          const clouds = group.children.find(c => c.name === 'clouds') as THREE.Mesh;
          if (clouds) {
            const daysPerSecond = timeSpeed / 1440;
            clouds.rotation.y += (daysPerSecond / 0.85) * 2 * Math.PI * delta;
          }
        }
      });

      // Moon
      if (moonRef.current) {
        const earth = planetsRef.current.get('Earth');
        if (earth) {
          let current = moonRef.current.userData.currentAngle || 0;
          const target = moonRef.current.userData.targetAngle || 0;

          let diff = target - current;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          const lerp = 1 - Math.pow(0.00001, delta);
          current += diff * lerp;
          moonRef.current.userData.currentAngle = current;

          const moonDistance = 15;
          moonRef.current.position.set(
            earth.position.x + Math.cos(current) * moonDistance,
            0,
            earth.position.z + Math.sin(current) * moonDistance
          );

          // Moon self-rotation (tidally locked)
          const daysPerSecond = timeSpeed / 1440;
          const moonRotation = daysPerSecond / ROTATION_PERIODS_DAYS.Moon;
          const moonMesh = moonRef.current.children[0] as THREE.Mesh;
          if (moonMesh) {
            moonMesh.rotation.y += moonRotation * 2 * Math.PI * delta;
          }
        }
      }

      rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isReady, timeSpeed]);

  // ================================
  // RENDER
  // ================================
  return (
    <div className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {loadingProgress < 100 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/98 z-50">
          <div className="text-center">
            <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-400 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-orange-300 font-light text-lg mb-3 tracking-wide">Loading Solar System</p>
            <div className="w-64 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-500"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-slate-600 text-sm mt-3 font-mono">{loadingProgress}%</p>
          </div>
        </div>
      )}

      {/* Controls - Minimal */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur border border-slate-700/30 rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-2 py-1 rounded ${isPaused ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <div className="flex gap-1">
          {[
            { val: 1, label: '1×' },
            { val: 1440, label: '1d' },
            { val: 10080, label: '1w' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setTimeSpeed(val)}
              className={`px-2 py-1 rounded ${timeSpeed === val ? 'text-orange-300 bg-orange-500/20' : 'text-slate-500'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-slate-500 hidden sm:inline">{currentTime.toLocaleDateString()}</span>
      </div>

      {/* Planet Legend - With Names & Orbital Periods */}
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur border border-slate-700/30 rounded-lg px-3 py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          {[
            { name: 'Mercury', color: '#9e9e9e', year: '88d' },
            { name: 'Venus', color: '#e8c87a', year: '225d' },
            { name: 'Earth', color: '#4a90d9', year: '1y' },
            { name: 'Mars', color: '#c1440e', year: '1.9y' },
            { name: 'Jupiter', color: '#d4a574', year: '12y' },
            { name: 'Saturn', color: '#eadba6', year: '29y' },
            { name: 'Uranus', color: '#a5d6e7', year: '84y' },
            { name: 'Neptune', color: '#4169e1', year: '165y' },
          ].map(({ name, color, year }) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-slate-400">{name}</span>
              <span className="text-slate-600 ml-auto">{year}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-slate-800/50 rounded-full px-6 py-3 shadow-xl">
        <span className="text-slate-400 text-sm">Drag to rotate • Scroll to zoom • Real-time orbital mechanics</span>
      </div>
    </div>
  );
});