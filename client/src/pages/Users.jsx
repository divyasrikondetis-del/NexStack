import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsers, followUser } from "../api";

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
      const response = await fetchUsers();
      setUsers(response.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      const response = await followUser(currentUser._id, targetUserId);
      console.log("Follow response:", response.data);
      
      // Update the users list
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === targetUserId
            ? {
                ...user,
                followers: response.data.following
                  ? [...(user.followers || []), currentUser._id]
                  : (user.followers || []).filter(id => id !== currentUser._id)
              }
            : user
        )
      );
    } catch (err) {
      console.log("Follow error:", err);
    }
  };

  if (loading) {
    return <div style={{ padding: "30px" }}><h2>Loading Users...</h2></div>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Community Members</h1>
      <p>Total Users: {users.length}</p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))",
        gap: "20px",
        marginTop: "20px",
      }}>
        {users.map((user) => {
          const isMe = currentUser?._id === user._id;
          const isFollowing = user.followers?.includes(currentUser?._id);

          return (
            <div key={user._id} style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "20px",
              background: "#fff",
              textAlign: "center",
            }}>
              <div style={{
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
                cursor: "pointer",
              }}
              onClick={() => navigate(`/profile/${user._id}`)}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>

              <h3 style={{ cursor: "pointer", color: "#0A95FF" }}
                  onClick={() => navigate(`/profile/${user._id}`)}>
                {user.name}
              </h3>

              <p style={{ color: "gray" }}>{user.email}</p>

              <hr />

              <p><strong>⭐ Reputation:</strong> {user.reputation || 0}</p>
              <p><strong>Followers:</strong> {user.followers?.length || 0}</p>
              <p><strong>Following:</strong> {user.following?.length || 0}</p>

              <button
                onClick={() => navigate(`/profile/${user._id}`)}
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
                }}>
                👤 View Profile
              </button>

              {!isMe && (
                <button
                  onClick={() => handleFollow(user._id)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "10px",
                    background: isFollowing ? "#dc3545" : "#0a95ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}>
                  {isFollowing ? "Unfollow" : "Follow"}
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