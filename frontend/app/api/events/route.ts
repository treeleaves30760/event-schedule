import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';

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

    const where: any = {
      userId,
    };

    if (completed !== null) {
      where.completed = completed === 'true';
    }

    if (type) {
      where.type = type;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { dueDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });

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

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type,
        urgency: data.urgency,
        importance: data.importance,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
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

    console.error('Create event error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
