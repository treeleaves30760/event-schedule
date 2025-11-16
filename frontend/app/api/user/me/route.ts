import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';

// GET /api/user/me - Get current user info
export const GET = withAuth(async (request, { userId }) => {
  try {
    const [user] = await sql`
      SELECT id, email, name, "apiToken", "createdAt", "updatedAt"
      FROM "User"
      WHERE id = ${userId}
    `;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
