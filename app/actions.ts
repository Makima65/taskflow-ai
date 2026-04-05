"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize the AI with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateTaskWithAI(userInput: string) {
  try {
    // 2. We use the ultra-fast Gemini 2.5 Flash model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // We pass today's date so the AI understands words like "tomorrow" or "next Friday"
    const today = new Date().toLocaleDateString();

    // 3. We give the AI its strict, upgraded instructions
    const prompt = `
    You are a robotic task manager. Do not speak.
    Extract the core task from the following user input and format it.
    
    Rules:
    1. "title": A short, clean, actionable task title.
    2. "status": Determine the best status ("todo", "in-progress", or "done"). Default to "todo".
    3. "priority": Determine the urgency ("high", "medium", or "low"). If unsure, default to "medium".
    4. "due_date": Extract any mentioned due date or time based on today's date (${today}). Format it as a short, readable string (e.g., "Tomorrow @ 2PM", "Apr 15"). If no date/time is mentioned, return null.
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Cleaned up task title here",
      "status": "todo",
      "priority": "medium",
      "due_date": "Tomorrow @ 2PM"
    }

    User input: "${userInput}"
    `;

    // 4. Send the request and return the JSON
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    
    return JSON.parse(aiText);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}