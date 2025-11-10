
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface EventStats {
  totalAttendees: number;
  entranceToday: number;
  lunchToday: number;
}

export const generateSummary = async (stats: EventStats): Promise<string> => {
    if (!ai) {
        throw new Error("Gemini API is not initialized. Please provide an API key.");
    }
    
  const prompt = `
    You are an event management assistant. Based on the following daily statistics, provide a brief, insightful summary of the event's activity.
    The tone should be professional but encouraging.

    Today's Statistics:
    - Total Registered Attendees: ${stats.totalAttendees}
    - Unique Entrances Today: ${stats.entranceToday}
    - Lunches Served Today: ${stats.lunchToday}

    Please analyze these numbers and generate a short summary. For example, comment on the turnout rate or lunch redemption rate.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error("Failed to communicate with the Gemini API.");
  }
};
