import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import sql from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';
import { randomBytes } from 'crypto';

function generateId() {
  return randomBytes(16).toString('hex');
}

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string(),
  urgency: z.number().int().min(1).max(5),
  importance: z.number().int().min(1).max(5),
  dueDate: z.string().datetime().optional(),
});

// GET /api/events - List all events for the authenticated user
export const GET = withAuth(async (request, { userId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const completed = searchParams.get('completed');
    const type = searchParams.get('type');

    let query = sql`
      SELECT * FROM "Event"
      WHERE "userId" = ${userId}
    `;

    if (completed !== null) {
      const completedBool = completed === 'true';
      query = sql`${query} AND completed = ${completedBool}`;
    }

    if (type) {
      query = sql`${query} AND type = ${type}`;
    }

    query = sql`${query} ORDER BY "dueDate" ASC NULLS LAST, "createdAt" DESC`;

    const events = await query;

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/events - Create a new event
export const POST = withAuth(async (request, { userId }) => {
  try {
    const body = await request.json();
    const data = createEventSchema.parse(body);

    const id = generateId();
    const dueDate = data.dueDate ? new Date(data.dueDate) : null;

    const [event] = await sql`
      INSERT INTO "Event" (id, title, description, type, urgency, importance, "dueDate", "userId")
      VALUES (${id}, ${data.title}, ${data.description || null}, ${data.type}, ${data.urgency}, ${data.importance}, ${dueDate}, ${userId})
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

    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
