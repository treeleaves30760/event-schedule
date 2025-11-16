import { NextRequest, NextResponse } from 'next/server';
import sql from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';
import { generateApiToken } from '@/app/lib/auth';

// POST /api/user/regenerate-token - Regenerate API token
export const POST = withAuth(async (request, { userId }) => {
  try {
    const newToken = generateApiToken();

    const [user] = await sql`
      UPDATE "User"
      SET "apiToken" = ${newToken}, "updatedAt" = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, "apiToken", "createdAt", "updatedAt"
    `;

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Regenerate token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
