const Question = require("../models/Question");
const Answer = require("../models/Answer");

// Get all questions
const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("user", "name email")
      .populate("answers")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "answers",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Increment views
    question.views += 1;
    await question.save();

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ask question
const askQuestion = async (req, res) => {
  try {
    const { title, description, tags = [], user } = req.body;

    const cleanedTitle = title?.trim();
    const cleanedDescription = description?.trim();

    if (!cleanedTitle || !cleanedDescription) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    if (!user) {
      return res.status(400).json({ message: "A user reference is required to post a question." });
    }

    const question = new Question({
      title: cleanedTitle,
      description: cleanedDescription,
      tags: Array.isArray(tags)
        ? tags.map((tag) => tag.trim()).filter(Boolean)
        : [],
      user,
    });

    await question.save();

    const createdQuestion = await Question.findById(question._id).populate(
      "user",
      "name email"
    );

    res.status(201).json(createdQuestion);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Unable to create question. Please try again." });
  }
};

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Delete all answers for this question
    await Answer.deleteMany({ question: req.params.id });

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vote question
const voteQuestion = async (req, res) => {
  try {
    const { vote } = req.body;

    if (vote !== 1 && vote !== -1) {
      return res.status(400).json({ message: "Vote must be 1 or -1." });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.votes += vote;
    await question.save();

    res.status(200).json({ votes: question.votes });
  } catch (error) {
    res.status(500).json({ message: "Unable to update vote right now." });
  }
};

// Update question
const updateQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { title, description, tags },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllQuestions,
  getQuestionById,
  askQuestion,
  deleteQuestion,
  voteQuestion,
  updateQuestion,
};