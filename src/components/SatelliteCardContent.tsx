'use client';

import { X, Satellite, Gauge, ArrowUp, Globe, AlertTriangle, Flag, Hash } from 'lucide-react';
import type { ProcessedSatellite } from '@/types/satellite.d';
import { SATELLITE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SatelliteCardContentProps {
  satellite: ProcessedSatellite;
  onClose: () => void;
  className?: string;
}

export function SatelliteCardContent({ satellite, onClose, className }: SatelliteCardContentProps) {
  const typeLabels = {
    active: 'Active Satellite',
    starlink: 'Starlink Satellite',
    station: 'Space Station',
    debris: 'Space Debris',
    rocket_body: 'Rocket Body',
  };

  const typeGradients = {
    active: 'from-green-400 to-emerald-500',
    starlink: 'from-cyan-400 to-blue-500',
    station: 'from-purple-400 to-violet-500',
    debris: 'from-red-400 to-rose-500',
    rocket_body: 'from-orange-400 to-amber-500',
  };

  const typeGlows = {
    active: 'liquid-glow-green',
    starlink: 'liquid-glow-cyan',
    station: 'liquid-glow-purple',
    debris: 'liquid-glow-red',
    rocket_body: 'liquid-glow-yellow',
  };

  const color = SATELLITE_COLORS[satellite.type];
  const rgbColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

  return (
    <div className={cn("relative p-5 sm:p-6 md:p-7", className)}>
        <div className="flex items-start justify-between mb-4 sm:mb-5 md:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={cn(
              "relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl liquid-glass flex items-center justify-center",
              typeGlows[satellite.type]
            )}>
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-30" style={{ backgroundColor: rgbColor }} />
              <Satellite className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10" style={{ color: rgbColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white leading-tight tracking-tight truncate">{satellite.name}</h3>
              <p className="text-xs sm:text-sm text-white/50 font-medium">{typeLabels[satellite.type]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="liquid-button min-w-[44px] min-h-[44px] p-2.5 sm:p-3 rounded-xl text-white/40 hover:text-white transition-colors active:scale-95 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {satellite.isReentry && (
          <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 liquid-card liquid-glow-yellow mb-4 sm:mb-5 animate-pulse-glow min-h-[56px]" style={{ boxShadow: '0 0 20px rgba(255,200,100,0.2)' }}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-semibold text-yellow-400">WARNING</span>
              <p className="text-xs sm:text-sm text-yellow-400/70">Orbital Decay Imminent</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <DataField
            icon={<Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="NORAD ID"
            value={satellite.id.toString()}
          />
          <DataField
            icon={<Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Country"
            value={satellite.country}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <DataField
            icon={<ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Altitude"
            value={`${satellite.position.altitude.toFixed(1)} km`}
            highlight
            color="cyan"
          />
          <DataField
            icon={<Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Velocity"
            value={`${satellite.position.velocity.toFixed(2)} km/s`}
            highlight
            color="purple"
          />
          <DataField
            icon={<Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Latitude"
            value={`${satellite.position.latitude.toFixed(4)}°`}
          />
          <DataField
            icon={<Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            label="Longitude"
            value={`${satellite.position.longitude.toFixed(4)}°`}
          />
        </div>

        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] sm:text-xs text-white/30 font-mono tracking-wide">
            Object ID: {satellite.objectId}
          </p>
        </div>
    </div>
  );
}

interface DataFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  color?: 'cyan' | 'purple' | 'green' | 'yellow';
}

function DataField({ icon, label, value, highlight, color = 'cyan' }: DataFieldProps) {
  const glowClasses = {
    cyan: 'liquid-glow-cyan',
    purple: 'liquid-glow-purple',
    green: 'liquid-glow-green',
    yellow: 'liquid-glow-yellow',
  };

  const textColors = {
    cyan: 'text-gradient-cyan',
    purple: 'text-gradient-purple',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className={cn(
      "liquid-card p-3 sm:p-3.5 md:p-4 transition-all duration-300 min-h-[64px] sm:min-h-[72px]",
      highlight && glowClasses[color]
    )} style={{ boxShadow: highlight ? undefined : 'none' }}>
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/40 mb-1 sm:mb-1.5">
        {icon}
        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={cn(
        "text-xs sm:text-sm font-mono font-bold",
        highlight ? textColors[color] : 'text-white'
      )}>
        {value}
      </p>
    </div>
  );
}