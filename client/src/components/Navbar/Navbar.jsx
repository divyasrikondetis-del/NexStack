import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "../../api";
import API from "../../api";
import { useLanguage } from "../../contexts/LanguageContext";

function Navbar({ search, setSearch }) {
  const navigate = useNavigate();
  const { t, language, supportedLanguages, changeLanguage, confirmLanguageChange, pendingLanguage, verificationMessage, otpCode, setOtp } = useLanguage();

  // ✅ Get user from localStorage with state
  const [userState, setUserState] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "null");
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  console.log("📡 API Base URL:", API.defaults.baseURL);

  // ✅ Listen for custom userUpdated events
  useEffect(() => {
    const handleUserUpdate = (event) => {
      console.log('🔄 Navbar received userUpdated event:', event.detail);
      const updatedUser = JSON.parse(localStorage.getItem("user") || "null");
      console.log("🔄 Setting userState to:", updatedUser);
      setUserState(updatedUser);
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // ✅ Listen for localStorage changes (for cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        const updatedUser = JSON.parse(e.newValue || "null");
        console.log("🔄 Storage changed, updating user:", updatedUser?.name);
        setUserState(updatedUser);
        setForceUpdate(prev => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ✅ Polling fallback for same-tab updates
  useEffect(() => {
    const interval = setInterval(() => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      if (currentUser?._id !== userState?._id) {
        console.log("🔄 Polling detected user change:", currentUser?.name);
        setUserState(currentUser);
        setForceUpdate(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userState]);

  // ✅ Load unread count when user changes
  useEffect(() => {
    if (!userState) return;

    const loadUnreadCount = async () => {
      try {
        if (!userState?._id) {
          console.log("⚠️ No user ID found");
          return;
        }

        console.log("🔍 Fetching unread count for user:", userState._id);
        const { data } = await fetchUnreadCount(userState._id);
        console.log("📬 Unread count response:", data);

        const count = data?.count || data?.unread || 0;
        setUnreadCount(count);
      } catch (err) {
        console.error("❌ Error fetching unread count:", err);
        setUnreadCount(0);
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userState]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUserState(null);
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('userUpdated', { detail: { user: null } }));
    navigate("/");
  };

  const handleLanguageChange = async (event) => {
    const nextLanguage = event.target.value;
    try {
      const result = await changeLanguage(nextLanguage, userState);
      if (result.requiresVerification) {
        setOtp("");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Unable to switch language");
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    try {
      await confirmLanguageChange(otpCode);
    } catch (error) {
      alert(error.response?.data?.message || "Unable to verify language change");
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "18px 20px",
        minHeight: "90px",
        background: "#ffffff",
        borderBottom: "1px solid #ddd",
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          fontSize: "30px",
          fontWeight: "bold",
          color: "#f48024",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        Nex <span style={{ color: "#000" }}>Stack</span>
      </Link>

      {/* Navigation Links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {[
          { path: "/", label: t("home") },
          { path: "/questions", label: t("questions") },
          { path: "/community", label: t("community") },
          { path: "/tags", label: t("tags") },
          { path: "/users", label: t("users") },
          { path: "/jobs", label: t("jobs") },
          ...(userState?.role === "admin"
            ? [{ path: "/admin", label: t("admin") }]
            : []),
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: "none",
              color: "#333",
              fontWeight: "500",
              padding: "8px 12px",
              borderRadius: "4px",
              transition: "0.3s",
              fontSize: "15px",
              flexShrink: 0,
              lineHeight: 1.2,
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

      {/* Language Selector */}
      <select
        onChange={handleLanguageChange}
        value={language}
        style={{
          padding: "10px 10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "14px",
          flexShrink: 0,
          height: "44px",
        }}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      {pendingLanguage && (
        <form onSubmit={handleOtpSubmit} style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t("verifyEmail")}
            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #ccc", width: "110px" }}
          />
          <button type="submit" style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "#0A95FF", color: "#fff", cursor: "pointer" }}>
            {t("verifyOtp")}
          </button>
        </form>
      )}

      {verificationMessage && (
        <div style={{ fontSize: "0.8rem", color: "#333", flexShrink: 0 }}>
          {verificationMessage}
        </div>
      )}

      {/* Search Bar */}
      <input
        type="text"
        placeholder={t("searchQuestions")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "220px",
          minWidth: "160px",
          padding: "10px 12px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          outline: "none",
          fontSize: "15px",
          flexShrink: 1,
          height: "44px",
        }}
      />

      {/* User Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
          marginLeft: "auto",
        }}
      >
        {userState ? (
          <>
            {/* Avatar + Name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#0A95FF",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "15px",
                  flexShrink: 0,
                }}
              >
                {userState?.name ? userState.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span style={{ fontWeight: "600", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userState?.name || "User"}
              </span>
            </div>

            {/* My Profile Button */}
            <Link
              to={`/profile/${userState._id}`}
              style={{
                textDecoration: "none",
                background: "#0A95FF",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: "5px",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              👤 {t("myProfile")}
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
                fontSize: "18px",
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
                padding: "8px 13px",
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
              {t("logout")}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "7px 12px",
                border: "none",
                borderRadius: "5px",
                background: "#0A95FF",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#0077CC")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#0A95FF")
              }
            >
              {t("logIn")}
            </button>

            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: "7px 12px",
                border: "1px solid #0A95FF",
                borderRadius: "5px",
                background: "#fff",
                color: "#0A95FF",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "13px",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background = "#f0f8ff")
              }
              onMouseLeave={(e) =>
                (e.target.style.background = "#fff")
              }
            >
              {t("signUp")}
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;