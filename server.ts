import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import ytdl from "@distube/ytdl-core";
import { DEFAULT_CLINIC_SETTINGS } from "./src/data/defaults.js";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory clinic settings store with defaults
let activeSettings = { ...DEFAULT_CLINIC_SETTINGS };

// ================= API ROUTES =================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get clinic settings
app.get("/api/clinic/settings", (req, res) => {
  res.json({ success: true, settings: activeSettings });
});

// Update clinic settings
app.post("/api/clinic/settings", (req, res) => {
  try {
    const updated = req.body;
    activeSettings = { ...activeSettings, ...updated };
    res.json({ success: true, settings: activeSettings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to update settings" });
  }
});

// YouTube Direct Stream & Restriction Bypass Endpoint
app.get("/api/stream/:videoId", async (req, res) => {
  const { videoId } = req.params;
  
  if (!videoId || videoId.trim().length === 0) {
    return res.status(400).json({ success: false, error: "Missing videoId parameter" });
  }

  // Sanitize videoId in case full URL was passed
  let cleanId = videoId.trim();
  if (cleanId.includes("watch?v=")) {
    cleanId = cleanId.split("watch?v=")[1].split("&")[0];
  } else if (cleanId.includes("youtu.be/")) {
    cleanId = cleanId.split("youtu.be/")[1].split("?")[0];
  }

  console.log(`[Stream Processing] Requesting ultra-smooth HD stream for video ID: ${cleanId}`);

  // If a direct URL to an mp4 file was supplied
  if (cleanId.startsWith("http") && (cleanId.endsWith(".mp4") || cleanId.endsWith(".webm"))) {
    return res.json({
      success: true,
      videoId: cleanId,
      title: "Direct MP4 Video Stream",
      url: cleanId,
      isDirectMedia: true,
      isRestrictedEmbed: false,
    });
  }

  // Default to optimized YouTube IFrame Embed URL with standard hardware decoding
  const embedUrl = `https://www.youtube.com/embed/${cleanId}?autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1`;

  return res.json({
    success: true,
    videoId: cleanId,
    title: `YouTube Video (${cleanId})`,
    embedUrl,
    isDirectMedia: false,
    isRestrictedEmbed: false,
  });
});

// Playlist fetch proxy endpoint
app.get("/api/playlist/:playlistId", async (req, res) => {
  const { playlistId } = req.params;
  
  console.log(`[Playlist Request] Fetching playlist: ${playlistId}`);

  // Check if we have pre-configured presets matching playlistId
  const foundPreset = activeSettings.playlists.find(p => p.id === playlistId);
  if (foundPreset && foundPreset.videoIds.length > 0) {
    return res.json({
      success: true,
      playlistId,
      title: foundPreset.title,
      description: foundPreset.description,
      videoIds: foundPreset.videoIds,
    });
  }

  // Attempt public Invidious or YouTube scraper endpoint for custom user playlist IDs
  try {
    const resp = await fetch(`https://invidious.nerdvpn.de/api/v1/playlists/${playlistId}?fields=title,videos`, {
      signal: AbortSignal.timeout(4000),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data.videos && data.videos.length > 0) {
        const videoIds = data.videos.map((v: any) => v.videoId).filter(Boolean);
        return res.json({
          success: true,
          playlistId,
          title: data.title || "Custom Playlist",
          videoIds,
        });
      }
    }
  } catch (err) {
    console.warn(`[Playlist Fetch Warning] Could not resolve live YouTube playlist via API, returning default array.`);
  }

  // Default fallback for playlist
  return res.json({
    success: true,
    playlistId,
    title: "Summit Rehab Playlist",
    videoIds: [
      "dJ9A_A4U3Xg",
      "50kH0f3B0aY",
      "g_tea8ZNk5A",
      "4C-wgAXz24g",
      "inpok4MKVLM"
    ],
  });
});

// AI Announcement Generator Endpoint
app.post("/api/clinic/generate-announcements", async (req, res) => {
  try {
    const { clinicName, specialty, customPrompt, count = 6 } = req.body;

    const promptText = `
Generate ${count} short, engaging, and professional TV screen announcement messages for a medical/rehab clinic called "${clinicName || 'Summit Performance Rehab'}".
Specialty focus: ${specialty || 'Physical Therapy, Chiropractic, Sports Injury Rehab, Wellness'}.
Additional instructions: ${customPrompt || 'Include welcoming notes, front desk reminders, health tips, and social media calls to action.'}

Output MUST be a JSON array of objects with keys: "text" (the announcement string) and "category" (one of: "general", "reminder", "wellness", "social", "promo").
Each announcement should be 1-2 concise sentences, clear to read on a TV screen from across a room.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["text", "category"],
          },
        },
      },
    });

    const text = response.text || "[]";
    const announcements = JSON.parse(text);

    return res.json({ success: true, announcements });
  } catch (err: any) {
    console.error("[Gemini Announcement Error]", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to generate AI announcements",
    });
  }
});

// AI Wellness Tips Generator Endpoint
app.post("/api/clinic/generate-wellness-tips", async (req, res) => {
  try {
    const promptText = `
Generate 5 daily physical therapy, posture improvement, and movement wellness tips for clinic patients waiting in the reception lobby.
Keep each tip under 25 words, super easy to digest, actionable, and inspiring.
Return a JSON array of strings.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const tips = JSON.parse(response.text || "[]");
    return res.json({ success: true, tips });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || "Failed to generate wellness tips" });
  }
});

// ================= VITE / STATIC SERVING =================

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
    console.log(`Summit TV Smart App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
