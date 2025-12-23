'use client';

import { useMission } from '@/context/MissionContext';
import { Activity, ShieldAlert, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  counts: {
    active: number;
    debris: number;
    total: number;
    stations: number;
  };
}

export function QuickStats({ counts }: QuickStatsProps) {
  const { currentMode } = useMission();

  const getStats = () => {
    switch (currentMode) {
      case 'INFRASTRUCTURE':
        return {
          icon: Activity,
          label: 'System Status',
          items: [
            { label: 'Active Satellites', value: counts.active.toLocaleString() },
            { label: 'Space Stations', value: counts.stations.toLocaleString() },
          ],
          color: 'cyan',
          glow: 'liquid-glow-cyan'
        };
      case 'THREAT':
        return {
          icon: ShieldAlert,
          label: 'Threat Level',
          items: [
            { label: 'Tracked Debris', value: counts.debris.toLocaleString() },
            { label: 'Collision Risks', value: 'Low' },
          ],
          color: 'red',
          glow: 'liquid-glow-red'
        };
      case 'LAUNCH':
        return {
          icon: Rocket,
          label: 'Launch Command',
          items: [
            { label: 'Next Launch', value: 'T-04:30:00' },
            { label: 'Vehicle', value: 'Falcon 9' },
          ],
          color: 'yellow',
          glow: 'liquid-glow-yellow'
        };
      default:
        return null;
    }
  };

  const stats = getStats();
  if (!stats) return null;

  const Icon = stats.icon;

  const colorClasses = {
    cyan: 'text-cyan-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
  };

  const bgClasses = {
    cyan: 'bg-cyan-500/20',
    red: 'bg-red-500/20',
    yellow: 'bg-yellow-500/20',
    purple: 'bg-purple-500/20',
  };

  return (
    <div className={cn(
      "absolute top-4 right-4 z-30",
      "hidden lg:block",
      "liquid-glass rounded-xl",
      "p-4",
      "min-w-[200px]",
      "animate-slide-in-right",
      stats.glow
    )} style={{ animationDelay: '0.2s' }}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      
      <div className="relative flex items-center gap-2.5 mb-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center",
          bgClasses[stats.color as keyof typeof bgClasses]
        )}>
          <Icon className={cn("w-[18px] h-[18px]", colorClasses[stats.color as keyof typeof colorClasses])} />
        </div>
        <span className={cn(
          "text-xs font-bold uppercase tracking-wider",
          colorClasses[stats.color as keyof typeof colorClasses]
        )}>
          {stats.label}
        </span>
      </div>
      
      <div className="relative space-y-2.5">
        {stats.items.map((item, index) => (
          <div 
            key={index} 
            className="flex justify-between items-end opacity-0 animate-slide-in-right min-h-[24px]"
            style={{ animationFillMode: 'forwards', animationDelay: `${0.3 + index * 0.1}s` }}
          >
            <span className="text-white/50 text-xs font-medium">{item.label}</span>
            <span className="text-white font-mono font-semibold text-sm">{item.value}</span>
          </div>
        ))}
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
