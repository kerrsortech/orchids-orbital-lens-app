'use client';

import { useEffect } from 'react';
import { SidebarControls } from './SidebarControls';
import type { FilterState } from '@/types/satellite.d';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSearchSatellite: (query: string) => void;
}

export function MobileMenu({ 
  isOpen, 
  onClose,
  filters,
  onFilterChange,
  satelliteCounts,
  isLoading,
  onSearchSatellite
}: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-40 lg:hidden transition-all duration-300",
        isOpen ? "visible" : "invisible pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Menu Content */}
      <div 
        className={cn(
          "absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-[#050510] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col pt-20",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <SidebarControls
          filters={filters}
          onFilterChange={onFilterChange}
          satelliteCounts={satelliteCounts}
          isLoading={isLoading}
          onSearchSatellite={(query) => {
            onSearchSatellite(query);
            onClose(); // Close menu on search
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}