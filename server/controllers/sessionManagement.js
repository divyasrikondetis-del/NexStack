const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginSession = require("../models/LoginSession");
const sendEmail = require("../utils/sendEmail");
const {
  parseUserAgent,
  getClientIp,
  getDeviceFingerprint,
  getLocationLabel,
} = require("../utils/device");

const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000);

const buildSessionToken = (user, sessionId) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      sessionId,
    },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "7d" }
  );
};

const createPendingChallenge = async ({ userId, ipAddress, userAgent, location, deviceFingerprint }) => {
  const sessionId = crypto.randomUUID();
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { browser, os, deviceType } = parseUserAgent(userAgent);

  const existing = await LoginSession.findOne({ userId, deviceFingerprint });

  if (existing) {
    existing.sessionId = sessionId;
    existing.tokenHash = crypto.createHash("sha256").update(sessionId).digest("hex");
    existing.userAgent = userAgent;
    existing.browser = browser;
    existing.os = os;
    existing.deviceType = deviceType;
    existing.ipAddress = ipAddress;
    existing.location = location;
    existing.status = "pending";
    existing.expiresAt = expiresAt;
    existing.otpCode = otpCode;
    existing.otpExpiresAt = expiresAt;
    existing.otpVerified = false;
    existing.isTrusted = false;
    existing.lastSeenAt = new Date();
    await existing.save();
    return { session: existing, otpCode };
  }

  const session = await LoginSession.create({
    userId,
    sessionId,
    tokenHash: crypto.createHash("sha256").update(sessionId).digest("hex"),
    deviceFingerprint,
    userAgent,
    browser,
    os,
    deviceType,
    ipAddress,
    location,
    status: "pending",
    expiresAt,
    otpCode,
    otpExpiresAt: expiresAt,
    otpVerified: false,
    isTrusted: false,
  });

  return { session, otpCode };
};

const createActiveSession = async ({ user, sessionId, req, deviceFingerprint, isTrusted = false }) => {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = getClientIp(req);
  const location = getLocationLabel(req);
  const { browser, os, deviceType } = parseUserAgent(userAgent);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const existing = await LoginSession.findOne({ userId: user._id, deviceFingerprint });

  if (existing) {
    existing.status = "active";
    existing.isTrusted = isTrusted;
    existing.userAgent = userAgent;
    existing.browser = browser;
    existing.os = os;
    existing.deviceType = deviceType;
    existing.ipAddress = ipAddress;
    existing.location = location;
    existing.lastSeenAt = new Date();
    existing.expiresAt = expiresAt;
    existing.otpCode = null;
    existing.otpExpiresAt = null;
    existing.otpVerified = true;
    existing.sessionId = sessionId;
    existing.tokenHash = crypto.createHash("sha256").update(sessionId).digest("hex");
    await existing.save();
    return existing;
  }

  const session = await LoginSession.create({
    userId: user._id,
    sessionId,
    tokenHash: crypto.createHash("sha256").update(sessionId).digest("hex"),
    deviceFingerprint,
    userAgent,
    browser,
    os,
    deviceType,
    ipAddress,
    location,
    status: "active",
    isTrusted,
    expiresAt,
    otpVerified: true,
  });

  return session;
};

const notifyNewDevice = async (user, sessionInfo) => {
  const subject = "New device login detected";
  const html = `
    <div>
      <h2>Security alert</h2>
      <p>A successful login was detected for your account.</p>
      <ul>
        <li>Browser: ${sessionInfo.browser}</li>
        <li>OS: ${sessionInfo.os}</li>
        <li>Device: ${sessionInfo.deviceType}</li>
        <li>IP Address: ${sessionInfo.ipAddress}</li>
        <li>Location: ${sessionInfo.location}</li>
        <li>Time: ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this was not you, revoke the session from your profile immediately.</p>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

const getUserSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (requester._id.toString() !== id && requester.role !== "admin") {
      return res.status(403).json({ message: "You can only view your own sessions." });
    }

    const sessions = await LoginSession.find({ userId: id })
      .sort({ lastSeenAt: -1 })
      .lean();

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

const getLoginActivity = async (req, res) => {
  try {
    const sessions = await LoginSession.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  buildSessionToken,
  createPendingChallenge,
  createActiveSession,
  notifyNewDevice,
  getUserSessions,
  revokeSession,
  trustSession,
  getLoginActivity,
  SESSION_TTL_MS,
};
