import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/apply/verify
 * Verify email code and grant access to submit application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code required' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Find apply access record
    const applyAccess = await prisma.applyAccess.findUnique({
      where: { email: emailLower }
    });

    if (!applyAccess) {
      return NextResponse.json(
        { success: false, error: 'Email not registered' },
        { status: 404 }
      );
    }

    // If already verified
    if (applyAccess.verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        verified: true
      });
    }

    // Check code
    if (applyAccess.verificationCode !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid code' },
        { status: 400 }
      );
    }

    // Check expiry
    if (!applyAccess.codeExpiresAt || new Date() > applyAccess.codeExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Code expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.applyAccess.update({
      where: { email: emailLower },
      data: {
        verified: true,
        verificationCode: null,
        codeExpiresAt: null
      }
    });

    // Mark log entry as used
    await prisma.verificationLog.updateMany({
      where: {
        email: emailLower,
        code,
        used: false
      },
      data: { used: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/apply/verify?email=xxx
 * Check if email is verified
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const applyAccess = await prisma.applyAccess.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!applyAccess) {
      return NextResponse.json({
        success: true,
        registered: false,
        verified: false
      });
    }

    return NextResponse.json({
      success: true,
      registered: true,
      verified: applyAccess.verified
    });
  } catch (error) {
    console.error('Check verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
