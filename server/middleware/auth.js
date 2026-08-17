const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginSession = require("../models/LoginSession");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token format invalid"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    }

    const session = await LoginSession.findOne({ sessionId: decoded.sessionId, userId: user._id });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session no longer exists"
      });
    }

    if (session.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked or expired"
      });
    }

    if (session.expiresAt <= new Date()) {
      session.status = "expired";
      await session.save();
      return res.status(401).json({
        success: false,
        message: "Session expired"
      });
    }

    session.lastSeenAt = new Date();
    await session.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token is not valid"
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};