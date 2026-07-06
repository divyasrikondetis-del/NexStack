import { Link, useNavigate } from "react-router-dom";

function Navbar({ search, setSearch }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

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

      {/* Search */}
      <input
        type="text"
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "320px",
          padding: "10px",
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
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#0a95ff",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span style={{ fontWeight: "600" }}>
              {user.name}
            </span>

            <button
              onClick={handleLogout}
              style={{
                padding: "8px 15px",
                border: "none",
                borderRadius: "5px",
                background: "#d9534f",
                color: "white",
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
                padding: "8px 15px",
                border: "none",
                borderRadius: "5px",
                background: "#0a95ff",
                color: "white",
                cursor: "pointer",
              }}
            >
              Log in
            </button>

            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "8px 15px",
                border: "1px solid #0a95ff",
                borderRadius: "5px",
                background: "white",
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