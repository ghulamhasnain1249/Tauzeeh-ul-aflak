import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  SimulationState,
  CelestialSphere,
} from '../types/celestial';
import {
  NINE_SPHERES_DATA,
  LUNAR_MANSIONS_DATA,
  REALISTIC_SOLAR_SYSTEM_DATA,
} from '../astronomy/celestialData';
import {
  calculateSiderealTime,
  calculateSunEphemerisByJD,
  calculateMoonEphemerisByJD,
  calculatePlanetsPositionsByJD,
  calculateRealisticSolarSystemPositions,
  calculateTusiCouple,
  calculateIbnShatirPosition,
  calculateBattaniPosition,
  DEG_TO_RAD,
} from '../astronomy/classicalMath';
import {
  createEclipticDialTexture,
  createArmillaryGraduationTexture,
  createEarthClassicalTexture,
  createMoonProceduralTexture,
  createSunParticleTexture,
  createMercuryTexture,
  createVenusTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingTexture,
  createUranusTexture,
  createNeptuneTexture,
} from '../astronomy/proceduralTextures';

interface CelestialSceneProps {
  simState: SimulationState;
  spheres: CelestialSphere[];
  onSelectSphere: (id: string) => void;
  onSelectMansion: (num: number) => void;
  onTimeUpdate?: (newJD: number) => void;
}

// Pre-allocated scratch objects to ensure 60fps lossless loop with ZERO GC allocations
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3TargetPos = new THREE.Vector3();
const _vec3TargetLook = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();

export const CelestialScene: React.FC<CelestialSceneProps> = ({
  simState,
  spheres,
  onSelectSphere,
  onSelectMansion,
  onTimeUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(simState);
  stateRef.current = simState;

  const spheresRef = useRef(spheres);
  spheresRef.current = spheres;

  const onSelectSphereRef = useRef(onSelectSphere);
  onSelectSphereRef.current = onSelectSphere;

  const onSelectMansionRef = useRef(onSelectMansion);
  onSelectMansionRef.current = onSelectMansion;

  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // =========================================================================
    // 1. WebGL Renderer with PBR & Studio Tone Mapping
    // =========================================================================
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true, // Prevents Z-fighting at extreme zoom scales
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // 2. Scene & Deep Cosmic Atmosphere
    // =========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#01040d'); // Pristine astronomical midnight
    scene.fog = new THREE.FogExp2('#01040d', 0.0035);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // =========================================================================
    // 3. Dynamic Scaling Camera & Damped Controls (0.1 to 15000 range)
    // =========================================================================
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,    // Explicit scaling near plane to prevent clipping when zooming into Earth
      15000   // Far plane to prevent clipping when zooming out to full 9th sphere
    );
    camera.position.set(26, 20, 36);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.8;   // Allow user to zoom right up to Earth surface
    controls.maxDistance = 350;   // Allow full cosmological view
    controls.target.set(0, 0, 0);

    // Subtle dark ambient fill (ensures unlit hemisphere remains in authentic darkness)
    const ambientLight = new THREE.AmbientLight('#050811', 0.1);
    scene.add(ambientLight);

    // =========================================================================
    // 4. Procedural Textures & PBR Materials
    // =========================================================================
    const eclipticDialTexture = createEclipticDialTexture();
    const armillaryGradTexture = createArmillaryGraduationTexture();
    const earthTexture = createEarthClassicalTexture();
    const moonTexture = createMoonProceduralTexture();
    const sunGlowTexture = createSunParticleTexture();
    const mercuryTexture = createMercuryTexture();
    const venusTexture = createVenusTexture();
    const marsTexture = createMarsTexture();
    const jupiterTexture = createJupiterTexture();
    const saturnTexture = createSaturnTexture();
    const saturnRingTexture = createSaturnRingTexture();
    const uranusTexture = createUranusTexture();
    const neptuneTexture = createNeptuneTexture();

    const polishedGoldMat = new THREE.MeshPhysicalMaterial({
      color: '#d4af37',
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.8,
    });

    const antiqueBrassMat = new THREE.MeshStandardMaterial({
      color: '#b48a3c',
      metalness: 0.85,
      roughness: 0.35,
    });

    // =========================================================================
    // 5. GEOCENTRIC ROOT CONTAINER (حامل النموذج البطلمي والكرات التسع)
    // =========================================================================
    const geocentricRootGroup = new THREE.Group();
    scene.add(geocentricRootGroup);

    const earthGroup = new THREE.Group();
    geocentricRootGroup.add(earthGroup);

    // Earth Globe (MeshStandardMaterial reacting purely to Sun's light: 50% day, 50% night)
    const earthGeo = new THREE.SphereGeometry(1.6, 64, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    earthGroup.add(earthMesh);

    // Polar axis spindle (aligned vertically along polar Y-axis)
    const axisPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 4.4, 16),
      polishedGoldMat
    );
    earthGroup.add(axisPin);

    // North & South Pole brass finials
    const finialGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const nFinial = new THREE.Mesh(finialGeo, polishedGoldMat);
    nFinial.position.y = 2.2;
    earthGroup.add(nFinial);

    const sFinial = new THREE.Mesh(finialGeo, polishedGoldMat);
    sFinial.position.y = -2.2;
    earthGroup.add(sFinial);

    // Terrestrial Equator Ring
    const earthEquator = new THREE.Mesh(
      new THREE.TorusGeometry(1.63, 0.018, 16, 64),
      polishedGoldMat
    );
    earthEquator.rotation.x = Math.PI / 2;
    earthGroup.add(earthEquator);

    // Observer Station Marker & Tangent Horizon Plane (الأفق الحسي وسمت الرأس)
    const observerGroup = new THREE.Group();
    earthGroup.add(observerGroup);

    // Tangent Horizon Disc (representing local observer astronomical horizon plane)
    const observerHorizonDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.015, 32),
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        transparent: true,
        opacity: 0.5,
        roughness: 0.25,
      })
    );
    observerGroup.add(observerHorizonDisc);

    // Brass Horizon Rim (طوق الأفق النحاسي)
    const horizonRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.012, 12, 48),
      polishedGoldMat
    );
    horizonRim.rotation.x = Math.PI / 2;
    observerGroup.add(horizonRim);

    // Zenith Needle Pointer (سهم سمت الرأس - Local Vertical perpendicular to horizon)
    const zenithPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.35, 12),
      polishedGoldMat
    );
    zenithPin.position.y = 0.175;
    observerGroup.add(zenithPin);

    // Observer Figurine / Station Indicator
    const observerPin = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.85, roughness: 0.2 })
    );
    observerPin.position.y = 0.06;
    observerGroup.add(observerPin);

    // =========================================================================
    // 6. FALAK AL-ATLAS (فلک الاطلس / The Ninth Sphere)
    // Rotates continuously East to West on polar Y-axis (24h Diurnal Motion).
    // ALL inner celestial groups are parented inside this container!
    // =========================================================================
    const falakAtlasGroup = new THREE.Group();
    geocentricRootGroup.add(falakAtlasGroup);

    const SPHERE_RADIUS = 32.0;
    const epsRad = 23.44 * DEG_TO_RAD;

    // -------------------------------------------------------------------------
    // A. CELESTIAL EQUATORIAL COORDINATE GRATICULE (معدل النہار و خطوط العرض والطول)
    // Precisely aligned with Earth's equatorial plane (0° tilt)
    // -------------------------------------------------------------------------
    const equatorialGraticuleGroup = new THREE.Group();
    falakAtlasGroup.add(equatorialGraticuleGroup);

    // 1. Celestial Equator (Mu'addil al-Nahar) - Exactly on XZ plane (Y = 0)
    const equatorRing = new THREE.Mesh(
      new THREE.TorusGeometry(SPHERE_RADIUS, 0.18, 16, 128),
      new THREE.MeshStandardMaterial({
        map: armillaryGradTexture,
        roughness: 0.3,
        metalness: 0.85,
      })
    );
    equatorRing.rotation.x = Math.PI / 2;
    equatorialGraticuleGroup.add(equatorRing);

    // 2. Parallels of Declination (مدارات العرض السماوية)
    // Helper to generate perfectly aligned circular rings of declination
    const createDeclinationRing = (decDeg: number, color: string, thickness: number, opacity: number = 0.5) => {
      const decRad = decDeg * DEG_TO_RAD;
      const y = SPHERE_RADIUS * Math.sin(decRad);
      const r = SPHERE_RADIUS * Math.cos(decRad);

      const pts: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      return new THREE.Line(geo, mat);
    };

    // Tropic of Cancer (Madar al-Saratan) at +23.44°
    equatorialGraticuleGroup.add(createDeclinationRing(23.44, '#f59e0b', 0.08, 0.85));
    // Tropic of Capricorn (Madar al-Jady) at -23.44°
    equatorialGraticuleGroup.add(createDeclinationRing(-23.44, '#f59e0b', 0.08, 0.85));

    // Arctic Circle at +66.56° and Antarctic Circle at -66.56°
    equatorialGraticuleGroup.add(createDeclinationRing(66.56, '#38bdf8', 0.06, 0.7));
    equatorialGraticuleGroup.add(createDeclinationRing(-66.56, '#38bdf8', 0.06, 0.7));

    // Intermediate systematic graticule parallels: ±15°, ±30°, ±45°, ±60°, ±75°
    const intermediateLats = [15, 30, 45, 60, 75, -15, -30, -45, -60, -75];
    intermediateLats.forEach((lat) => {
      equatorialGraticuleGroup.add(createDeclinationRing(lat, '#475569', 0.02, 0.35));
    });

    // 3. 24 Hourly Meridians (Right Ascension circles passing through poles)
    for (let h = 0; h < 24; h++) {
      const hAngle = (h / 24) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        // Meridian circle passing through north pole (Y=+R) and south pole (Y=-R)
        const x = SPHERE_RADIUS * Math.cos(a) * Math.cos(hAngle);
        const y = SPHERE_RADIUS * Math.sin(a);
        const z = SPHERE_RADIUS * Math.cos(a) * Math.sin(hAngle);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const mGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const mMat = new THREE.LineBasicMaterial({
        color: h % 6 === 0 ? '#64748b' : '#334155',
        transparent: true,
        opacity: h % 6 === 0 ? 0.6 : 0.25,
        depthWrite: false,
      });
      equatorialGraticuleGroup.add(new THREE.Line(mGeo, mMat));
    }

    // -------------------------------------------------------------------------
    // B. ECLIPTIC COORDINATE GROUP (فلك البروج)
    // Inclined at exactly 23.44° around the Equinoctial X-axis!
    // Intersects the Celestial Equator at Vernal Equinox (+X) and Autumnal Equinox (-X)
    // -------------------------------------------------------------------------
    const eclipticCoordGroup = new THREE.Group();
    // Tilt around X-axis by exact obliquity (23.44°)
    eclipticCoordGroup.rotation.x = -epsRad;
    falakAtlasGroup.add(eclipticCoordGroup);

    // Ecliptic Band with Zodiac graduations
    const eclipticBandGeo = new THREE.CylinderGeometry(SPHERE_RADIUS + 0.08, SPHERE_RADIUS + 0.08, 1.2, 128, 1, true);
    const eclipticBandMat = new THREE.MeshStandardMaterial({
      map: eclipticDialTexture,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.8,
      depthWrite: false,
    });
    const eclipticBandMesh = new THREE.Mesh(eclipticBandGeo, eclipticBandMat);
    eclipticCoordGroup.add(eclipticBandMesh);

    // Retaining brass borders
    const eclipticRimTop = new THREE.Mesh(
      new THREE.TorusGeometry(SPHERE_RADIUS + 0.08, 0.06, 16, 128),
      polishedGoldMat
    );
    eclipticRimTop.position.y = 0.6;
    eclipticRimTop.rotation.x = Math.PI / 2;
    eclipticCoordGroup.add(eclipticRimTop);

    const eclipticRimBot = new THREE.Mesh(
      new THREE.TorusGeometry(SPHERE_RADIUS + 0.08, 0.06, 16, 128),
      polishedGoldMat
    );
    eclipticRimBot.position.y = -0.6;
    eclipticRimBot.rotation.x = Math.PI / 2;
    eclipticCoordGroup.add(eclipticRimBot);

    // Equinox & Solstice Markers (flush with ecliptic ring)
    const equinoxSolsticeGroup = new THREE.Group();
    eclipticCoordGroup.add(equinoxSolsticeGroup);

    const createJewel = (pos: THREE.Vector3, color: string, label: string) => {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.1 })
      );
      mesh.position.copy(pos);
      mesh.userData = { label };
      equinoxSolsticeGroup.add(mesh);
    };

    // 1. Vernal Equinox (نقطة الاعتدال الربيعي - First Point of Aries ♈) at +X (0° Ecliptic Longitude)
    createJewel(new THREE.Vector3(SPHERE_RADIUS, 0, 0), '#22c55e', 'Vernal Equinox (نقطة الاعتدال الربيعي)');
    // 2. Autumnal Equinox (نقطة الاعتدال الخريفي - First Point of Libra ♎) at -X (180° Ecliptic Longitude)
    createJewel(new THREE.Vector3(-SPHERE_RADIUS, 0, 0), '#f59e0b', 'Autumnal Equinox (نقطة الاعتدال الخريفي)');
    // 3. Summer Solstice (نقطة الانقلاب الصيفي - Cancer ♋) at +Z (90° Ecliptic Longitude)
    createJewel(new THREE.Vector3(0, 0, SPHERE_RADIUS), '#ef4444', 'Summer Solstice (الانقلاب الصيفي)');
    // 4. Winter Solstice (نقطة الانقلاب الشتوي - Capricorn ♑) at -Z (270° Ecliptic Longitude)
    createJewel(new THREE.Vector3(0, 0, -SPHERE_RADIUS), '#38bdf8', 'Winter Solstice (الانقلاب الشتوي)');

    // -------------------------------------------------------------------------
    // C. 28 LUNAR MANSIONS (مَنازِل القَمَر) GRADUATION TICKS ALONG ECLIPTIC
    // -------------------------------------------------------------------------
    const mansionsGroup = new THREE.Group();
    eclipticCoordGroup.add(mansionsGroup);

    const mansionNodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const mansionNodeMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mansionNodes: THREE.Mesh[] = [];
    LUNAR_MANSIONS_DATA.forEach((m) => {
      const midAngle = ((m.startDeg + m.endDeg) / 2) * DEG_TO_RAD;
      const node = new THREE.Mesh(mansionNodeGeo, mansionNodeMat);
      node.position.set(
        SPHERE_RADIUS * Math.cos(midAngle),
        0,
        SPHERE_RADIUS * Math.sin(midAngle)
      );
      node.userData = { mansionNumber: m.number, nameAr: m.nameAr, nameEn: m.nameEn };
      mansionsGroup.add(node);
      mansionNodes.push(node);
    });

    // -------------------------------------------------------------------------
    // D. SUN (فَلَك الشَّمْس) - NESTED IN ECLIPTIC GROUP
    // Intrinsic West-to-East proper motion along Ecliptic (~365.25 days)
    // High-intensity light source placed directly at center of Sun mesh!
    // -------------------------------------------------------------------------
    const SUN_DISTANCE = 13.5;
    const sunGroup = new THREE.Group();
    eclipticCoordGroup.add(sunGroup);

    const sunMeshGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const sunMeshMat = new THREE.MeshBasicMaterial({ color: '#fffbeb' });
    const sunMesh = new THREE.Mesh(sunMeshGeo, sunMeshMat);
    sunGroup.add(sunMesh);

    const sunSpriteMat = new THREE.SpriteMaterial({
      map: sunGlowTexture,
      color: '#f59e0b',
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sunSprite = new THREE.Sprite(sunSpriteMat);
    sunSprite.scale.set(6.5, 6.5, 1);
    sunMesh.add(sunSprite);

    // High-Intensity PointLight inside the Sun (illuminates 50% Earth and produces real moon phases)
    const sunPointLight = new THREE.PointLight('#fffbeb', 5.5, 600, 0.15);
    sunPointLight.castShadow = true;
    sunPointLight.shadow.mapSize.width = 2048;
    sunPointLight.shadow.mapSize.height = 2048;
    sunPointLight.shadow.camera.near = 0.5;
    sunPointLight.shadow.camera.far = 350;
    sunPointLight.shadow.bias = -0.0005;
    sunPointLight.shadow.normalBias = 0.02;
    sunMesh.add(sunPointLight);

    // Sun Deferent Ring in Ecliptic Plane
    const sunOrbitLinePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      sunOrbitLinePts.push(new THREE.Vector3(SUN_DISTANCE * Math.cos(a), 0, SUN_DISTANCE * Math.sin(a)));
    }
    const sunOrbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(sunOrbitLinePts),
      new THREE.LineBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.6, depthWrite: false })
    );
    eclipticCoordGroup.add(sunOrbitLine);

    // -------------------------------------------------------------------------
    // E. MOON (فَلَك القَمَر) - NESTED IN FALAK AL-ATLAS
    // Intrinsic West-to-East proper motion (~27.32 days)
    // Tilted at ~5.14° relative to Ecliptic
    // Pure geometric moon phases emerge from Sun lighting!
    // -------------------------------------------------------------------------
    const MOON_DISTANCE = 5.2;
    const moonInclinationGroup = new THREE.Group();
    moonInclinationGroup.rotation.x = -epsRad - (5.14 * DEG_TO_RAD);
    falakAtlasGroup.add(moonInclinationGroup);

    const moonGroup = new THREE.Group();
    moonInclinationGroup.add(moonGroup);

    const moonGeo = new THREE.SphereGeometry(0.52, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.88,
      metalness: 0.04,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    moonGroup.add(moonMesh);

    // Moon Deferent Line
    const moonOrbitPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      moonOrbitPts.push(new THREE.Vector3(MOON_DISTANCE * Math.cos(a), 0, MOON_DISTANCE * Math.sin(a)));
    }
    const moonOrbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(moonOrbitPts),
      new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.55, depthWrite: false })
    );
    moonInclinationGroup.add(moonOrbitLine);

    // Indicator Ray connecting Moon to active Lunar Mansion
    const lunarRayGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const lunarRayLine = new THREE.Line(
      lunarRayGeo,
      new THREE.LineBasicMaterial({ color: '#e0e7ff', transparent: true, opacity: 0.85, depthWrite: false })
    );
    falakAtlasGroup.add(lunarRayLine);

    // -------------------------------------------------------------------------
    // F. CLASSICAL PLANETS (Mercury, Venus, Mars, Jupiter, Saturn)
    // Nested in Falak al-Atlas with deferent & epicycle carriages
    // -------------------------------------------------------------------------
const _upVector = new THREE.Vector3(0, 1, 0);
const _obsNormal = new THREE.Vector3();

interface PlanetaryNode {
  id: string;
  group: THREE.Group;
  deferentGroup: THREE.Group;
  planetMesh: THREE.Mesh;
  trailLength: number;
  trailLine: THREE.Line;
  deferentRadius: number;
  epicycleRadius: number;
  orbitalPeriodDays: number;
  epicyclePeriodDays: number;
  inclinationDeg: number;
  eccentricity: number;
  color: string;
}

const planetaryNodes: PlanetaryNode[] = [];
    const planetsData = NINE_SPHERES_DATA.filter(
      (s) => s.id !== 'moon' && s.id !== 'sun' && s.id !== 'fixedStars' && s.id !== 'primumMobile'
    );

    planetsData.forEach((pData) => {
      const pIncGroup = new THREE.Group();
      pIncGroup.rotation.x = -epsRad - (pData.inclinationDeg * DEG_TO_RAD);
      falakAtlasGroup.add(pIncGroup);

      const pDefGroup = new THREE.Group();
      pIncGroup.add(pDefGroup);

      // Deferent ring
      const dPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        dPts.push(new THREE.Vector3(pData.deferentRadius * Math.cos(a), 0, pData.deferentRadius * Math.sin(a)));
      }
      const dLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(dPts),
        new THREE.LineBasicMaterial({ color: pData.bodyColor, transparent: true, opacity: 0.4, depthWrite: false })
      );
      pIncGroup.add(dLine);

      // Epicycle ring
      const epiGroup = new THREE.Group();
      pDefGroup.add(epiGroup);

      if (pData.epicycleRadius > 0) {
        const ePts: THREE.Vector3[] = [];
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          ePts.push(new THREE.Vector3(pData.epicycleRadius * Math.cos(a), 0, pData.epicycleRadius * Math.sin(a)));
        }
        const eLine = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(ePts),
          new THREE.LineBasicMaterial({ color: pData.bodyColor, transparent: true, opacity: 0.35, depthWrite: false })
        );
        epiGroup.add(eLine);
      }

      // Planet Geometry & Texture Material based on real astronomical body
      let pRadius = 0.42;
      let pMat = new THREE.MeshStandardMaterial({
        color: pData.bodyColor,
        metalness: 0.2,
        roughness: 0.5,
      });

      if (pData.id === 'mercury') {
        pRadius = 0.32;
        pMat = new THREE.MeshStandardMaterial({
          map: mercuryTexture,
          roughness: 0.8,
          metalness: 0.2,
        });
      } else if (pData.id === 'venus') {
        pRadius = 0.45;
        pMat = new THREE.MeshStandardMaterial({
          map: venusTexture,
          roughness: 0.35,
          metalness: 0.1,
        });
      } else if (pData.id === 'mars') {
        pRadius = 0.36;
        pMat = new THREE.MeshStandardMaterial({
          map: marsTexture,
          roughness: 0.7,
          metalness: 0.15,
        });
      } else if (pData.id === 'jupiter') {
        pRadius = 0.82;
        pMat = new THREE.MeshStandardMaterial({
          map: jupiterTexture,
          roughness: 0.45,
          metalness: 0.05,
        });
      } else if (pData.id === 'saturn') {
        pRadius = 0.70;
        pMat = new THREE.MeshStandardMaterial({
          map: saturnTexture,
          roughness: 0.45,
          metalness: 0.05,
        });
      }

      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(pRadius, 32, 32),
        pMat
      );
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;
      epiGroup.add(pMesh);

      // If Saturn, add its iconic Rings (حلقات زحل)
      if (pData.id === 'saturn') {
        const ringGeo = new THREE.RingGeometry(0.92, 1.75, 64);
        const ringMat = new THREE.MeshStandardMaterial({
          map: saturnRingTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.4,
        });
        const saturnRing = new THREE.Mesh(ringGeo, ringMat);
        saturnRing.rotation.x = Math.PI / 2 + (26.7 * DEG_TO_RAD);
        saturnRing.receiveShadow = true;
        epiGroup.add(saturnRing);
      }

      // Retrograde loop trail (pre-allocated fixed buffer for 60fps zero-allocation updates)
      const MAX_TRAIL = 120;
      const trailPositions = new Float32Array(MAX_TRAIL * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setDrawRange(0, 0);
      const trailLine = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({ color: pData.bodyColor, transparent: true, opacity: 0.75, depthWrite: false })
      );
      falakAtlasGroup.add(trailLine);

      planetaryNodes.push({
        id: pData.id,
        group: pIncGroup,
        deferentGroup: pDefGroup,
        planetMesh: pMesh,
        trailLength: 0,
        trailLine,
        deferentRadius: pData.deferentRadius,
        epicycleRadius: pData.epicycleRadius,
        orbitalPeriodDays: pData.orbitalPeriodDays,
        epicyclePeriodDays: pData.epicyclePeriodDays,
        inclinationDeg: pData.inclinationDeg,
        eccentricity: pData.eccentricity,
        color: pData.bodyColor,
      });
    });

    // -------------------------------------------------------------------------
    // G. CELESTIAL STABILITY: ZERO EXTRA MECHANICAL MESHES OR ARTIFICIAL BODIES
    // Strict classical fidelity: no floating mechanical contraptions in space.
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // H. FIXED STARS FIELD ON THE 8TH SPHERE (فَلَك الكَواكِب الثَّابِتَة)
    // Pure distant pinpoint starlight particles (zero solid 3D bodies)
    // -------------------------------------------------------------------------
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starPalette = [
      new THREE.Color('#bfdbfe'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fdba74'),
    ];

    for (let i = 0; i < starCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 62.0;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }

    const starPointsGeo = new THREE.BufferGeometry();
    starPointsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starPointsGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starPointsMat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: false, // Guarantees pure 1px pinpoints, NEVER large 3D spherical bodies
    });
    const starFieldPoints = new THREE.Points(starPointsGeo, starPointsMat);
    falakAtlasGroup.add(starFieldPoints);

    // =========================================================================
    // 6.5 REALISTIC PHYSICAL HELIOCENTRIC SOLAR SYSTEM (النظام الشمسي الحقيقي)
    // Central radiant Sun at (0,0,0) + 8 Keplerian Planets + Moon at ~384,400 km
    // =========================================================================
    const realisticSolarSystemGroup = new THREE.Group();
    scene.add(realisticSolarSystemGroup);

    // 1. Central radiant Sun (Heliocentric Center)
    const realSunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 36, 36),
      new THREE.MeshBasicMaterial({ color: '#fffdf5' })
    );
    realSunMesh.userData = { id: 'sun' };
    realisticSolarSystemGroup.add(realSunMesh);

    const realSunSpriteMat = new THREE.SpriteMaterial({
      map: sunGlowTexture,
      color: '#f59e0b',
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const realSunSprite = new THREE.Sprite(realSunSpriteMat);
    realSunSprite.scale.set(10.5, 10.5, 1);
    realSunMesh.add(realSunSprite);

    const realSunLight = new THREE.PointLight('#fffbeb', 6.0, 3000, 0.08);
    realSunLight.castShadow = true;
    realSunLight.shadow.mapSize.width = 2048;
    realSunLight.shadow.mapSize.height = 2048;
    realSunLight.shadow.camera.near = 0.5;
    realSunLight.shadow.camera.far = 2500;
    realSunLight.shadow.bias = -0.0005;
    realSunMesh.add(realSunLight);

    // 2. Planets definitions & meshes
    interface RealPlanetNode {
      id: string;
      mesh: THREE.Mesh;
      group: THREE.Group;
      tiltGroup: THREE.Group;
      orbitLine: THREE.Line;
      axialTiltDeg: number;
      rotationPeriodDays: number;
    }

    const realPlanetNodes: RealPlanetNode[] = [];

    // Unit circle geometry reused for orbit lines (scaled dynamically by orbit radius)
    const createOrbitLine = (color: string) => {
      const pts: THREE.Vector3[] = [];
      const segs = 144;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    };

    const realisticBodiesConfig = [
      { id: 'mercury', radius: 0.32, texture: mercuryTexture, tilt: 0.03, rotPeriod: 58.65, color: '#94a3b8' },
      { id: 'venus',   radius: 0.48, texture: venusTexture,   tilt: 177.3, rotPeriod: -243.0, color: '#fef08a' },
      { id: 'earth',   radius: 0.52, texture: earthTexture,   tilt: 23.44, rotPeriod: 1.0, color: '#38bdf8' },
      { id: 'mars',    radius: 0.38, texture: marsTexture,    tilt: 25.19, rotPeriod: 1.026, color: '#ef4444' },
      { id: 'jupiter', radius: 1.25, texture: jupiterTexture, tilt: 3.13,  rotPeriod: 0.413, color: '#fb923c' },
      { id: 'saturn',  radius: 1.05, texture: saturnTexture,  tilt: 26.73, rotPeriod: 0.444, color: '#fde047' },
      { id: 'uranus',  radius: 0.72, texture: uranusTexture,  tilt: 97.77, rotPeriod: -0.718, color: '#67e8f9' },
      { id: 'neptune', radius: 0.70, texture: neptuneTexture, tilt: 28.32, rotPeriod: 0.671, color: '#3b82f6' },
    ];

    const realOrbitGroup = new THREE.Group();
    realisticSolarSystemGroup.add(realOrbitGroup);

    realisticBodiesConfig.forEach((cfg) => {
      const pGroup = new THREE.Group();
      realisticSolarSystemGroup.add(pGroup);

      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = cfg.tilt * DEG_TO_RAD;
      pGroup.add(tiltGroup);

      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.radius, 40, 40),
        new THREE.MeshStandardMaterial({
          map: cfg.texture,
          roughness: cfg.id === 'venus' ? 0.35 : 0.65,
          metalness: 0.08,
        })
      );
      pMesh.castShadow = true;
      pMesh.receiveShadow = true;
      pMesh.userData = { id: cfg.id };
      tiltGroup.add(pMesh);

      // Saturn Rings
      if (cfg.id === 'saturn') {
        const saturnRingGeo = new THREE.RingGeometry(1.35, 2.5, 64);
        const saturnRingMat = new THREE.MeshStandardMaterial({
          map: saturnRingTexture,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          roughness: 0.4,
        });
        const ringMesh = new THREE.Mesh(saturnRingGeo, saturnRingMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.receiveShadow = true;
        tiltGroup.add(ringMesh);
      }

      // Uranus faint Ring
      if (cfg.id === 'uranus') {
        const uranusRingGeo = new THREE.RingGeometry(0.95, 1.25, 48);
        const uranusRingMat = new THREE.MeshStandardMaterial({
          color: '#bae6fd',
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
          roughness: 0.5,
        });
        const uRingMesh = new THREE.Mesh(uranusRingGeo, uranusRingMat);
        uRingMesh.rotation.x = Math.PI / 2;
        tiltGroup.add(uRingMesh);
      }

      // Orbit Line
      const orbitLine = createOrbitLine(cfg.color);
      realOrbitGroup.add(orbitLine);

      realPlanetNodes.push({
        id: cfg.id,
        mesh: pMesh,
        group: pGroup,
        tiltGroup,
        orbitLine,
        axialTiltDeg: cfg.tilt,
        rotationPeriodDays: cfg.rotPeriod,
      });
    });

    // 3. Earth's Moon in Realistic Physical System (~384,400 km from Earth)
    const earthNode = realPlanetNodes.find((p) => p.id === 'earth')!;
    const realMoonOrbitLine = createOrbitLine('#cbd5e1');
    realMoonOrbitLine.scale.set(1.35, 1.35, 1.35);
    realMoonOrbitLine.rotation.x = 5.14 * DEG_TO_RAD;
    earthNode.group.add(realMoonOrbitLine);

    const realMoonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 28, 28),
      new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.9,
        metalness: 0.04,
      })
    );
    realMoonMesh.castShadow = true;
    realMoonMesh.receiveShadow = true;
    realMoonMesh.userData = { id: 'moon' };
    earthNode.group.add(realMoonMesh);

    // Deep cosmic star field (shared distant background stars)
    const realStarsCount = 800;
    const realStarsPos = new Float32Array(realStarsCount * 3);
    for (let i = 0; i < realStarsCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120.0;
      realStarsPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      realStarsPos[i * 3 + 1] = r * Math.cos(phi);
      realStarsPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const realStarsGeo = new THREE.BufferGeometry();
    realStarsGeo.setAttribute('position', new THREE.BufferAttribute(realStarsPos, 3));
    const realStarsPoints = new THREE.Points(
      realStarsGeo,
      new THREE.PointsMaterial({
        color: '#e2e8f0',
        size: 1.0,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: false,
      })
    );
    realisticSolarSystemGroup.add(realStarsPoints);

    // =========================================================================
    // 7. Raycasting & Interaction
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const isPhysical = stateRef.current.cosmologyMode === 'REALISTIC_PHYSICAL';
      if (isPhysical) {
        const realMeshes = [
          realSunMesh,
          realMoonMesh,
          ...realPlanetNodes.map((n) => n.mesh),
        ];
        const hits = raycaster.intersectObjects(realMeshes);
        if (hits.length > 0) {
          const hitId = hits[0].object.userData?.id;
          if (hitId) onSelectSphereRef.current(hitId);
        }
        return;
      }

      // Classical Geocentric raycasting
      const mansionHits = raycaster.intersectObjects(mansionNodes);
      if (mansionHits.length > 0) {
        const num = mansionHits[0].object.userData.mansionNumber;
        if (num) {
          onSelectMansionRef.current(num);
          return;
        }
      }

      const planetMeshes = [earthMesh, sunMesh, moonMesh, ...planetaryNodes.map((p) => p.planetMesh)];
      const hits = raycaster.intersectObjects(planetMeshes);
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        if (hitObj === earthMesh) onSelectSphereRef.current('earth');
        else if (hitObj === sunMesh) onSelectSphereRef.current('sun');
        else if (hitObj === moonMesh) onSelectSphereRef.current('moon');
        else {
          const found = planetaryNodes.find((p) => p.planetMesh === hitObj);
          if (found) onSelectSphereRef.current(found.id);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // =========================================================================
    // 8. Window Resize
    // =========================================================================
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 9. 60 FPS RENDER LOOP: DIURNAL MOTION + PROPER MOTIONS + DAMPED ZOOM
    // =========================================================================
    let animationFrameId: number;
    let lastTime = performance.now();
    let currentJD = stateRef.current.simJulianDay || 2460389.629;
    let lastTimeSync = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const state = stateRef.current;
      const currentSpheres = spheresRef.current;

      // -----------------------------------------------------------------------
      // TIME PROPAGATION: STRICTLY MATHEMATICAL & ASTRONOMICAL (NO RANDOM DELTAS)
      // -----------------------------------------------------------------------
      if (!state.isPaused) {
        // state.timeSpeed multiplier: seconds of simulation time per real second
        // 1 day = 86400 seconds
        const dayAdvance = (delta * state.timeSpeed) / 86400.0;
        currentJD += dayAdvance;
      } else if (state.simJulianDay && Math.abs(currentJD - state.simJulianDay) > 0.000001) {
        // Instantaneous synchronization when paused and user changes date/time via UI
        currentJD = state.simJulianDay;
      }

      // Throttled notification of calculated JD back to UI (every ~150ms)
      const nowPerf = performance.now();
      if (!state.isPaused && nowPerf - lastTimeSync > 150) {
        lastTimeSync = nowPerf;
        onTimeUpdateRef.current?.(currentJD);
      }

      // -----------------------------------------------------------------------
      // Smooth Dynamic Camera Presets
      // -----------------------------------------------------------------------
      const isPhysical = state.cosmologyMode === 'REALISTIC_PHYSICAL';

      if (isPhysical) {
        if (state.cameraPreset === 'COSMIC') {
          _vec3TargetPos.set(0, 36, 52);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'POLAR_NORTH') {
          _vec3TargetPos.set(0, 64, 0.1);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'sun') {
          _vec3TargetPos.set(0, 4.5, 9);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'moon') {
          realMoonMesh.getWorldPosition(_vec3A);
          _vec3TargetPos.set(_vec3A.x + 1.2, _vec3A.y + 0.6, _vec3A.z + 1.2);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3A, 0.05);
        } else if (state.cameraPreset) {
          const targetNode = realPlanetNodes.find((p) => p.id === state.cameraPreset);
          if (targetNode) {
            targetNode.mesh.getWorldPosition(_vec3A);
            const offset = ['jupiter', 'saturn'].includes(targetNode.id)
              ? 4.5
              : ['uranus', 'neptune'].includes(targetNode.id)
              ? 3.2
              : 2.2;
            _vec3TargetPos.set(_vec3A.x + offset, _vec3A.y + offset * 0.5, _vec3A.z + offset);
            camera.position.lerp(_vec3TargetPos, 0.05);
            controls.target.lerp(_vec3A, 0.05);
          }
        }
      } else {
        // Classical Geocentric Camera Presets
        if (state.cameraPreset === 'COSMIC') {
          _vec3TargetPos.set(26, 20, 36);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'EARTH_CLOSE' || state.cameraPreset === 'earth') {
          _vec3TargetPos.set(2.8, 1.8, 3.2);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.06);
          controls.target.lerp(_vec3TargetLook, 0.06);
        } else if (state.cameraPreset === 'MOON_PHASE') {
          moonMesh.getWorldPosition(_vec3A);
          _vec3TargetPos.set(_vec3A.x * 1.5, _vec3A.y + 2, _vec3A.z * 1.5);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3A, 0.05);
        } else if (state.cameraPreset === 'ECLIPTIC_SIDE') {
          _vec3TargetPos.set(46, 0.5, 0);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'POLAR_NORTH') {
          _vec3TargetPos.set(0, 52, 0.1);
          _vec3TargetLook.set(0, 0, 0);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3TargetLook, 0.05);
        } else if (state.cameraPreset === 'sun') {
          sunMesh.getWorldPosition(_vec3A);
          _vec3TargetPos.set(_vec3A.x * 1.35, _vec3A.y + 2.5, _vec3A.z * 1.35);
          camera.position.lerp(_vec3TargetPos, 0.05);
          controls.target.lerp(_vec3A, 0.05);
        } else if (['mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(state.cameraPreset || '')) {
          const targetNode = planetaryNodes.find((p) => p.id === state.cameraPreset);
          if (targetNode) {
            targetNode.planetMesh.getWorldPosition(_vec3A);
            _vec3TargetPos.set(_vec3A.x + 2.8, _vec3A.y + 2.0, _vec3A.z + 2.8);
            camera.position.lerp(_vec3TargetPos, 0.05);
            controls.target.lerp(_vec3A, 0.05);
          }
        }
      }

      controls.update();

      // Dual Cosmology Modes Visibility & Lighting
      geocentricRootGroup.visible = !isPhysical;
      realisticSolarSystemGroup.visible = isPhysical;
      sunPointLight.intensity = !isPhysical ? 5.5 : 0;
      realSunLight.intensity = isPhysical ? 6.0 : 0;

      // -----------------------------------------------------------------------
      // REALISTIC PHYSICAL HELIOCENTRIC UPDATE
      // -----------------------------------------------------------------------
      if (isPhysical) {
        const realCalc = calculateRealisticSolarSystemPositions(currentJD, state.scaleMode);

        realCalc.planets.forEach((pPos) => {
          const pNode = realPlanetNodes.find((n) => n.id === pPos.id);
          if (pNode) {
            pNode.group.position.set(pPos.x, pPos.y, pPos.z);
            pNode.orbitLine.scale.set(pPos.orbitRadius, pPos.orbitRadius, pPos.orbitRadius);
            pNode.orbitLine.visible = state.showOrbits;
            // Diurnal spin around tilted axis
            const spinAngle = ((currentJD / pNode.rotationPeriodDays) * Math.PI * 2) % (Math.PI * 2);
            pNode.mesh.rotation.y = spinAngle;
          }
        });

        // Earth's Moon relative to Earth
        const moonPos = realCalc.moon;
        const relMoonX = moonPos.x - realCalc.earthPos.x;
        const relMoonY = moonPos.y - realCalc.earthPos.y;
        const relMoonZ = moonPos.z - realCalc.earthPos.z;
        realMoonMesh.position.set(relMoonX, relMoonY, relMoonZ);
        realMoonOrbitLine.scale.set(moonPos.orbitRadius, moonPos.orbitRadius, moonPos.orbitRadius);
        realMoonOrbitLine.visible = state.showOrbits;
        realMoonMesh.rotation.y = (moonPos.heliocentricLongitudeDeg * DEG_TO_RAD);

        // Sun axial rotation (~25 days differential equator)
        realSunMesh.rotation.y = ((currentJD / 25.05) * Math.PI * 2) % (Math.PI * 2);

        renderer.render(scene, camera);
        return;
      }

      // -----------------------------------------------------------------------
      // CLASSICAL GEOCENTRIC UPDATE (FALAK AL-ATLAS & PTOLEMAIC KINEMATICS)
      // -----------------------------------------------------------------------
      // 1. PRIMARY DIURNAL MOTION via FALAK AL-ATLAS (24-hour East-to-West cycle)
      // Derived strictly from Local Sidereal Time (θ) for observer longitude!
      const sidereal = calculateSiderealTime(currentJD, state.selectedLocation.longitude);
      if (state.isAtlasAutoRotating) {
        falakAtlasGroup.rotation.y = sidereal.diurnalRotationRad;
      }

      // Visibility toggles
      equatorialGraticuleGroup.visible = state.showEquatorRing || state.showEquatorialGrid;
      eclipticCoordGroup.visible = state.showEclipticRing;
      equinoxSolsticeGroup.visible = state.showSolsticeEquinoxMarkers;
      mansionsGroup.visible = state.showLunarMansions;
      starFieldPoints.visible = state.showFixedStars;
      observerGroup.visible = state.showObserverHorizon;

      // -----------------------------------------------------------------------
      // EXPLODED SPHERES EXPANSION FACTOR (تفكيك الأفلاك)
      // -----------------------------------------------------------------------
      const explodeFactor = state.explodedAmount || 0;
      const sunExplodeDist = SUN_DISTANCE * (1 + explodeFactor * 0.3);
      const moonExplodeDist = MOON_DISTANCE * (1 + explodeFactor * 0.15);

      const outerScale = 1 + explodeFactor * 0.22;
      equatorialGraticuleGroup.scale.set(outerScale, outerScale, outerScale);
      eclipticCoordGroup.scale.set(outerScale, outerScale, outerScale);

      // -----------------------------------------------------------------------
      // 2. MATHEMATICAL SUN PROPER MOTION IN ECLIPTIC PLANE
      // True Ecliptic Longitude λ derived from Al-Battani Equation of Center
      // -----------------------------------------------------------------------
      const sunEphem = calculateSunEphemerisByJD(currentJD, state.obliquityDeg);
      const sunDist = sunExplodeDist * sunEphem.sunDistanceFactor;
      const sunX = sunDist * Math.cos(sunEphem.eclipticLongitudeRad);
      const sunZ = sunDist * Math.sin(sunEphem.eclipticLongitudeRad);

      sunMesh.position.set(sunX, 0, sunZ);

      // -----------------------------------------------------------------------
      // 3. MATHEMATICAL MOON PROPER MOTION & PHASE (West-to-East, ~27.32 days)
      // Pure geometric phase emerges from Sun's PointLight + exact spatial angle!
      // -----------------------------------------------------------------------
      const moonEphem = calculateMoonEphemerisByJD(currentJD, state.obliquityDeg);
      const mLongRad = moonEphem.eclipticLongitudeDeg * DEG_TO_RAD;
      const mLatRad = moonEphem.eclipticLatitudeDeg * DEG_TO_RAD;

      const moonX = moonExplodeDist * Math.cos(mLongRad) * Math.cos(mLatRad);
      const moonY = moonExplodeDist * Math.sin(mLatRad);
      const moonZ = moonExplodeDist * Math.sin(mLongRad) * Math.cos(mLatRad);

      moonMesh.position.set(moonX, moonY, moonZ);

      // Update Lunar Ray to active Lunar Mansion
      if (state.showLunarMansions) {
        const activeNum = moonEphem.mansionIndex || state.selectedMansionNumber || 1;
        const targetNode = mansionNodes[activeNum - 1];
        if (targetNode) {
          const rayPositions = lunarRayLine.geometry.attributes.position;
          rayPositions.setXYZ(0, moonX, moonY, moonZ);
          rayPositions.setXYZ(1, targetNode.position.x * outerScale, targetNode.position.y * outerScale, targetNode.position.z * outerScale);
          rayPositions.needsUpdate = true;
          lunarRayLine.visible = true;
        }
      } else {
        lunarRayLine.visible = false;
      }

      // -----------------------------------------------------------------------
      // 4. PLANETARY SECONDARY PROPER MOTIONS & EPICYCLES
      // -----------------------------------------------------------------------
      const planetsData = calculatePlanetsPositionsByJD(currentJD, sunEphem.eclipticLongitudeDeg, explodeFactor);
      planetaryNodes.forEach((node) => {
        const sData = currentSpheres.find((s) => s.id === node.id);
        if (!sData) return;

        // When in Textbook Core Mode or if planets are toggled off, hide all 5 planetary spheres!
        const isVisible =
          state.showPlanets &&
          state.textbookFocusMode !== 'CORE_EARTH_SUN_MOON' &&
          sData.visible;

        node.group.visible = isVisible;
        node.trailLine.visible = isVisible && sData.showRetrogradeTrail && state.showRetrogradeTrails;

        if (!isVisible) return;
        const pCalc = planetsData.find((p) => p.id === node.id);
        if (!pCalc) return;

        const explodeMult = 1 + explodeFactor * ((sData.order - 1) * 0.08);
        const effDeferentR = node.deferentRadius * explodeMult;

        const defX = effDeferentR * Math.cos(pCalc.deferentAngleRad);
        const defZ = effDeferentR * Math.sin(pCalc.deferentAngleRad);
        const epiX = node.epicycleRadius * Math.cos(pCalc.deferentAngleRad + pCalc.epicycleAngleRad);
        const epiZ = node.epicycleRadius * Math.sin(pCalc.deferentAngleRad + pCalc.epicycleAngleRad);

        node.deferentGroup.position.set(defX, 0, defZ);
        node.planetMesh.position.set(epiX, 0, epiZ);

        if (sData.showRetrogradeTrail && state.showRetrogradeTrails && !state.isPaused) {
          const posAttr = node.trailLine.geometry.attributes.position as THREE.BufferAttribute;
          const arr = posAttr.array as Float32Array;
          const count = Math.min(node.trailLength + 1, 120);
          for (let i = count - 1; i > 0; i--) {
            arr[i * 3] = arr[(i - 1) * 3];
            arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
            arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
          }
          arr[0] = defX + epiX;
          arr[1] = 0;
          arr[2] = defZ + epiZ;
          node.trailLength = count;
          posAttr.needsUpdate = true;
          node.trailLine.geometry.setDrawRange(0, count);
        }
      });

      // Update Observer Latitude/Longitude on Earth
      observerGroup.visible = state.showObserverHorizon;
      if (state.showObserverHorizon) {
        const obsLat = state.selectedLocation.latitude;
        const obsLon = state.selectedLocation.longitude;
        const obsPhi = (90 - obsLat) * DEG_TO_RAD;
        const obsTheta = (obsLon + 180) * DEG_TO_RAD;
        const oR = 1.62;
        observerGroup.position.set(
          -oR * Math.sin(obsPhi) * Math.cos(obsTheta),
          oR * Math.cos(obsPhi),
          oR * Math.sin(obsPhi) * Math.sin(obsTheta)
        );
        _obsNormal.copy(observerGroup.position).normalize();
        observerGroup.quaternion.setFromUnitVectors(_upVector, _obsNormal);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full absolute inset-0 overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing"
    />
  );
};
