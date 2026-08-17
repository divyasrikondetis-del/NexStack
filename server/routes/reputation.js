const express = require("express");
const router = express.Router();
const {
  transferReputation,
  getHistory,
} = require("../controllers/reputation");

// Transfer reputation
router.post("/transfer", transferReputation);

// Get history - keep this LAST
router.get("/:userId", getHistory);

module.exports = router;