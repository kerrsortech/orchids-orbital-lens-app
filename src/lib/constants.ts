export const API_ENDPOINTS = {
  ACTIVE: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json',
  VISUAL: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=json',
  STARLINK: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',
  STATIONS: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json',
  DEBRIS: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=json',
} as const;

export const SATELLITE_COLORS = {
  active: [34, 197, 94] as [number, number, number],
  debris: [239, 68, 68] as [number, number, number],
  starlink: [59, 130, 246] as [number, number, number],
  station: [168, 85, 247] as [number, number, number],
  rocket_body: [249, 115, 22] as [number, number, number],
  reentry: [251, 191, 36] as [number, number, number],
} as const;

export const EARTH_RADIUS_KM = 6371;

export const ALTITUDE_SCALE = 0.00001;

export const REENTRY_ALTITUDE_KM = 180;

export const COUNTRY_CODES: Record<string, string> = {
  US: 'United States',
  CIS: 'Commonwealth of Independent States',
  PRC: 'China',
  SES: 'SES (Luxembourg)',
  FR: 'France',
  JP: 'Japan',
  IN: 'India',
  UK: 'United Kingdom',
  DE: 'Germany',
  IT: 'Italy',
  CA: 'Canada',
  AU: 'Australia',
  BR: 'Brazil',
  ESA: 'European Space Agency',
  AB: 'Arab Satellite Communications Organization',
  ARGN: 'Argentina',
  CHLE: 'Chile',
  IM: 'Isle of Man',
  INDO: 'Indonesia',
  ISRA: 'Israel',
  ITSO: 'ITSO',
  KOR: 'South Korea',
  LUXE: 'Luxembourg',
  MALA: 'Malaysia',
  NETH: 'Netherlands',
  NICO: 'New ICO',
  TURK: 'Turkey',
  UAE: 'United Arab Emirates',
};

export const KNOWN_STATIONS = [
  'ISS',
  'ZARYA',
  'TIANGONG',
  'CSS',
];

export const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};
