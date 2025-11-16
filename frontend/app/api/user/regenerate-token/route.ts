import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { withAuth } from '@/app/lib/middleware';
import { generateApiToken } from '@/app/lib/auth';

// POST /api/user/regenerate-token - Regenerate API token
export const POST = withAuth(async (request, { userId }) => {
  try {
    const newToken = generateApiToken();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { apiToken: newToken },
      select: {
        id: true,
        email: true,
        name: true,
        apiToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
