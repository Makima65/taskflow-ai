"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the AI with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateTaskWithAI(userInput: string) {
  try {
    // 2. We use the ultra-fast Gemini 2.5 Flash model
    // We strictly tell it to output ONLY perfect JSON format
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 3. We give the AI its strict instructions
    const prompt = `
    You are a robotic task manager. Do not speak.
    Extract the core task from the following user input and format it as a short, actionable task title.
    Determine the best status ("todo", "in-progress", or "done"). If unsure, default to "todo".
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Cleaned up task title here",
      "status": "todo"
    }

    User input: "${userInput}"
    `;

    // 4. Send the request and return the JSON to your frontend
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    
    return JSON.parse(aiText);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}