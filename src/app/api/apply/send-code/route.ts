import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email';

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/apply/send-code
 * Send verification code to email
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

    const emailLower = email.toLowerCase();

    // Check if email is registered
    const applyAccess = await prisma.applyAccess.findUnique({
      where: { email: emailLower }
    });

    if (!applyAccess) {
      return NextResponse.json(
        { success: false, error: 'Email not registered. Please make a payment first.' },
        { status: 404 }
      );
    }

    // If already verified, no need to send code
    if (applyAccess.verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true
      });
    }

    // Generate code and expiry (15 minutes)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save code to ApplyAccess
    await prisma.applyAccess.update({
      where: { email: emailLower },
      data: {
        verificationCode: code,
        codeExpiresAt: expiresAt
      }
    });

    // Log the code
    await prisma.verificationLog.create({
      data: {
        email: emailLower,
        code,
        expiresAt
      }
    });

    // Send email via SMTP
    const emailResult = await sendEmail({
      to: emailLower,
      subject: '99 Cents - Verification Code',
      html: getVerificationEmailHtml(code),
      text: getVerificationEmailText(code)
    });

    // In development without SMTP - return code for testing
    const isDev = process.env.NODE_ENV === 'development';
    const smtpConfigured = !!process.env.SMTP_HOST;

    return NextResponse.json({
      success: true,
      message: emailResult.success ? 'Verification code sent' : 'Code generated (email not configured)',
      // Return code in dev mode or if SMTP not configured (for testing)
      ...(isDev || !smtpConfigured ? { devCode: code } : {})
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
