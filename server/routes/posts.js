const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { requireActiveUser } = require("../middleware/accountStatus");

const {
  getPosts,
  getTrendingPosts,
  getPostsByHashtag,
  getPostById,
  createPost,
  createPostWithImage,
  likePost,
  bookmarkPost,
  addComment,
  editPost,
  sharePost,
  reportPost,
  getReportedPosts,
  deletePost,
  getUserFeed,
  getBookmarkedPosts,
} = require("../controllers/posts");

// =======================
// GET Routes
// =======================

// Get all posts with pagination & filtering
router.get("/", getPosts);

// Get trending posts
router.get("/trending", getTrendingPosts);

// Get posts by hashtag
router.get("/hashtag/:hashtag", getPostsByHashtag);

// Get user's personalized feed
router.get("/feed/:userId", getUserFeed);

// Get user's bookmarked posts
router.get("/bookmarks/:userId", getBookmarkedPosts);

// Admin moderation queue (must be before the generic :id route)
router.get("/moderation/reported", getReportedPosts);

// Get single post by ID (MUST be after all specific routes)
router.get("/:id", getPostById);

// =======================
// POST Routes
// =======================

// Create a new post (text only)
router.post("/", requireActiveUser, createPost);

// Create a new post with image upload (supports file upload & base64)
router.post("/with-image", upload.single("image"), requireActiveUser, createPostWithImage);

// =======================
// PATCH Routes
// =======================

// Like / Unlike a post
router.patch("/:id/like", requireActiveUser, likePost);

// Bookmark / Unbookmark a post
router.patch("/:id/bookmark", requireActiveUser, bookmarkPost);

// Add comment or reply
router.patch("/:id/comment", requireActiveUser, addComment);

// Edit a post
router.patch("/:id/edit", requireActiveUser, editPost);

// Share a post
router.patch("/:id/share", requireActiveUser, sharePost);

// Report a post
router.patch("/:id/report", requireActiveUser, reportPost);

// =======================
// DELETE Routes
// =======================

// Delete a post (soft delete)
router.delete("/:id", requireActiveUser, deletePost);

module.exports = router;
