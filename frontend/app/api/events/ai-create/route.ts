import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import prisma from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';
import { createOllamaClient } from '@/app/lib/ollama';

const aiCreateSchema = z.object({
  prompt: z.string().min(1),
});

// LLM Provider type
type LLMProvider = 'openai' | 'ollama';

const LLM_PROVIDER: LLMProvider = (process.env.LLM_PROVIDER as LLMProvider) || 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Ollama client
const ollama = createOllamaClient();

/**
 * Generate system prompt with dynamic examples based on current time
 */
function getSystemPrompt(now: Date): string {
  // Calculate example dates based on current time
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(17, 0, 0, 0);

  // Find next Monday
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(14, 0, 0, 0);

  // Format to ISO string with timezone
  const formatWithTZ = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
  };

  const tomorrowISO = formatWithTZ(tomorrow);
  const nextMondayISO = formatWithTZ(nextMonday);

  return `You are a helpful assistant that extracts event information from natural language.
Extract the following information and return it as a JSON object:
- title: string (required)
- description: string (optional)
- type: one of "event", "homework", "meeting", "task", "reminder", or "other" (default: "event")
- urgency: number from 1-5, where 5 is most urgent (default: 3)
- importance: number from 1-5, where 5 is most important (default: 3)
- dueDate: ISO 8601 datetime string (optional, only if a deadline is mentioned)
- startTime: ISO 8601 datetime string (optional, for when the event starts)
- endTime: ISO 8601 datetime string (optional, for when the event ends)

Consider these factors for urgency and importance:
- Urgency: How time-sensitive is this? Deadlines, time-based tasks are more urgent
- Importance: How critical is this to goals? Strategic tasks, key deliverables are more important

When calculating dates and times:
- Use the current date/time provided by the user as reference
- For relative dates like "tomorrow", "next week", calculate based on current time
- Always output dates in ISO 8601 format with timezone (e.g., "${tomorrowISO}")
- Consider the user's timezone (Asia/Taipei, UTC+8)
- Use startTime and endTime for events with specific time ranges
- Use dueDate for deadlines or tasks that need to be completed by a certain time

Examples (based on current time):
"Submit homework by tomorrow 5pm" -> {"title": "Submit homework", "type": "homework", "urgency": 5, "importance": 4, "dueDate": "${tomorrowISO}"}
"Team meeting next Monday at 2pm" -> {"title": "Team meeting", "type": "meeting", "urgency": 3, "importance": 3, "startTime": "${nextMondayISO}"}
"Plan vacation for next month" -> {"title": "Plan vacation", "type": "task", "urgency": 2, "importance": 3}

Return ONLY the JSON object, no additional text.`;
}

/**
 * Get LLM completion based on configured provider
 */
async function getLLMCompletion(prompt: string, currentTime: string, now: Date): Promise<string | null> {
  // Generate system prompt with dynamic examples
  const systemPrompt = getSystemPrompt(now);

  // Add current time context to the user prompt
  const enhancedPrompt = `Current date and time: ${currentTime}

User request: ${prompt}`;

  if (LLM_PROVIDER === 'ollama') {
    // Use Ollama
    const response = await ollama.createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: enhancedPrompt },
    ]);
    return response.content;
  } else {
    // Use OpenAI (default)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhancedPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    return completion.choices[0].message.content;
  }
}

// POST /api/events/ai-create - Create an event from natural language
export const POST = withAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { prompt } = aiCreateSchema.parse(body);

    // Get current time in Taipei timezone
    const now = new Date();
    const currentTime = now.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'long',
      hour12: false,
    });

    // Use configured LLM provider to parse the natural language input
    const content = await getLLMCompletion(prompt, currentTime, now);

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse event from AI' },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(content);

    // Validate and create the event
    const urgency = Math.min(5, Math.max(1, eventData.urgency || 3));
    const importance = Math.min(5, Math.max(1, eventData.importance || 3));
    const dueDate = eventData.dueDate ? new Date(eventData.dueDate) : null;
    const startTime = eventData.startTime ? new Date(eventData.startTime) : null;
    const endTime = eventData.endTime ? new Date(eventData.endTime) : null;

    const event = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description || null,
        type: eventData.type || 'event',
        urgency,
        importance,
        dueDate,
        startTime,
        endTime,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      data: event,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('AI create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event from AI' },
      { status: 500 }
    );
  }
});
