import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze-risk", async (req, res) => {
    try {
      const { protocolData } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `
          Eres un Auditor Senior de Seguridad Web3 y Analista de Riesgos para el Protocolo Sentinel Vault.
          Analiza este protocolo DeFi y devuelve un score de riesgo (0-100).
          
          DATA:
          ${JSON.stringify(protocolData)}
          
          Justificación en INGLÉS profesional.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              status: { type: Type.STRING },
              justification: { type: Type.STRING },
              yieldAdjustment: { type: Type.STRING }
            },
            required: ["score", "status", "justification", "yieldAdjustment"]
          }
        }
      });

      const analysis = JSON.parse(response.text || "{}");
      res.json(analysis);
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ 
        score: 99, 
        status: "CRITICAL", 
        justification: "Oráculo de IA desconectado. Modo de máxima precaución activado.", 
        yieldAdjustment: "N/A" 
      });
    }
  });

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);

  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
