import { GoogleGenAI, Type } from "@google/genai";
import { ExamQuestion } from "../types";

// Helper to convert File to Base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseExamContent = async (
  textInput: string,
  files: File[],
  apiKey?: string,
  baseUrl?: string
): Promise<ExamQuestion[]> => {
  try {
    // Initialize AI here to avoid top-level execution errors
    // Use provided key or fallback to env var (though env var might be empty in client-side only builds)
    const key = apiKey || process.env.API_KEY;
    if (!key) {
        throw new Error("请提供 API Key");
    }

    const clientOptions: any = { apiKey: key };
    if (baseUrl && baseUrl.trim() !== '') {
        clientOptions.baseUrl = baseUrl.trim();
    }

    const ai = new GoogleGenAI(clientOptions);
    const model = 'gemini-3-flash-preview';

    // Prepare the parts
    const parts: any[] = [];
    
    // Add text prompt
    let promptText = `
      You are an expert exam data extractor. Analyze the provided images and/or text.
      Identify exam questions and extract them into a structured JSON format.
      
      CRITICAL INSTRUCTION: Categorize every question into one of these exact types in the 'questionType' field:
      1. "单选题" (Single Choice)
      2. "多选题" (Multiple Choice)
      3. "判断题" (True/False)
      4. "简答题" (Short Answer)
      
      Map the content to the following fields:
      - questionType: One of the 4 types above. If the image header says "选择题" (Choice), look at the content to decide if it is Single or Multiple. If unsure, default to "单选题".
      - applicableType: Default to "生产保障" unless specific context suggests otherwise.
      - questionTitle: The question text itself. Remove initial numbers (e.g., "1.", "2.") from the text.
      - fileUrl: Leave empty unless a URL is explicitly provided.
      - optionA: Text for Option A (if applicable)
      - optionB: Text for Option B (if applicable)
      - optionC: Text for Option C (if applicable)
      - optionD: Text for Option D (if applicable)
      - optionE: Text for Option E (if applicable)
      - optionF: Text for Option F (if applicable)
      - answer: The correct answer (e.g., "A", "ABC", "√", "×").

      If a field is missing (like options for a Short Answer question), leave it as an empty string.
    `;

    if (textInput.trim()) {
      promptText += `\n\nAdditional Text Input to Process:\n${textInput}`;
    }

    parts.push({ text: promptText });

    // Process files
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const imagePart = await fileToPart(file);
        parts.push(imagePart);
      }
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionType: { type: Type.STRING },
              applicableType: { type: Type.STRING },
              questionTitle: { type: Type.STRING },
              fileUrl: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              optionC: { type: Type.STRING },
              optionD: { type: Type.STRING },
              optionE: { type: Type.STRING },
              optionF: { type: Type.STRING },
              answer: { type: Type.STRING },
            }
          }
        }
      }
    });

    if (response.text) {
      // Clean up Markdown code blocks if present (e.g., ```json ... ```)
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      return JSON.parse(cleanText) as ExamQuestion[];
    }
    
    return [];

  } catch (error) {
    console.error("Error parsing content:", error);
    throw error;
  }
};