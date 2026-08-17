import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users");
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      await axios.post("http://localhost:5000/users/follow", {
        userId: currentUser._id,
        targetUserId,
      });

      loadUsers();
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>Loading Users...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Community Members</h1>

      <p>Total Users: {users.length}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {users.map((user) => {
          const isMe = currentUser?._id === user._id;

          const isFollowing =
            user.followers?.includes(currentUser?._id);

          return (
            <div
              key={user._id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                background: "#fff",
                textAlign: "center",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "#0a95ff",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "30px",
                  margin: "auto",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              <h3>{user.name}</h3>

              <p style={{ color: "gray" }}>
                {user.email}
              </p>

              <hr />

              <p>
                ⭐ Reputation:
                <strong> {user.reputation || 0}</strong>
              </p>

              <p>
                Followers: {user.followers?.length || 0}
              </p>

              <p>
                Following: {user.following?.length || 0}
              </p>

              {/* VIEW PROFILE BUTTON */}
              <button
                onClick={() =>
                  navigate(`/profile/${user._id}`)
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "10px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                👤 View Profile
              </button>

              {/* Follow Button */}
              {!isMe && (
                <button
                  onClick={() =>
                    handleFollow(user._id)
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "10px",
                    background: isFollowing
                      ? "#dc3545"
                      : "#0a95ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {isFollowing
                    ? "Unfollow"
                    : "Follow"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Users;