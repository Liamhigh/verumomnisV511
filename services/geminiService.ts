/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { AssistantResponse } from '../types';

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI;

const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    throw new Error("Gemini API Key not configured. Set process.env.API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function callApi(prompt: string, systemInstruction: string): Promise<string> {
    const currentAi = getAiInstance();
    const contents: Content[] = [{ role: "user", parts: [{ text: prompt }] }];
    
    try {
        const response: GenerateContentResponse = await currentAi.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: {
                systemInstruction,
                safetySettings: safetySettings,
            },
        });
        return response.text || '';
    } catch(e) {
        console.error('API call failed:', e);
        return `Error from provider: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }
}

// Simple string similarity (Jaccard index)
function calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

export const getAssistantResponse = async (
  prompt: string,
  context: string,
): Promise<AssistantResponse> => {
  const fullPrompt = `${context}\n\nUSER QUERY: ${prompt}`;

  const systemInstruction1 = "You are a helpful legal assistant. Provide a clear, concise, and direct answer based on the provided context.";
  const systemInstruction2 = "You are a cautious forensic AI. Analyze the context carefully and provide a detailed, descriptive answer, noting any ambiguities.";

  try {
    const [res1, res2] = await Promise.all([
      callApi(fullPrompt, systemInstruction1),
      callApi(fullPrompt, systemInstruction2)
    ]);
    
    // Simulate consensus logic as per spec
    const similarity = calculateSimilarity(res1, res2);
    const isDivergent = similarity < 0.7; // Threshold for divergence

    let consensusText = "";
    if (!isDivergent) {
      // If responses are similar, use the more concise one (or just the first one).
      // A more advanced implementation might merge them or ask Gemini to summarize.
      consensusText = res1;
    }
    
    return {
      api1Response: res1,
      api2Response: res2,
      consensusText: consensusText,
      text: isDivergent ? "See divergent responses." : consensusText,
      isDivergent: isDivergent,
    };
  } catch (error) {
    console.error("Error in dual API orchestration:", error);
    if (error instanceof Error) {
       throw new Error(`Failed to get response from AI assistant: ${error.message}`);
    }
    throw new Error("Failed to get response from AI assistant due to an unknown error.");
  }
};