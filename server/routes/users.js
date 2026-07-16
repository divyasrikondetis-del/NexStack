const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  loginUser,
  updateUser,
  followUser,
  setSuspension,
} = require("../controllers/users");

// =======================
// Get All Users
// =======================
router.get("/", getAllUsers);

// =======================
// Get User By ID
// =======================
router.get("/:id", getUserById);

// =======================
// Register User
// =======================
router.post("/", createUser);

// =======================
// Login User
// =======================
router.post("/login", loginUser);

// =======================
// Follow / Unfollow User
// =======================
router.patch("/follow", followUser);
router.patch("/:id/suspension", setSuspension);

// =======================
// Update User Profile
// =======================
router.patch("/:id", updateUser);

module.exports = router;
