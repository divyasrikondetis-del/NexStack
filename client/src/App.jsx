import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import Navbar from "./components/Navbar/Navbar";
import LeftSidebar from "./components/LeftSidebar/LeftSidebar";
import RightSidebar from "./components/RightSidebar/RightSidebar";

import Home from "./pages/Home";
import AskQuestion from "./pages/AskQuestion";
import Questions from "./pages/Questions";
import QuestionDetail from "./pages/QuestionDetail";
import Auth from "./pages/Auth";
import Tags from "./pages/Tags";
import Jobs from "./pages/Jobs";
import PostJob from "./pages/PostJob";
import User from "./pages/User";
import UserDetail from "./pages/UserDetail";

function App() {
  const [search, setSearch] = useState("");

  return (
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
          {/* Left Sidebar */}
          <LeftSidebar />

          {/* Main Content */}
          <main
            style={{
              width: "101%",
              minWidth: 0,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={<Home search={search} />}
              />

              <Route
                path="/questions"
                element={<Questions />}
              />

              <Route
                path="/questions/:id"
                element={<QuestionDetail />}
              />

              <Route
                path="/ask"
                element={<AskQuestion />}
              />

              <Route
                path="/tags"
                element={<Tags />}
              />

              <Route
                path="/jobs"
                element={<Jobs />}
              />

              <Route
                path="/post-job"
                element={<PostJob />}
              />

              <Route
                path="/users"
                element={<User />}
              />

              <Route
                path="/users/:id"
                element={<UserDetail />}
              />

              <Route
                path="/auth"
                element={<Auth />}
              />
            </Routes>
          </main>

          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </>
  );
}

export default App;