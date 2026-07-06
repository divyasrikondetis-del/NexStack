const Answer = require("../models/Answer");
const Question = require("../models/Question");

// Add answer to question
const addAnswer = async (req, res) => {
  try {
    const { content, user } = req.body;
    const questionId = req.params.questionId;

    const cleanedContent = content?.trim();

    if (!cleanedContent) {
      return res.status(400).json({ message: "Answer content is required." });
    }

    if (!user) {
      return res.status(400).json({ message: "A user reference is required to post an answer." });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const answer = new Answer({
      content: cleanedContent,
      user,
      question: questionId,
    });

    await answer.save();

    await Question.findByIdAndUpdate(questionId, { $push: { answers: answer._id } });

    const createdAnswer = await Answer.findById(answer._id).populate("user", "name email");

    res.status(201).json(createdAnswer);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Unable to create answer. Please try again." });
  }
};

// Get all answers for a question
const getAnswersByQuestion = async (req, res) => {
  try {
    const answers = await Answer.find({
      question: req.params.questionId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(answers);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch answers at the moment." });
  }
};

// Vote on an answer
const voteAnswer = async (req, res) => {
  try {
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Vote must be 1 or -1." });
    }

    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    answer.votes += vote;
    await answer.save();

    res.status(200).json({ votes: answer.votes });
  } catch (error) {
    res.status(500).json({ message: "Unable to update vote right now." });
  }
};

// Accept an answer as the best answer
const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Unaccept any previously accepted answer for this question
    await Answer.updateMany(
      { 
        question: answer.question, 
        isAccepted: true 
      },
      { isAccepted: false }
    );

    // Accept this answer
    answer.isAccepted = true;
    await answer.save();

    res.status(200).json({ 
      message: "Answer accepted successfully",
      answer 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  // Delete an answer
  const deleteAnswer = async (req, res) => {
    try {
      const answer = await Answer.findById(req.params.id);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }

      // Remove answer reference from question
      await Question.findByIdAndUpdate(answer.question, { $pull: { answers: answer._id } });

      await Answer.findByIdAndDelete(req.params.id);

      res.status(200).json({ message: "Answer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

module.exports = {
  addAnswer,
  getAnswersByQuestion,
  voteAnswer,
  acceptAnswer,
  deleteAnswer,
};