const axios = require("axios");

const sendEmail = async (to, subject, html) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not configured.");

    return {
      skipped: true,
      reason: "RESEND_API_KEY is not configured on the server.",
    };
  }

  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: `NexStack <${fromEmail}>`,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const messageId = response.data?.id;

    if (!messageId) {
      throw new Error("Email provider did not return a message ID.");
    }

    console.log("✅ Email accepted by Resend:", messageId);
    console.log("📧 To:", to);
    console.log("📧 Subject:", subject);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const providerMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    console.error("❌ Resend email error:", providerMessage);

    throw new Error(providerMessage);
  }
};

module.exports = sendEmail;