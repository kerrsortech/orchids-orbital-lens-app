'use client';

import { Search, Satellite, Trash2, Building, Radio, AlertTriangle, Rocket, MapPin } from 'lucide-react';
import type { FilterState } from '@/types/satellite.d';
import { useMission } from '@/context/MissionContext';
import { cn } from '@/lib/utils';

interface SidebarControlsProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  satelliteCounts: {
    total: number;
    active: number;
    starlink: number;
    debris: number;
    stations: number;
    reentry: number;
  };
  isLoading: boolean;
  onSearchSatellite?: (query: string) => void;
  className?: string;
}

export function SidebarControls({ filters, onFilterChange, satelliteCounts, isLoading, onSearchSatellite, className }: SidebarControlsProps) {
  const { currentMode } = useMission();

  const updateFilter = (key: keyof FilterState, value: boolean | string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSatellite && filters.searchQuery.trim()) {
      onSearchSatellite(filters.searchQuery.trim());
    }
  };

  const getSidebarContent = () => {
    switch (currentMode) {
      case 'INFRASTRUCTURE':
        return (
          <>
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs uppercase tracking-wider mb-4 sm:mb-5 font-semibold opacity-0 animate-slide-in-right stagger-1" style={{ animationFillMode: 'forwards' }}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl liquid-glass-subtle flex items-center justify-center">
                <Satellite className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              </div>
              <span className="text-gradient-cyan">Network Controls</span>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <FilterToggle
                icon={<Satellite className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                label="Active Satellites"
                count={satelliteCounts.active}
                checked={filters.showActive}
                onChange={(v) => updateFilter('showActive', v)}
                color="green"
                delay={1}
              />

              <FilterToggle
                icon={<Radio className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                label="Starlink Constellation"
                count={satelliteCounts.starlink}
                checked={filters.showStarlink}
                onChange={(v) => updateFilter('showStarlink', v)}
                color="cyan"
                delay={2}
              />

              <FilterToggle
                icon={<Building className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                label="Space Stations"
                count={satelliteCounts.stations}
                checked={filters.showStations}
                onChange={(v) => updateFilter('showStations', v)}
                color="purple"
                delay={3}
              />
            </div>
          </>
        );

      case 'THREAT':
        return (
          <>
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs uppercase tracking-wider mb-4 sm:mb-5 font-semibold opacity-0 animate-slide-in-right stagger-1" style={{ animationFillMode: 'forwards' }}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl liquid-glass-subtle flex items-center justify-center liquid-glow-red" style={{ boxShadow: '0 0 15px rgba(255,100,100,0.2)' }}>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              </div>
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">Risk Assessment</span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <FilterToggle
                icon={<Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                label="Space Debris"
                count={satelliteCounts.debris}
                checked={filters.showDebris}
                onChange={(v) => updateFilter('showDebris', v)}
                color="red"
                delay={1}
              />

              <FilterToggle
                icon={<AlertTriangle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />}
                label="Re-entry Watch"
                count={satelliteCounts.reentry}
                checked={filters.reentryWatch}
                onChange={(v) => updateFilter('reentryWatch', v)}
                color="yellow"
                warning
                delay={2}
              />
            </div>

            <div className="mt-5 sm:mt-6 opacity-0 animate-slide-up stagger-3" style={{ animationFillMode: 'forwards' }}>
              <p className="text-[10px] sm:text-xs text-white/40 mb-3 sm:mb-4 uppercase tracking-wider font-semibold">Closest Approaches</p>
              <div className="space-y-2 sm:space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="liquid-card flex items-center justify-between p-3.5 sm:p-4 group hover:liquid-glow-red transition-all duration-300 min-h-[44px]" style={{ boxShadow: 'none' }}>
                    <span className="text-xs sm:text-sm text-red-200/80 font-medium">Obj-{202400 + i}</span>
                    <span className="text-xs sm:text-sm text-red-400 font-mono font-semibold">{(i * 142).toFixed(1)}km</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'LAUNCH':
        return (
          <>
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs uppercase tracking-wider mb-4 sm:mb-5 font-semibold opacity-0 animate-slide-in-right stagger-1" style={{ animationFillMode: 'forwards' }}>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl liquid-glass-subtle flex items-center justify-center liquid-glow-yellow" style={{ boxShadow: '0 0 15px rgba(255,200,100,0.2)' }}>
                <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              </div>
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Mission Control</span>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
               <div className="liquid-card p-4 sm:p-5 liquid-glow-yellow opacity-0 animate-slide-up stagger-2" style={{ animationFillMode: 'forwards', boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(255,200,100,0.15)' }}>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                     <span className="text-[10px] sm:text-xs text-yellow-500 font-bold">NEXT LAUNCH</span>
                     <span className="text-[10px] sm:text-xs text-yellow-200 bg-yellow-500/20 px-2.5 py-1.5 rounded-lg font-mono font-medium">T-04:30:00</span>
                  </div>
                  <p className="text-sm sm:text-base text-white font-semibold">Starlink Group 6-54</p>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/50 mt-2.5 sm:mt-3">
                     <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                     <span>KSC, LC-39A</span>
                  </div>
               </div>

               <div className="liquid-card p-4 sm:p-5 opacity-0 animate-slide-up stagger-3" style={{ animationFillMode: 'forwards' }}>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                     <span className="text-[10px] sm:text-xs text-white/40 font-bold">TOMORROW</span>
                     <span className="text-[10px] sm:text-xs text-white/40 font-mono">14:00 UTC</span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 font-medium">Soyuz MS-25</p>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 mt-2.5 sm:mt-3">
                     <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                     <span>Baikonur</span>
                  </div>
               </div>
               
               <div className="mt-5 sm:mt-6 opacity-0 animate-slide-up stagger-4" style={{ animationFillMode: 'forwards' }}>
                 <p className="text-[10px] sm:text-xs text-white/40 mb-3 sm:mb-4 uppercase tracking-wider font-semibold">Agencies</p>
                 <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                    {['SpaceX', 'NASA', 'ESA', 'ISRO'].map((agency) => (
                      <button 
                        key={agency} 
                        className="liquid-button min-h-[44px] p-3 sm:p-3.5 text-center text-xs sm:text-sm text-white/70 hover:text-white font-medium transition-all duration-300 active:scale-95"
                      >
                        {agency}
                      </button>
                    ))}
                 </div>
               </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
        <form onSubmit={handleSearch} className="relative p-4 sm:p-5 border-b border-white/[0.06]">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-[18px] sm:h-[18px] text-white/30 group-focus-within:text-cyan-400 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search satellite name or ID..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full liquid-input pl-11 sm:pl-12 pr-4 py-3.5 sm:py-4 text-sm sm:text-base text-white placeholder:text-white/30 font-medium min-h-[44px]"
            />
          </div>
          {filters.searchQuery && (
            <p className="text-[10px] text-cyan-400/60 mt-2 px-1">Press Enter to highlight satellite on globe</p>
          )}
        </form>

        <div className="relative flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 glass-scrollbar">
          {getSidebarContent()}
        </div>

        <div className="relative p-4 sm:p-5 border-t border-white/[0.06]">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Total Objects" value={satelliteCounts.total} isLoading={isLoading} />
            <StatCard label="Visible" value={
                currentMode === 'INFRASTRUCTURE' ? satelliteCounts.active + satelliteCounts.stations :
                currentMode === 'THREAT' ? satelliteCounts.debris :
                0
            } isLoading={isLoading} />
          </div>
        </div>
    </div>
  );
}

interface FilterToggleProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  checked: boolean;
  onChange: (value: boolean) => void;
  color: 'green' | 'cyan' | 'purple' | 'red' | 'yellow';
  warning?: boolean;
  delay?: number;
}

function FilterToggle({ icon, label, count, checked, onChange, color, warning, delay = 0 }: FilterToggleProps) {
  const glowClasses = {
    green: 'liquid-glow-green',
    cyan: 'liquid-glow-cyan',
    purple: 'liquid-glow-purple',
    red: 'liquid-glow-red',
    yellow: 'liquid-glow-yellow',
  };

  const iconColors = {
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400',
  };

  const bgColors = {
    green: 'bg-green-500/20',
    cyan: 'bg-cyan-500/20',
    purple: 'bg-purple-500/20',
    red: 'bg-red-500/20',
    yellow: 'bg-yellow-500/20',
  };

  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 opacity-0 animate-slide-in-right min-h-[56px] sm:min-h-[64px] active:scale-[0.98]",
        checked 
          ? `liquid-card ${glowClasses[color]}`
          : 'liquid-glass-subtle hover:bg-white/[0.04]',
        warning && checked ? 'animate-pulse-glow' : ''
      )}
      style={{ 
        animationFillMode: 'forwards',
        animationDelay: `${delay * 0.05}s`,
        boxShadow: checked ? undefined : 'none'
      }}
    >
      <div className={cn(
        "w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0",
        checked ? bgColors[color] : 'bg-white/[0.05]'
      )}>
        <span className={checked ? iconColors[color] : 'text-white/50'}>{icon}</span>
      </div>
      <span className={cn(
        "flex-1 text-left text-sm sm:text-base font-medium transition-colors duration-300",
        checked ? 'text-white' : 'text-white/60'
      )}>
        {label}
      </span>
      <span className={cn(
        "text-xs sm:text-sm font-mono px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300",
        checked ? `${bgColors[color]} ${iconColors[color]}` : 'bg-white/[0.05] text-white/40'
      )}>
        {count.toLocaleString()}
      </span>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  isLoading: boolean;
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="liquid-card p-3.5 sm:p-4">
      <p className="text-[10px] sm:text-xs text-white/40 mb-1.5 sm:mb-2 font-medium">{label}</p>
      {isLoading ? (
        <div className="h-6 sm:h-7 w-16 sm:w-20 bg-white/10 animate-shimmer rounded-lg" />
      ) : (
        <p className="text-base sm:text-lg lg:text-xl font-bold font-mono text-gradient-cyan">{value.toLocaleString()}</p>
      )}
    </div>
  );
}