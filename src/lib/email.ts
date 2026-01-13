import nodemailer from 'nodemailer';

// SMTP configuration from environment variables
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // auto-detect: 465 = SSL, other ports = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const fromAddress = process.env.SMTP_FROM || 'noreply@99cents.one';

// Create transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('[EMAIL] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env variables.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport(smtpConfig);
  }

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();

  if (!transport) {
    // Development mode - just log
    console.log('[EMAIL DEV MODE]');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('---');
    return { success: true };
  }

  try {
    await transport.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Send error:', error);
    return { success: false, error: String(error) };
  }
}

// Verification code email template
export function getVerificationEmailHtml(code: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">99 Cents</h2>
      <p>Your verification code:</p>
      <div style="font-size: 32px; font-weight: bold; color: #1e3a5f; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px; letter-spacing: 5px;">
        ${code}
      </div>
      <p style="color: #666; margin-top: 20px;">This code expires in 15 minutes.</p>
      <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
}

export function getVerificationEmailText(code: string): string {
  return `99 Cents - Verification Code\n\nYour code: ${code}\n\nThis code expires in 15 minutes.`;
}
