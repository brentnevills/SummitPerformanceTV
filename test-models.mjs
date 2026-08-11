import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
    try {
        const models = await ai.models.list();
        for await (const m of models) {
           if (m.name.includes("gemini")) {
              console.log(m.name);
           }
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
