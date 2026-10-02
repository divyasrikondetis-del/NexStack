const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const ForgotPasswordRequest = require("../models/ForgotPasswordRequest");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const generateLettersOnlyPassword = (length = 10) => {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  const bytes = crypto.randomBytes(length);

  return Array.from(bytes, (byte) => {
    return alphabet[byte % alphabet.length];
  }).join("");
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email, identifier } = req.body;

    const lookupValue = String(identifier ?? email ?? "").trim();

    if (!lookupValue) {
      return res.status(400).json({
        success: false,
        message: "Email or identifier is required.",
      });
    }

    console.log("📧 Forgot password request for:", lookupValue);

    const normalizedEmail = lookupValue.toLowerCase();
    const normalizedPhone = lookupValue.replace(/[^\d+]/g, "");

    const query = {
      $or: [
        { email: normalizedEmail },
        { phoneNumber: lookupValue },
      ],
    };

    if (normalizedPhone && normalizedPhone !== lookupValue) {
      query.$or.push({
        phoneNumber: normalizedPhone,
      });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check whether the user already requested a reset today
    const request = await ForgotPasswordRequest.findOne({
      userId: user._id,
    });

    const today = new Date();

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    if (
      request &&
      request.lastRequestDate &&
      request.lastRequestDate >= startOfDay &&
      request.lastRequestDate <= endOfDay
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You already requested a password reset today. Please try again tomorrow.",
      });
    }

    // Generate temporary password
    const temporaryPassword = generateLettersOnlyPassword(10);

    // Hash it, but DON'T save it yet
    const hashedPassword = await bcrypt.hash(
      temporaryPassword,
      10
    );

    // HTML email
    const emailSubject = "🔐 Password Reset - NexStack";

    const emailHtml = `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 24px;
        color: #222;
      ">
        <h2 style="color: #0A95FF;">
          🔐 NexStack Password Reset
        </h2>

        <p>Hello ${user.name},</p>

        <p>
          You requested a password reset for your NexStack account.
        </p>

        <p>
          Your temporary password is:
        </p>

        <div style="
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 14px;
          background: #f5f5f5;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        ">
          ${temporaryPassword}
        </div>

        <p>
          Please log in using this temporary password and
          change your password immediately.
        </p>

        <p>
          If you didn't request this password reset,
          please ignore this email.
        </p>

        <p>
          Thank you,<br>
          <strong>NexStack Team</strong>
        </p>
      </div>
    `;

    console.log("📧 Sending password reset email to:", user.email);

    // IMPORTANT:
    // Send the email FIRST.
    // Password is changed only if email succeeds.
    try {
      const emailResult = await sendEmail(
        user.email,
        emailSubject,
        emailHtml
      );

      if (emailResult?.skipped) {
        return res.status(503).json({
          success: false,
          message:
            "Password reset email service is not configured. Your password was not changed.",
        });
      }

      console.log(
        "✅ Password reset email accepted:",
        emailResult.messageId
      );
    } catch (emailError) {
      console.error(
        "❌ Password reset email failed:",
        emailError
      );

      return res.status(502).json({
        success: false,
        message:
          "We couldn't send the password reset email. Your password was not changed. Please try again later.",
      });
    }

    // Only change password AFTER email succeeds
    user.password = hashedPassword;
    await user.save();

    // Record today's successful reset request
    if (request) {
      request.lastRequestDate = new Date();
      await request.save();
    } else {
      await ForgotPasswordRequest.create({
        userId: user._id,
        lastRequestDate: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully. Please check your email.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

module.exports = {
  forgotPassword,
};