const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const ForgotPasswordRequest = require("../models/ForgotPasswordRequest");
const bcrypt = require("bcryptjs");

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if user already requested today
    const request = await ForgotPasswordRequest.findOne({
      userId: user._id,
    });

    const today = new Date().toDateString();

    if (
      request &&
      new Date(request.lastRequestDate).toDateString() === today
    ) {
      return res.status(400).json({
        message: "You can request a password reset only once per day.",
      });
    }

    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // Hash the password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Save/update request date
    if (request) {
      request.lastRequestDate = new Date();
      await request.save();
    } else {
      await ForgotPasswordRequest.create({
        userId: user._id,
      });
    }

    // TODO: Send email here
    await sendEmail(
  user.email,
  "Password Reset",
  `Hello ${user.name},

Your temporary password is:

${temporaryPassword}

Please login and change your password immediately.

Thank you,
NexStack Team`
);

res.status(200).json({
  message: "Password reset email sent successfully.",
});
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  forgotPassword,
};