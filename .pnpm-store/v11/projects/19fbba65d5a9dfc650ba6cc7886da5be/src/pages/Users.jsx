import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
          gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
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
              }}
            >
              <Link
                to={`/users/${user._id}`}
                style={{
                  textDecoration: "none",
                  color: "black",
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "#0a95ff",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "30px",
                    margin: "auto",
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <h3
                  style={{
                    textAlign: "center",
                    marginTop: "10px",
                  }}
                >
                  {user.name}
                </h3>

                <p
                  style={{
                    textAlign: "center",
                    color: "gray",
                  }}
                >
                  {user.email}
                </p>
              </Link>

              <hr />

              <p>
                <strong>Followers:</strong>{" "}
                {user.followers?.length || 0}
              </p>

              <p>
                <strong>Following:</strong>{" "}
                {user.following?.length || 0}
              </p>

              {!isMe && (
                <button
                  onClick={() =>
                    handleFollow(user._id)
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
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