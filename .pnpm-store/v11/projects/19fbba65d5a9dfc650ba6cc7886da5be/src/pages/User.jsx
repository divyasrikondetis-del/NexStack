import { useEffect, useState } from "react";
import {
  fetchUsers,
  fetchUserById,
  followUser,
} from "../api";

function User() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      setCurrentUser(user);
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      if (!currentUser) return;

      const { data } = await followUser(
        currentUser._id,
        targetUserId
      );

      alert(
        data.following
          ? "✅ Followed Successfully!"
          : "❌ Unfollowed Successfully!"
      );

      // Refresh current logged-in user
      const updatedUser = await fetchUserById(
        currentUser._id
      );

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser.data)
      );

      setCurrentUser(updatedUser.data);

      // Refresh users list
      loadUsers();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "700px",
        margin: "auto",
      }}
    >
      <h2>Community Members</h2>

      {users.map((user) => {
        const isMe =
          currentUser?._id === user._id;

        const isFollowing =
          user.followers?.some(
            (follower) =>
              (typeof follower === "object"
                ? follower._id
                : follower) === currentUser?._id
          ) || false;

        return (
          <div
            key={user._id}
            style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3>{user.name}</h3>

              <p>{user.email}</p>

              <p>
                <strong>Followers:</strong>{" "}
                {user.followers?.length || 0}
              </p>

              <p>
                <strong>Following:</strong>{" "}
                {user.following?.length || 0}
              </p>
            </div>

            {!isMe && (
              <button
                onClick={() =>
                  handleFollow(user._id)
                }
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: isFollowing
                    ? "#dc3545"
                    : "#0d6efd",
                  color: "#fff",
                  fontWeight: "bold",
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
  );
}

export default User;