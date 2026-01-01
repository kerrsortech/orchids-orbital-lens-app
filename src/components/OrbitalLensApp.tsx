'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { CelesTrakSatellite, FilterState, ProcessedSatellite } from '@/types/satellite.d';
import { processSatellites, processSatellitesBatched } from '@/lib/satellite-utils';
import { SmartSidebar } from '@/components/SmartSidebar';
import { SidebarControls } from '@/components/SidebarControls';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileMenu } from '@/components/MobileMenu';
import { SatelliteCard } from '@/components/SatelliteCard';
import { SatelliteCardContent } from '@/components/SatelliteCardContent';
import { MissionDock } from '@/components/MissionDock';
import { QuickStats } from '@/components/QuickStats';
import { MissionProvider, useMission } from '@/context/MissionContext';
import { useViewportHeight } from '@/hooks/use-viewport-height';

const Globe3D = dynamic(
  () => import('@/components/globe/Globe3D').then(mod => ({ default: mod.Globe3D })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050510] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl liquid-glass-intense flex items-center justify-center mx-auto mb-3 sm:mb-4 liquid-glow-cyan animate-pulse">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-cyan-400/50 border-t-cyan-400 rounded-full animate-spin" />
          </div>
          <p className="text-cyan-400/80 font-medium text-xs sm:text-sm tracking-wide">Initializing orbital tracking...</p>
        </div>
      </div>
    )
  }
);

const SolarSystem3D = dynamic(
  () => import('@/components/SolarSystem3D').then(mod => ({ default: mod.SolarSystem3D })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl liquid-glass-intense flex items-center justify-center mx-auto mb-3 sm:mb-4 liquid-glow-yellow animate-pulse">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 border-2 border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
          </div>
          <p className="text-orange-400/80 font-medium text-xs sm:text-sm tracking-wide">Loading Solar System...</p>
        </div>
      </div>
    )
  }
);

const DEFAULT_FILTERS: FilterState = {
  showStarlink: true,
  showDebris: true,
  showStations: true,
  showActive: true,
  reentryWatch: false,
  searchQuery: '',
};

const POSITION_UPDATE_INTERVAL = 60000;
const INITIAL_BATCH_SIZE = 100;

function OrbitalLensContent() {
  const { currentMode } = useMission();
  const [rawSatellites, setRawSatellites] = useState<CelesTrakSatellite[]>([]);
  const [satellites, setSatellites] = useState<ProcessedSatellite[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedSatellite, setSelectedSatellite] = useState<ProcessedSatellite | null>(null);
  const [highlightedSatelliteId, setHighlightedSatelliteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const viewportHeight = useViewportHeight();
  
  const selectedSatelliteRef = useRef<ProcessedSatellite | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    selectedSatelliteRef.current = selectedSatellite;
  }, [selectedSatellite]);

  useEffect(() => {
    async function fetchSatellites() {
      setIsLoading(true);
      setError(null);
      
      try {
        const groups = ['visual', 'starlink', 'stations', 'active'];
        const results = await Promise.all(
          groups.map(group => 
            fetch(`/api/satellites?group=${group}`)
              .then(res => {
                if (!res.ok) return [];
                return res.json();
              })
              .catch(() => [])
          )
        );
        
        const allSatellites = results.flat().filter((s: CelesTrakSatellite | null) => s && s.NORAD_CAT_ID);
        const uniqueSatellites = Array.from(
          new Map(allSatellites.map((s: CelesTrakSatellite) => [s.NORAD_CAT_ID, s])).values()
        ) as CelesTrakSatellite[];
        
        setRawSatellites(uniqueSatellites);
      } catch (err) {
        console.error('Failed to fetch satellites:', err);
        setError('Failed to load satellite data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSatellites();
  }, []);

  useEffect(() => {
    if (rawSatellites.length === 0 || processingRef.current) return;
    processingRef.current = true;
    
    const now = new Date();
    
    const initialBatch = rawSatellites.slice(0, INITIAL_BATCH_SIZE);
    const initialProcessed = processSatellites(initialBatch, now);
    setSatellites(initialProcessed);
    
    requestAnimationFrame(() => {
      processSatellitesBatched(rawSatellites, now, 200, (batch, isComplete) => {
        setSatellites(batch);
        if (isComplete) {
          processingRef.current = false;
        }
      });
    });
    
    const interval = setInterval(() => {
      const updated = processSatellites(rawSatellites, new Date());
      setSatellites(prev => {
        const prevMap = new Map(prev.map(s => [s.id, s]));
        return updated.map(sat => {
          const prevSat = prevMap.get(sat.id);
          if (prevSat) {
            return { ...sat, _prevPosition: prevSat.position };
          }
          return sat;
        });
      });
      
      const currentSelected = selectedSatelliteRef.current;
      if (currentSelected) {
        const updatedSelected = updated.find(s => s.id === currentSelected.id);
        if (updatedSelected) setSelectedSatellite(updatedSelected);
      }
    }, POSITION_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [rawSatellites]);

  const satelliteCounts = useMemo(() => {
    return {
      total: satellites.length,
      active: satellites.filter(s => s.type === 'active').length,
      starlink: satellites.filter(s => s.type === 'starlink').length,
      debris: satellites.filter(s => s.type === 'debris' || s.type === 'rocket_body').length,
      stations: satellites.filter(s => s.type === 'station').length,
      reentry: satellites.filter(s => s.isReentry).length,
    };
  }, [satellites]);

  const handleSatelliteClick = useCallback((satellite: ProcessedSatellite | null) => {
    setSelectedSatellite(satellite);
  }, []);

  const handleSearchSatellite = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    const found = satellites.find(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.id.toString() === query
    );
    if (found) {
      setHighlightedSatelliteId(found.id);
      setTimeout(() => setHighlightedSatelliteId(null), 5000);
    }
  }, [satellites]);

  const isSpaceMode = currentMode === 'SPACE';

  return (
    <div 
      className="w-screen overflow-hidden bg-[#050510] flex flex-col relative"
      style={{ height: viewportHeight }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/10 via-transparent to-purple-950/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Mobile Navbar */}
      <MobileNavbar 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        isMenuOpen={isMobileMenuOpen} 
      />

      {/* Mobile Sidebar Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        satelliteCounts={satelliteCounts}
        isLoading={isLoading}
        onSearchSatellite={handleSearchSatellite}
      />
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      {!isSpaceMode && (
        <div className="hidden lg:block">
          <SmartSidebar
            filters={filters}
            onFilterChange={setFilters}
            satelliteCounts={satelliteCounts}
            isLoading={isLoading}
            onSearchSatellite={handleSearchSatellite}
          />
        </div>
      )}
      
      <div className="flex-1 relative w-full min-h-0">
        {!isSpaceMode && <QuickStats counts={satelliteCounts} />}
        
        {isSpaceMode ? (
          <SolarSystem3D />
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center liquid-glass rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 max-w-[calc(100%-32px)] sm:max-w-sm">
              <p className="text-red-400 mb-3 sm:mb-4 font-medium text-sm sm:text-base">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="liquid-button min-h-[44px] px-5 sm:px-6 py-3 text-cyan-400 hover:text-white font-medium transition-colors active:scale-95"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <Globe3D
            satellites={satellites}
            filters={filters}
            onSatelliteClick={handleSatelliteClick}
            selectedSatellite={selectedSatellite}
            mode={currentMode}
            highlightedSatelliteId={highlightedSatelliteId}
          />
        )}
        
        {selectedSatellite && !isSpaceMode && (
          <SatelliteCard
            satellite={selectedSatellite}
            onClose={() => setSelectedSatellite(null)}
          />
        )}

        {/* Desktop Mission Dock (Absolute) */}
        <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <MissionDock />
        </div>
      </div>

      {/* Mobile Bottom Panel - Fixed Height Block */}
      {!isSpaceMode && (
        <div className="lg:hidden h-[40%] flex-none flex flex-col bg-[#050510] relative z-30 border-t border-white/10 shadow-2xl">
          <div className="flex-1 overflow-y-auto glass-scrollbar relative pb-24">
            {selectedSatellite ? (
              <SatelliteCardContent 
                satellite={selectedSatellite} 
                onClose={() => setSelectedSatellite(null)} 
                className="h-full"
              />
            ) : (
              <SidebarControls
                filters={filters}
                onFilterChange={setFilters}
                satelliteCounts={satelliteCounts}
                isLoading={isLoading}
                onSearchSatellite={handleSearchSatellite}
                className="h-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Mission Dock (Fixed Bottom Tab Bar) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 p-2 pb-4 shadow-2xl">
        <MissionDock />
      </div>
    </div>
  );
}

export function OrbitalLensApp() {
  return (
    <MissionProvider>
      <OrbitalLensContent />
    </MissionProvider>
  );
}