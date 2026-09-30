import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        mode = 'balanced',
        useSearchGrounding = true,
        projectContext = '',
      } = req.body;

      // Select model according to mode
      const selectedModel =
        mode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

      const systemInstruction = `You are the Kinetix Lab Principal Robotics & Autonomous UAV Control Engineer.
Your role is to help the engineer debug robotics and drone failures, tune PID/MPC/SO(3)/EKF control loops, write deterministic zero-heap C++17 microcontroller code (STM32H7, Teensy 4.1, ESP32-S3, RP2040), design mechatronics hardware pinouts, and optimize edge models on Qualcomm AI Hub (Dragonwing RB3 Gen 2, RB5, Snapdragon Flight Hexagon NPU).
Keep answers concise, technically rigorous, and grounded in real datasheets, control theory equations, and embedded firmware best practices.

Active Workbench Context:
${projectContext}`;

      const contents = messages.map(
        (m: { role: 'user' | 'model'; text: string }) => ({
          role: m.role,
          parts: [{ text: m.text }],
        })
      );

      const config: Record<string, unknown> = {
        systemInstruction,
      };

      if (useSearchGrounding && selectedModel === 'gemini-3.8-flash') {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });

      const replyText = response.text || 'No response generated.';
      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

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
        modelUsed: selectedModel,
        sources,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unexpected Gemini API error';
      console.error('Gemini API error:', errorMessage);
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
