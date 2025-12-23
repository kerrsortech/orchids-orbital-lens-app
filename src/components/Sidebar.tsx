'use client';

import { Search, Satellite, Trash2, Building, Radio, AlertTriangle, Filter } from 'lucide-react';
import type { FilterState } from '@/types/satellite.d';

interface SidebarProps {
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
}

export function Sidebar({ filters, onFilterChange, satelliteCounts, isLoading }: SidebarProps) {
  const updateFilter = (key: keyof FilterState, value: boolean | string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-80 h-full bg-slate-950/90 backdrop-blur-xl border-r border-cyan-500/20 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-cyan-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Satellite className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              OrbitalLens
            </h1>
            <p className="text-xs text-slate-500">Real-Time Space Tracker</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-cyan-500/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search satellites..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full bg-slate-900/50 border border-cyan-500/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-3">
          <Filter className="w-3 h-3" />
          Quick Filters
        </div>

        <FilterToggle
          icon={<Satellite className="w-4 h-4" />}
          label="Active Satellites"
          count={satelliteCounts.active}
          checked={filters.showActive}
          onChange={(v) => updateFilter('showActive', v)}
          color="green"
        />

        <FilterToggle
          icon={<Radio className="w-4 h-4" />}
          label="Starlink"
          count={satelliteCounts.starlink}
          checked={filters.showStarlink}
          onChange={(v) => updateFilter('showStarlink', v)}
          color="blue"
        />

        <FilterToggle
          icon={<Building className="w-4 h-4" />}
          label="Space Stations"
          count={satelliteCounts.stations}
          checked={filters.showStations}
          onChange={(v) => updateFilter('showStations', v)}
          color="purple"
        />

        <FilterToggle
          icon={<Trash2 className="w-4 h-4" />}
          label="Debris & Junk"
          count={satelliteCounts.debris}
          checked={filters.showDebris}
          onChange={(v) => updateFilter('showDebris', v)}
          color="red"
        />

        <div className="pt-3 mt-3 border-t border-cyan-500/10">
          <FilterToggle
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Re-entry Watch"
            count={satelliteCounts.reentry}
            checked={filters.reentryWatch}
            onChange={(v) => updateFilter('reentryWatch', v)}
            color="yellow"
            warning
          />
        </div>
      </div>

      <div className="p-4 border-t border-cyan-500/20 bg-slate-950/50">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Objects" value={satelliteCounts.total} isLoading={isLoading} />
          <StatCard label="Active" value={satelliteCounts.active} isLoading={isLoading} />
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
  color: 'green' | 'blue' | 'purple' | 'red' | 'yellow';
  warning?: boolean;
}

function FilterToggle({ icon, label, count, checked, onChange, color, warning }: FilterToggleProps) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
        checked 
          ? colorClasses[color]
          : 'bg-slate-900/30 text-slate-500 border-slate-800 hover:border-slate-700'
      } ${warning && checked ? 'animate-pulse' : ''}`}
    >
      <div className={checked ? '' : 'opacity-50'}>{icon}</div>
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
        checked ? 'bg-white/10' : 'bg-slate-800'
      }`}>
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
    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {isLoading ? (
        <div className="h-6 w-16 bg-slate-800 animate-pulse rounded" />
      ) : (
        <p className="text-lg font-bold font-mono text-cyan-400">{value.toLocaleString()}</p>
      )}
    </div>
  );
}
