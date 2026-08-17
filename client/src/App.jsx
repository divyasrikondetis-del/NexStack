import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar/Navbar";
import LeftSidebar from "./components/LeftSidebar/LeftSidebar";
import RightSidebar from "./components/RightSidebar/RightSidebar";

import Home from "./pages/Home";
import AskQuestion from "./pages/AskQuestion";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Auth from "./pages/Auth"; // ✅ Auth is in pages folder
import Tags from "./pages/Tags";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import User from "./pages/User";
import UserDetail from "./pages/UserDetail";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import TransferReputation from "./pages/TransferReputation";
import EditProfile from "./pages/EditProfile";

function App() {
  const [search, setSearch] = useState("");

  return (
    <Routes>
      {/* ✅ AUTH ROUTES - NO LAYOUT (Full page) */}
      <Route path="/login" element={<Auth defaultMode="login" />} />
      <Route path="/signup" element={<Auth defaultMode="signup" />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ✅ PROTECTED ROUTES - WITH LAYOUT */}
      <Route
        path="/*"
        element={
          <>
            <Navbar search={search} setSearch={setSearch} />
            <div
              style={{
                background: "#f8f9f9",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "1700px",
                  display: "grid",
                  gridTemplateColumns: "180px 1fr 260px",
                  gap: "20px",
                  padding: "20px",
                  alignItems: "start",
                }}
              >
                <LeftSidebar />

                <main
                  style={{
                    width: "101%",
                    minWidth: 0,
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Home search={search} setSearch={setSearch} />} />
                    <Route path="/questions" element={<Questions />} />
                    <Route path="/questions/:id" element={<QuestionDetail />} />
                    <Route path="/ask" element={<AskQuestion />} />
                    <Route path="/tags" element={<Tags />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/post-job" element={<PostJob />} />
                    <Route path="/users" element={<User />} />
                    <Route path="/users/:id" element={<UserDetail />} />
                    <Route path="/profile/:id" element={<Profile />} />
                    <Route path="/transfer-reputation/:receiverId" element={<TransferReputation />} />
                    <Route path="/community" element={<Community search={search} setSearch={setSearch} />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                  </Routes>
                </main>

                <RightSidebar />
              </div>
            </div>
          </>
        }
      />
    </Routes>
  );
}

export default App;