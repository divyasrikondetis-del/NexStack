const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  // Check email credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(
      "📧 Email delivery skipped; EMAIL_USER and EMAIL_PASS are not configured."
    );
    console.log("📧 Would have sent to:", to);
    console.log("📧 Subject:", subject);

    return {
      skipped: true,
      reason: "EMAIL_USER and EMAIL_PASS are not configured.",
    };
  }

  try {
    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },

      requireTLS: true,

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,

      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"NexStack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Email error:", error);

    throw error;
  }
};

module.exports = sendEmail;