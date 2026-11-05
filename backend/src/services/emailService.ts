import nodemailer, { Transporter } from 'nodemailer';

interface SendPasswordResetParams {
  to: string;
  name: string;
  rollNo: string;
  resetLink: string;
  expiresHours?: number;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  private getTransporter(): Transporter | null {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || (host?.includes('gmail') ? 465 : 587);
    const isGmail = Boolean(host?.includes('gmail') || user?.includes('@gmail.com'));
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (user && pass && (host || isGmail)) {
      if (!this.transporter) {
        try {
          if (isGmail) {
            this.transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user,
                pass,
              },
              connectionTimeout: 4000,
              greetingTimeout: 4000,
              socketTimeout: 5000,
            });
          } else {
            this.transporter = nodemailer.createTransport({
              host,
              port,
              secure,
              auth: {
                user,
                pass,
              },
              tls: {
                rejectUnauthorized: false,
              },
              connectionTimeout: 4000,
              greetingTimeout: 4000,
              socketTimeout: 5000,
            });
          }
          this.isConfigured = true;
        } catch (err: any) {
          console.error('[EmailService] Failed to initialize nodemailer transporter:', err.message);
          this.transporter = null;
          this.isConfigured = false;
        }
      }
      return this.transporter;
    }

    this.transporter = null;
    this.isConfigured = false;
    return null;
  }

  public getStatus() {
    this.getTransporter();
    const hasBrevo = Boolean(process.env.BREVO_API_KEY);
    const hasResend = Boolean(process.env.RESEND_API_KEY);
    const host = hasBrevo
      ? 'Brevo HTTP API (Port 443 — Unblocked)'
      : hasResend
      ? 'Resend HTTP API (Port 443)'
      : process.env.SMTP_HOST || process.env.EMAIL_HOST || 'Not set';

    const user = hasBrevo
      ? (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'rahulraiman03@gmail.com')
      : (process.env.SMTP_USER || process.env.EMAIL_USER);

    const sender = process.env.BREVO_SENDER_NAME
      ? `${process.env.BREVO_SENDER_NAME} <${user}>`
      : process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Code Circle <codecircle@bitsathy.ac.in>';

    return {
      configured: Boolean(hasBrevo || hasResend || (this.isConfigured && this.transporter)),
      provider: hasBrevo ? 'brevo' : hasResend ? 'resend' : 'smtp',
      host,
      user: user ? `${user.substring(0, 3)}***@${user.split('@')[1] || 'domain'}` : 'Not set',
      sender,
    };
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    // If Brevo API is configured, verify using Brevo's Account API endpoint
    if (process.env.BREVO_API_KEY) {
      try {
        const axios = (await import('axios')).default;
        const res = await axios.get('https://api.brevo.com/v3/account', {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        });

        const email = res.data?.email || 'verified account';
        return {
          success: true,
          message: `Brevo API connection verified successfully (${email}, plan: ${res.data?.plan?.[0]?.type || 'free'})`,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Brevo API verification failed: ${err.response?.data?.message || err.message}`,
        };
      }
    }

    // If Resend API is configured, verify using Resend's API
    if (process.env.RESEND_API_KEY) {
      try {
        const axios = (await import('axios')).default;
        await axios.get('https://api.resend.com/api-keys', {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          timeout: 6000,
        });
        return { success: true, message: 'Resend API connection verified successfully' };
      } catch (err: any) {
        return { success: false, message: `Resend API verification failed: ${err.message}` };
      }
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'No email credentials configured. Please set BREVO_API_KEY in backend environment.',
      };
    }

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP server connection verified successfully' };
    } catch (err: any) {
      return { success: false, message: `SMTP verification failed: ${err.message}` };
    }
  }

  public async sendPasswordResetEmail({
    to,
    name,
    rollNo,
    resetLink,
    expiresHours = 24,
  }: SendPasswordResetParams): Promise<SendEmailResult> {
    const fromAddress =
      process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Code Circle BIT <codecircle@bitsathy.ac.in>';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Code Circle Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1f2937; background: linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0) 100%);">
              <div style="display: inline-block; padding: 8px 16px; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 14px; letter-spacing: 1px; border-radius: 8px; text-transform: uppercase;">
                Code Circle
              </div>
              <h1 style="margin: 16px 0 6px; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">
                Password Reset Approved
              </h1>
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Bannari Amman Institute of Technology
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #e5e7eb; line-height: 1.6;">
                Hello <strong>${name}</strong> (${rollNo}),
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                Your request to reset your Code Circle platform password has been verified and approved by an administrator. Please use the button below to configure your new credentials.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); text-align: center;">
                  Reset Password Now &rarr;
                </a>
              </div>

              <!-- Expiry Alert -->
              <div style="background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 10px; padding: 14px 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 13px; color: #c7d2fe; line-height: 1.5;">
                  ⏳ <strong>Link Expiry:</strong> This secure reset link is valid for <strong>${expiresHours} hours</strong>. Once used, it will automatically expire.
                </p>
              </div>

              <!-- Fallback Direct URL -->
              <p style="margin: 24px 0 8px; font-size: 12px; color: #6b7280;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <div style="background-color: #030712; border: 1px solid #1f2937; border-radius: 8px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 12px; color: #a5b4fc;">
                ${resetLink}
              </div>

              <hr style="border: none; border-top: 1px solid #1f2937; margin: 28px 0;" />

              <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.6;">
                🔒 <strong>Security Notice:</strong> If you did not make this request or have already recovered your account, please ignore this email or notify your club administrator immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                &copy; ${new Date().getFullYear()} Code Circle BIT. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Code Circle Password Reset Approved

Hello ${name} (${rollNo}),

Your request to reset your Code Circle platform password has been approved by an administrator.

Please click the link below to set your new password:
${resetLink}

This link is valid for ${expiresHours} hours.

If you did not request this reset, please contact your administrator.
— Code Circle BIT
    `.trim();

    // Priority 1: Brevo HTTP API (HTTPS Port 443 — Guaranteed Unblocked on Render Free Tier)
    if (process.env.BREVO_API_KEY) {
      try {
        const axios = (await import('axios')).default;
        const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'rahulraiman03@gmail.com';
        const senderName = process.env.BREVO_SENDER_NAME || 'Code Circle BIT';

        const res = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: {
              name: senderName,
              email: senderEmail,
            },
            to: [{ email: to, name }],
            subject: '🔐 Code Circle — Password Reset Approved',
            htmlContent,
            textContent,
          },
          {
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 6000,
          }
        );

        console.log(`[EmailService: Brevo] Password reset email sent to ${to}. MessageId: ${res.data?.messageId}`);
        return {
          success: true,
          messageId: res.data?.messageId,
          simulated: false,
        };
      } catch (httpErr: any) {
        console.error('[EmailService: Brevo] API error sending to', to, httpErr.response?.data || httpErr.message);
        return {
          success: false,
          error: `Brevo API Error: ${httpErr.response?.data?.message || httpErr.message}`,
          simulated: false,
        };
      }
    }

    // Priority 2: Resend HTTP API (HTTPS Port 443 — Unblocked on Render Free Tier)
    if (process.env.RESEND_API_KEY) {
      try {
        const axios = (await import('axios')).default;
        const res = await axios.post(
          'https://api.resend.com/emails',
          {
            from: process.env.RESEND_FROM || process.env.EMAIL_FROM || 'Code Circle <onboarding@resend.dev>',
            to: [to],
            subject: '🔐 Code Circle — Password Reset Approved',
            html: htmlContent,
            text: textContent,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 6000,
          }
        );

        console.log(`[EmailService: Resend] Password reset email sent to ${to}. ID: ${res.data?.id}`);
        return {
          success: true,
          messageId: res.data?.id,
          simulated: false,
        };
      } catch (httpErr: any) {
        console.error('[EmailService: Resend] API error sending to', to, httpErr.response?.data || httpErr.message);
        return {
          success: false,
          error: `Resend API Error: ${httpErr.response?.data?.message || httpErr.message}`,
          simulated: false,
        };
      }
    }

    // Priority 3: Standard SMTP (Nodemailer) — Ideal for localhost or VPS
    const transporter = this.getTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject: '🔐 Code Circle — Password Reset Approved',
          text: textContent,
          html: htmlContent,
        });

        console.log(`[EmailService] Password reset email sent to ${to}. MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
          simulated: false,
        };
      } catch (err: any) {
        console.error(`[EmailService] SMTP error sending email to ${to}:`, err.message);
        const isTimeout =
          err.message?.toLowerCase().includes('timeout') ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ESOCKET';

        const errorDesc = isTimeout
          ? `Connection timeout: Render Free Tier blocks outbound SMTP ports 465/587. To send emails on Render, add RESEND_API_KEY in Render Environment Variables, or copy the direct reset link.`
          : `SMTP Send Error: ${err.message}`;

        return {
          success: false,
          error: errorDesc,
          simulated: false,
        };
      }
    }

    // If neither HTTP API nor SMTP is configured in .env
    console.warn(
      `[EmailService: Not Configured] Email service credentials are not configured in backend environment. Reset Link for ${to} (${name}): ${resetLink}`
    );

    return {
      success: false,
      error: 'Email service credentials not configured in backend .env (Add RESEND_API_KEY or SMTP_USER/SMTP_PASS)',
      simulated: true,
    };
  }
}

export const emailService = new EmailService();
export default emailService;
