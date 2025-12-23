'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { MissionMode } from '@/types/satellite.d';

interface MissionContextType {
  currentMode: MissionMode;
  setMissionMode: (mode: MissionMode) => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<MissionMode>('INFRASTRUCTURE');

  return (
    <MissionContext.Provider value={{ currentMode, setMissionMode: setCurrentMode }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  const context = useContext(MissionContext);
  if (context === undefined) {
    throw new Error('useMission must be used within a MissionProvider');
  }
  return context;
}
