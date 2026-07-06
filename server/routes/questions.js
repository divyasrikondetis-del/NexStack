const express = require("express");
const router = express.Router();

const {
  askQuestion,
  getAllQuestions,
  getQuestionById,
  deleteQuestion,
  voteQuestion,
  updateQuestion,
} = require("../controllers/questions");

router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.post("/", askQuestion);
router.delete("/:id", deleteQuestion);
router.patch("/:id/vote", voteQuestion);
router.patch("/:id", updateQuestion);

module.exports = router;