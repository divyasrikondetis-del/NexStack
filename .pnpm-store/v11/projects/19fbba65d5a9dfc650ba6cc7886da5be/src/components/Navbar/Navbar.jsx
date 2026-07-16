import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "../../api";

function Navbar({ search, setSearch }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
  if (!user) return;

  loadUnreadCount();

  const interval = setInterval(loadUnreadCount, 5000);

  return () => clearInterval(interval);
}, [user]);


  const loadUnreadCount = async () => {
  try {
    const { data } = await fetchUnreadCount(user._id);
    setUnreadCount(data.unread || 0);
  } catch (err) {
    console.log(err);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("user");
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

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
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
    ? [{ path: "/admin", label: "Admin Dashboard" }]
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
              transition: "background 0.3s",
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

      {/* Search */}
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
        }}
      />

      {/* User */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {user ? (
          <>
            {/* Avatar */}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#0a95ff",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span style={{ fontWeight: "600" }}>{user.name}</span>

            {/* Notification */}
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
              }}
            >
              🔔

              {unreadCount > 0 && (
                <span
                  style={{
                    color: "red",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "5px",
                background: "#d9534f",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "5px",
                background: "#0a95ff",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Log in
            </button>

            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "6px 14px",
                border: "1px solid #0a95ff",
                borderRadius: "5px",
                background: "#fff",
                color: "#0a95ff",
                cursor: "pointer",
              }}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;