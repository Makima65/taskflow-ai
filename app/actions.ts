"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Accept an optional currentDateTime string so the client can pass their local time
export async function generateTaskWithAI(userInput: string, currentDateTime: string = new Date().toLocaleString()) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are a robotic task manager. Do not speak.
    Extract the core task from the following user input and format it.
    
    Rules:
    1. "title": A short, clean, actionable task title.
    2. "status": Determine the best status ("todo", "in-progress", or "done"). Default to "todo".
    3. "priority": Determine the urgency ("high", "medium", or "low"). If unsure, default to "medium".
    4. "due_date": The user's exact current local date and time is: ${currentDateTime}. 
       Carefully calculate any mentioned relative dates (like "tomorrow", "next week") or times (like "5am", "8 PM") based on this exact current time.
       Format the final calculated due date STRICTLY as "YYYY-MM-DDTHH:mm" (e.g., "2026-04-16T05:00"). 
       Do not use human-readable text. If no date/time is mentioned, return null.
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Cleaned up task title here",
      "status": "todo",
      "priority": "medium",
      "due_date": "2026-04-16T14:00"
    }

    User input: "${userInput}"
    `;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    
    return JSON.parse(aiText);

  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
}