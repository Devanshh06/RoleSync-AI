import express from 'express';
import { generateAIContent } from '../utils/aiClient.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 1. Extract tasks from document text
router.post('/extract-tasks', async (req, res) => {
  const { text, documentTitle } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing document text' });
  }

  try {
    const prompt = `
      Analyze the following document text and extract any actionable tasks.
      Document Title: ${documentTitle || 'Unknown Document'}
      
      Document Text:
      ${text.substring(0, 30000)} // truncate to avoid token limits if too large

      Return a JSON array of tasks. If there are no tasks, return an empty array [].
      Schema for each task:
      {
        "title": "Short descriptive title of the task",
        "description": "Detailed description or context",
        "priority": "Medium" | "High" | "Urgent" | "Low"
      }
    `;

    const systemInstruction = "You are an assistant that extracts tasks from academic documents. Only return valid JSON matching the schema.";
    const responseSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] }
        },
        required: ["title", "description", "priority"]
      }
    };

    const aiResponse = await generateAIContent(prompt, { systemInstruction, responseSchema });
    
    let extractedTasks = [];
    try {
      const cleaned = aiResponse.replace(/```(?:json)?/gi, '').trim();
      extractedTasks = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse AI response:', aiResponse);
    }

    res.json({ success: true, tasks: extractedTasks });
  } catch (error) {
    console.error('AI extraction error:', error);
    res.status(500).json({ error: 'Failed to extract tasks from document.' });
  }
});

// 2. Context-Aware Chat
router.post('/chat', async (req, res) => {
  const { staffId, message } = req.body;
  if (!staffId || !message) {
    return res.status(400).json({ error: 'Missing staffId or message' });
  }

  try {
    // Fetch recent tasks for context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, status, priority, deadline')
      .eq('assigned_to', staffId)
      .order('created_at', { ascending: false })
      .limit(10);

    const tasksContext = tasks ? tasks.map(t => `- [${t.status}] ${t.title} (Priority: ${t.priority}, Deadline: ${t.deadline || 'None'})`).join('\n') : 'No recent tasks.';

    const systemInstruction = `
      You are RoleSync-AI, a helpful assistant for faculty members.
      You have access to the user's recent tasks as context.
      Answer the user's questions concisely and helpfully based on this context.
      
      User's Recent Tasks:
      ${tasksContext}
    `;

    const prompt = message;

    const response = await generateAIContent(prompt, { systemInstruction });
    res.json({ success: true, reply: response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate chat response.' });
  }
});

export default router;
