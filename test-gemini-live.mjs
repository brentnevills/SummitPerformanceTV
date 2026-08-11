import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Video URL: https://www.youtube.com/watch?v=jfKfPfyJRdk
Please describe this video.`,
        });
        console.log(response.text);
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}
test();
