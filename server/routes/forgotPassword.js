const express = require("express");
const router = express.Router();

const {
  forgotPassword,
} = require("../controllers/forgotPassword");

// Forgot Password Route
router.post("/", forgotPassword);

module.exports = router;