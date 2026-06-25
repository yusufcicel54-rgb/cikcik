import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with reasonable size limits for icons
app.use(express.json({ limit: "5mb" }));

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Local persistent JSON storage path
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? path.join("/tmp", "configs_db.json")
  : path.join(process.cwd(), "configs_db.json");

const LOCK_FILE_PATH = isVercel
  ? path.join("/tmp", "gemini_lock.json")
  : path.join(process.cwd(), "gemini_lock.json");

// Check if Gemini is locked globally due to quota errors
function isGeminiLocked(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      const data = fs.readFileSync(LOCK_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return !!parsed.locked;
    }
  } catch (error) {
    console.error("Error reading lock file:", error);
  }
  return false;
}

// Update the global Gemini lock state
function setGeminiLocked(locked: boolean) {
  try {
    fs.writeFileSync(
      LOCK_FILE_PATH,
      JSON.stringify({ locked, updatedAt: new Date().toISOString() }),
      "utf-8"
    );
  } catch (error) {
    console.error("Error writing lock file:", error);
  }
}

// Load configs from local database
function getConfigs() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading configs DB:", error);
  }
  return {};
}

// Save configs to local database
function saveConfigs(configs: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(configs, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing configs DB:", error);
  }
}

// In-memory cache synced with file
let configsMap = getConfigs();

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Create/Store app configuration
app.post("/api/config", (req, res) => {
  try {
    const { name, url, icon, options } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "App Name and Target URL are required." });
    }

    // Generate a unique 6-digit config code (e.g., 482931)
    let code = "";
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (configsMap[code]);

    const newConfig = {
      id: code,
      name,
      url,
      icon: icon || "",
      options: options || {},
      createdAt: new Date().toISOString(),
    };

    configsMap[code] = newConfig;
    saveConfigs(configsMap);

    res.status(201).json(newConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "An error occurred while saving the configuration." });
  }
});

// Retrieve app configuration by ID
app.get("/api/config/:id", (req, res) => {
  const { id } = req.params;
  const config = configsMap[id];

  if (!config) {
    return res.status(404).json({ error: "App configuration not found for this code." });
  }

  res.json(config);
});

// Get all recent configs for the dashboard view
app.get("/api/configs/recent", (req, res) => {
  const list = Object.values(configsMap)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Return top 5 recent builds
  res.json(list);
});

// AI App Icon Generator via Gemini (SVG output)
app.post("/api/generate-icon", async (req, res) => {
  const { appName, description, stylePrompt } = req.body;

  if (isGeminiLocked()) {
    return res.status(503).json({
      error: "Gemini API kullanım kotası dolduğu için yapay zeka ile ikon tasarlama özelliği geçici olarak kilitlenmiştir. Lütfen şablon ikonları kullanın.",
      locked: true
    });
  }

  if (!appName) {
    return res.status(400).json({ error: "App Name is required for icon generation." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini API is not configured. Please supply a GEMINI_API_KEY in Secrets.",
    });
  }

  try {
    const systemInstruction = `You are an elite, modern Android Application Icon and Vector Brand designer.
Your task is to generate a gorgeous, high-contrast, professional, minimalist SVG icon for an Android App.

The user will provide the App Name, its description or purpose, and some optional style suggestions.
Analyze these and design a visual metaphor that perfectly captures the app's spirit.

CRITICAL RULES FOR OUTPUT:
1. Output MUST be ONLY valid, raw SVG code.
2. DO NOT wrap the output in markdown code blocks like \`\`\`xml or \`\`\`svg.
3. DO NOT include any introductory or concluding text, explanations, or notes.
4. The output must start exactly with '<svg' and end exactly with '</svg>'.
5. Ensure the SVG is well-formed, valid XML.

SVG SPECIFICATIONS:
- viewBox="0 0 512 512" (important!)
- Standard xmlns="http://www.w3.org/2000/svg"
- Use beautiful, modern CSS gradients (<linearGradient> or <radialGradient> with unique IDs).
- Centered elements with neat padding (so the logo graphics are not cut off at the edges).
- Add a rounded background container inside the SVG (e.g., <rect width="512" height="512" rx="100" fill="..."/>) to act as an adaptive squircle launcher icon.
- Over the background rect, place a stunning abstract emblem, visual metaphor, or sleek geometric shape that relates to the app.
- Do not use fonts or text labels inside the logo unless absolutely essential; rely on pure visual iconography.
- Ensure colors are rich, modern, and have high-contrast (e.g. Deep Blues, Electric Purples, Vibrant Teals, Sleek Obsidian, Glowing Amber).`;

    const promptText = `App Name: "${appName}"
App Purpose/Category: "${description || "General utility web app"}"
Design Style request: "${stylePrompt || "Minimalist, flat material design, striking gradient color palette"}"

Please generate a professional, production-ready, beautiful squircle SVG app icon following the guidelines.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    // Sanitize the output just in case the model returns markdown ticks despite instructions
    let svgCode = text.trim();
    if (svgCode.startsWith("```")) {
      // Strip starting code block
      svgCode = svgCode.replace(/^```[a-zA-Z]*\n/, "");
      // Strip ending code block
      svgCode = svgCode.replace(/\n```$/, "");
    }
    svgCode = svgCode.trim();

    if (!svgCode.startsWith("<svg") || !svgCode.endsWith("</svg>")) {
      console.warn("Raw Gemini Output did not conform to raw SVG format:", text);
      throw new Error("Generated content was not a valid SVG format.");
    }

    res.json({ svg: svgCode });
  } catch (error: any) {
    console.error("Error generating SVG icon:", error);
    const errMsg = String(error?.message || error || "").toLowerCase();
    
    // Check if the error is a quota/rate-limit/capacity error
    const isQuotaError = 
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("exhausted") ||
      errMsg.includes("rate_limit") ||
      errMsg.includes("rate limit") ||
      errMsg.includes("too many requests") ||
      errMsg.includes("limit_exceeded") ||
      errMsg.includes("limit exceeded") ||
      errMsg.includes("capacity");

    if (isQuotaError) {
      console.warn("Gemini API Quota/Rate Limit reached! Locking feature globally for all users.");
      setGeminiLocked(true);
    }

    res.status(500).json({ 
      error: error.message || "Failed to generate SVG icon.",
      locked: isQuotaError
    });
  }
});

// GET endpoint to query Gemini quota/lock status
app.get("/api/gemini-status", (req, res) => {
  res.json({ locked: isGeminiLocked() });
});

// POST endpoint to manually reset/unlock Gemini for testing/recovery
app.post("/api/gemini-status/reset", (req, res) => {
  setGeminiLocked(false);
  res.json({ locked: false, message: "Gemini API kilidi başarıyla kaldırıldı." });
});

// Configure Vite middleware and SPA routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WebInApkNoAds server booted successfully on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server if not running in Vercel serverless environment
if (!isVercel) {
  startServer();
}

export default app;
