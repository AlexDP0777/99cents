import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/apply/register
 * Register email for apply access (after payment)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already registered
    const existing = await prisma.applyAccess.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Email already registered',
        alreadyExists: true
      });
    }

    // Create new apply access
    await prisma.applyAccess.create({
      data: {
        email: email.toLowerCase(),
        verified: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email registered successfully'
    });
  } catch (error) {
    console.error('Apply register error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
