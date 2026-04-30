import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, SchemaType } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/analyze-risk", async (req, res) => {
    try {
      const { protocolData } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined");
      }

      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              score: { type: SchemaType.NUMBER },
              status: { type: SchemaType.STRING },
              justification: { type: SchemaType.STRING },
              yieldAdjustment: { type: SchemaType.STRING }
            },
            required: ["score", "status", "justification", "yieldAdjustment"]
          }
        }
      });

      const prompt = `
        Eres un Auditor Senior de Seguridad Web3 y Analista de Riesgos para el Protocolo Sentinel Vault.
        Analiza este protocolo DeFi y devuelve un score de riesgo (0-100).
        
        DATA:
        ${JSON.stringify(protocolData)}
        
        Justificación en INGLÉS profesional.
      `;

      const result = await model.generateContent(prompt);
      const analysis = JSON.parse(result.response.text());
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
