import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
});

// User APIs
export const fetchUsers = () => API.get("/users");
export const fetchUserById = (id) => API.get(`/users/${id}`);
export const createUser = (userData) => API.post("/users", userData);
export const loginUser = (credentials) => API.post("/users/login", credentials);
export const updateUser = (id, userData) => API.patch(`/users/${id}`, userData);

// Question APIs
export const fetchQuestions = () => API.get("/questions");
export const fetchQuestionById = (id) => API.get(`/questions/${id}`);
export const askQuestion = (questionData) => API.post("/questions", questionData);
export const deleteQuestion = (id) => API.delete(`/questions/${id}`);
export const voteQuestion = (id, vote) => API.patch(`/questions/${id}/vote`, { vote });
export const updateQuestion = (id, data) => API.patch(`/questions/${id}`, data);

// Answer APIs
export const fetchAnswers = (questionId) => API.get(`/answers/${questionId}`);
export const addAnswer = (questionId, answerData) => API.post(`/answers/${questionId}`, answerData);
export const voteAnswer = (id, vote) => API.patch(`/answers/${id}/vote`, { vote });
export const acceptAnswer = (id) => API.patch(`/answers/${id}/accept`);
export const deleteAnswer = (id) => API.delete(`/answers/${id}`);

// Job APIs
export const fetchJobs = () => API.get("/jobs");
export const fetchJobById = (id) => API.get(`/jobs/${id}`);
export const postJob = (jobData) => API.post("/jobs", jobData);
export const deleteJob = (id) => API.delete(`/jobs/${id}`);