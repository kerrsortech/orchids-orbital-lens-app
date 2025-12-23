'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { ProcessedSatellite, FilterState, ViewState } from '@/types/satellite.d';
import { SATELLITE_COLORS, INITIAL_VIEW_STATE } from '@/lib/constants';
import 'maplibre-gl/dist/maplibre-gl.css';

interface DeckGLMapProps {
  satellites: ProcessedSatellite[];
  filters: FilterState;
  onSatelliteClick: (satellite: ProcessedSatellite | null) => void;
  selectedSatellite: ProcessedSatellite | null;
}

export function DeckGLMap({ satellites, filters, onSatelliteClick, selectedSatellite }: DeckGLMapProps) {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [time, setTime] = useState(Date.now());
  const [isReady, setIsReady] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const animate = () => {
      setTime(Date.now());
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isReady]);

  const filteredSatellites = useMemo(() => {
    return satellites.filter(sat => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!sat.name.toLowerCase().includes(query) && 
            !sat.id.toString().includes(query)) {
          return false;
        }
      }
      
      if (filters.reentryWatch && !sat.isReentry) return false;
      
      switch (sat.type) {
        case 'starlink':
          return filters.showStarlink;
        case 'debris':
        case 'rocket_body':
          return filters.showDebris;
        case 'station':
          return filters.showStations;
        default:
          return filters.showActive;
      }
    });
  }, [satellites, filters]);

  const getSatelliteColor = useCallback((sat: ProcessedSatellite): [number, number, number, number] => {
    const isSelected = selectedSatellite?.id === sat.id;
    const pulse = isSelected ? 255 : 200;
    
    if (sat.isReentry) {
      const flash = Math.sin(time / 200) * 0.3 + 0.7;
      return [...SATELLITE_COLORS.reentry.map(c => c * flash) as [number, number, number], pulse];
    }
    
    const color = SATELLITE_COLORS[sat.type] || SATELLITE_COLORS.active;
    return [...color, pulse];
  }, [selectedSatellite, time]);

  const getPosition = useCallback((sat: ProcessedSatellite): [number, number] => {
    return [sat.position.longitude, sat.position.latitude];
  }, []);

  const handleClick = useCallback((info: PickingInfo) => {
    if (info.object) {
      onSatelliteClick(info.object as ProcessedSatellite);
    } else {
      onSatelliteClick(null);
    }
  }, [onSatelliteClick]);

  const layers = useMemo(() => {
    if (!isReady) return [];
    return [
      new ScatterplotLayer({
        id: 'satellites',
        data: filteredSatellites,
        pickable: true,
        opacity: 0.9,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 4,
        radiusMaxPixels: 16,
        lineWidthMinPixels: 1,
        getPosition,
        getRadius: (sat: ProcessedSatellite) => {
          if (selectedSatellite?.id === sat.id) return 12;
          if (sat.type === 'station') return 8;
          if (sat.isReentry) return 7;
          return 5;
        },
        getFillColor: getSatelliteColor,
        getLineColor: (sat: ProcessedSatellite) => {
          if (selectedSatellite?.id === sat.id) return [255, 255, 255, 255];
          return [255, 255, 255, 100];
        },
        updateTriggers: {
          getFillColor: [selectedSatellite?.id, time],
          getRadius: [selectedSatellite?.id],
          getLineColor: [selectedSatellite?.id],
        },
      }),
    ];
  }, [filteredSatellites, getSatelliteColor, getPosition, selectedSatellite, time, isReady]);

  if (!isReady) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 font-mono text-sm">Initializing map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState as ViewState)}
        layers={layers}
        onClick={handleClick}
        controller={true}
        useDevicePixels={true}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      >
        <Map
          reuseMaps
          mapStyle={{
            version: 8,
            sources: {
              'dark-base': {
                type: 'raster',
                tiles: [
                  'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
                ],
                tileSize: 256,
                attribution: '© CartoDB'
              }
            },
            layers: [{
              id: 'dark-tiles',
              type: 'raster',
              source: 'dark-base',
              minzoom: 0,
              maxzoom: 19
            }]
          }}
        />
      </DeckGL>
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
      </div>
      
      <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-cyan-400 text-xs font-mono">LIVE TRACKING</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-4 py-2">
        <span className="text-cyan-400/80 text-xs font-mono">
          {filteredSatellites.length.toLocaleString()} objects tracked
        </span>
      </div>
      
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs font-mono">
        <Legend color="rgb(34, 197, 94)" label="Active" />
        <Legend color="rgb(59, 130, 246)" label="Starlink" />
        <Legend color="rgb(168, 85, 247)" label="Station" />
        <Legend color="rgb(239, 68, 68)" label="Debris" />
        <Legend color="rgb(251, 191, 36)" label="Re-entry" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-sm px-2 py-1 rounded border border-slate-800">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}