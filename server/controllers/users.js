const crypto = require("crypto");
const dns = require("dns").promises;
const axios = require("axios");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");
const LoginSession = require("../models/LoginSession");
const sendEmail = require("../utils/sendEmail");
const { reactivateIfExpired } = require("../middleware/accountStatus");
const {
  buildSessionToken,
  createPendingChallenge,
  createActiveSession,
  notifyNewDevice,
  SESSION_TTL_MS,
} = require("./sessionManagement");
const {
  getClientIp,
  getDeviceFingerprint,
  getLocationLabel,
} = require("../utils/device");
const { getRequiredVerification, isSupportedLanguage } = require("../utils/language");

// =======================
// Helper: Validate Email Format
// =======================
const isValidEmailFormat = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// =======================
// Helper: Check MX Records (Domain Exists)
// =======================
const hasEmailMxRecord = async (email) => {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
};

// =======================
// Helper: Check Disposable Domains
// =======================
const isDisposableEmail = (email) => {
  const disposableDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'throwawaymail.com',
    'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'spamgourmet.com', 'mailexpire.com', 'tempemail.net',
    'mailnator.com', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.biz', 'mailcatch.com', 'mailmetrash.com',
    'mytrashmail.com', 'trash2009.com', 'trashymail.com',
    'tyldd.com', 'uggsrock.com', 'wegwerfmail.de',
    'wegwerfmail.net', 'wegwerfmail.org', 'wh4f.org',
    'whyspam.me', 'willselfdestruct.com', 'winemaven.info',
    'wronghead.com', 'wuzup.net', 'xagloo.com',
    'xemaps.com', 'xents.com', 'xmaily.com',
    'xoxy.net', 'yep.it', 'yogamaven.com',
    'yopmail.fr', 'yopmail.net', 'ypmail.webm'
  ];
  const domain = email.split("@")[1];
  return disposableDomains.includes(domain);
};

// =======================
// Helper: Verify Email with AbstractAPI
// =======================
const verifyEmailWithAPI = async (email, apiKey) => {
  try {
    console.log(`📧 AbstractAPI check for: ${email}`);
    
    const response = await axios.get(
      `https://emailreputation.abstractapi.com/v1?api_key=${apiKey}&email=${email}`
    );
    
    console.log(`📧 API Response:`, response.data);
    
    const status = response.data?.email_deliverability?.status;
    const isDeliverable = status === "deliverable";
    const isFormatValid = response.data?.email_deliverability?.is_format_valid;
    const hasMx = response.data?.email_deliverability?.is_mx_valid;
    
    console.log(`📧 Status: ${status}`);
    console.log(`📧 Format Valid: ${isFormatValid}`);
    console.log(`📧 MX Valid: ${hasMx}`);
    console.log(`📧 Deliverable: ${isDeliverable}`);
    
    return isDeliverable && isFormatValid && hasMx;
    
  } catch (error) {
    console.error("❌ AbstractAPI error:", error.message);
    return false;
  }
};

// =======================
// Get All Users
// =======================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// Get User By Id
// =======================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.updatePrivileges();
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// Register with Email Validation
// =======================
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email address format." });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Please use a permanent email address. Temporary/disposable emails are not allowed.",
      });
    }

    const domainExists = await hasEmailMxRecord(normalizedEmail);
    console.log(`📧 MX Record check for ${normalizedEmail}: ${domainExists}`);
    
    if (!domainExists) {
      return res.status(400).json({ 
        message: "This email domain does not exist. Please check your email address." 
      });
    }

    const apiKey = process.env.EMAIL_VERIFICATION_API_KEY;
    if (apiKey) {
      const isEmailDeliverable = await verifyEmailWithAPI(normalizedEmail, apiKey);
      if (!isEmailDeliverable) {
        return res.status(400).json({
          message: "This email address does not appear to exist. Please check and try again.",
        });
      }
    } else {
      console.log("⚠️ No API key found, using MX record check only");
    }

    console.log(`✅ All validations passed for: ${normalizedEmail}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);
    const location = getLocationLabel(req);
    const deviceFingerprint = getDeviceFingerprint(userAgent, ipAddress);
    const sessionId = `${user._id}_${Date.now()}`;

    await createActiveSession({
      user,
      sessionId,
      req,
      deviceFingerprint,
      isTrusted: true,
    });

    const token = buildSessionToken(user, sessionId);
    const obj = user.toObject();
    delete obj.password;

    res.status(201).json({ ...obj, token, sessionId, trustedDevice: true });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================
// Login with OTP & Email Notification (ONLY ONE)
// =======================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user)
      return res.status(400).json({
        message: "Invalid credentials",
      });

    await reactivateIfExpired(user);
    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended." });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if (!match)
      return res.status(400).json({
        message: "Invalid credentials",
      });

    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = getClientIp(req);
    const location = getLocationLabel(req);
    const deviceFingerprint = getDeviceFingerprint(userAgent, ipAddress);

    const { session, otpCode } = await createPendingChallenge({
      userId: user._id,
      ipAddress,
      userAgent,
      location,
      deviceFingerprint,
    });

    console.log(`🔐 OTP for ${user.email}: ${otpCode}`);

    let otpEmailSent = false;
    let otpEmailError = null;

    try {
      const otpEmailResult = await sendEmail(
        user.email,
        "🔐 Your NexStack Login OTP",
        `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0A95FF;">🔐 NexStack Login OTP</h2>
        <p>Hello ${user.name},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; font-size: 32px; font-weight: bold; padding: 20px; background: #f5f5f5; border-radius: 8px; letter-spacing: 5px;">
          ${otpCode}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">NexStack Team</p>
      </div>
      `
      );
      otpEmailSent = !otpEmailResult?.skipped;
      console.log("📧 OTP email send result:", otpEmailResult);
    } catch (emailErr) {
      otpEmailError = emailErr;
      console.error("❌ OTP email send failed:", emailErr);
    }

    try {
      await sendEmail(
        user.email,
        "👋 Welcome to NexStack!",
        `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0A95FF;">👋 Welcome back, ${user.name}!</h2>
        <p>You have successfully logged in to NexStack.</p>
        <p>Here's what you can do:</p>
        <ul>
          <li>📝 Ask and answer questions</li>
          <li>⭐ Earn reputation points</li>
          <li>🔔 Get notified about activity</li>
          <li>👥 Connect with other developers</li>
        </ul>
        <p>Time: ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">NexStack Team</p>
      </div>
      `
      );
    } catch (notifyErr) {
      console.error("❌ Welcome email send failed:", notifyErr);
    }

    const obj = user.toObject();
    delete obj.password;

    const responsePayload = {
      ...obj,
      requiresOtp: true,
      message: otpEmailSent
        ? "OTP sent to your email. Please verify to complete login."
        : "OTP could not be emailed. Use the code shown in the response to continue.",
      sessionId: session.sessionId,
    };

    if (!otpEmailSent || process.env.NODE_ENV !== "production") {
      responsePayload.otpCode = otpCode;
    }

    return res.status(202).json(responsePayload);

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================
// Verify Login OTP
// =======================
const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otpCode, sessionId } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedOtpCode = String(otpCode || "").trim();
    const normalizedSessionId = String(sessionId || "").trim();

    console.log("🔐 OTP verify attempt:", {
      email: normalizedEmail,
      otpCode: normalizedOtpCode,
      sessionId: normalizedSessionId,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "",
    });

    if (!normalizedEmail || !normalizedOtpCode) {
      return res.status(400).json({ message: "Email and OTP code are required." });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.warn("OTP verify failed: user not found", normalizedEmail);
      return res.status(404).json({ message: "User not found." });
    }

    let session;
    if (normalizedSessionId) {
      session = await LoginSession.findOne({ userId: user._id, sessionId: normalizedSessionId, status: "pending" });
    }

    if (!session) {
      session = await LoginSession.findOne({ userId: user._id, status: "pending" }).sort({ createdAt: -1 });
    }

    if (!session) {
      console.warn("OTP verify failed: no pending login session", user._id.toString());
      return res.status(400).json({ message: "No pending login session found. Please login again." });
    }

    console.log("🔍 Pending session found", {
      sessionId: session.sessionId,
      otpCodeStored: session.otpCode,
      otpExpiresAt: session.otpExpiresAt,
      now: new Date().toISOString(),
    });

    if (session.otpCode !== normalizedOtpCode) {
      console.warn("OTP verify failed: invalid otp", {
        provided: normalizedOtpCode,
        expected: session.otpCode,
      });
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    if (session.otpExpiresAt && session.otpExpiresAt <= new Date()) {
      console.warn("OTP verify failed: code expired", {
        otpExpiresAt: session.otpExpiresAt,
      });
      return res.status(400).json({ message: "OTP code has expired. Please login again." });
    }

    session.status = "active";
    session.otpCode = null;
    session.otpExpiresAt = null;
    session.otpVerified = true;
    session.lastSeenAt = new Date();
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await session.save();

    user.lastActiveAt = new Date();
    await user.save();

    const token = buildSessionToken(user, session.sessionId);

    const obj = user.toObject();
    delete obj.password;

    res.json({
      ...obj,
      token,
      message: "Login successful!",
      sessionId: session.sessionId,
    });
  } catch (err) {
    console.error("❌ OTP verification error:", err);
    res.status(500).json({ message: err.message });
  }
};

// =======================
// Get User Sessions
// =======================
const getUserSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (requester._id.toString() !== id && requester.role !== "admin") {
      return res.status(403).json({ message: "You can only view your own sessions." });
    }

    const sessions = await LoginSession.find({ userId: id }).sort({ lastSeenAt: -1 }).lean();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Revoke Session
// =======================
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LoginSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (req.user._id.toString() !== session.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only revoke your own sessions." });
    }

    session.status = "revoked";
    session.revokedAt = new Date();
    session.expiresAt = new Date();
    await session.save();

    res.json({ message: "Session revoked successfully.", sessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Trust Session
// =======================
const trustSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await LoginSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (req.user._id.toString() !== session.userId.toString()) {
      return res.status(403).json({ message: "You can only update your own trusted sessions." });
    }

    session.isTrusted = true;
    session.status = "active";
    await session.save();

    res.json({ message: "Device marked as trusted.", sessionId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Update Profile
// =======================
const updateUser = async (req, res) => {
  try {
    const { name, about, tags } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name;
    user.about = about;
    user.tags = tags;

    const completed =
      user.about &&
      user.about.trim() !== "" &&
      user.tags &&
      user.tags.length > 0;

    if (completed && !user.profileBonusClaimed) {
      user.profileBonusClaimed = true;
      user.profileCompleted = true;

      user.reputation += 10;

      user.reputationHistory.push({
        action: "Profile Completed",
        points: 10,
        reason: "Completed all mandatory profile details",
        createdAt: new Date(),
      });

      user.updatePrivileges();
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json(updatedUser);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================
// Follow / Unfollow User
// =======================
const followUser = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const user = await User.findById(userId);
    const target = await User.findById(targetUserId);

    if (!user || !target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFollowing =
      user.following.includes(targetUserId);

    if (alreadyFollowing) {
      user.following.pull(targetUserId);
      target.followers.pull(userId);

      await user.save();
      await target.save();

      return res.json({
        success: true,
        following: false,
        followers: target.followers.length,
        followingCount: user.following.length,
      });
    }

    user.following.push(targetUserId);
    target.followers.push(userId);

    await user.save();
    await target.save();

    await Notification.create({
      userId: targetUserId,
      fromUserId: userId,
      type: "follow",
      message: `${user.name} started following you`,
    });

    res.json({
      success: true,
      following: true,
      followers: target.followers.length,
      followingCount: user.following.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================
// Set Suspension
// =======================
const setSuspension = async (req, res) => {
  try {
    const { adminId, duration = "permanent", reason = "" } = req.body;
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Administrator access is required" });

    const durationDays = { "1d": 1, "7d": 7, "30d": 30 };
    const isSuspended = duration !== "none";
    const suspendedUntil = durationDays[duration]
      ? new Date(Date.now() + durationDays[duration] * 24 * 60 * 60 * 1000)
      : null;
    const user = await User.findByIdAndUpdate(req.params.id, {
      isSuspended,
      suspendedUntil,
      suspensionReason: isSuspended ? reason.trim() : "",
    }, { new: true })
      .select("name isSuspended reportCount");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ========================
// Request Language Change
// ========================
const requestLanguageChange = async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!isSupportedLanguage(language)) {
      return res.status(400).json({ message: "Unsupported language." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.language = language;
    await user.save();

    return res.json({
      success: true,
      message: "Language updated successfully.",
      language: language,
      user: user,
    });
  } catch (error) {
    console.error("Language change error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Confirm Language Change
// ========================
const confirmLanguageChange = async (req, res) => {
  try {
    const { language } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!isSupportedLanguage(language)) {
      return res.status(400).json({ message: "Unsupported language." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.language = language;
    await user.save();

    return res.json({
      success: true,
      message: "Language updated successfully.",
      language,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Complete Profile - +10 Reputation
// ========================
const completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { about, tags } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!about || !about.trim() || !tags || tags.length === 0) {
      return res.status(400).json({ 
        message: "Please provide about section and at least one skill tag" 
      });
    }

    user.about = about;
    user.tags = tags;
    user.profileCompleted = true;

    if (!user.profileBonusClaimed) {
      user.profileBonusClaimed = true;
      user.reputation = (user.reputation || 0) + 10;
      
      user.reputationHistory.push({
        action: "Profile Completed",
        points: 10,
        reason: "Completed your profile with all mandatory details",
        createdAt: new Date(),
      });

      user.updatePrivileges();
    }

    await user.save();

    res.json({ 
      message: "✅ Profile completed successfully! +10 reputation bonus awarded.",
      user 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Transfer Reputation
// ========================
const transferReputation = async (req, res) => {
  try {
    const { senderId, receiverId, points, reason } = req.body;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot transfer to yourself" });
    }

    if ((sender.reputation || 0) < 50) {
      return res.status(400).json({ message: "You need at least 50 reputation to transfer" });
    }

    if (points < 1 || points > 50) {
      return res.status(400).json({ message: "Points must be between 1 and 50" });
    }

    if ((sender.reputation || 0) < points) {
      return res.status(400).json({ message: "You don't have enough reputation" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sender.lastTransferDate && new Date(sender.lastTransferDate) >= today) {
      if ((sender.transferredToday || 0) + points > 100) {
        return res.status(400).json({ message: "Daily transfer limit exceeded (100 points)" });
      }
    }

    sender.reputation = (sender.reputation || 0) - points;
    receiver.reputation = (receiver.reputation || 0) + points;

    if (!sender.lastTransferDate || new Date(sender.lastTransferDate) < today) {
      sender.transferredToday = 0;
      sender.lastTransferDate = new Date();
    }
    sender.transferredToday = (sender.transferredToday || 0) + points;

    sender.reputationHistory.push({
      action: "Transfer Sent",
      points: -points,
      reason: reason || "Reputation transfer",
    });

    receiver.reputationHistory.push({
      action: "Transfer Received",
      points: points,
      reason: reason || "Reputation transfer",
    });

    sender.reputationTransfers.push({
      sender: senderId,
      receiver: receiverId,
      points: points,
      reason: reason || "Reputation transfer",
    });

    receiver.reputationTransfers.push({
      sender: senderId,
      receiver: receiverId,
      points: points,
      reason: reason || "Reputation transfer",
    });

    sender.updatePrivileges();
    receiver.updatePrivileges();

    await sender.save();
    await receiver.save();

    res.json({
      message: "Reputation transferred successfully!",
      senderReputation: sender.reputation,
      receiverReputation: receiver.reputation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Add Reputation Manually
// ========================
const addReputationManually = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, action, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!points || points === 0) {
      return res.status(400).json({ message: "Points must be greater than 0" });
    }

    user.reputation = (user.reputation || 0) + points;
    
    user.reputationHistory.push({
      action: action || "Manual Bonus",
      points: points,
      reason: reason || "Manually added for testing",
      createdAt: new Date(),
    });

    user.updatePrivileges();

    await user.save();

    res.json({
      message: `✅ ${points} reputation points added!`,
      reputation: user.reputation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================
// Update User Privileges
// ========================
const updatePrivileges = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.updatePrivileges();
    await user.save();

    res.json({
      message: "✅ Privileges updated successfully!",
      reputation: user.reputation,
      canComment: user.canComment,
      canEditPosts: user.canEditPosts,
      canCloseQuestions: user.canCloseQuestions,
      canReportPosts: user.canReportPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};