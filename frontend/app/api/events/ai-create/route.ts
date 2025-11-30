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
function getSystemPrompt(now: Date, existingEvents: any[]): string {
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

  const existingEventsJson = JSON.stringify(existingEvents.map(e => ({
    id: e.id,
    title: e.title,
    startTime: e.startTime,
    dueDate: e.dueDate,
    type: e.type
  })), null, 2);

  return `You are a helpful assistant that manages a user's schedule.
You will receive a natural language input from the user and a list of their existing upcoming events.
Your task is to analyze the input and decide whether to CREATE new events or UPDATE existing ones.

Existing Events:
${existingEventsJson}

Instructions:
1. Analyze the user's input to identify distinct events or updates.
2. Compare with "Existing Events" to see if the user is referring to an existing event (e.g., "change the meeting tomorrow to 3pm").
3. If it's a new event, create a "create" action.
4. If it's an update to an existing event, create an "update" action with the event ID and the fields to change.
5. Return a JSON object with a list of actions.

Output Format:
{
  "actions": [
    {
      "action": "create",
      "data": {
        "title": "string",
        "description": "string (optional)",
        "type": "event" | "homework" | "meeting" | "task" | "reminder" | "other",
        "urgency": number (1-5),
        "importance": number (1-5),
        "dueDate": "ISO 8601 string (optional)",
        "startTime": "ISO 8601 string (optional)",
        "endTime": "ISO 8601 string (optional)"
      }
    },
    {
      "action": "update",
      "id": "existing_event_id",
      "data": {
        // Only include fields that need to be updated
        "title": "string (optional)",
        "startTime": "ISO 8601 string (optional)",
        ...
      }
    }
  ]
}

Consider these factors for urgency and importance:
- Urgency: How time-sensitive is this? Deadlines, time-based tasks are more urgent
- Importance: How critical is this to goals? Strategic tasks, key deliverables are more important

When calculating dates and times:
- Use the current date/time provided by the user as reference
- For relative dates like "tomorrow", "next week", calculate based on current time
- Always output dates in ISO 8601 format with timezone (e.g., "${tomorrowISO}")
- Consider the user's timezone (Asia/Taipei, UTC+8)

Examples:
Input: "Meeting with John tomorrow at 2pm"
Output: {"actions": [{"action": "create", "data": {"title": "Meeting with John", "type": "meeting", "startTime": "${tomorrowISO}"}}]}

Input: "Change the Team Meeting (id: 123) to 3pm" (assuming you identified the event from context)
Output: {"actions": [{"action": "update", "id": "123", "data": {"startTime": "..."}}]}

Return ONLY the JSON object, no additional text.`;
}

/**
 * Get LLM completion based on configured provider
 */
async function getLLMCompletion(prompt: string, currentTime: string, now: Date, existingEvents: any[]): Promise<string | null> {
  // Generate system prompt with dynamic examples
  const systemPrompt = getSystemPrompt(now, existingEvents);

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

// POST /api/events/ai-create - Create/Update events from natural language
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

    // Fetch upcoming events for context (e.g., next 30 days)
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const existingEvents = await prisma.event.findMany({
      where: {
        userId,
        OR: [
          { startTime: { gte: now, lte: nextMonth } },
          { dueDate: { gte: now, lte: nextMonth } },
          // Also include events without dates if needed, but for now focus on upcoming
        ]
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        dueDate: true,
        type: true,
      }
    });

    // Use configured LLM provider to parse the natural language input
    const content = await getLLMCompletion(prompt, currentTime, now, existingEvents);

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse event from AI' },
        { status: 400 }
      );
    }

    const result = JSON.parse(content);
    const actions = result.actions || [];
    const results = [];

    for (const action of actions) {
      if (action.action === 'create') {
        const eventData = action.data;
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
        results.push({ type: 'created', event });
      } else if (action.action === 'update' && action.id) {
        const eventData = action.data;
        // Clean up data
        if (eventData.dueDate) eventData.dueDate = new Date(eventData.dueDate);
        if (eventData.startTime) eventData.startTime = new Date(eventData.startTime);
        if (eventData.endTime) eventData.endTime = new Date(eventData.endTime);

        // Verify ownership before update
        const existing = await prisma.event.findUnique({
          where: { id: action.id, userId }
        });

        if (existing) {
          const event = await prisma.event.update({
            where: { id: action.id },
            data: eventData,
          });
          results.push({ type: 'updated', event });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Processed ${results.length} actions`
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
