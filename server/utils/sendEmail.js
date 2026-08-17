const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  // Check if email credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("📧 Email delivery skipped; EMAIL_USER and EMAIL_PASS are not configured.");
    console.log("📧 Would have sent to:", to);
    console.log("📧 Subject:", subject);
    console.log("📧 Content:", html);
    return {
      skipped: true,
      reason: "EMAIL_USER and EMAIL_PASS are not configured on the server.",
    };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"NexStack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};

module.exports = sendEmail;