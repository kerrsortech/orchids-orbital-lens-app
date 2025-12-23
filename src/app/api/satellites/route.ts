import { NextResponse } from 'next/server';

const API_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

const satelliteCache = new Map<string, { data: unknown[]; timestamp: number }>();
const CACHE_DURATION = 3600000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group') || 'visual';
  
  const cached = satelliteCache.get(group);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'HIT',
      },
    });
  }
  
  const endpoint = `${API_BASE}?GROUP=${group}&FORMAT=json`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'OrbitalLens/1.0 (Satellite Tracking Application; educational)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`CelesTrak rate limited for group: ${group}`);
        if (cached) {
          return NextResponse.json(cached.data, {
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
              'X-Cache': 'STALE',
            },
          });
        }
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'no-cache',
            'X-Error': 'rate-limited',
          },
        });
      }
      throw new Error(`CelesTrak API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      satelliteCache.set(group, { data, timestamp: Date.now() });
    }
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Fetch timeout for group: ${group}`);
    } else {
      console.error('Failed to fetch satellite data:', error);
    }
    
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'STALE',
        },
      });
    }
    
    return NextResponse.json([], {
      headers: {
        'Cache-Control': 'no-cache',
        'X-Error': 'fetch-failed',
      },
    });
  }
}
