import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const SYSTEM_INSTRUCTION = `You are Al-Falakiyy (العالِم الفَلَكي), a master classical Islamic astronomer, mathematician, and historian of science. You represent the rigorous scholarly tradition of Nasir al-Din al-Tusi (Maragha Observatory, al-Tadhkira fi 'ilm al-hay'a), Ibn al-Shatir of Damascus (Nihayat al-su'l), Abu Rayhan al-Biruni (al-Qanun al-Mas'udi), Al-Battani (Kitab al-Zij al-Sabi'), Abd al-Rahman al-Sufi (Kitab Suwar al-Kawakib al-Thabitah), and Al-Farghani.

Your duty is to provide deeply scholarly, mathematically precise, and historically grounded answers.
- Explain the exact geometric mechanics: Tusi Couple (zauj al-Tusi: a circle of radius r rolling inside 2r generating rectilinear harmonic motion x = 2r cos wt), Ibn al-Shatir's non-equant concentric double-epicycle system, and Al-Urdi's lemma.
- Provide classical Arabic astronomical terms with Arabic script, vocalized transliteration, and English definitions (e.g., Falak al-Aflak فلك الأفلاك, Falak al-Buruj فلك البروج, Manazil al-Qamar منازل القمر, Awj أوج, Hadid حضيض, al-Tadwir التدوير, al-Hamil الحامل).
- When spherical trigonometry is discussed (such as calculating celestial coordinates, altitude, azimuth, rising/setting arcs, or obliquity), provide the exact formulas and derivations (sine law, spherical cosines, right ascension and declination transformations).
- Reference the historical treatises, observatories (Maragha, Samarkand / Ulugh Beg, Damascus, Baghdad Bayt al-Hikma), and historical context.
Be articulate, profound, and respectful of classical scientific heritage.`;

// Gemini AI Islamic Astronomy Scholar endpoint
app.post('/api/gemini/scholar', async (req, res) => {
  try {
    const { prompt, modelContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY to your environment.',
      });
    }

    const fullPrompt = modelContext
      ? `[Current Celestial Model State & Context]:\n${modelContext}\n\n[Scholar Query]:\n${prompt}`
      : prompt;

    // Use gemini-3.8-flash with High Thinking Level
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({
      text: response.text || 'No response generated.',
      model: 'gemini-3.8-flash (ThinkingLevel.HIGH)',
    });
  } catch (err: any) {
    console.error('Gemini scholar endpoint error:', err);
    return res.status(500).json({
      error: err?.message || 'Failed to consult the celestial scholar.',
    });
  }
});

// Classical Geocentric Ephemeris API (Ecliptic and Equatorial coordinates)
app.get('/api/ephemeris/positions', (req, res) => {
  const day = parseFloat(req.query.day as string) || 0;
  const eps = 23.44 * (Math.PI / 180);

  // Mean Solar Longitude along Ecliptic
  const sunLambda = ((day * (2 * Math.PI / 365.256)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const sunAlpha = Math.atan2(Math.sin(sunLambda) * Math.cos(eps), Math.cos(sunLambda));
  const sunDelta = Math.asin(Math.sin(eps) * Math.sin(sunLambda));

  // Mean Lunar Longitude
  const moonLambda = ((day * (2 * Math.PI / 27.3216)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

  res.json({
    day,
    sun: {
      eclipticLongitudeDeg: Math.round(((sunLambda * 180 / Math.PI) % 360) * 100) / 100,
      rightAscensionHours: Math.round(((((sunAlpha * 180 / Math.PI) + 360) % 360) / 15) * 100) / 100,
      declinationDeg: Math.round((sunDelta * 180 / Math.PI) * 100) / 100,
    },
    moon: {
      eclipticLongitudeDeg: Math.round(((moonLambda * 180 / Math.PI) % 360) * 100) / 100,
    },
    classicalReference: "Al-Battani, 'Kitab al-Zij al-Sabi' & Nasir al-Din al-Tusi, 'Zij al-Ilkhani'",
  });
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Falak Celestial Model server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
