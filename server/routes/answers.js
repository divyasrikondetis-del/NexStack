const express = require("express");
const router = express.Router();

const {
  addAnswer,
  getAnswersByQuestion,
  voteAnswer,
  acceptAnswer,
  deleteAnswer,
} = require("../controllers/answers");

// Get all answers for a specific question
// GET /answers/:questionId
router.get("/:questionId", getAnswersByQuestion);

// Add an answer to a question
// POST /answers/:questionId
router.post("/:questionId", addAnswer);

// Vote on an answer (upvote/downvote)
// PATCH /answers/:id/vote
router.patch("/:id/vote", voteAnswer);

// Accept an answer as the best answer
// PATCH /answers/:id/accept
router.patch("/:id/accept", acceptAnswer);

// Delete an answer
// DELETE /answers/:id
router.delete("/:id", deleteAnswer);

module.exports = router;