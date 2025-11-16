import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import sql from './db';

export type AuthContext = {
  userId: string;
};

/**
 * Middleware to authenticate requests using JWT token or API token
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  // Check for Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload) {
      return { success: true, userId: payload.userId };
    }
  }

  // Check for API token
  const apiToken = request.headers.get('x-api-token');
  if (apiToken) {
    const [user] = await sql`
      SELECT id FROM "User" WHERE "apiToken" = ${apiToken}
    `;

    if (user) {
      return { success: true, userId: user.id };
    }
  }

  return { success: false, error: 'Unauthorized' };
}

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth<T>(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T | { success: false; error: string }>> => {
    const auth = await authenticateRequest(request);

    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: 401 }
      ) as NextResponse<{ success: false; error: string }>;
    }

    return handler(request, { userId: auth.userId });
  };
}
