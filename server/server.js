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
const subscriptionRoutes = require("./routes/subscriptions");
const notificationRoutes = require("./routes/notifications");
const reputationRoutes = require("./routes/reputation");
const translateRoutes = require("./routes/translate");
const User = require("./models/User");

const app = express();

// ========================
// CORS Middleware - FIXED
// ========================
// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Also use cors middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (for debugging)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// ========================
// API Routes (WITH /api prefix)
// ========================
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/forgot-password", forgotPasswordRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reputation", reputationRoutes);
app.use("/api/translate", translateRoutes);

// ========================
// Health Check Endpoint
// ========================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ========================
// Root API Endpoint
// ========================
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "NexStack API is running",
    endpoints: {
      auth: "/api/users",
      questions: "/api/questions",
      answers: "/api/answers",
      jobs: "/api/jobs",
      posts: "/api/posts",
      admin: "/api/admin",
      subscriptions: "/api/subscriptions",
      notifications: "/api/notifications",
      reputation: "/api/reputation",
      translate: "/api/translate",
      forgotPassword: "/api/forgot-password",
      health: "/api/health"
    },
    status: "online",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ========================
// Home Route
// ========================
app.get("/", (req, res) => {
  res.send("🚀 NexStack API is running...");
});

// ========================
// MongoDB Connection with Retry
// ========================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  console.log("📝 Please add MONGO_URI to your .env file");
}

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log("📡 MONGO_URI:", MONGO_URI ? "✅ Set" : "❌ Not set");
    
    await mongoose.connect(MONGO_URI);
    
    console.log("✅ MongoDB Connected");
    console.log("📊 Database:", mongoose.connection.db.databaseName);

    await User.updateMany(
      {
        $or: [
          { phoneNumber: "" },
          { phoneNumber: null },
          { phoneNumber: { $exists: true, $type: "string", $regex: /^\s*$/ } },
        ],
      },
      { $unset: { phoneNumber: "" } }
    );
    console.log("✅ Legacy blank phone numbers removed from the unique index scope");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("🔄 Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Start connection
connectDB();

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// ========================
// Error Handling Middleware
// ========================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  console.error("Stack:", err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.url} not found`
  });
});

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown - FIXED
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed');
    server.close(() => {
      console.log('📴 HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});