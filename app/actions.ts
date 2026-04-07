"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateTaskWithAI(userInput: string, currentDateTime: string = new Date().toLocaleString()) {
  try {
    // Swapping to 2.0-flash to bypass the 503 traffic jam on 2.5!
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are a robotic project manager. Do not speak.
    Extract the core task, write a description, and break it down into subtasks based on the user's input.
    
    Rules:
    1. "title": A short, clean, actionable task title.
    2. "description": A helpful 1-2 sentence description summarizing the context or details the user provided.
    3. "subtasks": An array of 3 to 5 logical strings representing steps to complete this task. (e.g., ["Draft copy", "Design assets", "Schedule posts"]). If the task is too simple, return an empty array [].
    4. "priority": Determine the urgency ("high", "medium", or "low") based on how the user talks about it. Default to "medium".
    5. "due_date": The user's exact current local date and time is: ${currentDateTime}. 
       Carefully calculate any mentioned relative dates (like "tomorrow") based on this exact current time.
       Format the final calculated due date STRICTLY as "YYYY-MM-DDTHH:mm". Return null if no date/time is mentioned.
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Cleaned up task title here",
      "description": "Short description here",
      "priority": "medium",
      "due_date": "2026-04-16T14:00",
      "subtasks": ["Step 1", "Step 2", "Step 3"]
    }

    User input: "${userInput}"
    `;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text();
    
    aiText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    
    console.log("🤖 AI successfully generated:", aiText);

    return JSON.parse(aiText);

  } catch (error) {
    console.error("🚨 AI Generation Error Details:", error);
    return null;
  }
}