'use client';

import { useMission } from '@/context/MissionContext';
import { Satellite, Shield, Rocket, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MissionDock({ className }: { className?: string }) {
  const { currentMode, setMissionMode } = useMission();

  const modes = [
    { id: 'INFRASTRUCTURE', icon: Satellite, label: 'Satellite', color: 'cyan', gradient: 'from-cyan-400 to-blue-500' },
    { id: 'THREAT', icon: Shield, label: 'Threat', color: 'red', gradient: 'from-red-400 to-orange-500' },
    { id: 'LAUNCH', icon: Rocket, label: 'Launch', color: 'yellow', gradient: 'from-yellow-400 to-orange-500' },
    { id: 'SPACE', icon: Orbit, label: 'Explore', color: 'orange', gradient: 'from-orange-400 to-red-500' },
  ] as const;

  return (
    <div className={cn(
      "w-full max-w-[400px] lg:max-w-none", // Default width cap, but responsive (removed limit on desktop)
      className
    )}>
      <div className="liquid-glass-intense rounded-[20px] sm:rounded-[24px] md:rounded-[28px] p-1 sm:p-1.5 flex items-center justify-between gap-1 w-full lg:w-auto lg:gap-2"> {/* Added lg:w-auto and lg:gap-2 */}
        <div className="absolute inset-0 rounded-[20px] sm:rounded-[24px] md:rounded-[28px] bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.05] pointer-events-none" />
        
        {modes.map((mode, index) => {
          const isActive = currentMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <button
              key={mode.id}
              onClick={() => setMissionMode(mode.id)}
              className={cn(
                "relative group flex flex-col items-center justify-center flex-1 lg:flex-none", // Flex-1 on mobile, fixed on desktop
                "h-[64px] sm:h-[72px] lg:w-[100px] lg:h-[100px]", // Restored larger desktop dimensions (square)
                "min-w-0", // Allow shrinking if needed, preventing overflow
                "rounded-[16px] sm:rounded-[20px] md:rounded-[22px]",
                "transition-all duration-200 ease-out overflow-hidden",
                isActive 
                  ? "" 
                  : "hover:bg-white/[0.05]"
              )}
              style={{ 
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
                "relative z-10 flex items-center justify-center mb-1 lg:mb-2 transition-all duration-300",
                "w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10", // Adjusted icon size for desktop
                "rounded-xl sm:rounded-2xl",
                isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/[0.05]'
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300",
                    "w-4 h-4 lg:w-6 lg:h-6", // Larger icon on desktop
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
                "relative z-10 font-semibold tracking-wide transition-all duration-300 truncate w-full text-center px-1",
                "text-[10px] lg:text-xs", // Larger text on desktop
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
      
      <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-t from-black/20 to-transparent -z-10 blur-xl pointer-events-none" />
    </div>
  );
}