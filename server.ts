import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze-face", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are a professional hairstylist and face shape analyst. Analyze the face in the image and return ONLY a valid JSON object with no markdown, no explanation, and no extra text. The JSON must follow this exact structure:
{
  "faceShape": "oval | round | square | heart | oblong | diamond",
  "faceShapeDescription": "one sentence describing the face shape features you detected",
  "recommendations": [
    {
      "styleName": "name of the hairstyle",
      "description": "detailed description of this hairstyle in 2 sentences",
      "whySuited": "one sentence explaining why this suits the detected face shape",
      "referenceKeyword": "a 3-4 word image search keyword for this hairstyle (e.g. textured quiff fade)"
    }
  ]
}
Provide exactly 4 hairstyle recommendations. If no human face is detected, return: {"error": "No face detected"}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          },
          prompt
        ]
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error generating face analysis:', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        return res.status(400).json({ error: "Your Gemini API Key is invalid or missing. Please set a valid GEMINI_API_KEY in the AI Studio Settings (Secrets icon)." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/style-match", async (req, res) => {
    try {
      const { preferences } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are an expert master barber. Based on the following client profile, recommend the PERFECT haircut and styling approach.

Profile:
- Face Shape: ${preferences.faceShape}
- Hair Type: ${preferences.hairType}
- Maintenance Level: ${preferences.maintenance}
- Desired Vibe: ${preferences.styleVibe}

Respond ONLY with a JSON object in this exact format, with no markdown:
{
  "recommendedStyle": "Name of the haircut",
  "description": "2-3 sentences describing the cut and why it's perfect for their profile",
  "barberInstructions": "Technical instructions for the barber (e.g. guard sizes, texturizing techniques, fade types)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error generating style match:', error);
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        return res.status(400).json({ error: "Your Gemini API Key is invalid or missing. Please set a valid GEMINI_API_KEY in the AI Studio Settings (Secrets icon)." });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
