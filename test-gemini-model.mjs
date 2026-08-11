import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: `Video URL: https://www.youtube.com/watch?v=1F_C6HQwuM0
Please provide a verbatim, timestamped speech-to-text transcript of the actual spoken audio in this video.`,
            config: { responseMimeType: "application/json" }
        });
        console.log("2.5 SUCCESS:", response.text.slice(0, 100));
    } catch (e) {
        console.error("2.5 ERROR:", e.status, e.message);
    }
}
test();
