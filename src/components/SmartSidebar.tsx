'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { FilterState } from '@/types/satellite.d';
import { cn } from '@/lib/utils';
import { SidebarControls } from './SidebarControls';

interface SmartSidebarProps {
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
}

export function SmartSidebar({ filters, onFilterChange, satelliteCounts, isLoading, onSearchSatellite }: SmartSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "fixed left-4 top-1/2 -translate-y-1/2 z-50 liquid-glass min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 lg:hidden",
          !isCollapsed && "left-[calc(100%-60px)] sm:left-[296px]"
        )}
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5 text-white/60" /> : <ChevronLeft className="w-5 h-5 text-white/60" />}
      </button>

      <div className={cn(
        "fixed lg:absolute left-0 lg:left-4 top-0 lg:top-4 bottom-0 lg:bottom-28",
        "w-full sm:w-80 lg:w-80",
        "liquid-glass lg:rounded-3xl flex flex-col z-40 overflow-hidden animate-slide-in-right",
        "transition-transform duration-500 ease-out",
        isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
      )}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <SidebarControls 
            filters={filters}
            onFilterChange={onFilterChange}
            satelliteCounts={satelliteCounts}
            isLoading={isLoading}
            onSearchSatellite={onSearchSatellite}
            className="h-full"
        />
      </div>
    </>
  );
}