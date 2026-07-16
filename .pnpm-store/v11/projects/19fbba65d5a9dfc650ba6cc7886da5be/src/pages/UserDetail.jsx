import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchUserById, followUser } from "../api";

function UserDetail() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const { data } = await fetchUserById(id);
      setUser(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await followUser(
        currentUser._id,
        user._id
      );

      alert(
        data.following
          ? "Followed Successfully!"
          : "Unfollowed Successfully!"
      );

      loadUser();
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading user...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>User not found</h2>

        <Link to="/users">
          ← Back to Users
        </Link>
      </div>
    );
  }

  const isMe = currentUser?._id === user._id;

  const isFollowing =
    user.followers?.includes(currentUser?._id);

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "30px auto",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          padding: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "#0a95ff",
              color: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "35px",
              fontWeight: "bold",
            }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1>{user.name}</h1>

            <p>{user.email}</p>

            <p>
              Joined:{" "}
              {new Date(user.joinedOn).toLocaleDateString()}
            </p>

            <p>
              Followers: {user.followers?.length || 0}
            </p>

            <p>
              Following: {user.following?.length || 0}
            </p>

            {!isMe && (
              <button
                onClick={handleFollow}
                style={{
                  marginTop: "10px",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isFollowing
                    ? "#dc3545"
                    : "#0a95ff",
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
        </div>

        <hr style={{ margin: "30px 0" }} />

        <h3>About</h3>

        <p>
          {user.about || "No bio added yet."}
        </p>

        <h3>Top Tags</h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {user.tags?.length ? (
            user.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  background: "#e1ecf4",
                  color: "#39739d",
                  padding: "5px 12px",
                  borderRadius: "6px",
                }}
              >
                {tag}
              </span>
            ))
          ) : (
            <p>No tags yet.</p>
          )}
        </div>

        <Link to="/users">
          <button
            style={{
              marginTop: "30px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              background: "#0a95ff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ← Back to Users
          </button>
        </Link>
      </div>
    </div>
  );
}

export default UserDetail;