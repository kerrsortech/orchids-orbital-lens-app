export interface CelesTrakSatellite {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  TLE_LINE0?: string;
  TLE_LINE1?: string;
  TLE_LINE2?: string;
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

export interface ProcessedSatellite {
  id: number;
  name: string;
  objectId: string;
  position: SatellitePosition;
  type: SatelliteType;
  country: string;
  isReentry: boolean;
  raw: CelesTrakSatellite;
}

export type SatelliteType = 'active' | 'debris' | 'starlink' | 'station' | 'rocket_body';

export type MissionMode = 'INFRASTRUCTURE' | 'THREAT' | 'LAUNCH' | 'SPACE';

export interface FilterState {
  showStarlink: boolean;
  showDebris: boolean;
  showStations: boolean;
  showActive: boolean;
  reentryWatch: boolean;
  searchQuery: string;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  [key: string]: unknown;
}