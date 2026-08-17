const Question = require("../models/Question");
const Answer = require("../models/Answer");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { getPlan } = require("../utils/subscriptionPlans");

// ===================================
// Get all questions with filters
// ===================================
const getAllQuestions = async (req, res) => {
  try {
    const { search = "", tag = "", sort = "newest", userId } = req.query;
    const filter = {};
    const basicSearch = search.trim();

    if (basicSearch) {
      filter.$or = [
        { title: { $regex: basicSearch, $options: "i" } },
        { description: { $regex: basicSearch, $options: "i" } },
      ];
    }

    // Advanced filters require subscription
    const requestedAdvancedFilters = Boolean(tag || ["votes", "views"].includes(sort));
    if (requestedAdvancedFilters) {
      const subscription = userId ? await Subscription.findOne({ user: userId }) : null;
      const plan = getPlan(subscription?.status === "active" ? subscription.plan : "free");
      if (plan.id === "free") {
        return res.status(403).json({
          message: "Advanced search filters are available on Bronze, Silver, and Gold plans.",
        });
      }

      if (tag) filter.tags = tag;
    }

    const sortBy = {
      newest: { createdAt: -1 },
      votes: { votes: -1 },
      views: { views: -1 },
    }[sort] || { createdAt: -1 };

    const questions = await Question.find(filter)
      .populate("user", "name email premiumBadge subscriptionPlan reputation")
      .populate("answers")
      .sort(sortBy);

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// Get question by ID
// ===================================
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("user", "name email reputation premiumBadge")
      .populate({
        path: "answers",
        populate: {
          path: "user",
          select: "name email reputation premiumBadge",
        },
      });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Increment views
    question.views = (question.views || 0) + 1;
    await question.save();

    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// Ask/Create a question
// ===================================
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

    // Check subscription limits
    const subscription = await Subscription.findOne({ user });
    const activePlan = getPlan(subscription?.status === "active" ? subscription.plan : "free");

    if (activePlan.questionLimitPerDay !== -1) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const postedToday = await Question.countDocuments({
        user,
        createdAt: { $gte: startOfToday },
      });

      if (postedToday >= activePlan.questionLimitPerDay) {
        return res.status(403).json({
          message: `${activePlan.name} plan allows ${activePlan.questionLimitPerDay} question${activePlan.questionLimitPerDay === 1 ? "" : "s"} per day. Upgrade your subscription to post more.`,
          plan: activePlan,
        });
      }
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

    // ✅ Add reputation (+2 for asking a question)
    const userDoc = await User.findById(user);
    if (userDoc) {
      userDoc.reputation = (userDoc.reputation || 0) + 2;
      userDoc.reputationHistory = userDoc.reputationHistory || [];
      userDoc.reputationHistory.push({
        action: "question_asked",
        points: 2,
        reason: `Asked a question: ${cleanedTitle.substring(0, 50)}...`,
        createdAt: new Date(),
      });
      await userDoc.save();
      await userDoc.updatePrivileges();
    }

    const createdQuestion = await Question.findById(question._id).populate(
      "user",
      "name email reputation premiumBadge"
    );

    res.status(201).json({
      ...createdQuestion.toObject(),
      reputationEarned: 2,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Unable to create question. Please try again." });
  }
};

// ===================================
// Delete question
// ===================================
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if admin is deleting
    const isAdmin = req.body.isAdmin || false;
    const userId = req.user?.id;

    // Delete all answers for this question
    await Answer.deleteMany({ question: req.params.id });
    await Question.findByIdAndDelete(req.params.id);

    // ✅ -10 if content removed by admin
    if (isAdmin) {
      console.log("🛑 Admin deleting question. Removing 10 reputation from user:", question.user);
      
      const userDoc = await User.findById(question.user);
      if (userDoc) {
        userDoc.reputation = Math.max(0, (userDoc.reputation || 0) - 10);
        userDoc.reputationHistory = userDoc.reputationHistory || [];
        userDoc.reputationHistory.push({
          action: "content_removed_by_admin",
          points: -10,
          reason: `Your question was removed by an administrator: ${question.title.substring(0, 50)}...`,
          createdAt: new Date(),
        });
        await userDoc.save();
        await userDoc.updatePrivileges();
      }
    }

    res.status(200).json({ 
      message: "Question deleted successfully",
      reputationPenalty: isAdmin ? 10 : 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// Vote on question
// ===================================
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

    const userDoc = await User.findById(question.user);

    if (vote === 1) {
      // ✅ Upvote
      question.upvotes = (question.upvotes || 0) + 1;
      
      // ✅ +5 when question reaches exactly 10 upvotes
      if (question.upvotes === 10 && userDoc) {
        console.log("🎉 Question reached 10 upvotes! Awarding +5 reputation to user:", question.user);
        userDoc.reputation = (userDoc.reputation || 0) + 5;
        userDoc.reputationHistory = userDoc.reputationHistory || [];
        userDoc.reputationHistory.push({
          action: "question_upvote_bonus",
          points: 5,
          reason: `Your question received 10 upvotes: ${question.title.substring(0, 50)}...`,
          createdAt: new Date(),
        });
        await userDoc.save();
        await userDoc.updatePrivileges();
      }
      
    } else if (vote === -1) {
      // ✅ Downvote - -2 per downvote
      question.downvotes = (question.downvotes || 0) + 1;
      
      if (userDoc) {
        console.log("⬇️ Question received a downvote. Removing 2 reputation from user:", question.user);
        userDoc.reputation = Math.max(0, (userDoc.reputation || 0) - 2);
        userDoc.reputationHistory = userDoc.reputationHistory || [];
        userDoc.reputationHistory.push({
          action: "downvote_received",
          points: -2,
          reason: `Your question received a downvote: ${question.title.substring(0, 50)}...`,
          createdAt: new Date(),
        });
        await userDoc.save();
        await userDoc.updatePrivileges();
      }
    }

    await question.save();

    res.status(200).json({ 
      upvotes: question.upvotes || 0,
      downvotes: question.downvotes || 0,
      votes: (question.upvotes || 0) - (question.downvotes || 0),
      reputationChange: vote === 1 && question.upvotes === 10 ? 5 : vote === -1 ? -2 : 0,
    });
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ message: "Unable to update vote right now." });
  }
};

// ===================================
// Update question
// ===================================
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

// ===================================
// Get questions by tag
// ===================================
const getQuestionsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    
    const questions = await Question.find({ tags: tag })
      .populate("user", "name email reputation premiumBadge")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// Get questions by user
// ===================================
const getQuestionsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const questions = await Question.find({ user: userId })
      .populate("user", "name email reputation premiumBadge")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================
// Get question count
// ===================================
const getQuestionCount = async (req, res) => {
  try {
    const count = await Question.countDocuments();
    res.status(200).json({ count });
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
  getQuestionsByTag,
  getQuestionsByUser,
  getQuestionCount,
};