const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { isSupportedLanguage } = require("../utils/language");
const User = require("../models/User");

const {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  verifyLoginOtp,
  getUserSessions,
  revokeSession,
  trustSession,
  updateUser,
  followUser,
  setSuspension,
  requestLanguageChange,
  confirmLanguageChange,
  completeProfile,
  transferReputation,
  addReputationManually,
  updatePrivileges,
} = require("../controllers/users");

// =======================
// Routes WITHOUT ID parameters (MUST COME FIRST)
// =======================

// Get all users
router.get("/", getAllUsers);

// Register user
router.post("/", createUser);

// Login user
router.post("/login", loginUser);
router.post("/login/verify-otp", verifyLoginOtp);

// Session management
router.get("/:id/sessions", auth, getUserSessions);
router.patch("/sessions/:sessionId/trust", auth, trustSession);
router.delete("/sessions/:sessionId", auth, revokeSession);

// Follow / Unfollow user
router.patch("/follow", auth, followUser);

// =======================
// Reputation Routes (NO ID parameters)
// =======================

// ✅ Language switching (Direct - NO OTP)
router.patch("/language/update", auth, async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user._id;

    if (!isSupportedLanguage(language)) {
      return res.status(400).json({ message: "Unsupported language." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.language = language;
    await user.save();

    res.json({
      success: true,
      message: "Language updated successfully.",
      language,
    });
  } catch (error) {
    console.error("Language update error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Compatibility alias for older client requests
router.patch("/language/request", auth, requestLanguageChange);

// Language switching (OTP routes - kept for compatibility)
router.post("/language/request", auth, requestLanguageChange);
router.post("/language/confirm", auth, confirmLanguageChange);

// Complete profile - +10 reputation (one-time bonus)
router.patch("/complete-profile", auth, completeProfile);

// Transfer reputation between users
router.post("/transfer-reputation", transferReputation);

// =======================
// Routes WITH ID parameters (MUST COME LAST)
// =======================

// Get user by ID
router.get("/:id", getUserById);

// Update user profile
router.patch("/:id", auth, updateUser);

// Set user suspension (admin only)
router.patch("/:id/suspension", setSuspension);

// Add reputation manually (for testing)
router.post("/:id/reputation", addReputationManually);

// Update user privileges based on reputation
router.patch("/:id/update-privileges", updatePrivileges);

module.exports = router;3