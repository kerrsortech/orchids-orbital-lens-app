'use client';

import { useMission } from '@/context/MissionContext';
import { Satellite, Shield, Rocket, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MissionDock() {
  const { currentMode, setMissionMode } = useMission();

  const modes = [
    { id: 'INFRASTRUCTURE', icon: Satellite, label: 'Satellite', color: 'cyan', gradient: 'from-cyan-400 to-blue-500' },
    { id: 'THREAT', icon: Shield, label: 'Threat', color: 'red', gradient: 'from-red-400 to-orange-500' },
    { id: 'LAUNCH', icon: Rocket, label: 'Launch', color: 'yellow', gradient: 'from-yellow-400 to-orange-500' },
    { id: 'SPACE', icon: Orbit, label: 'Explore', color: 'orange', gradient: 'from-orange-400 to-red-500' },
  ] as const;

  return (
    <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-[calc(100%-32px)] sm:w-auto max-w-[400px]">
      <div className="liquid-glass-intense rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-1 sm:p-1.5 flex items-center justify-between sm:justify-start gap-0.5 sm:gap-1">
        <div className="absolute inset-0 rounded-[20px] sm:rounded-[24px] md:rounded-[28px] bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.05] pointer-events-none" />
        
        {modes.map((mode, index) => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <button
              key={mode.id}
              onClick={() => setMissionMode(mode.id)}
              className={cn(
                "relative group flex flex-col items-center justify-center",
                "w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] md:w-[88px] md:h-[88px]",
                "min-w-[44px] min-h-[44px]",
                "rounded-[16px] sm:rounded-[20px] md:rounded-[22px]",
                "transition-all duration-400 ease-out overflow-hidden",
                "active:scale-95",
                isActive 
                  ? "scale-[1.02] sm:scale-105" 
                  : "hover:scale-[1.02] hover:bg-white/[0.05]"
              )}
              style={{ 
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                animationDelay: `${index * 0.05}s`
              }}
            >
              {isActive && (
                <>
                  <div className={cn(
                    "absolute inset-0 opacity-20 blur-xl transition-opacity duration-500",
                    `bg-gradient-to-br ${mode.gradient}`
                  )} />
                  <div className="absolute inset-0 liquid-glass rounded-[16px] sm:rounded-[20px] md:rounded-[22px]" style={{ boxShadow: 'none' }} />
                  <div className={cn(
                    "absolute inset-[1px] rounded-[15px] sm:rounded-[19px] md:rounded-[21px] opacity-15",
                    `bg-gradient-to-b ${mode.gradient}`
                  )} />
                </>
              )}
              
              <div className={cn(
                "relative z-10 flex items-center justify-center mb-1 sm:mb-1.5 transition-all duration-300",
                "w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11",
                "rounded-xl sm:rounded-2xl",
                isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/[0.05]'
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300",
                    "w-4 h-4 sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]",
                    isActive 
                      ? `text-${mode.color}-400` 
                      : "text-white/40 group-hover:text-white/70"
                  )}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px var(--liquid-${mode.color}))` : 'none'
                  }}
                />
              </div>
              
              <span className={cn(
                "relative z-10 font-semibold tracking-wide transition-all duration-300",
                "text-[9px] sm:text-[10px] md:text-[11px]",
                isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
              )}>
                {mode.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-0.5 sm:-bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <div 
                    className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: `var(--liquid-${mode.color})` }} 
                  />
                </div>
              )}
              
              <div className={cn(
                "absolute inset-0 rounded-[16px] sm:rounded-[20px] md:rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                "bg-gradient-to-t from-white/[0.02] to-transparent"
              )} />
            </button>
          );
        })}
      </div>
      
      <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-t from-black/20 to-transparent -z-10 blur-xl" />
    </div>
  );
}