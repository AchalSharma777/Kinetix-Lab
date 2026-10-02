import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory cache timestamp to prevent repetitive 429 SDK retry delays when search quota is exhausted
let searchQuotaExhaustedUntil = 0;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  app.post('/api/engineering-chat', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error:
            'GEMINI_API_KEY is not configured. Please check your API key in the Settings > Secrets panel.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const {
        messages = [],
        mode = 'general',
        useSearchGrounding = false,
        projectContext = '',
      } = req.body;

      // Model selection per user specification:
      // gemini-3.5-flash for general tasks & Google Search Grounding
      // gemini-3.1-flash-lite for fast tasks
      const targetModel =
        mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash';

      const systemInstruction = `You are the Kinetix Lab Principal Robotics & Autonomous UAV Control Engineer.
Your role is to assist engineers with:
1. Debugging robotics and UAV telemetry regressions, motor desyncs, gyro resonance, and frame oscillations.
2. Deriving and tuning PID, MPC, SO(3) geometric attitude, and 15-state ES-EKF sensor fusion algorithms.
3. Writing zero-heap, deterministic C++17 microcontroller drivers and register mappings for STM32H7, STM32F4, Teensy 4.1, ESP32-S3, and RP2040.
4. Designing mechatronics hardware, BOM selection, isolated CAN-FD bus routing, and pre-power smoke tests.
5. Optimizing edge AI perception/depth models with Qualcomm AI Hub (Dragonwing RB3 Gen 2, RB5, Snapdragon Flight QRB5165 Hexagon NPU).

Format mathematical equations clearly and provide production-ready C++/Python code snippets where relevant.

Active Workbench Context:
${projectContext}`;

      // Build and sanitize multi-turn contents ensuring strict alternating user/model turns
      const rawList = Array.isArray(messages) ? messages : [];
      const sanitizedContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      for (const m of rawList) {
        if (!m || typeof m.text !== 'string' || !m.text.trim()) continue;
        const role = m.role === 'model' ? 'model' : 'user';

        // Gemini multi-turn conversation must begin with a 'user' turn
        if (sanitizedContents.length === 0 && role !== 'user') continue;

        const lastItem = sanitizedContents[sanitizedContents.length - 1];
        if (lastItem && lastItem.role === role) {
          lastItem.parts.push({ text: m.text.trim() });
        } else {
          sanitizedContents.push({ role, parts: [{ text: m.text.trim() }] });
        }
      }

      // If no valid user input was parsed, fallback to a default prompt
      if (sanitizedContents.length === 0) {
        sanitizedContents.push({
          role: 'user',
          parts: [{ text: 'Provide a summary of the active robotics and drone projects.' }],
        });
      }

      let response;
      let usedSearch = false;
      let searchFallbackNotice: string | null = null;
      let finalModel = targetModel;

      const shouldAttemptSearch =
        useSearchGrounding && Date.now() > searchQuotaExhaustedUntil;

      // If Search Grounding is requested and not in rate-limit cooldown
      if (shouldAttemptSearch) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: sanitizedContents,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          });
          usedSearch = true;
          finalModel = 'gemini-3.5-flash';
        } catch (searchErr: unknown) {
          const searchErrMsg =
            searchErr instanceof Error ? searchErr.message : String(searchErr);
          console.warn('Google Search Grounding call failed, falling back to standard model:', searchErrMsg);

          // If quota exhausted on search tool, set a 60s cooldown to prevent slow repeat timeouts
          if (searchErrMsg.includes('429') || searchErrMsg.includes('RESOURCE_EXHAUSTED')) {
            searchQuotaExhaustedUntil = Date.now() + 60_000;
          }

          searchFallbackNotice =
            'Search Grounding quota exceeded on current API tier; response generated via Gemini 3.5 Flash engineering knowledge base.';
        }
      } else if (useSearchGrounding && Date.now() <= searchQuotaExhaustedUntil) {
        searchFallbackNotice =
          'Search Grounding in cooldown due to API tier quota; response generated via Gemini 3.5 Flash knowledge base.';
      }

      // Standard generation fallback (without search tools)
      if (!response) {
        try {
          response = await ai.models.generateContent({
            model: targetModel,
            contents: sanitizedContents,
            config: {
              systemInstruction,
            },
          });
          finalModel = targetModel;
        } catch (primaryErr: unknown) {
          console.warn(`Primary model ${targetModel} failed, trying fallback model gemini-3.1-flash-lite:`, primaryErr);
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: sanitizedContents,
            config: {
              systemInstruction,
            },
          });
          finalModel = 'gemini-3.1-flash-lite';
        }
      }

      const replyText = response?.text || 'No response generated.';
      const rawChunks =
        response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const sources = rawChunks
        .map((c: { web?: { uri?: string; title?: string } }) =>
          c.web?.uri
            ? {
                uri: c.web.uri,
                title: c.web.title || c.web.uri,
              }
            : null
        )
        .filter(Boolean);

      return res.json({
        text: replyText,
        modelUsed: finalModel,
        usedSearch,
        sources,
        searchFallbackNotice,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unexpected Gemini API error';
      console.error('Gemini API error in /api/engineering-chat:', errorMessage);
      return res.status(500).json({
        error: errorMessage,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix Lab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
