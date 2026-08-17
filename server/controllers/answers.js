const Answer = require("../models/Answer");
const Question = require("../models/Question");
const ReputationService = require("../services/reputationService");

// Add answer to question - +5 Reputation
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

    // ✅ +5 for posting an answer
    await ReputationService.addReputation(
      user,
      5,
      "Answer Posted",
      "Posted an answer to a question"
    );

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

// Update answer (for testing purposes) - ✅ ADD THIS FUNCTION
const updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { upvotes, downvotes, content } = req.body;

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    if (upvotes !== undefined) answer.upvotes = upvotes;
    if (downvotes !== undefined) answer.downvotes = downvotes;
    if (content !== undefined) answer.content = content;

    await answer.save();

    // ✅ Check if upvotes reached 5 and trigger bonus
    if (upvotes !== undefined && answer.upvotes >= 5) {
      console.log(`🎉 Answer updated to ${answer.upvotes} upvotes!`);
      // Check if bonus was already given (you can add a flag to track this)
      // For now, we'll let the vote function handle it
    }

    res.status(200).json(answer);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Vote on an answer - +5 bonus at 5 upvotes, -2 for downvotes
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

    if (vote === 1) {
      // Upvote
      const previousUpvotes = answer.upvotes || 0;
      answer.upvotes = previousUpvotes + 1;
      answer.votes = (answer.votes || 0) + 1;
      
      console.log(`📊 Answer upvotes: ${previousUpvotes} → ${answer.upvotes}`);
      
      // ✅ +5 bonus when answer reaches exactly 5 upvotes
      if (previousUpvotes < 5 && answer.upvotes >= 5) {
        console.log("🎉 Answer reached 5 upvotes! Awarding +5 reputation to user:", answer.user);
        await ReputationService.addReputation(
          answer.user,
          5,
          "Upvote Bonus",
          "Your answer received 5 upvotes"
        );
      }
      
    } else if (vote === -1) {
      // Downvote
      answer.downvotes = (answer.downvotes || 0) + 1;
      answer.votes = (answer.votes || 0) - 1;
      
      // ✅ -2 for every downvote received
      console.log("⬇️ Answer received a downvote. Removing 2 reputation from user:", answer.user);
      await ReputationService.removeReputation(
        answer.user,
        2,
        "Downvote Received",
        "Your answer received a downvote"
      );
    }

    await answer.save();

    res.status(200).json({ 
      upvotes: answer.upvotes || 0,
      downvotes: answer.downvotes || 0,
      votes: answer.votes || 0
    });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ message: "Unable to update vote right now." });
  }
};

// Accept an answer as the best answer - +10 Reputation
const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if already accepted
    if (answer.isAccepted) {
      return res.status(400).json({ message: "This answer is already accepted" });
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

    // ✅ +10 for accepted answer
    console.log("🏆 Answer accepted! Awarding +10 reputation to user:", answer.user);
    await ReputationService.addReputation(
      answer.user,
      10,
      "Answer Accepted",
      "Your answer was accepted as the best answer"
    );

    res.status(200).json({ 
      message: "Answer accepted successfully! +10 reputation awarded.",
      answer 
    });
  } catch (error) {
    console.error("Accept answer error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete an answer - -5 Reputation
const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Remove answer reference from question
    await Question.findByIdAndUpdate(answer.question, { $pull: { answers: answer._id } });

    await Answer.findByIdAndDelete(req.params.id);

    // ✅ -5 for deleting own answer
    console.log("🗑️ Answer deleted. Removing 5 reputation from user:", answer.user);
    await ReputationService.removeReputation(
      answer.user,
      5,
      "Answer Deleted",
      "You deleted your own answer"
    );

    res.status(200).json({ message: "Answer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addAnswer,
  getAnswersByQuestion,
  updateAnswer,  // ← ADD THIS
  voteAnswer,
  acceptAnswer,
  deleteAnswer,
};