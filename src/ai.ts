import { GoogleGenAI, Type } from "@google/genai";
import { Note, Insight } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ProcessedInput {
  title: string;
  summary: string;
  topic: string;
  tags: string[];
  entities: string[];
}

export const processCapture = async (content: string): Promise<ProcessedInput> => {
  const isUrl = content.trim().startsWith('http');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          topic: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "summary", "topic", "tags", "entities"]
      },
      systemInstruction: `You are the AI engine for Second Brain AI. 
      Analyze the input content and extract structured metadata. 
      ${isUrl ? "The input is a URL. Describe what this content likely represents if you can't fetch it directly, or analyze the text provided." : ""}
      Identify key entities and concepts mentioned.`
    },
    contents: [{ role: 'user', parts: [{ text: content }] }]
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    throw new Error("AI processing failed");
  }
};

export const generateInsights = async (notes: Note[]): Promise<Partial<Insight>[]> => {
  if (notes.length === 0) return [];

  const context = notes.slice(0, 10).map(n => `- ${n.title}: ${n.summary}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["correlation", "lead", "gap"] },
            actionText: { type: Type.STRING }
          },
          required: ["title", "content", "type", "actionText"]
        }
      },
      systemInstruction: "Analyze the user's latest research notes and identify 3 unique insights. Look for trends (correlation), follow-up ideas (lead), or missing information (gap)."
    },
    contents: [{ role: 'user', parts: [{ text: `Here are my latest notes:\n${context}` }] }]
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error("Failed to generate insights:", err);
    return [];
  }
};

export const generateQueryResponse = async (question: string, context: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are Luminary AI, a Second Brain assistant. Use the following context from the user's personal knowledge base to answer the question. 
      Only answer based on the context. If the information is not there, explicitly state it is a "General Brain Knowledge" answer.
      Context: ${context}`
    },
    contents: [{ role: 'user', parts: [{ text: question }] }]
  });

  return response.text;
};
