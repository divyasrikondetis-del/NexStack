const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Load .env in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ========================
// Import Routes
// ========================
const userRoutes = require("./routes/users");
const questionRoutes = require("./routes/questions");
const answerRoutes = require("./routes/answers");
const jobRoutes = require("./routes/jobs");
const forgotPasswordRoutes = require("./routes/forgotPassword");
const postRoutes = require("./routes/posts");
const adminRoutes = require("./routes/admin");

// ✅ Notifications Route
const notificationRoutes = require("./routes/notifications");

const app = express();

// ========================
// Middleware
// ========================
app.use(cors());
app.use(express.json());

// ========================
// API Routes
// ========================
app.use("/users", userRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/jobs", jobRoutes);
app.use("/forgot-password", forgotPasswordRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);

// ✅ Notification API
app.use("/notifications", notificationRoutes);

// ========================
// Home Route
// ========================
app.get("/", (req, res) => {
  res.send("🚀 NexStack API is running...");
});

// ========================
// MongoDB Connection
// ========================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
