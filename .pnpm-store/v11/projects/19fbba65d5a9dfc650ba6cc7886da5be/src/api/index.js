import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// =======================
// User APIs
// =======================

export const fetchUsers = () => API.get("/users");

export const fetchUserById = (id) =>
  API.get(`/users/${id}`);

export const createUser = (userData) =>
  API.post("/users", userData);

export const loginUser = (credentials) =>
  API.post("/users/login", credentials);

export const updateUser = (id, userData) =>
  API.patch(`/users/${id}`, userData);

// =======================
// Follow / Unfollow User
// =======================

export const followUser = (userId, targetUserId) =>
  API.patch("/users/follow", {
    userId,
    targetUserId,
  });

export const setUserSuspension = (id, adminId, duration, reason = "") =>
  API.patch(`/users/${id}/suspension`, { adminId, duration, reason });

export const fetchAdminDashboard = (adminId) =>
  API.get(`/admin/dashboard?adminId=${adminId}`);

export const fetchAdminReports = (adminId) =>
  API.get(`/admin/reports?adminId=${adminId}`);

export const reviewAdminReport = (postId, adminId, reportId, action) =>
  API.patch(`/admin/reports/${postId}`, { adminId, reportId, action });

// =======================
// Question APIs
// =======================

export const fetchQuestions = () =>
  API.get("/questions");

export const fetchQuestionById = (id) =>
  API.get(`/questions/${id}`);

export const askQuestion = (questionData) =>
  API.post("/questions", questionData);

export const updateQuestion = (id, data) =>
  API.patch(`/questions/${id}`, data);

export const deleteQuestion = (id) =>
  API.delete(`/questions/${id}`);

export const voteQuestion = (id, vote) =>
  API.patch(`/questions/${id}/vote`, { vote });

// =======================
// Answer APIs
// =======================

export const fetchAnswers = (questionId) =>
  API.get(`/answers/${questionId}`);

export const addAnswer = (questionId, answerData) =>
  API.post(`/answers/${questionId}`, answerData);

export const voteAnswer = (id, vote) =>
  API.patch(`/answers/${id}/vote`, { vote });

export const acceptAnswer = (id) =>
  API.patch(`/answers/${id}/accept`);

export const deleteAnswer = (id) =>
  API.delete(`/answers/${id}`);

// =======================
// Job APIs
// =======================

export const fetchJobs = () =>
  API.get("/jobs");

export const fetchJobById = (id) =>
  API.get(`/jobs/${id}`);

export const postJob = (jobData) =>
  API.post("/jobs", jobData);

export const deleteJob = (id) =>
  API.delete(`/jobs/${id}`);

// =======================
// Community Posts APIs
// =======================

// Get all posts
export const fetchPosts = (
  page = 1,
  limit = 10,
  sort = "-createdAt",
  hashtag = "",
  search = ""
) => {
  let url = `/posts?page=${page}&limit=${limit}&sort=${sort}`;

  if (hashtag) url += `&hashtag=${hashtag}`;
  if (search) url += `&search=${search}`;

  return API.get(url);
};

// Trending Posts
export const fetchTrendingPosts = () =>
  API.get("/posts/trending");

// Posts by Hashtag
export const fetchPostsByHashtag = (hashtag) =>
  API.get(`/posts/hashtag/${hashtag}`);

// Single Post
export const fetchPostById = (id) =>
  API.get(`/posts/${id}`);

// Personalized Feed
export const fetchUserFeed = (
  userId,
  page = 1,
  limit = 10
) =>
  API.get(
    `/posts/feed/${userId}?page=${page}&limit=${limit}`
  );

// Bookmarked Posts
export const fetchBookmarkedPosts = (userId) =>
  API.get(`/posts/bookmarks/${userId}`);

export const fetchReportedPosts = (adminId) =>
  API.get(`/posts/moderation/reported?adminId=${adminId}`);

// Create Post
export const createPost = (postData) =>
  API.post("/posts", postData);

// Create Post with Image
export const createPostWithImage = (formData) =>
  API.post("/posts/with-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Like / Unlike
export const likePost = (id, userId) =>
  API.patch(`/posts/${id}/like`, {
    userId,
  });

// Bookmark
export const bookmarkPost = (id, userId) =>
  API.patch(`/posts/${id}/bookmark`, {
    userId,
  });

// Comment / Reply
export const addComment = (id, commentData) =>
  API.patch(`/posts/${id}/comment`, commentData);

// Edit Post
export const editPost = (
  id,
  userId,
  postData
) =>
  API.patch(`/posts/${id}/edit`, {
    userId,
    ...postData,
  });

// Share
export const sharePost = (id) =>
  API.patch(`/posts/${id}/share`);

// Report
export const reportPost = (
  id,
  userId,
  reason
) =>
  API.patch(`/posts/${id}/report`, {
    userId,
    reason,
  });

// Delete Post
export const deletePost = (
  id,
  userId,
  isAdmin = false
) =>
  API.delete(`/posts/${id}`, {
    data: {
      userId,
      isAdmin,
    },
  });
  export const fetchNotifications = (userId) =>
  API.get(`/notifications/${userId}`);

export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}/read`);

export const deleteNotification = (id) =>
  API.delete(`/notifications/${id}`);
export const fetchUnreadCount = (userId) =>
  API.get(`/notifications/${userId}/unread-count`);
export const forgotPassword = (email) =>
  API.post("/forgot-password", { email });

export default API;
