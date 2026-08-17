const Notification = require("../models/Notification");
const Post = require("../models/Post");
const cloudinary = require("../utils/cloudinary");
const User = require("../models/User");

// =======================
// Get all posts with pagination & filtering
// =======================
const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt";
    const hashtag = req.query.hashtag;
    const search = req.query.search;

    let filter = { isDeleted: false };
    
    if (hashtag) {
      filter.hashtags = hashtag;
    }

    if (search) {
      filter.content = { $regex: search, $options: "i" };
    }

    const posts = await Post.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name email")
      .populate("likedBy", "name")
      .populate("bookmarks", "name")
      .populate("comments.userId", "name")
      .populate("comments.replies.userId", "name");

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      posts,
      hasMore: skip + posts.length < total,
      nextPage: skip + posts.length < total ? page + 1 : null,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get trending posts
// =======================
const getTrendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isDeleted: false })
      .sort({ likes: -1, comments: -1, shares: -1, createdAt: -1 })
      .limit(10)
      .populate("authorId", "name email");

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get posts by hashtag
// =======================
const getPostsByHashtag = async (req, res) => {
  try {
    const { hashtag } = req.params;
    
    // If hashtag doesn't start with #, add it
    const searchHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    console.log(`🔍 Searching for hashtag: ${searchHashtag}`);
    
    const posts = await Post.find({ 
      hashtags: searchHashtag,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .populate("authorId", "name email");

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get single post by ID
// =======================
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("authorId", "name email")
      .populate("likedBy", "name")
      .populate("bookmarks", "name")
      .populate("comments.userId", "name")
      .populate("comments.replies.userId", "name");
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Create a new post (text only)
// =======================
const createPost = async (req, res) => {
  try {
    const { author, authorId, content, image, codeSnippet, hashtags } = req.body;

    if (!author || !authorId || !content) {
      return res.status(400).json({
        message: "Author, authorId, and content are required.",
      });
    }

    // Extract hashtags from content
    const extractedHashtags = content.match(/#\w+/g) || [];
    const allHashtags = [...new Set([...extractedHashtags, ...(hashtags || [])])];

    const post = new Post({
      author,
      authorId,
      content,
      image: image || null,
      codeSnippet: codeSnippet || null,
      hashtags: allHashtags,
      likes: 0,
      likedBy: [],
      bookmarks: [],
      comments: [],
      shares: 0,
    });

    await post.save();
    await post.populate("authorId", "name email");

    // =======================
    // Mention Notification
    // =======================
    const mentions = content.match(/@(\w+)/g);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.replace("@", "");

        const mentionedUser = await User.findOne({
          name: new RegExp("^" + username + "$", "i"),
        });

        if (
          mentionedUser &&
          mentionedUser._id.toString() !== authorId
        ) {
          await Notification.create({
            userId: mentionedUser._id,
            fromUserId: authorId,
            type: "mention",
            message: `${author} mentioned you in a post`,
            postId: post._id,
          });
        }
      }
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Create a post with image upload (supports both file upload and base64)
// =======================
const createPostWithImage = async (req, res) => {
  try {
    console.log("📸 Request body:", req.body);
    console.log("📸 File received:", req.file ? req.file.originalname : "No file");
    
    const { author, authorId, content, codeSnippet, hashtags, image } = req.body;
    
    if (!author || !authorId || !content) {
      return res.status(400).json({
        message: "Author, authorId, and content are required.",
      });
    }

    let imageUrl = null;

    // Check for image in req.file (multipart/form-data)
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "nexstack_posts",
          transformation: [
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        });
        imageUrl = result.secure_url;
        console.log("✅ Image uploaded to Cloudinary from file:", imageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload image",
          error: uploadError.message 
        });
      }
    }
    // Check for image in req.body (base64 JSON)
    else if (image && image.startsWith('data:image')) {
      try {
        console.log("📸 Processing base64 image...");
        const result = await cloudinary.uploader.upload(image, {
          folder: "nexstack_posts",
          transformation: [
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        });
        imageUrl = result.secure_url;
        console.log("✅ Image uploaded to Cloudinary from base64:", imageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ 
          message: "Failed to upload image",
          error: uploadError.message 
        });
      }
    }

    // Extract hashtags from content
    const extractedHashtags = content.match(/#\w+/g) || [];
    const allHashtags = [...new Set([...extractedHashtags, ...(hashtags || [])])];

    const post = new Post({
      author,
      authorId,
      content,
      image: imageUrl,
      codeSnippet: typeof codeSnippet === "string" ? JSON.parse(codeSnippet || "null") : codeSnippet || null,
      hashtags: allHashtags,
      likes: 0,
      likedBy: [],
      bookmarks: [],
      comments: [],
      shares: 0,
    });

    await post.save();
    await post.populate("authorId", "name email");

    // =======================
    // Mention Notification
    // =======================
    const mentions = content.match(/@(\w+)/g);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.replace("@", "");

        const mentionedUser = await User.findOne({
          name: new RegExp("^" + username + "$", "i"),
        });

        if (
          mentionedUser &&
          mentionedUser._id.toString() !== authorId
        ) {
          await Notification.create({
            userId: mentionedUser._id,
            fromUserId: authorId,
            type: "mention",
            message: `${author} mentioned you in a post`,
            postId: post._id,
          });
        }
      }
    }

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Like / Unlike a post
// =======================
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { userId } = req.body;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likedBy.findIndex((id) => id.toString() === String(userId));
    let isLiked = false;

    if (likeIndex !== -1) {
      // Unlike
      post.likedBy.splice(likeIndex, 1);
      post.likes -= 1;
      isLiked = false;
    } else {
      // Like
      post.likedBy.push(userId);
      post.likes += 1;
      isLiked = true;

      // Create notification
      if (post.authorId.toString() !== userId) {
        const fromUser = await User.findById(userId);

        await Notification.create({
          userId: post.authorId,
          fromUserId: userId,
          type: "like",
          message: `${fromUser.name} liked your post ❤️`,
          postId: post._id,
        });
      }
    }

    await post.save();

    res.status(200).json({
      likes: post.likes,
      isLiked,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Bookmark / Unbookmark a post
// =======================
const bookmarkPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { userId } = req.body;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const bookmarkIndex = post.bookmarks.findIndex((id) => id.toString() === String(userId));
    let isBookmarked = false;

    if (bookmarkIndex !== -1) {
      post.bookmarks.splice(bookmarkIndex, 1);
      isBookmarked = false;
    } else {
      post.bookmarks.push(userId);
      isBookmarked = true;
    }

    await post.save();

    res.status(200).json({
      bookmarks: post.bookmarks.length,
      isBookmarked: isBookmarked,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Add a comment with reply support
// =======================
const addComment = async (req, res) => {
  try {
    const { user, userId, text, parentCommentId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (parentCommentId) {
      const parentComment = post.comments.id(parentCommentId);

      if (!parentComment) {
        return res.status(404).json({
          message: "Comment not found",
        });
      }

      parentComment.replies.push({
        user,
        userId,
        text: text.trim(),
        createdAt: new Date(),
      });
    } else {
      post.comments.push({
        user,
        userId,
        text: text.trim(),
        replies: [],
        createdAt: new Date(),
      });
    }

    await post.save();

    // =======================
    // Mention Notification in Comment
    // =======================
    const mentions = text.match(/@(\w+)/g);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.replace("@", "");

        const mentionedUser = await User.findOne({
          name: new RegExp("^" + username + "$", "i"),
        });

        if (
          mentionedUser &&
          mentionedUser._id.toString() !== userId
        ) {
          await Notification.create({
            userId: mentionedUser._id,
            fromUserId: userId,
            type: "mention",
            message: `${user} mentioned you in a comment`,
            postId: post._id,
          });
        }
      }
    }

    // Notification for post author
    if (post.authorId.toString() !== userId) {
      const fromUser = await User.findById(userId);

      await Notification.create({
        userId: post.authorId,
        fromUserId: userId,
        type: "comment",
        message: `${fromUser.name} commented on your post 💬`,
        postId: post._id,
      });
    }

    await post.populate("comments.userId", "name");
    await post.populate("comments.replies.userId", "name");

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// =======================
// Edit a post
// =======================
const editPost = async (req, res) => {
  try {
    const { content, image, codeSnippet, hashtags, userId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this post" });
    }

    // Update fields
    if (content) {
      post.content = content;
      // Re-extract hashtags
      const extractedHashtags = content.match(/#\w+/g) || [];
      post.hashtags = [...new Set(extractedHashtags)];
    }
    if (image !== undefined) post.image = image;
    if (codeSnippet !== undefined) post.codeSnippet = codeSnippet;
    if (hashtags) post.hashtags = hashtags;

    await post.save();
    await post.populate("authorId", "name email");

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Share a post
// =======================
const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.shares += 1;
    await post.save();

    res.status(200).json({ shares: post.shares });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Report a post
// =======================
const reportPost = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId || !reason?.trim()) {
      return res.status(400).json({ message: "A report reason is required" });
    }
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user already reported
    const alreadyReported = post.reports.some(
      report => report.userId.toString() === userId
    );

    if (alreadyReported) {
      return res.status(400).json({ message: "You have already reported this post" });
    }

    post.reports.push({ userId, reason, reportedAt: new Date() });
    post.isReported = true;
    await post.save();
    await User.findByIdAndUpdate(post.authorId, { $inc: { reportCount: 1 } });

    res.status(200).json({ message: "Post reported successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Admin: review the moderation queue
// =======================
const getReportedPosts = async (req, res) => {
  try {
    const admin = await User.findById(req.query.adminId);
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ message: "Administrator access is required" });
    }
    const posts = await Post.find({ isReported: true, isDeleted: false })
      .sort({ "reports.reportedAt": -1 })
      .populate("authorId", "name email reportCount isSuspended")
      .populate("reports.userId", "name email");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Delete a post (soft delete)
// =======================
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const { userId, isAdmin } = req.body;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is author or admin
    if (post.authorId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Soft delete
    post.isDeleted = true;
    await post.save();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get user's feed (following)
// =======================
const getUserFeed = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's following list
    const User = require("../models/User");
    const user = await User.findById(userId).populate("following");
    const followingIds = user.following.map(f => f._id);
    followingIds.push(userId); // Include own posts

    const posts = await Post.find({
      authorId: { $in: followingIds },
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("authorId", "name email");

    const total = await Post.countDocuments({
      authorId: { $in: followingIds },
      isDeleted: false,
    });

    res.status(200).json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================
// Get bookmarked posts
// =======================
const getBookmarkedPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({
      bookmarks: userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("authorId", "name email");

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
