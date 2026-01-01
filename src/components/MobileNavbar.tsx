'use client';

import { Satellite, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function MobileNavbar({ onMenuToggle, isMenuOpen }: MobileNavbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between lg:hidden pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 liquid-glass px-4 py-2.5 rounded-xl">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg liquid-glass-intense flex items-center justify-center liquid-glow-cyan animate-pulse">
            <Satellite className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold text-gradient-cyan tracking-tight leading-none">
            OrbitalLens
          </h1>
          <p className="text-[10px] text-white/40 font-medium leading-none mt-1">Mission Control</p>
        </div>
      </div>

      <button
        onClick={onMenuToggle}
        className="pointer-events-auto w-11 h-11 liquid-glass rounded-xl flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-95"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </div>
  );
}