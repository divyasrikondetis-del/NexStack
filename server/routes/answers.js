const express = require("express");
const router = express.Router();

const {
  addAnswer,
  getAnswersByQuestion,
  voteAnswer,
  acceptAnswer,
  updateAnswer,  // ← ADD THIS
  deleteAnswer,
} = require("../controllers/answers");

// Get all answers for a specific question
router.get("/:questionId", getAnswersByQuestion);

// Add an answer to a question
router.post("/:questionId", addAnswer);

// Vote on an answer (upvote/downvote)
router.patch("/:id/vote", voteAnswer);

// Accept an answer as the best answer
router.patch("/:id/accept", (req, res, next) => {
  console.log("✅ ACCEPT ROUTE HIT");
  next();
}, acceptAnswer);
// Update an answer (for testing)
router.patch("/:id", updateAnswer);  // ← ADD THIS

// Delete an answer
router.delete("/:id", deleteAnswer);

module.exports = router;