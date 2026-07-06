import { Link, useLocation } from "react-router-dom";

function LeftSidebar() {
  const location = useLocation();

  const links = [
    { path: "/", label: "🏠 Home" },
    { path: "/questions", label: "❓ Questions" },
    { path: "/tags", label: "🏷️ Tags" },
    { path: "/users", label: "👤 Users" },
    { path: "/jobs", label: "💼 Jobs" },
  ];

  return (
    <aside
      style={{
        width: "160px",
        background: "#ffffff",
        border: "1px solid #e3e6e8",
        borderRadius: "12px",
        padding: "20px",
        height: "fit-content",
        position: "sticky",
        top: "90px",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "20px",
          color: "#3b4045",
          fontSize: "18px",
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
            <li key={link.path} style={{ marginBottom: "10px" }}>
              <Link
                to={link.path}
                style={{
                  display: "block",
                  padding: "12px 15px",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
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
      </ul>
    </aside>
  );
}

export default LeftSidebar;