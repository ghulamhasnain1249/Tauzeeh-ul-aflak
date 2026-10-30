import React, { useState, useRef, useMemo } from 'react';
import {
  SimulationState,
  CelestialSphere,
  LunarMansion,
} from '../types/celestial';
import {
  LUNAR_MANSIONS_DATA,
  HISTORICAL_OBSERVER_LOCATIONS,
} from '../astronomy/celestialData';
import {
  calculateObserverHorizonAstrometry,
  calculateSunEphemerisByJD,
  calculateMoonEphemerisByJD,
  calculateSiderealTime,
  julianDayToDate,
  julianDayToHijri,
  dateToJulianDay,
  ASTRONOMICAL_DATE_PRESETS,
} from '../astronomy/classicalMath';
import {
  Play,
  Pause,
  Send,
  Sparkles,
  BookOpen,
  X,
  Camera,
  Calendar,
  Clock,
  Compass,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ControlOverlayProps {
  simState: SimulationState;
  spheres: CelestialSphere[];
  inspectedSphere: CelestialSphere | null;
  inspectedMansion: LunarMansion | null;
  onClearInspectedSphere: () => void;
  onClearInspectedMansion: () => void;
  onUpdateState: (updates: Partial<SimulationState>) => void;
  onUpdateSphere: (id: string, updates: Partial<CelestialSphere>) => void;
}

type DrawerTab = 'textbook' | 'ephemeris' | 'spheres' | 'rings' | 'scholar';

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  simState,
  spheres,
  inspectedSphere,
  onClearInspectedSphere,
  onUpdateState,
  onUpdateSphere,
}) => {
  // Navigation & Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('textbook');
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);

  const [isMobileSecondaryOpen, setIsMobileSecondaryOpen] = useState(false);

  // Simulation Speeds Definition & Cycle Helper for Mobile Ergonomics
  const SPEEDS = useMemo(
    () => [
      { label: '1x', val: 1 },
      { label: '1m/s', val: 60 },
      { label: '1h/s', val: 3600 },
      { label: '1d/s', val: 86400 },
      { label: '10d/s', val: 864000 },
    ],
    []
  );

  const currentSpeedLabel = useMemo(() => {
    const match = SPEEDS.find((s) => s.val === simState.timeSpeed);
    return match ? match.label : `${simState.timeSpeed}x`;
  }, [SPEEDS, simState.timeSpeed]);

  const cycleSpeed = () => {
    const speeds = [1, 60, 3600, 86400, 864000];
    const idx = speeds.indexOf(simState.timeSpeed);
    const nextIdx = (idx + 1) % speeds.length;
    onUpdateState({ timeSpeed: speeds[nextIdx] });
  };

  // AI Scholar State
  const [scholarPrompt, setScholarPrompt] = useState('');
  const [scholarResponse, setScholarResponse] = useState<string | null>(
    'Assalamu alaykum. I am Al-Falakiyy (العالِم الفَلَكي). Ask me any question regarding the Classical Ptolemaic / Islamic Geocentric Cosmology (کتاب الہیئۃ): the stationary Earth at the cosmic center (0,0,0), the 24-hour diurnal rotation of Falak al-Atlas, the 23.44° inclined Ecliptic with equinoxes and solstices, or geometric moon phases.'
  );
  const [isQueryingScholar, setIsQueryingScholar] = useState(false);
  const [scholarModelNotice, setScholarModelNotice] = useState<string | null>(null);

  // Current Julian Day
  const currentJD = simState.simJulianDay || 2460389.629;

  // Memoized Rigorous Astronomical Computations (100% Math & Algorithm Based)
  const dateInfo = useMemo(() => julianDayToDate(currentJD), [currentJD]);
  const hijriDate = useMemo(() => julianDayToHijri(currentJD), [currentJD]);
  const sidereal = useMemo(
    () => calculateSiderealTime(currentJD, simState.selectedLocation.longitude),
    [currentJD, simState.selectedLocation.longitude]
  );
  const sunEphem = useMemo(
    () => calculateSunEphemerisByJD(currentJD, simState.obliquityDeg),
    [currentJD, simState.obliquityDeg]
  );
  const moonEphem = useMemo(
    () => calculateMoonEphemerisByJD(currentJD, simState.obliquityDeg),
    [currentJD, simState.obliquityDeg]
  );
  const horizonAstrometry = useMemo(
    () => calculateObserverHorizonAstrometry(simState.selectedLocation.latitude, simState.obliquityDeg),
    [simState.selectedLocation.latitude, simState.obliquityDeg]
  );

  const activeMansion = useMemo(() => {
    const idx = moonEphem.mansionIndex || 1;
    return LUNAR_MANSIONS_DATA[idx - 1] || LUNAR_MANSIONS_DATA[0];
  }, [moonEphem.mansionIndex]);

  const setCameraView = (preset: string) => {
    setIsCameraMenuOpen(false);
    onUpdateState({ cameraPreset: preset as any });
    setTimeout(() => {
      onUpdateState({ cameraPreset: null });
    }, 900);
  };

  // Date and Time Steppers
  const handleStepDays = (deltaDays: number) => {
    const newJD = currentJD + deltaDays;
    const dInfo = julianDayToDate(newJD);
    onUpdateState({
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleStepHours = (deltaHours: number) => {
    const newJD = currentJD + deltaHours / 24.0;
    const dInfo = julianDayToDate(newJD);
    onUpdateState({
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleCustomDateChange = (dateStr: string) => {
    if (!dateStr) return;
    const [y, m, d] = dateStr.split('-').map(Number);
    const newJD = dateToJulianDay(y, m, d, dateInfo.hours, dateInfo.minutes, dateInfo.seconds);
    const dInfo = julianDayToDate(newJD);
    onUpdateState({
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleCustomTimeChange = (timeStr: string) => {
    if (!timeStr) return;
    const [h, min] = timeStr.split(':').map(Number);
    const newJD = dateToJulianDay(dateInfo.year, dateInfo.month, dateInfo.day, h, min, 0);
    const dInfo = julianDayToDate(newJD);
    onUpdateState({
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleApplyPreset = (presetJD: number) => {
    const dInfo = julianDayToDate(presetJD);
    onUpdateState({
      simJulianDay: presetJD,
      simTimeDays: presetJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleSetToNow = () => {
    const now = new Date();
    const newJD = dateToJulianDay(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    );
    const dInfo = julianDayToDate(newJD);
    onUpdateState({
      simJulianDay: newJD,
      simTimeDays: newJD - 2451545.0,
      dateTimeIso: dInfo.formattedDateTime,
    });
  };

  const handleAskScholar = async (customPrompt?: string) => {
    const textToAsk = customPrompt || scholarPrompt;
    if (!textToAsk.trim()) return;

    setIsQueryingScholar(true);
    setScholarResponse(null);
    setScholarModelNotice(null);

    try {
      const modelContext = `Classical Traditional Islamic / Ptolemaic Geocentric Cosmology.
Date & Time: ${dateInfo.displayString} (Hijri: ${hijriDate.formattedStringAr}).
Julian Day: ${currentJD.toFixed(4)}. Local Sidereal Time: ${sidereal.lstHoursFormatted} (${sidereal.lstDeg.toFixed(2)}°).
Textbook Mode: ${simState.textbookFocusMode === 'CORE_EARTH_SUN_MOON' ? 'Core Earth-Sun-Moon' : 'All 7 Spheres'}.
Stationary Earth at Cosmic Center (0, 0, 0) (زمین ساکن).
Falak al-Atlas 24h Diurnal Motion: ${simState.isAtlasAutoRotating ? 'Active (East to West)' : 'Paused'}.
Sun Position: In ${sunEphem.currentSign.ar} (${sunEphem.currentSign.en}) at ${sunEphem.degreeInSign}° along Ecliptic (23.44° inclined).
Sun Declination: ${sunEphem.declinationDeg}°, Right Ascension: ${sunEphem.rightAscensionHours}h.
Moon Geometric Phase: ${moonEphem.phase.ar} (${moonEphem.phase.en}) with ${moonEphem.illuminationPercent}% illumination.
Current Lunar Mansion: #${activeMansion.number} ${activeMansion.nameAr} (${activeMansion.nameEn}).
Observer Station: ${simState.selectedLocation.nameEn} (Lat: ${simState.selectedLocation.latitude}°, Lon: ${simState.selectedLocation.longitude}°).
Observer Celestial Pole Altitude: ${horizonAstrometry.poleAltitudeDeg}°.
Obliquity of Ecliptic: ${simState.obliquityDeg}° (الميل الكلي).
Fixed stars are distant pinpoints on the 8th sphere, not solid bodies.`;

      const res = await fetch('/api/gemini/scholar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAsk, modelContext }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to communicate with scholar.');

      setScholarResponse(data.text);
      setScholarModelNotice(data.notice || data.model || null);
      if (!customPrompt) setScholarPrompt('');
    } catch (err: any) {
      setScholarResponse(`Error: ${err.message || 'Could not consult scholar.'}`);
    } finally {
      setIsQueryingScholar(false);
    }
  };

  // Classical Textbook Chapters Data
  const TEXTBOOK_CHAPTERS = [
    {
      number: 1,
      titleAr: 'الأَرْض مَرْكَز العَالَم وَسُكُونُها',
      titleUr: 'باب اول: زمین مرکزِ عالم ہے اور ساکن ہے',
      subtitle: 'Chapter 1: Stationary Earth at the Cosmic Center (0, 0, 0)',
      summary: 'زمین کائنات کے ٹھیک مرکز (0,0,0) پر بالکل ساکن ہے۔ نہ یہ اپنے محور پر گھومتی ہے اور نہ ہی کسی مدار میں۔ ثقل تمام اجسام کو مرکزِ عالم کی طرف کھینچتا ہے۔',
      points: [
        'مرکزِ عالم: زمین کائنات کے مرکز پر واقع ہے (Markaz al-Alam).',
        'سکونِ زمین: زمین کو کسی قسم کی حرکت (حرکتِ وضعی یا انتقالی) حاصل نہیں ہے۔',
        'شب و روز کی پیدائش: دن اور رات کا نظام نویں فلک (فلکِ اطلس) کی 24 گھنٹے کی گردش سے پیدا ہوتا ہے۔',
        'الأفق الحسي وسمت الرأس: ناظر کی سطح پر افق کا مماس دائرہ اور عمودی خط (Zenith).',
      ],
      setup: () => {
        onUpdateState({
          textbookFocusMode: 'CORE_EARTH_SUN_MOON',
          showPlanets: false,
          showObserverHorizon: true,
          showEquatorRing: true,
          showEclipticRing: true,
          cameraPreset: 'EARTH_CLOSE' as any,
        });
      },
    },
    {
      number: 2,
      titleAr: 'الحَرَكَة الأُولَى - فَلَك الأَطْلَس (المُحَدِّد)',
      titleUr: 'باب دوم: حرکتِ اولیٰ - فلکِ اطلس کی 24 گھنٹے کی یومی گردش',
      subtitle: 'Chapter 2: Primary Diurnal Motion via the 9th Sphere (Falak al-Atlas)',
      summary: 'نواں فلک (فلکِ اطلس / فلک الافلاک) قطبینِ سماوی کے گرد مشرق سے مغرب کی طرف مسلسل 24 گھنٹوں میں ایک چکر پورا کرتا ہے اور تمام اندرونی افلاک کو اپنے ساتھ گھماتا ہے۔',
      points: [
        'حرکتِ اولیٰ (Primary Motion): مشرق سے مغرب کی طرف روزانہ 24 گھنٹے کی تیز گردش۔',
        'فلکِ اطلس (Ninth Sphere): یہ کواکب سے خالی بلوری فلک ہے جو تمام جہات کو محدود کرتا ہے (المحدد للجحات).',
        'طلوع و غروب: سورج، چاند اور ستاروں کا روزانہ مشرق سے طلوع ہو کر مغرب میں غروب ہونا اسی فلک کے چکر سے ہے۔',
        'معدل النہار (Celestial Equator): اسی فلک کے خطِ استوا کو معدل النہار کہتے ہیں جو زمین کے استوا کے ٹھیک متوازی (0° جھکاؤ) پر واقع ہے۔',
      ],
      setup: () => {
        onUpdateState({
          isAtlasAutoRotating: true,
          showEquatorRing: true,
          showEquatorialGrid: true,
          timeSpeed: 3600,
          cameraPreset: 'POLAR_NORTH' as any,
        });
      },
    },
    {
      number: 3,
      titleAr: 'الحَرَكَة الثَّانِيَة - فَلَك الشَّمْس وَالمَيْل الكُلِّي',
      titleUr: 'باب سوم: حرکتِ ثانیہ - فلکِ شمس، دائرۃ البروج اور میلِ کلی (23.44°)',
      subtitle: 'Chapter 3: Solar Proper Motion & 23.44° Ecliptic Obliquity',
      summary: 'سورج کا اپنا ذاتی چکر ستاروں کے مقابلے میں مغرب سے مشرق کی طرف دائرۃ البروج پر ہے، جو معدل النہار سے ٹھیک 23.44° کے جھکاؤ پر ہے۔ اس سے فصولِ اربعہ (چاروں موسم) پیدا ہوتے ہیں۔',
      points: [
        'دائرۃ البروج (Ecliptic): فلکِ شمس کا مستوی جو معدل النہار سے ٹھیک 23.44° جھکا ہوا ہے۔',
        'نقطتا الاعتدال (Equinoxes): دائرۃ البروج اور معدل النہار کے دو متقاطع نکات — اعتدالِ ربیعی (21 مارچ، 0° برجِ حمل) اور اعتدالِ خریفی (23 ستمبر، برجِ میزان)۔',
        'نقطتا الانقلاب (Solstices): انقلابِ صیفی (21 جون، شمالی انتہا +23.44°، طویل ترین دن) اور انقلابِ شتوی (22 دسمبر، جنوبی انتہا -23.44°، مختصر ترین دن)۔',
        'فصولِ اربعہ: زمین کے ساکن رہنے کے باوجود چاروں موسم سورج کے میلِ کلی سے پیدا ہوتے ہیں۔',
      ],
      setup: () => {
        onUpdateState({
          textbookFocusMode: 'CORE_EARTH_SUN_MOON',
          showEclipticRing: true,
          showEquatorRing: true,
          showSolsticeEquinoxMarkers: true,
          cameraPreset: 'ECLIPTIC_SIDE' as any,
        });
      },
    },
    {
      number: 4,
      titleAr: 'أَحْوَال القَمَر - الأَشْكَال وَالمَنَازِل',
      titleUr: 'باب چہارم: احوالِ قمر - حقیقی قمری حالتیں اور 28 منازلِ قمر',
      subtitle: 'Chapter 4: Lunar Mechanics, Real Geometric Phases & 28 Mansions',
      summary: 'چاند زمین سے قریب ترین پہلا فلک ہے۔ اس کی ذاتی حرکت مغرب سے مشرق 27.32 دن میں مکمل ہوتی ہے۔ چاند کی روشن حالتیں (ہلال، بدر وغیرہ) سورج کی براہِ راست روشنی اور ہندسی زاویوں سے پیدا ہوتی ہیں۔',
      points: [
        'فلکِ قمر (First Sphere): زمین کے بالکل اوپر پہلا فلک، جس کا جھکاؤ دائرۃ البروج سے 5.14° ہے۔',
        'حقیقی قمری حالتیں (Physical Moon Phases): چاند کا ٹھیک نصف حصہ سورج سے روشن ہوتا ہے اور باقی نصف تاریک رہتا ہے۔',
        'اشکالِ قمر: محاق (New Moon) ➔ ہلال (Crescent) ➔ تربیع اول (Quarter) ➔ بدر (Full Moon) ➔ تربیع ثانی۔',
        'منازلِ قمر (28 Lunar Mansions): چاند کا دائرۃ البروج پر روزانہ کا پڑاؤ، جنہیں 28 منازل کہا جاتا ہے۔',
      ],
      setup: () => {
        onUpdateState({
          textbookFocusMode: 'CORE_EARTH_SUN_MOON',
          showLunarMansions: true,
          cameraPreset: 'MOON_PHASE' as any,
        });
      },
    },
    {
      number: 5,
      titleAr: 'الكَوَاكِب السَّيَّارَة وَأَفْلَاك التَّدْوِير',
      titleUr: 'باب پنجم: کواکبِ سیارہ اور افلاکِ تدویر و حامل',
      subtitle: 'Chapter 5: The 5 Wandering Planets (Deferents & Epicycles)',
      summary: 'پانچوں کواکبِ سیارہ (عطارد، زہرہ، مریخ، مشتری، زحل) اپنے فلکِ تدویر اور فلکِ حامل کے ذریعے حرکت کرتے ہیں، جس سے ان کی الٹی چال (رجوع) کی ہندسی توجیہ ہوتی ہے۔ ستارے یہ نہیں ہیں، ستارے آٹھویں فلک کے باریک نقطے ہیں۔',
      points: [
        'سیارے بمقابلہ ستارے: یہ پانچ اجرام سیارے (کواکبِ سیارہ) ہیں۔ ستارے (کواکبِ ثابتہ) آٹھویں فلک پر دور دراز باریک روشن نقطے ہیں، کوئی بڑے گولے نہیں۔',
        'فلکِ حامل (Deferent): وہ بڑا دائرہ جس پر سیارے کے مدار کا مرکز گردش کرتا ہے۔',
        'فلکِ تدویر (Epicycle): چھوٹا دائرہ جو حامل پر سوار ہے اور سیارہ اس کے کنارے پر گھومتا ہے۔',
        'رجوع واستقامت (Retrograde Motion): جب سیارہ تدویر کے اندرونی کنارے پر ہوتا ہے تو زمین سے دیکھنے پر پیچھے ہٹتا ہوا (راجِع) دکھائی دیتا ہے۔',
      ],
      setup: () => {
        onUpdateState({
          textbookFocusMode: 'ALL_PLANETS',
          showPlanets: true,
          showRetrogradeTrails: true,
          cameraPreset: 'COSMIC' as any,
        });
      },
    },
    {
      number: 6,
      titleAr: 'مَرَاتِب الأَفْلَاك التِّسْعَة وَأَبْعَادُها',
      titleUr: 'باب ششم: افلاکِ تسعہ کی ترتیب، اقطار اور بطلیموسی ابعاد',
      subtitle: 'Chapter 6: The Hierarchy of the Nine Spheres (Al-Farghani Nesting Principle)',
      summary: 'زمین سے باہر کی طرف افلاک کی ترتیب: 1. قمر 2. عطارد 3. زہرہ 4. شمس 5. مریخ 6. مشتری 7. زحل 8. فلکِ ثوابت و بروج 9. فلکِ اطلس۔',
      points: [
        'مبدأ الفرغاني (Nesting Principle): ہر اندرونی فلک کا انتہائی بعد (Apoapsis) بیرونی فلک کے ادنیٰ بعد (Periapsis) سے متصل ہوتا ہے، بغیر کسی خلا کے۔',
        'فلکِ ثوابت (8th Sphere): بارہ بروج اور 1,022 ثوابت ستاروں کا مسکن (عبدالرحمن الصوفی، صور الکواکب)۔',
        'حرکتِ مبادرت (Precession): فلکِ ثوابت کی سست رفتار مشرق کی طرف حرکت (البَتّانی: 66 شمسی سال میں 1 درجہ)۔',
        'فلکِ اطلس (9th Sphere): عرش / فلک الاعظم جو تمام کائنات کو محیط ہے۔',
      ],
      setup: () => {
        onUpdateState({
          textbookFocusMode: 'ALL_PLANETS',
          showPlanets: true,
          explodedAmount: 0.65,
          cameraPreset: 'COSMIC' as any,
        });
      },
    },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between overflow-hidden">
      {/* =================================================================== */}
      {/* 1. TOP HEADER BAR: BRAND, MODE SELECTOR, LIVE STATUS & TOOLS */}
      {/* =================================================================== */}
      <header className="pointer-events-auto w-full h-14 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/80 px-2 sm:px-4 md:px-5 flex items-center justify-between gap-1.5 sm:gap-3 z-20 pt-safe">
        {/* Cosmological Axioms */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-gray-400">
            <span>زمین ساکن (0,0,0)</span>
            <span aria-hidden="true" className="text-gray-600">·</span>
            <span>24h گردشِ اطلس</span>
            <span aria-hidden="true" className="text-gray-600">·</span>
            <span className="text-amber-400 font-mono">23.44° دائرۃ البروج</span>
          </div>
        </div>

        {/* Central Segmented Mode Switcher */}
        <div className="flex items-center p-0.5 bg-gray-900 border border-gray-800 rounded-xl flex-shrink-0">
          <button
            onClick={() => {
              onUpdateState({
                textbookFocusMode: 'CORE_EARTH_SUN_MOON',
                showPlanets: false,
              });
            }}
            className={`min-h-[38px] px-2 sm:px-3 py-1 text-xs font-serif transition-colors rounded-lg flex items-center gap-1 sm:gap-1.5 ${
              simState.textbookFocusMode === 'CORE_EARTH_SUN_MOON' && !simState.showPlanets
                ? 'bg-amber-500 text-gray-950 font-bold shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
            title="Core Textbook Mode: Earth, Sun, Moon only"
          >
            <span>📖</span>
            <span className="hidden sm:inline">بنیادی افلاک (ارض، شمس، قمر)</span>
            <span className="sm:hidden">بنیادی</span>
          </button>

          <button
            onClick={() => {
              onUpdateState({
                textbookFocusMode: 'ALL_PLANETS',
                showPlanets: true,
              });
            }}
            className={`min-h-[38px] px-2 sm:px-3 py-1 text-xs font-serif transition-colors rounded-lg flex items-center gap-1 sm:gap-1.5 ${
              simState.showPlanets
                ? 'bg-sky-600 text-white font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Include the 5 Classical Wandering Planets (Mercury, Venus, Mars, Jupiter, Saturn)"
          >
            <span>🪐</span>
            <span className="hidden sm:inline">سبعہ سیارہ (5 سیارے)</span>
            <span className="sm:hidden">سیارے</span>
          </button>
        </div>

        {/* Right Section: Date & Time Selector Button, Live Ticker, Diurnal Toggle, Camera, Drawer */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Diurnal 24h Rotation Toggle (Falak al-Atlas based on LST) */}
          <button
            id="btnAutoRotate"
            aria-label="گردشِ فلکِ اطلس (شب و روز)"
            onClick={() => onUpdateState({ isAtlasAutoRotating: !simState.isAtlasAutoRotating })}
            className={`min-h-[38px] min-w-[38px] px-2 sm:px-3 py-1 rounded-xl text-xs font-serif flex items-center justify-center gap-1 sm:gap-1.5 transition-all border ${
              simState.isAtlasAutoRotating
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
            }`}
            title="Toggle Falak al-Atlas 24-hour Diurnal Rotation (Mathematically derived from Sidereal Time)"
          >
            <span className={simState.isAtlasAutoRotating ? 'animate-spin' : ''}>🌌</span>
            <span className="hidden md:inline">گردشِ اطلس</span>
            <span className="text-[10px] font-mono opacity-80 hidden sm:inline">
              {simState.isAtlasAutoRotating ? 'LST' : 'OFF'}
            </span>
          </button>

          {/* Camera Presets Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-amber-300 active:bg-gray-800 transition-colors flex items-center justify-center"
              title="Camera View Angles"
            >
              <Camera className="w-4 h-4" />
            </button>

            {isCameraMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-gray-950/98 border border-amber-600/40 p-1 shadow-2xl backdrop-blur-xl z-50 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 font-mono border-b border-gray-800">
                  Camera Presets
                </div>
                <button
                  onClick={() => setCameraView('COSMIC')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>🌌 Cosmic Overview</span>
                  <span className="text-[10px] text-gray-500 font-serif">عالمِ کل</span>
                </button>
                <button
                  onClick={() => setCameraView('EARTH_CLOSE')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>🌍 Earth & Horizon</span>
                  <span className="text-[10px] text-gray-500 font-serif">مرکزِ زمین</span>
                </button>
                <button
                  onClick={() => setCameraView('MOON_PHASE')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>🌙 Moon Phase</span>
                  <span className="text-[10px] text-gray-500 font-serif">اشکالِ قمر</span>
                </button>
                <button
                  onClick={() => setCameraView('ECLIPTIC_SIDE')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>📐 23.44° Ecliptic Tilt</span>
                  <span className="text-[10px] text-gray-500 font-serif">میلِ کلی</span>
                </button>
                <button
                  onClick={() => setCameraView('POLAR_NORTH')}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-gray-300 hover:text-amber-300 hover:bg-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>🧭 Polar North View</span>
                  <span className="text-[10px] text-gray-500 font-serif">قطبِ شمالی</span>
                </button>
              </div>
            )}
          </div>

          {/* Textbook & Tools Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`min-h-[38px] min-w-[38px] px-2.5 sm:px-3 py-1 rounded-xl text-xs font-serif flex items-center justify-center gap-1.5 transition-all border ${
              isDrawerOpen
                ? 'bg-amber-500 text-gray-950 font-bold border-amber-400 shadow-md'
                : 'bg-gray-900 border-gray-800 text-amber-300 hover:bg-gray-800'
            }`}
            title="Open Textbook & Astronomical Curriculum Drawer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">کتاب الہیئۃ</span>
          </button>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. DATE & TIME SELECTOR MODAL / SHEET */}
      {/* Allows user to select exact Date & Time, step forward/back, or pick equinoxes */}
      {/* =================================================================== */}


      {/* =================================================================== */}
      {/* 3. FLOATING INSPECTION TOAST (MOBILE & QUICK ACCESS) */}
      {/* Appears when user taps an object in 3D and drawer is closed */}
      {/* =================================================================== */}
      {inspectedSphere && !isDrawerOpen && (
        <div className="pointer-events-auto fixed bottom-20 sm:bottom-22 left-2 right-2 sm:left-auto sm:right-6 sm:w-80 z-30 bg-gray-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-3 shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: inspectedSphere.bodyColor }}
              />
              <div>
                <h4 className="font-serif font-bold text-sm text-amber-300">
                  {inspectedSphere.nameAr}
                </h4>
                <p className="text-[11px] text-gray-400">{inspectedSphere.nameEn}</p>
              </div>
            </div>
            <button
              onClick={onClearInspectedSphere}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span>Sphere #{inspectedSphere.order} of 9</span>
            <span className="text-amber-300">
              {inspectedSphere.farghaniDistanceEarthRadii.toLocaleString()} R⊕
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setDrawerTab('spheres');
              }}
              className="flex-1 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 rounded-xl text-amber-300 font-serif text-xs text-center transition-colors min-h-[36px] flex items-center justify-center"
            >
              مزید تفصیلات (View in Drawer)
            </button>
            <button
              onClick={() => setCameraView(inspectedSphere.id)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-300 font-serif text-xs text-center hover:text-amber-300 transition-colors min-h-[36px] flex items-center justify-center"
            >
              کیمرہ
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. BOTTOM FLOATING TRANSPORT CONTROL BAR */}
      {/* Responsive: Clean ergonomic mobile dock on <md, full toolbar on md+ */}
      {/* =================================================================== */}
      
      {/* MOBILE COMPACT DOCK (<md) */}
      <div className="pointer-events-auto flex md:hidden flex-col w-[calc(100vw-16px)] max-w-md mx-auto mb-2 pb-safe z-20">
        {/* Mobile Secondary Expandable Row */}
        {isMobileSecondaryOpen && (
          <div className="mb-1.5 bg-gray-950/95 backdrop-blur-xl border border-amber-600/30 rounded-2xl p-2 shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono px-1">
              <span>قدماتِ اضافی (Extra Steps):</span>
              <button
                onClick={handleSetToNow}
                className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-serif"
              >
                وقتِ حاضر (Now)
              </button>
            </div>
            
            <div className="flex items-center justify-between gap-1 text-xs font-mono">
              <button
                onClick={() => handleStepDays(-30)}
                className="flex-1 py-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-center"
              >
                -30d
              </button>
              <button
                onClick={() => handleStepHours(-1)}
                className="flex-1 py-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-center"
              >
                -1h
              </button>
              <button
                onClick={() => handleStepHours(1)}
                className="flex-1 py-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-center"
              >
                +1h
              </button>
              <button
                onClick={() => handleStepDays(30)}
                className="flex-1 py-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-center"
              >
                +30d
              </button>
            </div>

            <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800 text-xs font-serif">
              <span className="text-[10px] text-gray-400 font-mono pl-1">Focus:</span>
              <button
                onClick={() => setCameraView('EARTH_CLOSE')}
                className="flex-1 py-1 bg-gray-900/90 border border-gray-800 rounded-lg text-gray-300 hover:text-amber-300 flex items-center justify-center gap-1"
              >
                <span>🌍</span>
                <span>الأرض</span>
              </button>
              <button
                onClick={() => setCameraView('sun')}
                className="flex-1 py-1 bg-gray-900/90 border border-gray-800 rounded-lg text-gray-300 hover:text-amber-300 flex items-center justify-center gap-1"
              >
                <span>☉</span>
                <span>الشمس</span>
              </button>
              <button
                onClick={() => setCameraView('MOON_PHASE')}
                className="flex-1 py-1 bg-gray-900/90 border border-gray-800 rounded-lg text-gray-300 hover:text-amber-300 flex items-center justify-center gap-1"
              >
                <span>🌙</span>
                <span>القمر</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Main Row */}
        <div className="bg-gray-950/95 backdrop-blur-2xl border border-amber-600/40 rounded-2xl p-1.5 shadow-2xl flex items-center justify-between gap-1">
          {/* Play / Pause Toggle (44px target) */}
          <button
            onClick={() => onUpdateState({ isPaused: !simState.isPaused })}
            className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
              simState.isPaused
                ? 'bg-gray-900 border border-gray-800 text-amber-300'
                : 'bg-amber-500 text-gray-950 font-bold'
            }`}
            title={simState.isPaused ? 'Resume Motion' : 'Pause Motion'}
          >
            {simState.isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
          </button>

          {/* Steppers: -1d and +1d (44px target) */}
          <button
            onClick={() => handleStepDays(-1)}
            className="min-h-[44px] px-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-gray-700 border border-gray-800 text-gray-300 font-mono text-xs flex items-center justify-center active:scale-95"
            title="Step back 1 day"
          >
            -1d
          </button>
          <button
            onClick={() => handleStepDays(1)}
            className="min-h-[44px] px-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-gray-700 border border-gray-800 text-gray-300 font-mono text-xs flex items-center justify-center active:scale-95"
            title="Step forward 1 day"
          >
            +1d
          </button>

          {/* Speed Cycler: Cycles 1x -> 1m/s -> 1h/s -> 1d/s -> 10d/s */}
          <button
            onClick={cycleSpeed}
            className="min-h-[44px] px-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-gray-700 border border-gray-800 text-amber-400 font-mono text-xs flex items-center justify-center gap-1 active:scale-95"
            title={`Speed: ${currentSpeedLabel}. Tap to cycle speed.`}
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span className="font-bold">{currentSpeedLabel}</span>
          </button>

          {/* Secondary Controls Expander */}
          <button
            onClick={() => setIsMobileSecondaryOpen(!isMobileSecondaryOpen)}
            className={`min-h-[44px] min-w-[34px] rounded-xl border flex items-center justify-center transition-colors ${
              isMobileSecondaryOpen
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle extra time steps & focus"
          >
            {isMobileSecondaryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Drawer Quick Button */}
          <button
            onClick={() => {
              setIsDrawerOpen(true);
              setDrawerTab('textbook');
            }}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 active:scale-95 flex items-center justify-center shadow"
            title="Open Textbook Drawer"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP FULL TOOLBAR (md+) */}
      <div className="pointer-events-auto hidden md:flex mx-auto mb-4 z-10 flex-wrap items-center justify-center gap-2 bg-gray-950/90 backdrop-blur-xl border border-amber-600/40 px-3 py-1.5 rounded-2xl shadow-2xl text-xs">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => onUpdateState({ isPaused: !simState.isPaused })}
          className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-amber-300 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
          title={simState.isPaused ? 'Resume Motion' : 'Pause Motion'}
        >
          {simState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-0.5 px-1 border-l border-gray-800">
          <button
            onClick={() => handleStepHours(-1)}
            className="px-1.5 py-1 text-[10px] font-mono text-gray-400 hover:text-white rounded hover:bg-gray-900 min-h-[32px]"
            title="Step back 1 hour"
          >
            -1h
          </button>
          <button
            onClick={() => handleStepHours(1)}
            className="px-1.5 py-1 text-[10px] font-mono text-gray-400 hover:text-white rounded hover:bg-gray-900 min-h-[32px]"
            title="Step forward 1 hour"
          >
            +1h
          </button>
          <button
            onClick={() => handleStepDays(-1)}
            className="px-1.5 py-1 text-[10px] font-mono text-gray-400 hover:text-white rounded hover:bg-gray-900 min-h-[32px]"
            title="Step back 1 day"
          >
            -1d
          </button>
          <button
            onClick={() => handleStepDays(1)}
            className="px-1.5 py-1 text-[10px] font-mono text-gray-400 hover:text-white rounded hover:bg-gray-900 min-h-[32px]"
            title="Step forward 1 day"
          >
            +1d
          </button>
        </div>

        {/* Simulation Speed Multipliers (Real seconds of sky motion) */}
        <div className="flex items-center gap-1 px-1 border-x border-gray-800">
          {SPEEDS.map((spd) => (
            <button
              key={spd.val}
              onClick={() => onUpdateState({ timeSpeed: spd.val })}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-colors min-h-[32px] ${
                simState.timeSpeed === spd.val
                  ? 'bg-amber-500 text-gray-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={`Simulation speed: ${spd.label}`}
            >
              {spd.label}
            </button>
          ))}
        </div>

        {/* Quick Date Display / Picker Trigger */}
        <button
          onClick={() => setIsDateTimeModalOpen(true)}
          className="px-2.5 py-1 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-800 text-amber-300 font-mono text-xs flex items-center gap-1.5 min-h-[32px]"
          title="Open Date & Time selection modal"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{dateInfo.formattedDate}</span>
          <span className="text-gray-500">{dateInfo.formattedTime}</span>
        </button>

        {/* Quick Camera Focus Targets */}
        <div className="flex items-center gap-1 px-1 border-l border-gray-800">
          <button
            onClick={() => setCameraView('EARTH_CLOSE')}
            className="px-2 py-1 rounded-md text-gray-300 hover:text-amber-300 hover:bg-gray-900 text-xs font-serif flex items-center gap-1 min-h-[32px]"
            title="Focus Earth (مرکزِ زمین)"
          >
            <span>🌍</span>
            <span>الأرض</span>
          </button>
          <button
            onClick={() => setCameraView('sun')}
            className="px-2 py-1 rounded-md text-gray-300 hover:text-amber-300 hover:bg-gray-900 text-xs font-serif flex items-center gap-1 min-h-[32px]"
            title="Focus Sun (الشمس)"
          >
            <span>☉</span>
            <span>الشمس</span>
          </button>
          <button
            onClick={() => setCameraView('MOON_PHASE')}
            className="px-2 py-1 rounded-md text-gray-300 hover:text-amber-300 hover:bg-gray-900 text-xs font-serif flex items-center gap-1 min-h-[32px]"
            title="Focus Moon (القمر)"
          >
            <span>🌙</span>
            <span>القمر</span>
          </button>
        </div>

        {/* Open Drawer Quick Button */}
        <button
          onClick={() => {
            setIsDrawerOpen(true);
            setDrawerTab('textbook');
          }}
          className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-serif flex items-center gap-1 min-h-[32px]"
        >
          <span>📚 درسِ کتاب</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 5. SLIDE-OVER RIGHT DRAWER: TEXTBOOK, 9 SPHERES, EPHEMERIS & SCHOLAR */}
      {/* Responsive: Full-screen modal drawer on mobile, 450px sidebar on sm+ */}
      {/* =================================================================== */}
      {isDrawerOpen && (
        <aside className="pointer-events-auto fixed inset-0 sm:inset-auto sm:top-14 sm:right-0 sm:bottom-0 w-full sm:w-[450px] bg-gray-950/98 backdrop-blur-2xl border-l border-amber-600/30 shadow-2xl flex flex-col z-40 transition-transform duration-300 pt-safe pb-safe">
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <div>
              <h2 className="font-serif font-bold text-base text-amber-300">کتاب الہیئۃ والافلاکیات</h2>
              <p className="text-[11px] text-gray-400">Classical Geocentric Curriculum & Controls</p>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Inspection Card (When an object is selected) */}
          {inspectedSphere && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-gray-900/90 border border-amber-500/50 shadow-lg text-xs space-y-2">
              <div className="flex items-start justify-between border-b border-gray-800 pb-1.5">
                <div>
                  <span className="text-[10px] uppercase font-mono text-amber-400">
                    Sphere #{inspectedSphere.order} of 9
                  </span>
                  <h3 className="font-serif text-sm font-bold text-amber-300">{inspectedSphere.nameAr}</h3>
                  <p className="text-[11px] text-gray-300">{inspectedSphere.nameEn}</p>
                </div>
                <button
                  onClick={onClearInspectedSphere}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-gray-400 block text-[10px]">Al-Farghani Radius:</span>
                  <span className="text-amber-300">{inspectedSphere.farghaniDistanceEarthRadii.toLocaleString()} R⊕</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Orbital Period:</span>
                  <span className="text-gray-200">{inspectedSphere.orbitalPeriodDays} days</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Epicycle Radius:</span>
                  <span className="text-gray-200">{inspectedSphere.epicycleRadius} units</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px]">Cosmic Ruler:</span>
                  <span className="text-amber-400 font-serif">{inspectedSphere.ruler}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center px-3 pt-2 border-b border-gray-800 gap-1 overflow-x-auto touch-pan-x scrollbar-none text-xs flex-shrink-0">
            {[
              { id: 'textbook', labelUr: 'درسِ کتاب', labelEn: 'Textbook', icon: BookOpen },
              { id: 'ephemeris', labelUr: 'اوقات و تقویم', labelEn: 'Ephemeris', icon: Calendar },
              { id: 'spheres', labelUr: 'افلاکِ تسعہ', labelEn: '9 Spheres', icon: Layers },
              { id: 'rings', labelUr: 'دوائر و رصد', labelEn: 'Astrometry', icon: Compass },
              { id: 'scholar', labelUr: 'عالمِ فلکی', labelEn: 'Scholar', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as DrawerTab)}
                  className={`min-h-[44px] pb-2 px-3 font-serif transition-colors flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                    drawerTab === tab.id
                      ? 'border-amber-400 text-amber-300 font-bold'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.labelUr}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* TAB 1: TEXTBOOK LESSONS */}
            {drawerTab === 'textbook' && (
              <div className="space-y-4">
                {/* Mode Clarification Notice */}
                <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-serif font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>کتاب الہیئۃ کا بنیادی اصول (Textbook Foundation):</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    ستارے (ثوابت) آٹھویں فلک پر دور دراز باریک روشن نقطے ہیں، کوئی بڑے گولے نہیں۔ اندرونی مداروں میں صرف سورج، چاند اور پانچ سیارے حرکت کرتے ہیں۔
                  </p>
                </div>

                {/* Chapter Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x scrollbar-none pb-1">
                  {TEXTBOOK_CHAPTERS.map((ch) => (
                    <button
                      key={ch.number}
                      onClick={() => setActiveChapter(ch.number)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-serif transition-all whitespace-nowrap border flex items-center justify-center ${
                        activeChapter === ch.number
                          ? 'bg-amber-500 text-gray-950 font-bold border-amber-400 shadow'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      باب {ch.number}
                    </button>
                  ))}
                </div>

                {/* Active Chapter Content */}
                {(() => {
                  const ch = TEXTBOOK_CHAPTERS.find((c) => c.number === activeChapter) || TEXTBOOK_CHAPTERS[0];
                  return (
                    <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-800 space-y-3">
                      <div>
                        <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
                          {ch.subtitle}
                        </span>
                        <h4 className="font-serif text-base font-bold text-amber-300 mt-0.5">
                          {ch.titleUr}
                        </h4>
                        <p className="text-xs text-gray-400 font-serif mt-0.5">{ch.titleAr}</p>
                      </div>

                      <p className="text-gray-200 leading-relaxed font-serif text-xs border-y border-gray-800/80 py-2.5">
                        {ch.summary}
                      </p>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-serif font-bold text-amber-400 block">
                          اہم نکات و ہندسی حقائق:
                        </span>
                        <ul className="space-y-1 text-gray-300 text-[11px] list-disc list-inside">
                          {ch.points.map((pt, i) => (
                            <li key={i} className="leading-relaxed font-serif">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={ch.setup}
                          className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-serif font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <span>اس سبق کا منظر اور کیمرہ سیٹ کریں</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}


                {/* Date & Time Selector */}
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-3">
                  <h4 className="font-serif font-bold text-amber-300 text-sm">انتخابِ تاریخ و وقت</h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">تاریخ (Gregorian):</label>
                      <input
                        type="date"
                        value={dateInfo.formattedDate}
                        onChange={(e) => handleCustomDateChange(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-400">وقت (UTC):</label>
                      <input
                        type="time"
                        value={dateInfo.formattedTime}
                        onChange={(e) => handleCustomTimeChange(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-amber-300 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button onClick={() => handleStepDays(-30)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">-30d</button>
                    <button onClick={() => handleStepDays(-1)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">-1d</button>
                    <button onClick={() => handleStepHours(-1)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">-1h</button>
                    <button onClick={handleSetToNow} className="px-2 py-1 bg-amber-600/30 rounded text-xs font-serif font-bold">Now</button>
                    <button onClick={() => handleStepHours(1)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">+1h</button>
                    <button onClick={() => handleStepDays(1)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">+1d</button>
                    <button onClick={() => handleStepDays(30)} className="px-2 py-1 bg-gray-800 rounded text-xs font-mono">+30d</button>
                  </div>
                </div>

                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-2">
                  <span className="font-serif font-bold text-amber-300 text-xs">
                    اوقات و تقویم:
                  </span>

                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">Gregorian UTC:</span>
                      <span className="text-amber-300 font-bold">{dateInfo.displayString}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">تاریخِ ہجری (Hijri):</span>
                      <span className="text-emerald-400 font-bold">{hijriDate.formattedStringAr}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">یومِ جولیان (JD):</span>
                      <span className="text-amber-300 font-bold">{currentJD.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-gray-400">وقتِ نجومی (LST):</span>
                      <span className="text-sky-300 font-bold">{sidereal.lstHoursFormatted}</span>
                    </div>


                {/* Solar Ephemeris Card */}
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1.5">
                  <h4 className="font-serif font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <span>☉</span>
                    <span>زیجِ شمس (Solar Ephemeris - Al-Battani):</span>
                  </h4>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">برجِ شمس (Zodiac Station):</span>
                      <span className="text-amber-300 font-serif font-bold">
                        {sunEphem.currentSign.ar} ({sunEphem.degreeInSign}°)
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">طولِ دائرۃ البروج (Ecliptic Longitude):</span>
                      <span className="text-gray-200">{sunEphem.eclipticLongitudeDeg}°</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">میلِ شمس (Declination):</span>
                      <span className="text-amber-300 font-bold">{sunEphem.declinationDeg}°</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-400">تعدیلِ شمس (Eq of Center):</span>
                      <span className="text-gray-300">{sunEphem.equationOfCenterDeg}°</span>
                    </div>
                  </div>
                </div>

                {/* Lunar Ephemeris Card */}
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1.5">
                  <h4 className="font-serif font-bold text-sky-400 text-xs flex items-center gap-1.5">
                    <span>🌙</span>
                    <span>زیجِ قمر (Lunar Ephemeris - Al-Tusi & Ibn al-Shatir):</span>
                  </h4>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">حالتِ قمر (Phase):</span>
                      <span className="text-sky-300 font-serif font-bold">
                        {moonEphem.phase.ar} ({moonEphem.illuminationPercent}%)
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">منزلِ قمر (Mansion #{activeMansion.number}):</span>
                      <span className="text-emerald-400 font-serif font-bold">
                        {activeMansion.nameAr} ({activeMansion.nameEn})
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">طولِ قمر (Longitude):</span>
                      <span className="text-gray-200">{moonEphem.eclipticLongitudeDeg}°</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-400">عرضِ قمر (Latitude ±5.14°):</span>
                      <span className="text-gray-200">{moonEphem.eclipticLatitudeDeg}°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NINE SPHERES */}
            {drawerTab === 'spheres' && (
              <div className="space-y-3">
                <div className="text-[11px] text-gray-400 font-serif">
                  ترتیبِ افلاک تسعہ از مرکزِ ساکن (زمین) تا محیطِ اعظم (فلکِ اطلس):
                </div>
                <div className="space-y-2">
                  {spheres.map((s) => (
                    <div
                      key={s.id}
                      className="bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: s.bodyColor }}
                          />
                          <span className="font-serif font-bold text-amber-300">
                            {s.order}. {s.nameAr}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {s.farghaniDistanceEarthRadii.toLocaleString()} R⊕
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                        <span>{s.nameEn}</span>
                        <span>Period: {s.orbitalPeriodDays}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: RINGS & OBSERVER ASTROMETRY */}
            {drawerTab === 'rings' && (
              <div className="space-y-3">
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-2">
                  <label className="text-[11px] font-semibold text-gray-300 block font-serif">
                    تاریخی رصد گاہ (Historical Observatory):
                  </label>
                  <select
                    value={simState.selectedLocation.id}
                    onChange={(e) => {
                      const loc = HISTORICAL_OBSERVER_LOCATIONS.find((l) => l.id === e.target.value);
                      if (loc) onUpdateState({ selectedLocation: loc });
                    }}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 focus:outline-none"
                  >
                    {HISTORICAL_OBSERVER_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nameEn} ({loc.nameAr})
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-gray-400 font-mono space-y-0.5">
                    <div>عرض البلد (Latitude): {simState.selectedLocation.latitude}° N</div>
                    <div>طول البلد (Longitude): {simState.selectedLocation.longitude}° E</div>
                  </div>
                </div>

                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-1.5">
                  <h4 className="font-serif font-bold text-amber-300">افقی حسابات (Horizon Geodesy):</h4>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">ارتفاع القطب (Pole Altitude):</span>
                      <span className="text-emerald-400 font-bold">{horizonAstrometry.poleAltitudeDeg}°</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">معدل النهار (Equator Culmination):</span>
                      <span className="text-amber-300 font-bold">{horizonAstrometry.equatorCulminationDeg}°</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-gray-800">
                      <span className="text-gray-400">اطول نہار (Longest Day):</span>
                      <span className="text-sky-300 font-bold">{horizonAstrometry.longestDayHours} hrs</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-400">اقصر نہار (Shortest Day):</span>
                      <span className="text-sky-300 font-bold">{horizonAstrometry.shortestDayHours} hrs</span>
                    </div>
                  </div>
                </div>

                {/* Coordinate Rings Visibility */}
                <div className="bg-gray-900/80 p-3 rounded-xl border border-gray-800 space-y-2">
                  <h4 className="font-serif font-bold text-amber-300">دوائر و خطوط (Armillary Rings):</h4>
                  <div className="space-y-1.5 text-[11px]">
                    <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-800">
                      <span className="text-gray-300">معدل النہار (Celestial Equator 0°)</span>
                      <input
                        type="checkbox"
                        checked={simState.showEquatorRing}
                        onChange={(e) => onUpdateState({ showEquatorRing: e.target.checked })}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-800">
                      <span className="text-gray-300">دائرۃ البروج (Ecliptic 23.44°)</span>
                      <input
                        type="checkbox"
                        checked={simState.showEclipticRing}
                        onChange={(e) => onUpdateState({ showEclipticRing: e.target.checked })}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-800">
                      <span className="text-gray-300">نقطتا الاعتدال والانقلاب (Equinoxes/Solstices)</span>
                      <input
                        type="checkbox"
                        checked={simState.showSolsticeEquinoxMarkers}
                        onChange={(e) => onUpdateState({ showSolsticeEquinoxMarkers: e.target.checked })}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-800">
                      <span className="text-gray-300">الأفق الحسي (Observer Tangent Horizon)</span>
                      <input
                        type="checkbox"
                        checked={simState.showObserverHorizon}
                        onChange={(e) => onUpdateState({ showObserverHorizon: e.target.checked })}
                        className="accent-amber-500 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AI SCHOLAR */}
            {drawerTab === 'scholar' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1.5 font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    استفسار از عالمِ فلکیات (Al-Falakiyy):
                  </span>
                  {scholarModelNotice && (
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                      {scholarModelNotice}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x scrollbar-none pb-1.5 text-[11px]">
                  {[
                    'Explain diurnal motion of Falak al-Atlas.',
                    'How does 23.44° Ecliptic tilt create seasons?',
                    'Explain physical moon phases from Sun light.',
                  ].map((pText, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskScholar(pText)}
                      className="flex-shrink-0 min-h-[34px] px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:text-amber-300 active:bg-gray-800 transition-colors text-[11px] font-mono flex items-center"
                    >
                      {pText}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-3 max-h-56 overflow-y-auto leading-relaxed text-gray-200 font-serif">
                  {isQueryingScholar ? (
                    <div className="flex items-center gap-2 text-amber-300 py-3 text-xs">
                      <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>قدیم افلاکی کتب کی تحقیق جاری ہے...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{scholarResponse}</div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskScholar();
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={scholarPrompt}
                    onChange={(e) => setScholarPrompt(e.target.value)}
                    placeholder="حرکتِ یومیہ، میلِ کلی، اشکالِ قمر پر سوال پوچھیں..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500 font-serif h-11"
                  />
                  <button
                    type="submit"
                    disabled={isQueryingScholar || !scholarPrompt.trim()}
                    className="h-11 w-11 min-w-[44px] rounded-xl bg-amber-600 text-white font-medium flex items-center justify-center hover:bg-amber-500 active:scale-95 disabled:opacity-50 transition-all flex-shrink-0 shadow"
                    title="Send Prompt"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
