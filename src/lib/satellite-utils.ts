import * as satellite from 'satellite.js';
import type { CelesTrakSatellite, ProcessedSatellite, SatellitePosition, SatelliteType } from '@/types/satellite.d';
import { COUNTRY_CODES, KNOWN_STATIONS, REENTRY_ALTITUDE_KM } from './constants';

const satrecCache = new Map<number, satellite.SatRec | null>();

export function createSatrec(sat: CelesTrakSatellite): satellite.SatRec | null {
  if (satrecCache.has(sat.NORAD_CAT_ID)) {
    return satrecCache.get(sat.NORAD_CAT_ID)!;
  }
  
  try {
    let satrec: satellite.SatRec | null = null;
    
    if (sat.TLE_LINE1 && sat.TLE_LINE2) {
      satrec = satellite.twoline2satrec(sat.TLE_LINE1, sat.TLE_LINE2);
    } else {
      const { line1, line2 } = generateTLE(sat);
      satrec = satellite.twoline2satrec(line1, line2);
    }
    
    if (satrec && satrec.error !== 0) {
      satrec = null;
    }
    
    satrecCache.set(sat.NORAD_CAT_ID, satrec);
    return satrec;
  } catch (e) {
    satrecCache.set(sat.NORAD_CAT_ID, null);
    return null;
  }
}

function formatExp(val: number): string {
  if (Math.abs(val) < 1e-10) return ' 00000+0';
  const sign = val >= 0 ? ' ' : '-';
  const absVal = Math.abs(val);
  const exp = Math.floor(Math.log10(absVal));
  const mant = absVal / Math.pow(10, exp);
  const mantStr = String(Math.round(mant * 100000)).padStart(5, '0');
  const expSign = exp >= 0 ? '+' : '-';
  return sign + mantStr + expSign + Math.abs(exp);
}

function generateTLE(sat: CelesTrakSatellite): { line1: string; line2: string } {
  const epochDate = new Date(sat.EPOCH);
  const year = epochDate.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const epochDay = 1 + (epochDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000);
  
  const yy = String(year % 100).padStart(2, '0');
  const ddd = epochDay.toFixed(8).padStart(12, '0');
  
  const norad = String(sat.NORAD_CAT_ID).padStart(5, '0');
  
  const idParts = sat.OBJECT_ID.split('-');
  let intlDes = '00000A  ';
  if (idParts.length >= 2) {
    const launchYear = idParts[0].slice(-2);
    const launchNum = idParts[1].slice(0, 3);
    const piece = idParts[1].slice(3) || 'A';
    intlDes = (launchYear + launchNum + piece).padEnd(8, ' ');
  }
  
  const mmDotSign = sat.MEAN_MOTION_DOT >= 0 ? ' ' : '-';
  const mmDotAbs = Math.abs(sat.MEAN_MOTION_DOT);
  const mmDotStr = mmDotSign + '.' + mmDotAbs.toFixed(8).slice(2);
  
  const bstar = formatExp(sat.BSTAR);
  const mmDdot = formatExp(sat.MEAN_MOTION_DDOT);

  // Build line 1 with exact column positions
  // Format: 1 NNNNNC NNNNNAAA YYDDD.DDDDDDDD +.NNNNNNNN +NNNNN-N +NNNNN-N N NNNN
  // Cols:   1234567890123456789012345678901234567890123456789012345678901234567890
  //         0         1         2         3         4         5         6
  let l1 = '1 ';                                    // cols 1-2
  l1 += norad;                                      // cols 3-7
  l1 += sat.CLASSIFICATION_TYPE || 'U';             // col 8
  l1 += ' ';                                        // col 9
  l1 += intlDes;                                    // cols 10-17 (8 chars)
  l1 += ' ';                                        // col 18
  l1 += yy;                                         // cols 19-20
  l1 += ddd;                                        // cols 21-32
  l1 += ' ';                                        // col 33
  l1 += mmDotStr;                                   // cols 34-43
  l1 += ' ';                                        // col 44
  l1 += mmDdot;                                     // cols 45-52
  l1 += ' ';                                        // col 53
  l1 += bstar;                                      // cols 54-61
  l1 += ' ';                                        // col 62
  l1 += sat.EPHEMERIS_TYPE || 0;                    // col 63
  l1 += ' ';                                        // col 64
  l1 += String(sat.ELEMENT_SET_NO || 999).padStart(4, ' '); // cols 65-68
  
  // Ensure exactly 68 chars before checksum
  l1 = l1.padEnd(68, ' ').slice(0, 68);
  
  let sum1 = 0;
  for (let i = 0; i < 68; i++) {
    const c = l1[i];
    if (c >= '0' && c <= '9') sum1 += parseInt(c);
    else if (c === '-') sum1 += 1;
  }
  l1 = l1 + (sum1 % 10);
  
  // Build line 2
  let l2 = '2 ';                                    // cols 1-2
  l2 += norad;                                      // cols 3-7
  l2 += ' ';                                        // col 8
  l2 += sat.INCLINATION.toFixed(4).padStart(8, ' ');// cols 9-16
  l2 += ' ';                                        // col 17
  l2 += sat.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' '); // cols 18-25
  l2 += ' ';                                        // col 26
  l2 += sat.ECCENTRICITY.toFixed(7).slice(2);       // cols 27-33 (no decimal)
  l2 += ' ';                                        // col 34
  l2 += sat.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' '); // cols 35-42
  l2 += ' ';                                        // col 43
  l2 += sat.MEAN_ANOMALY.toFixed(4).padStart(8, ' ');// cols 44-51
  l2 += ' ';                                        // col 52
  l2 += sat.MEAN_MOTION.toFixed(8);                 // cols 53-63
  l2 += String((sat.REV_AT_EPOCH || 0) % 100000).padStart(5, '0'); // cols 64-68
  
  l2 = l2.padEnd(68, ' ').slice(0, 68);
  
  let sum2 = 0;
  for (let i = 0; i < 68; i++) {
    const c = l2[i];
    if (c >= '0' && c <= '9') sum2 += parseInt(c);
    else if (c === '-') sum2 += 1;
  }
  l2 = l2 + (sum2 % 10);
  
  return { line1: l1, line2: l2 };
}

export function propagateSatellite(satrec: satellite.SatRec, date: Date): SatellitePosition | null {
  try {
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    if (!positionAndVelocity || !positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }
    
    if (!positionAndVelocity.velocity || typeof positionAndVelocity.velocity === 'boolean') {
      return null;
    }
    
    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;
    
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    
    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const altitude = positionGd.height;
    
    if (isNaN(latitude) || isNaN(longitude) || isNaN(altitude)) {
      return null;
    }
    
    const velocity = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );
    
    return { latitude, longitude, altitude, velocity };
  } catch {
    return null;
  }
}

export function determineSatelliteType(sat: CelesTrakSatellite): SatelliteType {
  const name = sat.OBJECT_NAME.toUpperCase();
  
  if (name.includes('STARLINK')) return 'starlink';
  if (KNOWN_STATIONS.some(station => name.includes(station))) return 'station';
  if (name.includes('DEB') || name.includes('DEBRIS')) return 'debris';
  if (name.includes('R/B') || name.includes('ROCKET')) return 'rocket_body';
  
  return 'active';
}

export function extractCountry(objectId: string): string {
  const parts = objectId.split('-');
  if (parts.length < 2) return 'Unknown';
  
  for (const [code, name] of Object.entries(COUNTRY_CODES)) {
    if (objectId.includes(code)) return name;
  }
  
  return 'Unknown';
}

export function processSatellite(sat: CelesTrakSatellite, date: Date): ProcessedSatellite | null {
  const satrec = createSatrec(sat);
  if (!satrec) return null;
  
  const position = propagateSatellite(satrec, date);
  if (!position) return null;
  
  return {
    id: sat.NORAD_CAT_ID,
    name: sat.OBJECT_NAME,
    objectId: sat.OBJECT_ID,
    position,
    type: determineSatelliteType(sat),
    country: extractCountry(sat.OBJECT_ID),
    isReentry: position.altitude < REENTRY_ALTITUDE_KM,
    raw: sat,
  };
}

export function processSatellites(satellites: CelesTrakSatellite[], date: Date): ProcessedSatellite[] {
  const processed = satellites
    .map(sat => processSatellite(sat, date))
    .filter((sat): sat is ProcessedSatellite => sat !== null);
  
  return processed;
}

export function processSatellitesBatched(
  satellites: CelesTrakSatellite[],
  date: Date,
  batchSize: number,
  onProgress: (processed: ProcessedSatellite[], isComplete: boolean) => void
): void {
  let processedAll: ProcessedSatellite[] = [];
  let index = 0;
  
  function processNextBatch() {
    const batch = satellites.slice(index, index + batchSize);
    const processedBatch = batch
      .map(sat => processSatellite(sat, date))
      .filter((sat): sat is ProcessedSatellite => sat !== null);
    
    processedAll = [...processedAll, ...processedBatch];
    index += batchSize;
    
    const isComplete = index >= satellites.length;
    onProgress(processedAll, isComplete);
    
    if (!isComplete) {
      requestAnimationFrame(processNextBatch);
    }
  }
  
  processNextBatch();
}
