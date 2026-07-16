const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Notification = require("../models/Notification");
const { reactivateIfExpired } = require("../middleware/accountStatus");

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

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================
// Register
// =======================
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists)
      return res.status(400).json({
        message: "Email already exists",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const obj = user.toObject();
    delete obj.password;

    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================
// Login
// =======================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

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

    user.lastActiveAt = new Date();
    await user.save();
    const obj = user.toObject();
    delete obj.password;

    res.json(obj);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================
// Update Profile
// =======================
const updateUser = async (req, res) => {
  try {
    const { name, about, tags } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        about,
        tags,
      },
      { new: true }
    ).select("-password");

    res.json(user);
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  followUser,
  setSuspension,
};
