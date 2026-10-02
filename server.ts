import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { extractSymptomsLocal } from './src/engine/nlpExtractor';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey && geminiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI:', err);
  }
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'CareCompass AI',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

/**
 * NLP Symptom Extraction Endpoint
 * Takes sanitized free text and extracts structured symptoms
 */
app.post('/api/extract-symptoms', async (req, res) => {
  const { text, language } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text input required' });
  }

  // If Gemini is available, use Gemini 3.8 Flash with structured JSON
  if (ai) {
    try {
      const prompt = `You are a clinical NLP extractor for a healthcare decision-support tool.
Extract all symptoms mentioned in the following patient description.
The user text may be in English, Hindi, Telugu, or transliterated Hinglish/Tenglish.
Return JSON with an array of extracted symptoms.

Patient description:
"${text}"

Rules:
1. For each symptom identify:
   - name: Standard clinical/common name in English (e.g., "Chest Tightness", "Cough", "Fever", "Headache", "Nausea").
   - bodyArea: One of ["head", "chest", "abdomen", "back", "limbs", "throat", "skin", "systemic", "respiratory", "neurological", "other"].
   - severity: Estimated integer from 1 to 10 based on adjectives ("mild" = 2-3, "moderate" = 4-6, "severe/unbearable" = 7-10).
   - duration: Mentioned duration (e.g., "1 day", "3 days", "since morning", "2 hours").
   - durationDays: Numeric estimated duration in days (e.g., 0.1 for 2 hours, 0.5 for morning, 1.0, 3.0).
   - isNegation: Boolean. True IF AND ONLY IF the patient explicitly stated they DO NOT have this symptom (e.g., "no fever", "bukhar nahi hai", "without vomiting", "no chest pain").
   - confidence: Number between 0.8 and 1.0.

Respond strictly in valid JSON matching this schema:
{
  "symptoms": [
    {
      "name": string,
      "bodyArea": string,
      "severity": number,
      "duration": string,
      "durationDays": number,
      "isNegation": boolean,
      "confidence": number
    }
  ]
}`;

      const result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawJson = result.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed.symptoms)) {
          const formatted = parsed.symptoms.map((s: any, idx: number) => ({
            id: `sym-gemini-${Date.now()}-${idx}`,
            name: s.name || 'Unspecified Symptom',
            bodyArea: s.bodyArea || 'systemic',
            severity: typeof s.severity === 'number' ? s.severity : 5,
            duration: s.duration || '1-2 days',
            durationDays: typeof s.durationDays === 'number' ? s.durationDays : 1,
            isNegation: !!s.isNegation,
            confidence: typeof s.confidence === 'number' ? s.confidence : 0.95,
          }));
          return res.json({ symptoms: formatted, source: 'gemini_3.8_flash' });
        }
      }
    } catch (llmErr) {
      console.warn('Gemini extraction error, falling back to local NLP:', llmErr);
    }
  }

  // Robust server-side fallback
  const fallback = extractSymptomsLocal(text);
  return res.status(200).json({ symptoms: fallback, source: 'nlp_rule_engine' });
});

// Production static file serving vs Development Vite middleware
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`CareCompass server listening on http://0.0.0.0:${PORT} (${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
