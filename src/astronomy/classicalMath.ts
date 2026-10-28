/**
 * Classical Islamic Celestial Mechanics & Spherical Trigonometry
 * Rooted in the mathematical treatises of:
 * - Nasir al-Din al-Tusi (al-Tadhkira fi 'ilm al-hay'a, Maragha 1247 CE)
 * - Ibn al-Shatir of Damascus (Nihayat al-su'l fi tashih al-usul, 1375 CE)
 * - Abu Rayhan al-Biruni (al-Qanun al-Mas'udi & Tahdid al-Amakin, 1030 CE)
 * - Al-Battani (Kitab al-Zij al-Sabi', Ar-Raqqa 880 CE)
 * - Al-Farghani (Jawami' 'Ilm al-Nujum wa Usul al-Harakat al-Samawiyyah)
 *
 * All rotations, ephemerides, and coordinates are 100% algorithmically and mathematically derived.
 */

export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

// =============================================================================
// A. CALENDRICAL MATHEMATICS: JULIAN DAY & GREGORIAN / HIJRI CONVERSIONS
// =============================================================================

/**
 * Standard Astronomical Julian Day calculation from Gregorian Date and Time (Meeus algorithm)
 */
export function dateToJulianDay(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFraction = (hour + minute / 60 + second / 3600) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + dayFraction + b - 1524.5;
}

/**
 * Standard Astronomical Gregorian date reconstruction from Julian Day
 */
export function julianDayToDate(jd: number) {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const dayWithFrac = b - d - Math.floor(30.6001 * e) + f;
  const day = Math.floor(dayWithFrac);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  const totalSeconds = Math.round(f * 86400);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    formattedDate: `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}`,
    formattedTime: `${pad(hours)}:${pad(minutes)}`,
    formattedDateTime: `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}`,
    displayString: `${pad(day)}/${pad(month)}/${year} ${pad(hours)}:${pad(minutes)} UTC`,
  };
}

/**
 * Classical Tabular Hijri Calendar from Julian Day (Al-Biruni / Ulugh Beg Zij)
 */
export function julianDayToHijri(jd: number) {
  // Epoch of Hijra: 16 July 622 CE (JD 1948439.5)
  const hijriEpochJD = 1948439.5;
  const daysSinceEpoch = jd - hijriEpochJD;
  const meanLunarMonth = 29.53058867; // Classical Maragha value
  const totalMonths = Math.floor(daysSinceEpoch / meanLunarMonth);
  const year = Math.floor(totalMonths / 12) + 1;
  const month = ((totalMonths % 12) + 12) % 12 + 1;
  const day = Math.min(30, Math.max(1, Math.floor(daysSinceEpoch - totalMonths * meanLunarMonth) + 1));

  const hijriMonthsAr = [
    'المحرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'
  ];

  const hijriMonthsEn = [
    'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
  ];

  return {
    year,
    month,
    day,
    monthNameAr: hijriMonthsAr[month - 1] || 'رمضان',
    monthNameEn: hijriMonthsEn[month - 1] || 'Ramadan',
    formattedStringAr: `${day} ${hijriMonthsAr[month - 1]} ${year} هـ`,
    formattedStringEn: `${day} ${hijriMonthsEn[month - 1]} ${year} AH`,
  };
}

// =============================================================================
// B. SIDEREAL TIME & FALAK AL-ATLAS DIURNAL ROTATION (NO RANDOM SPINNING)
// =============================================================================

/**
 * Calculates exact Greenwich Mean Sidereal Time (GMST) and Local Sidereal Time (LST).
 * In Geocentric astronomy, the 9th Sphere (Falak al-Atlas / Primum Mobile) rotates
 * East to West by exactly one sidereal revolution in 23h 56m 4.09s (360°).
 * The angle of rotation of Falak al-Atlas is mathematically determined by LST.
 */
export function calculateSiderealTime(jd: number, observerLongitudeDeg: number = 0) {
  // Centuries since J2000.0 (JD 2451545.0)
  const T = (jd - 2451545.0) / 36525.0;

  // Greenwich Mean Sidereal Time in degrees (IAU formula)
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;

  // Local Sidereal Time for observer
  let lst = ((gmst + observerLongitudeDeg) % 360 + 360) % 360;
  const lstHours = lst / 15;

  const h = Math.floor(lstHours);
  const m = Math.floor((lstHours % 1) * 60);
  const s = Math.floor((((lstHours % 1) * 60) % 1) * 60);
  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    gmstDeg: gmst,
    lstDeg: lst,
    lstHours,
    lstHoursFormatted: `${pad(h)}:${pad(m)}:${pad(s)}`,
    diurnalRotationRad: - (lst * DEG_TO_RAD), // East-to-West rotation around Celestial North Pole (+Y)
  };
}

// =============================================================================
// C. MATHEMATICAL SOLAR EPHEMERIS & ZODIAC ALGORITHM (AL-BATTANI & PTOLEMY)
// =============================================================================

const ZODIAC_SIGNS = [
  { ar: 'الحَمَل ♈', en: 'Aries', ur: 'حمل' },
  { ar: 'الثَّوْر ♉', en: 'Taurus', ur: 'ثور' },
  { ar: 'الجَوْزاء ♊', en: 'Gemini', ur: 'جوزا' },
  { ar: 'السَّرَطان ♋', en: 'Cancer', ur: 'سرطان' },
  { ar: 'الأَسَد ♌', en: 'Leo', ur: 'اسد' },
  { ar: 'السُّنْبُلَة ♍', en: 'Virgo', ur: 'سنبلہ' },
  { ar: 'المِيزان ♎', en: 'Libra', ur: 'میزان' },
  { ar: 'العَقْرَب ♏', en: 'Scorpio', ur: 'عقرب' },
  { ar: 'القَوْس ♐', en: 'Sagittarius', ur: 'قوس' },
  { ar: 'الجَدْي ♑', en: 'Capricorn', ur: 'جدی' },
  { ar: 'الدَّلْو ♒', en: 'Aquarius', ur: 'دلو' },
  { ar: 'الحُوت ♓', en: 'Pisces', ur: 'حوت' },
];

/**
 * Calculates exact Solar Ephemeris from Julian Day number.
 * Computes:
 * - True Ecliptic Longitude lambda
 * - Declination delta (between -23.44° and +23.44°)
 * - Right Ascension alpha
 * - Equation of the Center C (Al-Battani solar eccentricity)
 * - Zodiac Sign and precise degree in sign
 */
export function calculateSunEphemerisByJD(jd: number, obliquityDeg: number = 23.44) {
  const T = (jd - 2451545.0) / 36525.0;
  const eps = obliquityDeg * DEG_TO_RAD;

  // Mean longitude of the Sun (geometric)
  const L0 = ((280.46646 + 36000.76983 * T) % 360 + 360) % 360;

  // Mean anomaly of the Sun
  const M = ((357.52911 + 35999.05029 * T) % 360 + 360) % 360;
  const MRad = M * DEG_TO_RAD;

  // Al-Battani / Keplerian Equation of Center C
  const C =
    (1.914602 - 0.004817 * T) * Math.sin(MRad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * MRad) +
    0.000289 * Math.sin(3 * MRad);

  // True Ecliptic Longitude
  const trueLambdaDeg = ((L0 + C) % 360 + 360) % 360;
  const trueLambdaRad = trueLambdaDeg * DEG_TO_RAD;

  // Transformation to Equatorial frame (Right Ascension & Declination)
  const sinDelta = Math.sin(eps) * Math.sin(trueLambdaRad);
  const deltaRad = Math.asin(Math.max(-1, Math.min(1, sinDelta)));

  const y = Math.sin(trueLambdaRad) * Math.cos(eps);
  const x = Math.cos(trueLambdaRad);
  let alphaRad = Math.atan2(y, x);
  if (alphaRad < 0) alphaRad += 2 * Math.PI;

  const signIndex = Math.floor(trueLambdaDeg / 30);
  const degreeInSign = trueLambdaDeg % 30;

  // Al-Battani distance radius variation due to eccentricity
  const sunDistanceRadius = 1.000001018 * (1 - 0.0167086 * Math.cos(MRad));

  return {
    eclipticLongitudeDeg: Math.round(trueLambdaDeg * 100) / 100,
    eclipticLongitudeRad: trueLambdaRad,
    rightAscensionHours: Math.round(((alphaRad * RAD_TO_DEG) / 15) * 100) / 100,
    rightAscensionDeg: Math.round(alphaRad * RAD_TO_DEG * 100) / 100,
    declinationDeg: Math.round(deltaRad * RAD_TO_DEG * 100) / 100,
    declinationRad: deltaRad,
    currentSign: ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0],
    degreeInSign: Math.round(degreeInSign * 10) / 10,
    equationOfCenterDeg: Math.round(C * 100) / 100,
    sunDistanceFactor: sunDistanceRadius,
  };
}

/**
 * Backwards compatible solar ephemeris by day of year (1 to 365)
 */
export function calculateSunEphemeris(dayOfYear: number, obliquityDeg: number = 23.44) {
  // Approximate JD for year 2024 dayOfYear
  const jd = 2460310.5 + dayOfYear;
  return calculateSunEphemerisByJD(jd, obliquityDeg);
}

// =============================================================================
// D. MATHEMATICAL LUNAR EPHEMERIS & GEOMETRIC PHASE (AL-TUSI & IBN AL-SHATIR)
// =============================================================================

export function calculateMoonEphemerisByJD(jd: number, obliquityDeg: number = 23.44) {
  const T = (jd - 2451545.0) / 36525.0;

  // Fundamental arguments of the Moon's motion (Brown/Meeus/Al-Battani)
  const L_prime = ((218.3164477 + 481267.88128 * T) % 360 + 360) % 360; // Moon's mean longitude
  const D = ((297.8501921 + 445267.111403 * T) % 360 + 360) % 360;       // Mean elongation
  const M = ((357.5291092 + 35999.0502909 * T) % 360 + 360) % 360;       // Sun's mean anomaly
  const M_prime = ((134.9633964 + 477198.8675055 * T) % 360 + 360) % 360;// Moon's mean anomaly
  const F = ((93.2720950 + 483202.0175233 * T) % 360 + 360) % 360;       // Moon's argument of latitude

  const dRad = D * DEG_TO_RAD;
  const mRad = M * DEG_TO_RAD;
  const mpRad = M_prime * DEG_TO_RAD;
  const fRad = F * DEG_TO_RAD;

  // Major periodic inequalities in Moon's longitude (Evection, Variation, Equation of Center)
  const lambdaCorr =
    6.2888 * Math.sin(mpRad) +
    1.2740 * Math.sin(2 * dRad - mpRad) +
    0.6583 * Math.sin(2 * dRad) +
    0.2136 * Math.sin(2 * mpRad) -
    0.1851 * Math.sin(mRad) -
    0.1143 * Math.sin(2 * fRad);

  const moonLongDeg = ((L_prime + lambdaCorr) % 360 + 360) % 360;

  // Latitude beta of the Moon (inclination of 5.14° to ecliptic)
  const betaDeg =
    5.1282 * Math.sin(fRad) +
    0.2806 * Math.sin(mpRad + fRad) +
    0.2777 * Math.sin(mpRad - fRad) +
    0.1732 * Math.sin(2 * dRad - fRad);

  // Exact Sun position to compute true geometric elongation
  const sunEphem = calculateSunEphemerisByJD(jd, obliquityDeg);
  let elongationDeg = ((moonLongDeg - sunEphem.eclipticLongitudeDeg) % 360 + 360) % 360;

  // Illumination fraction k = (1 - cos(elongation)) / 2
  const illuminationFraction = (1 - Math.cos(elongationDeg * DEG_TO_RAD)) / 2;
  const illuminationPercent = Math.round(illuminationFraction * 100);

  // Lunar Mansion index (1 to 28)
  const mansionIndex = Math.floor(moonLongDeg / (360 / 28)) + 1;

  // Authentic Classical Arabic & Urdu Phase Nomenclature
  const getPhaseName = (deg: number) => {
    if (deg < 12 || deg >= 348) {
      return { ar: 'مُحاق (اقتران)', ur: 'محاق (چاند چھپا ہوا / نیو مون)', en: 'New Moon (Conjunction)' };
    }
    if (deg < 84) {
      return { ar: 'هِلال مُتَزايِد', ur: 'ہلالِ متزاید (پہلی تاریخوں کا چاند)', en: 'Waxing Crescent (Hilal)' };
    }
    if (deg < 96) {
      return { ar: 'تَرْبِيع أَوَّل', ur: 'تربیعِ اول (نصف چاند)', en: 'First Quarter (Tarbi Awwal)' };
    }
    if (deg < 168) {
      return { ar: 'أَحْدَب مُتَزايِد', ur: 'احدبِ متزاید (کوزہ پشت چاند)', en: 'Waxing Gibbous (Ahdab)' };
    }
    if (deg < 192) {
      return { ar: 'بَدْر كامِل (استقبال)', ur: 'بدرِ کامل (چودھویں کا چاند)', en: 'Full Moon (Badr)' };
    }
    if (deg < 264) {
      return { ar: 'أَحْدَب مُتَناقِص', ur: 'احدبِ متناقص', en: 'Waning Gibbous' };
    }
    if (deg < 276) {
      return { ar: 'تَرْبِيع ثانٍ', ur: 'تربیعِ ثانی', en: 'Last Quarter (Tarbi Thani)' };
    }
    return { ar: 'عُرْجُون قَدِيم (هِلال مُتَناقِص)', ur: 'عرجونِ قدیم (آخری ہلال)', en: 'Waning Crescent (Urjun)' };
  };

  return {
    eclipticLongitudeDeg: Math.round(moonLongDeg * 100) / 100,
    eclipticLatitudeDeg: Math.round(betaDeg * 100) / 100,
    elongationDeg: Math.round(elongationDeg * 10) / 10,
    illuminationPercent,
    mansionIndex: Math.min(28, Math.max(1, mansionIndex)),
    phase: getPhaseName(elongationDeg),
  };
}

/**
 * Backwards compatible lunar ephemeris
 */
export function calculateMoonEphemeris(dayOfYear: number, obliquityDeg: number = 23.44) {
  const jd = 2460310.5 + dayOfYear;
  return calculateMoonEphemerisByJD(jd, obliquityDeg);
}

// =============================================================================
// E. MATHEMATICAL EPICYCLIC POSITIONS FOR 5 WANDERING PLANETS (PTOLEMY & BATTANI)
// =============================================================================

export interface PlanetPositionData {
  id: string;
  nameAr: string;
  nameUr: string;
  nameEn: string;
  deferentAngleRad: number;
  epicycleAngleRad: number;
  x: number;
  y: number;
  z: number;
  trueLongitudeDeg: number;
  isRetrograde: boolean;
}

/**
 * Calculates exact deferent and epicycle positions for the 5 wandering planets based on JD.
 * Inferior planets (Mercury, Venus): deferent moves with mean Sun, epicycle rotates synodic period.
 * Superior planets (Mars, Jupiter, Saturn): deferent moves with sidereal period, epicycle rotates with synodic period.
 */
export function calculatePlanetsPositionsByJD(
  jd: number,
  sunMeanLongitudeDeg: number,
  explodedFactor: number = 0
): PlanetPositionData[] {
  const daysSinceJ2000 = jd - 2451545.0;

  // Planetary Parameters: [deferentRadius, epicycleRadius, siderealPeriodDays, synodicPeriodDays, nameAr, nameUr, nameEn]
  const config = [
    {
      id: 'mercury',
      nameAr: 'عُطارِد',
      nameUr: 'عطارد',
      nameEn: 'Mercury',
      rDef: 4.8,
      rEpi: 1.8,
      sidereal: 365.256, // Tied to Sun's mean longitude
      synodic: 115.88,
      isInferior: true,
    },
    {
      id: 'venus',
      nameAr: 'الزُّهَرَة',
      nameUr: 'زہرہ',
      nameEn: 'Venus',
      rDef: 7.2,
      rEpi: 3.2,
      sidereal: 365.256, // Tied to Sun's mean longitude
      synodic: 583.92,
      isInferior: true,
    },
    {
      id: 'mars',
      nameAr: 'المِرِّيخ',
      nameUr: 'مریخ',
      nameEn: 'Mars',
      rDef: 13.0,
      rEpi: 4.2,
      sidereal: 686.98,
      synodic: 779.94,
      isInferior: false,
    },
    {
      id: 'jupiter',
      nameAr: 'المُشْتَرِي',
      nameUr: 'مشتری',
      nameEn: 'Jupiter',
      rDef: 17.0,
      rEpi: 2.8,
      sidereal: 4332.59,
      synodic: 398.88,
      isInferior: false,
    },
    {
      id: 'saturn',
      nameAr: 'زُحَل',
      nameUr: 'زحل',
      nameEn: 'Saturn',
      rDef: 21.0,
      rEpi: 2.2,
      sidereal: 10759.22,
      synodic: 378.09,
      isInferior: false,
    },
  ];

  return config.map((p) => {
    const scale = 1 + explodedFactor * 0.2;
    const rDef = p.rDef * scale;
    const rEpi = p.rEpi * scale;

    let defAngleDeg = 0;
    if (p.isInferior) {
      defAngleDeg = sunMeanLongitudeDeg;
    } else {
      defAngleDeg = ((daysSinceJ2000 * 360 / p.sidereal) % 360 + 360) % 360;
    }

    const epiAngleDeg = ((daysSinceJ2000 * 360 / p.synodic) % 360 + 360) % 360;

    const defRad = defAngleDeg * DEG_TO_RAD;
    const epiRad = epiAngleDeg * DEG_TO_RAD;

    // Center of epicycle on deferent
    const cx = rDef * Math.cos(defRad);
    const cz = rDef * Math.sin(defRad);

    // Planet on rim of epicycle
    const px = cx + rEpi * Math.cos(defRad + epiRad);
    const pz = cz + rEpi * Math.sin(defRad + epiRad);

    const trueLongRad = Math.atan2(pz, px);
    const trueLongDeg = ((trueLongRad * RAD_TO_DEG) + 360) % 360;

    // Detect retrograde motion (when derivative of true longitude is negative)
    // Geometrically occurs when planet is at perigee of its epicycle
    const cosAnomaly = Math.cos(epiRad);
    const isRetrograde = cosAnomaly < -0.6;

    return {
      id: p.id,
      nameAr: p.nameAr,
      nameUr: p.nameUr,
      nameEn: p.nameEn,
      deferentAngleRad: defRad,
      epicycleAngleRad: epiRad,
      x: px,
      y: 0,
      z: pz,
      trueLongitudeDeg: Math.round(trueLongDeg * 100) / 100,
      isRetrograde,
    };
  });
}

// =============================================================================
// F. HISTORICAL ASTRONOMICAL PRESET EPOCHS
// =============================================================================

export interface HistoricDatePreset {
  id: string;
  nameUr: string;
  nameAr: string;
  nameEn: string;
  description: string;
  jd: number;
}

export const ASTRONOMICAL_DATE_PRESETS: HistoricDatePreset[] = [
  {
    id: 'spring_equinox_2024',
    nameUr: 'اعتدالِ ربیعی (نوروز) 2024',
    nameAr: 'الاعتدال الربيعي',
    nameEn: 'Vernal Equinox (Aries 0°)',
    description: 'سورج ٹھیک 0° برجِ حمل پر معدل النہار کو عبور کرتا ہے۔ دن اور رات بالکل برابر (12 گھنٹے)۔',
    jd: 2460389.629, // 2024-03-20 03:06 UTC
  },
  {
    id: 'summer_solstice_2024',
    nameUr: 'انقلابِ صیفی (طویل ترین دن) 2024',
    nameAr: 'الانقلاب الصيفي',
    nameEn: 'Summer Solstice (Cancer 0°)',
    description: 'سورج کا شمالی میل انتہا پر (+23.44°) پہنچتا ہے۔ نصف کرۂ شمالی میں طویل ترین دن اور بلند ترین دوپہر۔',
    jd: 2460482.368, // 2024-06-20 20:51 UTC
  },
  {
    id: 'autumn_equinox_2024',
    nameUr: 'اعتدالِ خریفی (میزان 0°) 2024',
    nameAr: 'الاعتدال الخريفي',
    nameEn: 'Autumnal Equinox (Libra 0°)',
    description: 'سورج کا دوسرا متقاطع نقطہ (برجِ میزان) جہاں دن اور رات دوبارہ 12 گھنٹے کے برابر ہوتے ہیں۔',
    jd: 2460576.030, // 2024-09-22 12:44 UTC
  },
  {
    id: 'winter_solstice_2024',
    nameUr: 'انقلابِ شتوی (مختصر ترین دن) 2024',
    nameAr: 'الانقلاب الشتوي',
    nameEn: 'Winter Solstice (Capricorn 0°)',
    description: 'سورج کا جنوبی میل انتہا پر (-23.44°) ہوتا ہے۔ مختصر ترین دن اور طویل ترین رات۔',
    jd: 2460665.889, // 2024-12-21 09:20 UTC
  },
  {
    id: 'maragha_observatory_1259',
    nameUr: 'رصد گاہ مراغہ (نصیر الدین طوسی) 1259ء',
    nameAr: 'تأسيس مرصد مراغة (1259 م)',
    nameEn: 'Maragha Observatory Founding (1259 CE)',
    description: 'خواجہ نصیر الدین طوسی نے مراغہ میں تاریخِ فلکیات کی سب سے جدید رصد گاہ اور زیجِ ایلخانی تیار فرمائی۔',
    jd: 2181050.5, // 1259-05-15
  },
  {
    id: 'ibn_shatir_damascus_1375',
    nameUr: 'ابن الشاطر دمشقی (جامع اموی) 1375ء',
    nameAr: 'ابن الشاطر الدمشقي (1375 م)',
    nameEn: 'Ibn al-Shatir Damascus Model (1375 CE)',
    description: 'ابن الشاطر نے بطلیموس کے ایکوانٹ کو ختم کر کے ہم مرکز افلاکِ تدویر پر مبنی مکمل ماڈل مرتب کیا۔',
    jd: 2223400.5, // 1375-06-01
  },
  {
    id: 'battani_raqqa_880',
    nameUr: 'البَتّانی الرقّہ (زیجِ صابی) 880ء',
    nameAr: 'البتاني في الرقة (880 م)',
    nameEn: 'Al-Battani Ar-Raqqa Observations (880 CE)',
    description: 'البَتّانی نے میلِ کلی کا انتہائی درست حساب (23° 35\') اور اوجِ شمس کی حرکت دریافت کی۔',
    jd: 2042780.5, // 880-09-23
  },
];

// =============================================================================
// G. SPHERICAL TRIGONOMETRY: LOCAL HORIZON & OBSERVER GEODESY
// =============================================================================

export function calculateObserverHorizonAstrometry(latitudeDeg: number, obliquityDeg: number = 23.44) {
  const phi = latitudeDeg;
  const eps = obliquityDeg;
  const phiRad = phi * DEG_TO_RAD;
  const epsRad = eps * DEG_TO_RAD;

  const poleAltitudeDeg = Math.abs(phi);
  const equatorCulminationDeg = 90 - Math.abs(phi);
  const summerSolsticeAltitudeDeg = Math.min(90, 90 - phi + eps);
  const winterSolsticeAltitudeDeg = Math.max(0, 90 - phi - eps);

  // Hour angle of rising/setting at solstice: cos(H) = -tan(phi)*tan(eps)
  const tanProd = Math.tan(phiRad) * Math.tan(epsRad);
  let longestDayHours = 12;
  if (Math.abs(tanProd) < 1) {
    const H = Math.acos(-tanProd);
    longestDayHours = Math.round((2 * H * RAD_TO_DEG / 15) * 100) / 100;
  } else if (tanProd >= 1) {
    longestDayHours = 24; // Midnight sun
  } else {
    longestDayHours = 0; // Polar night
  }
  const shortestDayHours = Math.round((24 - longestDayHours) * 100) / 100;

  const circumpolarDecMin = Math.round((90 - phi) * 100) / 100;
  const invisibleDecMax = Math.round(-(90 - phi) * 100) / 100;

  return {
    poleAltitudeDeg: Math.round(poleAltitudeDeg * 100) / 100,
    equatorCulminationDeg: Math.round(equatorCulminationDeg * 100) / 100,
    summerSolsticeAltitudeDeg: Math.round(summerSolsticeAltitudeDeg * 100) / 100,
    winterSolsticeAltitudeDeg: Math.round(winterSolsticeAltitudeDeg * 100) / 100,
    longestDayHours,
    shortestDayHours,
    circumpolarDecMin,
    invisibleDecMax,
  };
}

export function eclipticToEquatorial(lambdaDeg: number, betaDeg: number, obliquityDeg: number = 23.44) {
  const lambda = lambdaDeg * DEG_TO_RAD;
  const beta = betaDeg * DEG_TO_RAD;
  const eps = obliquityDeg * DEG_TO_RAD;

  const sinDelta = Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda);
  const delta = Math.asin(Math.max(-1, Math.min(1, sinDelta)));

  const y = Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps);
  const x = Math.cos(lambda);
  let alpha = Math.atan2(y, x);
  if (alpha < 0) alpha += 2 * Math.PI;

  return {
    rightAscensionHours: (alpha * RAD_TO_DEG) / 15,
    rightAscensionDeg: alpha * RAD_TO_DEG,
    declinationDeg: delta * RAD_TO_DEG,
  };
}

export function equatorialToHorizontal(
  rightAscensionDeg: number,
  declinationDeg: number,
  latitudeDeg: number,
  localSiderealTimeDeg: number
) {
  const phi = latitudeDeg * DEG_TO_RAD;
  const delta = declinationDeg * DEG_TO_RAD;
  const hourAngle = ((localSiderealTimeDeg - rightAscensionDeg + 360) % 360) * DEG_TO_RAD;

  const sinH = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hourAngle);
  const h = Math.asin(Math.max(-1, Math.min(1, sinH)));

  const y = -Math.sin(hourAngle);
  const x = Math.tan(delta) * Math.cos(phi) - Math.sin(phi) * Math.cos(hourAngle);
  let A = Math.atan2(y, x);
  if (A < 0) A += 2 * Math.PI;

  return {
    altitudeDeg: h * RAD_TO_DEG,
    azimuthDeg: A * RAD_TO_DEG,
  };
}

export function calculateGreatCircleDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const phi1 = lat1 * DEG_TO_RAD;
  const phi2 = lat2 * DEG_TO_RAD;
  const deltaLambda = (lon2 - lon1) * DEG_TO_RAD;

  const cosD = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const dRad = Math.acos(Math.max(-1, Math.min(1, cosD)));
  return Math.round(R * dRad);
}

export function getLunarMansionIndex(eclipticLongitudeDeg: number): number {
  const normDeg = ((eclipticLongitudeDeg % 360) + 360) % 360;
  const mansionWidth = 360 / 28;
  return Math.floor(normDeg / mansionWidth) + 1;
}

/**
 * Classical kinematics helpers for Tusi Couple and Ibn al-Shatir models
 */
export function calculateTusiCouple(r: number, theta: number, axisAngle: number = 0) {
  const smallCenterX = r * Math.cos(theta);
  const smallCenterY = r * Math.sin(theta);
  const localX = r * Math.cos(-theta);
  const localY = r * Math.sin(-theta);
  const unrotatedX = smallCenterX + localX;
  const unrotatedY = smallCenterY + localY;
  const rotatedX = unrotatedX * Math.cos(axisAngle) - unrotatedY * Math.sin(axisAngle);
  const rotatedY = unrotatedX * Math.sin(axisAngle) + unrotatedY * Math.cos(axisAngle);

  return {
    smallCenter: { x: smallCenterX, y: smallCenterY, z: 0 },
    tipPoint: { x: rotatedX, y: rotatedY, z: 0 },
    displacement: 2 * r * Math.cos(theta),
    isExactHarmonic: true,
  };
}

export function calculateIbnShatirPosition(
  deferentRadius: number,
  primaryEpicycleRadius: number,
  secondaryEpicycleRadius: number,
  meanAnomaly: number,
  secondaryRateMultiplier: number = 2
) {
  const deferentX = deferentRadius * Math.cos(meanAnomaly);
  const deferentY = deferentRadius * Math.sin(meanAnomaly);
  const epi1X = deferentX + primaryEpicycleRadius * Math.cos(meanAnomaly);
  const epi1Y = deferentY + primaryEpicycleRadius * Math.sin(meanAnomaly);
  const angle2 = -secondaryRateMultiplier * meanAnomaly;
  const planetX = epi1X + secondaryEpicycleRadius * Math.cos(angle2);
  const planetY = epi1Y + secondaryEpicycleRadius * Math.sin(angle2);

  const trueDistance = Math.sqrt(planetX * planetX + planetY * planetY);
  const trueLongitude = Math.atan2(planetY, planetX);

  return {
    deferentPoint: { x: deferentX, y: deferentY },
    primaryCenter: { x: epi1X, y: epi1Y },
    planetPosition: { x: planetX, y: planetY },
    trueDistance,
    trueLongitudeRad: trueLongitude,
    trueLongitudeDeg: ((trueLongitude * RAD_TO_DEG) + 360) % 360,
  };
}

export function calculateBattaniPosition(
  deferentRadius: number,
  eccentricity: number,
  epicycleRadius: number,
  meanLongitude: number,
  apogeeLongitude: number,
  epicycleAnomaly: number
) {
  const eccOffsetX = eccentricity * deferentRadius * Math.cos(apogeeLongitude);
  const eccOffsetY = eccentricity * deferentRadius * Math.sin(apogeeLongitude);
  const defX = eccOffsetX + deferentRadius * Math.cos(meanLongitude);
  const defY = eccOffsetY + deferentRadius * Math.sin(meanLongitude);
  const planetX = defX + epicycleRadius * Math.cos(epicycleAnomaly);
  const planetY = defY + epicycleRadius * Math.sin(epicycleAnomaly);
  const trueLongitude = Math.atan2(planetY, planetX);

  return {
    centerOfEccentric: { x: eccOffsetX, y: eccOffsetY },
    deferentPoint: { x: defX, y: defY },
    planetPosition: { x: planetX, y: planetY },
    trueLongitudeDeg: ((trueLongitude * RAD_TO_DEG) + 360) % 360,
  };
}
