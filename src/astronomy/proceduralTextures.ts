import * as THREE from 'three';

/**
 * Procedural texture generation for classical Islamic astronomical instruments & celestial bodies
 * Zero external file dependencies (guaranteed zero 404 errors, 100% offline & instantaneous)
 */

export function createEclipticDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Antique brass background with subtle metallic patina
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#78561d');
  grad.addColorStop(0.5, '#c99a3e');
  grad.addColorStop(1, '#664916');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 128);

  // Border lines
  ctx.strokeStyle = '#2d1f05';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 2048, 128);
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(2048, 36);
  ctx.moveTo(0, 92);
  ctx.lineTo(2048, 92);
  ctx.stroke();

  const zodiacNamesAr = [
    'الحَمَل ♈', 'الثَّوْر ♉', 'الجَوْزاء ♊', 'السَّرَطان ♋',
    'الأَسَد ♌', 'السُّنْبُلَة ♍', 'المِيزان ♎', 'العَقْرَب ♏',
    'القَوْس ♐', 'الجَدْي ♑', 'الدَّلْو ♒', 'الحُوت ♓'
  ];

  const signWidth = 2048 / 12;

  for (let i = 0; i < 12; i++) {
    const x0 = i * signWidth;

    // Major division line
    ctx.strokeStyle = '#1a1002';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0, 128);
    ctx.stroke();

    // Arabic Zodiac sign name
    ctx.fillStyle = '#211403';
    ctx.font = 'bold 22px "Amiri", "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText(zodiacNamesAr[i], x0 + signWidth / 2, 68);

    // Degree ticks (30 degrees per sign = 30 ticks)
    for (let deg = 0; deg <= 30; deg++) {
      const xTick = x0 + (deg / 30) * signWidth;
      ctx.lineWidth = deg % 5 === 0 ? 2 : 1;
      ctx.strokeStyle = deg % 10 === 0 ? '#1a1002' : '#45310a';

      const tickHeight = deg % 10 === 0 ? 18 : deg % 5 === 0 ? 12 : 6;
      ctx.beginPath();
      ctx.moveTo(xTick, 0);
      ctx.lineTo(xTick, tickHeight);
      ctx.moveTo(xTick, 128);
      ctx.lineTo(xTick, 128 - tickHeight);
      ctx.stroke();

      if (deg % 10 === 0 && deg < 30) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#2d1f05';
        ctx.fillText(`${deg}°`, xTick + 10, 22);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createArmillaryGraduationTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Polished gold-brass gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#9a7b38');
  grad.addColorStop(0.5, '#f5d77f');
  grad.addColorStop(1, '#8c6b2b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 64);

  // Tick marks for 24 hours / 360 degrees
  ctx.strokeStyle = '#2b1d07';
  for (let i = 0; i < 24; i++) {
    const x = (i / 24) * 1024;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 24);
    ctx.moveTo(x, 64);
    ctx.lineTo(x, 40);
    ctx.stroke();

    // Hour number
    ctx.font = 'bold 12px "Cinzel", sans-serif';
    ctx.fillStyle = '#2b1d07';
    ctx.textAlign = 'center';
    ctx.fillText(`${i}h`, x + 16, 36);

    // Quarter hour ticks
    for (let q = 1; q < 4; q++) {
      const qx = x + (q / 4) * (1024 / 24);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(qx, 0);
      ctx.lineTo(qx, 12);
      ctx.moveTo(qx, 64);
      ctx.lineTo(qx, 52);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

export function createEarthClassicalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep astronomical lapis / indigo ocean base
  ctx.fillStyle = '#081226';
  ctx.fillRect(0, 0, 1024, 512);

  // Subtle ocean bathymetry contours
  ctx.fillStyle = '#0e1c36';
  for (let y = 0; y < 512; y += 24) {
    ctx.fillRect(0, y, 1024, 1.5);
  }

  // Draw classical ecumene (Al-Idrisi / Al-Biruni cartography):
  // Eurasia and Africa landmasses
  ctx.fillStyle = '#2d3e50';

  // Eurasia main landmass
  ctx.beginPath();
  ctx.ellipse(540, 160, 270, 95, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Indian subcontinent
  ctx.beginPath();
  ctx.moveTo(610, 220);
  ctx.lineTo(650, 290);
  ctx.lineTo(680, 220);
  ctx.closePath();
  ctx.fill();

  // Africa continent
  ctx.beginPath();
  ctx.ellipse(500, 290, 135, 115, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Arabian Peninsula (Al-Jazirah al-Arabiyyah)
  ctx.fillStyle = '#4a5568';
  ctx.beginPath();
  ctx.ellipse(585, 235, 48, 42, 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Red Sea cleft (narrow rift separating Arabia and Africa)
  ctx.strokeStyle = '#081226';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(555, 210);
  ctx.lineTo(580, 265);
  ctx.stroke();

  // Persian Gulf cleft
  ctx.beginPath();
  ctx.moveTo(605, 205);
  ctx.lineTo(635, 235);
  ctx.stroke();

  // Mediterranean Sea
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(430, 190);
  ctx.lineTo(540, 195);
  ctx.stroke();

  // Seven Climates (al-Aqalim al-Sab'ah) classical horizontal latitude lines
  const climateLats = [12.5, 20.5, 27.5, 33.5, 39.0, 45.0, 50.5];
  ctx.strokeStyle = '#d97706';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;
  climateLats.forEach((lat) => {
    const y = (0.5 - lat / 180) * 512;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Equator line in rich gold
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(1024, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMoonProceduralTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Highland anorthosite base
  ctx.fillStyle = '#b8bec8';
  ctx.fillRect(0, 0, 1024, 512);

  // Micro-crater regolith grain
  const imgData = ctx.getImageData(0, 0, 1024, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Classical Lunar Maria (Dark basalt basins visible from Earth)
  const drawMare = (x: number, y: number, rx: number, ry: number, rot: number) => {
    ctx.fillStyle = 'rgba(40, 46, 54, 0.75)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(25, 30, 38, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.7, ry * 0.7, rot, 0, Math.PI * 2);
    ctx.fill();
  };

  drawMare(380, 200, 110, 80, -0.2); // Oceanus Procellarum
  drawMare(480, 170, 75, 60, 0.1);   // Mare Imbrium
  drawMare(580, 180, 50, 45, -0.1);  // Mare Serenitatis
  drawMare(630, 230, 60, 50, 0.2);   // Mare Tranquillitatis
  drawMare(650, 310, 45, 40, 0);     // Mare Fecunditatis
  drawMare(550, 290, 45, 40, -0.3);  // Mare Nectaris
  drawMare(430, 310, 55, 45, 0.3);   // Mare Nubium
  drawMare(700, 170, 35, 30, 0.1);   // Mare Crisium

  // Bright rayed craters
  const drawCrater = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d343b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * (r * 6), cy + Math.sin(a) * (r * 6));
      ctx.stroke();
    }
  };

  drawCrater(470, 380, 7); // Tycho
  drawCrater(450, 210, 6); // Copernicus
  drawCrater(400, 190, 5); // Kepler

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Mercury Texture (عُطَارِد)
 * Heavily cratered metallic slate surface with scarps
 */
export function createMercuryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, 512, 256);

  // Surface cratering
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    const r = 3 + Math.random() * 12;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Venus Texture (الزُّهَرَة)
 * Silky golden-cream dense atmospheric cloud swirls
 */
export function createVenusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.3, '#fde047');
  grad.addColorStop(0.5, '#fef9c3');
  grad.addColorStop(0.7, '#fde047');
  grad.addColorStop(1, '#fef08a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Atmospheric cloud shear swirls
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 15; i++) {
    ctx.beginPath();
    const y = i * 18 + 10;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(150, y + 10, 350, y - 10, 512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Mars Texture (المِرِّيخ)
 * Rust-iron red terrain, volcanic dark basins, and polar ice
 */
export function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Rust ochre
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 512, 256);

  // Dark volcanic plains (Syrtis Major & Sinus Meridiani)
  ctx.fillStyle = '#450a0a';
  ctx.beginPath();
  ctx.ellipse(260, 140, 90, 50, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(380, 160, 60, 35, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // North & South Polar Ice Caps
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(256, 10, 80, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(256, 246, 70, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Jupiter Texture (المُشْتَرِي)
 * Amber, cream, terracotta atmospheric bands and Great Red Spot
 */
export function createJupiterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const bands = [
    { color: '#b45309', height: 40 },
    { color: '#fef3c7', height: 45 },
    { color: '#d97706', height: 50 },
    { color: '#fef9c3', height: 35 },
    { color: '#92400e', height: 55 }, // South Equatorial Belt
    { color: '#ffedd5', height: 60 }, // Equatorial Zone
    { color: '#b45309', height: 55 }, // North Equatorial Belt
    { color: '#fef3c7', height: 45 },
    { color: '#d97706', height: 40 },
    { color: '#78350f', height: 45 },
    { color: '#fef3c7', height: 42 },
  ];

  let y = 0;
  bands.forEach((b) => {
    ctx.fillStyle = b.color;
    ctx.fillRect(0, y, 1024, b.height);
    y += b.height;
  });

  // Turbulence ripples between belts
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const ry = i * 60 + 25;
    ctx.beginPath();
    ctx.moveTo(0, ry);
    for (let x = 0; x <= 1024; x += 64) {
      ctx.lineTo(x, ry + (Math.random() - 0.5) * 8);
    }
    ctx.stroke();
  }

  // The Great Red Spot (البيضة الحمراء العظيمة)
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.ellipse(640, 310, 48, 30, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 3;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Saturn Texture (زُحَل)
 * Golden sand and butterscotch pastel cloud bands
 */
export function createSaturnTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ca8a04');
  grad.addColorStop(0.2, '#fef08a');
  grad.addColorStop(0.4, '#eab308');
  grad.addColorStop(0.6, '#fef9c3');
  grad.addColorStop(0.8, '#d97706');
  grad.addColorStop(1, '#a16207');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Saturn Ring Texture (حَلَقات زُحَل)
 * Concentric ring discs with Cassini Division gap
 */
export function createSaturnRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');           // Inner void
  grad.addColorStop(0.15, 'rgba(202, 138, 4, 0.4)'); // C Ring (crepe)
  grad.addColorStop(0.35, 'rgba(234, 179, 8, 0.95)');// B Ring (bright, dense)
  grad.addColorStop(0.62, 'rgba(234, 179, 8, 0.95)');
  grad.addColorStop(0.63, 'rgba(0, 0, 0, 0.05)');   // Cassini Division (transparent)
  grad.addColorStop(0.68, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(0.69, 'rgba(202, 138, 4, 0.85)');// A Ring
  grad.addColorStop(0.96, 'rgba(161, 98, 7, 0.7)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');             // Outer void

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Sun Photosphere & Flare Texture (الشَّمْس)
 */
export function createSunParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const radGrad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  radGrad.addColorStop(0, '#ffffff');
  radGrad.addColorStop(0.2, '#fef08a');
  radGrad.addColorStop(0.45, '#f59e0b');
  radGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.5)');
  radGrad.addColorStop(0.9, 'rgba(180, 83, 9, 0.15)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Procedural Uranus Ice Giant Atmosphere Texture (أُورَانُوس)
 * Featureless cyan-aquamarine with delicate polar haze and methane clouds
 */
export function createUranusTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smooth cyan-aquamarine gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#a5f3fc');
  grad.addColorStop(0.2, '#67e8f9');
  grad.addColorStop(0.5, '#22d3ee');
  grad.addColorStop(0.8, '#06b6d4');
  grad.addColorStop(1, '#a5f3fc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle latitudinal haze
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let y = 30; y < 230; y += 18) {
    ctx.fillRect(0, y, 512, 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Neptune Ice Giant Atmosphere Texture (نِبْتُون)
 * Vibrant azure cobalt blue with high-altitude cirrus streaks and Great Dark Spot
 */
export function createNeptuneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep azure blue planetary gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(0.3, '#2563eb');
  grad.addColorStop(0.5, '#1e40af');
  grad.addColorStop(0.7, '#3b82f6');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // High-altitude white methane cirrus cloud streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(80, 70, 160, 4);
  ctx.fillRect(300, 140, 130, 5);
  ctx.fillRect(40, 180, 200, 4);

  // Great Dark Spot (deep vortex)
  const spotGrad = ctx.createRadialGradient(340, 100, 4, 340, 100, 24);
  spotGrad.addColorStop(0, '#0f172a');
  spotGrad.addColorStop(0.8, '#1e3a8a');
  spotGrad.addColorStop(1, 'rgba(30, 58, 138, 0)');
  ctx.fillStyle = spotGrad;
  ctx.beginPath();
  ctx.ellipse(340, 100, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
