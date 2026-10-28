export type ModelType = 
  | 'MARAGHA_TUSI' 
  | 'IBN_AL_SHATIR' 
  | 'BATTANI_PTOLEMAIC' 
  | 'ARMILLARY_DHAT_AL_HILAQ';

export type LanguageMode = 'ARABIC' | 'ENGLISH' | 'BILINGUAL';

export interface CelestialSphere {
  id: string;
  order: number; // 1 (Moon) to 9 (Primum Mobile)
  nameAr: string;
  nameEn: string;
  transliteration: string;
  ruler: string;
  bodyColor: string;
  orbColor: string;
  deferentRadius: number; // Base visual unit
  farghaniDistanceEarthRadii: number; // Historical distance from Al-Farghani's Jawami'
  orbitalPeriodDays: number;
  epicycleRadius: number;
  epicyclePeriodDays: number;
  inclinationDeg: number;
  eccentricity: number;
  tusiCoupleRadius?: number;
  ibnShatirSecondEpicycleRadius?: number;
  visible: boolean;
  opacity: number;
  showOrbits: boolean;
  showEpicycleArm: boolean;
  showRetrogradeTrail: boolean;
}

export interface LunarMansion {
  number: number;
  nameAr: string;
  nameEn: string;
  transliteration: string;
  startDeg: number;
  endDeg: number;
  zodiacSignAr: string;
  zodiacSignEn: string;
  principalStars: string[];
  anwaWeather: string;
  spiritualSignificance: string;
}

export interface ZodiacSign {
  number: number; // 1 to 12
  nameAr: string;
  nameEn: string;
  symbol: string;
  startDeg: number;
  endDeg: number;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  rulingPlanetAr: string;
  rulingPlanetEn: string;
  classicalDescription: string;
}

export interface ClassicalStar {
  id: string;
  nameAr: string;
  nameEn: string;
  transliteration: string;
  meaningAr: string;
  constellationAr: string;
  constellationEn: string;
  raHours: number;
  decDeg: number;
  magnitude: number;
  color: string;
  sufiReference: string;
}

export interface ObserverLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  historicalSignificance: string;
}

export interface ScholarTreatise {
  id: string;
  scholarAr: string;
  scholarEn: string;
  lifespan: string;
  city: string;
  workAr: string;
  workEn: string;
  dateCE: number;
  summary: string;
  keyInnovation: string;
  originalExcerpt: string;
  geometricTheorem: string;
}

export interface SimulationState {
  modelType: ModelType;
  simTimeDays: number;
  simJulianDay: number;
  dateTimeIso: string;
  timeSpeed: number; // multiplier
  isPaused: boolean;
  explodedAmount: number; // 0 to 1
  selectedSphereId: string | null;
  selectedMansionNumber: number | null;
  selectedLocation: ObserverLocation;
  language: LanguageMode;
  obliquityDeg: number; // 23.44 classical ecliptic obliquity
  precessionRateArcsecPerYear: number; // 54.5 Al-Battani default
  showArmillaryRings: boolean;
  showEclipticRing: boolean;
  showEquatorRing: boolean;
  showMeridianHorizon: boolean;
  showTusiMechanism: boolean;
  showRetrogradeTrails: boolean;
  showLunarMansions: boolean;
  showFixedStars: boolean;
  showConstellationLines: boolean;
  showObserverHorizon: boolean;
  cinematicMode: boolean;
  isAtlasAutoRotating: boolean;
  earthObservationMode: boolean;
  showEquatorialGrid: boolean;
  showSolsticeEquinoxMarkers: boolean;
  textbookFocusMode: 'CORE_EARTH_SUN_MOON' | 'ALL_PLANETS';
  showPlanets: boolean;
  cameraPreset?: 'COSMIC' | 'EARTH_CLOSE' | 'MOON_PHASE' | 'ECLIPTIC_SIDE' | 'POLAR_NORTH' | 'earth' | 'moon' | 'sun' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | string | null;
}
