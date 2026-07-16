const User = require("../models/User");

const reactivateIfExpired = async (user) => {
  if (user.isSuspended && user.suspendedUntil && user.suspendedUntil <= new Date()) {
    user.isSuspended = false;
    user.suspendedUntil = null;
    user.suspensionReason = "";
    await user.save();
  }
  return user;
};

const requireActiveUser = async (req, res, next) => {
  try {
    const userId = req.body?.userId || req.body?.authorId;
    if (!userId) return res.status(401).json({ message: "Please sign in to continue." });
    const user = await reactivateIfExpired(await User.findById(userId));
    if (!user) return res.status(401).json({ message: "User not found." });
    if (user.isSuspended) return res.status(403).json({ message: "Your account has been suspended." });
    user.lastActiveAt = new Date();
    await user.save();
    req.currentUser = user;
    next();
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const requireAdmin = async (req, res, next) => {
  try {
    const adminId = req.body?.adminId || req.query?.adminId;
    const admin = await reactivateIfExpired(await User.findById(adminId));
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Administrator access is required." });
    req.currentUser = admin;
    next();
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { reactivateIfExpired, requireActiveUser, requireAdmin };
