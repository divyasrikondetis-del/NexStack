const Post = require("../models/Post");
const User = require("../models/User");

const getDashboard = async (req, res) => {
  try {
    const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalPosts, totalReports, activeUsers, suspendedUsers] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isDeleted: false }),
      Post.countDocuments({ reports: { $elemMatch: { status: "pending" } } }),
      User.countDocuments({ isSuspended: false, lastActiveAt: { $gte: activeSince } }),
      User.countDocuments({ isSuspended: true }),
    ]);
    res.json({ totalUsers, totalPosts, totalReports, activeUsers, suspendedUsers });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const getReports = async (req, res) => {
  try {
    const posts = await Post.find({ isDeleted: false, reports: { $elemMatch: { status: "pending" } } })
      .populate("authorId", "name email reportCount")
      .populate("reports.userId", "name email")
      .sort({ updatedAt: -1 });
    const reports = posts.flatMap((post) => post.reports.filter((report) => report.status === "pending").map((report) => ({
      reportId: report._id, postId: post._id, content: post.content, author: post.authorId,
      reporter: report.userId, reason: report.reason, createdAt: report.reportedAt,
      reportCount: post.reports.filter((item) => item.status === "pending").length,
    })));
    res.json(reports);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const reviewReport = async (req, res) => {
  try {
    const { reportId, action } = req.body;
    if (!reportId || !["approve", "dismiss"].includes(action)) return res.status(400).json({ message: "A valid report action is required." });
    const post = await Post.findById(req.params.postId);
    const report = post?.reports.id(reportId);
    if (!report) return res.status(404).json({ message: "Report not found." });
    report.status = action === "approve" ? "approved" : "dismissed";
    report.reviewedAt = new Date(); report.reviewedBy = req.currentUser._id;
    post.isReported = post.reports.some((item) => item.status === "pending");
    await post.save();
    res.json({ message: `Report ${action}d.`, post });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getDashboard, getReports, reviewReport };
