import axios from "axios";

// TEMPORARY: Hardcoded URL for testing
const API_URL = "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📨 ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
    console.log(`📍 Full URL: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// =======================
// User APIs
// =======================
export const fetchUsers = () => API.get("/users");
export const fetchUserById = (id) => API.get(`/users/${id}`);
export const createUser = (userData) => API.post("/users", userData);
export const loginUser = (credentials) => API.post("/users/login", credentials);
export const updateUser = (id, userData) => API.patch(`/users/${id}`, userData);
export const followUser = (userId, targetUserId) =>
  API.patch("/users/follow", { userId, targetUserId });
export const setUserSuspension = (id, adminId, duration, reason = "") =>
  API.patch(`/users/${id}/suspension`, { adminId, duration, reason });

// =======================
// Question APIs
// =======================
export const fetchQuestions = () => API.get("/questions");
export const fetchQuestionById = (id) => API.get(`/questions/${id}`);
export const askQuestion = (questionData) => API.post("/questions", questionData);
export const updateQuestion = (id, data) => API.patch(`/questions/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/questions/${id}`);
export const voteQuestion = (id, vote) => API.patch(`/questions/${id}/vote`, { vote });

// =======================
// Answer APIs
// =======================
export const fetchAnswers = (questionId) => API.get(`/answers/${questionId}`);
export const addAnswer = (questionId, answerData) =>
  API.post(`/answers/${questionId}`, answerData);
export const voteAnswer = (id, vote) => API.patch(`/answers/${id}/vote`, { vote });
export const acceptAnswer = (id) => API.patch(`/answers/${id}/accept`);
export const deleteAnswer = (id) => API.delete(`/answers/${id}`);

// =======================
// Job APIs
// =======================
export const fetchJobs = () => API.get("/jobs");
export const fetchJobById = (id) => API.get(`/jobs/${id}`);
export const postJob = (jobData) => API.post("/jobs", jobData);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);

// =======================
// Post APIs
// =======================
export const fetchPosts = (page = 1, limit = 10, sort = "-createdAt", hashtag = "", search = "") => {
  let url = `/posts?page=${page}&limit=${limit}&sort=${sort}`;
  if (hashtag) url += `&hashtag=${hashtag}`;
  if (search) url += `&search=${search}`;
  return API.get(url);
};
export const fetchTrendingPosts = () => API.get("/posts/trending");
export const fetchPostsByHashtag = (hashtag) => API.get(`/posts/hashtag/${hashtag}`);
export const fetchPostById = (id) => API.get(`/posts/${id}`);
export const fetchUserFeed = (userId, page = 1, limit = 10) =>
  API.get(`/posts/feed/${userId}?page=${page}&limit=${limit}`);
export const fetchBookmarkedPosts = (userId) => API.get(`/posts/bookmarks/${userId}`);
export const fetchReportedPosts = (adminId) => API.get(`/posts/moderation/reported?adminId=${adminId}`);
export const createPost = (postData) => API.post("/posts", postData);
export const createPostWithImage = (formData) =>
  API.post("/posts/with-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const likePost = (id, userId) => API.patch(`/posts/${id}/like`, { userId });
export const bookmarkPost = (id, userId) => API.patch(`/posts/${id}/bookmark`, { userId });
export const addComment = (id, commentData) => API.patch(`/posts/${id}/comment`, commentData);
export const editPost = (id, userId, postData) =>
  API.patch(`/posts/${id}/edit`, { userId, ...postData });
export const sharePost = (id) => API.patch(`/posts/${id}/share`);
export const reportPost = (id, userId, reason) =>
  API.patch(`/posts/${id}/report`, { userId, reason });
export const deletePost = (id, userId, isAdmin = false) =>
  API.delete(`/posts/${id}`, { data: { userId, isAdmin } });

// =======================
// Notification APIs
// =======================
export const fetchNotifications = (userId) =>
  API.get(`/notifications/${userId}`);
export const markNotificationRead = (id) =>
  API.patch(`/notifications/${id}/read`);
export const deleteNotification = (id) =>
  API.delete(`/notifications/${id}`);
export const fetchUnreadCount = (userId) =>
  API.get(`/notifications/${userId}/unread-count`);

// =======================
// Reputation APIs
// =======================
export const fetchReputationHistory = (userId) =>
  API.get(`/reputation/${userId}`);
export const transferReputation = (data) =>
  API.post("/reputation/transfer", data);

// =======================
// Admin APIs
// =======================
export const fetchAdminDashboard = (adminId) =>
  API.get(`/admin/dashboard?adminId=${adminId}`);
export const fetchAdminReports = (adminId) =>
  API.get(`/admin/reports?adminId=${adminId}`);
export const reviewAdminReport = (postId, adminId, reportId, action) =>
  API.patch(`/admin/reports/${postId}`, { adminId, reportId, action });

// =======================
// Auth APIs
// =======================
export const forgotPassword = (email) => API.post("/forgot-password", { email });

export default API;