import * as Astronomy from 'astronomy-engine';

export interface PlanetData {
  name: string;
  x: number;
  y: number;
  z: number;
  distanceFromSun: number;
  color: string;
  size: number;
  orbitRadius: number;
  rotationPeriod: number;
  orbitalPeriod: number;
}

export interface EarthDayNight {
  sunLongitude: number;
  sunLatitude: number;
  terminatorPoints: { lat: number; lng: number }[];
}

const PLANET_COLORS: Record<string, string> = {
  Mercury: '#b5b5b5',
  Venus: '#e6c87a',
  Earth: '#6b93d6',
  Mars: '#c1440e',
  Jupiter: '#d8ca9d',
  Saturn: '#f4d59e',
  Uranus: '#b5e3e3',
  Neptune: '#5b7fce',
};

const PLANET_SIZES: Record<string, number> = {
  Mercury: 0.4,
  Venus: 0.9,
  Earth: 1.0,
  Mars: 0.5,
  Jupiter: 11.0,
  Saturn: 9.0,
  Uranus: 4.0,
  Neptune: 3.9,
};

const ROTATION_PERIODS: Record<string, number> = {
  Mercury: 58.6,
  Venus: -243,
  Earth: 1,
  Mars: 1.03,
  Jupiter: 0.41,
  Saturn: 0.45,
  Uranus: -0.72,
  Neptune: 0.67,
};

const ORBITAL_PERIODS: Record<string, number> = {
  Mercury: 87.97,
  Venus: 224.7,
  Earth: 365.25,
  Mars: 687,
  Jupiter: 4333,
  Saturn: 10759,
  Uranus: 30687,
  Neptune: 60190,
};

const AU_TO_DISPLAY = 30;

export function getPlanetaryPositions(date: Date): PlanetData[] {
  const planets: Astronomy.Body[] = [
    Astronomy.Body.Mercury,
    Astronomy.Body.Venus,
    Astronomy.Body.Earth,
    Astronomy.Body.Mars,
    Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn,
    Astronomy.Body.Uranus,
    Astronomy.Body.Neptune,
  ];

  const planetNames = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  const astroTime = Astronomy.MakeTime(date);

  return planets.map((body, index) => {
    const name = planetNames[index];
    const helio = Astronomy.HelioVector(body, astroTime);
    
    const x = helio.x * AU_TO_DISPLAY;
    const y = helio.y * AU_TO_DISPLAY;
    const z = helio.z * AU_TO_DISPLAY;
    const distanceFromSun = Math.sqrt(helio.x ** 2 + helio.y ** 2 + helio.z ** 2);

    return {
      name,
      x,
      y,
      z,
      distanceFromSun,
      color: PLANET_COLORS[name],
      size: PLANET_SIZES[name],
      orbitRadius: distanceFromSun * AU_TO_DISPLAY,
      rotationPeriod: ROTATION_PERIODS[name],
      orbitalPeriod: ORBITAL_PERIODS[name],
    };
  });
}

export function getSunPosition(): { x: number; y: number; z: number } {
  return { x: 0, y: 0, z: 0 };
}

export function getEarthDayNight(date: Date): EarthDayNight {
  const astroTime = Astronomy.MakeTime(date);
  
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true);
  
  const sunDist = Math.sqrt(sunGeo.x ** 2 + sunGeo.y ** 2 + sunGeo.z ** 2);
  const sunLatitude = Math.asin(sunGeo.z / sunDist) * (180 / Math.PI);
  
  const gmst = getGMST(date);
  const sunRightAscension = Math.atan2(sunGeo.y, sunGeo.x) * (180 / Math.PI);
  let sunLongitude = sunRightAscension - gmst;
  
  while (sunLongitude > 180) sunLongitude -= 360;
  while (sunLongitude < -180) sunLongitude += 360;

  const terminatorPoints: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= 360; i += 5) {
    const angle = (i * Math.PI) / 180;
    const lat = Math.asin(Math.sin(angle) * Math.cos(sunLatitude * Math.PI / 180)) * (180 / Math.PI);
    let lng = sunLongitude + 90 + Math.atan2(
      Math.cos(angle),
      -Math.sin(sunLatitude * Math.PI / 180) * Math.sin(angle)
    ) * (180 / Math.PI);
    
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    
    terminatorPoints.push({ lat, lng });
  }

  return {
    sunLongitude,
    sunLatitude,
    terminatorPoints,
  };
}

function getGMST(date: Date): number {
  const jd = getJulianDate(date);
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
             0.000387933 * t * t - t * t * t / 38710000.0;
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  return gmst;
}

function getJulianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  const jd = Math.floor(365.25 * (y + 4716)) + 
             Math.floor(30.6001 * (m + 1)) + 
             day + b - 1524.5 + 
             (hour + minute / 60 + second / 3600) / 24;
  
  return jd;
}

export function getMoonPosition(date: Date): { x: number; y: number; z: number; distanceFromEarth: number } {
  const astroTime = Astronomy.MakeTime(date);
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
  
  const earthPos = getPlanetaryPositions(date).find(p => p.name === 'Earth')!;
  
  const moonScale = 0.5;
  
  return {
    x: earthPos.x + moonGeo.x * moonScale,
    y: earthPos.y + moonGeo.y * moonScale,
    z: earthPos.z + moonGeo.z * moonScale,
    distanceFromEarth: Math.sqrt(moonGeo.x ** 2 + moonGeo.y ** 2 + moonGeo.z ** 2),
  };
}

export function getAsteroidBeltPositions(count: number = 500): { x: number; y: number; z: number }[] {
  const asteroids: { x: number; y: number; z: number }[] = [];
  const innerRadius = 2.2 * AU_TO_DISPLAY;
  const outerRadius = 3.2 * AU_TO_DISPLAY;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
    const height = (Math.random() - 0.5) * 3;
    
    asteroids.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: height,
    });
  }
  
  return asteroids;
}
