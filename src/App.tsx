/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CelestialScene } from './components/CelestialScene';
import { ControlOverlay } from './components/ControlOverlay';
import {
  SimulationState,
  CelestialSphere,
  LunarMansion,
} from './types/celestial';
import {
  NINE_SPHERES_DATA,
  LUNAR_MANSIONS_DATA,
  HISTORICAL_OBSERVER_LOCATIONS,
} from './astronomy/celestialData';
import {
  julianDayToDate,
} from './astronomy/classicalMath';

export default function App() {
  const [spheres, setSpheres] = useState<CelestialSphere[]>(NINE_SPHERES_DATA);

  // Initial Astronomical Epoch: Vernal Equinox 2024 (Aries 0°, Sun declination 0.00°)
  const initialJD = 2460389.629;
  const initialDateInfo = julianDayToDate(initialJD);

  const [simState, setSimState] = useState<SimulationState>({
    modelType: 'BATTANI_PTOLEMAIC',
    cosmologyMode: 'REALISTIC_PHYSICAL',
    scaleMode: 'LOGARITHMIC_BALANCED',
    simJulianDay: initialJD,
    dateTimeIso: initialDateInfo.formattedDateTime,
    simTimeDays: initialJD - 2451545.0,
    timeSpeed: 3600, // 3600 = 1 hour/sec in simulation
    isPaused: false,
    explodedAmount: 0.0,
    selectedSphereId: null,
    selectedMansionNumber: 1,
    selectedLocation: HISTORICAL_OBSERVER_LOCATIONS[0], // Mecca
    language: 'BILINGUAL',
    obliquityDeg: 23.44, // Exact classical ecliptic obliquity
    precessionRateArcsecPerYear: 54.5,
    showArmillaryRings: true,
    showEclipticRing: true,
    showEquatorRing: true,
    showMeridianHorizon: true,
    showTusiMechanism: false,
    showRetrogradeTrails: true,
    showLunarMansions: true,
    showFixedStars: true,
    showConstellationLines: true,
    showObserverHorizon: true,
    cinematicMode: false,
    isAtlasAutoRotating: true,
    earthObservationMode: false,
    showEquatorialGrid: true,
    showSolsticeEquinoxMarkers: true,
    textbookFocusMode: 'ALL_PLANETS',
    showPlanets: true,
    showOrbits: true,
  });

  const [inspectedSphere, setInspectedSphere] = useState<CelestialSphere | null>(null);
  const [inspectedMansion, setInspectedMansion] = useState<LunarMansion | null>(null);

  const handleUpdateState = (updates: Partial<SimulationState>) => {
    setSimState((prev) => {
      const next = { ...prev, ...updates };
      // Keep Julian Day and formatted date synchronized if either is modified
      if (updates.simJulianDay !== undefined && updates.dateTimeIso === undefined) {
        const dInfo = julianDayToDate(updates.simJulianDay);
        next.dateTimeIso = dInfo.formattedDateTime;
        next.simTimeDays = updates.simJulianDay - 2451545.0;
      }
      return next;
    });

    if (updates.selectedSphereId !== undefined) {
      if (updates.selectedSphereId === 'earth') {
        setInspectedSphere({
          id: 'earth',
          order: 3,
          nameAr: 'الأَرْض (The Earth)',
          nameEn: 'Earth (5.97 × 10²⁴ kg · 1.00 AU · 149.6 × 10⁶ km)',
          transliteration: 'Al-Ard',
          ruler: '1.000 M⊕ · 149.6 × 10⁶ km · 29.8 km/s',
          bodyColor: '#0284c7',
          orbColor: '#38bdf8',
          deferentRadius: 14,
          farghaniDistanceEarthRadii: 1,
          orbitalPeriodDays: 365.256,
          epicycleRadius: 0,
          epicyclePeriodDays: 0,
          inclinationDeg: 23.44,
          eccentricity: 0.0167,
          visible: true,
          opacity: 1,
          showOrbits: true,
          showEpicycleArm: false,
          showRetrogradeTrail: false,
        });
      } else if (updates.selectedSphereId === 'sun') {
        setInspectedSphere({
          id: 'sun',
          order: 0,
          nameAr: 'الشَّمْس (The Sun)',
          nameEn: 'Central Star (1.989 × 10³⁰ kg · 333,000 M⊕)',
          transliteration: 'Al-Shams',
          ruler: 'Gravitational Center · 1.989 × 10³⁰ kg',
          bodyColor: '#fbbf24',
          orbColor: '#f59e0b',
          deferentRadius: 0,
          farghaniDistanceEarthRadii: 0,
          orbitalPeriodDays: 25.05,
          epicycleRadius: 0,
          epicyclePeriodDays: 0,
          inclinationDeg: 0,
          eccentricity: 0,
          visible: true,
          opacity: 1,
          showOrbits: false,
          showEpicycleArm: false,
          showRetrogradeTrail: false,
        });
      } else if (updates.selectedSphereId === 'moon') {
        setInspectedSphere({
          id: 'moon',
          order: 1,
          nameAr: "القَمَر (Earth's Moon)",
          nameEn: "Moon (7.34 × 10²² kg · ~384,400 km from Earth)",
          transliteration: 'Al-Qamar',
          ruler: '0.0123 M⊕ (~1.2%) · 384,400 km · Shares 1.00 AU from Sun',
          bodyColor: '#cbd5e1',
          orbColor: '#94a3b8',
          deferentRadius: 1.35,
          farghaniDistanceEarthRadii: 60.3,
          orbitalPeriodDays: 27.32166,
          epicycleRadius: 0,
          epicyclePeriodDays: 0,
          inclinationDeg: 5.14,
          eccentricity: 0.0549,
          visible: true,
          opacity: 1,
          showOrbits: true,
          showEpicycleArm: false,
          showRetrogradeTrail: false,
        });
      } else if (updates.selectedSphereId === null) {
        setInspectedSphere(null);
      } else {
        const found = spheres.find((s) => s.id === updates.selectedSphereId) || null;
        setInspectedSphere(found);
      }
    }
  };

  const handleTimeUpdate = (newJD: number) => {
    const dInfo = julianDayToDate(newJD);
    setSimState((prev) => ({
      ...prev,
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    }));
  };

  const handleUpdateSphere = (id: string, updates: Partial<CelestialSphere>) => {
    setSpheres((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleSelectSphere = (id: string) => {
    if (id === 'earth') {
      handleUpdateState({ selectedSphereId: 'earth', cameraPreset: 'EARTH_CLOSE' as any });
      setTimeout(() => handleUpdateState({ cameraPreset: null }), 900);
      return;
    }
    const found = spheres.find((s) => s.id === id) || null;
    setInspectedSphere(found);
    setInspectedMansion(null);
    handleUpdateState({ selectedSphereId: id, cameraPreset: id as any });
    setTimeout(() => handleUpdateState({ cameraPreset: null }), 900);
  };

  const handleSelectMansion = (num: number) => {
    const found = LUNAR_MANSIONS_DATA.find((m) => m.number === num) || null;
    setInspectedMansion(found);
    setInspectedSphere(null);
    handleUpdateState({ selectedMansionNumber: num });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950 font-sans text-gray-100 select-none">
      {/* 3D WebGL Three.js Scene */}
      <CelestialScene
        simState={simState}
        spheres={spheres}
        onSelectSphere={handleSelectSphere}
        onSelectMansion={handleSelectMansion}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Unified, Sleek Control Overlay */}
      <ControlOverlay
        simState={simState}
        spheres={spheres}
        inspectedSphere={inspectedSphere}
        inspectedMansion={inspectedMansion}
        onClearInspectedSphere={() => setInspectedSphere(null)}
        onClearInspectedMansion={() => setInspectedMansion(null)}
        onUpdateState={handleUpdateState}
        onUpdateSphere={handleUpdateSphere}
      />
    </div>
  );
}
