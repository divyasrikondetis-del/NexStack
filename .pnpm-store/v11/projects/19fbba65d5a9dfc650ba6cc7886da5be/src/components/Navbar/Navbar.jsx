import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "../../api";
import API from "../../api";

function Navbar({ search, setSearch }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [unreadCount, setUnreadCount] = useState(0);

  // Debug: Check API base URL
  console.log("📡 API Base URL:", API.defaults.baseURL);

  useEffect(() => {
    if (!user) return;

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      if (!user?._id) {
        console.log("⚠️ No user ID found");
        return;
      }

      console.log("🔍 Fetching unread count for user:", user._id);
      const { data } = await fetchUnreadCount(user._id);
      console.log("📬 Unread count response:", data);

      // Handle both response formats
      const count = data?.count || data?.unread || 0;
      setUnreadCount(count);
    } catch (err) {
      console.error("❌ Error fetching unread count:", err);
      console.error("❌ Status:", err.response?.status);
      console.error("❌ Data:", err.response?.data);
      // Keep count at 0 on error
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 25px",
        background: "#ffffff",
        borderBottom: "1px solid #ddd",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          fontSize: "26px",
          fontWeight: "bold",
          color: "#f48024",
        }}
      >
        Nex <span style={{ color: "#000" }}>Stack</span>
      </Link>

      {/* Navigation Links */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { path: "/", label: "Home" },
          { path: "/questions", label: "Questions" },
          { path: "/community", label: "Community" },
          { path: "/tags", label: "Tags" },
          { path: "/users", label: "Users" },
          { path: "/jobs", label: "Jobs" },
          ...(user?.role === "admin"
            ? [{ path: "/admin", label: "Admin" }]
            : []),
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: "none",
              color: "#333",
              fontWeight: "500",
              padding: "5px 10px",
              borderRadius: "4px",
              transition: "0.3s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = "#f0f0f0")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "transparent")
            }
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "250px",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          outline: "none",
          fontSize: "14px",
        }}
      />

      {/* User Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {user ? (
          <>
            {/* Avatar + Name - NOW IN A VERTICAL COLUMN */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "#0A95FF",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Username */}
              <span style={{ fontWeight: "600", fontSize: "12px" }}>
                {user?.name || "User"}
              </span>
            </div>

            {/* My Profile Button */}
            <Link
              to={`/profile/${user._id}`}
              style={{
                textDecoration: "none",
                background: "#0A95FF",
                color: "#fff",
                padding: "7px 12px",
                borderRadius: "5px",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              👤 My Profile
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              title="Notifications"
              style={{
                textDecoration: "none",
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "20px",
                position: "relative",
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-10px",
                    background: "red",
                    color: "#fff",
                    borderRadius: "50%",
                    padding: "2px 6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                padding: "7px 14px",
                border: "none",
                borderRadius: "5px",
                background: "#d9534f",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#c9302c")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#d9534f")
              }
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "7px 14px",
                border: "none",
                borderRadius: "5px",
                background: "#0A95FF",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#0077CC")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#0A95FF")
              }
            >
              Log In
            </button>

            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "7px 14px",
                border: "1px solid #0A95FF",
                borderRadius: "5px",
                background: "#fff",
                color: "#0A95FF",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#f0f8ff")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#fff")
              }
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;