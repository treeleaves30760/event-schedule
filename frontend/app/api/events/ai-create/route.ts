import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import sql from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';
import { randomBytes } from 'crypto';

function generateId() {
  return randomBytes(16).toString('hex');
}

const aiCreateSchema = z.object({
  prompt: z.string().min(1),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/events/ai-create - Create an event from natural language
export const POST = withAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const { prompt } = aiCreateSchema.parse(body);

    // Use OpenAI to parse the natural language input
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts event information from natural language.
Extract the following information and return it as a JSON object:
- title: string (required)
- description: string (optional)
- type: one of "event", "homework", "meeting", "task", "reminder", or "other" (default: "event")
- urgency: number from 1-5, where 5 is most urgent (default: 3)
- importance: number from 1-5, where 5 is most important (default: 3)
- dueDate: ISO 8601 datetime string (optional, only if a date/time is mentioned)

Consider these factors for urgency and importance:
- Urgency: How time-sensitive is this? Deadlines, time-based tasks are more urgent
- Importance: How critical is this to goals? Strategic tasks, key deliverables are more important

Examples:
"Submit homework by tomorrow 5pm" -> {title: "Submit homework", type: "homework", urgency: 5, importance: 4, dueDate: "..."}
"Team meeting next Monday at 2pm" -> {title: "Team meeting", type: "meeting", urgency: 3, importance: 3, dueDate: "..."}
"Plan vacation for next month" -> {title: "Plan vacation", type: "task", urgency: 2, importance: 3}

Return ONLY the JSON object, no additional text.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse event from AI' },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(content);

    // Validate and create the event
    const id = generateId();
    const urgency = Math.min(5, Math.max(1, eventData.urgency || 3));
    const importance = Math.min(5, Math.max(1, eventData.importance || 3));
    const dueDate = eventData.dueDate ? new Date(eventData.dueDate) : null;

    const [event] = await sql`
      INSERT INTO "Event" (id, title, description, type, urgency, importance, "dueDate", "userId")
      VALUES (${id}, ${eventData.title}, ${eventData.description || null}, ${eventData.type || 'event'}, ${urgency}, ${importance}, ${dueDate}, ${userId})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: event,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
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
