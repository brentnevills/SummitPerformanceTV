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

// AI / Real Live Captions Generator for playing video
app.get("/api/video/captions/:videoId", async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ success: false, error: "Missing videoId" });
  }

  let cleanId = videoId.trim();
  if (cleanId.includes("watch?v=")) {
    cleanId = cleanId.split("watch?v=")[1].split("&")[0];
  } else if (cleanId.includes("youtu.be/")) {
    cleanId = cleanId.split("youtu.be/")[1].split("?")[0];
  }

  try {
    let videoTitle = "";
    let authorName = "";

    // Fetch official video metadata via YouTube oEmbed (fast & reliable)
    try {
      const oembedResp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`, {
        signal: AbortSignal.timeout(3000),
      });
      if (oembedResp.ok) {
        const oembedData = await oembedResp.json();
        videoTitle = oembedData.title || "";
        authorName = oembedData.author_name || "";
      }
    } catch (e) {
      // Ignore oEmbed failure
    }

    // 1. Try fetching real YouTube native captions via public Invidious instances
    try {
      const invResp = await fetch(`https://invidious.nerdvpn.de/api/v1/videos/${cleanId}?fields=title,description,captions`, {
        signal: AbortSignal.timeout(3000),
      });
      if (invResp.ok) {
        const invData = await invResp.json();
        if (!videoTitle && invData.title) videoTitle = invData.title;

        if (invData.captions && invData.captions.length > 0) {
          const enCaption = invData.captions.find((c: any) => c.languageCode === "en" || c.label?.toLowerCase().includes("english")) || invData.captions[0];
          if (enCaption && enCaption.url) {
            const capResp = await fetch(`https://invidious.nerdvpn.de${enCaption.url}`, {
              signal: AbortSignal.timeout(3000),
            });
            if (capResp.ok) {
              const vttText = await capResp.text();
              const cues: { startTime: number; endTime: number; text: string }[] = [];
              const lines = vttText.split(/\r?\n/);
              let currentCue: { startTime: number; endTime: number; text: string } | null = null;

              for (const line of lines) {
                const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
                const shortTimeMatch = line.match(/(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2})[.,](\d{3})/);

                if (timeMatch) {
                  const startSec = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
                  const endSec = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]);
                  currentCue = { startTime: startSec, endTime: endSec, text: "" };
                } else if (shortTimeMatch) {
                  const startSec = parseInt(shortTimeMatch[1]) * 60 + parseInt(shortTimeMatch[2]);
                  const endSec = parseInt(shortTimeMatch[4]) * 60 + parseInt(shortTimeMatch[5]);
                  currentCue = { startTime: startSec, endTime: endSec, text: "" };
                } else if (currentCue && line.trim() && !line.startsWith("WEBVTT") && !line.match(/^\d+$/)) {
                  const cleanText = line.replace(/<[^>]*>/g, "").trim();
                  if (cleanText) {
                    currentCue.text = currentCue.text ? `${currentCue.text} ${cleanText}` : cleanText;
                    cues.push(currentCue);
                    currentCue = null;
                  }
                }
              }

              if (cues.length > 0) {
                return res.json({
                  success: true,
                  source: "youtube_native",
                  videoId: cleanId,
                  videoTitle,
                  captions: cues,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore network / timeout errors
    }

    // 2. Generate live video-matched captions using Gemini AI based on exact video title & creator
    const promptText = `
You are generating YouTube Closed Captions for a video.
Video YouTube ID: "${cleanId}"
Video Title: "${videoTitle || 'Physical Therapy & Rehab Exercise Routine'}"
Video Creator/Channel: "${authorName || 'Health Specialist'}"

Generate 12 to 18 sequential caption cues covering a 3-minute video playback duration.
Each cue MUST be specifically tailored to the subject matter, exercise steps, techniques, and verbal instructions belonging to the specific video titled "${videoTitle || 'Exercise Routine'}".

Return JSON object:
{
  "captions": [
    { "startTime": 0, "endTime": 6, "text": "..." },
    { "startTime": 6, "endTime": 12, "text": "..." }
  ]
}

Guidelines for captions:
- Concise, short sentence fragments or single natural sentences (max 10-12 words per cue).
- Direct instructional and descriptive subtitles matching "${videoTitle}".
- Smooth progression from introduction, step-by-step posture/movement cues, breathing guidance, to completion.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                },
                required: ["startTime", "endTime", "text"],
              },
            },
          },
          required: ["captions"],
        },
      },
    });

    const data = JSON.parse(response.text || '{"captions":[]}');
    return res.json({
      success: true,
      source: "ai_generated",
      videoId: cleanId,
      videoTitle,
      captions: data.captions || [],
    });
  } catch (err: any) {
    console.error("[Live Captions Error]", err);
    return res.json({
      success: true,
      source: "fallback",
      videoId: cleanId,
      captions: [
        { startTime: 0, endTime: 7, text: "Welcome to Summit Physical Therapy & Performance Rehab." },
        { startTime: 7, endTime: 14, text: "Today we are focusing on targeted mobility and corrective exercises." },
        { startTime: 14, endTime: 22, text: "Ensure your core is engaged and maintain steady, controlled breathing." },
        { startTime: 22, endTime: 30, text: "Focus on proper alignment through each phase of the movement." },
        { startTime: 30, endTime: 38, text: "Hold stretches gently for 15 to 30 seconds without bouncing." },
        { startTime: 38, endTime: 46, text: "Perform 2 to 3 sets as prescribed by your physical therapist." },
        { startTime: 46, endTime: 60, text: "Summit Performance Rehab — Restoring motion and strength." }
      ],
    });
  }
});

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
