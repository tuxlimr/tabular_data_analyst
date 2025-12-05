import { GoogleGenAI, Type } from "@google/genai";
import { DataRow } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-types' });

export const analyzeOutliersWithGemini = async (
  dataSample: DataRow[],
  columns: string[],
  outlierIndices: number[],
  xAxis: string,
  yAxis: string
): Promise<{ summary: string; outlierAnalysis: string; actionableInsights: string[] }> => {
  
  if (!apiKey) {
    return {
      summary: "API Key missing. Cannot generate AI insights.",
      outlierAnalysis: "Please check your configuration.",
      actionableInsights: []
    };
  }

  // We limit the data sent to avoid token limits, prioritizing the identified outliers
  const outliers = outlierIndices.map(i => dataSample[i]);
  const normalSample = dataSample.filter((_, i) => !outlierIndices.includes(i)).slice(0, 10);
  
  const prompt = `
    You are a senior data scientist. I have a dataset with columns: ${columns.join(', ')}.
    We are analyzing the relationship between "${xAxis}" and "${yAxis}".
    
    Here is a sample of "normal" data points:
    ${JSON.stringify(normalSample)}

    Here are the detected statistical outliers (High Z-Score):
    ${JSON.stringify(outliers)}

    Please provide a structured analysis in JSON format containing:
    1. "summary": A brief overview of the data relationship observed.
    2. "outlierAnalysis": Specific commentary on why these points might be outliers in this context (e.g., data errors, anomalies, or high-performers).
    3. "actionableInsights": A list of 3 specific recommendations based on this data.

    Do not include markdown code blocks. Just return the JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            outlierAnalysis: { type: Type.STRING },
            actionableInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const result = response.text;
    if (!result) throw new Error("No response from Gemini");
    
    return JSON.parse(result);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Failed to generate analysis.",
      outlierAnalysis: "An error occurred while communicating with the AI model.",
      actionableInsights: ["Try again later."]
    };
  }
};
