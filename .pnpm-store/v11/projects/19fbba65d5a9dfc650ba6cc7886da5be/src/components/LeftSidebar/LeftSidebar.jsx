import { Link, useLocation } from "react-router-dom";

function LeftSidebar() {
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const links = [
    { path: "/", label: "🏠 Home" },
    { path: "/questions", label: "❓ Questions" },
    { path: "/community", label: "🌐 Community" },
    { path: "/tags", label: "🏷️ Tags" },
    { path: "/users", label: "👤 Users" },
    { path: "/jobs", label: "💼 Jobs" },
  ];

  return (
    <aside
      style={{
        width: "180px", // reduced from 180px
        background: "#fff",
        border: "1px solid #e3e6e8",
        borderRadius: "10px",
        padding: "14px",
        height: "fit-content",
        position: "sticky",
        top: "80px",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "14px",
          color: "#3b4045",
          fontSize: "15px",
          fontWeight: "600",
        }}
      >
        Navigation
      </h3>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {links.map((link) => {
          const active = location.pathname === link.path;

          return (
            <li key={link.path} style={{ marginBottom: "6px" }}>
              <Link
                to={link.path}
                style={{
                  display: "block",
                  padding: "9px 10px",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "17px",
                  fontWeight: active ? "600" : "500",
                  color: active ? "#0a95ff" : "#3b4045",
                  background: active ? "#e3f2fd" : "transparent",
                  transition: "0.2s",
                }}
              >
                {link.label}
              </Link>
            </li>
          );
        })}

        {user?.role === "admin" && (
          <li style={{ marginTop: "10px" }}>
            <Link
              to="/admin"
              style={{
                display: "block",
                padding: "9px 10px",
                textDecoration: "none",
                borderRadius: "6px",
                fontSize: "17px",
                fontWeight:
                  location.pathname === "/admin" ? "600" : "500",
                color:
                  location.pathname === "/admin"
                    ? "#0a95ff"
                    : "#3b4045",
                background:
                  location.pathname === "/admin"
                    ? "#e3f2fd"
                    : "transparent",
              }}
            >
              🛡️ Admin
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}

export default LeftSidebar;