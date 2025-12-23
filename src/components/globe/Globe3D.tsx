'use client';

import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import type { ProcessedSatellite, FilterState, MissionMode } from '@/types/satellite.d';
import { SATELLITE_COLORS } from '@/lib/constants';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeRef = any;

const Globe = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cyan-400 font-mono text-sm">Loading 3D Globe...</p>
      </div>
    </div>
  ),
});

interface Globe3DProps {
  satellites: ProcessedSatellite[];
  filters: FilterState;
  onSatelliteClick: (satellite: ProcessedSatellite | null) => void;
  selectedSatellite: ProcessedSatellite | null;
  mode: MissionMode;
  highlightedSatelliteId?: number | null;
}

interface LaunchSite {
  name: string;
  lat: number;
  lng: number;
  country: string;
}

const LAUNCH_SITES: LaunchSite[] = [
  { name: 'Kennedy Space Center', lat: 28.5729, lng: -80.6490, country: 'USA' },
  { name: 'Cape Canaveral SFS', lat: 28.4889, lng: -80.5778, country: 'USA' },
  { name: 'Vandenberg SFB', lat: 34.7420, lng: -120.5724, country: 'USA' },
  { name: 'Baikonur Cosmodrome', lat: 45.9650, lng: 63.3050, country: 'Kazakhstan' },
  { name: 'Vostochny Cosmodrome', lat: 51.8844, lng: 128.3330, country: 'Russia' },
  { name: 'Guiana Space Centre', lat: 5.2322, lng: -52.7693, country: 'French Guiana' },
  { name: 'Satish Dhawan SC', lat: 13.7199, lng: 80.2304, country: 'India' },
  { name: 'Jiuquan Satellite LC', lat: 40.9606, lng: 100.2916, country: 'China' },
  { name: 'Xichang Satellite LC', lat: 28.2467, lng: 102.0267, country: 'China' },
  { name: 'Wenchang SC', lat: 19.6145, lng: 110.9510, country: 'China' },
  { name: 'Tanegashima SC', lat: 30.4000, lng: 130.9700, country: 'Japan' },
  { name: 'Plesetsk Cosmodrome', lat: 62.9271, lng: 40.5777, country: 'Russia' },
];

const EARTH_RADIUS_KM = 6371;
const REAL_TIME_ROTATION_SPEED = 0.1;

function isValidNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

function isValidPosition(sat: ProcessedSatellite): boolean {
  return sat.position != null &&
    isValidNumber(sat.position.latitude) &&
    isValidNumber(sat.position.longitude) &&
    isValidNumber(sat.position.altitude) &&
    sat.position.altitude > 0 &&
    sat.position.latitude >= -90 &&
    sat.position.latitude <= 90 &&
    sat.position.longitude >= -180 &&
    sat.position.longitude <= 180;
}

function getSunPosition(): { lat: number; lng: number } {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();
  const timeDecimal = hours + minutes / 60 + seconds / 3600;
  const hourAngle = (timeDecimal - 12) * 15;
  return {
    lat: declination,
    lng: -hourAngle,
  };
}

const spriteTextureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(color: string, type: 'satellite' | 'station' | 'debris'): THREE.CanvasTexture {
  const key = `${color}-${type}`;
  if (spriteTextureCache.has(key)) {
    return spriteTextureCache.get(key)!;
  }
  
  const canvas = document.createElement('canvas');
  const size = type === 'station' ? 64 : 48;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  
  const center = size / 2;
  
  if (type === 'station') {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center, center, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center - 22, center);
    ctx.lineTo(center - 12, center);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center + 12, center);
    ctx.lineTo(center + 22, center);
    ctx.stroke();
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center - 18);
    ctx.lineTo(center, center - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center, center + 10);
    ctx.lineTo(center, center + 18);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.fillRect(center - 24, center - 5, 8, 10);
    ctx.fillRect(center + 16, center - 5, 8, 10);
    
  } else if (type === 'debris') {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    
    const points = 6;
    const outerRadius = 10;
    const innerRadius = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(center, center, 16, 0, Math.PI * 2);
    ctx.stroke();
    
  } else {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillRect(center - 4, center - 4, 8, 8);
    ctx.restore();
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center - 18, center);
    ctx.lineTo(center - 6, center);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center + 6, center);
    ctx.lineTo(center + 18, center);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(center - 18, center - 6, 10, 12);
    ctx.fillRect(center + 8, center - 6, 10, 12);
    ctx.globalAlpha = 1;
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  spriteTextureCache.set(key, texture);
  
  return texture;
}

function createSatelliteSprite(color: string, size: number, type: 'satellite' | 'station' | 'debris'): THREE.Sprite {
  const texture = getOrCreateTexture(color, type);
  
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    sizeAttenuation: true,
  });
  
  const sprite = new THREE.Sprite(spriteMaterial);
  const baseSize = type === 'station' ? 4.5 : type === 'debris' ? 2.5 : 3;
  sprite.scale.set(size * baseSize, size * baseSize, 1);
  
  return sprite;
}

const positionCache = new Map<string | number, { x: number; y: number; z: number; targetX: number; targetY: number; targetZ: number }>();
const LERP_FACTOR = 0.05;

export const Globe3D = memo(function Globe3D({ satellites, filters, onSatelliteClick, selectedSatellite, mode, highlightedSatelliteId }: Globe3DProps) {
  const globeRef = useRef<GlobeRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [globeReady, setGlobeReady] = useState(false);
  const isMouseInsideGlobe = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [sunPosition, setSunPosition] = useState(getSunPosition);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSunPosition(getSunPosition());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (globeRef.current && globeReady) {
      const scene = globeRef.current.scene();
      if (scene) {
        scene.children.forEach((child: THREE.Object3D) => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = 0.15;
          }
        });

        if (!directionalLightRef.current) {
          const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
          directionalLightRef.current = sunLight;
          scene.add(sunLight);
        }

        if (directionalLightRef.current) {
          const sunLat = sunPosition.lat * (Math.PI / 180);
          const sunLng = sunPosition.lng * (Math.PI / 180);
          const distance = 400;
          const x = distance * Math.cos(sunLat) * Math.cos(sunLng);
          const y = distance * Math.sin(sunLat);
          const z = distance * Math.cos(sunLat) * Math.sin(sunLng);
          directionalLightRef.current.position.set(x, y, z);
        }
      }
    }
  }, [globeReady, sunPosition]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
      );
      
      const globeScreenRadius = Math.min(rect.width, rect.height) * 0.35;
      const wasInside = isMouseInsideGlobe.current;
      isMouseInsideGlobe.current = distance < globeScreenRadius;
      
      if (globeRef.current && globeRef.current.controls && wasInside !== isMouseInsideGlobe.current) {
        globeRef.current.controls().autoRotate = !isMouseInsideGlobe.current;
      }
    };

    const handleMouseLeave = () => {
      isMouseInsideGlobe.current = false;
      if (globeRef.current && globeRef.current.controls) {
        globeRef.current.controls().autoRotate = true;
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (globeRef.current && globeReady) {
      const globe = globeRef.current;
      if (globe.controls) {
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = REAL_TIME_ROTATION_SPEED;
        globe.controls().enableZoom = true;
        globe.controls().minDistance = 120;
        globe.controls().maxDistance = 600;
        globe.controls().enableDamping = true;
        globe.controls().dampingFactor = 0.1;
      }
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
    }
  }, [globeReady]);

  useEffect(() => {
    if (highlightedSatelliteId && globeRef.current) {
      const sat = satellites.find(s => s.id === highlightedSatelliteId);
      if (sat && sat.position) {
        globeRef.current.pointOfView({
          lat: sat.position.latitude,
          lng: sat.position.longitude,
          altitude: 1.5,
        }, 1000);
        onSatelliteClick(sat);
      }
    }
  }, [highlightedSatelliteId, satellites, onSatelliteClick]);

  useEffect(() => {
    const animate = () => {
      positionCache.forEach((pos) => {
        pos.x += (pos.targetX - pos.x) * LERP_FACTOR;
        pos.y += (pos.targetY - pos.y) * LERP_FACTOR;
        pos.z += (pos.targetZ - pos.z) * LERP_FACTOR;
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => {
      if (!isValidPosition(sat)) return false;

      if (highlightedSatelliteId && sat.id === highlightedSatelliteId) {
        return true;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (sat.name.toLowerCase().includes(query) || 
            sat.id.toString().includes(query)) {
          return true;
        }
      }
      
      if (mode === 'INFRASTRUCTURE') {
        if (sat.type === 'debris' || sat.type === 'rocket_body') return false;
        if (sat.type === 'starlink' && !filters.showStarlink) return false;
        if (sat.type === 'station' && !filters.showStations) return false;
        if (sat.type === 'active' && !filters.showActive) return false;
        return true;
      }
      
      if (mode === 'THREAT') {
        if (filters.reentryWatch && sat.isReentry) return true;
        if (sat.type === 'active' || sat.type === 'starlink' || sat.type === 'station') return false;
        if ((sat.type === 'debris' || sat.type === 'rocket_body') && filters.showDebris) return true;
        return false;
      }
      
      if (mode === 'LAUNCH') {
        if (sat.type === 'station') return true;
        return false;
      }

      return false;
    });
  }, [satellites, filters, mode, highlightedSatelliteId]);

  const selectedId = selectedSatellite?.id;

  const getSatelliteColor = useCallback((sat: ProcessedSatellite, isHighlighted: boolean): string => {
    if (isHighlighted) {
      return 'rgb(255, 255, 0)';
    }
    if (sat.isReentry) {
      const [r, g, b] = SATELLITE_COLORS.reentry;
      return `rgb(${r}, ${g}, ${b})`;
    }
    const color = SATELLITE_COLORS[sat.type] || SATELLITE_COLORS.active;
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }, []);

  const getSatelliteType = useCallback((sat: ProcessedSatellite): 'satellite' | 'station' | 'debris' => {
    if (sat.type === 'station') return 'station';
    if (sat.type === 'debris' || sat.type === 'rocket_body') return 'debris';
    return 'satellite';
  }, []);

  const customData = useMemo(() => {
    return filteredSatellites
      .filter(isValidPosition)
      .map(sat => {
        const altitudeKm = sat.position.altitude;
        const normalizedAlt = (altitudeKm / EARTH_RADIUS_KM) * 0.15;
        const isHighlighted = highlightedSatelliteId === sat.id;
        const satType = getSatelliteType(sat);
        
        return {
          lat: sat.position.latitude,
          lng: sat.position.longitude,
          alt: Math.max(0.01, Math.min(normalizedAlt, 0.5)),
          size: isHighlighted ? 3.5 :
                selectedId === sat.id ? 2.5 : 
                satType === 'station' ? 2.5 : 
                sat.isReentry ? 1.5 : 1.0,
          color: getSatelliteColor(sat, isHighlighted),
          satellite: sat,
          satType,
          id: sat.id,
          isHighlighted,
        };
      });
  }, [filteredSatellites, selectedId, getSatelliteColor, getSatelliteType, highlightedSatelliteId]);

  const launchSiteData = useMemo(() => {
    if (mode !== 'LAUNCH') return [];
    return LAUNCH_SITES.map(site => ({
      lat: site.lat,
      lng: site.lng,
      name: site.name,
      country: site.country,
      size: 1.5,
      color: 'rgba(255, 200, 100, 0.9)',
    }));
  }, [mode]);

  const handleObjectClick = useCallback((obj: { satellite?: ProcessedSatellite; lat: number; lng: number } | null) => {
    if (obj && obj.satellite) {
      onSatelliteClick(obj.satellite);
      if (globeRef.current) {
        globeRef.current.pointOfView({
          lat: obj.lat,
          lng: obj.lng,
          altitude: 1.5,
        }, 1000);
      }
    }
  }, [onSatelliteClick]);

  const handleGlobeClick = useCallback(() => {
    onSatelliteClick(null);
  }, [onSatelliteClick]);

  const handleGlobeReady = useCallback(() => {
    setGlobeReady(true);
  }, []);

  const ringsData = useMemo(() => {
    if (!selectedSatellite || !isValidPosition(selectedSatellite)) return [];
    const altitudeKm = selectedSatellite.position.altitude;
    const normalizedAlt = (altitudeKm / EARTH_RADIUS_KM) * 0.15;
    return [{
      lat: selectedSatellite.position.latitude,
      lng: selectedSatellite.position.longitude,
      altitude: Math.max(0.005, Math.min(normalizedAlt, 0.5)),
      maxR: 3,
      propagationSpeed: 2,
      repeatPeriod: 1000,
      color: () => 'rgba(0, 255, 255, 0.6)',
    }];
  }, [selectedSatellite]);

  const createCustomObject = useCallback((d: { color: string; size: number; satType: 'satellite' | 'station' | 'debris' }) => {
    return createSatelliteSprite(d.color, d.size, d.satType);
  }, []);

  const updateCustomObject = useCallback((obj: THREE.Object3D, d: { id: string | number; lat: number; lng: number; alt: number }) => {
    if (globeRef.current) {
      const coords = globeRef.current.getCoords(d.lat, d.lng, d.alt);
      if (coords) {
        const cached = positionCache.get(d.id);
        if (cached) {
          cached.targetX = coords.x;
          cached.targetY = coords.y;
          cached.targetZ = coords.z;
          obj.position.set(cached.x, cached.y, cached.z);
        } else {
          positionCache.set(d.id, {
            x: coords.x,
            y: coords.y,
            z: coords.z,
            targetX: coords.x,
            targetY: coords.y,
            targetZ: coords.z,
          });
          obj.position.set(coords.x, coords.y, coords.z);
        }
      }
    }
  }, []);

  const objectCount = customData.length;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#000005] overflow-hidden">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="/textures/earth_8k.jpg"
        bumpImageUrl="/textures/earth_normal.jpg"
        backgroundImageUrl="/textures/stars.jpg"
        atmosphereColor="rgba(100, 180, 255, 0.8)"
        atmosphereAltitude={0.15}
        customLayerData={customData}
        customThreeObject={createCustomObject}
        customThreeObjectUpdate={updateCustomObject}
        onCustomLayerClick={handleObjectClick}
        onGlobeClick={handleGlobeClick}
        onGlobeReady={handleGlobeReady}
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringAltitude="altitude"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        ringColor="color"
        labelsData={launchSiteData}
        labelLat="lat"
        labelLng="lng"
        labelText="name"
        labelSize={1.2}
        labelDotRadius={0.8}
        labelColor={() => 'rgba(255, 200, 100, 1)'}
        labelResolution={3}
        labelAltitude={0.01}
        enablePointerInteraction={true}
        animateIn={false}
      />
      
      <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-cyan-400 text-xs font-mono font-semibold tracking-wider">3D LIVE</span>
        </div>
        <div className="text-[10px] text-white/40 mt-1 font-mono">
          <span className="text-cyan-400/60">SYSTEM STATUS</span>
        </div>
      </div>
      
      <div className="absolute bottom-24 sm:bottom-28 right-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2.5 z-10">
        <span className="text-cyan-400/90 text-xs font-mono font-semibold">
          {objectCount.toLocaleString()} <span className="text-white/40">tracked</span>
        </span>
      </div>
      
      <div className="absolute bottom-24 sm:bottom-28 left-4 flex flex-wrap gap-2 text-[10px] font-mono z-10 max-w-[200px] sm:max-w-[280px]">
        <Legend color="rgb(34, 197, 94)" label="Active" icon="●" />
        <Legend color="rgb(59, 130, 246)" label="Starlink" icon="●" />
        <Legend color="rgb(168, 85, 247)" label="Station" icon="◉" />
        <Legend color="rgb(239, 68, 68)" label="Debris" icon="✦" />
        <Legend color="rgb(251, 191, 36)" label="Re-entry" icon="⚠" />
        {mode === 'LAUNCH' && <Legend color="rgb(255, 200, 100)" label="Launch Site" icon="◎" />}
      </div>

      <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2.5 max-w-[180px] z-10 hidden lg:block">
        <p className="text-cyan-400/80 text-xs font-mono">
          Drag to rotate • Scroll to zoom
        </p>
      </div>
    </div>
  );
});

const Legend = memo(function Legend({ color, label, icon }: { color: string; label: string; icon: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/50">
      <span className="text-sm" style={{ color, textShadow: `0 0 6px ${color}` }}>{icon}</span>
      <span className="text-slate-300 text-[10px]">{label}</span>
    </div>
  );
});
