"use server";

import Groq from "groq-sdk";

// Initialize Groq (it automatically looks for process.env.GROQ_API_KEY)
const groq = new Groq();

// 1. UPGRADE: A strict TypeScript interface for your frontend
export interface AITaskResponse {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  due_date: string | null;
  subtasks: string[];
  category: string;
  estimated_minutes: number;
  tags: string[];
}

export async function generateTaskWithAI(userInput: string, currentDateTime: string = new Date().toLocaleString()) {
  try {
    const prompt = `
    You are an elite, highly intelligent project management AI. 
    Extract the core task, write a description, and break it down into actionable data based on the user's input.
    
    Rules for the JSON output:
    1. "title": A concise, highly actionable task title.
    2. "description": A helpful 1-2 sentence description summarizing the context or details provided.
    3. "subtasks": An array of 3 to 5 logical, step-by-step strings to complete this task. If it's a very simple task, return an empty array [].
    4. "priority": Analyze the sentiment and context. Return "high", "medium", or "low". Default to "medium".
    5. "due_date": The user's exact current local date and time is: ${currentDateTime}. 
       Carefully calculate relative dates (e.g., "tomorrow", "next Friday"). 
       Format STRICTLY as "YYYY-MM-DDTHH:mm". Return null if no date is mentioned.
    6. "category": Categorize the task into one single word (e.g., "Work", "Travel", "Personal", "Health", "Finance").
    7. "estimated_minutes": A realistic integer representing how many minutes this task might take to complete.
    8. "tags": An array of 2 to 4 relevant short string tags for filtering.

    Return ONLY a JSON object with this exact structure:
    {
      "title": "Cleaned up task title here",
      "description": "Short description here",
      "priority": "medium",
      "due_date": "2026-04-17T14:00",
      "subtasks": ["Step 1", "Step 2", "Step 3"],
      "category": "Travel",
      "estimated_minutes": 60,
      "tags": ["planning", "urgent"]
    }

    User input: "${userInput}"
    `;

    // 2. UPGRADE: Using Groq with Llama 3.3 70B for blazing fast, smart JSON
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          // Groq requires the word "JSON" in the prompt to use JSON mode safely
          content: "You are a JSON API. You only output valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Low temp makes it better at strict JSON & math
      response_format: { type: "json_object" }, // Forces strict JSON output
    });

    const aiText = completion.choices[0]?.message?.content || "{}";
    
    console.log("⚡ Groq successfully generated:", aiText);

    return JSON.parse(aiText) as AITaskResponse;

  } catch (error) {
    console.error("🚨 Groq API Error Details:", error);
    return null;
  }
}