const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const ForgotPasswordRequest = require("../models/ForgotPasswordRequest");
const bcrypt = require("bcryptjs");

const generateLettersOnlyPassword = (length = 10) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";

  for (let i = 0; i < length; i += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    password += alphabet[randomIndex];
  }

  return password;
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
      query.$or.push({ phoneNumber: normalizedPhone });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
        message: "You already requested a password reset today. Please try again tomorrow.",
      });
    }

    const temporaryPassword = generateLettersOnlyPassword(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    user.password = hashedPassword;
    await user.save();

    if (request) {
      request.lastRequestDate = new Date();
      await request.save();
    } else {
      await ForgotPasswordRequest.create({
        userId: user._id,
        lastRequestDate: new Date(),
      });
    }

    const emailSubject = "🔐 Password Reset - NexStack";
    const emailText = `Hello ${user.name},

Your temporary password is:

${temporaryPassword}

Please login and change your password immediately.

If you didn't request this, please ignore this email.

Thank you,
NexStack Team`;

    console.log("📧 Sending email to:", user.email);
    let emailResult;
    let emailSent = false;

    try {
      emailResult = await sendEmail(user.email, emailSubject, emailText);
      console.log("📧 Email result:", emailResult);
      emailSent = !emailResult?.skipped;
    } catch (sendErr) {
      console.error("❌ Forgot password email send failed:", sendErr);
    }

    const responsePayload = {
      success: true,
      message: emailSent
        ? "Password reset email sent successfully."
        : "Unable to send password reset email, but your password has been reset.",
      temporaryPassword,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  forgotPassword,
};