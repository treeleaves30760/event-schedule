import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import sql from '@/app/lib/db';
import { hashPassword, generateToken, generateApiToken } from '@/app/lib/auth';
import { randomBytes } from 'crypto';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

function generateId() {
  return randomBytes(16).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user already exists
    const [existingUser] = await sql`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate API token and ID
    const apiToken = generateApiToken();
    const id = generateId();

    // Create user
    const [user] = await sql`
      INSERT INTO "User" (id, email, name, "passwordHash", "apiToken")
      VALUES (${id}, ${email}, ${name || null}, ${passwordHash}, ${apiToken})
      RETURNING id, email, name, "apiToken", "createdAt", "updatedAt"
    `;

    // Generate JWT token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
