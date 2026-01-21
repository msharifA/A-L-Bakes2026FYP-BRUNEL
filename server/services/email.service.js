import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email, token, firstName) {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

  const mailOptions = {
    from: `"A&L Bakes" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password - A&L Bakes",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: #1a1a1a;">
          <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
        </div>

        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #333;">Hi ${firstName},</h2>

          <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password for your A&L Bakes account.
            Click the button below to create a new password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="display: inline-block;
                      padding: 14px 28px;
                      background: #f5a623;
                      color: #000;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;">
              Reset Password
            </a>
          </div>

          <p style="color: #555; line-height: 1.6;">
            This link will expire in <strong>1 hour</strong> for security reasons.
          </p>

          <p style="color: #555; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="color: #888; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br />
            <a href="${resetUrl}" style="color: #f5a623;">${resetUrl}</a>
          </p>
        </div>

        <div style="text-align: center; padding: 20px; background: #f5f5f5; color: #888; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} A&L Bakes. All rights reserved.</p>
          <p style="margin: 8px 0 0;">
            <a href="https://instagram.com/al.bakes.uk" style="color: #f5a623; text-decoration: none;">@al.bakes.uk</a>
          </p>
        </div>
      </div>
    `,
    text: `
Hi ${firstName},

We received a request to reset your password for your A&L Bakes account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} A&L Bakes
    `.trim(),
  };

  // In development, log the email instead of sending
  if (process.env.NODE_ENV !== "production" && !process.env.SMTP_USER) {
    console.log("\n========================================");
    console.log("📧 PASSWORD RESET EMAIL (dev mode)");
    console.log("========================================");
    console.log("To:", email);
    console.log("Reset URL:", resetUrl);
    console.log("========================================\n");
    return { messageId: "dev-mode", resetUrl };
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

export async function sendWelcomeEmail(email, firstName) {
  const mailOptions = {
    from: `"A&L Bakes" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to A&L Bakes!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px; background: #1a1a1a;">
          <h1 style="color: #f5a623; margin: 0;">A&L Bakes</h1>
        </div>

        <div style="padding: 30px; background: #fff;">
          <h2 style="color: #333;">Welcome, ${firstName}!</h2>

          <p style="color: #555; line-height: 1.6;">
            Thank you for creating an account with A&L Bakes. We're delighted to have you!
          </p>

          <p style="color: #555; line-height: 1.6;">
            With your account, you can:
          </p>

          <ul style="color: #555; line-height: 1.8;">
            <li>Save your cart for later</li>
            <li>Track your orders</li>
            <li>View your order history</li>
            <li>Leave reviews on products</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/menu"
               style="display: inline-block;
                      padding: 14px 28px;
                      background: #f5a623;
                      color: #000;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: 600;">
              Browse Our Menu
            </a>
          </div>
        </div>

        <div style="text-align: center; padding: 20px; background: #f5f5f5; color: #888; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} A&L Bakes. All rights reserved.</p>
          <p style="margin: 8px 0 0;">
            <a href="https://instagram.com/al.bakes.uk" style="color: #f5a623; text-decoration: none;">@al.bakes.uk</a>
          </p>
        </div>
      </div>
    `,
  };

  // In development, log instead of sending
  if (process.env.NODE_ENV !== "production" && !process.env.SMTP_USER) {
    console.log("📧 Welcome Email (dev mode):");
    console.log("To:", email);
    return { messageId: "dev-mode" };
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}
