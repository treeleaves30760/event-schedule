import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  urgency: z.number().int().min(1).max(5).optional(),
  importance: z.number().int().min(1).max(5).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completed: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/events/[id] - Get a specific event
export const GET = withAuth(async (request, { userId }, context: RouteContext) => {
  try {
    const { id } = await context.params;

    const event = await prisma.event.findUnique({
      where: {
        id,
        userId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PATCH /api/events/[id] - Update an event
export const PATCH = withAuth(async (request, { userId }, context: RouteContext) => {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = updateEventSchema.parse(body);

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.urgency !== undefined) updateData.urgency = data.urgency;
    if (data.importance !== undefined) updateData.importance = data.importance;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.completed !== undefined) updateData.completed = data.completed;

    if (Object.keys(updateData).length === 0) {
      const event = await prisma.event.findUnique({ where: { id } });
      return NextResponse.json({ success: true, data: event });
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Update event error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/events/[id] - Delete an event
export const DELETE = withAuth(async (request, { userId }, context: RouteContext) => {
  try {
    const { id } = await context.params;

    // Check if event exists and belongs to user
    const existingEvent = await prisma.event.findUnique({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Event deleted successfully' },
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
