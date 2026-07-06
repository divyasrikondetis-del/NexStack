import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading users...</h2>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <h1>Users</h1>
      <p>Showing {users.length} users</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "20px" }}>
        {users.map((user) => (
          <Link
            key={user._id}
            to={`/users/${user._id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                width: "200px",
                textAlign: "center",
                transition: "box-shadow 0.2s",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#0a95ff",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  margin: "0 auto"
                }}
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <h3 style={{ margin: "10px 0 5px" }}>{user.name}</h3>
              <p style={{ margin: 0, color: "#6b6b6b", fontSize: "14px" }}>{user.email}</p>
              <p style={{ margin: "5px 0 0", color: "#6b6b6b", fontSize: "12px" }}>
                Joined: {new Date(user.joinedOn).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Users;