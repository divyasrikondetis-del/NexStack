import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/users/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2>Loading user...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ flex: 1, padding: "20px" }}>
        <h2 style={{ color: "red" }}>User not found</h2>
        <Link to="/users">← Back to Users</Link>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#0a95ff",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px"
          }}
        >
          {user.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <h1 style={{ margin: 0 }}>{user.name}</h1>
          <p style={{ margin: "5px 0", color: "#6b6b6b" }}>{user.email}</p>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>About</h3>
        <p>{user.about || "This user hasn't added a bio yet."}</p>
      </div>

      {user.tags && user.tags.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Top Tags</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {user.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: "3px 10px",
                  background: "#e1ecf4",
                  color: "#39739d",
                  borderRadius: "5px",
                  fontSize: "14px"
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", color: "#6b6b6b", fontSize: "14px" }}>
        <p>Joined: {new Date(user.joinedOn).toLocaleDateString()}</p>
        <p>Member since: {new Date(user.joinedOn).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
      </div>

      <Link to="/users">
        <button
          style={{
            marginTop: "20px",
            background: "#0a95ff",
            color: "white",
            border: "none",
            padding: "10px 15px",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ← Back to Users
        </button>
      </Link>
    </div>
  );
}

export default UserDetail;