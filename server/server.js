const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Load env ONLY in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const userRoutes = require("./routes/users");
const questionRoutes = require("./routes/questions");
const answerRoutes = require("./routes/answers");
const jobRoutes = require("./routes/jobs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/questions", questionRoutes);
app.use("/answers", answerRoutes);
app.use("/jobs", jobRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Stack Overflow API is running...");
});

// MongoDB connection (IMPORTANT FIX HERE)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in environment variables");
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error:", err);
  });

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});